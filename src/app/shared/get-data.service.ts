import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GetDataService {
  constructor(private httpClient: HttpClient) {}

  getProjects(): Observable<any> {
    return this.httpClient.get('assets/data/projects.json');
  }
  getCertificates(): Observable<any> {
    return this.httpClient.get('assets/data/certificates.json');
  }
}
