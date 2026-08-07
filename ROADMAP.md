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

## Phase 3 — Zoneless change detection (done)

- [x] Replaced `provideZoneChangeDetection({ eventCoalescing: true })` with
      `provideZonelessChangeDetection()` in `src/app.config.ts`
- [x] Removed `"zone.js"` from `angular.json`'s `polyfills` array in both the `build` and
      `testing` configurations (there was no `src/polyfills.ts` left to edit — Phase 1.5 already
      replaced that legacy wrapper file with the `"zone.js"` package-specifier form; this phase
      just removed the specifier itself)
- [x] `npm uninstall zone.js` — removed from `package.json`/`package-lock.json` and
      `node_modules` cleanly
- [x] **Audit** (before flipping anything): grepped every component for plain (non-signal)
      fields that are both read in a template and mutated after init. Found none — Phase 2's
      signal conversion already covered every piece of state that actually drives a template
      binding (`isDarkTheme`, `isMenuOpen`, `loading`×3, `projectsList`×2, `organizations`,
      `initialData`, `submitted`). The remaining direct DOM manipulation (`home.component.ts`'s
      carousel `insertDots`/`showItems`/etc., `header.component.ts`'s `switchTheme()`
      classList/logo swaps) writes straight to the DOM outside Angular's rendering pipeline
      entirely — it was never gated by change detection in the first place, so zone vs. zoneless
      makes no difference to it. Also confirmed `TranslatePipe` (`@ngx-translate/core`) calls
      `changeDetectorRef.markForCheck()` internally on language change — zone-independent, so
      translated text in components with no local signal tied to the locale (header, footer,
      about-me) still refreshes correctly.

**Found and fixed a real bug the migration surfaced — not in the app, in a test.**
`app.component.spec.ts`'s "should change tittle dynamically" test manually called
`app.ngOnInit()` in `beforeEach`, then called `fixture.detectChanges()` inside the test body
expecting a second, different title to appear. Empirically (verified by temporarily reinstalling
zone.js and comparing): under zone-based CD, that `detectChanges()` call happened to trigger a
**second**, incidental `ngOnInit()` invocation through Angular's own first-change-detection
lifecycle bookkeeping — since the manual call bypassed Angular's normal "has this hook run yet"
tracking — which re-subscribed to the (cold, one-shot) mock `router.events` Observable a second
time, and by then the test had already mutated the mock route data, so the second subscription
read the updated value. Under zoneless this incidental double-invocation didn't happen, the
subscription fired exactly once, and the test failed correctly — it was never actually testing
"title updates as navigation happens," it was accidentally passing off a lifecycle quirk.
Rewrote it properly: replaced the one-shot cold `Observable` mock with a `Subject` so the test
can emit multiple genuine `NavigationEnd` events over time, and removed the manual `ngOnInit()`
call in favor of letting `fixture.detectChanges()` invoke it exactly once, the normal Angular
way. This is deterministic under both zone and zoneless and actually exercises the behavior the
test's name claims to test.

**Verified:** `ng build` — succeeds, and the polyfills chunk (34.59 kB, zone.js) is gone
entirely; initial bundle 260.89 kB → 225.71 kB. `npm test` — 10/10 files, 13/13 tests (after the
fix above). Full Playwright re-run of every scenario exercised across Phase 2 and Phase 4 —
cross-page round-trip, theme toggle both directions, mobile menu open/close via the native
`fromEvent` listener, contact form touch/blur validation and submit, infinite scroll, card flip,
carousel navigation and locale-triggered restart — all identical to the zone-based results, zero
console errors. Also specifically re-verified the dynamic page title (the thing the fixed test
covers) end-to-end in the real running app across multiple client-side navigations.

---

## Phase 4 — Forms & images (mostly done)

- [x] `contact.component.ts`: replaced `UntypedFormBuilder`/`UntypedFormGroup` with a typed
      `FormBuilder`/`FormGroup<{ subject: FormControl<string>, message: FormControl<string> }>`
      built via `this.fb.nonNullable.group(...)` (avoids `string | null` on every control) as a
      field initializer, which also let `implements OnInit` drop entirely
