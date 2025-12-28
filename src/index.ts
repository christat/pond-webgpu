import { App } from 'app';
import { material } from 'app/material';
import { mesh } from 'app/mesh';
import { Material, Mesh, Model, Scene, m } from 'pond';

(async () => {
    // TODO content pipeline - gather meshes and materials present in a scene
    const meshes: Mesh[] = [
        mesh.triangle(),
        mesh.quad(),
        mesh.cube(),
    ];

    const materials: Material[] = [
        material.red_brick(),
        material.metal_plate(),
        material.wooden_garage_door(),
    ];

    const models: Model[] = [...Array(6).keys()].map((_, i) => {
        // generate a random transform within the fixed camera frustum of the current demo
        let transform = m.mat4.identity();
        transform = m.mat4.translate(transform, m.vec3.create(m.randFloat(-1, 1), m.randFloat(-1, 1), m.randFloat(-1, 1)));
        const scale = m.randFloat(0.25, 0.75);
        transform = m.mat4.scale(transform, m.vec3.create(scale, scale, scale));

        return new Model(
            transform,
            meshes[m.randInt(0, meshes.length)].id,
            materials[m.randInt(0, materials.length)].id
        );
    });

    const app = await App.create('webgpu-canvas', new Scene(meshes, materials, models));

    await app.run();
})();