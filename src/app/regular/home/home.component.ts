import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { GetDataService } from 'src/app/shared/get-data.service';
import { Projects } from 'src/app/shared/project';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  projectsList: Projects[] = [];
  sub!: Subscription;
  afterLoopSub!: Subscription;

  @ViewChildren('allProjects') allProjects!: QueryList<any>;

  constructor(private getData: GetDataService) {}

  ngOnInit(): void {
    this.sub = this.getData
      .getProjects()
      //Get just a few projects
      .subscribe((projects) => (this.projectsList = projects.slice(0, 3)));
  }

  ngAfterViewInit(): void {
    //Load carousel after ngFor rendered
    this.afterLoopSub = this.allProjects.changes.subscribe(() => {
      this.loadCarousel();
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.afterLoopSub.unsubscribe();
  }

  //Creat and load carousel functions
  loadCarousel() {
    document
      .querySelectorAll('.carousel-container')
      .forEach((carousel: any) => {
        this.insertNumbers(carousel);

        carousel.querySelector('.prev').addEventListener('click', (e: any) => {
          this.minusItem(carousel);
        });

        carousel.querySelector('.next').addEventListener('click', () => {
          this.plusItem(carousel);
        });

        this.insertDots(carousel);

        carousel.querySelectorAll('.dot').forEach((dot: any) => {
          dot.addEventListener('click', (e: any) => {
            let item = Array.prototype.indexOf.call(
              e.target.parentNode.children,
              e.target
            );

            this.showItems(carousel, item);
          });
        });

        this.showItems(carousel, 0);
      });
  }

  insertNumbers(carousel: any) {
    const length = carousel.querySelectorAll('.item').length;
    for (let i = 0; i < length; i++) {
      const nmbr = document.createElement('div');
      nmbr.classList.add('numbertext');
      nmbr.innerText = i + 1 + ' / ' + length;

      carousel.querySelectorAll('.item')[i].append(nmbr);
    }
  }

  insertDots(carousel: any) {
    const dots = document.createElement('div');
    dots.classList.add('dots');

    carousel.append(dots);

    carousel.querySelectorAll('.item').forEach((elem: Element) => {
      const dot = document.createElement('div');
      dot.classList.add('dot');

      carousel.querySelector('.dots').append(dot);
    });
  }

  currentItem(carousel: any) {
    return [...carousel.querySelectorAll('.item')].findIndex(
      (item) => item.style.display == 'block'
    );
  }

  showItems(carousel: any, item: any) {
    if (
      carousel.querySelectorAll('.item')[this.currentItem(carousel)] !=
      undefined
    )
      carousel.querySelectorAll('.item')[
        this.currentItem(carousel)
      ].style.display = 'none';
    carousel.querySelectorAll('.item')[item].style.display = 'block';

    if (carousel.querySelector('.dot.active') != null)
      carousel.querySelector('.dot.active').classList.remove('active');
    carousel.querySelectorAll('.dot')[item].classList.add('active');
  }

  plusItem(carousel: any) {
    let item = this.currentItem(carousel);

    carousel
      .querySelectorAll('.item')
      [item].nextElementSibling.classList.contains('item')
      ? this.showItems(carousel, item + 1)
      : this.showItems(carousel, 0);
  }

  minusItem(carousel: any) {
    let item = this.currentItem(carousel);

    carousel.querySelectorAll('.item')[item].previousElementSibling != null
      ? this.showItems(carousel, item - 1)
      : this.showItems(carousel, carousel.querySelectorAll('.item').length - 1);
  }
}
