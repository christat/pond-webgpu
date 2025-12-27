import { StringHash32 } from "pond/math";
import { Mat4 } from "wgpu-matrix";

export class Model {
    transform: Mat4;
    meshID: StringHash32;
    materialID: StringHash32;

    constructor(transform: Mat4, meshID: StringHash32, materialID: StringHash32) {
        this.transform = transform;
        this.meshID = meshID;
        this.materialID = materialID;
    }
}