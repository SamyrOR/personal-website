import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    NotFoundComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TranslateModule.forChild(),
  ],
  exports: [HeaderComponent, FooterComponent],
})
export class RegularModule {}
