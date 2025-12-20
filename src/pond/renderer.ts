import { hash, StringHash32 } from 'pond/math/hash';
import { ResourceType, WgslReflect } from 'wgsl_reflect';
import { shaders, ShaderSource } from 'pond/shaders';
import { Scene } from 'pond/scene';

export type SurfaceResizeCallback = (width: number, height: number) => void;

export class Surface {
    context: GPUCanvasContext;
    format: GPUTextureFormat;

    private canvas: HTMLCanvasElement;
    private resizeCallbacks: SurfaceResizeCallback[];

    constructor(canvasID: string, device: GPUDevice) {
        let canvas = document.getElementById(canvasID) as HTMLCanvasElement;
        if(!canvas || canvas.tagName !== 'canvas') {
            if (canvas) document.removeChild(canvas);
            canvas = document.createElement('canvas');
            canvas.className = canvasID;
            document.body.append(canvas);
        }

        const context = canvas.getContext('webgpu');
        if (!context) throw Error('Failed to get WebGPU canvas Context');

        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format });

        this.context = context;
        this.format = format;
        this.canvas = canvas;
        this.resizeCallbacks = [];

        new ResizeObserver(([canvasEntry, ..._]) => {
            const { target, contentBoxSize } = canvasEntry;
            const { inlineSize: width, blockSize: height } = contentBoxSize[0];
            (target as HTMLCanvasElement).width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
            (target as HTMLCanvasElement).height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));

            this.resizeCallbacks.forEach(callback => callback(this.canvas.width, this.canvas.height));
            //handle.camera.updateAspectRatio(canvas.width / canvas.height);
            
            
        }).observe(this.canvas);
    }

    addCallback(callback: SurfaceResizeCallback) {
        this.resizeCallbacks.push(callback);
    }

    removeCallback(callback: SurfaceResizeCallback) {
        const idx = this.resizeCallbacks.indexOf(callback);
        if (idx != -1) {
            this.resizeCallbacks.splice(idx, 1);
        }
    }
}

interface ElementInfo {
    unalignedSize: number;
    align: number;
    size: number;
};
export class ShaderModule {
    id: StringHash32;
    module: GPUShaderModule;
    refl: WgslReflect;

    constructor(
        device: GPUDevice,
        resources: Resources,
        format: GPUTextureFormat,
        source: ShaderSource
    ) {
        const { label, code } = source;

        this.id = hash.stringHash32(label);
        this.module = device.createShaderModule({ label, code });
        this.refl = new WgslReflect(code);
        console.log(this.refl);

        // create pipeline
        const pipeline = device.createRenderPipeline({
            label: `${label} - pipeline`,
            layout: 'auto',
            vertex: { module: this.module },
            fragment: { module: this.module, targets: [{ format }] },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: 'depth24plus',
            }
        });
        resources.pipelines.set(this.id, pipeline);

        const bindGroups = this.refl.getBindGroups().map((bindGroupRefl, index) => {
            let entries: GPUBindGroupEntry[] = [];
            for(const resourceRefl of bindGroupRefl) {
                const { resourceType, group, binding, size } = resourceRefl;
                const key = hash.stringHash32(`${label}_${group}_${binding}`);
                switch(resourceType) {
                case ResourceType.Uniform: {
                    const buffer = device.createBuffer({
                        label: `${label} - uniform buffer (group ${group}, binding ${binding})`,
                        size,
                        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_SRC
                    });
                    entries.push({ binding, resource: { buffer } });
                    resources.buffers.set(key, buffer);
                    break;
                }
                case ResourceType.Storage: {
                    const buffer = device.createBuffer({
                        label: `${label} - storage buffer (group ${group}, binding ${binding})`,
                        size,
                        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
                    });
                    entries.push({ binding, resource: { buffer }});
                    resources.buffers.set(key, buffer);
                    break;
                }
                case ResourceType.Texture: {
                    //const texture = device.createTexture({})
                    break;
                }
                case ResourceType.Sampler: {
                    //const sampler = device.createSampler();

                    break;
                }
                default: throw Error(`${label} resourceType ${resourceRefl.resourceType} not implemented!`);
                }
            }

            return device.createBindGroup({
                label: `${label} - bindGroup ${index}`,
                layout: pipeline.getBindGroupLayout(index),
                entries
                // entries: [
                //     { binding: 0, resource: { buffer: transformUniformBuffer }},
                //     { binding: 1, resource: { buffer: vertexStorageBuffer }},
                //     { binding: 2, resource: sampler },
                //     { binding: 3, resource: textureBuffer.createView() },
                // ],
            });
        });
        resources.bindGroups.set(this.id, bindGroups);
    }
}

export class Resources {
    shaders: Map<StringHash32, ShaderModule>;
    descriptors: Map<StringHash32, GPURenderPassDescriptor>;
    pipelines: Map<StringHash32, GPURenderPipeline>;
    bindGroups: Map<StringHash32, GPUBindGroup[]>;
    buffers: Map<StringHash32, GPUBuffer>;
    // Investigate: do we rely on GC to link buffer->view to deletion (no deletion API found at least?)
    textureViews: Map<StringHash32, GPUTextureView>;
    samplers: Map<StringHash32, GPUSampler>;

    constructor() {
        this.shaders = new Map();
        this.descriptors = new Map();
        this.pipelines = new Map();
        this.bindGroups = new Map();
        this.buffers = new Map();
        this.textureViews = new Map();
        this.samplers = new Map();
    }
}

