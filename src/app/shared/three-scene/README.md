# Three.js on the home page — a walkthrough

This explains how the four animated home-page scenes (`hero`, `tech`, `mobile`, `certificate`) work: the Three.js concepts they use, and how the whole thing is wired into Angular. It's written as a learning doc, not just a reference — if you're new to Three.js, read it top to bottom.

## 1. The four building blocks of any Three.js app

Every Three.js app, no matter how complex, is made of the same four things:

1. **`Scene`** — a container/tree of everything you want to draw. Think of it as the "world."
2. **`Camera`** — a viewpoint into that world. We use `PerspectiveCamera` everywhere (mimics how a real camera/eye sees things: closer objects look bigger, parallel lines converge).
3. **`Renderer`** — takes a scene + a camera and rasterizes them onto a `<canvas>` using WebGL. We use `WebGLRenderer`.
4. **Objects** — meshes, lights, groups — things you add to the scene.

The minimum loop looks like this (simplified from what `three-scene.component.ts` actually does):

```ts
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const renderer = new THREE.WebGLRenderer({ canvas });

scene.add(someMesh);

function renderFrame() {
  requestAnimationFrame(renderFrame);
  renderer.render(scene, camera);
}
renderFrame();
```

`requestAnimationFrame` is what makes it a *loop* — the browser calls your function right before the next repaint (~60 times a second), so calling `renderer.render()` there re-draws the scene every frame. If you also move things between renders, you get animation.

## 2. A `Mesh` is Geometry + Material

This is the single most important idea in Three.js:

```ts
const mesh = new THREE.Mesh(geometry, material);
```

- **Geometry** = the *shape* — a list of vertices (points in 3D space) and how they connect into triangles. `BoxGeometry`, `CylinderGeometry`, `IcosahedronGeometry`, etc. are just pre-built vertex generators.
- **Material** = how the surface *looks* — color, roughness, whether it reacts to light, etc.

The same geometry with two different materials looks completely different; the same material on two different geometries just changes shape. They're independent, which is why Three.js always asks for both.

### The material used everywhere here: `MeshStandardMaterial` + `flatShading`

Every single surface in these scenes is built through one tiny helper, `material()` in [`scenes/props.ts`](./scenes/props.ts):

```ts
export function material(color: number, roughness = 0.7): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
}
```

- `MeshStandardMaterial` reacts to scene lighting (it needs light sources to be visible at all — unlike `MeshBasicMaterial`, which ignores light and is only used once, for the flat contact-shadow disc).
- `roughness` (0–1) controls how sharp vs. diffuse reflections are. Low = shiny/plasticky, high = matte/chalky. Everything here sits around 0.5–0.9 for a soft, non-shiny illustration look.
- **`flatShading: true`** is the single setting that gives the whole site its "low-poly" aesthetic. Normally Three.js *smooths* lighting across a surface (interpolating normals between vertices) so a sphere looks round. `flatShading` instead lights each triangle as one flat facet, so you see the actual polygon faces — that's what makes the gear, the trophy, the phone all read as deliberately geometric/faceted rather than "low-res smooth."

## 3. Building shapes: primitives vs. custom profiles

### Primitives

Most props are just off-the-shelf geometry primitives, scaled and positioned: `BoxGeometry` (panels, bars, buttons), `CylinderGeometry` (the database icon's disks, the gear's core), `IcosahedronGeometry` (the little accent dots — a 20-sided sphere reads as "low-poly ball"), `ConeGeometry` (the bell body, the location pin's point), `TorusGeometry` (the trophy handles, the tech scene's orbit ring).

### Custom 2D outlines: `Shape` → `ShapeGeometry` / `ExtrudeGeometry`

When no primitive matches (a star, a mountain glyph, a rounded-corner rectangle), we draw a 2D outline with `THREE.Shape` — basically an SVG-path API — and then either:

- **`ShapeGeometry`** — fills it flat (zero thickness). Used for the "\</\>" code badge, the mountain-and-sun image-placeholder icon, the star.
- **`ExtrudeGeometry`** — same outline, pushed out to a given depth, so it becomes a solid. Used for the phone's frame (see below) and the certificate scene's 3D star.

