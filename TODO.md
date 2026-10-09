# TODO — Meenakshi Build World (Next.js storefront + Express API)

## Running locally

`npm run dev` starts both processes:

| URL | What it serves |
| --- | --- |
| `http://localhost:3001` | The Next.js storefront and admin console |
| `http://localhost:3000` | The Express API only (`/api/v1/*`) — the old vanilla-JS SPA in `public/` has been removed |

On Vercel the Express app runs inside Next.js via `app/api/[...path]/route.js`.

## Done
- [x] Next.js app, mega menu, mobile drawer, shop, product, cart, compare, calculator, admin
- [x] Somany catalogue (734 products) with images and category tagging
- [x] Browser QA pass — scripted in headless Chrome:
      user flows (search, menus, filters, cart, quick view, calculator, contact, admin),
      layout at 320–1920px, dark mode, keyboard navigation and focus return,
      axe-core accessibility scan (0 violations)
- [x] Legacy SPA removed from `public/`; Express is API-only

## Not yet done
- [ ] Change the seeded admin password (`Password123!` is public in `server/seed.js`)
      and set `JWT_SECRET` in Vercel
- [ ] Replace the Unsplash hero images with real showroom/project photography
- [ ] Real figures for the homepage/About stats (2000+ SKUs, 150+ brands, 4.8 rating)
- [ ] Dealer Login page (currently "coming soon")
- [ ] Major dependency upgrades: Next.js 14 → 16, nodemailer 9 → 10, sqlite3 5 → 6
- [ ] Persistent database for production writes (SQLite on Vercel is read-only)
