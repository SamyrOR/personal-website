import {
  Component,
  ElementRef,
  ChangeDetectionStrategy,
  inject,
  viewChild,
  signal,
  computed,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { NgOptimizedImage } from "@angular/common";
import { GetDataService } from "../shared/get-data.service";
import { TranslatePipe } from "@ngx-translate/core";
import {
  TagFilterComponent,
  TagOption,
} from "../shared/tag-filter/tag-filter.component";

@Component({
  selector: "app-projects",
  templateUrl: "./projects.component.html",
  styleUrls: ["./projects.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, NgOptimizedImage, TagFilterComponent],
})
export class ProjectsComponent {
  private getData = inject(GetDataService);

  cards = viewChild<ElementRef>("cards");
  zindex = 10;

  projectsResource = rxResource({
    params: () => this.getData.currentLocale(),
    stream: ({ params }) => this.getData.getProjects(params),
    defaultValue: [],
  });

  selectedTags = signal<ReadonlySet<string>>(new Set());

  availableTags = computed<TagOption[]>(() => {
    const counts = new Map<string, number>();
    for (const project of this.projectsResource.value()) {
      for (const tag of project.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, count }));
  });

  filteredProjects = computed(() => {
    const selected = this.selectedTags();
    const projects = this.projectsResource.value();
    if (selected.size === 0) {
      return projects;
    }
    return projects.filter((project) =>
      project.tags.some((tag) => selected.has(tag)),
    );
  });

  // Kept stable across filtering (which reorders `filteredProjects` while
  // reusing the same tracked objects) so NgOptimizedImage's `priority`
  // input never flips on an already-rendered image.
  firstProject = computed(() => this.projectsResource.value()[0] ?? null);

  onClick(e: Event) {
    const cards = this.cards()!.nativeElement;
    const card = e.currentTarget as HTMLElement;
    let isShowing = false;
    if (card.classList.contains("show")) {
      isShowing = true;
    }
    if (cards.classList.contains("showing")) {
      const showingCard = document.querySelector("div.card.show");
      showingCard?.classList.remove("show");
      if (isShowing) {
        cards.classList.remove("showing");
      } else {
        card.style.zIndex = this.zindex.toString();
        card.classList.add("show");
      }
      this.zindex++;
    } else {
      cards.classList.add("showing");
      card.style.zIndex = this.zindex.toString();
      card.classList.add("show");
      this.zindex++;
    }
  }
}
