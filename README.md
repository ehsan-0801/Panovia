# Panovia

> *Everything Your Business Needs in One Place.*

A modern, web-based ERP for small and medium businesses in Bangladesh —
inventory, purchasing, sales, customers, suppliers, reporting and analytics in
one platform.

This repository is split into two independently runnable apps:

```
Panovia/
├── backend/    Express + TypeScript REST API  (Neon Postgres + first-party auth)
├── frontend/   React 19 + Vite dashboard      (Tailwind + shadcn-style UI)
└── *.md        Product/requirements specs
```

## Quick start

Open two terminals.

**1 — Backend**
```bash
cd backend
npm install
npm run migrate      # creates all tables on Neon (run once)
npm run dev          # → http://localhost:4000
```

**2 — Frontend**
```bash
cd frontend
npm install
npm run dev          # → http://localhost:5173
```

Then open http://localhost:5173, create an account, and you're in.

> Both `.env` files are pre-filled with the project's Neon credentials.
> `.env.example` files document every variable. **Do not commit real secrets** —
> the `.env` files are git-ignored.

To load the demo dataset (3 organizations and a year of trading history):

```bash
cd backend
npm run seed:images  # downloads catalogue pictures into frontend/public/seed
npm run seed         # every seeded account uses the password `password123`
```

## Architecture

```
React (Vite) ──HTTP(Bearer JWT)──▶ Express API ──pg──▶ Neon PostgreSQL
                                        │
                              auth lives here too — accounts,
                              password hashes and token signing
```

- **Auth**: the API owns identity. Passwords are hashed with scrypt in
  `public.users`, sign-in returns an HS256 token signed with `JWT_SECRET`, the
  frontend stores it and sends it as `Authorization: Bearer`, and the backend
  verifies it in-process on every request. No third-party auth service.
- **Data**: the API owns all business logic — stock movements, validation, and
  per-owner isolation run in PostgreSQL transactions.
- **Security**: protected routes, server-side validation (Zod), a per-role
  permission matrix, rate-limited auth endpoints, and soft deletes. Tenant
  isolation is enforced in the API — every query is scoped by `organization_id`
  — since the database has no direct-from-browser access path.

See each subfolder's `README.md` for details, and `Panovia-Requirements.md`
for the full product specification.
