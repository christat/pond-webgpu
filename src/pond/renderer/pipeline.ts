import { StringHash32, m } from "pond/math";
import { Material, Mesh, Scene } from "pond/entities";
import { shaders } from "pond/renderer/shaders";
import { createTextureFromImages, getSizeAndAlignmentOfUnsizedArrayElement, makeShaderDataDefinitions, makeStructuredView, ShaderDataDefinitions } from "webgpu-utils";

interface ElementInfo {
    unalignedSize: number;
    align: number;
    size: number;
};

export class Pipeline {
    id: StringHash32;

    module: GPUShaderModule;
    pipeline: GPURenderPipeline;
    bindGroup: GPUBindGroup;

    // TODO determine ownership model
    cameraUniformBuffer: GPUBuffer;
    renderObjectStorageBuffer: GPUBuffer;
    instanceStorageBuffer: GPUBuffer;
    vertexStorageBuffer: GPUBuffer;
    sampler: GPUSampler;
    textureBuffer: GPUTexture;

    constructor(
        id: StringHash32,
        module: GPUShaderModule,
        pipeline: GPURenderPipeline,
        bindGroup: GPUBindGroup,
        cameraUniformBuffer: GPUBuffer,
        renderObjectStorageBuffer: GPUBuffer,
        instanceStorageBuffer: GPUBuffer,
        vertexStorageBuffer: GPUBuffer,
        sampler: GPUSampler,
        textureBuffer: GPUTexture
    ) {
        this.id = id;
        this.module = module;
        this.pipeline = pipeline;
        this.bindGroup = bindGroup;
        this.cameraUniformBuffer = cameraUniformBuffer;
        this.renderObjectStorageBuffer = renderObjectStorageBuffer;
        this.instanceStorageBuffer = instanceStorageBuffer;
        this.vertexStorageBuffer = vertexStorageBuffer;
        this.sampler = sampler;
        this.textureBuffer = textureBuffer;
    }

    static async create(
        device: GPUDevice,
        format: GPUTextureFormat,
        scene: Scene
    ) {
        // create shader module
        const { label, code } = shaders.standard;
        const module = device.createShaderModule({ label, code });
        const id = m.stringHash32(label);

        // create pipeline
        const pipeline = device.createRenderPipeline({
            label: `${label} - pipeline`,
            layout: 'auto',
            vertex: { module },
            fragment: { module, targets: [{ format }] },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            }
        });

        // allocate resource buffers
        const shaderDefs = makeShaderDataDefinitions(code);
        
        const cameraUniformBuffer = device.createBuffer({
            size: shaderDefs.uniforms.camera.size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_SRC
        });
        device.queue.writeBuffer(cameraUniformBuffer, 0, scene.camera.viewProjection().buffer);

        // const instanceStorageBuffer = this.fillInstanceStorageBuffer(device, shaderDefs, scene);
        // const renderObjectStorageBuffer = this.fillRenderObjectStorageBuffer(device, shaderDefs, scene);
        // const vertexStorageBuffer = this.fillVertexStorageBuffer(device, shaderDefs, scene);
        // const indexStorageBuffer = this.fillIndexBuffer(device, shaderDefs, scene);

        const sampler = device.createSampler();
        const images = Object.values(scene.materials).map(({ diffuse }: Material) => diffuse);
        const textureBuffer = await createTextureFromImages(device, images, { mips: true });

        const meshSourceBuffer = new Uint32Array(3 * scene.meshes.length);
        const meshSourceSignedBuffer = new Int32Array(meshSourceBuffer.buffer);
        const indexSourceBuffer = new Uint32Array(scene.meshes.reduce((acc, mesh) => acc + mesh.indices.length, 0));
        const vertexSourceBuffer = new Float32Array(scene.meshes.reduce((acc, mesh) => acc + (mesh.vertices.length * 3), 0));
        let meshOffset = 0; 
        let indexOffset = 0;
        let vertexOffset = 0;
        for(let i = 0; i < scene.meshes.length; ++i) {
            const mesh = scene.meshes[i];
            
            // copy mesh metadata
            meshSourceBuffer.set([mesh.indices.length], meshOffset); // indexCount
            meshSourceBuffer.set([indexOffset], meshOffset + 1); // firstIndex
            meshSourceSignedBuffer.set([vertexOffset], meshOffset + 2); // baseVertex
            meshOffset += 3;

            // copy mesh index buffer
            indexSourceBuffer.set(mesh.indices, indexOffset);
            indexOffset += mesh.indices.length;

            // copy mesh vertex buffer
            vertexSourceBuffer.set(mesh.vertices, vertexOffset);
            vertexOffset += mesh.vertices.length;
        }

        const materialMapping: Map<StringHash32, number> = new Map();
        for(let i = 0; i < scene.materials.length; ++i) {
            const material = scene.materials[i];
            materialMapping.set(material.id, i)
        }

        const renderObjectSize = 4 * 4 + 1;
        for(let i = 0; i < scene.renderObjects.length; ++i) {

        }

        const textureArray = await createTextureFromImages(device, scene.materials.map(material => material.diffuse));

