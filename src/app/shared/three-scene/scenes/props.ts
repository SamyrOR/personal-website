import * as THREE from "three";
import { palette } from "./palette";

/** A flat-shaded standard material, the single building block every prop in these scenes is made from. */
export function material(
  color: number,
  roughness = 0.7,
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    flatShading: true,
  });
}

export interface SceneLights {
  ambient: THREE.AmbientLight;
  key: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  /** Nudges intensities per theme so the flat-shaded facets stay readable on both backgrounds. */
  setTheme(isDark: boolean): void;
}

// Single source of truth for the theme-reactive intensities, so the initial
// construction below and setTheme() can never drift out of sync (they used
// to hardcode these numbers separately in both places).
const AMBIENT_INTENSITY = { dark: 0.75, light: 1.5 };
const KEY_INTENSITY = { dark: 1.1, light: 1.8 };

export function createLights(isDark: boolean): SceneLights {
  const ambient = new THREE.AmbientLight(
    0xffffff,
    isDark ? AMBIENT_INTENSITY.dark : AMBIENT_INTENSITY.light,
  );
  const key = new THREE.DirectionalLight(
    0xffffff,
    isDark ? KEY_INTENSITY.dark : KEY_INTENSITY.light,
  );
  key.position.set(2.5, 3.5, 3);
  const fill = new THREE.DirectionalLight(0xbfd4ff, 0.35);
  fill.position.set(-3, 1.5, -2);

  return {
    ambient,
    key,
    fill,
    setTheme(dark: boolean) {
      ambient.intensity = dark
        ? AMBIENT_INTENSITY.dark
        : AMBIENT_INTENSITY.light;
      key.intensity = dark ? KEY_INTENSITY.dark : KEY_INTENSITY.light;
    },
  };
}

export function addLights(scene: THREE.Scene, lights: SceneLights): void {
  scene.add(lights.ambient, lights.key, lights.fill);
}

/**
 * Frees every geometry and material's GPU-side resources under a scene
 * graph. Three.js doesn't release these on garbage collection — each
 * scene's `SceneHandle.dispose()` calls this on teardown so repeated
 * mount/destroy cycles don't leak buffers.
 */
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.geometry.dispose();
    const mat = obj.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat.dispose();
  });
}

/** A small flat "document" card — a paper plane plus a few text-line bars, matching the floating document icons in the source illustrations. */
export function createDocumentCard(
  options: {
    width?: number;
    height?: number;
    paperColor?: number;
    lineColor?: number;
    lines?: number;
  } = {},
): THREE.Group {
  const {
    width = 0.42,
    height = 0.3,
    paperColor = palette.paper,
    lineColor = palette.accentBlue,
    lines = 3,
  } = options;

  const group = new THREE.Group();

  const paper = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.02),
    material(paperColor, 0.9),
  );
  group.add(paper);

  const lineMat = material(lineColor, 0.6);
  const lineHeight = height * 0.09;
  const lineGap = height * 0.2;
  const startY = height * 0.25;
  for (let i = 0; i < lines; i++) {
    const lineWidth = width * (i === lines - 1 ? 0.45 : 0.72);
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(lineWidth, lineHeight, 0.015),
      lineMat,
    );
    line.position.set(
      -width / 2 + lineWidth / 2 + width * 0.08,
      startY - i * lineGap,
      0.02,
    );
    group.add(line);
  }

  return group;
}

export function createDot(radius: number, color: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.IcosahedronGeometry(radius, 0),
    material(color, 0.7),
  );
}

/** A soft dark ellipse laid flat beneath a scene's centerpiece, grounding it with a contact shadow. */
export function createContactShadow(
  radiusX: number,
  radiusZ: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(1, 24),
    new THREE.MeshBasicMaterial({
      color: palette.shadow,
      transparent: true,
      opacity: 0.16,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.set(radiusX, radiusZ, 1);
  return mesh;
}
