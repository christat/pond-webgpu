import { Mesh, Material, Model, Camera, BoundingSphere } from "pond";

export class Scene {
    meshes: Array<Mesh>;
    materials: Array<Material>;
    models: Array<Model>;
    camera: Camera;

    constructor(
        meshes: Array<Mesh>,
        materials: Array<Material>,
        models: Array<Model>,
        camera: Camera
    ) {
        this.meshes = meshes;
        this.materials = materials;
        this.models = models;
        this.camera = camera;
    }
}