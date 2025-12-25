import * as wgu from 'webgpu-utils';
import { Vec2, Vec3, Vec3n } from 'wgpu-matrix';

import { Scene } from 'pond/entities';
import { BoundingSphere, StringHash32 } from 'pond/math';
import { getArrayStructuredView, shaders } from 'pond/renderer/shaders';
import { ResizeLifecycle, Surface } from 'pond/renderer/surface';

const multiDrawIndirectFeature = 'chromium-experimental-multi-draw-indirect';
const indirectFirstInstanceFeature = 'indirect-first-instance';
interface GPURenderPassEncoderMultiDrawIndirect extends GPURenderPassEncoder {
    multiDrawIndirect(drawBuffer: GPUBuffer, offset: number, maxDrawCount: number): undefined;
}

export class Renderer {
    // bootstrap
    private adapter: GPUAdapter;
    private device: GPUDevice;
    private surface: Surface;

    // features
    private multiDrawIndirectEnabled: boolean;
    private indirectFirstInstanceEnabled: boolean;

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
        this.indirectFirstInstanceEnabled = adapter.features.has(indirectFirstInstanceFeature);
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
        const requiredFeatures: Array<GPUFeatureName> = [];
        if (adapter.features.has(multiDrawIndirectFeature)) requiredFeatures.push(multiDrawIndirectFeature as any);
        if (adapter.features.has(indirectFirstInstanceFeature)) requiredFeatures.push(indirectFirstInstanceFeature);
        console.log('required features: ', requiredFeatures);
        return requiredFeatures;
    }

    async init(scene: Scene, resizeLifecycle: ResizeLifecycle) {
        this.surface.init(this.device, resizeLifecycle);
        const renderTarget = this.surface.context.getCurrentTexture();
        this.initCullPipeline();
        this.initRenderPipeline(renderTarget.format);
        this.initDepthTextureAndView(renderTarget.width, renderTarget.height);
        this.initDescriptors(renderTarget.createView());
        await this.initPipelineBindings(scene);
        this.initPipelineBindGroups();
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
        const { label, code } = shaders.draw;
        this.renderModule = this.device.createShaderModule({ label, code });
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
            const { view: vertexStorageView } = getArrayStructuredView(
                vertexStorage,
                scene.meshes.reduce((acc, { vertices }) => acc + vertices.length, 0)
            );
            const position: number[] = [];
            const uv: number[] = [];
            const index: number[] = [];

            for(let i = 0; i < scene.meshes.length; ++i) {
                const mesh = scene.meshes[i];

                for(let j = 0; j < mesh.vertices.length; ++j) {
                    const { } = vertexStorageView.views;
                    position.push(...mesh.vertices.reduce((acc: number[], vertex: Vec3) => {
                        acc.push(...Array.from(vertex));
                        return acc;
                    }, []));

                    uv.push(...mesh.uvs.reduce((acc: number[], uv: Vec2) => {
                        acc.push(...Array.from(uv));
                        return acc;
                    }, []));
                }

                

                index.push(...mesh.indices.reduce((acc: number[], index: Vec3n) => {
                    acc.push(...index);
                    return acc;
                }, []));

                const meshMetadata = meshMetadataByID.get(mesh.id)!;
                meshMetadata.baseVertex = position.length;
                meshMetadata.firstIndex = index.length;
            }
            //vertexStorageView.set({ position, uv });
            this.vertexBuffer = this.device.createBuffer({
                label: 'vertex buffer',
                size: vertexStorageView.arrayBuffer.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });
            this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexStorageView.arrayBuffer);

            const indexBufferView = new Uint32Array(index);
            this.indexBuffer = this.device.createBuffer({
                label: 'index buffer',
                size: indexBufferView.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
            });
            this.device.queue.writeBuffer(this.indexBuffer, 0, indexBufferView.buffer);
        }
        
        // per-model buffers: modelBoundingSpheresBuffer, drawIndexedIndirectCommands
        {
            const materialIndexByID: Map<StringHash32, number> = new Map();
            for(let i = 0; i < scene.materials.length; ++i) {
                const material = scene.materials[i];
                materialIndexByID.set(material.id, i)
            }

            const { modelBoundingSphereStorage, drawIndexedIndirectCommandStorage } = this.cullModuleDefs.storages;

            const { view: modelBoundingSphereStorageView, size } = getArrayStructuredView(modelBoundingSphereStorage, scene.models.length);
            this.drawIndexedIndirectCommandSize = size;

            const center: number[] = [];
            const radius: number[] = [];

            const { view: drawIndexedIndirectCommandStorageView } = getArrayStructuredView(drawIndexedIndirectCommandStorage, scene.models.length);
            const indexCount: number[] = [];
            const instanceCount: number[] = [];
            const firstIndex: number[] = [];
            const baseVertex: number[] = [];
            const firstInstance: number[] = [];
            
            for(let i = 0; i < scene.models.length; ++i) {
                const model = scene.models[i];
                const meshMetadata = meshMetadataByID.get(model.meshID)!;

                center.push(...new Array(...meshMetadata.boundingSphere.center));
                radius.push(meshMetadata.boundingSphere.radius);

                indexCount.push(meshMetadata.indexCount);
                instanceCount.push(0);
                firstIndex.push(meshMetadata.firstIndex);
                baseVertex.push(meshMetadata.baseVertex);
                firstInstance.push(0);
            }
            //modelBoundingSphereStorageView.set({ center, radius });
            this.modelBoundingSpheresBuffer = this.device.createBuffer({
                label: 'model bounding spheres buffer',
                size: modelBoundingSphereStorageView.arrayBuffer.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
            });
            this.device.queue.writeBuffer(this.modelBoundingSpheresBuffer, 0, modelBoundingSphereStorageView.arrayBuffer);
            
            //drawIndexedIndirectCommandStorageView.set({ indexCount, instanceCount, firstIndex, baseVertex, firstInstance });
            this.drawIndexedIndirectCommandsBuffer = this.device.createBuffer({
                label: 'draw indexed indirect command buffer',
                size: drawIndexedIndirectCommandStorageView.arrayBuffer.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST
            });
            this.device.queue.writeBuffer(this.drawIndexedIndirectCommandsBuffer, 0, drawIndexedIndirectCommandStorageView.arrayBuffer);
        }
        
        // per-material buffers and samplers
        this.textureSampler = this.device.createSampler();
        this.diffuseArray = await wgu.createTextureFromImages(this.device, scene.materials.map(({ diffuse }) => diffuse));
    }

    private initPipelineBindGroups() {
        this.cullBindGroup = this.device.createBindGroup({
            layout: this.cullPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.globalUniformBuffer },
                { binding: 1, resource: this.modelBoundingSpheresBuffer },
                { binding: 2, resource: this.drawIndexedIndirectCommandsBuffer },
            ]
        });

        this.renderBindGroup = this.device.createBindGroup({
            layout: this.renderPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: this.globalUniformBuffer },
                { binding: 1, resource: this.vertexBuffer },
                { binding: 2, resource: this.diffuseArray },
                { binding: 3, resource: this.textureSampler },
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
           viewProjection: scene.camera.viewProjection().buffer,
           modelCount: scene.models.length 
        });
        this.device.queue.writeBuffer(this.globalUniformBuffer, 0, this.globalUniformView.arrayBuffer);
    }

    async render(scene: Scene) {
        this.setGlobalUniform(scene);

        // cull pass
        let encoder = this.device.createCommandEncoder();
        {
            const cullPass = encoder.beginComputePass(this.cullPassDescriptor);
            cullPass.setPipeline(this.cullPipeline);
            cullPass.setBindGroup(0, this.cullBindGroup);
            cullPass.dispatchWorkgroups(scene.models.length);
            cullPass.end();
        }
        this.device.queue.submit([encoder.finish()]);

        // render pass
        encoder = this.device.createCommandEncoder();
        {
            const renderPass = encoder.beginRenderPass(this.renderPassDescriptor);
            renderPass.setPipeline(this.renderPipeline);
            renderPass.setBindGroup(0, this.renderBindGroup);
            renderPass.setIndexBuffer(this.indexBuffer, 'uint32');
            if (this.multiDrawIndirectEnabled) {
                (renderPass as GPURenderPassEncoderMultiDrawIndirect)
                    .multiDrawIndirect(this.drawIndexedIndirectCommandsBuffer, 0, scene.models.length);
            } else {
                for (let i = 0; i < scene.models.length; ++i) {
                    renderPass.drawIndexedIndirect(this.drawIndexedIndirectCommandsBuffer, i * this.drawIndexedIndirectCommandSize);
                }
            }
            renderPass.end();
        }
        this.device.queue.submit([encoder.finish()]);

        ++this.frame;
    }
}

