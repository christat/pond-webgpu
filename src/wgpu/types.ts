// Re-export of webgpu-utils' getSizeAndAlignmentOfUnsizedArrayElement return type; for some reason it's wrong in the acutal typings.
export type ElementInfo = {
    unalignedSize: number,
    align: number,
    size: number,
};