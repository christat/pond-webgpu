import { Scene } from 'pond/entities';
import { Surface } from 'pond/renderer/surface';
import { Pipeline } from './pipeline';
import { createTextureFromImages } from 'webgpu-utils';

interface Resources {
    pipeline: Pipeline;
    renderPassDescriptor: GPURenderPassDescriptor;
    depthTexture: GPUTexture;
    depthTextureView: GPUTextureView;
}

export class Renderer {
    private adapter: GPUAdapter;
    private device: GPUDevice;
    private surface: Surface;

    private resources: Resources | undefined;

    private frame: number = 0;

    constructor(adapter: GPUAdapter, device: GPUDevice, surface: Surface) {
        this.adapter = adapter;
        this.device = device;
        this.surface = surface;
    }

    static async create(canvasID: string): Promise<Renderer> {
        if (!navigator.gpu) throw Error('WebGPU is not supported');

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw Error('Failed to fetch WebGPU Adapter');

        const device = await adapter.requestDevice({
            requiredFeatures: [
                'indirect-first-instance',
                'chromium-experimental-multi-draw-indirect' as any
            ],
        });
        device.lost.then((info) => {
            console.error(`WebGPU Device was lost: ${info.message}`);
            if (info.reason !== 'destroyed') {
                return this.create(canvasID);
            }
        });

        return new Renderer(adapter, device, new Surface(canvasID, device));
    }

    async init(scene: Scene) {
        // create pipeline
        const pipeline = await Pipeline.create(this.device, this.surface.format, scene);

        // fetch framebuffer
        const target = this.surface.context.getCurrentTexture();

        // create depth texture (and hook texture resize recreation)
        const depthTexture = this.device.createTexture({
            label: 'depth texture',
            size: [target.width, target.height],
            format: 'depth24plus',
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        });
        const depthTextureView = depthTexture.createView();
        this.surface.addCallback((width, height) => {
            const depthTexture = this.device.createTexture({
                size: [width, height],
                format: 'depth24plus',
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            });
            const resources = (this.resources as Resources);
            resources.depthTexture = depthTexture;
            resources.depthTextureView = depthTexture.createView();
        })
        
        // create renderpass descriptor
        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: 'renderpass descriptor',
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

        // store render resources
        this.resources = {
            pipeline,
            depthTexture,
            depthTextureView,
            renderPassDescriptor,
        }
    }

    render(scene: Scene) {
        const resources = this.resources!;

        // const encoder = this.device.createCommandEncoder();
        // const renderPass = encoder.beginRenderPass(resources.renderPassDescriptor);
        // const drawBuffer = this.device.createBuffer({
        //     size: 4 * 4,
        //     usage: GPUBufferUsage.INDIRECT | GPUBufferUsage.COPY_DST
        // });
        // const drawIndexedIndirectSize = 5;
        // const drawIndexedIndirectParameters = new Uint32Array(drawIndexedIndirectSize);
        // const drawIndexedIndirectParametersSigned = new Int32Array(drawIndexedIndirectParameters.buffer);
        // // drawIndexedIndirectParameters[0] = indexCount;
        // // drawIndexedIndirectParameters[1] = instanceCount;
        // // drawIndexedIndirectParameters[2] = firstIndex;
        // // drawIndexedIndirectParametersSigned[3] = baseVertex; // NB! Signed
        // // drawIndexedIndirectParameters[4] = firstInstance;
        // this.device.queue.writeBuffer(drawBuffer, 0, drawIndexedIndirectParameters.buffer);

        // //renderPass.drawIndexedIndirect()
        // encoder.finish();

        ++this.frame;
    }
}