import { Component, OnInit, Version } from '@angular/core';
import { VERSION } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  version: Version = VERSION;

  constructor() { }

  ngOnInit(): void { }
}
