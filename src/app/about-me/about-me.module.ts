import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutMeComponent } from './about-me.component';
import { AboutMeRoutingModule } from './aboute-me-routing.module';

@NgModule({
  declarations: [AboutMeComponent],
  imports: [CommonModule, AboutMeRoutingModule],
})
export class AboutMeModule {}
