import * as THREE from "three";
import type { SceneBuildContext, SceneHandle } from "../three-scene.types";
import { palette } from "./palette";
import {
  createDot,
  createLights,
  addLights,
  createContactShadow,
  material,
  disposeObject,
} from "./props";

/** A rounded-rectangle outline, used for the phone frame/screen and card panels. */
function roundedRectShape(
  width: number,
  height: number,
  radius: number,
): THREE.Shape {
  const w = width / 2;
  const h = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w + radius, -h);
  shape.lineTo(w - radius, -h);
  shape.absarc(w - radius, -h + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(w, h - radius);
  shape.absarc(w - radius, h - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(-w + radius, h);
  shape.absarc(-w + radius, h - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w, -h + radius);
  shape.absarc(-w + radius, -h + radius, radius, Math.PI, 1.5 * Math.PI, false);
  shape.closePath();
  return shape;
}

function roundedPanel(
  width: number,
  height: number,
  radius: number,
  color: number,
  roughness = 0.8,
): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.ShapeGeometry(roundedRectShape(width, height, radius)),
    material(color, roughness),
  );
}

/**
 * The centerpiece: a phone with a real rounded silhouette (extruded from a
 * rounded-rect profile, not a sharp-cornered slab), a proper status bar,
 * an image-placeholder card, and a floating-action button fully contained
 * within the frame — built with the same "one bold, detailed centerpiece"
 * treatment as the hero scene's laptop and the tech scene's code window.
 */
function createPhone(): THREE.Group {
  const group = new THREE.Group();

  const frameDepth = 0.11;
  const frameGeometry = new THREE.ExtrudeGeometry(
    roundedRectShape(1.28, 2.35, 0.16),
    {
      depth: frameDepth,
      bevelEnabled: false,
    },
  );
  frameGeometry.center();
  const frame = new THREE.Mesh(frameGeometry, material(palette.gray, 0.7));
  group.add(frame);

  const screen = roundedPanel(1.14, 2.18, 0.12, palette.white, 0.95);
  screen.position.z = frameDepth / 2 + 0.001;
  group.add(screen);

  const notch = roundedPanel(0.32, 0.05, 0.025, palette.clothingDark, 0.4);
  notch.position.set(0, 1.02, frameDepth / 2 + 0.01);
  group.add(notch);

  // Status bar: time indicator, signal bars, battery — evenly spaced with
  // clear margins so it reads as a row, not scattered noise.
  const statusY = 0.9;
  const statusMat = material(palette.grayDark, 0.7);
  const timeDot = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.03, 0.01),
    statusMat,
  );
  timeDot.position.set(-0.48, statusY, frameDepth / 2 + 0.01);
  group.add(timeDot);

  [0, 1, 2].forEach((i) => {
    const barHeight = 0.028 + i * 0.022;
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, barHeight, 0.01),
      statusMat,
    );
    bar.position.set(
      0.3 + i * 0.05,
      statusY - 0.045 + barHeight / 2,
      frameDepth / 2 + 0.01,
    );
    group.add(bar);
  });

  const batteryOutline = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.05, 0.01),
    statusMat,
  );
  batteryOutline.position.set(0.5, statusY, frameDepth / 2 + 0.01);
  group.add(batteryOutline);
  const batteryFill = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.032, 0.012),
    material(palette.accentBlue, 0.5),
  );
  batteryFill.position.set(0.488, statusY, frameDepth / 2 + 0.015);
  group.add(batteryFill);
  const batteryNub = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.02, 0.01),
    statusMat,
  );
  batteryNub.position.set(0.562, statusY, frameDepth / 2 + 0.01);
  group.add(batteryNub);

  // App header: a title bar with a menu icon in a subtle rounded chip.
  const titleBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.05, 0.01),
    material(palette.grayDark, 0.6),
  );
  titleBar.position.set(-0.32, 0.78, frameDepth / 2 + 0.01);
  group.add(titleBar);

  const menuChip = roundedPanel(0.16, 0.16, 0.04, palette.gray, 0.8);
  menuChip.position.set(0.46, 0.78, frameDepth / 2 + 0.008);
  group.add(menuChip);
  const menuMat = material(palette.accentBlue, 0.6);
  [0, 1, 2].forEach((i) => {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.014, 0.01),
      menuMat,
    );
    bar.position.set(0.46, 0.81 - i * 0.03, frameDepth / 2 + 0.012);
    group.add(bar);
  });

  // Image-placeholder card: a bordered panel with a small "sun" dot and a
  // mountain glyph, the conventional broken/loading-image icon pairing.
  const imageCard = roundedPanel(1.02, 0.52, 0.05, palette.gray, 0.85);
  imageCard.position.set(0, 0.4, frameDepth / 2 + 0.005);
  group.add(imageCard);

  const sun = createDot(0.035, palette.accentBluePale);
  sun.position.set(-0.34, 0.53, frameDepth / 2 + 0.012);
  group.add(sun);

  const mountainShape = new THREE.Shape();
  mountainShape.moveTo(-0.42, 0.19);
  mountainShape.lineTo(-0.12, 0.42);
  mountainShape.lineTo(0.08, 0.24);
  mountainShape.lineTo(0.42, 0.5);
  mountainShape.lineTo(0.42, 0.17);
  mountainShape.lineTo(-0.42, 0.17);
  mountainShape.closePath();
  const mountain = new THREE.Mesh(
    new THREE.ShapeGeometry(mountainShape),
    material(palette.grayDark, 0.9),
  );
  mountain.position.z = frameDepth / 2 + 0.012;
  group.add(mountain);

  const textBoxOutline = roundedPanel(1.0, 0.32, 0.04, palette.gray, 0.8);
  textBoxOutline.position.set(0, -0.15, frameDepth / 2 + 0.005);
  group.add(textBoxOutline);
  [0.05, -0.05].forEach((y, i) => {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(i === 1 ? 0.55 : 0.75, 0.03, 0.01),
      material(palette.accentBlue, 0.6),
    );
    line.position.set(-0.15, -0.15 + y, frameDepth / 2 + 0.015);
    group.add(line);
  });

  const wideBox = roundedPanel(1.0, 0.5, 0.04, palette.gray, 0.8);
  wideBox.position.set(0, -0.65, frameDepth / 2 + 0.005);
  group.add(wideBox);
  [0.13, 0.0, -0.13].forEach((y) => {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.025, 0.01),
      material(palette.grayDark, 0.8),
    );
    line.position.set(0, -0.65 + y, frameDepth / 2 + 0.015);
    group.add(line);
  });

  const homeIndicator = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.02, 0.01),
    material(palette.grayDark, 0.6),
  );
  homeIndicator.position.set(0, -1.05, frameDepth / 2 + 0.01);
  group.add(homeIndicator);

  const plusButton = new THREE.Group();
  plusButton.position.set(0.44, -0.9, frameDepth / 2 + 0.03);
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.05, 20),
    material(palette.accentBlue, 0.5),
  );
  disc.rotation.x = Math.PI / 2;
  plusButton.add(disc);
  const plusMat = material(palette.paper, 0.6);
  const barH = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.026, 0.026),
    plusMat,
  );
  const barV = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.14, 0.026),
    plusMat,
  );
  barH.position.z = 0.03;
  barV.position.z = 0.03;
  plusButton.add(barH, barV);
  group.add(plusButton);

  return group;
}

