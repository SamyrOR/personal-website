import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { RegularModule } from './regular/regular.module';
import { CertificatesComponent } from './certificates/certificates.component';
import { ProjectsComponent } from './projects/projects.component';
import { AboutMeComponent } from './about-me/about-me.component';
import { ContactComponent } from './contact/contact.component';

@NgModule({
  declarations: [AppComponent, CertificatesComponent, ProjectsComponent, AboutMeComponent, ContactComponent],
  imports: [RegularModule, BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