- [x] `contact.component.ts` `sendMail()`: reads `this.form.getRawValue()` instead of
      `document.querySelector('.form__input'/'.form__textarea')`
- [x] **Bonus fix, found while verifying**: `contact.component.html`'s message-field error had
      mismatched braces (`{{"pleaseEnterMessage" | translate} }`) so it silently never rendered —
      users saw nothing instead of the validation message. Pre-existing, unrelated to typed forms,
      but trivial and directly in the file under test — fixed and verified with Playwright.
- [x] `home.component.html:1006`: `NgOptimizedImage` via `ngSrc` + `fill` (not fixed
      `width`/`height` — the carousel image already fills its container edge-to-edge via CSS
      `object-fit: cover`, so `fill` matches the real rendering exactly and sidesteps aspect-ratio
      validation entirely). Added `position: relative` to `.image` in `_carousel.scss` (required
      by `fill`).
- [x] `projects.component.html:19`: **the roadmap's original assumption here was wrong** — it
      said "already has height/width — good, just swap the directive," but a straight swap
      immediately threw `NG02952` aspect-ratio-mismatch warnings for every single card in
      Playwright (real intrinsic ratios range 1.18–2.06 across the project images; the hardcoded
      `300×255` attribute never matched any of them, and didn't even match the actual CSS-enforced
      `225px` height — a pre-existing drift). Plain `<img>` never validated this, so it went
      unnoticed for however long. Fixed the same way as `home`: switched to `fill` +
      `object-fit: cover` (`.card__image-holder` in `_card.scss` changed from the
      `height:0;padding-bottom:75%` aspect-ratio-box hack to a fixed `height: rem(225)` +
      `position: relative`, matching what was already being rendered). Also added
      `[priority]="i === 0"` (via `let i = $index` on the `@for`) on both `home` and `projects` to
      fix an `NG02955` error — the first card was flagged as the page's LCP element and wasn't
      marked priority.
- [ ] `certificates.component.html:43` — **skipped, by explicit decision.** Checked the actual
      certificate badge image files before touching anything: they are not uniform (most are
      ~480×340, but one outlier is 8000×4500 — a ~17× wider-than-tall image — plus a few 350/359/
      361-height variants), and there's no existing CSS box constraining them (they render at
      native size today). Forcing fixed `width`/`height` would visibly distort the outlier;
      `fill` + `object-fit` would require introducing a fixed-size box that doesn't exist today,
      changing the visual design (crop via `cover`, or letterbox via `contain`). Asked — decided
      to leave this one on plain `<img>` rather than guess at a product/design call. Revisit if
      the source images ever get normalized to consistent dimensions.

**Verified:** contact form submit-with-empty-data (button correctly disabled), touch+blur
validation errors (now actually visible, including the fixed message error), valid submit +
mailto branch, all via Playwright with zero console errors. Images: `NG02952`/`NG02955` warnings
gone after the `fill` conversion, display sizes unchanged (300×225 for cards — confirmed via
`clientWidth`/`clientHeight` before and after) — visually identical output, just correctly
described to the browser now. Full cross-page round-trip re-run clean.

**Aside, found but not fixed (out of scope for this phase):** `home.component.html`'s `@for`
loop uses `track project` (identity-based tracking on the whole object) — Angular's dev-mode
console logs `NG0956`, warning that this forces full DOM re-creation of the carousel on every
locale switch (a new array reference each time) instead of efficient diffing. Pre-existing,
unrelated to any of Phase 2/4's changes — worth a `track project.title` (or similar stable key)
fix at some point, but not folded in here since it wasn't part of this phase's scope.

---

## Phase 5 — Data-fetching modernization (done)

