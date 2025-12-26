import * as wgu from 'webgpu-utils';

function getArrayStructuredView(def: wgu.VariableDefinition, length: number): { view: wgu.StructuredView, size: number } {
    const { size } = wgu.getSizeAndAlignmentOfUnsizedArrayElement(def);
    return { view: wgu.makeStructuredView(def, new ArrayBuffer(size * length)), size };
}

function createAndFillBuffer(device: GPUDevice, label: string, usage: GPUBufferUsageFlags, data: ArrayBuffer): GPUBuffer {
    const buffer = device.createBuffer({ label, size: data.byteLength, usage });
    device.queue.writeBuffer(buffer, 0, data);
    return buffer;
}

export const utils = {
    getArrayStructuredView,
    createAndFillBuffer
};
