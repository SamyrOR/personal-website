import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class GetDataService {
  constructor(private httpClient: HttpClient) {}

  getProjects() {
    return this.httpClient.get('assets/projects.json');
  }
}
