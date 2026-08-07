import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { TranslateService } from "@ngx-translate/core";
import { Observable, map } from "rxjs";
import { Projects } from "./project";
import { Certificate } from "../certificates/models/certificate";

@Injectable({
  providedIn: "root",
})
export class GetDataService {
  private httpClient = inject(HttpClient);
  private translateService = inject(TranslateService);

  currentLocale = toSignal(
    this.translateService.onLangChange.pipe(map((event) => event.lang)),
    { initialValue: this.translateService.currentLang() ?? "pt_BR" },
  );

  getProjects(locale: string | null): Observable<Projects[]> {
    return this.httpClient.get<Projects[]>(
      `assets/data/projects/projects_${locale}.json`,
    );
  }
  getCertificates(locale: string | null): Observable<Certificate[]> {
    return this.httpClient.get<Certificate[]>(
      `assets/data/certificates/certificates_${locale}.json`,
    );
  }
}
