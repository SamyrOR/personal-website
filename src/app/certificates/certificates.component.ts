import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { GetDataService } from "../shared/get-data.service";
import { TranslatePipe } from "@ngx-translate/core";
@Component({
  selector: "app-certificates",
  templateUrl: "./certificates.component.html",
  styleUrls: ["./certificates.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class CertificatesComponent {
  private getData = inject(GetDataService);

  certificatesResource = rxResource({
    params: () => this.getData.currentLocale(),
    stream: ({ params }) => this.getData.getCertificates(params),
    defaultValue: [],
  });

  private openIndexes = signal<ReadonlySet<number>>(new Set());

  constructor() {
    // Collapse every accordion panel any time the underlying data changes
    // (initial load, or a locale switch refetch).
    effect(() => {
      this.certificatesResource.value();
      this.openIndexes.set(new Set());
    });
  }

  isOpen(index: number): boolean {
    return this.openIndexes().has(index);
  }

  toggle(index: number): void {
    const next = new Set(this.openIndexes());
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    this.openIndexes.set(next);
  }
}
