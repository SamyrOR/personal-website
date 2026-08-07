import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect,
  computed,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { GetDataService } from "../shared/get-data.service";
import { TranslatePipe } from "@ngx-translate/core";
import {
  TagFilterComponent,
  TagOption,
} from "../shared/tag-filter/tag-filter.component";
@Component({
  selector: "app-certificates",
  templateUrl: "./certificates.component.html",
  styleUrls: ["./certificates.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, TagFilterComponent],
})
export class CertificatesComponent {
  private getData = inject(GetDataService);

  certificatesResource = rxResource({
    params: () => this.getData.currentLocale(),
    stream: ({ params }) => this.getData.getCertificates(params),
    defaultValue: [],
  });

  selectedTags = signal<ReadonlySet<string>>(new Set());

  availableTags = computed<TagOption[]>(() => {
    const counts = new Map<string, number>();
    for (const organization of this.certificatesResource.value()) {
      for (const certificate of organization.certificates) {
        for (const tag of certificate.tags) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1);
        }
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, count }));
  });

  filteredOrganizations = computed(() => {
    const selected = this.selectedTags();
    const organizations = this.certificatesResource.value();
    if (selected.size === 0) {
      return organizations;
    }
    return organizations
      .map((organization) => ({
        ...organization,
        certificates: organization.certificates.filter((certificate) =>
          certificate.tags.some((tag) => selected.has(tag)),
        ),
      }))
      .filter((organization) => organization.certificates.length > 0);
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
    return this.selectedTags().size > 0 || this.openIndexes().has(index);
  }

  toggle(index: number): void {
    if (this.selectedTags().size > 0) {
      return;
    }
    const next = new Set(this.openIndexes());
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    this.openIndexes.set(next);
  }
}
