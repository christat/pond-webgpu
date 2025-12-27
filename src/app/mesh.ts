import { m } from "pond/math";
import { Mesh } from "pond/entities";

export const mesh = {
    triangle: () => new Mesh(
        m.stringHash32('triangle'),
        // vertices
        [
            m.vec3.create(-0.5,  -0.5,  0.0),
            m.vec3.create( 0.5,  -0.5,  0.0),
            m.vec3.create( 0.0,   0.5,  0.0),
        ],
        // indices
        [
            m.vec3n.create(0, 1, 2),
        ],
        // uvs
        [
            m.vec2.create(0.0,   0.0),
            m.vec2.create(1.0,   0.0),
            m.vec2.create(0.5,   1.0),
        ],
    ),
    quad: () => new Mesh(
        m.stringHash32('quad'),
        // vertices
        [
            m.vec3.create( 0.5,  0.5, 0.0),
            m.vec3.create( 0.5, -0.5, 0.0),
            m.vec3.create(-0.5, -0.5, 0.0),
            m.vec3.create(-0.5,  0.5, 0.0),
        ],
        // indices
        [
            m.vec3n.create(0, 1, 3),
            m.vec3n.create(1, 2, 3),
        ],
        // uvs
        [
            m.vec2.create(1.0, 1.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(0.0, 0.0),
            m.vec2.create(0.0, 1.0),
        ]
    ),
    cube: () => new Mesh(
        m.stringHash32('cube'),
        // vertices
        [
            m.vec3.create(-0.5, -0.5, -0.5),
            m.vec3.create( 0.5, -0.5, -0.5),
            m.vec3.create( 0.5,  0.5, -0.5),
            m.vec3.create( 0.5,  0.5, -0.5),
            m.vec3.create(-0.5,  0.5, -0.5),
            m.vec3.create(-0.5, -0.5, -0.5),
            m.vec3.create(-0.5, -0.5,  0.5),
            m.vec3.create( 0.5, -0.5,  0.5),
            m.vec3.create( 0.5,  0.5,  0.5),
            m.vec3.create( 0.5,  0.5,  0.5),
            m.vec3.create(-0.5,  0.5,  0.5),
            m.vec3.create(-0.5, -0.5,  0.5),
            m.vec3.create(-0.5,  0.5,  0.5),
            m.vec3.create(-0.5,  0.5, -0.5),
            m.vec3.create(-0.5, -0.5, -0.5),
            m.vec3.create(-0.5, -0.5, -0.5),
            m.vec3.create(-0.5, -0.5,  0.5),
            m.vec3.create(-0.5,  0.5,  0.5),
            m.vec3.create( 0.5,  0.5,  0.5),
            m.vec3.create( 0.5,  0.5, -0.5),
            m.vec3.create( 0.5, -0.5, -0.5),
            m.vec3.create( 0.5, -0.5, -0.5),
            m.vec3.create( 0.5, -0.5,  0.5),
            m.vec3.create( 0.5,  0.5,  0.5),
            m.vec3.create(-0.5, -0.5, -0.5),
            m.vec3.create( 0.5, -0.5, -0.5),
            m.vec3.create( 0.5, -0.5,  0.5),
            m.vec3.create( 0.5, -0.5,  0.5),
            m.vec3.create(-0.5, -0.5,  0.5),
            m.vec3.create(-0.5, -0.5, -0.5),
            m.vec3.create(-0.5,  0.5, -0.5),
            m.vec3.create( 0.5,  0.5, -0.5),
            m.vec3.create( 0.5,  0.5,  0.5),
            m.vec3.create( 0.5,  0.5,  0.5),
            m.vec3.create(-0.5,  0.5,  0.5),
            m.vec3.create(-0.5,  0.5, -0.5),
        ],
        // indices
        [
            m.vec3n.create( 0,  1,  2),
            m.vec3n.create( 3,  4,  5),
            m.vec3n.create( 6,  7,  8),
            m.vec3n.create( 9, 10, 11),
            m.vec3n.create(12, 13, 14),
            m.vec3n.create(15, 16, 17),
            m.vec3n.create(18, 19, 20),
            m.vec3n.create(21, 22, 23),
            m.vec3n.create(24, 25, 26),
            m.vec3n.create(27, 28, 29),
            m.vec3n.create(30, 31, 32),
            m.vec3n.create(33, 34, 35),
        ],
        // uvs
        [
            m.vec2.create(0.0, 0.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(1.0, 1.0),
            m.vec2.create(1.0, 1.0),
            m.vec2.create(0.0, 1.0),
            m.vec2.create(0.0, 0.0),
            m.vec2.create(0.0, 0.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(1.0, 1.0),
            m.vec2.create(1.0, 1.0),
            m.vec2.create(0.0, 1.0),
            m.vec2.create(0.0, 0.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(1.0, 1.0),
            m.vec2.create(0.0, 1.0),
            m.vec2.create(0.0, 1.0),
            m.vec2.create(0.0, 0.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(1.0, 1.0),
            m.vec2.create(0.0, 1.0),
            m.vec2.create(0.0, 1.0),
            m.vec2.create(0.0, 0.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(0.0, 1.0),
            m.vec2.create(1.0, 1.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(0.0, 0.0),
            m.vec2.create(0.0, 1.0),
            m.vec2.create(0.0, 1.0),
            m.vec2.create(1.0, 1.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(1.0, 0.0),
            m.vec2.create(0.0, 0.0),
            m.vec2.create(0.0, 1.0),
        ]
    )
}