export class Renderer {
    private adapter: GPUAdapter;
    private device: GPUDevice;

    private surface: Surface;
    private resources: Resources;

    private frame: number = 0;

    constructor(adapter: GPUAdapter, device: GPUDevice, surface: Surface, resources: Resources) {
        this.adapter = adapter;
        this.device = device;
        this.surface = surface;
        this.resources = resources;
    }

    static async create(canvasID: string): Promise<Renderer> {
        if (!navigator.gpu) throw Error('WebGPU is not supported');

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw Error('Failed to fetch WebGPU Adapter');

        const device = await adapter.requestDevice();
        device.lost.then((info) => {
            console.error(`WebGPU Device was lost: ${info.message}`);
            if (info.reason !== 'destroyed') {
                return this.create(canvasID);
            }
        });

        return new Renderer(adapter, device, new Surface(canvasID, device), new Resources());
    }

    init(scene: Scene) {
        const { label, code } = shaders.standard;
        const key = hash.stringHash32(label);
        
        // create shader module
        const shaderModule = new ShaderModule(this.device, this.resources, this.surface.format, shaders.standard);
        this.resources.shaders.set(key, shaderModule);
        //const standardShaderModule = this.resources.shaders.get(key)!;

        // fetch framebuffer
        const target = this.surface.context.getCurrentTexture();

        // create depth texture
        const depthTexture = this.device.createTexture({
            label: `${label} depth texture`,
            size: [target.width, target.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        const depthTextureView = depthTexture.createView();
        const depthKey = hash.stringHash32('depth');
        this.resources.textureViews.set(depthKey, depthTextureView);

        this.surface.addCallback((width, height) => {
            const depthTexture = this.device.createTexture({
                size: [width, height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            this.resources.textureViews.set(depthKey, depthTexture.createView());
        })
        
        // create renderpass descriptor
        {
            const descriptor: GPURenderPassDescriptor = {
                label: `${label} renderpass descriptor`,
                colorAttachments: [
                    {
                        view: target.createView(),
                        clearValue: [0.3, 0.3, 0.3, 1],
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
                depthStencilAttachment: {
                    view: depthTextureView,
                    depthClearValue: 1.0,
                    depthLoadOp: 'clear',
                    depthStoreOp: 'store',
                }
            };
            this.resources.descriptors.set(key, descriptor);
        }

        // create texture sampler
        this.resources.samplers.set(key, this.device.createSampler());

        // todo create buffers for shadermodule here, to be filled at render time
    }

    render(scene: Scene) {
        const { label } = shaders.standard;
        const key = hash.stringHash32(label);


        //const { vertexCount, vertexDimension, vertices, uvs, transform } = geometry;

        // fill transform uniform buffer
        // const transformUniformBuffer = this.device.createBuffer({
        //     label: 'transform uniform buffer',
        //     size: transform.byteLength,
        //     usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        // });
        // const projectedTransform = handle.camera.project(transform);
        // handle.device.queue.writeBuffer(transformUniformBuffer, 0, projectedTransform.buffer);
        // handle.buffers.set('uniform', transformUniformBuffer);

        // fetch vertex layout, fill CPU buffer
        // const verticesMetadata = getSizeAndAlignmentOfUnsizedArrayElement(shaderDefs.storages.vertices) as ElementInfo;
        // const verticesView = makeStructuredView(shaderDefs.storages.vertices, new ArrayBuffer(vertexCount * verticesMetadata.size));
        
        // const uvDimension = 2;
        // for(let i = 0; i < verticesView.views.length; ++i) {
        //     let { position, uv } = verticesView.views[i] as VertexData;

        //     const verticesOffset = i * vertexDimension;
        //     position.set(vertices.slice(verticesOffset, verticesOffset + vertexDimension));

        //     if (uvs) {
        //         const uvOffset = i * uvDimension;
        //         uv.set(uvs.slice(uvOffset, uvOffset + uvDimension));
        //     }
        // }

        // fill vertex storage buffer
        // const vertexStorageBuffer = handle.device.createBuffer({
        //     label: 'triangle sample vertex storage buffer',
        //     size: verticesView.arrayBuffer.byteLength,
        //     usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        // });
        // handle.device.queue.writeBuffer(vertexStorageBuffer, 0, verticesView.arrayBuffer);

        // fill index buffer
        // if(geometry.indices) {
        //     const indexBuffer = handle.device.createBuffer({
        //         label: 'triangle sample indices buffer',
        //         size: geometry.indices.length * 4,
        //         usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST
        //     });
        //     handle.device.queue.writeBuffer(indexBuffer, 0, geometry.indices);
        //     handle.buffers.set('index', indexBuffer);
        // } 

        // create texture sampler and fill texture buffer
        // const sampler = handle.device.createSampler();
        // const bitmap = await loadImageBitmap('assets/textures/wall.jpg');
        // const textureBuffer = createTextureFromSource(handle.device, bitmap);

        // set bindGroups
        // const bindGroup = this.device.createBindGroup({
        //     label: 'triangle sample bindGroup',
        //     layout: pipeline.getBindGroupLayout(0),
        //     entries: [
        //         { binding: 0, resource: { buffer: transformUniformBuffer }},
        //         { binding: 1, resource: { buffer: vertexStorageBuffer }},
        //         { binding: 2, resource: sampler },
        //         { binding: 3, resource: textureBuffer.createView() },
        //     ],
        // });
        // this.resources.bindGroups.push(bindGroup);

        ++this.frame;
    }
}