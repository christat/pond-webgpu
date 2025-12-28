export * from 'pond/ecs/lib';
import { ecs } from 'pond/ecs/lib';
import { timeModule, cameraModule, inputModule, transformModule } from "pond/ecs/modules";

export const pondEcsDefs = {
    components: {
        ...cameraModule.components,
        ...transformModule.components,
    },
    globals: {
        ...cameraModule.globals,
        ...inputModule.globals,
        ...timeModule.globals,
    }
};

export function pondEcsSystems(world: ecs.World<any>) {
    timeModule.system(world);
    inputModule.system(world);
    cameraModule.system(world);
}