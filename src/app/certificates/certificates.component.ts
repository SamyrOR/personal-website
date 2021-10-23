import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GetDataService } from '../shared/get-data.service';
import { Projects } from '../shared/project';
import { Certificate } from './models/certificate';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.scss'],
})
export class CertificatesComponent implements OnInit {
  $organizations: Certificate[] = [];
  initialData!: any;
  loading: boolean = true;

  constructor(private getData: GetDataService) {}

  ngOnInit(): void {
    // this.$organizations = this.getData.getCertificates();
    this.getData.getCertificates().subscribe((data) => {
      this.$organizations.push(data[0]);
      console.log(this.$organizations);
    });
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }
}
