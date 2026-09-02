-- ============================================================================
--  Panovia — Database Schema (multi-tenant SaaS)
--  Every business row belongs to an organization. Users join organizations via
--  memberships (with a role). A platform "super admin" can view all orgs.
--  PostgreSQL (Neon). Self-contained: identity lives in public.users, so there
--  is no dependency on a provider-managed `auth` schema. Idempotent.
-- ============================================================================

create extension if not exists "pgcrypto";

-- One-time migration from the Supabase-era model: those tables carried foreign
-- keys into auth.users and a single-organization `company` table, neither of
-- which exist here. Drop them so everything below is recreated cleanly.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='company')
     or not exists (select 1 from information_schema.tables where table_schema='public' and table_name='organizations')
     or not exists (
        select 1 from information_schema.columns
        where table_schema='public' and table_name='users' and column_name='password_hash')
     or not exists (
        select 1 from information_schema.columns
        where table_schema='public' and table_name='products' and column_name='organization_id') then
    drop table if exists
      public.sales_items, public.sales, public.purchase_items, public.purchases,
      public.payments, public.reviews, public.products, public.categories,
      public.customers, public.suppliers, public.activity_logs, public.memberships,
      public.organizations, public.password_reset_tokens, public.users, public.company cascade;
  end if;
end $$;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- ─── users (identity + profile; platform super-admin flag) ──────────────────
create table if not exists public.users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null,
  password_hash  text,
  full_name      text,
  phone          text,
  avatar_url     text,
  theme          text not null default 'system',
  is_super_admin boolean not null default false,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create unique index if not exists uq_users_email on public.users(lower(email));

-- ─── password reset tokens (single-use, hashed at rest) ─────────────────────
create table if not exists public.password_reset_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_reset_tokens_user on public.password_reset_tokens(user_id);
create unique index if not exists uq_reset_token_hash on public.password_reset_tokens(token_hash);

-- ─── organizations (the tenant) ─────────────────────────────────────────────
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references public.users(id) on delete cascade,
  logo_url   text,
  phone      text,
  email      text,
  address    text,
  currency   text not null default 'BDT',
  timezone   text not null default 'Asia/Dhaka',
  language   text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orgs_owner on public.organizations(owner_id);

-- ─── memberships (user ↔ organization, with role; max 5 enforced in API) ────
create table if not exists public.memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  role            text not null default 'viewer'
                  check (role in ('admin','inventory_manager','sales_manager','accountant','viewer')),
  status          text not null default 'active' check (status in ('active','inactive')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, user_id)
);
create index if not exists idx_memberships_user on public.memberships(user_id);
create index if not exists idx_memberships_org  on public.memberships(organization_id);

-- ─── categories ─────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  description     text,
  image_url       text,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create unique index if not exists uq_categories_org_name on public.categories(organization_id, lower(name)) where deleted_at is null;
create index if not exists idx_categories_org on public.categories(organization_id) where deleted_at is null;

-- ─── products ───────────────────────────────────────────────────────────────
create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  name            text not null,
  sku             text not null,
  barcode         text,
  unit            text not null default 'pcs',
  purchase_price  numeric(14,2) not null default 0 check (purchase_price >= 0),
  selling_price   numeric(14,2) not null default 0 check (selling_price >= 0),
  stock           numeric(14,2) not null default 0 check (stock >= 0),
  min_stock       numeric(14,2) not null default 0 check (min_stock >= 0),
  image_url       text,
  status          text not null default 'active' check (status in ('active','inactive')),
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  constraint chk_selling_gte_purchase check (selling_price >= purchase_price)
);
create unique index if not exists uq_products_org_sku     on public.products(organization_id, lower(sku)) where deleted_at is null;
create unique index if not exists uq_products_org_barcode on public.products(organization_id, barcode) where deleted_at is null and barcode is not null;
create index if not exists idx_products_org on public.products(organization_id) where deleted_at is null;
create index if not exists idx_products_category on public.products(category_id);

-- ─── customers ──────────────────────────────────────────────────────────────
create table if not exists public.customers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  email           text,
  phone           text,
  address         text,
  notes           text,
  outstanding_due numeric(14,2) not null default 0,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists idx_customers_org on public.customers(organization_id) where deleted_at is null;

