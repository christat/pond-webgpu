export type SurfaceResizeCallback = (width: number, height: number) => void;

export interface ResizeLifecycle {
    onResizeStart(): void;
    onResizeEnd(): void;
}

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
    }

    init = (device: GPUDevice, resizeLifecycle: ResizeLifecycle) => {
        new ResizeObserver(([canvasEntry, ..._]) => {
            resizeLifecycle.onResizeStart();
            const { target, contentBoxSize } = canvasEntry;
            const { inlineSize: width, blockSize: height } = contentBoxSize[0];
            const canvas = (target as HTMLCanvasElement);
            canvas.width = Math.max(1, Math.min(width, device.limits.maxTextureDimension2D));
            canvas.height = Math.max(1, Math.min(height, device.limits.maxTextureDimension2D));
            this.resizeCallbacks.forEach(callback => callback(canvas.width, canvas.height));
            resizeLifecycle.onResizeEnd();
        }).observe(this.canvas);
    }

    addCallback = (callback: SurfaceResizeCallback) => {
        this.resizeCallbacks.push(callback);
    }

    removeCallback = (callback: SurfaceResizeCallback) => {
        const idx = this.resizeCallbacks.indexOf(callback);
        if (idx != -1) {
            this.resizeCallbacks.splice(idx, 1);
        }
    }
}