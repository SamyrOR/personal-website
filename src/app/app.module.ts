import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegularModule } from './regular/regular.module';

import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  TranslateLoader,
  TranslateModule,
  TranslatePipe,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

const I18N_CONFIG = {
  defaultLanguage: 'pt_BR',
  loader: {
    provide: TranslateLoader,
    useFactory: HttpLoaderFactory,
    deps: [HttpClient],
  },
};

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    RegularModule,
    BrowserModule,
    AppRoutingModule,
    TranslateModule.forRoot(I18N_CONFIG),
  ],
  providers: [provideHttpClient(withInterceptorsFromDi()), TranslatePipe],
})
export class AppModule {}
