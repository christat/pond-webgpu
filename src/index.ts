import { App } from 'app';
import { mesh } from 'app/mesh';
import { Renderable, WorldTransform } from 'pond/ecs';
import { hash } from 'pond/math/hash';
import { Material, Scene } from 'pond/scene';
import { mat4, vec3 } from 'wgpu-matrix';

(async () => {
    const cubeMesh = mesh.cube();
    const wallMaterial: Material = { id: hash.stringHash32('wall'), diffuse: '' };
    const boxMaterial: Material = { id: hash.stringHash32('box'), diffuse: '' };
    const fMaterial: Material = { id: hash.stringHash32('f'), diffuse: '' };

    const scene = new Scene(
        [
            [cubeMesh.id, cubeMesh]
        ],
        [
            [wallMaterial.id, wallMaterial],
            [boxMaterial.id, boxMaterial],
            [fMaterial.id, fMaterial],
        ]
    );

    const app = await App.create('wgpu-canvas', scene);

    const instancePositions = [
        vec3.create( 0.0, 0.0, 0.0),
        vec3.create( 2.0, 5.0, -15.0),
        vec3.create(-1.5, -2.2, -2.5),
        vec3.create(-3.8, -2.0, -12.3),
        vec3.create( 2.4, -0.4, -3.5),
        vec3.create(-1.7, 3.0, -7.5),
        vec3.create( 1.3, -2.0, -2.5),
        vec3.create( 1.5, 2.0, -2.5),
        vec3.create( 1.5, 0.2, -1.5),
        vec3.create(-1.3, 1.0, -1.5)
    ];

    // instancePositions.forEach((position, i) => {
    //     const materialID = i % 3 === 0 
    //         ? wallMaterial.id
    //         : i % 2 === 0 
    //             ? boxMaterial.id
    //             : fMaterial.id;
    //     app.ecs.createEntity(
    //         WorldTransform, { transform: mat4.translation(position) },
    //         Renderable, { meshID: cubeMesh.id, materialID }
    //     );
    // });

    app.init();
    await app.loop();
})();