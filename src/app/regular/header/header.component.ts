import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChildren,
} from '@angular/core';
import { fromEvent, merge, Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, AfterViewInit {
  @ViewChildren('menuLink', { read: ElementRef }) menuLinks!: ElementRef[];
  isDarkTheme: boolean = false;
  isMenuOpen: boolean = false;
  logos!: Element[];
  constructor() {}

  ngOnInit(): void {
    this.isDarkTheme =
      localStorage.getItem('selected-theme') === 'dark' ? true : false;
    this.switchTheme();
  }

  ngAfterViewInit(): void {
    this.closeMobileMenu(this.menuLinks);
  }

  closeMobileMenu(menuLinks: ElementRef[]) {
    let linkClicks: Observable<Event>[] = menuLinks.map((link: ElementRef) =>
      fromEvent(link.nativeElement, 'click'),
    );

    merge(...linkClicks).subscribe(() => {
      this.menuOpen();
    });
  }

  switchTheme() {
    this.logos = Array.from(document.querySelectorAll('.logo'));
    if (this.isDarkTheme) {
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
    localStorage.setItem('selected-theme', this.isDarkTheme ? 'dark' : 'light');
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
      this.isMenuOpen = !this.isMenuOpen;
      this.isMenuOpen
        ? document.body.classList.add('no-scroll')
        : document.body.classList.remove('no-scroll');
    }
  }
}
