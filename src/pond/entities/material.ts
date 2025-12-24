import { StringHash32 } from "pond/math";
import { Resource } from "pond/entities";

export class Material extends Resource {
    diffuse: string;

    constructor(id: StringHash32, diffuse: string) {
        super(id);
        this.diffuse = diffuse;
    }
}