import { ecs } from "pond/ecs/lib";

const inputGlobals = {
    init: false,
    wentDown: new Set() as Set<string>,
    wentUp: new Set() as Set<string>,
    isDown: new Set() as Set<string>,
};

export const inputModule = {
    isDown: (globals: typeof inputGlobals, input: string) => globals.isDown.has(input),
    wentDown: (globals: typeof inputGlobals, input: string) => globals.wentDown.has(input),
    wentUp: (globals: typeof inputGlobals, input: string) => globals.wentUp.has(input),

    globals: {
        input: inputGlobals
    },
    system: inputSystem
};

function inputSystem(world: ecs.World<{ globals: typeof inputModule.globals }>) {
    const { input } = world.globals;

    input.wentDown.clear();
    input.wentUp.clear();

    if (!input.init) {
        input.init = true;
        document.addEventListener('keydown', (event: KeyboardEvent) => {
            event.preventDefault();
            input.wentDown.add(event.key);
            input.isDown.add(event.key);
            input.wentUp.delete(event.key);
        });

        document.addEventListener('keyup', (event: KeyboardEvent) => {
            input.wentUp.add(event.key);
            input.wentDown.delete(event.key);
            input.isDown.delete(event.key);
        });
    }
}


