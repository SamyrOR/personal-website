import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit {
  @ViewChild('cards') cards!: ElementRef;
  constructor() {}

  zindex: number = 10;
  ngOnInit(): void {}

  onClick(e: any) {
    e.preventDefault();
    let cards = this.cards.nativeElement;
    let card = e.currentTarget;
    let isShowing = false;
    if (card.classList.contains('show')) {
      isShowing = true;
    }
    if (cards.classList.contains('showing')) {
      let showingCard = document.querySelector('div.card.show');
      showingCard?.classList.remove('show');
      if (isShowing) {
        cards.classList.remove('showing');
      } else {
        card.style.zIndex = this.zindex;
        card.classList.add('show');
      }
      this.zindex++;
    } else {
      cards.classList.add('showing');
      card.style.zIndex = this.zindex;
      card.classList.add('show');
      this.zindex++;
    }
  }
}
