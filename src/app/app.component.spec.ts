import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';

class MockRouter {
  // A Subject (hot, multicast) so the test can emit more than one NavigationEnd
  // over time, unlike a one-shot cold Observable that only ever fires once.
  public events = new Subject<NavigationEnd>();
}

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let app: AppComponent;
  let titleService: Title;
  let router: MockRouter;
  let activatedRoute: { firstChild: { snapshot: { data: Record<string, string> } } };

  beforeEach(async () => {
    activatedRoute = { firstChild: { snapshot: { data: { title: 'Home' } } } };
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AppComponent],
      providers: [
        { provide: Router, useClass: MockRouter },
        { provide: ActivatedRoute, useValue: activatedRoute },
        Title,
        provideTranslateService(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AppComponent);
    app = fixture.componentInstance;
    titleService = TestBed.inject(Title);
    router = TestBed.inject(Router) as unknown as MockRouter;
    // Let Angular's own lifecycle invoke ngOnInit, rather than calling it manually -
    // that's what makes this deterministic under both zone-based and zoneless CD.
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(app).toBeTruthy();
  });

  it('should change title dynamically as navigation happens', () => {
    router.events.next(new NavigationEnd(0, '/home', '/home'));
    expect(titleService.getTitle()).toBe('>_DEV - Home');

    activatedRoute.firstChild.snapshot.data['title'] = 'Certificates';
    router.events.next(new NavigationEnd(1, '/certificates', '/certificates'));
    expect(titleService.getTitle()).toBe('>_DEV - Certificates');
  });
});
