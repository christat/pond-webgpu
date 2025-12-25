import { Renderer, Scene, World } from "pond";
import { ResizeLifecycle } from "pond/renderer/surface";

export class App {
    ecs: World;
    ren: Renderer;
    scene: Scene;

    raf: number;
    resizeLifecycle: ResizeLifecycle;

    constructor(ecs: World, ren: Renderer, scene: Scene) {
        this.ecs = ecs;
        this.ren = ren;
        this.scene = scene;
        this.raf = 0;
        this.resizeLifecycle = {
            onResizeStart: () => cancelAnimationFrame(this.raf),
            onResizeEnd: () => this.raf = requestAnimationFrame(this.loop),
        }
    }

    static async create(canvasID: string, scene: Scene): Promise<App> {
        const ecs = await World.create();
        const ren = await Renderer.create(canvasID);
        return new App(ecs, ren, scene);
    }

    async run() {
        await this.ren.init(this.scene, this.resizeLifecycle);
        this.loop();
    }

    private loop = async () => {
        await this.ecs.execute();
        await this.ren.render(this.scene);
        this.raf = requestAnimationFrame(this.loop);
    }
}