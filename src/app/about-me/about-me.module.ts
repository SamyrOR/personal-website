import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { AboutMeRoutingModule } from "./about-me-routing.module";
import { AboutMeComponent } from "./about-me.component";
import { TranslateLoader } from "@ngx-translate/core";

@NgModule({
  declarations: [AboutMeComponent],
  imports: [CommonModule, AboutMeRoutingModule, TranslateLoader],
})
export class AboutMeModule { }
