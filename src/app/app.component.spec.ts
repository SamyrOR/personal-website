import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable } from 'rxjs';
import { AppComponent } from './app.component';

class MockRouter {
  //Router
  public ne = new NavigationEnd(
    0,
    'http://localhost:4200/home',
    'http://localhost:4200/home'
  );
  public events = new Observable((observer) => {
    observer.next(this.ne);
    observer.complete();
  });
}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;
  let titleService: Title;
  let router: Router;
  let activatedRoute: ActivatedRoute;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent],
      providers: [
        { provide: Router, useClass: MockRouter },
        {
          provide: ActivatedRoute,
          useValue: { firstChild: { snapshot: { data: { title: 'Home' } } } },
        },
        Title,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    titleService = TestBed.inject(Title);
    activatedRoute = TestBed.inject(ActivatedRoute);
    app.ngOnInit();
    await fixture.whenStable();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should change tittle dynamically', () => {
    let appTitle = titleService.getTitle();
    expect(appTitle).toBe('>_DEV - Home');
    let child = activatedRoute.firstChild;
    child!.snapshot.data['title'] = 'Certificates';
    fixture.detectChanges();
    appTitle = titleService.getTitle();
    expect(appTitle).toBe('>_DEV - Certificates');
  });
});
