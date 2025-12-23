import { Mesh, Material, StringHash32, RenderObject, m } from "pond";
import { Camera } from "./camera";
import { Surface } from "pond/renderer/surface";

export class Scene {
    meshes: Mesh[];
    materials: Material[];
    renderObjects: RenderObject[];
    camera: Camera;

    constructor(
        meshes: Array<Mesh>,
        materials: Array<Material>,
        renderObjects: Array<RenderObject>,
    ) {
        this.meshes = meshes;
        this.materials = materials;
        this.renderObjects = renderObjects;
        this.camera = new Camera(
            m.vec3.create(0, 0, -3),
            55,
            1,
            0.1,
            100
        );
    }
}