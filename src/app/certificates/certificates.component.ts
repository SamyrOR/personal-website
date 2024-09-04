import { Component, EventEmitter, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, switchMap } from 'rxjs';
import { GetDataService } from '../shared/get-data.service';
import { Certificate } from './models/certificate';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.scss'],
})
export class CertificatesComponent implements OnInit, OnDestroy {
  organizations: Certificate[] = [];
  handleLocaleChange!: Observable<Certificate[]>;
  changeLocaleEvent!: EventEmitter<LangChangeEvent>;
  subs = new Subscription();
  initialData: Certificate[] = [];
  loading: boolean = true;
  currentLocale: string = this.translateService.currentLang;

  constructor(
    private getData: GetDataService,
    private translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    const firstLoadSub = this.getData
      .getCertificates(this.currentLocale)
      .subscribe((data) => {
        this.organizations = data;
        this.initialData.push(this.organizations[0]);
        this.loading = false;
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
        this.loading = true;
        this.organizations = certificates;
        this.initialData = [];
        this.initialData.push(this.organizations[0]);
        this.loading = false;
      },
    );

    this.subs.add(firstLoadSub);
    this.subs.add(localeChangeSub);
  }
  //Infinite scroll
  onScroll() {
    if (this.initialData.length < this.organizations.length) {
      this.initialData.push(this.organizations[this.initialData.length]);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
