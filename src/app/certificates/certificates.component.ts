import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { GetDataService } from '../shared/get-data.service';

@Component({
  selector: 'app-certificates',
  templateUrl: './certificates.component.html',
  styleUrls: ['./certificates.component.scss'],
})
export class CertificatesComponent implements OnInit {
  $organizations!: Observable<any>;

  constructor(private getData: GetDataService) {}

  ngOnInit(): void {
    this.$organizations = this.getData.getCertificates();
  }
}
