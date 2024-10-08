import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AboutMeRoutingModule } from './about-me-routing.module';
import { AboutMeComponent } from './about-me.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [AboutMeComponent],
  imports: [CommonModule, AboutMeRoutingModule, TranslateModule.forChild()],
})
export class AboutMeModule {}
