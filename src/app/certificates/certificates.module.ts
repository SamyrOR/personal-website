import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { CertificatesRoutingModule } from './certificates-routing.module';
import { CertificatesComponent } from './certificates.component';

@NgModule({
  declarations: [CertificatesComponent],
  imports: [CommonModule, CertificatesRoutingModule, InfiniteScrollModule],
})
export class CertificatesModule {}
