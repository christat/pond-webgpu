import * as wgu from 'webgpu-utils';

import { Mesh, Scene } from 'pond/entities';
import { BoundingSphere, StringHash32 } from 'pond/math';
import { shaders } from 'pond/renderer/shaders';
import { ResizeLifecycle, Surface } from 'pond/renderer/surface';
import { utils } from 'pond/renderer/utils';

const indirectFirstInstanceFeature = 'indirect-first-instance';
const multiDrawIndirectFeature = 'chromium-experimental-multi-draw-indirect';
interface GPURenderPassMultiDrawEncoder extends GPURenderPassEncoder {
    multiDrawIndirect(drawBuffer: GPUBuffer, offset: number, maxDrawCount: number): undefined;
    multiDrawIndexedIndirect(drawBuffer: GPUBuffer, offset: number, maxDrawCount: number): undefined;
}

export class Renderer {
    // bootstrap
    private adapter: GPUAdapter;
    private device: GPUDevice;
    private surface: Surface;

    // features
    private multiDrawIndirectEnabled: boolean;

    // shared resources
    globalUniformBuffer!: GPUBuffer;
    globalUniformView!: wgu.StructuredView;
    private depthTexture!: GPUTexture;
    private depthTextureView!: GPUTextureView;
    private depthTextureCallbackSet: boolean = false;

    // cull pass handles
    private cullModule!: GPUShaderModule;
    private cullModuleDefs!: wgu.ShaderDataDefinitions;
    private cullPipeline!: GPUComputePipeline;
    private cullPassDescriptor!: GPUComputePassDescriptor;
    private cullBindGroup!: GPUBindGroup;
    private drawIndexedIndirectCommandSize!: number;

    // cull pass bindings
    private modelBoundingSpheresBuffer!: GPUBuffer;
    private drawIndexedIndirectCommandsBuffer!: GPUBuffer;

    // render pass handles
    private renderModule!: GPUShaderModule;
    private renderModuleDefs!: wgu.ShaderDataDefinitions;
    private renderPipeline!: GPURenderPipeline;
    private renderPassDescriptor!: GPURenderPassDescriptor;
    private renderBindGroup!: GPUBindGroup;
    
    // render pass bindings
    private modelStorageBuffer!: GPUBuffer;
    private vertexBuffer!: GPUBuffer;
    private indexBuffer!: GPUBuffer;
    private diffuseArray!: GPUTexture;
    private textureSampler!: GPUSampler;
    

    // state
    private frame: number = 0;

    constructor(adapter: GPUAdapter, device: GPUDevice, surface: Surface) {
        this.adapter = adapter;
        this.device = device;
        this.surface = surface;
        this.multiDrawIndirectEnabled = adapter.features.has(multiDrawIndirectFeature);
    }

    static async create(canvasID: string): Promise<Renderer> {
        if (!navigator.gpu) throw Error('WebGPU is not supported');

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw Error('Failed to fetch WebGPU Adapter');

        const requiredFeatures = this.getRequiredFeatures(adapter);
        const device = await adapter.requestDevice({ requiredFeatures });
        device.lost.then((info) => {
            console.error(`WebGPU Device was lost: ${info.message}`);
            if (info.reason !== 'destroyed') {
                return this.create(canvasID);
            }
        });

        return new Renderer(adapter, device, new Surface(canvasID, device));
    }

    private static getRequiredFeatures(adapter: GPUAdapter): Array<GPUFeatureName> {
        const requiredFeatures: Array<GPUFeatureName> = [
            indirectFirstInstanceFeature
        ];

        // mandatory features
        if (!adapter.features.has(indirectFirstInstanceFeature)) throw Error(`Adapter feature '${indirectFirstInstanceFeature}' not supported!`);

        // optional features
        if (adapter.features.has(multiDrawIndirectFeature)) requiredFeatures.push(multiDrawIndirectFeature as any);
        return requiredFeatures;
    }

    async init(scene: Scene, resizeLifecycle: ResizeLifecycle) {
        const renderTarget = this.surface.context.getCurrentTexture();
        this.initCullPipeline();
        this.initRenderPipeline(renderTarget.format);
        this.initDepthTextureAndView(renderTarget.width, renderTarget.height);
        this.initDescriptors(renderTarget.createView());
        await this.initPipelineBindings(scene);
        this.initPipelineBindGroups();

        scene.camera.init(this.surface);
        this.surface.init(this.device, resizeLifecycle);
    }

    private initCullPipeline() {
        const { code } = shaders.cull;
        this.cullModule = this.device.createShaderModule({
            label: 'cull compute module',
            code
        });
        this.cullModuleDefs = wgu.makeShaderDataDefinitions(code);
        this.cullPipeline = this.device.createComputePipeline({
            label: 'cull compute pipeline',
            layout: 'auto',
            compute: { module: this.cullModule }
        });
    }

