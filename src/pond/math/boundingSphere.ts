import { vec2, Vec3, vec3 } from "wgpu-matrix";

export class BoundingSphere {
    center: Vec3;
    radius: number;

    static default(): BoundingSphere {
        return { center: vec3.create(), radius: 0 };
    }

    constructor(points: Array<Vec3>) {
        const boundingSphere = BoundingSphere.default();
        this.center = boundingSphere.center;
        this.radius = boundingSphere.radius;

        if (!points.length) {
            return;
        }

        for (const point of points) {
            this.center = vec3.add(this.center, point);
        }

        this.center = vec3.divScalar(this.center, points.length);
        this.radius = vec2.distSq(points[0], this.center);
        for (let i = 1; i < points.length; ++i) {
            this.radius = Math.max(this.radius, vec2.distSq(points[i], this.center));
        }
        this.radius = Math.sqrt(this.radius);
    }
}