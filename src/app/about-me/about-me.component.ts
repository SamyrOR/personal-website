import { Component, ChangeDetectionStrategy } from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";

@Component({
  selector: "app-about-me",
  templateUrl: "./about-me.component.html",
  styleUrls: ["./about-me.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class AboutMeComponent {
  _actualYear: number = new Date().getFullYear();
  _startYear = 2022;
  yearsOfExperience = `${this._actualYear - this._startYear}`;
}
