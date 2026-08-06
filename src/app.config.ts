import { enableProdMode, provideZoneChangeDetection } from "@angular/core";

import { environment } from "./environments/environment";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideTranslateService } from "@ngx-translate/core";
import { provideHttpClient } from "@angular/common/http";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { AppComponent } from "./app/app.component";
import { provideRouter } from "@angular/router";
import { routes } from "./app/app.routes";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: "/assets/i18n/",
        suffix: ".json",
      }),
      fallbackLang: "en_US",
      lang: "en_US",
    }),
  ],
}).catch((err) => console.error(err));
