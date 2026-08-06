import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { ProjectsRoutingModule } from "./projects-routing.module";
import { ProjectsComponent } from "./projects.component";
import { TranslatePipe } from "@ngx-translate/core";

@NgModule({
  declarations: [ProjectsComponent],
  imports: [CommonModule, ProjectsRoutingModule, TranslatePipe],
})
export class ProjectsModule { }
