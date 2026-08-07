import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  selector: "app-about-me",
  templateUrl: "./about-me.component.html",
  styleUrls: ["./about-me.component.scss"],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe],
})
export class AboutMeComponent implements OnInit {
  _actualYear: number = new Date().getFullYear();
  _startYear = 2022;
  yearsOfExperience = `${this._actualYear - this._startYear}`;
  constructor() { }

  ngOnInit(): void { }
}
