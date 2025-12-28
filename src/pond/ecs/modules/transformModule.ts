import { Mat4 } from "pond/math";

export interface WorldTransformComponent {
    transform: Mat4;
}

export const transformModule = {
    components: {
        WorldTranform: [] as WorldTransformComponent[],
    }
};