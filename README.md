# Meenakshi Build World — Enterprise Tile Marketplace

Production-ready enterprise B2B & B2C marketplace for vitrified slabs, tiles, and sanitaryware. Includes a dynamic mega menu, product catalog, 3D room visualizer, tile calculator, compare tool, and admin portal.

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** PostgreSQL (`pg`) / SQLite (`sqlite3`)
- **Frontend:** Next.js 14 (App Router) + React 18, Tailwind CSS, Framer Motion
- **Auth:** JWT + bcryptjs

## Project Structure

```
.
├── app/                  # Next.js routes (home, shop, taxonomy pages,
│                         # product, cart, compare, calculator, admin…);
│                         # app/api/[...path] runs the Express API in-process
├── components/           # UI: layout (header, mega menu, drawer, footer),
│                         # shop (product card, filters, quick view), home, admin
├── lib/                  # API client, cart/wishlist store, business settings
├── public/images/        # Logo + product images (products/<slug>.webp)
├── server/               # Express API
│   ├── server.js         # App entry
│   ├── db.js             # DB connection (pg/sqlite)
│   ├── seed.js           # Seed data
│   ├── middleware/auth.js
│   └── routes/           # auth, product, category, brand, blog, order,
│                         # cart, compare, wishlist, inquiry, menu, seo
├── schema.sql            # Database schema
├── package.json
└── .gitignore
```

## Getting Started

```bash
npm install
npm run seed      # seed database
npm run dev       # start server (http://localhost:PORT)
```

## Scripts

| Command      | Description            |
| ------------ | ---------------------- |
| `npm start`  | Run production server  |
| `npm run dev`| Run server (dev)       |
| `npm run seed`| Seed the database      |

## Product catalogue (Somany range)

The live catalogue is the Somany Ceramics range imported from `scripts/data/products_overall.csv`
(734 products that have an image; images live in `public/images/products/<slug>.webp`).

```bash
npm run import:somany   # python3 scripts/import_somany_products.py
```

The script clears all products (and their images, variants, inventory, category links and
reviews), then re-imports every product with an image and tags it to the matching main
categories and their By Area / Application / Size / Design / Type / Finish / Colour / Surface
sub-categories. Missing size sub-categories are created automatically. A per-product
summary is written to `scripts/data/import_report.csv`.

Notes:
- Size comes from the size code inside each Somany SKU; finish, design and colour are inferred
  from the product name (colour falls back to the photo when the name has none).
- The sheet has no prices, so products are stored with price 0 and the site shows
  **Price on Request** (the price filter hides itself until prices exist). Set prices in the
  admin panel, or add a price column and extend the script.
- Pieces/coverage per box are standard values for each size — adjust per product if needed.
- `npm run seed` recreates the old demo products — run `npm run import:somany` after it.
