import standard from 'pond/shaders/src/standard.wgsl';


export interface ShaderSource {
    label: string;
    code: string;
}

export const shaders: Record<string, ShaderSource> = {
    standard: { label: 'standard', code: standard },
}