/** A push-notification bell with an unread badge. */
function createNotificationBell(): { group: THREE.Group; badge: THREE.Mesh } {
  const group = new THREE.Group();

  const profile = [
    new THREE.Vector2(0.0, 0.12),
    new THREE.Vector2(0.035, 0.09),
    new THREE.Vector2(0.06, 0.04),
    new THREE.Vector2(0.085, -0.02),
    new THREE.Vector2(0.1, -0.06),
    new THREE.Vector2(0.12, -0.09),
    new THREE.Vector2(0.07, -0.1),
    new THREE.Vector2(0.0, -0.09),
  ];
  const bellGeometry = new THREE.LatheGeometry(profile, 10);
  bellGeometry.computeVertexNormals();
  const body = new THREE.Mesh(bellGeometry, material(palette.accentBlue, 0.55));
  group.add(body);

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.02, 8, 6),
    material(palette.accentBlue, 0.55),
  );
  knob.position.y = 0.13;
  group.add(knob);

  const clapper = createDot(0.025, palette.grayDark);
  clapper.position.y = -0.14;
  group.add(clapper);

  const badge = createDot(0.045, palette.accentRed);
  badge.position.set(0.11, 0.13, 0.06);
  group.add(badge);

  return { group, badge };
}

/** A map/location pin. */
function createLocationPin(): THREE.Group {
  const group = new THREE.Group();
  const pinMat = material(palette.accentRed, 0.55);

  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 1), pinMat);
  head.position.y = 0.06;
  group.add(head);

  const point = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.16, 8), pinMat);
  point.position.y = -0.08;
  point.rotation.x = Math.PI;
  group.add(point);

  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(0.04, 12),
    material(palette.paper, 0.6),
  );
  hole.position.set(0, 0.06, 0.095);
  group.add(hole);

  return group;
}

