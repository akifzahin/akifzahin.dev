# Design Notes — akifzahin.dev

This document exists so I (or anyone else) can look at this codebase a year
from now and understand *why* it's built the way it is, not just *what* it
does. It's a living doc — update it when a decision changes.

## Stack & Why

| Layer | Choice | Why |
|---|---|---|
| Framework | Astro 6 (`output: 'static'`, hybrid rendering via per-page `prerender = false`) | Static-first for the marketing/blog pages (fast, cheap), opt into SSR only where I need it (admin, API routes) |
| Adapter | `@astrojs/vercel` | Matches hosting, gives me API routes as serverless functions for free |
| Navigation | `astro:transitions` `ClientRouter` | SPA-style page swaps without a full framework — keeps the site feeling fast without adopting React/Next for the whole site |
| Database | Turso (libSQL/SQLite) | Cheap, serverless-friendly SQLite; good fit for a single-writer personal CMS — didn't need Postgres-scale features |
| Editor | Tiptap v3 + React | Only place React is used — an island (`client:load`) inside otherwise-static Astro pages |
| Auth | `jose` (JWT) + single password | This is a single-user admin panel, not multi-tenant — a full auth provider would be over-engineering |
| Media | Vercel Blob | For CMS-uploaded images only; static/build-time assets stay in `public/` |
| Styling | Plain CSS custom properties, no Tailwind | Needed a runtime-swappable theme system (6 themes × light/dark); utility classes don't help with that, CSS vars do |

## Architecture

```
src/
  components/       reusable UI (ThemeSwitcher, BackButton, BackToTop, admin/PostEditor)
  layouts/           Layout.astro — the one shared shell, owns <head>, nav, Vanta boot
  lib/                server-only: db.ts, posts.ts, comments.ts, session.ts, blocklist.ts
  middleware.ts       single gate for everything under /admin and /api/admin
  pages/
    admin/            SSR admin dashboard, editor, login (all prerender = false)
    api/               REST-ish endpoints, grouped by resource
    blog/               public blog index + [slug]
  scripts/            standalone client scripts (see note below — some are stale)
  styles/global.css   single global stylesheet, unscoped by design (see below)
```

### Why one global.css instead of scoped/component styles

Astro supports scoped `<style>` per component, which I use for one-off things.
But most of the visual system (themes, glitch effects, buttons, cards) needs
to respond to the *same* set of CSS custom properties everywhere, and a lot of
elements share classes across completely different pages (`.tag`, `.btn-primary`,
`.project-card` pattern reused for `.game-card`, `.post-nav-btn`, etc). Scoping
would mean redeclaring the same rules per-component. Trade-off: the stylesheet
is large and requires discipline (see CSS scoping bug class below) — I'd
reconsider this at a larger team size or file size than I'm at now.

### Why middleware.ts instead of per-route auth checks

One file (`src/middleware.ts`) gates every `/admin` and `/api/admin` route by
checking a signed JWT cookie. This means every new admin page or API route is
protected by default — I don't have to remember to add an auth check when I
add a new route, which is the failure mode I actually care about avoiding
(forgetting = leaking data), more than flexibility.

## Key Decisions & Patterns

### Theming system
Six themes × light/dark, stored as CSS custom properties (`--primary`,
`--accent`, plus `-rgb` variants for `rgba()` calls JS can't do with hex
directly) and persisted to `localStorage`. Applied in three places that all
have to agree:
1. An inline `<script is:inline>` in `<head>` — runs before first paint to
   avoid a flash of the default theme
2. `ThemeSwitcher.astro` — the picker UI + the actual `applyTheme()` logic
3. `Layout.astro`'s `astro:before-swap` handler — carries the CSS vars across
   SPA navigations, since the incoming document doesn't have them yet

### SPA lifecycle discipline (`astro:page-load` / `astro:before-swap`)
Because `ClientRouter` swaps the DOM instead of doing a hard navigation,
anything that touches the DOM outside a component's own scope (Vanta
backgrounds, the cursor trail, scroll listeners) has to be explicitly
torn down on `astro:before-swap` and re-initialized on `astro:page-load`,
or it either duplicates itself or dies silently after the first navigation.
This bit me a few times early on — see the "stale closure" and "Vanta
lifecycle" notes below.

### `let` over `const` for values read inside event handlers
Recurring bug class: capturing a theme name, visitor ID, or piece of state
in a `const` at page-load time, then reading that stale value inside an
event handler that fires much later. Fixed by making anything that can
change over a page's lifetime a `let`, reassigned wherever the underlying
state changes (see `savedName` in `ThemeSwitcher.astro` for the canonical
example — it exists specifically so the dark-mode toggle always dispatches
the *currently active* theme name, not whichever theme was active at
page-load).

### Vanta lifecycle
`vantaInstance.destroy()` doesn't reliably remove its own `<canvas>` across
Vanta versions, so `destroyVanta()` also does a manual
`mount.innerHTML = ''` as a belt-and-suspenders step. Skipping this caused
leftover canvases stacking on top of each other across theme switches.

### Comments: pending-by-default, no in-between state
Every public comment lands with `approved = 0`. There's no "flagged" state —
the blocklist check either rejects the POST outright (400, nothing written)
or the comment goes to the pending queue for manual approval. I chose this
over a flag-and-still-show model because false negatives (bad comment slips
through) are worse for a personal site than false positives (a legitimate
comment waits for me to approve it).

### Clap system: optimistic UI + batched writes
Click-and-hold claps update the UI immediately (`localClap()`) and batch
the actual POST requests via a debounced `flushClaps()`, rather than firing
a network request per click. Capped at 50/visitor via a UUID stored in
`localStorage`, enforced again server-side (`claps.count <= 50` CHECK
constraint) since client-side caps are trivially bypassed.

## Known rough edges / would revisit

- **Dead script files.** `src/scripts/ui.js` and `src/scripts/cursor.js`
  appear to duplicate logic that now lives inline in `Layout.astro`'s
  `initPersistentUI()`. Need to confirm nothing imports them and delete if not.
- **`middleware.ts` console.log** — was logging the raw session JWT to server
  logs on every protected request. Pulled.
- **Empty blocklist** — comment filtering exists but the word list was empty,
  making it a silent no-op. Needs actual content.
- **Autosave has no unload guard** — `PostEditor.tsx` debounces saves at 10s
  with nothing catching `beforeunload`/`astro:before-swap`; a fast edit-then-
  navigate can lose data. Should flush on navigation away.
- **No `noindex` on `/admin/*`** — these routes shouldn't be indexable or in
  the sitemap; not yet enforced.
- **Full-file rewrites during iteration** — fine solo, since I'm the only
  reviewer of my own diffs. Would move to targeted diffs/PRs on a team so
  reviewers aren't re-reading whole files for a one-line change.
- **CSS not scoped** — works today; if this grows past its current size I'd
  introduce CSS modules or scoped styles per major section rather than one
  ~4000-line global.css.
