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

**Additional pre-existing issue found while verifying (not part of this roadmap, needs its own
fix):** `npm test` fails independently of everything above — `home.component.spec.ts` imports
`GetDataService` from a broken absolute-looking path, `get-data.service.spec.ts` calls
`getProjects()`/`getCertificates()` without the required `locale` argument, and `src/test.ts`'s
Karma-era setup (`@angular/platform-browser-dynamic/testing`, top-level `await import('zone.js/testing')`)
isn't compatible with the new Vitest builder target. None of this was touched by Phase 0/1.

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
instead of an array (schema violation). `npm test` still fails after those fixes — see the
pre-existing test-infra issue noted under Phase 0, untouched by this migration.

Full manual browser verification done via a headless Playwright script (`chromium-cli` wasn't
available; installed `playwright` + Chromium directly): navigated to all 6 routes (`/home`,
`/certificates`, `/projects`, `/about-me`, `/contact`, and an unmatched route for the 404 page)
— all rendered correct content/title with zero console errors. Also exercised the theme toggle
and language switcher on `/home`: both worked correctly (dark theme + logo swap applied, UI
strings and route labels switched to English), zero console errors during interaction.

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

1. ~~Phase 0 (same day, trivial)~~ — done
2. ~~Phase 1 (foundational — do before anything else architectural)~~ — done
3. Phase 2 (one component at a time, verify each) — **up next**
4. Phase 4 (can slot in anytime after Phase 1, independent track)
5. Phase 3 (only after Phase 2 is fully verified)
6. Phase 5 (optional polish, once comfortable with signals from Phase 2)
