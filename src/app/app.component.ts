import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private titleService: Title,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
  ) {}

  ngOnInit(): void {
    //Dynamic title
    this.setDynamicTitle();
    //Translation
    this.translateService.setDefaultLang('pt_BR');
    this.translateService.use(localStorage.getItem('lang') || 'pt_BR');
  }

  private setDynamicTitle() {
    const appTitle = this.titleService.getTitle();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let child = this.activatedRoute.firstChild;
          while (child?.firstChild) {
            child = child.firstChild;
          }
          if (child?.snapshot.data['title']) {
            return child.snapshot.data['title'];
          }
          return appTitle;
        }),
      )
      .subscribe((ttl: string) => {
        this.titleService.setTitle(`>_DEV - ${ttl}`);
      });
  }
}