        // const bindGroup = device.createBindGroup({
        //     layout: pipeline.getBindGroupLayout(0),
        //     entries: [
        //         { binding: 0, resource: { buffer: cameraUniformBuffer } },
        //         { binding: 1, resource: { buffer: renderObjectStorageBuffer } },
        //         { binding: 2, resource: { buffer: instanceStorageBuffer } },
        //         { binding: 3, resource: { buffer: vertexStorageBuffer } },
        //         { binding: 4, resource: { buffer: indexStorageBuffer } },
        //         { binding: 5, resource: sampler },
        //         { binding: 6, resource: textureBuffer.createView() },
        //     ]
        // });

       return new Pipeline(
            id,
            module,
            pipeline,
            bindGroup,
            cameraUniformBuffer,
            renderObjectStorageBuffer,
            instanceStorageBuffer,
            vertexStorageBuffer,
            sampler,
            textureBuffer
       );
    }

    static fillInstanceStorageBuffer(device: GPUDevice, shaderDefs: ShaderDataDefinitions, scene: Scene): GPUBuffer {
        interface InstanceStorage {
            model: Float32Array<ArrayBuffer>,
            renderObjectIndex: Uint32Array<ArrayBuffer>,
        }
        
        // create buffer
        const instanceStorageDef = getSizeAndAlignmentOfUnsizedArrayElement(shaderDefs.storages.instanceStorage) as ElementInfo;
        const instanceStorageView = makeStructuredView(shaderDefs.storages.instanceStorage, new ArrayBuffer(scene.renderObjects.length * instanceStorageDef.size));
        const instanceStorageBuffer = device.createBuffer({
            size: instanceStorageDef.size * scene.renderObjects.length,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        // fill data
        for(let i = 0; i < instanceStorageView.views.length; ++i) {
            const { model, renderObjectIndex } = instanceStorageView.views[i] as InstanceStorage;

            model.set(scene.renderObjects[i].transform);
            renderObjectIndex.set([0]); // TODO
        }
        device.queue.writeBuffer(instanceStorageBuffer, 0, instanceStorageView.arrayBuffer);
        
        return instanceStorageBuffer;
    }

    static fillRenderObjectStorageBuffer(device: GPUDevice, shaderDefs: ShaderDataDefinitions, scene: Scene): GPUBuffer {
        interface RenderObjectStorage {
            vertexOffset: Uint32Array<ArrayBuffer>,
            textureIndex: Uint32Array<ArrayBuffer>,
        }

        // create buffer
        const renderObjectStorageDef = getSizeAndAlignmentOfUnsizedArrayElement(shaderDefs.storages.renderObjectStorage) as ElementInfo;
        const renderObjectStorageView = makeStructuredView(shaderDefs.storages.renderObjectStorage, new ArrayBuffer(scene.renderObjects.length * renderObjectStorageDef.size));
        const renderObjectStorageBuffer = device.createBuffer({
            size: renderObjectStorageDef.size * scene.meshes.size,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        // fill data
        //const materialsArray = Object.values(scene.materials);
        for(let i = 0; i < renderObjectStorageView.views.length; ++i) {
            const { vertexOffset, textureIndex } = renderObjectStorageView.views[i] as RenderObjectStorage;

            const renderObject = scene.renderObjects[i];
            vertexOffset.set([0]); // TODO
            textureIndex.set([0]); // TODO
        }
        device.queue.writeBuffer(renderObjectStorageBuffer, 0, renderObjectStorageView.arrayBuffer);
        
        return renderObjectStorageBuffer;
    }

    static fillVertexStorageBuffer(device: GPUDevice, shaderDefs: ShaderDataDefinitions, scene: Scene): GPUBuffer {
        interface VertexStorage {
            position: Float32Array<ArrayBuffer>,
            uv: Float32Array<ArrayBuffer>,
        }

        // create buffer
        const vertexCount = Object.values(scene.meshes).reduce((acc, mesh: Mesh) => acc += (mesh.vertices.length / 3), 0);
        const vertexStorageDef = getSizeAndAlignmentOfUnsizedArrayElement(shaderDefs.storages.vertexStorage) as ElementInfo;
        const vertexStorageView = makeStructuredView(shaderDefs.storages.vertexStorage, new ArrayBuffer(vertexCount * vertexStorageDef.size));
        const vertexStorageBuffer = device.createBuffer({
            size: vertexStorageDef.size * vertexCount,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
        });

        // fill data
        const { vertexArray, uvArray } = Object.values(scene.meshes).reduce((acc, mesh: Mesh) => {
            acc.vertexArray.set(mesh.vertices, acc.vertexOffset);
            acc.uvArray.set(mesh.uvs, acc.uvOffset)
            acc.vertexOffset += mesh.vertices.length;
            acc.indexOffset += mesh.uvs.length;
            return acc;
        }, { 
            vertexArray: new Float32Array(vertexCount * 3),
            indexArray: new Float32Array(vertexCount * 2),
            vertexOffset: 0,
            indexOffset: 0
        });
        
        for(let i = 0; i < vertexStorageView.views.length; ++i) {
            const { position, uv } = vertexStorageView.views[i] as VertexStorage;


            position.set(vertexArray.slice(), positionOffset);
            uv.set(uvArray.slice(), uvOffset);
        }

        device.queue.writeBuffer(vertexStorageBuffer, 0, vertexStorageView.arrayBuffer);
        
        return vertexStorageBuffer
    }
}