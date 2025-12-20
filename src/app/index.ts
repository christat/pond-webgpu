import { World } from "@lastolivegames/becsy";
import { Renderer } from "pond/renderer";
import { Scene } from "pond/scene";

export class App {
    ecs: World;
    ren: Renderer;
    scene: Scene;

    constructor(ecs: World, ren: Renderer, scene: Scene) {
        this.ecs = ecs;
        this.ren = ren;
        this.scene = scene;
    }

    static async create(canvasID: string, scene: Scene): Promise<App> {
        const ecs = await World.create();
        const ren = await Renderer.create(canvasID);
        return new App(ecs, ren, scene);
    }

    init() {
        this.ren.init(this.scene);
    }

    loop = async () => {
        await this.ecs.execute();
        this.ren.render(this.scene);
        requestAnimationFrame(this.loop);
    }
}