import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegularModule } from './regular/regular.module';

import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [RegularModule, BrowserModule, AppRoutingModule],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class AppModule { }
