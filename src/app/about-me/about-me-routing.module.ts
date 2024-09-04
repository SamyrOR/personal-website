import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AboutMeComponent } from './about-me.component';
import { TranslateModule } from '@ngx-translate/core';

const routes: Routes = [
  { path: '', component: AboutMeComponent, data: { title: 'Sobre mim' } },
];

@NgModule({
  imports: [RouterModule.forChild(routes), TranslateModule.forChild()],
  exports: [RouterModule],
})
export class AboutMeRoutingModule {}
