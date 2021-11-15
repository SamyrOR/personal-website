import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { GetDataService } from '../shared/get-data.service';
import { Certificate } from './models/certificate';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.scss'],
})
export class CertificatesComponent implements OnInit, OnDestroy {
  organizations: Certificate[] = [];
  subs!: Subscription;
  initialData: Certificate[] = [];
  loading: boolean = true;

  constructor(private getData: GetDataService) {}

  ngOnInit(): void {
    this.subs = this.getData.getCertificates().subscribe((data) => {
      this.organizations = data;
      this.initialData.push(this.organizations[0]);
      this.loading = false;
    });
  }
  //Infinite scroll
  onScroll() {
    if (this.initialData.length < this.organizations.length) {
      this.initialData.push(this.organizations[this.initialData.length]);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
