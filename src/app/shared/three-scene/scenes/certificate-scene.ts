import * as THREE from "three";
import type { SceneBuildContext, SceneHandle } from "../three-scene.types";
import { palette } from "./palette";
import { createDot, createLights, addLights, createContactShadow, material, disposeObject } from "./props";

function createWavyLine(width: number, amplitude: number, color: number): THREE.Mesh {
  const points: THREE.Vector3[] = [];
  const segments = 10;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = -width / 2 + width * t;
    const y = Math.sin(t * Math.PI * 3 + t) * amplitude * (0.4 + Math.sin(t * 7) * 0.6);
    points.push(new THREE.Vector3(x, y, 0));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 32, 0.014, 5, false);
  return new THREE.Mesh(geometry, material(color, 0.7));
}

function starShape(outerRadius: number, innerRadius: number, points = 5): THREE.Shape {
  const shape = new THREE.Shape();
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * step - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

/** A ribboned award seal — a medallion with a star and two notched ribbon tails. */
function createSeal(): THREE.Group {
  const group = new THREE.Group();

  const ribbonShape = new THREE.Shape();
  ribbonShape.moveTo(-0.045, 0.14);
  ribbonShape.lineTo(0.045, 0.14);
  ribbonShape.lineTo(0.045, -0.1);
  ribbonShape.lineTo(0, -0.17);
  ribbonShape.lineTo(-0.045, -0.1);
  ribbonShape.closePath();
  const ribbonMat = material(palette.accentRed, 0.6);
  const ribbonLeft = new THREE.Mesh(new THREE.ShapeGeometry(ribbonShape), ribbonMat);
  ribbonLeft.position.set(-0.05, -0.1, -0.01);
  ribbonLeft.rotation.z = 0.22;
  group.add(ribbonLeft);
  const ribbonRight = new THREE.Mesh(new THREE.ShapeGeometry(ribbonShape), ribbonMat);
  ribbonRight.position.set(0.05, -0.1, -0.01);
  ribbonRight.rotation.z = -0.22;
  group.add(ribbonRight);

  const medallion = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 16), material(palette.accentBlue, 0.5));
  medallion.rotation.x = Math.PI / 2;
  group.add(medallion);

  const star = new THREE.Mesh(new THREE.ShapeGeometry(starShape(0.08, 0.035)), material(palette.paper, 0.5));
  star.position.z = 0.018;
  group.add(star);

  return group;
}

/**
 * The centerpiece: a certificate of completion — a bordered paper panel with
 * a title, body text, a handwritten signature, and a ribboned seal — built
 * with the same "one bold, detailed centerpiece" treatment as the hero
 * scene's laptop and the tech scene's code window, but standing for the
 * actual achievement the certificates page is about.
 */
function createCertificateDocument(): THREE.Group {
  const group = new THREE.Group();

  const border = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.7, 0.03), material(palette.accentBlue, 0.6));
  group.add(border);

  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.6, 0.04), material(palette.paper, 0.9));
  panel.position.z = 0.01;
  group.add(panel);

  const title = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.075, 0.015), material(palette.clothingDark, 0.6));
  title.position.set(0, 0.62, 0.035);
  group.add(title);

  const subtitle = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, 0.015), material(palette.accentBlue, 0.6));
  subtitle.position.set(0, 0.48, 0.035);
  group.add(subtitle);

  const bodyLines: { y: number; width: number }[] = [
    { y: 0.26, width: 0.95 },
    { y: 0.15, width: 0.88 },
    { y: 0.04, width: 0.92 },
    { y: -0.07, width: 0.6 },
  ];
  bodyLines.forEach(({ y, width }) => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(width, 0.028, 0.012), material(palette.gray, 0.8));
    line.position.set(0, y, 0.032);
    group.add(line);
  });

  const signature = createWavyLine(0.4, 0.06, palette.clothingDark);
  signature.position.set(-0.32, -0.38, 0.032);
  group.add(signature);

  const signatureLine = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.01, 0.01), material(palette.gray, 0.8));
  signatureLine.position.set(-0.32, -0.5, 0.032);
  group.add(signatureLine);

  const nameLine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.022, 0.012), material(palette.grayDark, 0.8));
  nameLine.position.set(-0.32, -0.58, 0.032);
  group.add(nameLine);

  const seal = createSeal();
  seal.position.set(0.42, -0.62, 0.05);
  group.add(seal);

  return group;
}

