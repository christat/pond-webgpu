import { App } from 'app';
import { material } from 'app/material';
import { mesh } from 'app/mesh';
import { Material, Mesh, Model, Scene, m } from 'pond';
import { Camera } from 'pond/entities/camera';

(async () => {
    // TODO content pipeline - gather meshes and materials present in a scene
    const meshes: Mesh[] = [
        mesh.triangle(),
        mesh.quad(),
        mesh.cube()
    ];

    const materials: Material[] = [
        material.metal_plate(),
        material.red_brick(),
        material.wooden_garage_door()
    ];

    const models: Model[] = [...Array(2).keys()].map(() => {
        // generate a random transform within the fixed camera frustum of the current demo
        const transform = m.mat4.identity();
        m.mat4.translate(transform, m.vec3.create(m.randFloat(-0.5, 0.5), m.randFloat(-0.5, 0.5), m.randFloat(-0.5, 0.05)));
        const scale = m.randFloat(0.25, 1.0);
        m.mat4.scale(transform, m.vec3.create(scale, scale, scale));

        return new Model(
            transform,
            meshes[m.randInt(0, meshes.length)].id,
            materials[m.randInt(0, materials.length)].id
        );
    });

    const camera = new Camera(
        m.vec3.create(0, 0, -3),
        55,
        1,
        0.1,
        100
    );

    const app = await App.create(
        'webgpu-canvas',
        new Scene(
            meshes,
            materials,
            models,
            camera
        )
    );

    await app.run();
})();