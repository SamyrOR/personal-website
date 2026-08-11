import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
} from "@angular/core";
import { Title } from "@angular/platform-browser";
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from "@angular/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { filter, map } from "rxjs/operators";
import { HeaderComponent } from "./regular/header/header.component";
import { FooterComponent } from "./regular/footer/footer.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, FooterComponent, RouterOutlet],
  providers: [TranslatePipe],
})
export class AppComponent implements OnInit {
  private titleService = inject(Title);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private translateService = inject(TranslateService);

  ngOnInit(): void {
    //Dynamic title
    this.setDynamicTitle();
    //Translation
    this.translateService.use(localStorage.getItem("lang") || "pt_BR");
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
          if (child?.snapshot.data["title"]) {
            return child.snapshot.data["title"];
          }
          return appTitle;
        }),
      )
      .subscribe((ttl: string) => {
        this.titleService.setTitle(`>_DEV - ${ttl}`);
      });
  }
}
