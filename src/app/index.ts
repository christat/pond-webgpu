import { m, Renderer, Scene, World } from "pond";
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
            onResizeStart: () => {
                cancelAnimationFrame(this.raf)
            },
            onResizeEnd: () => {
                this.raf = requestAnimationFrame(this.loop)
            },
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

        // TODO move into ECS
        const currentFrame = this.ren.getFrame();
        const radius = 2;
        const speed = 0.033;
        const x = Math.sin(currentFrame * speed) * radius;
        const z = Math.cos(currentFrame * speed) * radius
        this.scene.camera.updateTransform(m.vec3.create(x, 0, z));

        await this.ren.render(this.scene);

        this.raf = requestAnimationFrame(this.loop);
    }
}