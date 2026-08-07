import {
  Component,
  ChangeDetectionStrategy,
  input,
  model,
  signal,
  computed,
} from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";

export interface TagOption {
  value: string;
  count: number;
}

@Component({
  selector: "app-tag-filter",
  templateUrl: "./tag-filter.component.html",
  styleUrls: ["./tag-filter.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class TagFilterComponent {
  tags = input.required<TagOption[]>();
  selected = model<ReadonlySet<string>>(new Set());

  panelOpen = signal(false);

  activeCount = computed(() => this.selected().size);

  isSelected(tag: string): boolean {
    return this.selected().has(tag);
  }

  toggleTag(tag: string): void {
    const next = new Set(this.selected());
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    this.selected.set(next);
  }

  clear(): void {
    this.selected.set(new Set());
  }

  togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  formatLabel(tag: string): string {
    return tag.replace(/-/g, " ");
  }
}
