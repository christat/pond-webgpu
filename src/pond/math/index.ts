import { mat3, mat4, vec2, vec3, vec4 } from 'wgpu-matrix';

import { trigonometry } from 'pond/math/trigonometry';
import { hash } from 'pond/math/hash';
import { rand } from 'pond/math/rand';

export type { StringHash32 } from 'pond/math/hash';
export type { Mat3, Mat4, Vec2, Vec3, Vec4 } from 'wgpu-matrix';

export const m = {
    ...trigonometry,
    ...hash,
    ...rand,
    mat3,
    mat4,
    vec2,
    vec3,
    vec4
}