import { m } from "math";
import { mat4 } from "wgpu-matrix";

export interface GeometryData {
    vertexCount: number;
    vertexDimension: number;
    vertices: Float32Array<ArrayBuffer>;
    indices?: Uint32Array<ArrayBuffer>;
    colors?: Uint8Array<ArrayBuffer>;
    uvs?: Float32Array<ArrayBuffer>;
    transform: Float32Array<ArrayBufferLike>;
}

const transform = mat4.identity();
mat4.scale(transform, [0.5, 0.5, 0.5], transform);
mat4.translate(transform, [0.5, -0.5, 0], transform);
mat4.rotateZ(transform, m.radians(90), transform);

export const geometry = {
    triangle: (): GeometryData => ({
        vertexCount: 3,
        vertexDimension: 3,
        vertices: new Float32Array([
            -0.5,  -0.5,  0.0,  // left
             0.5,  -0.5,  0.0,  // right
             0.0,   0.5,  0.0,  // top
        ]),
        colors: new Uint8Array([
               0,  255,    0,  255,    // green
               0,    0,  255,  255,   // blue
             255,    0,    0,  255,   // red
        ]),
        uvs: new Float32Array([
             0.0,   0.0,    // left
             1.0,   0.0,    // right
             0.5,   1.0,    // top
        ]),
        transform,
    }),
    quad: (): GeometryData => {
        const vertices = new Float32Array([
             0.5,  0.5, 0.0,  // top right
             0.5, -0.5, 0.0,  // bottom right
            -0.5, -0.5, 0.0,  // bottom left
            -0.5,  0.5, 0.0,  // top left 
        ]);
        const indices = new Uint32Array([
            0, 1, 3,    // first triangle
            1, 2, 3,    // second triangle
        ]);
        const colors = new Uint8Array([
              0,  255,    0,  255,    // green
              0,    0,  255,  255,    // blue
            255,    0,    0,  255,    // red
            127,  127,  127,  255,    // grey
        ])
        const uvs = new Float32Array([
            1.0,    1.0,    // top right
            1.0,    0.0,    // bottom right
            0.0,    0.0,    // bottom left
            0.0,    1.0,    // top left
        ])
        
        return {
            vertexCount: indices.length,
            vertexDimension: 3,
            vertices,
            indices,
            colors,
            uvs,
            transform,
        };
    }
}