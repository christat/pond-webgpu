import { StringHash32 } from "pond/math/hash";

export class Resource {
    id: StringHash32;

    constructor(id: StringHash32) {
        this.id = id;
    }
}