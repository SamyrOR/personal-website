# Angular v22 Modernization Roadmap

Tracks the gap between this codebase (migrated from v18 → v22 via `ng update`) and current
Angular v22 best practices. Ordered by priority — each phase builds on the previous one, so
work top to bottom rather than cherry-picking later items first.

Check off items as they land. See `CLAUDE.md` for the architecture this roadmap is migrating
away from.

---

## Phase 0 — Quick cleanup (do first, no risk)

Trivial, isolated fixes. No architectural dependency on anything else here — safe to land
before or alongside Phase 1.

- [ ] Delete `src/app/app.module.ts` (empty leftover file, unused)
- [ ] Remove unused imports in `src/app/app.component.ts`: `provideHttpClient`,
      `withInterceptorsFromDi`, `withXhr` (real providers live in `src/app.config.ts`)
- [ ] Remove unused `NgModule` import in `src/app/app.routes.ts`
- [ ] Delete `karma.conf.js` and `src/test.ts` — the `test` target already runs on the
      Vitest-backed `@angular/build:unit-test` builder (see `angular.json`); these are dead
      Karma leftovers
- [ ] Type `header.component.ts:88` — `changeLanguage(language: any)` should take the actual
      `Event` type (e.g. `Event` with `event.target as HTMLSelectElement`), consistent with
      `strict`/`strictTemplates` already enabled in `tsconfig.json`

---

## Phase 1 — Standalone migration (foundational)

Everything in Phases 2–3 assumes standalone components. Do this first.

- [ ] Run `ng generate @angular/core:standalone` (or migrate by hand, module by module) for:
  - [ ] `about-me` (`about-me.component.ts`, `about-me.module.ts`, `about-me-routing.module.ts`)
  - [ ] `certificates` (`certificates.component.ts`, `certificates.module.ts`,
        `certificates-routing.module.ts`)
  - [ ] `contact` (`contact.component.ts`, `contact.module.ts`, `contact-routing.module.ts`)
  - [ ] `projects` (`projects.component.ts`, `projects.module.ts`, `projects-routing.module.ts`)
  - [ ] `regular` (`header`, `footer`, `home`, `not-found` components + `regular.module.ts`)
- [ ] Set `standalone: true` (or drop the flag entirely — standalone is the default since v19)
      and move each module's `imports` (`CommonModule`, `TranslatePipe`,
      `InfiniteScrollDirective`, `ReactiveFormsModule`, etc.) directly onto the component
- [ ] Delete each `*.module.ts` once its component is standalone
- [ ] Update `src/app/app.routes.ts`: replace every
      `loadChildren: () => import('./x.module').then(m => m.XModule)` with
      `loadComponent: () => import('./x.component').then(m => m.XComponent)`
      (for single-route features — `about-me`, `certificates`, `contact`, `projects` all have
      exactly one child route today, so this is a direct swap)
- [ ] Delete the now-redundant `*-routing.module.ts` files; fold their `data: { title }` directly
      into `app.routes.ts`
- [ ] Verify `RegularModule` → replace with direct standalone imports of `HeaderComponent` /
      `FooterComponent` in `app.component.ts`

**Verify:** `npm run lint`, `npm run build`, `npm test`, manually click through all routes in
`npm start`.

---

## Phase 2 — OnPush + signals

Do this once components are standalone — signal-driven templates pair naturally with OnPush.

- [ ] Convert `@ViewChild`/`@ViewChildren` decorators to signal queries:
  - [ ] `header.component.ts` — `@ViewChildren('menuLink', { read: ElementRef })` → `viewChildren()`
  - [ ] `home.component.ts` — `@ViewChildren` → `viewChildren()`
  - [ ] `projects.component.ts` — `@ViewChild('cards')` → `viewChild()`
- [ ] Convert plain mutable class fields that drive templates into `signal()`/`computed()`
      (e.g. `isDarkTheme`, `isMenuOpen`, `lang` in `header.component.ts`; `loading`,
      `projectsList`/`organizations` in `home`/`certificates`/`projects`)