- [x] Added a single `currentLocale` signal to `GetDataService` itself (rather than duplicating
      the same `toSignal(translateService.onLangChange)` three times, once per consumer):
      `currentLocale = toSignal(this.translateService.onLangChange.pipe(map(e => e.lang)), { initialValue: this.translateService.currentLang() ?? 'pt_BR' })`.
      Centralizing it in the service that already encapsulates locale-based data access means
      all three consumers key off the exact same signal instance instead of each re-deriving it.
- [x] `projects.component.ts`: replaced the manual `.subscribe()` + `Subscription` +
      `switchMap(onLangChange)` block with
      `rxResource({ params: () => this.getData.currentLocale(), stream: ({ params }) => this.getData.getProjects(params), defaultValue: [] })`.
      Template reads `projectsResource.value()` / `projectsResource.isLoading()` instead of the
      former `loading`/`projectsList` signals.
- [x] `certificates.component.ts`: same `rxResource` pattern for `certificatesResource`. The
      infinite-scroll `initialData` subset couldn't come directly from the resource (it's
      independently, incrementally mutated by `onScroll()`), so it stays its own
      `signal<Certificate[]>([])`, reset via an `effect()` that watches
      `certificatesResource.value()` and reinitializes to `[data[0]]` whenever the underlying
      data changes (initial load or locale-driven refetch) — the same reset that used to happen
      inline inside the old locale-change subscription callback.
- [x] `home.component.ts`: same pattern, with the `.slice(0, 3)` transform now living inside the
      `stream` callback (`this.getData.getProjects(params).pipe(map(projects => projects.slice(0, 3)))`)
      instead of the subscribe callback. Left the Phase 2 carousel `effect()` (watching the
      `allProjects` viewChildren signal) completely untouched — independent concern, no
      interaction with the resource migration.
- [x] Deleted `subs`/`Subscription`/`OnInit`/`OnDestroy`/`ngOnDestroy`/`changeLocaleEvent`/
      `handleLocaleChange`/component-local `currentLocale` entirely from all three components —
      `rxResource` owns its own subscription lifecycle, tied automatically to the component's
      injection context, so there was nothing left to manually unsubscribe.

**Verify:** `npm test` — 10/10 files, 13/13 tests, after adding `provideTranslateService()` to
`get-data.service.spec.ts` (the service now injects `TranslateService` for the locale signal).
`ng build` succeeds. `ng lint` — same 6 pre-existing errors, nothing new. Playwright, run after
each component individually and once more as a full cross-page round-trip: HTTP loading state
correctly clears (the exact scenario that would silently break under OnPush without the
resource's own signal-based `isLoading()`), locale switch refetches and re-renders
projects/certificates/home correctly, infinite scroll still appends on scroll and correctly
resets to one item on a locale switch, and the carousel + `rxResource` interaction specifically
(the highest-risk combination — Phase 2's `effect()` reacting to Phase 5's resource-driven data)
still produces no duplicated dots/listeners and zero console errors.

---

## Suggested sequencing

1. ~~Phase 0 (same day, trivial)~~ — done
2. ~~Phase 1 (foundational — do before anything else architectural)~~ — done
3. ~~Phase 1.5 (fix test infra — unblocks real regression coverage for Phase 2)~~ — done
4. ~~Phase 2 (one component at a time, verify each)~~ — done
5. ~~Phase 4 (forms & images)~~ — done (certificate images skipped by explicit decision)
6. ~~Phase 3 (zoneless change detection)~~ — done
7. ~~Phase 5 (optional polish, once comfortable with signals from Phase 2)~~ — done

All phases complete. Remaining known-but-out-of-scope items, found along the way and
deliberately not folded in (see the relevant phase sections above for detail):
- `certificates.component.html` images left on plain `<img>` (non-uniform source image
  dimensions, explicit decision to skip)
- `home.component.html`'s `@for (project of ...; track project)` uses identity-based tracking,
  which Angular's dev console flags (`NG0956`) as forcing full DOM re-creation on every locale
  switch instead of efficient diffing — pre-existing, found during Phase 4 verification
