import standard from 'pond/renderer/shaders/src/standard.wgsl';

export interface ShaderSource {
    label: string;
    code: string;
}

export const shaders: Record<string, ShaderSource> = {
    standard: { label: 'standard', code: standard },
}