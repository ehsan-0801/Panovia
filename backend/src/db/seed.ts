/**
 * Seeds a full demo platform: three organizations (each completely isolated),
 * their members, a year of trading history and a platform super admin.
 *
 *   npm run seed:images   # once — downloads product/category pictures
 *   npm run seed
 *
 * Password for every account: password123
 *
 * The data is generated from a fixed random seed, so re-running produces the
 * same dataset. Rows are written with multi-row INSERTs inside one transaction
 * per organization — a row-at-a-time seed spends its entire runtime waiting on
 * network round-trips to Neon.
 */
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../lib/auth.js';
import { pool, query } from './pool.js';
import { CATEGORIES, PRODUCTS, categoryImage, productImage, type ProductSeed } from './seed-data.js';

const PASSWORD = 'password123';

// ── deterministic pseudo-randomness ─────────────────────────────────────────
let state = 0x9e3779b9;
function rnd(): number {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));
const chance = (p: number) => rnd() < p;
const sample = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const money = (n: number) => Math.round(n * 100) / 100;

const DAY = 86_400_000;
const today = new Date();
today.setHours(12, 0, 0, 0);
const dayOffset = (daysAgo: number) => new Date(today.getTime() - daysAgo * DAY);
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// ── bulk insert ─────────────────────────────────────────────────────────────
async function bulkInsert(table: string, columns: string[], rows: unknown[][]) {
  if (!rows.length) return;
  const perChunk = Math.max(1, Math.floor(15_000 / columns.length));
  for (let i = 0; i < rows.length; i += perChunk) {
    const chunk = rows.slice(i, i + perChunk);
    const values = chunk
      .map((r, ri) => `(${r.map((_, ci) => `$${ri * columns.length + ci + 1}`).join(',')})`)
      .join(',');
    await query(`insert into ${table} (${columns.join(',')}) values ${values}`, chunk.flat());
  }
}

// ── people ──────────────────────────────────────────────────────────────────
interface SeedUser { id: string; email: string; name: string; phone: string }

const FIRST = ['Rahim', 'Karim', 'Nadia', 'Sabina', 'Tanvir', 'Farhana', 'Imran', 'Sultana', 'Jahid', 'Mitu',
  'Shakil', 'Rumana', 'Arif', 'Nusrat', 'Sohel', 'Tania', 'Rafiq', 'Shirin', 'Mahmud', 'Laila'];
const LAST = ['Traders', 'Store', 'Enterprise', 'Mart', 'Grocery', 'Bazar', 'Trading', 'Supply', 'Shop', 'Corner'];
const AREAS = ['Mirpur, Dhaka', 'Uttara, Dhaka', 'Dhanmondi, Dhaka', 'Agrabad, Chattogram', 'Khulshi, Chattogram',
  'Zindabazar, Sylhet', 'Sonadanga, Khulna', 'Boalia, Rajshahi', 'Tongi, Gazipur', 'Narayanganj Sadar',
  'Bogura Sadar', 'Cumilla Sadar', 'Rangpur Sadar', 'Barishal Sadar', 'Jessore Sadar'];
const SUPPLIER_NAMES = ['Dhaka Wholesale Ltd', 'National Distributors', 'Padma Foods', 'Bengal Trading Co',
  'Meghna Consumer Goods', 'Sundarban Supply Chain', 'Jamuna Agro Products', 'City Distribution House',
  'Golden Harvest Depot', 'Riverine Traders'];
const PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'card', 'bank'];

