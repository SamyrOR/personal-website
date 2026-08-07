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

- [x] Delete `src/app/app.module.ts` (empty leftover file, unused)
- [x] Remove unused imports in `src/app/app.component.ts`: `provideHttpClient`,
      `withInterceptorsFromDi`, `withXhr` (real providers live in `src/app.config.ts`)
- [x] Remove unused `NgModule` import in `src/app/app.routes.ts`
- [x] Delete `karma.conf.js` — unreferenced anywhere (the `test` target runs on the
      Vitest-backed `@angular/build:unit-test` builder). Correction from the original note:
      `src/test.ts` is **not** dead — it's wired in as `setupFiles` in `angular.json` — so it
      was left in place. It still does Karma-style `zone.js/testing` + `platformBrowserDynamicTesting`
      init, which may not even be the right setup for the new builder; separately, `npm test`
      currently fails outright with "A DOM environment is required... install jsdom or happy-dom" —
      pre-existing, unrelated to this migration, needs its own fix
- [x] Type `header.component.ts:88` — `changeLanguage(language: any)` should take the actual
      `Event` type (e.g. `Event` with `event.target as HTMLSelectElement`), consistent with
      `strict`/`strictTemplates` already enabled in `tsconfig.json`

**Pre-existing issue found while verifying, fixed in Phase 1.5:** `npm test` was broken for
reasons unrelated to this roadmap's architectural work.

---

## Phase 1 — Standalone migration (foundational)

Everything in Phases 2–3 assumes standalone components. Do this first.

- [x] Migrated to standalone (by hand, component by component):
  - [x] `about-me` (`about-me.component.ts`, `about-me.module.ts`, `about-me-routing.module.ts`)
  - [x] `certificates` (`certificates.component.ts`, `certificates.module.ts`,
        `certificates-routing.module.ts`)
  - [x] `contact` (`contact.component.ts`, `contact.module.ts`, `contact-routing.module.ts`)
  - [x] `projects` (`projects.component.ts`, `projects.module.ts`, `projects-routing.module.ts`)
  - [x] `regular` (`header`, `footer`, `home`, `not-found` components + `regular.module.ts`)
- [x] Dropped `standalone: false`/`standalone: true` entirely (standalone is the default since
      v19) and moved each module's `imports` (`NgClass`, `FormsModule`, `RouterLink`,
      `RouterLinkActive`, `TranslatePipe`, `InfiniteScrollDirective`, `ReactiveFormsModule`)
      directly onto the owning component
- [x] Deleted every `*.module.ts`
- [x] `src/app/app.routes.ts`: every `loadChildren: () => import('./x.module')...` replaced with
      `loadComponent: () => import('./x.component')...`
- [x] Deleted the `*-routing.module.ts` files; their `data: { title }` folded directly into
      `app.routes.ts`
- [x] `RegularModule` removed; `app.component.ts` now imports `HeaderComponent` /
      `FooterComponent` / `RouterOutlet` directly

**Verify:** `npm run lint` (0 `prefer-standalone` errors remain), `npm run build` (succeeds;
lazy chunks now named per-component — `certificates-component`, `about-me-component`,
`projects-component`, `contact-component` — confirming `loadComponent` routing works). Also
fixed two unrelated pre-existing config bugs blocking any verification: missing `jsdom`
devDependency, and `angular.json`'s `testing` build configuration had `polyfills` as a string
instead of an array (schema violation). `npm test` still failed after those fixes at this point
in time — most of the remaining breakage was pre-existing, but part of it —
`declarations: [XComponent]` in every component spec — was a direct consequence of this phase's
standalone migration: `TestBed.configureTestingModule` can't `declare` a standalone component,
only `import` it. All fixed in Phase 1.5.

No headless browser was available to verify this in an actual browser at the time this phase
landed (`chromium-cli` absent; Cypress broken; Playwright not yet installed). Verification was
limited to: dev server `curl` against all 6 routes (all 200, correct lazy chunks compiled, no
errors in the server log) plus `ng build`'s AOT template type-checking, which fails loudly if a
template uses a directive/pipe not present in that component's `imports`. Real in-browser
verification (theme toggle, language switcher, all 6 routes) was done afterward, once Playwright
was installed — see Phase 1.5.

---

## Phase 1.5 — Fix test infrastructure (done)

`npm test` was broken, which would have forced Phase 2 (OnPush + signals) to rely on manual
click-through alone — exactly the kind of regression (stale bindings, missed `markForCheck()`)
that a `fixture.detectChanges()` unit test catches mechanically and a human does not. Fixed
before starting Phase 2. Turned out to be four separate, layered problems — each one only
became visible after fixing the one before it:

- [x] **`src/test.ts` deleted**, `setupFiles` removed from `angular.json`, `src/test.ts`
      references removed from `tsconfig.spec.json`/`tsconfig.app.json`. Traced through
      `@angular/build`'s source directly (`node_modules/@angular/build/src/builders/unit-test/runners/vitest/build-options.js`):
      the Vitest runner auto-generates its own `angular:test-bed-init` virtual module
      (`zone.js/testing` + `@angular/platform-browser/testing`, not the old `-dynamic` package)
      regardless of `setupFiles`. The manual init in `test.ts` was pure dead weight fighting the
      builder, not a legitimate customization point.
