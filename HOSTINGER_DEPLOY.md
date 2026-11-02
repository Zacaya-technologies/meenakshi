# Redeploying on Hostinger — 6,200-product release

This release changes both the **code** and the **product catalogue** (3,600 → 6,200 Somany
products). Hostinger needs both: redeploy the app from GitHub, then import the new catalogue
into the MySQL database. Do it in this order so the new pages never point at missing data.

## 1. Back up the live database

hPanel → **Databases → phpMyAdmin** → select `u141162847_meenakshi_db` → **Export** →
*Quick*, *SQL* → **Export**. Keep the file; it restores everything if something goes wrong.

## 2. Import the new product catalogue

Still in phpMyAdmin, with the same database selected → **Import** → choose a file from this
repository:

| Situation | File to import |
| --- | --- |
| The live database already has the site's tables (normal case) | `database/meenakshi_catalog_mysql.sql.gz` |
| Empty / brand-new database | `database/meenakshi_mysql.sql.gz` |

Leave the other options at their defaults and click **Import**.

- The **catalogue** file replaces products, images, variants, inventory, categories, brands and
  collections, and keeps users, admin password, orders, enquiries, blogs and business settings.
- The **full** file also recreates those tables with the seeded admin account
  (`Password123!` — change it after signing in).
- Both files were test-imported into MariaDB 10.11; the catalogue import kept existing
  enquiries.

Check: run `SELECT COUNT(*) FROM products;` in the **SQL** tab — it should return **6200**.

## 3. Redeploy the app from GitHub

hPanel → **Websites → (the Node.js app) → Deployments** → **Redeploy** (branch `main`,
build `npm run build`, start `npm start`, Node 22). If the app was never created, follow
*Deploying on Hostinger* in `README.md`.

The 6,200 product images ship inside the repository (`public/images/products/`), so no
separate image upload is needed.

## 4. Environment variables

hPanel → the Node.js app → **Environment variables**. Required (unchanged):

| Variable | Value |
| --- | --- |
| `DB_HOST` | `localhost` (or the host shown in hPanel → Databases) |
| `DB_PORT` | `3306` |
| `DB_NAME` | `u141162847_meenakshi_db` |
| `DB_USER` / `DB_PASSWORD` | the database user from hPanel → Databases |
| `JWT_SECRET` | a long random string |

Optional — e-mail a copy of every contact-form enquiry (they are saved in the database either
way; see *Inquiries* in `/admin`):

| Variable | Value |
| --- | --- |
| `SMTP_HOST` / `SMTP_PORT` | e.g. `smtp.hostinger.com` / `587` |
| `SMTP_USER` / `SMTP_PASS` | a Hostinger mailbox and its password |
| `SMTP_FROM` | the sender address, e.g. that mailbox |
| `SALES_EMAIL` | where enquiries go, e.g. `info@meenakshibuildworld.com` |

Redeploy after changing variables.

## 5. Check the live site

- **All Tiles** shows **6200 products** and *Page 1 of 517*; the homepage shows *6,200 Premium SKUs*.
- A new product opens with its photo, e.g. `/product/artisan-blanco-ceramic`.
- `/parking-tiles` lists 290 products, `/outdoor-tiles` 514.
- Send a test enquiry from **Contact** and confirm it appears under `/admin` → *Inquiries*.
- `/sitemap.xml` lists `https://` URLs on your domain.

## Rolling back

Import the backup from step 1 in phpMyAdmin, and redeploy the previous commit from the
Deployments page.
