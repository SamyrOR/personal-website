import {
  Component,
  ElementRef,
  ChangeDetectionStrategy,
  inject,
  viewChild,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { NgOptimizedImage } from "@angular/common";
import { GetDataService } from "../shared/get-data.service";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  selector: "app-projects",
  templateUrl: "./projects.component.html",
  styleUrls: ["./projects.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, NgOptimizedImage],
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

  onClick(e: MouseEvent) {
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
