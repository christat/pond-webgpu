import { WebGPUHandle } from 'wgpu';

import { GeometryData } from 'constants';
import { twoDimensions } from 'samples/twoDimensions';
import { threeDimensions } from 'samples/threeDimensions';

export interface Sample {
    init: (handle: WebGPUHandle, geometry: GeometryData) => void;
    draw: (handle: WebGPUHandle, geometry: GeometryData) => void;
}

export const samples = {
    twoDimensions,
    threeDimensions,
}