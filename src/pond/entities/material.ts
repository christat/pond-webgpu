import { ResourceID } from "pond/entities/shared";

export interface Material extends ResourceID {
    diffuse: string;
}