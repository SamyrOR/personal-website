import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from './home/home.component';
import { RouterModule } from '@angular/router';
import { NotFoundComponent } from './not-found/not-found.component';

@NgModule({
  declarations: [
    HeaderComponent,
    FooterComponent,
    HomeComponent,
    NotFoundComponent,
  ],
  imports: [CommonModule, FormsModule, RouterModule],
  exports: [HeaderComponent, FooterComponent],
})
export class RegularModule {}
