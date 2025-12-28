import { m, Mat4, Vec3 } from 'pond/math';
import { ecs } from 'pond/ecs/lib';
import { timeModule } from 'pond/ecs/modules/timeModule';
import { inputModule } from './inputModule';

export class CameraComponent {
    vFov: number;
    zNear: number;
    zFar: number;

    eye: Vec3;
    target: Vec3;
    up: Vec3;

    constructor(vFov: number, zNear: number, zFar: number) {
      this.vFov = vFov;
      this.zNear = zNear;
      this.zFar = zFar;
      this.eye = m.vec3.create(0, 0, -3);
      this.target = m.vec3.create(0, 0, 0);
      this.up = m.vec3.create(0, 1, 0);
    }
}

const cameraGlobals = {
  activeCamera: -1 as ecs.EntityId
}

export const cameraModule = {
  components: {
    Camera: [] as CameraComponent[],
  },
  globals: {
    camera: cameraGlobals,
  },
  api: {
    view(camera: CameraComponent): Mat4 {
      return m.mat4.lookAt(camera.eye, camera.target, camera.up);
    },
    projection(camera: CameraComponent): Mat4 {
      return m.mat4.perspectiveReverseZ(camera.vFov, 16/9, camera.zNear, camera.zFar);
    },
    viewProjection(camera: CameraComponent): Mat4 {
      const projection = cameraModule.api.projection(camera);
      const view = cameraModule.api.view(camera);
      return m.mat4.mul(projection, view);
    },
    initDefaultCamera,
    getCurrentCameraViewProjection,
  },
  system,
};

function initDefaultCamera(world: ecs.World<{ components: typeof cameraModule.components, globals: typeof cameraModule.globals }>) {
  const { camera } = world.globals;
  if(camera.activeCamera !== -1) {
    console.warn('Camera already initiated - skipping!');
    return;
  };
  const { Camera } = world.components;
  const eid = ecs.addEntity(world);
  ecs.addComponents(world, eid, Camera);
  Camera[eid] = new CameraComponent(45, 0.1, 100);
  camera.activeCamera = eid;
}

function getCurrentCameraViewProjection(world: ecs.World<{ components: typeof cameraModule.components, globals: typeof cameraModule.globals }>) {
  const { camera } = world.globals;
  if(camera.activeCamera == -1 || !ecs.entityExists(world, camera.activeCamera)) throw Error('No active camera - aborting!');
  const { Camera } = world.components;
  return cameraModule.api.viewProjection(Camera[camera.activeCamera]);
}

function system(world: ecs.World<{ components: typeof cameraModule.components, globals: typeof cameraModule.globals & typeof timeModule.globals & typeof inputModule.globals }>) {
  const { camera } = world.globals;
  if(camera.activeCamera == -1 || !ecs.entityExists(world, camera.activeCamera)) return;

  const { time } = world.globals;
  const { Camera } = world.components;

  const currentFrame = time.elapsed;
  const radius = 3;
  const speed = 0.001;
  const x = Math.sin(currentFrame * speed) * radius;
  const z = Math.cos(currentFrame * speed) * radius
  Camera[camera.activeCamera].eye = m.vec3.create(x, 0, z);
}
