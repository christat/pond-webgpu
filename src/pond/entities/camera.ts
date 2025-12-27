import { Surface } from "pond/renderer/surface";
import { mat4, Mat4, vec3, Vec3 } from "wgpu-matrix";


export class Camera {
    protected view: Mat4;
    protected projection: Mat4;

    private target: Vec3;
    private up: Vec3;

    private vFovRadians: number;
    private zNear: number;
    private zFar: number;

    constructor(
        transform: Vec3,
        vFovRadians: number,
        aspectRatio: number,
        zNear: number,
        zFar: number) {
        this.target = vec3.create(0, 0, 0);
        this.up = vec3.create(0, 1, 0);

        this.view = mat4.lookAt(
            transform,
            this.target,
            this.up
        );
        this.projection = mat4.perspectiveReverseZ(vFovRadians, aspectRatio, zNear, zFar);
        
        this.vFovRadians = vFovRadians;
        this.zNear = zNear;
        this.zFar = zFar;
    }

    init = (surface: Surface) => {
        surface.addCallback(this.resizeCallback)
    }

    updateTransform(transform: Vec3) {
        this.view = mat4.lookAt(
            transform,
            this.target,
            this.up
        );
    }

    updateAspectRatio(aspectRatio: number) {
        this.projection = mat4.perspectiveReverseZ(this.vFovRadians, aspectRatio, this.zNear, this.zFar);
    }

    viewProjection(): Mat4 {
        return mat4.mul(this.projection, this.view);
    }

    resizeCallback = (width: number, height: number) => {
        this.updateAspectRatio(width / height);
    }
}
