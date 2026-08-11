import * as THREE from "three";
import type { SceneBuildContext, SceneHandle } from "../three-scene.types";
import { palette } from "./palette";
import { createDocumentCard, createDot, createLights, createColorTween, addLights, createContactShadow, material, disposeObject } from "./props";

function createLaptop(): { group: THREE.Group; bodyMaterial: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();

  // Shared by every dark laptop-body part so a single color swap (see
  // setTheme below) relights the whole laptop at once.
  const bodyMat = material(palette.clothingDark, 0.6);

  const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1.0), bodyMat);
  group.add(base);

  const hinge = new THREE.Group();
  hinge.position.set(0, 0.03, -0.48);
  // The bezel/screen sit vertically (along +Y) in the hinge's own local
  // space at rotation 0, so a small tilt is enough for a naturally open,
  // slightly-reclined laptop screen — a large rotation here folds it back
  // down toward horizontal instead of opening it.
  hinge.rotation.x = -0.22;
  group.add(hinge);

  const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.05), bodyMat);
  bezel.position.set(0, 0.5, 0);
  hinge.add(bezel);

  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 0.86), material(palette.paper, 0.9));
  screen.position.set(0, 0.5, 0.027);
  hinge.add(screen);

  const triangleShape = new THREE.Shape();
  triangleShape.moveTo(-0.68, -0.43);
  triangleShape.lineTo(0.2, -0.43);
  triangleShape.lineTo(-0.68, 0.43);
  triangleShape.closePath();
  const triangle = new THREE.Mesh(new THREE.ShapeGeometry(triangleShape), material(palette.gray, 0.9));
  triangle.position.set(0, 0.5, 0.03);
  hinge.add(triangle);

  const circle = new THREE.Mesh(new THREE.CircleGeometry(0.18, 24), material(palette.accentBlue, 0.5));
  circle.position.set(-0.25, 0.36, 0.032);
  hinge.add(circle);

  const barMat = material(palette.grayDark, 0.7);
  [0.72, 0.63, 0.54].forEach((y, i) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(i === 2 ? 0.22 : 0.42, 0.035, 0.01), barMat);
    bar.position.set(0.28, y, 0.032);
    hinge.add(bar);
  });

  const icon = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.012), material(palette.accentBlue, 0.5));
  icon.position.set(0.58, 0.85, 0.032);
  hinge.add(icon);

  const keyboardLip = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.03, 0.06), bodyMat);
  keyboardLip.position.set(0, 0.02, 0.52);
  group.add(keyboardLip);

  return { group, bodyMaterial: bodyMat };
}

function createFloatingDocs(): THREE.Group {
  const group = new THREE.Group();

  const doc1 = createDocumentCard({ width: 0.34, height: 0.24, paperColor: palette.paper, lineColor: palette.accentBlue });
  doc1.position.set(-1.55, 1.5, 0.1);
  doc1.rotation.set(0.1, 0.3, 0.15);
  group.add(doc1);

  const doc2 = createDocumentCard({ width: 0.24, height: 0.3, paperColor: palette.accentBluePale, lineColor: palette.clothingDark, lines: 2 });
  doc2.position.set(-1.75, 1.8, -0.15);
  doc2.rotation.set(-0.1, -0.25, -0.2);
  group.add(doc2);

  const dot = createDot(0.05, palette.accentBlue);
  dot.position.set(-1.9, 1.25, 0.05);
  group.add(dot);

  const dot2 = createDot(0.04, palette.gray);
  dot2.position.set(1.85, 1.5, -0.3);
  group.add(dot2);

  return group;
}

export function buildHeroScene({ isDark }: SceneBuildContext): SceneHandle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0.05, 1.15, 6.4);
  camera.lookAt(0.05, 0.7, 0);

  const lights = createLights(isDark);
  addLights(scene, lights);

  // The laptop is the sole, centered focal point of the composition now
  // that the figure has been removed — scaled up to fill the frame.
  const laptop = createLaptop();
  laptop.group.scale.setScalar(1.75);
  laptop.group.position.set(0, -0.05, 0);
  laptop.group.rotation.y = -0.22;
  laptop.bodyMaterial.color.set(isDark ? palette.clothingDarkOnDark : palette.clothingDark);
  scene.add(laptop.group);

  const shadow = createContactShadow(1.1, 0.65);
  shadow.position.set(0, -0.68, 0);
  scene.add(shadow);

  const docs = createFloatingDocs();
  scene.add(docs);

  const restLaptopRotationY = laptop.group.rotation.y;
  const bodyColorTween = createColorTween(laptop.bodyMaterial);

  return {
    scene,
    camera,
    update(elapsed, delta) {
      laptop.group.position.y = -0.05 + Math.sin(elapsed * 0.7) * 0.02;
      laptop.group.rotation.y = restLaptopRotationY + Math.sin(elapsed * 0.4) * 0.03;

      docs.children.forEach((child, i) => {
        child.position.y += Math.sin(elapsed * (0.8 + i * 0.2)) * 0.0006;
        child.rotation.y += 0.004 + i * 0.001;
      });

      lights.update(delta * 1000);
      bodyColorTween.update(delta * 1000);
    },
    setTheme(dark, instant) {
      lights.setTheme(dark, instant);
      bodyColorTween.to(dark ? palette.clothingDarkOnDark : palette.clothingDark, instant);
    },
    dispose() {
      disposeObject(scene);
    },
  };
}
