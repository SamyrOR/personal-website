import * as THREE from "three";
import type { SceneBuildContext, SceneHandle } from "../three-scene.types";
import { palette } from "./palette";
import { createDot, createLights, addLights, createContactShadow, material, disposeObject } from "./props";

/**
 * The centerpiece: a dark code-editor window with a browser-style title bar,
 * syntax-colored code lines, a "</>" badge, and a blinking text cursor —
 * built with the same "one bold, detailed centerpiece" treatment as the hero
 * scene's laptop, but standing for the actual craft (writing software)
 * rather than an abstract network diagram.
 */
function createCodeWindow(): { group: THREE.Group; cursor: THREE.Mesh; panelMaterial: THREE.MeshStandardMaterial; titleBarMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();

  const panelMat = material(palette.clothingDark, 0.7);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.3, 0.05), panelMat);
  group.add(panel);

  const titleBarMat = material(palette.windowTitleBar, 0.7);
  const titleBar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.16, 0.02), titleBarMat);
  titleBar.position.set(0, 0.57, 0.028);
  group.add(titleBar);

  const dotColors = [palette.accentRed, palette.accentBluePale, palette.accentBlue];
  dotColors.forEach((color, i) => {
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), material(color, 0.5));
    dot.position.set(-0.82 + i * 0.12, 0.57, 0.04);
    group.add(dot);
  });

  // A "</>" code badge, top-right of the title bar.
  const bracket = (mirror: boolean): THREE.Mesh => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0.06);
    shape.lineTo(-0.09, 0);
    shape.lineTo(0, -0.06);
    shape.lineTo(0.03, -0.05);
    shape.lineTo(-0.045, 0);
    shape.lineTo(0.03, 0.05);
    shape.closePath();
    const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), material(palette.accentBluePale, 0.5));
    if (mirror) mesh.scale.x = -1;
    return mesh;
  };
  const bracketLeft = bracket(false);
  bracketLeft.position.set(0.68, -0.55, 0.04);
  group.add(bracketLeft);
  const bracketRight = bracket(true);
  bracketRight.position.set(0.78, -0.55, 0.04);
  group.add(bracketRight);

  // Syntax-colored code lines, staggered like real indentation.
  const lines: { x: number; y: number; width: number; color: number }[] = [
    { x: -0.75, y: 0.34, width: 0.32, color: palette.accentBluePale },
    { x: -0.68, y: 0.2, width: 0.55, color: palette.gray },
    { x: -0.6, y: 0.06, width: 0.4, color: palette.accentBlue },
    { x: -0.52, y: -0.08, width: 0.62, color: palette.gray },
    { x: -0.52, y: -0.22, width: 0.3, color: palette.accentRed },
    { x: -0.6, y: -0.36, width: 0.45, color: palette.accentBlue },
    { x: -0.68, y: -0.5, width: 0.2, color: palette.gray },
  ];
  lines.forEach(({ x, y, width, color }) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.045, 0.015), material(color, 0.6));
    bar.position.set(x + width / 2, y, 0.032);
    group.add(bar);
  });

  const cursorMat = material(palette.accentBluePale, 0.4);
  cursorMat.transparent = true;
  const cursor = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.015), cursorMat);
  cursor.position.set(-0.68 + 0.2 + 0.05, -0.5, 0.033);
  group.add(cursor);

  return { group, cursor, panelMaterial: panelMat, titleBarMaterial: titleBarMat };
}

function createGear(color: number): THREE.Group {
  const group = new THREE.Group();
  const mat = material(color, 0.65);

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 10), mat);
  core.rotation.x = Math.PI / 2;
  group.add(core);

  const toothCount = 8;
  for (let i = 0; i < toothCount; i++) {
    const angle = (i / toothCount) * Math.PI * 2;
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.055, 0.06), mat);
    tooth.position.set(Math.cos(angle) * 0.13, Math.sin(angle) * 0.13, 0);
    tooth.rotation.z = angle;
    group.add(tooth);
  }

  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.065, 8), material(palette.clothingDark, 0.8));
  hole.rotation.x = Math.PI / 2;
  group.add(hole);

  return group;
}

/** The classic stacked-disk database icon. */
function createDatabaseIcon(color: number): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = material(color, 0.65);
  const ridgeMat = material(palette.clothingDark, 0.6);
  const radius = 0.13;

  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.26, 12), bodyMat);
  group.add(body);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.025, 12), ridgeMat);
  cap.position.y = 0.13;
  group.add(cap);

  [0.043, -0.043].forEach((y) => {
    const ridge = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.002, radius + 0.002, 0.02, 12), ridgeMat);
    ridge.position.y = y;
    group.add(ridge);
  });

  return group;
}

/** A puffy cloud icon (hosting/deployment), built from overlapping low-poly puffs. */
function createCloudIcon(color: number): THREE.Group {
  const group = new THREE.Group();
  const mat = material(color, 0.75);

  const puffs: { x: number; y: number; radius: number }[] = [
    { x: 0, y: 0, radius: 0.1 },
    { x: -0.11, y: -0.03, radius: 0.075 },
    { x: 0.11, y: -0.025, radius: 0.08 },
    { x: 0.02, y: 0.07, radius: 0.07 },
  ];
  puffs.forEach(({ x, y, radius }) => {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 0), mat);
    puff.position.set(x, y, 0);
    group.add(puff);
  });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.16), mat);
  base.position.set(0, -0.06, 0);
  group.add(base);

  return group;
}

