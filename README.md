# akifzahin.dev
<img src="/public/images/hero.svg" alt="Akif Zahin" />
Personal portfolio and blog for Akif Zahin — a full-stack developer and AI builder based in Dhaka, Bangladesh. Built with Astro and deployed on Vercel, backed by a custom database-driven CMS.

**Live site:** [akifzahin.dev](https://akifzahin.dev)

<!-- SCREENSHOT: Hero section of the homepage (light or dark mode, whichever looks best) -->

<!-- Recommended: full-width screenshot, 1200–1600px wide, showing the hero name, profile image, and one theme's Vanta background -->

---

## Overview

What began as a static portfolio site grew into a full-stack application with a persistent database, a custom content management system, moderated comments, and a set of interactive, theme-aware visual effects. The project intentionally avoids off-the-shelf CMS platforms and third-party comment widgets in favor of owning the full stack — every part of it, from the auth flow to the rich text editor to the animated backgrounds, is hand-built.

<!-- SCREENSHOT: Theme switcher in action — side-by-side or GIF showing 2-3 of the six themes -->

<!-- Recommended: a composite image or short GIF cycling through Cyberpunk, Webcore, and one other theme -->

---

## Tech Stack

### Core Framework

- **[Astro 6](https://astro.build)** — `output: 'static'` with selective server rendering (`prerender = false`) on routes that need live data
- **[Vercel](https://vercel.com)** — hosting and deployment, via `@astrojs/vercel@10.0.8`
- **TypeScript** — used throughout for scripts, API routes, and library code

### Data Layer

- **[Turso](https://turso.tech)** (libSQL / SQLite) — persistent database, chosen specifically because Vercel's filesystem is ephemeral between deploys
- **[`@libsql/client`](https://github.com/tursodatabase/libsql-client-ts)** — database driver

### Content & Editing

- **[Tiptap](https://tiptap.dev) v3** — rich text editor for the post-writing experience, content stored as structured JSON
- **`@tiptap/html`** — server-side JSON → HTML rendering for published posts
- **[Vercel Blob](https://vercel.com/docs/storage/vercel-blob)** — image storage for post covers and inline images

### Authentication

- **[`jose`](https://github.com/panva/jose)** — JWT signing and verification
- Single-password admin login with a 30-day session cookie, enforced globally via Astro middleware

### Frontend & Styling

- **CSS custom properties** — a fully dynamic, runtime-switchable color and theming system (no CSS-in-JS, no Tailwind for the core site)
- **[Vanta.js](https://www.vantajs.com/)** (Three.js-based) — animated backgrounds, one per visual theme
- **[p5.js](https://p5js.org/)** — required by specific Vanta effects (TRUNK, TOPOLOGY)
- **Custom canvas animation** — a hand-rolled matrix-rain effect for the Webcore theme (no off-the-shelf library covers this)
- **Astro `ClientRouter`** — SPA-style page transitions without a full framework

### Analytics & Monitoring

- **`@vercel/analytics`**
- **`@vercel/speed-insights`**

### Fonts

- Orbitron, Share Tech Mono, Rubik, Inter, Space Grotesk (Google Fonts)

---

## Features

### Blog, fully database-backed

Posts are written, edited, and published entirely from a custom `/admin` dashboard — no markdown files, no git commits required to publish. Content is stored as Tiptap JSON and rendered to HTML at request time.

<!-- SCREENSHOT: Admin dashboard showing the posts list -->

<!-- Recommended: /admin view with a few posts visible, draft and published states both showing -->

<!-- SCREENSHOT: The Tiptap editor in use, mid-post -->

<!-- Recommended: /admin/new or /admin/edit/[id] with formatted text, maybe an inline image -->

### Claps

A Medium-style appreciation mechanic — up to 50 claps per visitor per post, tracked via a client-generated UUID in `localStorage`. No account or login required.

### Comments, fully moderated

Visitors can leave a name and comment on any published post. Every comment is held in a pending state until manually approved from `/admin` — nothing reaches the public post page without review. Submissions are checked against a plain-text blocklist at the point of submission: a match is rejected outright with a clear, honest message, and nothing is written to the database. A honeytrap field deters basic automated spam without adding friction for real visitors.

<!-- SCREENSHOT: A blog post with the comments section visible, including at least one comment -->

<!-- Recommended: /blog/[any-post] scrolled to the comments section -->

<!-- SCREENSHOT: The admin comment moderation queue -->

<!-- Recommended: /admin with at least one pending comment, showing Approve/Reject buttons -->

### Six live-switchable visual themes

Cyberpunk, Webcore, Retro Futurism, Mythic Fiction, Dreamcore, and Cassette Futurism — each with its own color palette, animated background, and hero imagery. Theme and dark/light mode preferences persist in `localStorage` and are applied before first paint to avoid a flash of the wrong theme on load.

---

## Architecture Notes

- **Static by default, dynamic where it counts.** The site builds with `output: 'static'`, and individual routes opt into server rendering only where a database round-trip is actually needed (`/admin/*`, `/api/*`, `/blog/[slug]`).
- **Authentication is enforced centrally, once.** `src/middleware.ts` guards every request to `/admin` and `/api/admin/*` before it reaches a route handler. Individual admin routes don't duplicate that check.
- **Comment moderation has no silent shortcuts.** The blocklist check runs synchronously at submission time. A match is rejected immediately and visibly — never silently dropped, never faked as a success. Everything that passes still lands in a pending queue for manual review.
- **Third-party library cleanup isn't always trustworthy.** Vanta.js's `.destroy()` doesn't reliably remove its own `<canvas>` element on every theme change, so the mount point is force-cleared (`innerHTML = ''`) after every teardown to guarantee no stale background survives into the next theme.

---

## Local Development

### Requirements

- Node.js `>=22.12.0`
- A Turso database and auth token
- npm

### Setup

```bash
git clone https://github.com/akifzahin/<repo-name>.git
cd <repo-name>
npm install
```

Create a `.env` file in the project root:

```
TURSO_DB_URL=your-turso-database-url
TURSO_AUTH_TOKEN=your-turso-auth-token
SESSION_SECRET=a-long-random-string
```

Apply the schema in [`db/schema.sql`](./db/schema.sql) to your Turso database, then start the dev server:

```bash
npm run dev
```

---

## Database Schema

Full table definitions live in [`db/schema.sql`](./db/schema.sql), covering:

- `posts` — blog post content, metadata, and publish state
- `claps` — per-visitor clap counts, capped at 50 per post
- `comments` — visitor comments with a moderation-gated approval flow

---


## Contact

Open to full-time roles, freelance work, and collaborations.

- **GitHub:** [github.com/akifzahin](https://github.com/akifzahin)
- **LinkedIn:** [linkedin.com/in/akifzahin](https://linkedin.com/in/akifzahin)
- **Site:** [akifzahin.dev](https://akifzahin.dev)
