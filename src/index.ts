import { App } from 'app';
import { mesh } from 'app/mesh';
import { Material, Mesh, RenderObject, Scene, m } from 'pond';

(async () => {
    // TODO content pipeline - gather meshes and materials present in a scene
    const meshes: Mesh[] = [
        mesh.triangle(),
        mesh.quad(),
        mesh.cube()
    ];

    const materials: Material[] = [
        { id: m.stringHash32('metal_plate'), diffuse: 'assets/materials/metal_plate/diffuse.jpg' },
        { id: m.stringHash32('red_brick'), diffuse: 'assets/materials/red_brick/diffuse.jpg' },
        { id: m.stringHash32('wooden_garage_door'), diffuse: 'assets/materials/wooden_garage_door/diffuse.jpg' }
    ];

    const renderObjects: RenderObject[] = [...Array(1).keys()].map(() => {
        // generate a random transform within the fixed camera frustum of the current demo
        const transform = m.mat4.identity();
        m.mat4.translate(transform, m.vec3.create(m.randFloat(-0.5, 0.5), m.randFloat(-0.5, 0.5), m.randFloat(-0.5, 0.05)));
        const scale = m.randFloat(0.25, 1.5);
        m.mat4.scale(transform, m.vec3.create(scale, scale, scale));
        return {
            transform,
            // meshID: meshes[m.randInt(0, meshes.length)].id,
            // materialID: materials[m.randInt(0, materials.length)].id,
            meshID: meshes[0].id,
            materialID: materials[0].id
        }
    });

    const app = await App.create(
        'wgpu-canvas',
        new Scene(
            meshes,
            materials,
            renderObjects
        )
    );

    await app.run();
})();