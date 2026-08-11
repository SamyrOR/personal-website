import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  input,
  afterNextRender,
  DestroyRef,
  inject,
} from "@angular/core";
// Type-only: three.js's runtime is loaded via dynamic import() in init() so
// it lands in its own lazy chunk instead of the eagerly-loaded home bundle.
import type * as ThreeNS from "three";
import type { SceneBuilder, SceneHandle } from "./three-scene.types";

@Component({
  selector: "app-three-scene",
  templateUrl: "./three-scene.component.html",
  styleUrls: ["./three-scene.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThreeSceneComponent {
  build = input.required<SceneBuilder>();

  private canvasRef =
    viewChild.required<ElementRef<HTMLCanvasElement>>("canvas");
  private destroyRef = inject(DestroyRef);
  private destroyed = false;

  constructor() {
    // WebGL setup needs real layout (getBoundingClientRect) and browser APIs,
    // so it's deferred to the post-render browser phase rather than done eagerly.
    afterNextRender(() => void this.init());
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
    });
  }

  private isDark(): boolean {
    return document.documentElement.classList.contains("dark-theme");
  }

  private async init(): Promise<void> {
    const canvas = this.canvasRef().nativeElement;
    const host = canvas.parentElement ?? canvas;

    const THREE: typeof ThreeNS = await import("three");
    if (this.destroyed) {
      return;
    }

    // Some browsers/environments (WebGL disabled, headless test runners, very
    // old devices) can't create a context at all — degrade to an empty,
    // decorative canvas instead of throwing.
    let renderer: ThreeNS.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const handle: SceneHandle = await this.build()({ isDark: this.isDark() });
    if (this.destroyed) {
      handle.dispose?.();
      renderer.dispose();
      return;
    }

    const resize = (): void => {
      const { width, height } = host.getBoundingClientRect();
      if (width === 0 || height === 0) {
        return;
      }
      handle.camera.aspect = width / height;
      handle.camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);

    let visible = true;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.01 },
    );
    intersectionObserver.observe(canvas);

    const themeObserver = new MutationObserver(() => {
      handle.setTheme?.(this.isDark());
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const reduceMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    let reduceMotion = reduceMotionQuery.matches;
    const onReduceMotionChange = (event: MediaQueryListEvent): void => {
      reduceMotion = event.matches;
    };
    reduceMotionQuery.addEventListener("change", onReduceMotionChange);

    const clock = new THREE.Clock();
    let frameId = 0;
    const renderFrame = (): void => {
      frameId = requestAnimationFrame(renderFrame);
      if (!visible) {
        return;
      }
      const delta = clock.getDelta();
      if (!reduceMotion) {
        handle.update(clock.elapsedTime, delta);
      }
      renderer.render(handle.scene, handle.camera);
    };
    renderFrame();

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      reduceMotionQuery.removeEventListener("change", onReduceMotionChange);
      handle.dispose?.();
      renderer.dispose();
    });
  }
}