-- ─── suppliers ──────────────────────────────────────────────────────────────
create table if not exists public.suppliers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  email           text,
  phone           text,
  address         text,
  notes           text,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists idx_suppliers_org on public.suppliers(organization_id) where deleted_at is null;

-- ─── purchases ──────────────────────────────────────────────────────────────
create table if not exists public.purchases (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id     uuid references public.suppliers(id) on delete set null,
  created_by      uuid references public.users(id) on delete set null,
  reference       text not null,
  purchase_date   date not null default current_date,
  subtotal        numeric(14,2) not null default 0,
  tax             numeric(14,2) not null default 0,
  discount        numeric(14,2) not null default 0,
  total           numeric(14,2) not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists idx_purchases_org on public.purchases(organization_id) where deleted_at is null;
create index if not exists idx_purchases_supplier on public.purchases(supplier_id);

create table if not exists public.purchase_items (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete restrict,
  quantity    numeric(14,2) not null check (quantity > 0),
  unit_price  numeric(14,2) not null default 0,
  line_total  numeric(14,2) not null default 0
);
create index if not exists idx_purchase_items_purchase on public.purchase_items(purchase_id);
create index if not exists idx_purchase_items_product  on public.purchase_items(product_id);

-- ─── sales ──────────────────────────────────────────────────────────────────
create table if not exists public.sales (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid references public.customers(id) on delete set null,
  created_by      uuid references public.users(id) on delete set null,
  invoice_no      text not null,
  sale_date       date not null default current_date,
  subtotal        numeric(14,2) not null default 0,
  tax             numeric(14,2) not null default 0,
  discount        numeric(14,2) not null default 0,
  total           numeric(14,2) not null default 0,
  paid            numeric(14,2) not null default 0,
  payment_method  text not null default 'cash',
  status          text not null default 'completed',
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index if not exists idx_sales_org on public.sales(organization_id) where deleted_at is null;
create index if not exists idx_sales_customer on public.sales(customer_id);

create table if not exists public.sales_items (
  id         uuid primary key default gen_random_uuid(),
  sale_id    uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity   numeric(14,2) not null check (quantity > 0),
  unit_price numeric(14,2) not null default 0,
  line_total numeric(14,2) not null default 0
);
create index if not exists idx_sales_items_sale    on public.sales_items(sale_id);
create index if not exists idx_sales_items_product on public.sales_items(product_id);

-- ─── activity_logs (per organization) ───────────────────────────────────────
create table if not exists public.activity_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  action          text not null,
  entity          text not null,
  entity_id       uuid,
  description     text,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_activity_org on public.activity_logs(organization_id, created_at desc);

-- ─── payments (customer settlements against invoices / outstanding dues) ─────
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id     uuid references public.customers(id) on delete set null,
  sale_id         uuid references public.sales(id) on delete set null,
  amount          numeric(14,2) not null check (amount > 0),
  method          text not null default 'cash',
  note            text,
  paid_at         date not null default current_date,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists idx_payments_org on public.payments(organization_id);
create index if not exists idx_payments_customer on public.payments(customer_id);

-- ─── reviews (one per organization; shown as testimonials on the homepage) ───
create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid references public.users(id) on delete set null,
  rating          smallint not null default 5 check (rating between 1 and 5),
  comment         text not null,
  published       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id)
);

-- ─── site_content (super-admin editable public marketing copy overrides) ─────
create table if not exists public.site_content (
  id         smallint primary key default 1,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_content_single_row check (id = 1)
);
insert into public.site_content (id, data) values (1, '{}'::jsonb) on conflict (id) do nothing;

-- ─── updated_at triggers ────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['users','organizations','memberships','categories','products','customers','suppliers','purchases','sales','reviews']
  loop
    execute format('drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format('create trigger trg_%1$s_updated before update on public.%1$s
                    for each row execute function set_updated_at();', t);
  end loop;
end $$;

-- ─── Access control ─────────────────────────────────────────────────────────
-- Nothing connects to this database except the API, which owns the single
-- application role and scopes every query by organization_id plus the role
-- matrix in src/lib/permissions.ts. The Supabase-era RLS policies were dropped
-- with the move to Neon: they were written against auth.uid(), which only
-- exists inside Supabase's PostgREST session, so they can neither be evaluated
-- nor relied on here. If a direct-from-browser data path is ever added, tenant
-- isolation has to be re-established with policies driven by a session GUC
-- (e.g. current_setting('app.user_id')) before that path is opened.
