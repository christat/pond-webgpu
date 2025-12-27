import { Material, m } from "pond";

export const material = {
    metal_plate: () => new Material(m.stringHash32('metal_plate'), 'assets/materials/metal_plate/diffuse.jpg'),
    red_brick: () => new Material(m.stringHash32('red_brick'), 'assets/materials/red_brick/diffuse.jpg'),
    wooden_garage_door: () => new Material(m.stringHash32('wooden_garage_door'), 'assets/materials/wooden_garage_door/diffuse.jpg'),
}