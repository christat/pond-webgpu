import { m } from "pond/math";
import { Mesh } from "pond/entities";
import { vec2, vec3, vec3n } from "wgpu-matrix";

export const mesh = {
    triangle: () => new Mesh(
        m.stringHash32('triangle'),
        // vertices
        [
            vec3.create(-0.5,  -0.5,  0.0),
            vec3.create( 0.5,  -0.5,  0.0),
            vec3.create( 0.0,   0.5,  0.0),
        ],
        // indices
        [
            vec3n.create(0, 1, 2),
        ],
        // uvs
        [
            vec2.create(0.0,   0.0),
            vec2.create(1.0,   0.0),
            vec2.create(0.5,   1.0),
        ],
    ),
    quad: () => new Mesh(
        m.stringHash32('quad'),
        // vertices
        [
            vec3.create( 0.5,  0.5, 0.0),
            vec3.create( 0.5, -0.5, 0.0),
            vec3.create(-0.5, -0.5, 0.0),
            vec3.create(-0.5,  0.5, 0.0),
        ],
        // indices
        [
            vec3n.create(0, 1, 3),
            vec3n.create(1, 2, 3),
        ],
        // uvs
        [
            vec2.create(1.0, 1.0),
            vec2.create(1.0, 0.0),
            vec2.create(0.0, 0.0),
            vec2.create(0.0, 1.0),
        ]
    ),
    cube: () => new Mesh(
        m.stringHash32('cube'),
        // vertices
        [
            vec3.create(0.5,  0.5, -0.5),
            vec3.create(-0.5, -0.5, -0.5),
            vec3.create(0.5,  0.5, -0.5),
            vec3.create(0.5, -0.5, -0.5),
            vec3.create(-0.5, -0.5,  0.5),
            vec3.create(0.5, -0.5,  0.5),
            vec3.create(-0.5,  0.5,  0.5),
            vec3.create(0.5,  0.5,  0.5),
            vec3.create(-0.5,  0.5, -0.5),
            vec3.create(0.5,  0.5, -0.5),
            vec3.create(-0.5,  0.5, -0.5),
            vec3.create(-0.5,  0.5,  0.5),
            vec3.create(0.5,  0.5, -0.5),
            vec3.create(0.5,  0.5,  0.5),
        ],
        // indices
        [
            vec3n.create(0,   2,   1),
            vec3n.create(1,   2,   3),
            vec3n.create(4,   5,   6),
            vec3n.create(5,   7,   6),
            vec3n.create(6,   7,   8),
            vec3n.create(7,   9,   8), 
            vec3n.create(1,   3,   4),
            vec3n.create(3,   5,   4),
            vec3n.create(1,  11,  10),
            vec3n.create(1,   4,  11),
            vec3n.create(3,  12,   5),
            vec3n.create(5,  12,  13)   
        ],
        // uvs
        [
            vec2.create( 0.0,  0.66),
            vec2.create(0.25,  0.66),
            vec2.create( 0.0,  0.33),
            vec2.create(0.25,  0.33),
            vec2.create( 0.5,  0.66),
            vec2.create( 0.5,  0.33),
            vec2.create(0.75,  0.66),
            vec2.create(0.75,  0.33),
            vec2.create( 1.0,  0.66),
            vec2.create( 1.0,  0.33),
            vec2.create(0.25,     1),
            vec2.create( 0.5,     1),
            vec2.create(0.25,     0),
            vec2.create( 0.5,     0),
        ]
    )
}