/** Organizations to build, in order. */
const ORGS = [
  {
    name: 'Panovia Demo Store',
    phone: '+880 1700-000000', email: 'hello@panovia.com', address: 'House 42, Road 7, Dhanmondi, Dhaka 1205',
    days: 365, salesPerDay: [1, 4] as [number, number], productCount: 60, customerCount: 20, supplierCount: 9,
    invPrefix: 'INV', poPrefix: 'PO',
    members: [
      { email: 'admin@panovia.com', name: 'Ehsanul Ahmmed', role: 'admin', phone: '+880 1710-100001' },
      { email: 'inventory@panovia.com', name: 'Tanvir Hasan', role: 'inventory_manager', phone: '+880 1710-100002' },
      { email: 'sales@panovia.com', name: 'Nusrat Jahan', role: 'sales_manager', phone: '+880 1710-100003' },
      { email: 'accountant@panovia.com', name: 'Mahmudul Karim', role: 'accountant', phone: '+880 1710-100004' },
      { email: 'viewer@panovia.com', name: 'Shirin Akter', role: 'viewer', phone: '+880 1710-100005' },
    ],
    review: { rating: 5, comment: 'Stock counts finally match the shelves. Onboarding the whole shop took an afternoon, and the daily sales summary is the first thing I open every morning.' },
  },
  {
    name: 'Bengal Mart',
    phone: '+880 1800-000000', email: 'hello@bengalmart.com', address: 'CDA Avenue, Agrabad, Chattogram 4100',
    days: 270, salesPerDay: [1, 3] as [number, number], productCount: 42, customerCount: 16, supplierCount: 7,
    invPrefix: 'BM-INV', poPrefix: 'BM-PO',
    members: [
      { email: 'owner@bengalmart.com', name: 'Sabina Yasmin', role: 'admin', phone: '+880 1810-200001' },
      { email: 'inventory@bengalmart.com', name: 'Rafiqul Islam', role: 'inventory_manager', phone: '+880 1810-200002' },
      { email: 'sales@bengalmart.com', name: 'Imran Hossain', role: 'sales_manager', phone: '+880 1810-200003' },
      { email: 'accounts@bengalmart.com', name: 'Farhana Rahman', role: 'accountant', phone: '+880 1810-200004' },
    ],
    review: { rating: 5, comment: 'Two branches, one dashboard. Switching organizations takes a click and the roles keep each team on exactly what they should see.' },
  },
  {
    name: 'Padma Fresh Grocers',
    phone: '+880 1900-000000', email: 'contact@padmafresh.com', address: 'Shaheb Bazar, Boalia, Rajshahi 6100',
    days: 180, salesPerDay: [1, 3] as [number, number], productCount: 32, customerCount: 12, supplierCount: 6,
    invPrefix: 'PF-INV', poPrefix: 'PF-PO',
    members: [
      { email: 'owner@padmafresh.com', name: 'Jahidul Alam', role: 'admin', phone: '+880 1910-300001' },
      { email: 'inventory@padmafresh.com', name: 'Rumana Haque', role: 'inventory_manager', phone: '+880 1910-300002' },
      { email: 'sales@padmafresh.com', name: 'Sohel Rana', role: 'sales_manager', phone: '+880 1910-300003' },
    ],
    review: { rating: 4, comment: 'The purchase-to-stock flow saves us a spreadsheet a week. Would love supplier payments next, but the reports already cover what the accountant asks for.' },
  },
];

