# Meenakshi Build World — Enterprise Tile Marketplace

Production-ready enterprise B2B & B2C marketplace for vitrified slabs, tiles, and sanitaryware. Includes a dynamic mega menu, product catalog, 3D room visualizer, tile calculator, compare tool, and admin portal.

## Tech Stack

- **Backend:** Node.js + Express
- **Database:** PostgreSQL (`pg`) / SQLite (`sqlite3`)
- **Frontend:** Vanilla JS SPA (Bootstrap 5 grid + Remix Icons, GSAP)
- **Auth:** JWT + bcryptjs

## Project Structure

```
.
├── public/               # Frontend (SPA)
│   ├── index.html        # Entry point (header mount, router, footer)
│   ├── css/style.css     # Design system + all styling
│   └── js/
│       ├── app.js        # SPA router / state
│       ├── api.js        # API client
│       ├── gsap-animations.js
│       └── components/   # Views: navbar, hero, filter, visualizer,
│                         # calculator, product-detail, compare, cart,
│                         # customer-dash, dealer-dash, admin-panel
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
