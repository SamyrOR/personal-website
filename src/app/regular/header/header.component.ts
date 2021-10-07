import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  isDarkTheme: boolean = false;
  isMenuOpen: boolean = false;
  logos!: Element[];
  constructor() {}

  ngOnInit(): void {
    this.isDarkTheme =
      localStorage.getItem('selected-theme') === 'dark' ? true : false;
    this.switchTheme();
  }

  switchTheme() {
    this.logos = Array.from(document.querySelectorAll('.logo'));
    if (this.isDarkTheme) {
      this.transition();
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark-theme');
      this.logos.forEach((logo) =>
        logo.setAttribute('src', './assets/images/dark-logo.png')
      );
    } else {
      this.transition();
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      this.logos.forEach((logo) =>
        logo.setAttribute('src', './assets/images/logo.png')
      );
    }
    localStorage.setItem('selected-theme', this.isDarkTheme ? 'dark' : 'light');
  }

  transition() {
    document.documentElement.classList.add('transition');
    window.setTimeout(() => {
      document.documentElement.classList.remove('transition');
    }, 1000);
  }

  menuOpen() {
    if (window.innerWidth < 1024) {
      this.isMenuOpen = !this.isMenuOpen;
      this.isMenuOpen
        ? document.body.classList.add('no-scroll')
        : document.body.classList.remove('no-scroll');
    }
  }
}
