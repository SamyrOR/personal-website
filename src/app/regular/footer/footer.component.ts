import { Component, Version, ChangeDetectionStrategy } from '@angular/core';
import { VERSION } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, RouterLinkActive, TranslatePipe],
})
export class FooterComponent {
  version: Version = VERSION;
  year: number = new Date().getFullYear();
}