    private initRenderPipeline(format: GPUTextureFormat) {
        // create shader module
        const { code } = shaders.draw;
        this.renderModule = this.device.createShaderModule({ label: 'draw render module', code });
        this.renderModuleDefs = wgu.makeShaderDataDefinitions(code);

        // create pipeline
        this.renderPipeline = this.device.createRenderPipeline({
            label: 'render pipeline',
            layout: 'auto',
            vertex: { module: this.renderModule },
            fragment: { module: this.renderModule, targets: [{ format }] },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            }
        });
    }

    private initDepthTextureAndView = (width: number, height: number) => {
        if (this.depthTexture) this.depthTexture.destroy();
        this.depthTexture = this.device.createTexture({
            label: 'depth texture',
            size: { width, height },
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.depthTextureView = this.depthTexture.createView();
        if (!this.depthTextureCallbackSet) {
            this.surface.addCallback(this.initDepthTextureAndView);
            this.depthTextureCallbackSet = true;
        }
    }

    private initDescriptors(view: GPUTextureView) {
        this.cullPassDescriptor = {
            label: 'cull pass descriptor'
        };

        this.renderPassDescriptor = {
            label: 'render pass descriptor',
            colorAttachments: [
                {
                    view,
                    clearValue: [0.3, 0.3, 0.3, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this.depthTextureView,
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            }
        };
    }

    private async initPipelineBindings(scene: Scene) {        
        this.setGlobalUniform(scene);

        const { vertexStorage } = this.renderModuleDefs.storages;

        interface MeshMetadata{
            indexCount: number,
	        firstIndex: number,
	        baseVertex: number,
            boundingSphere: BoundingSphere;
        }

        const meshMetadataByID: Map<StringHash32, MeshMetadata> = new Map();
        for(let i = 0; i < scene.meshes.length; ++i) {
            const mesh = scene.meshes[i];
            meshMetadataByID.set(mesh.id, { 
                indexCount: 3 * mesh.indices.length,
                firstIndex: 0,
                baseVertex: 0,
                boundingSphere: new BoundingSphere(mesh.vertices)
            });
        }

        // per-mesh buffers: vertexBuffer, indexBuffer; fill MeshMetadata
        {
            const { view: vertexBufferView } = utils.getArrayStructuredView(
                vertexStorage,
                scene.meshes.reduce((acc, { vertices }) => acc + vertices.length, 0)
            );

            let baseVertex = 0;
            let firstIndex = 0;
            for(let i = 0; i < scene.meshes.length; ++i) {
                const mesh = scene.meshes[i];

                for(let j = 0; j < mesh.vertices.length; ++j) {
                    // NB! Index into view by last vertex to avoid stomping previous mesh write
                    const { position, uv } = vertexBufferView.views[baseVertex + j] as Record<string, Float32Array>;
                    position.set(mesh.vertices[j]);
                    uv.set(mesh.uvs[j]);
                }

                const meshMetadata = meshMetadataByID.get(mesh.id)!;
                meshMetadata.baseVertex = baseVertex;
                meshMetadata.firstIndex = firstIndex;
                baseVertex += mesh.vertices.length;
                firstIndex += 3 * mesh.indices.length;
            }

            this.vertexBuffer = utils.createAndFillBuffer(this.device, 'vertex buffer', GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, vertexBufferView.arrayBuffer);
            
            const indexBufferData = new Uint32Array(
                scene.meshes.reduce((acc: number[], mesh: Mesh) => {
                    acc.push(...mesh.indices.flat());
                    return acc;
                }, [])
            );
            this.indexBuffer = utils.createAndFillBuffer(this.device, 'index buffer', GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST, indexBufferData.buffer);
        }
        
        // per-model buffers: modelBoundingSpheresBuffer, drawIndexedIndirectCommands, modelStorageBuffer
        {
            const materialIndexByID: Map<StringHash32, number> = new Map();
            for(let i = 0; i < scene.materials.length; ++i) {
                const material = scene.materials[i];
                materialIndexByID.set(material.id, i)
            }

            const { modelBoundingSphereStorage, drawIndexedIndirectCommandStorage } = this.cullModuleDefs.storages;
            const { modelStorage } = this.renderModuleDefs.storages;
            const { view: modelBoundingSphereStorageView } = utils.getArrayStructuredView(modelBoundingSphereStorage, scene.models.length);
            const { view: drawIndexedIndirectCommandStorageView, size: drawIndexedIndirectCommandSize } = utils.getArrayStructuredView(drawIndexedIndirectCommandStorage, scene.models.length);
            this.drawIndexedIndirectCommandSize = drawIndexedIndirectCommandSize;
            const { view: modelStorageView } = utils.getArrayStructuredView(modelStorage, scene.models.length);
            
            for(let i = 0; i < scene.models.length; ++i) {
                const model = scene.models[i];
                const meshMetadata = meshMetadataByID.get(model.meshID)!;

                const { center, radius } = modelBoundingSphereStorageView.views[i] as Record<string, wgu.StructuredView>;
                center.set(meshMetadata.boundingSphere.center);
                radius.set([meshMetadata.boundingSphere.radius]);

                const { indexCount, instanceCount, firstIndex, baseVertex, firstInstance } = drawIndexedIndirectCommandStorageView.views[i] as Record<string, wgu.StructuredView>;
                indexCount.set([meshMetadata.indexCount]);
                instanceCount.set([0]);
                firstIndex.set([meshMetadata.firstIndex]);
                baseVertex.set([meshMetadata.baseVertex]);
                firstInstance.set([i]); // NB! Hack: use instanceIndex as "drawIndex"; we sacrifice instancing in exchange for per-model buffer indexing.

                const { transform, diffuseIndex } = modelStorageView.views[i] as Record<string, wgu.StructuredView>;
                transform.set(model.transform);
                diffuseIndex.set([materialIndexByID.get(model.materialID)!]);
            }

            this.modelBoundingSpheresBuffer = utils.createAndFillBuffer(this.device, 'model bounding spheres buffer', GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, modelBoundingSphereStorageView.arrayBuffer);
            this.drawIndexedIndirectCommandsBuffer = utils.createAndFillBuffer(this.device, 'draw indexed indirect command buffer', GPUBufferUsage.STORAGE | GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST, drawIndexedIndirectCommandStorageView.arrayBuffer);
            this.modelStorageBuffer = utils.createAndFillBuffer(this.device, 'model storage buffer', GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, modelStorageView.arrayBuffer);
        }
        
        // per-material buffers and samplers
        this.textureSampler = this.device.createSampler();
        this.diffuseArray = await wgu.createTextureFromImages(this.device, scene.materials.map(({ diffuse }) => diffuse));
    }

    private initPipelineBindGroups() {
        this.cullBindGroup = this.device.createBindGroup({
            label: 'cull bind group',
            layout: this.cullPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.globalUniformBuffer } },
                { binding: 1, resource: { buffer: this.modelBoundingSpheresBuffer } },
                { binding: 2, resource: { buffer: this.drawIndexedIndirectCommandsBuffer } },
            ]
        });

        this.renderBindGroup = this.device.createBindGroup({
            label: 'render bind group',
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.globalUniformBuffer } },
                { binding: 1, resource: { buffer: this.modelStorageBuffer } },
                { binding: 2, resource: { buffer: this.vertexBuffer } },
                { binding: 3, resource: this.diffuseArray.createView() },
                { binding: 4, resource: this.textureSampler },
            ],
        });
    }

    private setGlobalUniform(scene: Scene) {
        if(!this.globalUniformBuffer) {
            this.globalUniformView = wgu.makeStructuredView(this.cullModuleDefs.uniforms.globalUniform);
            this.globalUniformBuffer = this.device.createBuffer({
                label: 'global uniform buffer',
                size: this.globalUniformView.arrayBuffer.byteLength,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
        }
        this.globalUniformView.set({
           viewProjection: scene.camera.viewProjection(),
           modelCount: scene.models.length 
        });
        this.device.queue.writeBuffer(this.globalUniformBuffer, 0, this.globalUniformView.arrayBuffer);
    }

    async render(scene: Scene) {
        this.initDescriptors(this.surface.context.getCurrentTexture().createView());
        this.setGlobalUniform(scene);

        // cull pass
        {
            const encoder = this.device.createCommandEncoder({ label: 'cull pass encoder' });
            const cullPass = encoder.beginComputePass(this.cullPassDescriptor);
            cullPass.setPipeline(this.cullPipeline);
            cullPass.setBindGroup(0, this.cullBindGroup);
            cullPass.dispatchWorkgroups(scene.models.length);
            cullPass.end();
            this.device.queue.submit([encoder.finish()]);
        }

        // render pass
        {
            const encoder = this.device.createCommandEncoder({ label: 'render pass encoder' });
            const renderPass = encoder.beginRenderPass(this.renderPassDescriptor);
            renderPass.setPipeline(this.renderPipeline);
            renderPass.setBindGroup(0, this.renderBindGroup);
            renderPass.setIndexBuffer(this.indexBuffer, 'uint32');
            
            if (this.multiDrawIndirectEnabled) {
                (renderPass as GPURenderPassMultiDrawEncoder)
                    .multiDrawIndexedIndirect(this.drawIndexedIndirectCommandsBuffer, 0, scene.models.length);
            } else {
                for (let i = 0; i < scene.models.length; ++i) {
                    renderPass.drawIndexedIndirect(this.drawIndexedIndirectCommandsBuffer, i * this.drawIndexedIndirectCommandSize);
                }
            }
            renderPass.end();
            this.device.queue.submit([encoder.finish()]);
        }

        ++this.frame;
    }

    getFrame() {
        return this.frame;
    }
}
