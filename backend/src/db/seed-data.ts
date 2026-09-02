/**
 * The catalogue the seed builds from. Kept in one place so `fetch-images.ts`
 * (which downloads the pictures into the frontend's public folder) and
 * `seed.ts` (which writes the rows) can never drift apart: the image file for
 * a product is always `/seed/products/<slug>.jpg`.
 */

export interface CategorySeed {
  name: string;
  slug: string;
  /** Search term used when downloading the illustration. */
  keyword: string;
  description: string;
}

export interface ProductSeed {
  name: string;
  sku: string;
  slug: string;
  keyword: string;
  category: string;
  unit: string;
  purchase: number;
  selling: number;
  minStock: number;
}

export const CATEGORIES: CategorySeed[] = [
  { name: 'Grains & Rice', slug: 'grains-rice', keyword: 'rice,grain', description: 'Rice, flour, pulses and everyday staples sold by weight.' },
  { name: 'Cooking Essentials', slug: 'cooking-essentials', keyword: 'cooking,oil', description: 'Edible oils, sugar, salt and the basics of every kitchen.' },
  { name: 'Spices & Masala', slug: 'spices-masala', keyword: 'spices,masala', description: 'Whole and ground spices, curry blends and seasoning.' },
  { name: 'Beverages', slug: 'beverages', keyword: 'tea,coffee', description: 'Tea, coffee, juices and soft drinks.' },
  { name: 'Snacks & Confectionery', slug: 'snacks', keyword: 'snacks,biscuits', description: 'Biscuits, chips, sweets and packaged snacks.' },
  { name: 'Dairy & Frozen', slug: 'dairy-frozen', keyword: 'dairy,milk', description: 'Milk, butter, cheese and frozen goods.' },
  { name: 'Household & Cleaning', slug: 'household', keyword: 'cleaning,detergent', description: 'Detergents, cleaners and household supplies.' },
  { name: 'Personal Care', slug: 'personal-care', keyword: 'soap,cosmetics', description: 'Soap, shampoo, oral care and grooming.' },
];

