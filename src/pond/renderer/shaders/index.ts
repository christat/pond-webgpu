
import cull from 'pond/renderer/shaders/src/cull.wgsl';
import draw from 'pond/renderer/shaders/src/draw.wgsl';

export const shaders: Record<string, GPUShaderModuleDescriptor> = {
    cull: { label: 'cull', code: cull },
    draw: { label: 'draw', code: draw },
}