- [x] **Found a second, non-obvious layer underneath that**: even with `test.ts` gone, the
      builder's auto-generated init still failed with "Top-level await is not available in the
      configured target environment." Root cause: `angular.json`'s `polyfills` option pointed at
      a custom `src/polyfills.ts` file (a vestigial Angular-6-era wrapper whose only content was
      `import 'zone.js';`) instead of the `"zone.js"` package specifier the builder's zone-strategy
      detection (`getZoneTestingStrategy`) checks for by exact string match. Because it wasn't
      recognized, the builder fell back to a `dynamic` (top-level-`await`) zone-loading strategy,
      which the configured browser targets don't support. **Fix:** replaced
      `"polyfills": ["src/polyfills.ts"]` with `"polyfills": ["zone.js"]` in both `angular.json`
      build configs (default + `testing`), deleted `src/polyfills.ts`, removed it from
      `tsconfig.app.json`'s `files`. This is also the modern v22-scaffold pattern — new projects
      don't get a polyfills wrapper file at all.
- [x] **`declarations` → `imports` for standalone components in TestBed**, confirmed as a
      direct Phase 1 consequence — and broader than first estimated: every component spec that
      declared its component (`about-me`, `app`, `certificates`, `contact`, `footer`, `header`,
      `home`, `not-found`, `projects` — 9 files, not just the 3 originally guessed) needed this
      fix, since standalone components can't be declared in an `NgModule`, only imported.
- [x] **New failure surfaced only after the `declarations` fix**: `certificates`, `contact`,
      `home`, `projects`, `footer`, `header`, `about-me`, and `app` specs all now import their
      component directly, which pulls in `TranslatePipe` — and `TranslatePipe` needs
      `TranslateService` in the injector, which none of these specs provided (previously masked
      by the NgModule providing it globally). Added `provideTranslateService()` (from
      `@ngx-translate/core`) to each affected spec's `providers`. `footer` and `header` (and
      `home`, which now imports `RouterLink`) also needed `provideRouter([])` for `RouterLink`'s
      injected `Router`.
- [x] `home.component.spec.ts`: fixed
      `import { GetDataService } from 'src/app/shared/get-data.service'` →
      `'../../shared/get-data.service'` (no `baseUrl`/`paths` configured in `tsconfig.json`, so
      the absolute-style path never resolved)
- [x] `get-data.service.spec.ts`: `getProjects()`/`getCertificates()` now called with a
      `'en_US'` locale arg; mocked `httpTestingController.expectOne(...)` URLs updated to match
      what the service actually requests (`assets/data/projects/projects_en_US.json`,
      `assets/data/certificates/certificates_en_US.json`); removed the dangling `expect.call;`
      no-op statement
- [x] Removed the unused `httpClient`/`TestBed.inject(HttpClient)` in `home`/`certificates`/
      `projects` specs and the unused `router` variable in `app.component.spec.ts`

**Verified:** `npm test` — **10/10 spec files, 13/13 tests pass.** `npm run lint` — 24 errors
remain, all pre-existing (`prefer-on-push`, empty constructors/lifecycle methods, ternary-as-
statement) and unrelated to any of the above. `ng build` still succeeds with the polyfills
change. Also used this pass to install Playwright (`npm install -D playwright && npx playwright
install chromium --with-deps`) and do the real in-browser verification Phase 1 was missing:
scripted navigation to all 6 routes (correct title + content each time), clicked the theme
toggle (`light-theme` → `dark-theme`, logo swapped to the dark variant), used the language
`<select>` (UI + fetched content switched pt_BR → en_US) — zero console/page errors throughout.

---

## Phase 2 — OnPush + signals (done)

Converted one component at a time, verifying each with `ng build` + `npm test` + a real
Playwright browser check before moving to the next — this is the phase the roadmap flagged as
highest-risk, and it earned that reputation: two real regressions were caught and fixed along
the way that no amount of static checking (build/lint/test) would have surfaced.

- [x] Trivial components (`not-found`, `footer`, `about-me`, `app`) flipped straight to
      `OnPush` — all their state is set once at init and never mutated afterward, so there was
      nothing to convert to signals. Also cleaned up the empty constructors/`ngOnInit`s lint was
      already flagging on these same lines.
