import { enableProdMode, provideZoneChangeDetection } from "@angular/core";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideTranslateService } from "@ngx-translate/core";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppModule, {
  providers: [
    provideZoneChangeDetection(),
    provideTranslateService({ fallbackLang: "en", lang: "en" }),
  ],
}).catch((err) => console.error(err));
