import { Component, OnInit, Version, ChangeDetectionStrategy } from '@angular/core';
import { VERSION } from '@angular/core';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FooterComponent implements OnInit {
  version: Version = VERSION;
  year: number = new Date().getFullYear();

  constructor() {}

  ngOnInit(): void {}
}
