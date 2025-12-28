import { ecs } from "pond/ecs/lib";

export const timeGlobals = {
    delta: 0,
    elapsed: 0,
    last: performance.now(),
};

export const timeModule = {
    globals: {
        time: timeGlobals
    },
    system: timeSystem
};

function timeSystem(world: ecs.World<{ globals: typeof timeModule.globals }>) {
    const { time } = world.globals;

    const now = performance.now()
    const delta = now - time.last;
    time.delta = delta;
    time.elapsed += delta;
    time.last = now
}