async function main() {
  console.log('▶ Seeding — this writes a full year of demo trading history.\n');

  // Fresh start: users cascade into organizations, which cascade into everything.
  await query('truncate table public.users cascade');
  console.log('  · cleared previous data');

  const passwordHash = await hashPassword(PASSWORD);

  // ── accounts ──────────────────────────────────────────────────────────────
  const superAdmin: SeedUser = { id: randomUUID(), email: 'super@panovia.com', name: 'Platform Super Admin', phone: '+880 1600-000000' };
  const userRows: unknown[][] = [[superAdmin.id, superAdmin.email, passwordHash, superAdmin.name, superAdmin.phone, true, dayOffset(400)]];
  const orgMembers: SeedUser[][] = [];

  for (const org of ORGS) {
    const members: SeedUser[] = [];
    for (const m of org.members) {
      const u: SeedUser = { id: randomUUID(), email: m.email, name: m.name, phone: m.phone };
      members.push(u);
      userRows.push([u.id, u.email, passwordHash, u.name, u.phone, false, dayOffset(org.days + int(5, 30))]);
    }
    orgMembers.push(members);
  }
  await bulkInsert('public.users', ['id', 'email', 'password_hash', 'full_name', 'phone', 'is_super_admin', 'created_at'], userRows);
  console.log(`  · ${userRows.length} accounts (1 super admin + ${userRows.length - 1} members)`);

  const summary: string[] = [];

  for (const [orgIndex, org] of ORGS.entries()) {
    const members = orgMembers[orgIndex];
    const owner = members[0];
    const inventoryUser = members.find((_, i) => org.members[i].role === 'inventory_manager') ?? owner;
    const salesUser = members.find((_, i) => org.members[i].role === 'sales_manager') ?? owner;
    const accountsUser = members.find((_, i) => org.members[i].role === 'accountant') ?? owner;

    const orgId = randomUUID();
    const createdAt = dayOffset(org.days + 2);
    await bulkInsert('public.organizations',
      ['id', 'name', 'owner_id', 'phone', 'email', 'address', 'currency', 'timezone', 'language', 'created_at'],
      [[orgId, org.name, owner.id, org.phone, org.email, org.address, 'BDT', 'Asia/Dhaka', 'en', createdAt]]);

    await bulkInsert('public.memberships', ['organization_id', 'user_id', 'role', 'status', 'created_at'],
      members.map((u, i) => [orgId, u.id, org.members[i].role, 'active', dayOffset(org.days + 1 - i)]));

    // ── categories & products ───────────────────────────────────────────────
    const categoryIds = new Map<string, string>();
    await bulkInsert('public.categories',
      ['id', 'organization_id', 'name', 'description', 'image_url', 'created_by', 'created_at'],
      CATEGORIES.map((c) => {
        const id = randomUUID();
        categoryIds.set(c.name, id);
        return [id, orgId, c.name, c.description, categoryImage(c.slug), inventoryUser.id, createdAt];
      }));

    // Each org stocks a different slice of the catalogue.
    const catalogue = PRODUCTS.filter((_, i) => i % ORGS.length !== orgIndex || orgIndex === 0).slice(0, org.productCount);
    type Prod = ProductSeed & { id: string; stock: number };
    const products: Prod[] = catalogue.map((p) => ({ ...p, id: randomUUID(), stock: 0 }));

    // ── customers & suppliers ───────────────────────────────────────────────
    interface Cust { id: string; name: string; email: string | null; phone: string | null; address: string | null; due: number }
    const customers: Cust[] = Array.from({ length: org.customerCount }, (_, i) => ({
      id: randomUUID(),
      name: `${sample(FIRST)} ${sample(LAST)}`,
      email: `customer${i + 1}@${org.name.toLowerCase().replace(/[^a-z]/g, '')}.example.com`,
      phone: `+880 17${String(10_000_000 + int(0, 8_999_999)).slice(0, 8)}`,
      address: sample(AREAS),
      due: 0,
    }));
    // A walk-in row so counter sales aren't all attributed to named accounts.
    const walkIn: Cust = { id: randomUUID(), name: 'Walk-in Customer', email: null, phone: null, address: null, due: 0 };
    customers.push(walkIn);

    const suppliers = SUPPLIER_NAMES.slice(0, org.supplierCount).map((name, i) => ({
      id: randomUUID(),
      name,
      email: `orders@${name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 14)}.example.com`,
      phone: `+880 18${String(10_000_000 + int(0, 8_999_999)).slice(0, 8)}`,
      address: AREAS[i % AREAS.length],
    }));

    await bulkInsert('public.customers',
      ['id', 'organization_id', 'name', 'email', 'phone', 'address', 'outstanding_due', 'created_by', 'created_at'],
      customers.map((c, i) => [c.id, orgId, c.name, c.email, c.phone, c.address, 0, salesUser.id, dayOffset(org.days - int(0, 20) - i)]));
    await bulkInsert('public.suppliers',
      ['id', 'organization_id', 'name', 'email', 'phone', 'address', 'created_by', 'created_at'],
      suppliers.map((s, i) => [s.id, orgId, s.name, s.email, s.phone, s.address, inventoryUser.id, dayOffset(org.days - i)]));

    // ── a year of trading, simulated day by day ─────────────────────────────
    const purchaseRows: unknown[][] = [];
    const purchaseItemRows: unknown[][] = [];
    const saleRows: unknown[][] = [];
    const saleItemRows: unknown[][] = [];
    const paymentRows: unknown[][] = [];
    const activityRows: unknown[][] = [];
    let poNo = 1000;
    let invNo = 1000;

    /** Books a purchase: raises stock and records the supplier invoice. */
    const recordPurchase = (daysAgo: number, picks: Prod[], factor: number) => {
      const date = dayOffset(daysAgo);
      const id = randomUUID();
      let subtotal = 0;
      for (const p of picks) {
        const qty = Math.max(5, Math.round(p.minStock * factor));
        subtotal += qty * p.purchase;
        p.stock += qty;
        purchaseItemRows.push([id, p.id, qty, p.purchase, money(qty * p.purchase)]);
      }
      const tax = money(subtotal * 0.05);
      const discount = chance(0.25) ? money(subtotal * 0.02) : 0;
      purchaseRows.push([id, orgId, sample(suppliers).id, inventoryUser.id, `${org.poPrefix}-${++poNo}`,
        isoDate(date), money(subtotal), tax, discount, money(subtotal + tax - discount), null, date]);
      return { id, date };
    };

    // Roughly one in eight lines is left un-reordered at the end of the run.
    const reorderPending = new Set(products.filter((_, i) => i % 8 === 3).map((p) => p.id));

    // Opening stock, booked the day the shop went live.
    for (let i = 0; i < products.length; i += 8) {
      recordPurchase(org.days, products.slice(i, i + 8), int(2, 3));
    }

    for (let daysAgo = org.days - 1; daysAgo >= 0; daysAgo--) {
      const date = dayOffset(daysAgo);
      const weekend = date.getDay() === 5; // Friday is the quiet day here

      // Restock whatever has fallen near its minimum, roughly twice a week.
      // A few lines are deliberately left waiting on a reorder in the closing
      // weeks, so the low-stock widget and the reorder report have real rows.
      if (daysAgo % 3 === 0) {
        const low = products.filter((p) => p.stock <= p.minStock * 1.2
          && !(daysAgo < 21 && reorderPending.has(p.id)));
        if (low.length) recordPurchase(daysAgo, low.slice(0, int(4, 9)), int(1, 2));
      }

      const salesToday = weekend ? int(0, org.salesPerDay[0]) : int(org.salesPerDay[0], org.salesPerDay[1]);
      for (let s = 0; s < salesToday; s++) {
        const sellable = products.filter((p) => p.stock >= 3);
        if (!sellable.length) break;

        const lines: { p: Prod; qty: number }[] = [];
        const lineCount = int(1, Math.min(5, sellable.length));
        for (let l = 0; l < lineCount; l++) {
          const p = sample(sellable);
          if (lines.some((x) => x.p.id === p.id)) continue;
          const qty = Math.min(int(1, 6), Math.floor(p.stock));
          if (qty > 0) lines.push({ p, qty });
        }
        if (!lines.length) continue;

        const saleId = randomUUID();
        let subtotal = 0;
        for (const { p, qty } of lines) {
          subtotal += qty * p.selling;
          p.stock -= qty;
          saleItemRows.push([saleId, p.id, qty, p.selling, money(qty * p.selling)]);
        }
        const tax = chance(0.35) ? money(subtotal * 0.05) : 0;
        const discount = chance(0.2) ? money(subtotal * (chance(0.5) ? 0.05 : 0.1)) : 0;
        const total = money(subtotal + tax - discount);

        // Named customers sometimes buy on credit; walk-ins always pay up front.
        const customer = chance(0.25) ? walkIn : sample(customers.slice(0, -1));
        const credit = customer !== walkIn && chance(0.3);
        const paid = credit ? money(total * (chance(0.5) ? 0.5 : 0)) : total;
        const method = customer === walkIn ? 'cash' : sample(PAYMENT_METHODS);

        saleRows.push([saleId, orgId, customer.id, salesUser.id, `${org.invPrefix}-${++invNo}`, isoDate(date),
          money(subtotal), tax, discount, total, paid, method, 'completed', null, date]);

        if (paid > 0) {
          paymentRows.push([orgId, customer.id, saleId, paid, method, 'Paid at point of sale', isoDate(date), salesUser.id, date]);
        }

        let outstanding = money(total - paid);
        // Most credit customers settle up within a few weeks.
        if (outstanding > 0 && daysAgo > 20 && chance(0.65)) {
          const settleDate = dayOffset(daysAgo - int(3, 20));
          const amount = chance(0.7) ? outstanding : money(outstanding * 0.5);
          paymentRows.push([orgId, customer.id, saleId, amount, sample(PAYMENT_METHODS), 'Due settlement', isoDate(settleDate), accountsUser.id, settleDate]);
          // The recorded payment is reflected on the invoice, as the API does.
          saleRows[saleRows.length - 1][10] = money(paid + amount);
          outstanding = money(outstanding - amount);
        }
        customer.due = money(customer.due + outstanding);
      }
    }

    // Draw the un-reordered lines down below their reorder point with a short
    // run of recent demand, so "low stock" on the dashboard reflects real sales
    // rather than a number written straight into the products table.
    for (const p of products) {
      if (!reorderPending.has(p.id) || p.stock <= p.minStock) continue;
      let excess = p.stock - Math.max(1, Math.round(p.minStock * (chance(0.3) ? 0.3 : 0.8)));
      if (excess <= 0 || excess > p.minStock * 4) continue;

      while (excess > 0) {
        const qty = Math.min(excess, int(3, Math.max(4, Math.round(p.minStock / 2))));
        const daysAgo = int(1, 18);
        const date = dayOffset(daysAgo);
        const saleId = randomUUID();
        const subtotal = money(qty * p.selling);
        const total = subtotal;
        const customer = chance(0.4) ? walkIn : sample(customers.slice(0, -1));
        const method = customer === walkIn ? 'cash' : sample(PAYMENT_METHODS);

        p.stock -= qty;
        excess -= qty;
        saleItemRows.push([saleId, p.id, qty, p.selling, subtotal]);
        saleRows.push([saleId, orgId, customer.id, salesUser.id, `${org.invPrefix}-${++invNo}`, isoDate(date),
          subtotal, 0, 0, total, total, method, 'completed', null, date]);
        paymentRows.push([orgId, customer.id, saleId, total, method, 'Paid at point of sale', isoDate(date), salesUser.id, date]);
      }
    }

    // ── activity log — a believable recent trail ─────────────────────────────
    const recentSales = saleRows.slice(-14);
    const recentPurchases = purchaseRows.slice(-6);
    for (const s of recentSales) {
      activityRows.push([orgId, salesUser.id, 'created', 'sales', s[0], `Recorded sale ${s[4]} (৳${s[9]})`, s[14]]);
    }
    for (const p of recentPurchases) {
      activityRows.push([orgId, inventoryUser.id, 'created', 'purchases', p[0], `Booked purchase ${p[4]} (৳${p[9]})`, p[11]]);
    }
    activityRows.push([orgId, owner.id, 'updated', 'settings', null, 'Updated organization settings', dayOffset(int(1, 9))]);
    activityRows.push([orgId, inventoryUser.id, 'updated', 'products', null, 'Adjusted reorder levels after the monthly stock count', dayOffset(int(2, 12))]);

    // ── write everything ────────────────────────────────────────────────────
    await bulkInsert('public.products',
      ['id', 'organization_id', 'category_id', 'name', 'sku', 'unit', 'purchase_price', 'selling_price', 'stock', 'min_stock', 'image_url', 'status', 'created_by', 'created_at'],
      products.map((p) => [p.id, orgId, categoryIds.get(p.category) ?? null, p.name, p.sku, p.unit,
        p.purchase, p.selling, p.stock, p.minStock, productImage(p.slug),
        chance(0.05) ? 'inactive' : 'active', inventoryUser.id, createdAt]));

    await bulkInsert('public.purchases',
      ['id', 'organization_id', 'supplier_id', 'created_by', 'reference', 'purchase_date', 'subtotal', 'tax', 'discount', 'total', 'notes', 'created_at'],
      purchaseRows);
    await bulkInsert('public.purchase_items', ['purchase_id', 'product_id', 'quantity', 'unit_price', 'line_total'], purchaseItemRows);
    await bulkInsert('public.sales',
      ['id', 'organization_id', 'customer_id', 'created_by', 'invoice_no', 'sale_date', 'subtotal', 'tax', 'discount', 'total', 'paid', 'payment_method', 'status', 'notes', 'created_at'],
      saleRows);
    await bulkInsert('public.sales_items', ['sale_id', 'product_id', 'quantity', 'unit_price', 'line_total'], saleItemRows);
    await bulkInsert('public.payments',
      ['organization_id', 'customer_id', 'sale_id', 'amount', 'method', 'note', 'paid_at', 'created_by', 'created_at'],
      paymentRows);
    await bulkInsert('public.activity_logs',
      ['organization_id', 'user_id', 'action', 'entity', 'entity_id', 'description', 'created_at'], activityRows);

    // Outstanding balances, as the payment endpoints would have left them.
    const owing = customers.filter((c) => c.due > 0);
    if (owing.length) {
      await query(
        `update public.customers c set outstanding_due = v.due
         from (values ${owing.map((_, i) => `($${i * 2 + 1}::uuid, $${i * 2 + 2}::numeric)`).join(',')}) as v(id, due)
         where c.id = v.id`,
        owing.flatMap((c) => [c.id, c.due]),
      );
    }

    await bulkInsert('public.reviews', ['organization_id', 'user_id', 'rating', 'comment', 'published', 'created_at'],
      [[orgId, owner.id, org.review.rating, org.review.comment, true, dayOffset(int(10, 60))]]);

    const revenue = saleRows.reduce((sum, r) => sum + Number(r[9]), 0);
    summary.push(`  · ${org.name}: ${members.length} members · ${products.length} products · ${customers.length} customers · ` +
      `${suppliers.length} suppliers · ${purchaseRows.length} purchases · ${saleRows.length} sales · ` +
      `${paymentRows.length} payments · ৳${Math.round(revenue).toLocaleString('en-US')} revenue`);
    console.log(summary[summary.length - 1]);
  }

  console.log('\n✅ Seed complete. Every account uses the password: password123\n');
  for (const org of ORGS) {
    console.log(`   ${org.name}`);
    for (const m of org.members) console.log(`     ${m.email.padEnd(30)} ${m.role}`);
  }
  console.log(`\n   Super admin: ${superAdmin.email}`);
  console.log('\n   Product images are served from frontend/public/seed — run `npm run seed:images` if they are missing.');
  await pool.end();
}

main().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  await pool.end();
  process.exit(1);
});