- [x] `contact.component.ts`: `submitted` → `signal(false)`, flipped to `OnPush`. Verified via
      Playwright: touch+blur validation errors still appear (native DOM `blur` event within the
      component's own template still marks OnPush dirty), valid submit still runs
      `submitted.set(true)` and the mailto branch without error.
- [x] `projects.component.ts`: `@ViewChild('cards')` → `viewChild<ElementRef>('cards')`,
      `loading`/`projectsList` → signals, flipped to `OnPush`. This is the textbook case the
      roadmap warned about — state set inside an HTTP `.subscribe()` callback, no template event
      involved — and it's exactly where a plain boolean would have silently frozen the "Loading…"
      state under OnPush. Verified via Playwright: loading indicator correctly clears after the
      async response, card flip interaction works, locale-switch refetch re-renders correctly.
- [x] `certificates.component.ts`: `organizations`/`initialData`/`loading` → signals, flipped to
      `OnPush`. `onScroll()`'s array push became `initialData.set([...data, next])`. Verified:
      infinite scroll still appends on scroll, locale switch resets and re-renders correctly.
- [x] `home.component.ts`: `projectsList` → signal; `@ViewChildren('allProjects')` →
      `viewChildren<ElementRef>('allProjects')`, flipped to `OnPush`. **First regression found
      here**: the mechanical fix — bridging the signal to an Observable via `toObservable()` to
      preserve the original `QueryList.changes`-based subscription shape — introduced a real bug.
      `toObservable()` is backed by a `ReplaySubject`, and the code had *two* separate
      subscriptions to it (one long-lived from `ngAfterViewInit`, one freshly created per locale
      change via `switchMap`); each new subscription replayed the buffered value, so
      `loadCarousel()` fired twice on every locale switch — duplicate dots/listeners, then a
      `Cannot read properties of undefined (reading 'style')` crash, caught immediately by the
      Playwright check. **Fixed** by replacing the whole Observable bridge with a single
      `effect(() => { if (this.allProjects().length) { this.destroyCarousel(); this.loadCarousel(); } })`
      in the constructor — `destroyCarousel()` is idempotent/safe even on the very first run, so
      one unconditional reactive path replaces the two-subscription setup entirely, and
      `ngAfterViewInit` was removed as no longer needed. Re-verified clean: zero console errors,
      dot count stays correct across a locale switch, carousel nav works before and after.
- [x] `header.component.ts`: `@ViewChildren('menuLink')` → `viewChildren('menuLink', { read: ElementRef })`
      (static markup, no `@if`/`@for`, so the effect watching it only ever fires once — same
      `effect()`-in-constructor pattern as `home`, no Observable bridge needed here since there's
      no restart case to handle). `isDarkTheme`/`isMenuOpen` → signals. **Second regression
      avoided before it happened**: `isMenuOpen` is mutated from a raw `fromEvent(...)` DOM
      listener set up imperatively in `closeMobileMenu()` — not an Angular template binding — so
      under OnPush a plain boolean here would have silently failed to reopen/close the mobile
      menu, exactly like the `projectsList` case. Separately, `[(ngModel)]="isDarkTheme"` can't
      bind directly to a `WritableSignal` (two-way `ngModel` sugar does a plain `=` assignment on
      change), and the template also had a *second*, separate `(change)="switchTheme()"` handler
      on the same checkbox — keeping both `ngModelChange` and `(change)` on the same native event
      would have made `switchTheme()`'s read of `isDarkTheme()` depend on unspecified listener
      ordering. Replaced both with a single `[checked]="isDarkTheme()"` +
      `(change)="onThemeToggle($event)"` (sets the signal, then calls `switchTheme()`) —
      deterministic, and let `FormsModule` be dropped from this component's imports entirely
      (it was the only `ngModel` usage in the file). Verified via Playwright at both desktop and
      mobile viewport widths: theme toggles both directions, mobile menu opens on the hamburger
      button and closes when a nav link is clicked (the `fromEvent`-driven path), language switch
      still works.

**Verify:** `npx ng lint` — the `prefer-on-push-component-change-detection` rule is now clean
across all 9 components (was 9 errors at the start of this phase, 0 now); the 6 remaining lint
errors are all pre-existing and unrelated (a11y on `projects.component.html`, ternary-as-
statement in `home`/`header`). `ng build` succeeds — and the initial bundle actually shrank
(304 kB → 255 kB) since `FormsModule` is no longer eagerly pulled into the main chunk by
`header.component.ts`. `npm test` — 10/10 files, 13/13 tests, unaffected by any of this (the
specs only assert `should create`, which doesn't exercise change-detection timing — this is
exactly why the roadmap called for **manual browser verification**, not just green tests). Ran a
final combined Playwright session round-tripping through every route with multiple theme
toggles, language switches, infinite scroll, card clicks, and carousel navigation interleaved —
zero console/page errors, no duplicated DOM state anywhere.

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

1. ~~Phase 0 (same day, trivial)~~ — done
2. ~~Phase 1 (foundational — do before anything else architectural)~~ — done
3. ~~Phase 1.5 (fix test infra — unblocks real regression coverage for Phase 2)~~ — done
4. ~~Phase 2 (one component at a time, verify each)~~ — done
5. Phase 4 (can slot in anytime after Phase 1, independent track) — **up next**
6. Phase 3 (only after Phase 2 is fully verified) — unblocked, ready whenever
7. Phase 5 (optional polish, once comfortable with signals from Phase 2)
