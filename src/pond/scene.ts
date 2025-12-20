import { StringHash32 } from "pond/math/hash";

export interface ResourceID {
    id: StringHash32;
}

export interface Mesh extends ResourceID {
    vertexCount: number;
    vertices: Float32Array<ArrayBuffer>;
    indices?: Uint32Array<ArrayBuffer>;
    colors?: Uint8Array<ArrayBuffer>;
    uvs?: Float32Array<ArrayBuffer>;
}

export interface Material extends ResourceID {
    diffuse: string;
}

export class Scene {
    meshes: Map<StringHash32, Mesh>;
    materials: Map<StringHash32, Material>;

    constructor(
        meshes: Iterable<readonly [StringHash32, Mesh]> = [],
        materials: Iterable<readonly [StringHash32, Material]> = []
    ) {
        this.meshes = new Map(meshes);
        this.materials = new Map(materials);
    }
}