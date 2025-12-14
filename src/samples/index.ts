import { WebGPUHandle } from 'wgpu';

import { twoDimensions } from 'samples/twoDimensions';
import { GeometryData } from 'constants';

export interface Sample {
    init: (handle: WebGPUHandle, geometry: GeometryData) => void;
    draw: (handle: WebGPUHandle, geometry: GeometryData) => void;
}

export const samples = {
    twoDimensions,
}