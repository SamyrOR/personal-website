import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { GetDataService } from "../shared/get-data.service";
import { Certificate } from "./models/certificate";
import { TranslatePipe } from "@ngx-translate/core";
import { InfiniteScrollDirective } from "ngx-infinite-scroll";
@Component({
  selector: "app-certificates",
  templateUrl: "./certificates.component.html",
  styleUrls: ["./certificates.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InfiniteScrollDirective, TranslatePipe],
})
export class CertificatesComponent {
  private getData = inject(GetDataService);

  certificatesResource = rxResource({
    params: () => this.getData.currentLocale(),
    stream: ({ params }) => this.getData.getCertificates(params),
    defaultValue: [],
  });

  initialData = signal<Certificate[]>([]);

  constructor() {
    // Reset the incrementally-revealed infinite-scroll subset any time the
    // underlying data changes (initial load, or a locale switch refetch).
    effect(() => {
      const data = this.certificatesResource.value();
      this.initialData.set(data.length ? [data[0]] : []);
    });
  }

  //Infinite scroll
  onScroll() {
    const data = this.initialData();
    const all = this.certificatesResource.value();
    if (data.length < all.length) {
      this.initialData.set([...data, all[data.length]]);
    }
  }
}