- [ ] Switch every component's `changeDetection` from `ChangeDetectionStrategy.Eager` to
      `ChangeDetectionStrategy.OnPush` — do this per-component right after converting its state
      to signals, not as one big-bang flip, so each one can be verified in isolation
- [ ] Re-test theme switching, language switching, infinite scroll, and the home carousel after
      each conversion — these all mutate DOM/state outside Angular's normal binding flow and are
      the most likely to silently break under OnPush

**Verify:** manually exercise theme toggle, language toggle, mobile menu, carousel, and infinite
scroll in the browser after each component — OnPush regressions won't show up in unit tests that
don't assert on change detection timing.

---

## Phase 3 — Zoneless change detection

Only attempt once Phase 2 is fully done — zoneless relies on OnPush + signals to know when to
re-render.

- [ ] Remove `import 'zone.js'` from `src/polyfills.ts`
- [ ] Replace `provideZoneChangeDetection({ eventCoalescing: true })` with
      `provideZonelessChangeDetection()` in `src/app.config.ts`
- [ ] Remove `zone.js` from `package.json` dependencies
- [ ] Audit any remaining direct DOM manipulation that mutates state without going through a
      signal (e.g. `home.component.ts` carousel logic, `header.component.ts` `switchTheme()`) —
      under zoneless these won't trigger change detection automatically and may need an explicit
      signal update or `ChangeDetectorRef`-free refactor

**Verify:** full manual click-through of the app; zoneless bugs (stale UI after an event) don't
always surface in automated tests.

---

## Phase 4 — Forms & images

Independent of Phases 1–3 — can be done in parallel if you want a smaller, self-contained PR.

- [ ] `contact.component.ts`: replace `UntypedFormBuilder`/`UntypedFormGroup` with typed
      `FormBuilder`/`FormGroup<{ subject: FormControl<string>, message: FormControl<string> }>`
- [ ] `contact.component.ts` `sendMail()`: read `this.form.value` instead of
      `document.querySelector('.form__input'/'​.form__textarea')`
- [ ] Add `NgOptimizedImage` (`ngSrc`) in place of plain `<img [src]>` for:
  - [ ] `certificates.component.html:43`
  - [ ] `projects.component.html:19` (already has `height`/`width` — good, just swap the
        directive)
  - [ ] `home.component.html:1006`

**Verify:** submit the contact form end-to-end (mailto link should still fire correctly);
confirm images still render with `ngSrc` (note `NgOptimizedImage` requires an explicit
`width`/`height` or `fill` — `certificates.component.html` and `home.component.html` don't
currently set these and will need them added).

---

## Phase 5 — Data-fetching modernization

Optional, higher-effort cleanup once signals are in place (Phase 2). Removes the repeated
`Subscription` + `switchMap(onLangChange)` + manual `ngOnDestroy` unsubscribe pattern duplicated
across `home`, `certificates`, and `projects` components.

- [ ] Introduce a `currentLocale` signal (from `TranslateService.onLangChange`, or via
      `toSignal()`) in `GetDataService` consumers
- [ ] Replace manual `.subscribe()` + `Subscription` bookkeeping in `home.component.ts`,
      `certificates.component.ts`, and `projects.component.ts` with `resource()` or
      `httpResource()` keyed on the locale signal
- [ ] Delete the `subs`/`ngOnDestroy` boilerplate once each component's fetch is
      resource-driven

**Verify:** language switching still refetches and re-renders projects/certificates correctly;
loading states (`loading` flag, infinite scroll `initialData`) still behave the same.

---

## Suggested sequencing

1. Phase 0 (same day, trivial)
2. Phase 1 (foundational — do before anything else architectural)
3. Phase 2 (one component at a time, verify each)
4. Phase 4 (can slot in anytime after Phase 1, independent track)
5. Phase 3 (only after Phase 2 is fully verified)
6. Phase 5 (optional polish, once comfortable with signals from Phase 2)
