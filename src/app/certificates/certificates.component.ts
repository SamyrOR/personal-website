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
  handleLangChange!: Observable<Certificate[]>;
  changeLocaleEvent!: EventEmitter<LangChangeEvent>;
  subs: Subscription = new Subscription();
  initialData: Certificate[] = [];
  loading: boolean = true;
  actualLocale: string = '';

  constructor(
    private getData: GetDataService,
    private translateService: TranslateService,
  ) {
    this.actualLocale = this.translateService.currentLang;
  }

  ngOnInit(): void {
    const firstLoadSub = this.getData
      .getCertificates(this.actualLocale)
      .subscribe((data) => {
        this.organizations = data;
        this.initialData.push(this.organizations[0]);
        this.loading = false;
      });
    this.changeLocaleEvent = this.translateService.onLangChange;
    this.handleLangChange = this.changeLocaleEvent.pipe(
      switchMap((value: LangChangeEvent) => {
        this.actualLocale = value.lang;
        return this.getData.getCertificates(this.actualLocale);
      }),
    );

    const langChangSub = this.handleLangChange.subscribe(
      (certificates: Certificate[]) => {
        this.loading = true;
        this.organizations = certificates;
        this.initialData = [];
        this.initialData.push(this.organizations[0]);
        this.loading = false;
      },
    );

    this.subs.add(firstLoadSub);
    this.subs.add(langChangSub);
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
