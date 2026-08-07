import {
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
  inject,
  signal,
} from "@angular/core";
import { Observable, Subscription, switchMap } from "rxjs";
import { GetDataService } from "../shared/get-data.service";
import { Certificate } from "./models/certificate";
import { LangChangeEvent, TranslatePipe, TranslateService } from "@ngx-translate/core";
import { InfiniteScrollDirective } from "ngx-infinite-scroll";
@Component({
  selector: "app-certificates",
  templateUrl: "./certificates.component.html",
  styleUrls: ["./certificates.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InfiniteScrollDirective, TranslatePipe],
})
export class CertificatesComponent implements OnInit, OnDestroy {
  private getData = inject(GetDataService);
  private translateService = inject(TranslateService);

  organizations = signal<Certificate[]>([]);
  handleLocaleChange!: Observable<Certificate[]>;
  changeLocaleEvent!: Observable<LangChangeEvent>;
  subs = new Subscription();
  initialData = signal<Certificate[]>([]);
  loading = signal(true);
  currentLocale = this.translateService.currentLang();

  ngOnInit(): void {
    const firstLoadSub = this.getData
      .getCertificates(this.currentLocale)
      .subscribe((data) => {
        this.organizations.set(data);
        this.initialData.set([data[0]]);
        this.loading.set(false);
      });
    this.changeLocaleEvent = this.translateService.onLangChange;
    this.handleLocaleChange = this.changeLocaleEvent.pipe(
      switchMap((value: LangChangeEvent) => {
        this.currentLocale = value.lang;
        return this.getData.getCertificates(this.currentLocale);
      }),
    );

    const localeChangeSub = this.handleLocaleChange.subscribe(
      (certificates: Certificate[]) => {
        this.loading.set(true);
        this.organizations.set(certificates);
        this.initialData.set([certificates[0]]);
        this.loading.set(false);
      },
    );

    this.subs.add(firstLoadSub);
    this.subs.add(localeChangeSub);
  }
  //Infinite scroll
  onScroll() {
    const data = this.initialData();
    const all = this.organizations();
    if (data.length < all.length) {
      this.initialData.set([...data, all[data.length]]);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
