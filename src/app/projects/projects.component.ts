import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Observable, Subscription, switchMap } from 'rxjs';
import { GetDataService } from '../shared/get-data.service';
import { Projects } from '../shared/project';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  @ViewChild('cards') cards!: ElementRef;
  projectsList!: Projects[];
  subs = new Subscription();
  loading: boolean = true;
  zindex: number = 10;
  currentLocale: string = this.translateService.currentLang;
  changeLocaleEvent!: EventEmitter<LangChangeEvent>;
  handleLocaleChange!: Observable<Projects[]>;

  constructor(
    private getData: GetDataService,
    private translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    const firstLoadSub = this.getData
      .getProjects(this.currentLocale)
      .subscribe((projects) => {
        this.projectsList = projects;
        this.loading = false;
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
        this.loading = true;
        this.projectsList = projects;
        this.loading = false;
      },
    );

    this.subs.add(firstLoadSub);
    this.subs.add(localeChangeSub);
  }

  onClick(e: MouseEvent) {
    let cards = this.cards.nativeElement;
    let card = e.currentTarget as HTMLElement;
    let isShowing = false;
    if (card.classList.contains('show')) {
      isShowing = true;
    }
    if (cards.classList.contains('showing')) {
      let showingCard = document.querySelector('div.card.show');
      showingCard?.classList.remove('show');
      if (isShowing) {
        cards.classList.remove('showing');
      } else {
        card.style.zIndex = this.zindex.toString();
        card.classList.add('show');
      }
      this.zindex++;
    } else {
      cards.classList.add('showing');
      card.style.zIndex = this.zindex.toString();
      card.classList.add('show');
      this.zindex++;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
