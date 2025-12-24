import { Camera, Model, Renderer, Scene, World } from "pond";

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

    async run() {
        await this.ren.init(this.scene);
        this.loop();
    }

    private loop = async () => {
        await this.ecs.execute();
        await this.ren.render(this.scene);
        requestAnimationFrame(this.loop);
    }
}