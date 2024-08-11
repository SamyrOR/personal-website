import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Projects } from './project';
import { Certificate } from '../certificates/models/certificate';

@Injectable({
  providedIn: 'root',
})
export class GetDataService {
  constructor(private httpClient: HttpClient) {}

  getProjects(): Observable<Projects[]> {
    return this.httpClient.get<Projects[]>('assets/data/projects.json');
  }
  getCertificates(): Observable<Certificate[]> {
    return this.httpClient.get<Certificate[]>('assets/data/certificates.json');
  }
}
