import { component, field, Type } from "@lastolivegames/becsy";
import { Mat4 } from "wgpu-matrix";

export const Mat4Type = Type.vector(
    Type.float32,
    [
        'x0', 'y0', 'z0', 'w0',
        'x1', 'y1', 'z1', 'w1',
        'x2', 'y2', 'z2', 'w2',
        'x3', 'y3', 'z3', 'w3',
    ],
    Float32Array
);

export @component class WorldTransform {
    @field(Mat4Type) declare transform: Mat4;
}

export @component class Renderable {
    @field.uint32 declare meshID: number;
    @field.uint32 declare materialID: number;
}