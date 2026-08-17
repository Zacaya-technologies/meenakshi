# TODO — Meenakshi Build World Next.js Frontend (MyTyles-style Mega Menu)

## ⚠️ Which URL to open

There are **two frontends** in this repo:

| URL | What it serves |
| --- | --- |
| `http://localhost:3000` | Express API **+ the legacy vanilla-JS SPA** in `public/` — no mega menu |
| `http://localhost:3001` | **The Next.js app** — this is the redesigned site |

`npm run dev` starts both. Open **http://localhost:3001**. Port 3000 still serves the
old SPA from `public/` (see `server/server.js` → `express.static` + the `app.get('*')`
fallback), which is why the mega menu appears "missing" there. Delete or gate those two
lines once the Next frontend fully replaces the SPA.

## Steps
- [x] Scaffold Next.js config (package.json, next.config, tailwind, postcss, jsconfig)
- [x] Create lib (api client, app store/context) + JSON-driven menu data
- [x] Build layout: Header, MegaMenu panel (in-flow push), MegaColumns, MobileDrawer, Footer, SearchModal, CartDrawer
- [x] Build shop: FilterSidebar, ProductCard, QuickView, ShopClient (breadcrumb/title/count/sort/grid/pagination)
- [x] Build pages: root layout, home, /shop, /product/[slug], /compare
- [x] Install deps + run both servers + verify
- [x] Redesign desktop nav + mega menu to the MyTyles interaction model
      (non-navigating triggers, in-flow push, per-category content swap, hover intent)
- [x] Full-screen mobile drawer with two-level accordions
- [x] Hero banner carousel + persistent contact rail

## Not yet done
- [ ] Routes referenced by the new nav that do not exist yet:
      `/calculator`, `/store-locator`, `/dealer-login`, `/make-to-order`, `/callback`
- [ ] Replace the Unsplash hero images with real brand photography
- [ ] Browser QA pass (hover intent, keyboard nav, 375px, dark mode) — code is
      verified by build + SSR markup only, not yet clicked through
