import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GetDataService {
  constructor(private httpClient: HttpClient) {}

  getProjects(): Observable<Object> {
    return this.httpClient.get('assets/data/projects.json');
  }
  getCertificates(): Observable<any> {
    return this.httpClient.get('assets/data/certificates.json');
  }
}
