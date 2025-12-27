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

export @component class WorldTransformComponent {
    @field.float64.vector(16)
    declare position: [
        number, number, number, number,
        number, number, number, number,
        number, number, number, number,
        number, number, number, number,
    ] & {asTypedArray(): Float32Array};
}

export @component class RenderObjectCompopnent {
    @field.uint32 declare meshID: number;
    @field.uint32 declare materialID: number;
}