Example — the phone's rounded corners, from [`scenes/mobile-scene.ts`](./scenes/mobile-scene.ts):

```ts
function roundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const w = width / 2, h = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-w + radius, -h);
  shape.lineTo(w - radius, -h);
  shape.absarc(w - radius, -h + radius, radius, -Math.PI / 2, 0, false); // rounded corner
  // ...three more lineTo/absarc pairs for the other three corners
  shape.closePath();
  return shape;
}

const frameGeometry = new THREE.ExtrudeGeometry(roundedRectShape(1.28, 2.35, 0.16), {
  depth: 0.11,
  bevelEnabled: false,
});
```

`absarc` draws an arc (an actual curve, not a polygon approximation you'd have to fake) at each corner, and `ExtrudeGeometry` pushes the whole 2D outline into a 3D slab with real depth and side walls. This is *why* the phone looks like an actual device now instead of a sharp-cornered box — the very first version used a plain `BoxGeometry`, which can't have rounded corners at all.

### Custom profiles: `LatheGeometry`

A lathe takes a 2D profile (a line from the shape's axis outward) and spins it 360° around the Y axis — exactly like a woodworking lathe, or how you'd throw a pot on a wheel. It's the tool for anything radially symmetric but *not* a uniform cylinder/sphere: the trophy cup, the certificate's paisley blob, the notification bell.

From [`scenes/mobile-scene.ts`](./scenes/mobile-scene.ts) — the bell:

```ts
const profile = [
  new THREE.Vector2(0.0, 0.12),   // (radius, height) pairs, top to bottom
  new THREE.Vector2(0.035, 0.09),
  new THREE.Vector2(0.06, 0.04),
  new THREE.Vector2(0.085, -0.02),
  new THREE.Vector2(0.1, -0.06),
  new THREE.Vector2(0.12, -0.09),  // the widest point — the bell's flared mouth
  new THREE.Vector2(0.07, -0.1),   // tucks back in — the underside of the lip
  new THREE.Vector2(0.0, -0.09),
];
const bellGeometry = new THREE.LatheGeometry(profile, 10); // 10 = radial segments (facets)
```

Each `Vector2(radius, height)` is one point on the outline; Three.js connects them and spins the result around. The `10` is how many straight segments approximate the circle — low numbers (we mostly use 8–12) keep the faceted low-poly look instead of a smooth circle.

*(This module went through a couple of iterations worth knowing about, if you read the git history: the certificate blob started as a sphere with per-vertex noise displacement, which looked like a bumpy ball rather than the reference illustration's teardrop/paisley shape — switching to a lathe profile fixed that. The notification bell started as a plain cone, which read as a triangle, not a bell — same fix, a lathe profile with a proper flared curve.)*

## 4. Composition: `Group`, parent/child transforms, and a neat trick

`THREE.Object3D` (the base class for `Mesh`, `Group`, `Scene`, `Light`, everything) has `.position`, `.rotation`, and `.scale`. When you `parent.add(child)`, the child's transform becomes *relative to its parent* — move/rotate the parent, and everything nested inside follows, in its own local coordinate space.

This is used constantly to build compound objects: the laptop is a `Group` containing a base, a hinged screen (itself a nested `Group` so it can rotate around its hinge point independent of the base), and a keyboard lip. The phone's plus-button is a `Group` of a disc + two bars so it can be positioned as one unit.

### The orbit-ring trick (tech scene)

The tech scene's four satellite icons (gear, database, cloud, commit-graph) travel around a **tilted** ring. The naive approach — parent each icon under the tilted ring group and just update its position — has a bug: because the icon *inherits* the ring's tilt rotation, at certain points in the orbit the icon's own "up" direction ends up pointing almost straight at the camera, so a flat/asymmetric icon foreshortens into an unrecognizable sliver.

The fix, in [`scenes/tech-scene.ts`](./scenes/tech-scene.ts), is to precompute the *inverse* of the ring's rotation and re-apply it to each satellite every frame, cancelling the inherited tilt out:

```ts
const ringPivot = new THREE.Group();
ringPivot.rotation.set(1.2, 0.05, 0.25); // the ring's fixed tilt

// ... satellites added as children of ringPivot ...

const ringTiltInverse = ringPivot.quaternion.clone().invert();

// in the render loop, every frame:
satellite.pivot.position.set(Math.cos(t) * radius, Math.sin(t) * radius, 0); // move along the orbit
satellite.pivot.quaternion.copy(ringTiltInverse); // ...but stay upright in world space
```

Quaternions are how Three.js represents rotation internally (they avoid the "gimbal lock" problems Euler angles — x/y/z rotation in degrees — can have). You rarely need to touch them directly, but "undo a parent's rotation" is exactly the kind of thing they're good for: multiplying a rotation by its own inverse always gives you back "no rotation," so the satellite ends up oriented as if it had no parent tilt at all, while still correctly inheriting the parent's *position* offset.

## 5. Animation: the render loop and `elapsed` time

`three-scene.component.ts` owns the actual loop:

```ts
const clock = new THREE.Clock();
function renderFrame() {
  requestAnimationFrame(renderFrame);
  if (!visible) return; // paused when scrolled off-screen, see §7
  const delta = clock.getDelta();
  if (!reduceMotion) handle.update(clock.elapsedTime, delta);
  renderer.render(handle.scene, handle.camera);
}
```

`clock.elapsedTime` is total seconds since the clock started — every scene's `update(elapsed)` callback gets that single number and derives *all* motion from it, rather than tracking its own counters. That's what makes the bobbing/swaying animations so short to write: nearly every moving part in every scene is one line shaped like

```ts
thing.position.y = restY + Math.sin(elapsed * speed + phaseOffset) * amplitude;
```

`Math.sin` oscillates smoothly between -1 and 1 forever, so `restY + sin(...) * amplitude` is a value that smoothly bobs up and down around `restY` by `amplitude` units, at a rate controlled by `speed`. Adding a `phaseOffset` shifts *when* in the cycle that particular object starts, which is why e.g. the two floating dots in each scene don't bob perfectly in sync with each other — they use the same formula with different offsets, which reads as more natural/organic than everything moving in lockstep.

The tech scene's blinking cursor uses a *square* wave instead, for a crisp on/off blink rather than a fade:

```ts
const blink = Math.floor(elapsed * 1.6) % 2 === 0;
material.opacity = blink ? 1 : 0.12;
```

## 6. Lighting

`MeshStandardMaterial` needs light to be visible. Every scene calls the same [`createLights()`](./scenes/props.ts) helper:

```ts
const ambient = new THREE.AmbientLight(0xffffff, ...);   // uniform light from everywhere, no shadows/direction
const key = new THREE.DirectionalLight(0xffffff, ...);   // the "sun" — casts from one direction, creates the facet shading
const fill = new THREE.DirectionalLight(0xbfd4ff, 0.35);  // a dimmer, cool-tinted light from the opposite side, softens the shadow side
```

This is a classic three-point-lighting simplification: one strong directional "key" light creates the actual shading definition (the reason each low-poly facet reads as a distinct flat plane — you can *see* each triangle because the key light hits it at a slightly different angle than its neighbor), a dim opposite-colored "fill" light keeps the shadow side from going pure black, and ambient light provides a light-independent baseline so nothing is ever fully unlit.

Both directional lights' `intensity` gets nudged slightly higher in dark theme (`setTheme(isDark)` on the returned lights object) since the page background is darker and needs a bit more punch to read clearly.

## 7. How this plugs into Angular

### The generic component: `ThreeSceneComponent`

There's exactly **one** Angular component for all four scenes — [`three-scene.component.ts`](./three-scene.component.ts). It doesn't know anything about laptops or phones; it just knows how to host a `<canvas>`, hand it to a caller-supplied "scene builder" function, and run the render loop. That's the whole point of the `SceneBuilder`/`SceneHandle` contract in [`three-scene.types.ts`](./three-scene.types.ts):

```ts
export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  update(elapsed: number, delta: number): void;
  setTheme?(isDark: boolean): void;
  dispose?(): void;
}
export type SceneBuilder = (ctx: SceneBuildContext) => SceneHandle | Promise<SceneHandle>;
```

Each `scenes/*-scene.ts` file exports one `buildXScene()` function matching that shape. `home.component.ts` hands a different builder to each `<app-three-scene [build]="...">` instance:

```html
<app-three-scene [build]="heroSceneBuilder" />
```

```ts
heroSceneBuilder: SceneBuilder = (ctx) =>
  import("../../shared/three-scene/scenes/hero-scene").then((m) => m.buildHeroScene(ctx));
```

This is standard Angular: `input.required<SceneBuilder>()` (a signal input) takes the builder in, and the component is otherwise 100% reusable.

### Why `import()` instead of a normal `import` statement

That inline `import("...")` is a **dynamic import**, and it's load-bearing for performance, not a style choice. A `HomeComponent` fires up as the site's landing route, so its JS bundle ships eagerly on first load. Three.js's core alone is ~578KB unminified — if `hero-scene.ts` had a normal top-of-file `import * as THREE from "three"` and `home.component.ts` statically imported that file, the bundler would have no choice but to fold all of it into the landing page's initial bundle, blowing well past this project's 500KB budget.

Dynamic `import()` tells the Angular/esbuild bundler "put this in its own lazy chunk, and only fetch it when this line of code actually runs." Since the line only runs inside `ThreeSceneComponent.init()` (itself gated behind `afterNextRender`, see below), three.js and each scene's code only download once a `<canvas>` actually mounts in the browser — never during the initial page load's critical path. The production build confirms this split (`npm run build` output): `three-module`, `hero-scene`, `tech-scene`, etc. all show up as separate small lazy chunks, and the landing page's own initial bundle stays under 180KB.

### `afterNextRender` — deferring to the browser phase

```ts
constructor() {
  afterNextRender(() => void this.init());
}
```

WebGL setup needs a real, laid-out DOM element to measure (`canvas.getBoundingClientRect()` for sizing) and browser-only APIs (`WebGLRenderer`, `ResizeObserver`...) that don't exist during server-side rendering. `afterNextRender` is Angular's hook for "run this once, after the first render has actually painted to the browser" — the correct place for this kind of imperative, browser-only initialization.

### Keeping the canvas correctly sized: `ResizeObserver`

```ts
const resize = () => {
  const { width, height } = host.getBoundingClientRect();
  handle.camera.aspect = width / height;
  handle.camera.updateProjectionMatrix(); // must be called for the aspect change to take effect
  renderer.setSize(width, height, false);
};
resize();
new ResizeObserver(resize).observe(host);
```

`ResizeObserver` fires whenever the element's actual layout size changes (window resize, but also just CSS/flex layout reflow) — much more reliable for a component than listening to the window `resize` event, since it reacts to *this specific element's* box, not the viewport.

### Not rendering what nobody can see: `IntersectionObserver`

```ts
let visible = true;
new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.01 })
  .observe(canvas);
// ...
if (!visible) return; // inside the render loop
```

All four scenes exist on the same long landing page — most of them are scrolled out of view most of the time. `IntersectionObserver` cheaply tracks whether the canvas is even in the viewport, and the render loop just skips `update()`/`render()` entirely while it isn't. `requestAnimationFrame` keeps ticking (so it resumes instantly once scrolled back into view) but does zero GPU work while off-screen.

### Reacting to the dark/light theme toggle: `MutationObserver`

This site's theme state lives as a CSS class (`dark-theme`/`light-theme`) on `<html>`, toggled by `HeaderComponent` — there's no shared Angular signal for it. So the cheapest way for an unrelated component to react to it is to literally watch that one attribute:

```ts
new MutationObserver(() => handle.setTheme?.(this.isDark()))
  .observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
```

Each scene's optional `setTheme(isDark)` then does whatever it needs to — nudge light intensities, and, for the hero/tech scenes specifically, swap a material's `.color` to a lighter variant so the laptop/terminal body doesn't blend into a dark page background (see `palette.clothingDarkOnDark` in [`scenes/palette.ts`](./scenes/palette.ts)).

### Respecting `prefers-reduced-motion`

```ts
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
let reduceMotion = reduceMotionQuery.matches;
reduceMotionQuery.addEventListener("change", (e) => { reduceMotion = e.matches; });
// ...
if (!reduceMotion) handle.update(clock.elapsedTime, delta);
```

If the user's OS is set to reduce motion, `update()` (and therefore all the bobbing/swaying/spinning) is simply skipped every frame — the scene still renders once, statically, but nothing animates. `renderer.render()` still runs, so the scene is visible; it just doesn't move.

### Cleanup: why every listener gets undone

```ts
this.destroyRef.onDestroy(() => {
  cancelAnimationFrame(frameId);
  resizeObserver.disconnect();
  intersectionObserver.disconnect();
  themeObserver.disconnect();
  reduceMotionQuery.removeEventListener("change", onReduceMotionChange);
  handle.dispose?.();
  renderer.dispose();
});
```

Every observer/listener registered in `init()` is undone here, using Angular's `DestroyRef` (fired when the component is torn down — e.g. navigating away from the page). Skipping this would leak: the render loop would keep running forever in the background, observers would keep firing callbacks against a component that no longer exists, and — the one gap this project actually had until a recent pass — the GPU-side geometry/material buffers Three.js allocated would never be freed.

That last one is worth calling out because it's an easy trap: garbage-collecting the JS objects (`THREE.Mesh`, `THREE.BufferGeometry`, ...) does **not** free their underlying WebGL buffers. Three.js requires an explicit `.dispose()` call on every geometry and material. Each scene now implements this via a shared helper in `props.ts`:

```ts
export function disposeObject(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    obj.geometry.dispose();
    const mat = obj.material;
    Array.isArray(mat) ? mat.forEach((m) => m.dispose()) : mat.dispose();
  });
}
```

`.traverse()` walks every descendant of a node (the whole scene graph, in this case) and calls your function on each one — so a single `disposeObject(scene)` call in each scene's `dispose()` frees everything, no matter how deeply nested the groups are.

## 8. File map

```
three-scene/
├── three-scene.types.ts       SceneBuildContext / SceneHandle / SceneBuilder — the contract
├── three-scene.component.ts   the one generic <canvas> host: init, resize, visibility,
│                               theme, reduced-motion, render loop, cleanup
├── three-scene.component.html just a <canvas>
├── three-scene.component.scss canvas fills its host, host fills its CSS box
└── scenes/
    ├── palette.ts             the fixed illustration color palette (+ 2 dark-theme
    │                           variants for the laptop/terminal body, see §7)
    ├── props.ts                shared building blocks: material(), createLights(),
    │                           createDot(), createDocumentCard(), createContactShadow(),
    │                           disposeObject()
    ├── hero-scene.ts           laptop + floating docs
    ├── tech-scene.ts           code-editor window + orbiting gear/database/cloud/commit-graph
    ├── mobile-scene.ts         phone + floating bell/pin/app-icon
    └── certificate-scene.ts    certificate document + floating trophy/star/graduation-cap
```

Every `scenes/*-scene.ts` file follows the same shape: one or more `createX()` functions that build and return a `THREE.Group` (pure geometry construction, no animation logic), and one `buildXScene({ isDark })` function that assembles those groups into a scene, sets up the camera, and returns the `SceneHandle` — camera + scene + an `update()` closure that reads whatever local variables it needs from the enclosing scope.

## 9. Where to go next

- [threejs.org/manual](https://threejs.org/manual/) — the official manual, written exactly like this doc (concept, then code).
- [threejs.org/docs](https://threejs.org/docs/) — API reference for every class mentioned above (`Shape`, `LatheGeometry`, `Quaternion`, etc.) — worth reading the actual docs page for anything you want to tweak.
- Try changing numbers first: open `hero-scene.ts`, tweak the `Math.sin(elapsed * 0.7) * 0.02` bob amplitude/speed on the laptop, save, and watch it change live (`npm start`). That's the fastest way to build intuition for how these parameters map to motion.
