import { StringHash32 } from "pond/math";
import { Mat4 } from "wgpu-matrix";

export interface RenderObject {
    transform: Mat4;
    meshID: StringHash32;
    materialID: StringHash32;
}