/** 60 SKUs — enough for pagination, low-stock alerts and category charts to look real. */
export const PRODUCTS: ProductSeed[] = [
  // ── Grains & Rice ──
  { name: 'Miniket Rice 5kg', sku: 'RICE-MIN-5', slug: 'miniket-rice-5kg', keyword: 'rice,sack', category: 'Grains & Rice', unit: 'bag', purchase: 380, selling: 465, minStock: 20 },
  { name: 'Miniket Rice 25kg', sku: 'RICE-MIN-25', slug: 'miniket-rice-25kg', keyword: 'rice,bag', category: 'Grains & Rice', unit: 'sack', purchase: 1820, selling: 2180, minStock: 8 },
  { name: 'Basmati Rice 1kg', sku: 'RICE-BAS-1', slug: 'basmati-rice-1kg', keyword: 'basmati,rice', category: 'Grains & Rice', unit: 'kg', purchase: 140, selling: 178, minStock: 30 },
  { name: 'Chinigura Rice 2kg', sku: 'RICE-CHI-2', slug: 'chinigura-rice-2kg', keyword: 'rice,grain', category: 'Grains & Rice', unit: 'pack', purchase: 260, selling: 320, minStock: 15 },
  { name: 'Atta (Wheat Flour) 2kg', sku: 'FLR-ATA-2', slug: 'atta-flour-2kg', keyword: 'wheat,flour', category: 'Grains & Rice', unit: 'pack', purchase: 118, selling: 148, minStock: 25 },
  { name: 'Maida (Refined Flour) 1kg', sku: 'FLR-MAI-1', slug: 'maida-flour-1kg', keyword: 'flour,baking', category: 'Grains & Rice', unit: 'kg', purchase: 72, selling: 92, minStock: 20 },
  { name: 'Masoor Dal 1kg', sku: 'DAL-MAS-1', slug: 'masoor-dal-1kg', keyword: 'lentils,pulses', category: 'Grains & Rice', unit: 'kg', purchase: 112, selling: 140, minStock: 20 },
  { name: 'Mug Dal 1kg', sku: 'DAL-MUG-1', slug: 'mug-dal-1kg', keyword: 'lentils,legumes', category: 'Grains & Rice', unit: 'kg', purchase: 148, selling: 182, minStock: 15 },
  { name: 'Chola Boot 1kg', sku: 'DAL-CHO-1', slug: 'chola-boot-1kg', keyword: 'chickpeas,legumes', category: 'Grains & Rice', unit: 'kg', purchase: 96, selling: 122, minStock: 18 },
  { name: 'Semai (Vermicelli) 200g', sku: 'SEM-200', slug: 'semai-200g', keyword: 'vermicelli,noodles', category: 'Grains & Rice', unit: 'pack', purchase: 34, selling: 46, minStock: 30 },

  // ── Cooking Essentials ──
  { name: 'Soybean Oil 5L', sku: 'OIL-SOY-5', slug: 'soybean-oil-5l', keyword: 'cooking,oil', category: 'Cooking Essentials', unit: 'can', purchase: 810, selling: 945, minStock: 12 },
  { name: 'Soybean Oil 1L', sku: 'OIL-SOY-1', slug: 'soybean-oil-1l', keyword: 'oil,bottle', category: 'Cooking Essentials', unit: 'bottle', purchase: 168, selling: 198, minStock: 30 },
  { name: 'Mustard Oil 500ml', sku: 'OIL-MUS-500', slug: 'mustard-oil-500ml', keyword: 'mustard,oil', category: 'Cooking Essentials', unit: 'bottle', purchase: 195, selling: 240, minStock: 15 },
  { name: 'Sunflower Oil 2L', sku: 'OIL-SUN-2', slug: 'sunflower-oil-2l', keyword: 'sunflower,oil', category: 'Cooking Essentials', unit: 'bottle', purchase: 395, selling: 468, minStock: 12 },
  { name: 'Refined Sugar 1kg', sku: 'SUG-1', slug: 'sugar-1kg', keyword: 'sugar,white', category: 'Cooking Essentials', unit: 'kg', purchase: 118, selling: 142, minStock: 25 },
  { name: 'Iodised Salt 1kg', sku: 'SLT-1', slug: 'salt-1kg', keyword: 'salt,kitchen', category: 'Cooking Essentials', unit: 'kg', purchase: 28, selling: 40, minStock: 40 },
  { name: 'Ghee 400g', sku: 'GHE-400', slug: 'ghee-400g', keyword: 'ghee,butter', category: 'Cooking Essentials', unit: 'jar', purchase: 640, selling: 760, minStock: 10 },
  { name: 'Honey 500g', sku: 'HON-500', slug: 'honey-500g', keyword: 'honey,jar', category: 'Cooking Essentials', unit: 'jar', purchase: 420, selling: 520, minStock: 10 },

  // ── Spices & Masala ──
  { name: 'Turmeric Powder 200g', sku: 'SPC-TUR-200', slug: 'turmeric-200g', keyword: 'turmeric,spice', category: 'Spices & Masala', unit: 'pack', purchase: 70, selling: 96, minStock: 20 },
  { name: 'Chilli Powder 200g', sku: 'SPC-CHI-200', slug: 'chilli-powder-200g', keyword: 'chili,powder', category: 'Spices & Masala', unit: 'pack', purchase: 88, selling: 118, minStock: 20 },
  { name: 'Coriander Powder 200g', sku: 'SPC-COR-200', slug: 'coriander-200g', keyword: 'coriander,spice', category: 'Spices & Masala', unit: 'pack', purchase: 76, selling: 102, minStock: 20 },
  { name: 'Cumin Seed 100g', sku: 'SPC-CUM-100', slug: 'cumin-100g', keyword: 'cumin,seeds', category: 'Spices & Masala', unit: 'pack', purchase: 128, selling: 165, minStock: 15 },
  { name: 'Garam Masala 50g', sku: 'SPC-GAR-50', slug: 'garam-masala-50g', keyword: 'masala,spice', category: 'Spices & Masala', unit: 'pack', purchase: 62, selling: 85, minStock: 25 },
  { name: 'Cinnamon Stick 100g', sku: 'SPC-CIN-100', slug: 'cinnamon-100g', keyword: 'cinnamon,stick', category: 'Spices & Masala', unit: 'pack', purchase: 168, selling: 215, minStock: 10 },
  { name: 'Cardamom 50g', sku: 'SPC-CAR-50', slug: 'cardamom-50g', keyword: 'cardamom,spice', category: 'Spices & Masala', unit: 'pack', purchase: 385, selling: 470, minStock: 8 },
  { name: 'Bay Leaf 50g', sku: 'SPC-BAY-50', slug: 'bay-leaf-50g', keyword: 'bay,leaf', category: 'Spices & Masala', unit: 'pack', purchase: 42, selling: 60, minStock: 20 },

  // ── Beverages ──
  { name: 'Black Tea 500g', sku: 'BEV-TEA-500', slug: 'black-tea-500g', keyword: 'tea,leaves', category: 'Beverages', unit: 'pack', purchase: 242, selling: 305, minStock: 15 },
  { name: 'Green Tea Bags (25)', sku: 'BEV-GTE-25', slug: 'green-tea-25', keyword: 'green,tea', category: 'Beverages', unit: 'box', purchase: 148, selling: 195, minStock: 15 },
  { name: 'Instant Coffee 100g', sku: 'BEV-COF-100', slug: 'instant-coffee-100g', keyword: 'coffee,jar', category: 'Beverages', unit: 'jar', purchase: 362, selling: 445, minStock: 10 },
  { name: 'Mango Juice 1L', sku: 'BEV-MJU-1', slug: 'mango-juice-1l', keyword: 'mango,juice', category: 'Beverages', unit: 'pack', purchase: 105, selling: 138, minStock: 24 },
  { name: 'Orange Drink 250ml', sku: 'BEV-ORA-250', slug: 'orange-drink-250ml', keyword: 'orange,drink', category: 'Beverages', unit: 'bottle', purchase: 22, selling: 32, minStock: 48 },
  { name: 'Drinking Water 2L', sku: 'BEV-WAT-2', slug: 'water-2l', keyword: 'water,bottle', category: 'Beverages', unit: 'bottle', purchase: 28, selling: 40, minStock: 40 },
  { name: 'Energy Drink 250ml', sku: 'BEV-ENE-250', slug: 'energy-drink-250ml', keyword: 'energy,drink', category: 'Beverages', unit: 'can', purchase: 48, selling: 68, minStock: 30 },

  // ── Snacks & Confectionery ──
  { name: 'Family Pack Biscuits', sku: 'SNK-BIS-FAM', slug: 'biscuits-family', keyword: 'biscuits,cookies', category: 'Snacks & Confectionery', unit: 'pack', purchase: 56, selling: 78, minStock: 40 },
  { name: 'Cream Biscuits 100g', sku: 'SNK-BIS-CRM', slug: 'cream-biscuits-100g', keyword: 'cream,biscuit', category: 'Snacks & Confectionery', unit: 'pack', purchase: 24, selling: 35, minStock: 50 },
  { name: 'Potato Chips 100g', sku: 'SNK-CHP-100', slug: 'potato-chips-100g', keyword: 'chips,snack', category: 'Snacks & Confectionery', unit: 'pack', purchase: 32, selling: 48, minStock: 50 },
  { name: 'Salted Peanuts 200g', sku: 'SNK-PNT-200', slug: 'peanuts-200g', keyword: 'peanuts,nuts', category: 'Snacks & Confectionery', unit: 'pack', purchase: 58, selling: 82, minStock: 30 },
  { name: 'Chocolate Bar 50g', sku: 'SNK-CHO-50', slug: 'chocolate-bar-50g', keyword: 'chocolate,bar', category: 'Snacks & Confectionery', unit: 'pcs', purchase: 45, selling: 65, minStock: 40 },
  { name: 'Instant Noodles (8pcs)', sku: 'SNK-NDL-8', slug: 'instant-noodles-8', keyword: 'noodles,instant', category: 'Snacks & Confectionery', unit: 'pack', purchase: 128, selling: 165, minStock: 25 },
  { name: 'Muri (Puffed Rice) 500g', sku: 'SNK-MUR-500', slug: 'muri-500g', keyword: 'puffed,rice', category: 'Snacks & Confectionery', unit: 'pack', purchase: 52, selling: 72, minStock: 25 },

  // ── Dairy & Frozen ──
  { name: 'Powder Milk 1kg', sku: 'DRY-PMK-1', slug: 'powder-milk-1kg', keyword: 'milk,powder', category: 'Dairy & Frozen', unit: 'pack', purchase: 645, selling: 768, minStock: 10 },
  { name: 'UHT Milk 1L', sku: 'DRY-UHT-1', slug: 'uht-milk-1l', keyword: 'milk,carton', category: 'Dairy & Frozen', unit: 'pack', purchase: 92, selling: 118, minStock: 24 },
  { name: 'Sweet Yogurt 500g', sku: 'DRY-YOG-500', slug: 'yogurt-500g', keyword: 'yogurt,dairy', category: 'Dairy & Frozen', unit: 'pot', purchase: 105, selling: 140, minStock: 12 },
  { name: 'Butter 200g', sku: 'DRY-BUT-200', slug: 'butter-200g', keyword: 'butter,dairy', category: 'Dairy & Frozen', unit: 'pack', purchase: 245, selling: 305, minStock: 10 },
  { name: 'Cheese Slices (10)', sku: 'DRY-CHE-10', slug: 'cheese-slices-10', keyword: 'cheese,slices', category: 'Dairy & Frozen', unit: 'pack', purchase: 285, selling: 355, minStock: 10 },
  { name: 'Frozen Paratha (5pcs)', sku: 'DRY-PAR-5', slug: 'frozen-paratha-5', keyword: 'paratha,flatbread', category: 'Dairy & Frozen', unit: 'pack', purchase: 118, selling: 152, minStock: 15 },
  { name: 'Ice Cream Tub 1L', sku: 'DRY-ICE-1', slug: 'ice-cream-1l', keyword: 'ice,cream', category: 'Dairy & Frozen', unit: 'tub', purchase: 320, selling: 410, minStock: 8 },

  // ── Household & Cleaning ──
  { name: 'Detergent Powder 1kg', sku: 'HHD-DET-1', slug: 'detergent-1kg', keyword: 'detergent,laundry', category: 'Household & Cleaning', unit: 'pack', purchase: 132, selling: 168, minStock: 20 },
  { name: 'Dishwashing Liquid 500ml', sku: 'HHD-DSH-500', slug: 'dishwash-500ml', keyword: 'dish,soap', category: 'Household & Cleaning', unit: 'bottle', purchase: 118, selling: 152, minStock: 20 },
  { name: 'Floor Cleaner 1L', sku: 'HHD-FLR-1', slug: 'floor-cleaner-1l', keyword: 'floor,cleaner', category: 'Household & Cleaning', unit: 'bottle', purchase: 168, selling: 212, minStock: 15 },
  { name: 'Toilet Cleaner 500ml', sku: 'HHD-TOI-500', slug: 'toilet-cleaner-500ml', keyword: 'cleaning,bathroom', category: 'Household & Cleaning', unit: 'bottle', purchase: 128, selling: 165, minStock: 15 },
  { name: 'Tissue Roll (4pcs)', sku: 'HHD-TIS-4', slug: 'tissue-roll-4', keyword: 'tissue,paper', category: 'Household & Cleaning', unit: 'pack', purchase: 92, selling: 125, minStock: 25 },
  { name: 'Garbage Bags (30)', sku: 'HHD-GRB-30', slug: 'garbage-bags-30', keyword: 'garbage,bags', category: 'Household & Cleaning', unit: 'pack', purchase: 78, selling: 108, minStock: 20 },
  { name: 'Mosquito Coil (10)', sku: 'HHD-MOS-10', slug: 'mosquito-coil-10', keyword: 'mosquito,coil', category: 'Household & Cleaning', unit: 'pack', purchase: 58, selling: 82, minStock: 30 },

  // ── Personal Care ──
  { name: 'Beauty Soap (4pcs)', sku: 'PRC-SOP-4', slug: 'beauty-soap-4', keyword: 'soap,bar', category: 'Personal Care', unit: 'pack', purchase: 148, selling: 192, minStock: 20 },
  { name: 'Shampoo 340ml', sku: 'PRC-SHM-340', slug: 'shampoo-340ml', keyword: 'shampoo,bottle', category: 'Personal Care', unit: 'bottle', purchase: 285, selling: 355, minStock: 12 },
  { name: 'Toothpaste 140g', sku: 'PRC-TPS-140', slug: 'toothpaste-140g', keyword: 'toothpaste,dental', category: 'Personal Care', unit: 'tube', purchase: 96, selling: 128, minStock: 25 },
  { name: 'Toothbrush (2pcs)', sku: 'PRC-TBR-2', slug: 'toothbrush-2', keyword: 'toothbrush,dental', category: 'Personal Care', unit: 'pack', purchase: 62, selling: 88, minStock: 25 },
  { name: 'Hair Oil 200ml', sku: 'PRC-HOL-200', slug: 'hair-oil-200ml', keyword: 'hair,oil', category: 'Personal Care', unit: 'bottle', purchase: 145, selling: 188, minStock: 15 },
  { name: 'Body Lotion 200ml', sku: 'PRC-LOT-200', slug: 'body-lotion-200ml', keyword: 'lotion,skincare', category: 'Personal Care', unit: 'bottle', purchase: 215, selling: 272, minStock: 12 },
  { name: 'Shaving Razor (3pcs)', sku: 'PRC-RZR-3', slug: 'razor-3', keyword: 'razor,shaving', category: 'Personal Care', unit: 'pack', purchase: 105, selling: 142, minStock: 20 },
  { name: 'Hand Sanitizer 100ml', sku: 'PRC-SAN-100', slug: 'sanitizer-100ml', keyword: 'sanitizer,hygiene', category: 'Personal Care', unit: 'bottle', purchase: 78, selling: 105, minStock: 20 },
];

export const productImage = (slug: string) => `/seed/products/${slug}.jpg`;
export const categoryImage = (slug: string) => `/seed/categories/${slug}.jpg`;