/** A home-screen app icon: a rounded tile with a simple glyph. */
function createAppIcon(color: number): THREE.Group {
  const group = new THREE.Group();
  const tile = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.22, 0.03),
    material(color, 0.6),
  );
  group.add(tile);

  const glyphShape = new THREE.Shape();
  glyphShape.moveTo(-0.035, 0.045);
  glyphShape.lineTo(-0.035, -0.045);
  glyphShape.lineTo(0.045, 0);
  glyphShape.closePath();
  const glyph = new THREE.Mesh(
    new THREE.ShapeGeometry(glyphShape),
    material(palette.paper, 0.6),
  );
  glyph.position.set(-0.005, 0, 0.017);
  group.add(glyph);

  return group;
}

export function buildMobileScene({ isDark }: SceneBuildContext): SceneHandle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.35, 6.8);
  camera.lookAt(0, 0.15, 0);

  const lights = createLights(isDark);
  addLights(scene, lights);

  // The phone is the sole, centered focal point, scaled up to fill the
  // frame while still keeping its full height (including the home
  // indicator) within the camera's visible range.
  const phone = createPhone();
  phone.scale.setScalar(1.4);
  phone.position.set(0, 0.15, 0);
  scene.add(phone);

  // Sits just beneath the phone's true bottom edge, not partway up its face.
  const shadow = createContactShadow(0.9, 0.38);
  shadow.position.set(0, -1.5, 0);
  scene.add(shadow);

  // Mobile-specific concepts floating beside the phone, echoing the hero
  // scene's floating-docs treatment: a push notification, a location pin,
  // and a home-screen app icon.
  const bell = createNotificationBell();
  bell.group.scale.setScalar(1.7);
  bell.group.position.set(-1.75, 1.15, 0.35);
  bell.group.rotation.set(0.05, 0.3, -0.1);
  scene.add(bell.group);

  const pin = createLocationPin();
  pin.scale.setScalar(1.7);
  pin.position.set(1.7, 0.75, 0.3);
  pin.rotation.set(0, -0.3, 0.08);
  scene.add(pin);

  const appIcon = createAppIcon(palette.accentBluePale);
  appIcon.scale.setScalar(1.7);
  appIcon.position.set(-1.55, 0.35, 0.5);
  appIcon.rotation.set(0.1, 0.3, 0.05);
  scene.add(appIcon);

  // Small drifting accent dots, echoing the hero scene's floating-docs dots.
  const dot = createDot(0.05, palette.accentBlue);
  dot.position.set(1.1, 1.7, 0.35);
  scene.add(dot);

  const dot2 = createDot(0.04, palette.gray);
  dot2.position.set(-1.05, -0.75, 0.3);
  scene.add(dot2);

  const restBellRotation = bell.group.rotation.clone();
  const restPinRotation = pin.rotation.clone();
  const restAppIconRotation = appIcon.rotation.clone();

  return {
    scene,
    camera,
    update(elapsed) {
      phone.rotation.y = Math.sin(elapsed * 0.35) * 0.06;

      bell.group.position.y = 1.15 + Math.sin(elapsed * 1.4) * 0.07;
      bell.group.rotation.z =
        restBellRotation.z + Math.sin(elapsed * 2.6) * 0.14;
      bell.badge.scale.setScalar(1 + Math.sin(elapsed * 3.5) * 0.2);

      pin.position.y = 0.75 + Math.sin(elapsed * 1.3 + 1) * 0.07;
      pin.rotation.y = restPinRotation.y + Math.sin(elapsed * 0.9) * 0.18;

      appIcon.position.y = 0.35 + Math.sin(elapsed * 1.5 + 2) * 0.06;
      // A bounded sway rather than a full spin — a flat tile rotated all the
      // way around briefly edge-on to the camera, shrinking to an
      // near-invisible sliver partway through the loop.
      appIcon.rotation.y =
        restAppIconRotation.y + Math.sin(elapsed * 0.6) * 0.35;

      dot.position.y = 1.7 + Math.sin(elapsed * 1.4) * 0.08;
      dot2.position.y = -0.75 + Math.sin(elapsed * 1.4 + 1) * 0.08;
    },
    setTheme(dark) {
      lights.setTheme(dark);
    },
    dispose() {
      disposeObject(scene);
    },
  };
}
