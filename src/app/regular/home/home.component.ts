import {
  Component,
  ElementRef,
  ChangeDetectionStrategy,
  inject,
  viewChildren,
  effect,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { NgOptimizedImage } from "@angular/common";
import { RouterLink } from "@angular/router";
import { TranslatePipe } from "@ngx-translate/core";
import { map } from "rxjs";
import { GetDataService } from "../../shared/get-data.service";
import { ThreeSceneComponent } from "../../shared/three-scene/three-scene.component";
import type { SceneBuilder } from "../../shared/three-scene/three-scene.types";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslatePipe, NgOptimizedImage, ThreeSceneComponent],
})
export class HomeComponent {
  private getData = inject(GetDataService);

  // Loaded via dynamic import() so three.js (and the scene-building code)
  // stays out of this eagerly-loaded landing route's bundle, fetched only
  // once a canvas actually mounts.
  heroSceneBuilder: SceneBuilder = (ctx) =>
    import("../../shared/three-scene/scenes/hero-scene").then((m) => m.buildHeroScene(ctx));
  techSceneBuilder: SceneBuilder = (ctx) =>
    import("../../shared/three-scene/scenes/tech-scene").then((m) => m.buildTechScene(ctx));
  mobileSceneBuilder: SceneBuilder = (ctx) =>
    import("../../shared/three-scene/scenes/mobile-scene").then((m) => m.buildMobileScene(ctx));
  certificateSceneBuilder: SceneBuilder = (ctx) =>
    import("../../shared/three-scene/scenes/certificate-scene").then((m) =>
      m.buildCertificateScene(ctx),
    );

  allProjects = viewChildren<ElementRef>("allProjects");

  projectsResource = rxResource({
    params: () => this.getData.currentLocale(),
    stream: ({ params }) =>
      //Get just a few projects
      this.getData.getProjects(params).pipe(map((projects) => projects.slice(0, 3))),
    defaultValue: [],
  });

  constructor() {
    // Re-wire the carousel any time the set of #allProjects elements changes
    // (initial render, or a locale switch re-rendering the @for with new data).
    // destroyCarousel() is safe to call even on the very first run - it just
    // no-ops on anything that doesn't exist yet.
    effect(() => {
      if (this.allProjects().length === 0) {
        return;
      }
      this.destroyCarousel();
      this.loadCarousel();
    });
  }

  destroyCarousel() {
    document
      .querySelectorAll(".carousel-container")
      .forEach((carousel: Element) => {
        // Remove number texts
        carousel.querySelectorAll(".numbertext").forEach((element) => {
          element.remove();
        });

        // Remove dots
        carousel.querySelector(".dots")?.remove();

        // Remove event listeners
        const prevButton = carousel.querySelector(".prev");
        const nextButton = carousel.querySelector(".next");
        const dots = carousel.querySelectorAll(".dot");

        if (prevButton) {
          prevButton.replaceWith(prevButton.cloneNode(true));
        }
        if (nextButton) {
          nextButton.replaceWith(nextButton.cloneNode(true));
        }
        dots.forEach((dot) => dot.replaceWith(dot.cloneNode(true)));

        // Hide all items
        carousel.querySelectorAll(".item").forEach((item) => {
          (item as HTMLElement).style.display = "none";
        });
      });
  }

  //Creat and load carousel functions
  loadCarousel() {
    document
      .querySelectorAll(".carousel-container")
      .forEach((carousel: Element) => {
        this.insertNumbers(carousel);

        carousel.querySelector(".prev")?.addEventListener("click", () => {
          this.minusItem(carousel);
        });

        carousel.querySelector(".next")?.addEventListener("click", () => {
          this.plusItem(carousel);
        });

        this.insertDots(carousel);

        carousel.querySelectorAll(".dot").forEach((dot: Element) => {
          dot.addEventListener("click", (e: Event) => {
            const item = Array.prototype.indexOf.call(
              (e.target as HTMLElement).parentNode?.children,
              e.target,
            );

            this.showItems(carousel, item);
          });
        });

        this.showItems(carousel, 0);
      });
  }

  insertNumbers(carousel: Element) {
    const length = carousel.querySelectorAll(".item").length;
    for (let i = 0; i < length; i++) {
      const nmbr = document.createElement("div");
      nmbr.classList.add("numbertext");
      nmbr.innerText = i + 1 + " / " + length;

      carousel.querySelectorAll(".item")[i].append(nmbr);
    }
  }

  insertDots(carousel: Element) {
    const dots = document.createElement("div");
    dots.classList.add("dots");

    carousel.append(dots);

    carousel.querySelectorAll(".item").forEach(() => {
      const dot = document.createElement("div");
      dot.classList.add("dot");

      carousel.querySelector(".dots")?.append(dot);
    });
  }

  currentItem(carousel: Element) {
    return [...carousel.querySelectorAll(".item")].findIndex(
      (item) => (item as HTMLElement).style.display == "block",
    );
  }

  showItems(carousel: Element, item: number) {
    if (
      carousel.querySelectorAll(".item")[this.currentItem(carousel)] !=
      undefined
    )
      (
        carousel.querySelectorAll(".item")[
        this.currentItem(carousel)
        ] as HTMLElement
      ).style.display = "none";
    (carousel.querySelectorAll(".item")[item] as HTMLElement).style.display =
      "block";

    if (carousel.querySelector(".dot.active") != null)
      carousel.querySelector(".dot.active")?.classList.remove("active");
    carousel.querySelectorAll(".dot")[item].classList.add("active");
  }

  plusItem(carousel: Element) {
    const item = this.currentItem(carousel);

    if (carousel.querySelectorAll(".item")[item].nextElementSibling?.classList.contains("item")) {
      this.showItems(carousel, item + 1);
    } else {
      this.showItems(carousel, 0);
    }
  }

  minusItem(carousel: Element) {
    const item = this.currentItem(carousel);

    if (carousel.querySelectorAll(".item")[item].previousElementSibling != null) {
      this.showItems(carousel, item - 1);
    } else {
      this.showItems(carousel, carousel.querySelectorAll(".item").length - 1);
    }
  }
}
