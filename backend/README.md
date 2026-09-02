# Panovia — Backend API

REST API for Panovia. Built with **Express + TypeScript**, backed by
**Neon PostgreSQL** (direct `pg` connection) with first-party token auth.

## Stack
- Express 4 + TypeScript (ESM)
- `pg` (node-postgres) against Neon Postgres
- First-party auth: scrypt password hashing + HS256 access tokens signed with `JWT_SECRET`
- Zod validation, Helmet, CORS, Morgan

## Setup

```bash
cd backend
cp .env.example .env     # fill in the Neon URL and a JWT_SECRET
npm install
npm run migrate          # applies src/db/schema.sql to the database
npm run dev              # http://localhost:4000
```

## Scripts
| Script            | Description                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Start with hot reload (tsx watch)        |
| `npm run build`   | Compile TypeScript to `dist/`            |
| `npm start`       | Run the compiled server                  |
| `npm run migrate` | Apply the SQL schema to the database     |
| `npm run seed:images` | Download demo catalogue images      |
| `npm run seed`    | Load the full demo dataset              |
| `npm run typecheck` | Type-check without emitting            |

## API Overview
Base URL: `http://localhost:4000/api`

| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/register` | Create user + profile, returns session |
| POST | `/auth/login` | Email/password sign-in |
| POST | `/auth/forgot-password` | Send reset email |
| GET  | `/auth/me` | Current profile *(auth)* |
| GET  | `/dashboard` | KPIs + trends + recent activity *(auth)* |
| `GET/POST` | `/products` `/customers` `/suppliers` `/categories` | List (page/limit/search/sort) + create *(auth)* |
| `GET/PATCH/DELETE` | `/{resource}/:id` | Read / update / soft-delete *(auth)* |
| `GET/POST/DELETE` | `/purchases` | Create increases stock; delete reverses it *(auth)* |
| `GET/POST/DELETE` | `/sales` | Validates & deducts stock; delete restores it *(auth)* |
| GET | `/reports/{products\|customers\|suppliers\|purchases\|sales}` | Report data *(auth)* |
| `GET/PATCH` | `/settings` | Business info & preferences *(auth)* |

All authenticated routes require `Authorization: Bearer <access token>` — the token returned by `POST /auth/login` or `/auth/register`.

## Business rules enforced
- Unique SKU / barcode per owner
- `selling_price >= purchase_price`
- Stock can never go below zero; sales validate available stock
- Purchases increase stock, sales decrease it (atomic transactions)
- Soft deletes (`deleted_at`) across all resources
- Per-organization data isolation — every query is scoped to `organization_id`
  and guarded by the role matrix in `src/lib/permissions.ts`

## Notes on connections
The API connects to Neon over the **pooled** endpoint (`DATABASE_URL`); the
direct endpoint (`DATABASE_URL_UNPOOLED`) is kept for migrations and one-off
scripts. Neon presents a publicly trusted certificate, so `sslmode=verify-full`
works without any custom CA.

## Demo data
```bash
npm run migrate      # apply src/db/schema.sql
npm run seed:images  # download catalogue pictures into frontend/public/seed
npm run seed         # 3 organizations, 13 accounts, a year of trading
```
Every seeded account uses the password `password123`.
