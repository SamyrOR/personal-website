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
  /**
   * Nudges intensities per theme so the flat-shaded facets stay readable on
   * both backgrounds. Pass `instant: true` (when `prefers-reduced-motion` is
   * set) to snap immediately instead of easing — otherwise the change would
   * never appear, since the ease only advances from update(), which the host
   * component skips entirely for reduced-motion users.
   */
  setTheme(isDark: boolean, instant?: boolean): void;
  /** Advances the intensity tweens started by setTheme(); call once per frame with delta in ms. */
  update(deltaMs: number): void;
}

// Matches the CSS theme cross-fade duration (see html.transition in
// _reset.scss) so the WebGL scenes ease in sync with the rest of the page
// instead of snapping instantly while everything else fades.
const THEME_TWEEN_MS = 420;

/** Eases a material's color toward a new target over THEME_TWEEN_MS instead of snapping. */
export function createColorTween(target: {
  color: THREE.Color;
}): {
  to(color: THREE.ColorRepresentation, instant?: boolean): void;
  update(deltaMs: number): void;
} {
  const from = target.color.clone();
  const to = target.color.clone();
  let elapsed = THEME_TWEEN_MS;
  return {
    to(color, instant = false) {
      to.set(color);
      if (instant) {
        target.color.copy(to);
        elapsed = THEME_TWEEN_MS;
        return;
      }
      from.copy(target.color);
      elapsed = 0;
    },
    update(deltaMs) {
      if (elapsed >= THEME_TWEEN_MS) return;
      elapsed = Math.min(THEME_TWEEN_MS, elapsed + deltaMs);
      target.color.lerpColors(from, to, elapsed / THEME_TWEEN_MS);
    },
  };
}

/** Eases a scalar (e.g. a light's intensity) toward a new target over THEME_TWEEN_MS. */
function createNumberTween(
  get: () => number,
  set: (value: number) => void,
): { to(value: number, instant?: boolean): void; update(deltaMs: number): void } {
  let from = get();
  let to = get();
  let elapsed = THEME_TWEEN_MS;
  return {
    to(value, instant = false) {
      to = value;
      if (instant) {
        set(value);
        elapsed = THEME_TWEEN_MS;
        return;
      }
      from = get();
      elapsed = 0;
    },
    update(deltaMs) {
      if (elapsed >= THEME_TWEEN_MS) return;
      elapsed = Math.min(THEME_TWEEN_MS, elapsed + deltaMs);
      set(from + (to - from) * (elapsed / THEME_TWEEN_MS));
    },
  };
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

  const ambientTween = createNumberTween(
    () => ambient.intensity,
    (value) => (ambient.intensity = value),
  );
  const keyTween = createNumberTween(
    () => key.intensity,
    (value) => (key.intensity = value),
  );

  return {
    ambient,
    key,
    fill,
    setTheme(dark: boolean, instant = false) {
      ambientTween.to(dark ? AMBIENT_INTENSITY.dark : AMBIENT_INTENSITY.light, instant);
      keyTween.to(dark ? KEY_INTENSITY.dark : KEY_INTENSITY.light, instant);
    },
    update(deltaMs: number) {
      ambientTween.update(deltaMs);
      keyTween.update(deltaMs);
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
