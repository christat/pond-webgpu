import { ResourceID } from "pond/entities/shared";

export interface Mesh extends ResourceID {
    // source data
    vertices: Float32Array<ArrayBuffer>;
    indices: Uint32Array<ArrayBuffer>;
    uvs: Float32Array<ArrayBuffer>;
    colors?: Uint8Array<ArrayBuffer>;    
}