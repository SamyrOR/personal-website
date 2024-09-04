import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about-me',
  templateUrl: './about-me.component.html',
  styleUrls: ['./about-me.component.scss'],
})
export class AboutMeComponent implements OnInit {
  _actualYear: number = new Date().getFullYear();
  _startYear: number = 2022;
  yearsOfExperience: String = `${this._actualYear - this._startYear}`;
  constructor() {}

  ngOnInit(): void {}
}
