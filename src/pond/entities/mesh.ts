import { Vec2, Vec3, Vec3n } from "wgpu-matrix";
import { Resource } from "pond/entities/resource";
import { StringHash32 } from "pond/math";

export class Mesh extends Resource {
    vertices: Array<Vec3>;
    indices: Array<Vec3n>;
    uvs: Array<Vec2>;
    colors?: Array<Vec3n>;

    constructor(
        id: StringHash32,
        vertices: Array<Vec3>,
        indices: Array<Vec3n>,
        uvs: Array<Vec2>,
        colors?: Array<Vec3n>,
    ) {
        super(id);

        console.assert(vertices.length == uvs.length, `Mesh: mismatched vertex to uv count (${vertices.length} vs ${uvs.length})`);
        this.vertices = vertices;
        this.indices = indices;
        this.uvs = uvs;
        
        if(colors) {
            console.assert(vertices.length == colors.length, `Mesh: mismatched vertex to color count (${vertices.length} vs ${colors.length})`);
            this.colors = colors;
        }
    }
}