import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ContactRoutingModule } from "./contact-routing.module";
import { ContactComponent } from "./contact.component";
import { TranslatePipe } from "@ngx-translate/core";

@NgModule({
  declarations: [ContactComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ContactRoutingModule,
    TranslatePipe,
  ],
})
export class ContactModule { }
