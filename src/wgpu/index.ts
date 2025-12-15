import { GeometryData } from 'constants';
import { getHandle, WebGPUHandle } from 'wgpu/handle';

export * from 'wgpu/handle'; 

export const wgpu = {
    getHandle,
    renderLoop: async (
        handle: WebGPUHandle,
        geometry: GeometryData,
        init: (handle: WebGPUHandle, geometry: GeometryData) => void,
        draw: (handle: WebGPUHandle, geometry: GeometryData) => void,
    ) => {
        let raf: number | undefined;

        await init(handle, geometry);

        const rafDraw = () => {
            draw(handle, geometry);
            raf = requestAnimationFrame(rafDraw);
        };

        rafDraw();

        // restart loop on window resize
        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const canvas = entry.target as HTMLCanvasElement;
                const width = entry.contentBoxSize[0].inlineSize;
                const height = entry.contentBoxSize[0].blockSize;
                canvas.width = Math.max(1, Math.min(width, handle.device.limits.maxTextureDimension2D));
                canvas.height = Math.max(1, Math.min(height, handle.device.limits.maxTextureDimension2D));
                if(raf) cancelAnimationFrame(raf);
                rafDraw();
            }
        });
        observer.observe(handle.canvas);
    }
}