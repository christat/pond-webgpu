import { ecs, pondEcsDefs, pondEcsSystems, Renderer, Scene } from "pond";
import { cameraModule } from "pond/ecs/modules";
import { ResizeLifecycle } from "pond/renderer/surface";

export type WorldType = typeof pondEcsDefs;

export class App {
    world: ecs.World<WorldType>;
    ren: Renderer;
    scene: Scene;

    raf: number;
    resizeLifecycle: ResizeLifecycle;

    constructor(ren: Renderer, scene: Scene) {
        this.world = ecs.createWorld(pondEcsDefs);

        this.world
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
        const ren = await Renderer.create(canvasID);
        return new App(ren, scene);
    }

    async run() {
        cameraModule.api.initDefaultCamera(this.world);
        const viewProjection = cameraModule.api.getCurrentCameraViewProjection(this.world)
        await this.ren.init(this.scene, this.resizeLifecycle, viewProjection);
        this.loop();
    }

    private loop = async () => {
        pondEcsSystems(this.world);
        await this.ren.render(this.scene, cameraModule.api.getCurrentCameraViewProjection(this.world));
        this.raf = requestAnimationFrame(this.loop);
    }
}