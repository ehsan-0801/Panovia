/**
 * Downloads one illustration per catalogue entry into the frontend's public
 * folder, so seeded products and categories have real pictures without any
 * upload service in the loop:
 *
 *   frontend/public/seed/products/<slug>.jpg
 *   frontend/public/seed/categories/<slug>.jpg
 *
 *   npm run seed:images          # skips files that already exist
 *   npm run seed:images -- --force
 *
 * Images come from loremflickr (keyword-matched Creative Commons photos from
 * Flickr) — fine for a demo dataset; swap in real product photography before
 * anyone shows this to a customer.
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATEGORIES, PRODUCTS } from './seed-data.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '../../../frontend/public/seed');
const force = process.argv.includes('--force');

const MIN_BYTES = 5_000; // anything smaller is an error page, not a photo

async function exists(path: string) {
  try {
    const s = await stat(path);
    return s.size > MIN_BYTES;
  } catch {
    return false;
  }
}

async function download(keyword: string, dest: string, seed: string): Promise<'saved' | 'skipped' | 'failed'> {
  if (!force && (await exists(dest))) return 'skipped';

  // `lock` keeps the same photo coming back for the same slug across runs.
  const sources = [
    `https://loremflickr.com/640/480/${encodeURIComponent(keyword)}?lock=${seed}`,
    `https://picsum.photos/seed/${encodeURIComponent(seed)}/640/480`,
  ];
  for (const url of sources) {
    try {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(20_000) });
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.byteLength < MIN_BYTES) continue;
      await writeFile(dest, buf);
      return 'saved';
    } catch {
      // try the next source
    }
  }
  return 'failed';
}

async function main() {
  await mkdir(join(PUBLIC_DIR, 'products'), { recursive: true });
  await mkdir(join(PUBLIC_DIR, 'categories'), { recursive: true });

  const jobs = [
    ...CATEGORIES.map((c) => ({ kind: 'categories', slug: c.slug, keyword: c.keyword })),
    ...PRODUCTS.map((p) => ({ kind: 'products', slug: p.slug, keyword: p.keyword })),
  ];

  const counts = { saved: 0, skipped: 0, failed: 0 };
  const failures: string[] = [];
  let done = 0;

  const queue = [...jobs];
  const workers = Array.from({ length: 6 }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const dest = join(PUBLIC_DIR, job.kind, `${job.slug}.jpg`);
      const result = await download(job.keyword, dest, job.slug);
      counts[result] += 1;
      if (result === 'failed') failures.push(`${job.kind}/${job.slug}`);
      done += 1;
      if (done % 10 === 0) console.log(`  · ${done}/${jobs.length}`);
    }
  });
  await Promise.all(workers);

  console.log(`\n✅ images: ${counts.saved} downloaded, ${counts.skipped} already present, ${counts.failed} failed`);
  if (failures.length) console.log('   failed:', failures.join(', '));
  console.log(`   → ${PUBLIC_DIR}`);
}

main().catch((err) => {
  console.error('❌ Image download failed:', err);
  process.exit(1);
});
