export interface WebGPUHandle {
    // bootstrap data
    adapter: GPUAdapter;
    device: GPUDevice;
    canvas: HTMLCanvasElement;
    context: GPUCanvasContext;
    format: GPUTextureFormat;

    // sample-specific data
    renderPassDescriptors: Map<string, GPURenderPassDescriptor>;
    pipelines: Map<string, GPURenderPipeline>;
    bindGroups: GPUBindGroup[];
    vertexCount: number;
    uniformBuffer?: GPUBuffer;
    indexBuffer?: GPUBuffer;
}

export async function getHandle(canvasID = 'wgpu-canvas'): Promise<WebGPUHandle> {
    if (!navigator.gpu) throw Error('WebGPU is not supported');

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw Error('Failed to fetch WebGPU Adapter');

    const device = await adapter.requestDevice();
    device.lost.then((info) => {
        console.error(`WebGPU Device was lost: ${info.message}`);
        if (info.reason !== 'destroyed') {
            return getHandle();
        }
    });

    let canvas = document.getElementById(canvasID) as HTMLCanvasElement;
    if(!canvas || canvas.tagName !== 'canvas') {
        if(canvas) document.removeChild(canvas);
        canvas = document.createElement('canvas');
        canvas.className = canvasID;
        document.body.append(canvas);
    }

    const context = canvas.getContext('webgpu');
    if (!context) throw Error('Failed to get WebGPU canvas Context');

    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format });

    return {
        // bootstrap data
        adapter,
        device,
        canvas,
        context,
        format,

        // sample-specific
        renderPassDescriptors: new Map(),
        pipelines: new Map(),
        bindGroups: [],
        vertexCount: 0,
    }
}