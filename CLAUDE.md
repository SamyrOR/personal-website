# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Personal portfolio website (samyr.dev) built with Angular 22, Sass (BEM/SMACSS), and `@ngx-translate` for i18n (English/Portuguese). Content (projects, certificates) is data-driven from static JSON files, not hardcoded in components.

## Commands

- `npm start` / `ng serve` — dev server at `http://localhost:4200/`
- `npm run build` / `ng build` — production build, output to `dist/personal-website`
- `npm run watch` — dev build in watch mode
- `npm run lint` / `ng lint` — ESLint (angular-eslint + typescript-eslint) over `src/**/*.ts` and `src/**/*.html`
- `npm test` / `ng test` — unit tests via the Angular `unit-test` builder, which runs on **Vitest** (not Karma). Currently broken pre-existing (unrelated to standalone migration, see `ROADMAP.md` Phase 0): `src/test.ts`'s Karma-era `platformBrowserDynamicTesting` setup conflicts with the builder's own auto-injected test-bed init, and a couple of spec files have stale references. Needs its own fix pass before `npm test` is usable again.
- `npm run e2e` / `ng e2e` — Cypress e2e tests (opens interactive runner)
- `npm run cypress:run` — Cypress e2e tests headless
- `npm run cypress:open` — Cypress interactive runner directly

There is no single-test-file CLI flag documented in this repo; scope test runs using the underlying tool's normal filtering (e.g. Vitest's `-t`/pattern args passed after `ng test --`, or opening a single spec in the Cypress runner).

## Architecture

**Fully standalone.** The app bootstraps via `bootstrapApplication(AppComponent, { providers: [...] })` in `src/app.config.ts` (`provideRouter`, `provideHttpClient`, `provideTranslateService`, etc.). Every component — `AppComponent` and all feature components (`about-me`, `certificates`, `contact`, `projects`, `regular`'s `header`/`footer`/`home`/`not-found`) — is standalone with its own `imports: [...]` array; there are no `NgModule`s left in `src/app`. When adding a new component, import what it needs directly rather than reaching for a module.

**Routing** is defined in `src/app/app.routes.ts` at the top level; each feature route is lazy-loaded via `loadComponent` pointing directly at its `*.component.ts`, with `data: { title: ... }` set inline on the route. That title drives the dynamic page title, set in `AppComponent.setDynamicTitle()` (`src/app/app.component.ts`) by walking `router.events` down to the deepest activated route.

**Data flow.** `GetDataService` (`src/app/shared/get-data.service.ts`) fetches locale-specific static JSON via `HttpClient` from `src/assets/data/{projects,certificates}/*_<locale>.json`, where `<locale>` is the current `ngx-translate` language code (`en_US` or `pt_BR`). Components (e.g. `CertificatesComponent`) call this on init and re-fetch on `TranslateService.onLangChange`, since content itself is per-language, not just UI strings. Corresponding UI string translations live separately in `src/assets/i18n/{en_US,pt_BR}.json`.

**Locale/theme persistence.** Both the selected language and the dark/light theme are persisted to `localStorage` (`lang`, `selected-theme` keys) and read back on init in `AppComponent`/`HeaderComponent`. Theme switching toggles a `dark-theme`/`light-theme` class on `document.documentElement` and swaps logo image `src` attributes directly (see `HeaderComponent.switchTheme()`).

**Infinite scroll pattern.** List-heavy pages (e.g. `CertificatesComponent`) don't render the full fetched dataset at once — they push items incrementally into an `initialData` array via `ngx-infinite-scroll`'s `onScroll()` callback, with a `loading` flag while data is (re)fetched on locale change.

**Styles** follow SMACSS layering under `src/assets/styles/`: `abstracts` (variables/mixins/functions, no output), `base` (reset), `layout` (one partial per page/section), `modules` (reusable UI pieces like buttons/cards/carousel), `themes` (light/dark variable overrides). `src/styles.scss` only `@use`s the top-level `base`, `layout`, `modules` index partials. New components get `style: "scss"` by default per `angular.json` schematics config.
