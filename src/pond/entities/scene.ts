import { Material } from "pond/entities/material";
import { Mesh } from "pond/entities/mesh";
import { Model } from "pond/entities/model";

export class Scene {
    meshes: Array<Mesh>;
    materials: Array<Material>;
    models: Array<Model>;

    constructor(
        meshes: Array<Mesh>,
        materials: Array<Material>,
        models: Array<Model>,
    ) {
        this.meshes = meshes;
        this.materials = materials;
        this.models = models;
    }
}