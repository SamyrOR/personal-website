// Type-only: erased at compile time, so referencing it here doesn't pull
// three.js's runtime code into whichever chunk this file ends up in.
import type * as THREE from "three";

export interface SceneBuildContext {
  isDark: boolean;
}

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update(elapsed: number, delta: number): void;
  setTheme?(isDark: boolean): void;
  dispose?(): void;
}

// Builders are async so home.component.ts can hand ThreeSceneComponent a
// `() => import('./scenes/x-scene').then(m => m.buildXScene(ctx))` thunk —
// that keeps the (fairly heavy) three.js runtime out of the eagerly-loaded
// home chunk, deferred to a lazy chunk fetched only once a canvas mounts.
export type SceneBuilder = (ctx: SceneBuildContext) => SceneHandle | Promise<SceneHandle>;
