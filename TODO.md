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
- [x] Somany catalogue (6,200 products, duplicate names removed) with images and category tagging
- [x] Browser QA pass — scripted in headless Chrome:
      user flows (search, menus, filters, cart, quick view, calculator, contact, admin),
      layout at 320–1920px, dark mode, keyboard navigation and focus return,
      axe-core accessibility scan (0 violations)
- [x] Legacy SPA removed from `public/`; Express is API-only
- [x] Security upgrades: Next.js 15.5, React 19, nodemailer 10, Tailwind CSS 4
      (`npm audit`: 0 vulnerabilities); unused multer removed. sqlite3 stays on 5.1.7:
      6.x Linux binaries need glibc 2.38, which Vercel's runtime lacks

- [x] Dealer Login page + dealer portal (dealer price on product pages, orders, credit limit,
      change password); admin "Dealer & Admin Logins" page to create logins / reset passwords
- [x] Admin product images: select files or drag & drop (resized to WebP in the browser,
      stored in the `media_uploads` table, served from `/api/v1/uploads/*`); image edits now save
- [x] Admin product list shows drafts; homepage "New Arrivals" shows newly added products

## Not yet done
- [ ] Change the seeded admin password (`Password123!` is public in `server/seed.js`)
      and set `JWT_SECRET` in Vercel
- [ ] Replace the Unsplash hero images with real showroom/project photography
- [ ] Real figures for the homepage/About stats (150+ brands, 50K+ sq.ft, 4.8 rating; SKUs now 6,200)
- [ ] Next.js 15 → 16 (15.5 is patched; 16 needs the middleware→proxy and React 19.2 changes)
- [ ] Persistent database for production writes (SQLite on Vercel is read-only)