/** A tiny commit graph: a branch point splitting into two commit nodes. */
function createBranchNode(color: number): THREE.Group {
  const group = new THREE.Group();
  const lineMat = material(palette.grayDark, 0.7);

  const base = createDot(0.045, color);
  base.position.set(0, -0.14, 0);
  group.add(base);

  const nodeA = createDot(0.04, palette.accentBlue);
  nodeA.position.set(-0.1, 0.12, 0);
  group.add(nodeA);

  const nodeB = createDot(0.04, color);
  nodeB.position.set(0.1, 0.12, 0);
  group.add(nodeB);

  const link = (from: THREE.Vector3, to: THREE.Vector3): THREE.Mesh => {
    const mid = from.clone().lerp(to, 0.5);
    const length = from.distanceTo(to);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, length, 5), lineMat);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    return mesh;
  };
  group.add(link(base.position, nodeA.position));
  group.add(link(base.position, nodeB.position));

  return group;
}

interface Satellite {
  pivot: THREE.Group;
  radius: number;
  speed: number;
  angle: number;
  spin?: number;
  spinAxis?: "x" | "y" | "z";
}

export function buildTechScene({ isDark }: SceneBuildContext): SceneHandle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0.05, 0.7, 6.6);
  camera.lookAt(0.05, 0.55, 0);

  const lights = createLights(isDark);
  addLights(scene, lights);

  const composition = new THREE.Group();
  composition.position.set(0, 0.55, 0);
  scene.add(composition);

  const codeWindow = createCodeWindow();
  codeWindow.panelMaterial.color.set(isDark ? palette.clothingDarkOnDark : palette.clothingDark);
  codeWindow.titleBarMaterial.color.set(isDark ? palette.windowTitleBarOnDark : palette.windowTitleBar);
  composition.add(codeWindow.group);

  // A tilted orbit ring carrying four concrete software-engineering icons —
  // a spinning gear (engineering), a database, a cloud (hosting/deployment),
  // and a tiny commit graph (version control) — rather than abstract dots.
  const ringPivot = new THREE.Group();
  ringPivot.rotation.set(1.2, 0.05, 0.25);
  composition.add(ringPivot);

  const orbitRadius = 1.65;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(orbitRadius, 0.02, 4, 40),
    material(palette.grayDark, 0.6),
  );
  ringPivot.add(ring);

  const satelliteDefs: { build: () => THREE.Group; angle: number; speed: number; spin?: number; spinAxis?: "x" | "y" | "z" }[] = [
    { build: () => createGear(palette.accentBlue), angle: 0, speed: 0.3, spin: 1.6, spinAxis: "z" },
    { build: () => createDatabaseIcon(palette.accentBluePale), angle: Math.PI / 2, speed: 0.3, spin: 0.4, spinAxis: "y" },
    { build: () => createBranchNode(palette.grayDark), angle: Math.PI, speed: 0.3 },
    { build: () => createCloudIcon(palette.clothingLight), angle: (Math.PI * 3) / 2, speed: 0.3, spin: 0.25, spinAxis: "y" },
  ];
  const satellites: Satellite[] = satelliteDefs.map(({ build, angle, speed, spin, spinAxis }) => {
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(angle) * orbitRadius, Math.sin(angle) * orbitRadius, 0);
    pivot.add(build());
    ringPivot.add(pivot);
    return { pivot, radius: orbitRadius, speed, angle, spin, spinAxis };
  });

  // Counters the ring's own tilt so each satellite icon stays upright (in
  // world space) as it travels around the tilted orbit, instead of
  // foreshortening into an unrecognizable silhouette at some angles.
  const ringTiltInverse = ringPivot.quaternion.clone().invert();

  const shadow = createContactShadow(1.15, 0.6);
  shadow.position.set(0, -0.85, 0);
  scene.add(shadow);

  // Small drifting accent dots, echoing the hero scene's floating-docs dots.
  const dot = createDot(0.05, palette.accentBlue);
  dot.position.set(-1.85, 1.35, 0.5);
  scene.add(dot);

  const dot2 = createDot(0.04, palette.gray);
  dot2.position.set(1.95, -0.15, 0.3);
  scene.add(dot2);

  const restRotationY = composition.rotation.y;

  return {
    scene,
    camera,
    update(elapsed) {
      composition.position.y = 0.55 + Math.sin(elapsed * 0.7) * 0.02;
      composition.rotation.y = restRotationY + Math.sin(elapsed * 0.3) * 0.05;

      const blink = Math.floor(elapsed * 1.6) % 2 === 0;
      (codeWindow.cursor.material as THREE.MeshStandardMaterial).opacity = blink ? 1 : 0.12;

      satellites.forEach((satellite) => {
        const t = satellite.angle + elapsed * satellite.speed;
        satellite.pivot.position.set(Math.cos(t) * satellite.radius, Math.sin(t) * satellite.radius, 0);
        satellite.pivot.quaternion.copy(ringTiltInverse);
        if (satellite.spin) {
          const inner = satellite.pivot.children[0];
          if (inner) inner.rotation[satellite.spinAxis ?? "z"] = elapsed * satellite.spin;
        }
      });

      dot.position.y = 1.35 + Math.sin(elapsed * 0.9) * 0.03;
      dot2.position.y = -0.15 + Math.sin(elapsed * 0.9 + 1) * 0.03;
    },
    setTheme(dark) {
      lights.setTheme(dark);
      codeWindow.panelMaterial.color.set(dark ? palette.clothingDarkOnDark : palette.clothingDark);
      codeWindow.titleBarMaterial.color.set(dark ? palette.windowTitleBarOnDark : palette.windowTitleBar);
    },
    dispose() {
      disposeObject(scene);
    },
  };
}
