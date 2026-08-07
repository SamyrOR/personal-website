import {
  Component,
  ElementRef,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  signal,
  viewChildren,
  effect,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { fromEvent, merge, Observable } from 'rxjs';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgClass, RouterLink, RouterLinkActive, TranslatePipe],
})
export class HeaderComponent implements OnInit {
  private translateService = inject(TranslateService);

  menuLinks = viewChildren('menuLink', { read: ElementRef });
  isDarkTheme = signal(false);
  isMenuOpen = signal(false);
  logos!: Element[];
  lang = '';

  constructor() {
    // The #menuLink refs are static markup (no @if/@for), so this only ever fires once.
    effect(() => {
      const menuLinks = this.menuLinks();
      if (menuLinks.length === 0) {
        return;
      }
      this.closeMobileMenu(menuLinks);
    });
  }

  ngOnInit(): void {
    this.isDarkTheme.set(localStorage.getItem('selected-theme') === 'dark');
    this.switchTheme();
    this.lang = localStorage.getItem('lang') || 'pt_BR';
  }

  closeMobileMenu(menuLinks: readonly ElementRef[]) {
    const linkClicks: Observable<Event>[] = menuLinks.map((link: ElementRef) =>
      fromEvent(link.nativeElement, 'click'),
    );

    merge(...linkClicks).subscribe(() => {
      this.menuOpen();
    });
  }

  onThemeToggle(event: Event): void {
    this.isDarkTheme.set((event.target as HTMLInputElement).checked);
    this.switchTheme();
  }

  switchTheme() {
    this.logos = Array.from(document.querySelectorAll('.logo'));
    if (this.isDarkTheme()) {
      this.transition();
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark-theme');
      this.logos.forEach((logo) =>
        logo.setAttribute('src', './assets/images/logos/samyrdev-dark.png'),
      );
    } else {
      this.transition();
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      this.logos.forEach((logo) =>
        logo.setAttribute('src', './assets/images/logos/samyrdev.png'),
      );
    }
    localStorage.setItem('selected-theme', this.isDarkTheme() ? 'dark' : 'light');
  }

  //Add transition to theme change
  transition() {
    document.documentElement.classList.add('transition');
    window.setTimeout(() => {
      document.documentElement.classList.remove('transition');
    }, 1000);
  }

  //add no-scroll and close menu at route change
  menuOpen() {
    if (window.innerWidth < 1024) {
      this.isMenuOpen.update((open) => !open);
      if (this.isMenuOpen()) {
        document.body.classList.add('no-scroll');
      } else {
        document.body.classList.remove('no-scroll');
      }
    }
  }

  changeLanguage(event: Event): void {
    const selectedLanguage = (event.target as HTMLSelectElement).value;
    localStorage.setItem('lang', selectedLanguage);
    this.translateService.use(selectedLanguage);
  }
}
