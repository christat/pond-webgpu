<<<<<<< Updated upstream
import { m } from "pond/math";
import { Mesh } from "pond/entities";

export const mesh = {
    triangle: (): Mesh => {
        return {
            id: m.stringHash32('triangle'),
            vertices: new Float32Array([
                -0.5,  -0.5,  0.0,
                0.5,  -0.5,  0.0,
                0.0,   0.5,  0.0,
            ]),
            indices: new Uint32Array([0, 1, 2]),
            uvs: new Float32Array([
                0.0,   0.0,
                1.0,   0.0,
                0.5,   1.0,
            ]),
        }
    },
    quad: (): Mesh => ({
        id: m.stringHash32('quad'),
        vertices: new Float32Array([
            0.5,  0.5, 0.0,
            0.5, -0.5, 0.0,
            -0.5, -0.5, 0.0,
            -0.5,  0.5, 0.0,
        ]),
        indices: new Uint32Array([
            0, 1, 3,
            1, 2, 3,
        ]),
        uvs: new Float32Array([
            1.0,    1.0,
            1.0,    0.0,
            0.0,    0.0,
            0.0,    1.0,
        ])
    }),
    cube: (): Mesh => {
        return {
            id: m.stringHash32('cube'),
            vertices: new Float32Array([
                 0.5,  0.5, -0.5,
                -0.5, -0.5, -0.5,
                 0.5,  0.5, -0.5,
                 0.5, -0.5, -0.5,
                -0.5, -0.5,  0.5,
                 0.5, -0.5,  0.5,
                -0.5,  0.5,  0.5,
                 0.5,  0.5,  0.5,
                -0.5,  0.5, -0.5,
                 0.5,  0.5, -0.5,
                -0.5,  0.5, -0.5,
                -0.5,  0.5,  0.5,
                 0.5,  0.5, -0.5,
                 0.5,  0.5,  0.5,
            ]),
            indices: new Uint32Array([
                0,   2,   1,
                1,   2,   3,
                4,   5,   6,
                5,   7,   6,
                6,   7,   8,
                7,   9,   8, 
                1,   3,   4,
                3,   5,   4,
                1,  11,  10,
                1,   4,  11,
                3,  12,   5,
                5,  12,  13   
            ]),
            uvs: new Float32Array([
                 0.0,  0.66,
                0.25,  0.66,
                 0.0,  0.33,
                0.25,  0.33,
                 0.5,  0.66,
                 0.5,  0.33,
                0.75,  0.66,
                0.75,  0.33,
                 1.0,  0.66,
                 1.0,  0.33,
                0.25,     1,
                 0.5,     1,
                0.25,     0,
                 0.5,     0,
            ])
=======
import { hash } from "pond/math/hash";
import { Mesh } from "pond/scene";

export const VERTEX_DIMENSION = 3;

export const mesh = {
    triangle: (transform: Float32Array<ArrayBufferLike>): Mesh => {
        return {
            vertexCount: 3,
            vertices: new Float32Array([
                -0.5,  -0.5,  0.0,  // left
                0.5,  -0.5,  0.0,  // right
                0.0,   0.5,  0.0,  // top
            ]),
            indices: new Uint32Array([0, 1, 2]),
            uvs: new Float32Array([
                0.0,   0.0,    // left
                1.0,   0.0,    // right
                0.5,   1.0,    // top
            ]),
            transform,
        }
    },
    quad: (transform: Float32Array<ArrayBufferLike>): Mesh => {
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
        const uvs = new Float32Array([
            1.0,    1.0,    // top right
            1.0,    0.0,    // bottom right
            0.0,    0.0,    // bottom left
            0.0,    1.0,    // top left
        ]);
        
        return {
            id: hash.stringHash32('quad'),
            vertices,
            indices,
            uvs
        };
    },
    cube: (): Mesh => {
        const vertices = new Float32Array([
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5,  0.5, -0.5,
            -0.5,  0.5, -0.5,
            -0.5, -0.5, -0.5,
            -0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5, -0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5,  0.5, -0.5,
            -0.5, -0.5, -0.5,
            -0.5, -0.5, -0.5,
            -0.5, -0.5,  0.5,
            -0.5,  0.5,  0.5,
             0.5,  0.5,  0.5,
             0.5,  0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5, -0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
            -0.5, -0.5,  0.5,
            -0.5, -0.5, -0.5,
            -0.5,  0.5, -0.5,
             0.5,  0.5, -0.5,
             0.5,  0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5,  0.5,  0.5,
            -0.5,  0.5, -0.5,
        ]);
        const uvs = new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            1.0, 0.0,
            0.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
            1.0, 0.0,
            0.0, 0.0,
            0.0, 1.0,
        ]);
        
        return {
            id: hash.stringHash32('cube'),
            vertexCount: vertices.length / VERTEX_DIMENSION,
            vertices,
            uvs,
>>>>>>> Stashed changes
        };
    }
}