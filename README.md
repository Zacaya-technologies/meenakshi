# Meenakshi Build World — Enterprise Tile Marketplace

Production-ready enterprise B2B & B2C marketplace for vitrified slabs, tiles, and sanitaryware. Includes a dynamic mega menu, product catalog, 3D room visualizer, tile calculator, compare tool, and admin portal.

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** MySQL / MariaDB (`mysql2`, used on Hostinger) / SQLite (`sqlite3`, local + Vercel) / PostgreSQL (`pg`)
- **Frontend:** Next.js 15 (App Router) + React 19, Tailwind CSS 4, Framer Motion (Node.js 20.17+)
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
| `npm run build` | Build the Next.js site |
| `npm start`  | Run the production site (`next start`; the API runs in-process) |
| `npm run start:api` | Run the Express API on its own (port 3000) |
| `npm run dev`| Run site + API (dev)   |
| `npm run seed`| Seed the database      |
| `npm run export:mysql` | Export the SQLite database to `database/meenakshi_mysql.sql` |

## Product catalogue (Somany range)

The live catalogue is the Somany Ceramics range imported from `scripts/data/products_overall.csv`
(3,300 products that have an image; images live in `public/images/products/<slug>.webp`).

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

## Deploying on Hostinger (MySQL)

Hostinger runs the site as a Node.js web app with its MySQL database. The app switches to
MySQL whenever the `DB_*` variables below are set; without them it uses the bundled SQLite file.

**1. Load the database (once).** In hPanel open **Databases → phpMyAdmin**, select your
database (e.g. `u141162847_meenakshi_db`), open **Import**, choose
`database/meenakshi_mysql.sql` (or the smaller `.sql.gz`) and click **Import**. This creates
all tables and loads the full catalogue, settings and the admin account.

**2. Create the web app.** hPanel → **Websites → Add website → Node.js Apps**, import this
GitHub repository (branch `main`). Framework: **Next.js**, Node **22** (20.17 or newer),
build command `npm run build`, start command `npm start`.

**3. Set environment variables** (see `.env.example`):

| Variable | Value |
| --- | --- |
| `DB_HOST` | `localhost` (or the MySQL host shown in hPanel → Databases) |
| `DB_PORT` | `3306` |
| `DB_NAME` | your database name, e.g. `u141162847_meenakshi_db` |
| `DB_USER` | the database user from hPanel → Databases |
| `DB_PASSWORD` | that user's password |
| `JWT_SECRET` | a long random string (signs admin logins) |

Deploy; product images ship with the repo (`public/images/products`).

**Updating the catalogue later.** Import products locally as usual (`npm run import:somany`,
SQLite), then export **only the catalogue tables** and import that file in phpMyAdmin:

```bash
python3 scripts/export_mysql.py --catalog-only   # -> database/meenakshi_catalog_mysql.sql
```

It replaces products, categories, brands and collections but keeps the live site's orders,
inquiries, users, blogs and settings. (Importing the full `meenakshi_mysql.sql` again would
replace those too.) Product edits made in the live admin panel are overwritten by a catalogue
import, so make catalogue changes locally.

After deploying, sign in to `/admin` with the seeded admin account and change its password.
