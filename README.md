# akifzahin.dev

Personal portfolio and blog of Akif Zahin — Full-stack Developer & AI Builder based in Dhaka, Bangladesh.

🌐 **Live:** [akifzahin.dev](https://akifzahin.dev)

---

## Overview

A fast, cyberpunk-aesthetic portfolio site built with Astro, featuring SPA navigation, a multi-preset theme system, and a custom cursor. Designed to showcase projects, experience, and writing — with a focus on performance and visual polish.

---

## Tech Stack

| Layer      | Technology                                    |
| ---------- | --------------------------------------------- |
| Framework  | [Astro](https://astro.build) v5                  |
| Routing    | Astro ClientRouter (SPA)                      |
| Styling    | Custom CSS (no component libraries)           |
| Blog       | Astro Content Collections with`glob` loader |
| Deployment | [Vercel](https://vercel.com)                     |
| Domain     | [Vercel](https://vercel.com)                     |
| Analytics  | Vercel Analytics + Speed Insights             |

---

## Features

- **SPA navigation** via Astro ClientRouter — zero full-page reloads
- **Multi-preset theme system** — 6 themes (Cyberpunk, Webcore, Retro Futurism, Mythic Fiction, Dreamcore, Cassette Futurism) with dark/light mode toggle and localStorage persistence
- **Custom cursor** — magnetic blob with DOM-based trail chain, no canvas, no blur
- **Blog** — paginated, tag-filtered posts via Astro content collections
- **Performance-first** — no `backdrop-filter`, GPU-composited animations, `isolation: isolate` on interactive cards
- **Responsive** — mobile hamburger drawer, touch-aware cursor (hidden on touchscreens)
- **Glitch FX** — CSS-only glitch animations on hero text and cards via pseudo-elements

---

## Project Structure

```
/
├── public/
│   └── images/          # Theme hero images, logos, profile photo
├── src/
│   ├── components/
│   │   ├── BackButton.astro
│   │   └── ThemeSwitcher.astro
│   ├── content/
│   │   └── blog/        # Markdown blog posts
│   ├── layouts/
│   │   └── Layout.astro # Root layout — cursor, nav, persistent UI
│   ├── pages/
│   │   ├── index.astro  # Home — hero, work, skills, experience, contact
│   │   └── blog/        # Blog index + post pages
│   └── styles/
│       └── global.css   # All styles (no scoped CSS)
```

---

## Theme System

Themes are defined as data attributes on dropdown items in `ThemeSwitcher.astro`. Each theme sets:

- `--primary` and `--accent` CSS variables (hex)
- `--primary-rgb` / `--accent-rgb` for `rgba()` usage
- `--hero-image` for the hero background

On page load, theme variables are restored from `localStorage` before first paint via an inline `<script>` in `<head>` to prevent flash.

---

## Cursor System

The custom cursor lives in `Layout.astro` and is recreated on every `astro:page-load` event (required due to ClientRouter body swaps).

- **Blob** — circular ring that lerps toward the mouse at `0.10` speed
- **Trail** — 8 DOM divs chained with lerp at `0.30` speed, front half colored `--primary`, back half `--accent`
- **Dot** — snaps directly to mouse position
- Colors are sampled live from CSS variables on every rAF frame so theme switches reflect instantly
- Disabled entirely on touchscreens via `(hover: none) and (pointer: coarse)` media query

---

## Performance Notes

- All `backdrop-filter: blur` removed — replaced with dark tinted panels (`rgba(0,0,0,0.75)`) and `box-shadow` edge glows
- `text-shadow` on hero/contact text replaced with `filter: drop-shadow` (GPU composited)
- Glitch pseudo-element animations paused on hover for interactive cards to prevent compositor thrashing
- `will-change: transform`, `transform: translateZ(0)`, and `isolation: isolate` applied to all interactive cards
- Theme hero images preloaded on `astro:page-load` so switching is instant

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## License

MIT — feel free to use as reference or inspiration. Please don't copy content or design wholesale.

---

Built by [Akif Zahin](https://akifzahin.dev)
