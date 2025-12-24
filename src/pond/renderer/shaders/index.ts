import * as wgu from 'webgpu-utils';

import cull from 'pond/renderer/shaders/src/cull.wgsl';
import draw from 'pond/renderer/shaders/src/draw.wgsl';

export const shaders: Record<string, GPUShaderModuleDescriptor> = {
    cull: { label: 'cull', code: cull },
    draw: { label: 'draw', code: draw },
}

export function getArrayStructuredView(def: wgu.VariableDefinition, length: number): { view: wgu.StructuredView, size: number } {
    const { size } = wgu.getSizeAndAlignmentOfUnsizedArrayElement(def);
    return { view: wgu.makeStructuredView(def, new ArrayBuffer(size * length)), size };
}