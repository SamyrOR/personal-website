import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CertificatesRoutingModule } from './certificates-routing.module';
import { CertificatesComponent } from './certificates.component';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

@NgModule({
  declarations: [CertificatesComponent],
  imports: [CommonModule, CertificatesRoutingModule, InfiniteScrollModule],
})
export class CertificatesModule {}
