import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { GetDataService } from '../shared/get-data.service';
import { Projects } from '../shared/project';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
})
export class ProjectsComponent implements OnInit, OnDestroy {
  @ViewChild('cards') cards!: ElementRef;
  projectsList!: Projects[];
  subs!: Subscription;
  loading: boolean = true;
  zindex: number = 10;

  constructor(private getData: GetDataService) {}

  ngOnInit(): void {
    this.subs = this.getData.getProjects().subscribe((projects) => {
      this.projectsList = projects;
      this.loading = false;
    });
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onClick(e: MouseEvent) {
    let cards = this.cards.nativeElement;
    let card = e.currentTarget as HTMLElement;
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
        card.style.zIndex = this.zindex.toString();
        card.classList.add('show');
      }
      this.zindex++;
    } else {
      cards.classList.add('showing');
      card.style.zIndex = this.zindex.toString();
      card.classList.add('show');
      this.zindex++;
    }
  }
}