/** A classic award trophy: a lathed cup on a stem and base, with two handles. */
function createTrophy(): THREE.Group {
  const group = new THREE.Group();
  const mat = material(palette.accentBluePale, 0.5);

  const profile = [
    new THREE.Vector2(0.08, -0.2),
    new THREE.Vector2(0.1, -0.18),
    new THREE.Vector2(0.075, -0.16),
    new THREE.Vector2(0.025, -0.08),
    new THREE.Vector2(0.025, 0.02),
    new THREE.Vector2(0.1, 0.06),
    new THREE.Vector2(0.14, 0.14),
    new THREE.Vector2(0.1, 0.19),
    new THREE.Vector2(0.0, 0.19),
  ];
  const geometry = new THREE.LatheGeometry(profile, 10);
  geometry.computeVertexNormals();
  group.add(new THREE.Mesh(geometry, mat));

  [-1, 1].forEach((side) => {
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12), mat);
    handle.position.set(side * 0.14, 0.09, 0);
    handle.rotation.y = Math.PI / 2;
    group.add(handle);
  });

  return group;
}

/** A graduation cap: a flat board on a band, with a hanging tassel. */
function createGraduationCap(color: number): THREE.Group {
  const group = new THREE.Group();
  const mat = material(color, 0.55);

  const board = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.26), mat);
  board.position.y = 0.05;
  group.add(board);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.07, 10), mat);
  band.position.y = -0.01;
  group.add(band);

  const button = createDot(0.018, palette.accentBlue);
  button.position.set(0, 0.062, 0);
  group.add(button);

  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.14, 5), mat);
  cord.position.set(0.1, -0.02, 0);
  cord.rotation.z = -0.35;
  group.add(cord);

  const tuft = createDot(0.03, color);
  tuft.position.set(0.14, -0.09, 0);
  group.add(tuft);

  return group;
}

export function buildCertificateScene({ isDark }: SceneBuildContext): SceneHandle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0.55, 7.2);
  camera.lookAt(0, 0.35, 0);

  const lights = createLights(isDark);
  addLights(scene, lights);

  const composition = new THREE.Group();
  composition.position.set(0, 0.35, 0);
  scene.add(composition);

  const document_ = createCertificateDocument();
  document_.scale.setScalar(1.2);
  composition.add(document_);

  const shadow = createContactShadow(0.95, 0.42);
  shadow.position.set(0, -0.95, 0);
  scene.add(shadow);

  // Achievement concepts floating beside the certificate, echoing the hero
  // scene's floating-docs treatment: a trophy, a star, and a graduation cap.
  const trophy = createTrophy();
  trophy.scale.setScalar(1.7);
  trophy.position.set(-1.55, 0.75, 0.4);
  trophy.rotation.set(0.05, 0.35, -0.05);
  scene.add(trophy);

  const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(0.12, 0.05), { depth: 0.03, bevelEnabled: false }), material(palette.accentBlue, 0.5));
  star.scale.setScalar(1.7);
  star.position.set(1.55, 0.95, 0.35);
  star.rotation.set(0.1, 0.2, 0.15);
  scene.add(star);

  const cap = createGraduationCap(palette.grayDark);
  cap.scale.setScalar(1.7);
  cap.position.set(1.65, 0.15, 0.3);
  cap.rotation.set(0.1, -0.3, 0.05);
  scene.add(cap);

  // Small drifting accent dots, echoing the hero scene's floating-docs dots.
  const dot = createDot(0.05, palette.accentBlue);
  dot.position.set(-1.15, 1.55, 0.35);
  scene.add(dot);

  const dot2 = createDot(0.04, palette.gray);
  dot2.position.set(1.0, -0.7, 0.3);
  scene.add(dot2);

  const restCapRotationY = cap.rotation.y;

  return {
    scene,
    camera,
    update(elapsed) {
      composition.position.y = 0.35 + Math.sin(elapsed * 0.7) * 0.015;
      composition.rotation.y = Math.sin(elapsed * 0.3) * 0.04;

      trophy.position.y = 0.75 + Math.sin(elapsed * 1.3) * 0.07;
      trophy.rotation.y = 0.35 + Math.sin(elapsed * 0.8) * 0.22;

      star.position.y = 0.95 + Math.sin(elapsed * 1.4 + 1) * 0.07;
      star.rotation.z += 0.006;

      cap.position.y = 0.15 + Math.sin(elapsed * 1.3 + 2) * 0.06;
      cap.rotation.y = restCapRotationY + Math.sin(elapsed * 0.9) * 0.18;

      dot.position.y = 1.55 + Math.sin(elapsed * 1.4) * 0.08;
      dot2.position.y = -0.7 + Math.sin(elapsed * 1.4 + 1) * 0.08;
    },
    setTheme(dark) {
      lights.setTheme(dark);
    },
    dispose() {
      disposeObject(scene);
    },
  };
}
