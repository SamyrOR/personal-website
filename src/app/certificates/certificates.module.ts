import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { CertificatesRoutingModule } from './certificates-routing.module';
import { CertificatesComponent } from './certificates.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [CertificatesComponent],
  imports: [
    CommonModule,
    CertificatesRoutingModule,
    InfiniteScrollDirective,
    TranslateModule.forChild(),
  ],
})
export class CertificatesModule { }
