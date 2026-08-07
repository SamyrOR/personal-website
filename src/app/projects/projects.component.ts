import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { NgOptimizedImage } from "@angular/common";
import { Observable, Subscription, switchMap } from "rxjs";
import { GetDataService } from "../shared/get-data.service";
import { Projects } from "../shared/project";
import { LangChangeEvent, TranslatePipe, TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-projects",
  templateUrl: "./projects.component.html",
  styleUrls: ["./projects.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, NgOptimizedImage],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private getData = inject(GetDataService);
  private translateService = inject(TranslateService);

  cards = viewChild<ElementRef>("cards");
  projectsList = signal<Projects[]>([]);
  subs = new Subscription();
  loading = signal(true);
  zindex = 10;
  currentLocale = this.translateService.currentLang();
  changeLocaleEvent!: Observable<LangChangeEvent>;
  handleLocaleChange!: Observable<Projects[]>;

  ngOnInit(): void {
    const firstLoadSub = this.getData
      .getProjects(this.currentLocale)
      .subscribe((projects) => {
        this.projectsList.set(projects);
        this.loading.set(false);
      });

    this.changeLocaleEvent = this.translateService.onLangChange;
    this.handleLocaleChange = this.changeLocaleEvent.pipe(
      switchMap((value: LangChangeEvent) => {
        this.currentLocale = value.lang;
        return this.getData.getProjects(this.currentLocale);
      }),
    );
    const localeChangeSub = this.handleLocaleChange.subscribe(
      (projects: Projects[]) => {
        this.loading.set(true);
        this.projectsList.set(projects);
        this.loading.set(false);
      },
    );

    this.subs.add(firstLoadSub);
    this.subs.add(localeChangeSub);
  }

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

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
