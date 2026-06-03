import pool from "./db";
import bcrypt from "bcryptjs";

export const initDb = async () => {
  console.log("Initializing database...");
  try {
    // ── Users ──────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        rating DECIMAL(3,1) DEFAULT NULL,
        suspended_until TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try { await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3,1) DEFAULT NULL"); } catch (e) {}
    try { await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMP DEFAULT NULL"); } catch (e) {}

    // ── Products ───────────────────────────────────────────────────────────────
    // Status values: ACTIVE (default, available for purchase), VERIFIED (authenticity confirmed),
    // SOLD (out of stock), REJECTED (counterfeit detected)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price DECIMAL(12,2) NOT NULL DEFAULT 0,
        original_price DECIMAL(12,2),
        image TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        condition TEXT NOT NULL DEFAULT 'New',
        gender TEXT NOT NULL DEFAULT 'Unisex',
        sizes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try { await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price DECIMAL(12,2)"); } catch (e) {}
    try { await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'Unisex'"); } catch (e) {}

    // Migrate old status values to new scheme
    await pool.query("UPDATE products SET status='ACTIVE' WHERE status='PENDING' OR status='VERIFIED'");
    await pool.query("UPDATE products SET condition='Pre-owned' WHERE condition='Used'");

    // ── Ledger History ─────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ledger_history (
        id SERIAL PRIMARY KEY,
        amount DECIMAL(12,2) NOT NULL,
        type TEXT NOT NULL,
        entity TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PROCESSED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── Price History ──────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        price DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── Orders ─────────────────────────────────────────────────────────────────
    // BR-1 State flow: SUBMITTED → PAID → IN_VERIFICATION → SHIPPED → DELIVERED → COMPLETED
    //                                                      → REJECTED → REFUNDED
    // BR-3: SUBMITTED expires after 15 minutes → EXPIRED
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id),
        status TEXT NOT NULL DEFAULT 'SUBMITTED',
        total_amount DECIMAL(12,2) NOT NULL,
        reserved_size TEXT,
        tracking_number TEXT,
        verifier_id INTEGER REFERENCES users(id),
        verification_notes TEXT,
        verification_evidence_image TEXT,
        verified_at TIMESTAMP,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    try { await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS reserved_size TEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP"); } catch (e) {}
    try { await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS verifier_id INTEGER REFERENCES users(id)"); } catch (e) {}
    try { await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_notes TEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_evidence_image TEXT"); } catch (e) {}
    try { await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP"); } catch (e) {}

    // Auto-generate tracking numbers for existing orders that don't have one
    try {
      await pool.query(`
        UPDATE orders
        SET tracking_number = 'CLVT-REG-' || LPAD((id * 1337 % 1000000)::text, 6, '0')
        WHERE tracking_number IS NULL OR tracking_number = ''
      `);
    } catch (e) {}

    // ── Reviews ────────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        comment TEXT,
        user_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_order_review UNIQUE (order_id)
      )
    `);

    // ── OTP Tokens (REQ-F6-2: 2FA for disbursement) ───────────────────────────
    // Created BEFORE the db_initialized check so it always exists, even on existing DBs.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        otp_code TEXT NOT NULL,
        purpose TEXT NOT NULL DEFAULT 'EXTRACTION',
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // No UNIQUE constraint — we use DELETE+INSERT in the API to avoid conflicts.

    // ── Metadata ───────────────────────────────────────────────────────────────
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // ── Indexes (Bab 6.1 Database Requirements) ────────────────────────────────
    try {
      await pool.query("CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders  (status)");
      await pool.query("CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders  (customer_id)");
      await pool.query("CREATE INDEX IF NOT EXISTS idx_products_status    ON products(status)");
      await pool.query("CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category)");
      await pool.query("CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews (product_id)");
      console.log("Database indexes created.");
    } catch (e) { console.log("Index creation (might already exist):", e); }

    // ── Check if seeding needed ────────────────────────────────────────────────
    const initCheck    = await pool.query("SELECT value FROM metadata WHERE key='db_initialized'");
    const ordersCount  = await pool.query("SELECT COUNT(*) FROM orders");
    const needOrderSeed = parseInt(ordersCount.rows[0].count) < 25;

    if (initCheck.rowCount > 0 && initCheck.rows[0].value === "true" && !needOrderSeed) {
      console.log("Database already initialized, skipping seeding.");
      const reviewsCheck = await pool.query("SELECT COUNT(*) FROM reviews");
      if (parseInt(reviewsCheck.rows[0].count) === 0) await seedMockReviews(pool);
      return;
    }

    console.log("Performing first-time database setup...");

    try { await pool.query("ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username)"); } catch (e) {}
    try { await pool.query("ALTER TABLE users ADD CONSTRAINT users_email_key    UNIQUE (email)");    } catch (e) {}

    // ── Seed Users ─────────────────────────────────────────────────────────────
    const initialUsers = [
      { username: "CUST001",  firstName: "Customer",  lastName: "", email: "customer@gmail.com",  phone: "0123456789", password: "@Customer123",  role: "customer"  },
      { username: "seller",   firstName: "Seller",    lastName: "", email: "seller@gmail.com",    phone: "0123456789", password: "@Seller123",    role: "seller"    },
      { username: "verifier", firstName: "Verifier",  lastName: "", email: "verifier@gmail.com",  phone: "0123456789", password: "@Verifier123",  role: "verifier"  },
    ];
    for (const u of initialUsers) {
      try {
        const hashedPassword = await bcrypt.hash(u.password, 10); // SEC-1
        await pool.query(
          `INSERT INTO users (username, first_name, last_name, email, phone, password, role)
           VALUES ($1,$2,$3,$4,$5,$6,$7)
           ON CONFLICT (username) DO UPDATE SET
             password=$6, phone=$5, email=$4, first_name=$2, last_name=$3, role=$7`,
          [u.username, u.firstName, u.lastName, u.email, u.phone, hashedPassword, u.role]
        );
      } catch (e: any) { console.log(`Seeding user ${u.username}:`, e.message); }
    }

    // ── Seed Products ──────────────────────────────────────────────────────────
    const productCountResult = await pool.query("SELECT COUNT(*) FROM products");
    if (parseInt(productCountResult.rows[0].count) === 0) {
      console.log("Seeding mock products...");
      const mockProducts = [
        { name: "Green T-Shirt",              category: "Tops",              price: 150000,  original_price: 300000,  image: "/src/assets/tops1.PNG",                 gender: "Men"    },
        { name: "Colorblock Polo Shirt",      category: "Tops",              price: 185000,  original_price: 370000,  image: "/src/assets/tops2.PNG",                 gender: "Unisex" },
        { name: "Black Cropped Tee",          category: "Tops",              price: 125000,  original_price: 250000,  image: "/src/assets/tops3.PNG",                 gender: "Women"  },
        { name: "Black Cargo Pants",          category: "Bottoms",           price: 350000,  original_price: null,    image: "/src/assets/bottoms1.PNG",              gender: "Men"    },
        { name: "Light Blue Jeans",           category: "Bottoms",           price: 295000,  original_price: null,    image: "/src/assets/bottoms2.PNG",              gender: "Unisex" },
        { name: "Broken White Pants",         category: "Bottoms",           price: 275000,  original_price: null,    image: "/src/assets/bottoms3.PNG",              gender: "Women"  },
        { name: "Sleeveless Black Dress",     category: "Dresses & Suits",   price: 450000,  original_price: null,    image: "/src/assets/dresses1.PNG",              gender: "Women"  },
        { name: "Graphic Red T-Shirt",        category: "Tops",              price: 195000,  original_price: null,    image: "/src/assets/Graphic Red T-shirts.PNG",  gender: "Unisex" },
        { name: "Black Overall Dress",        category: "Dresses & Suits",   price: 385000,  original_price: null,    image: "/src/assets/dresses3.PNG",              gender: "Women"  },
        { name: "Beige Fleece Jacket",        category: "Knitwears & Fleeces", price: 260000, original_price: 520000, image: "/src/assets/fleeces1.PNG",              gender: "Unisex" },
        { name: "Navy Fleece Jacket",         category: "Knitwears & Fleeces", price: 260000, original_price: 520000, image: "/src/assets/fleeces2.PNG",              gender: "Unisex" },
        { name: "Gray Fleece Jacket",         category: "Knitwears & Fleeces", price: 520000, original_price: null,   image: "/src/assets/fleeces3.PNG",              gender: "Unisex" },
        { name: "Maroon Graphic Sweatshirt",  category: "Knitwears & Fleeces", price: 325000, original_price: null,   image: "/src/assets/knitwears1.PNG",            gender: "Unisex" },
        { name: "Light Blue Sweatshirt",      category: "Knitwears & Fleeces", price: 310000, original_price: null,   image: "/src/assets/knitwears2.PNG",            gender: "Unisex" },
        { name: "Striped Knit Cardigan",      category: "Knitwears & Fleeces", price: 425000, original_price: null,   image: "/src/assets/knitwears3.PNG",            gender: "Women"  },
        { name: "Black Varsity Jacket",       category: "Outerwears",        price: 750000,  original_price: null,    image: "/src/assets/Outwears1.PNG",             gender: "Men"    },
        { name: "Olive Coach Jacket",         category: "Outerwears",        price: 485000,  original_price: null,    image: "/src/assets/Outwears2.PNG",             gender: "Men"    },
        { name: "Navy Colorblock Windbreaker",category: "Outerwears",        price: 510000,  original_price: null,    image: "/src/assets/Outwears3.PNG",             gender: "Unisex" },
        { name: "Black Blazer Set",           category: "Dresses & Suits",   price: 950000,  original_price: null,    image: "/src/assets/Suits1.PNG",                gender: "Women"  },
        { name: "Classic Black Suit",         category: "Dresses & Suits",   price: 1250000, original_price: null,    image: "/src/assets/Suits2.PNG",                gender: "Men"    },
        { name: "Beige Blazer Set",           category: "Dresses & Suits",   price: 920000,  original_price: null,    image: "/src/assets/Suits3.PNG",                gender: "Women"  },
      ];
      for (const p of mockProducts) {
        await pool.query(
          "INSERT INTO products (name, description, category, price, original_price, image, status, seller_id, condition, gender, sizes) VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7,$8,$9,$10)",
          [p.name, "Premium fashion item.", p.category, p.price, p.original_price, p.image, 2, "New", p.gender, JSON.stringify({ XS: 2, S: 5, M: 8, L: 5, XL: 2 })]
        );
      }
      console.log("Products seeded.");
    }

    // ── Seed Orders ────────────────────────────────────────────────────────────
    await pool.query("DELETE FROM orders");
    await pool.query("DELETE FROM ledger_history");
    await pool.query("DELETE FROM price_history");

    const orders = [
      // January–May 2026 (historical COMPLETED)
      { product_id: 1,  total_amount: 150000,  status: "COMPLETED", tracking_number: "CLVT-REG-102938", created_at: "2026-01-15 10:00:00" },
      { product_id: 2,  total_amount: 185000,  status: "COMPLETED", tracking_number: "CLVT-REG-293847", created_at: "2026-01-20 11:30:00" },
      { product_id: 3,  total_amount: 125000,  status: "COMPLETED", tracking_number: "CLVT-REG-384756", created_at: "2026-01-25 09:15:00" },
      { product_id: 4,  total_amount: 350000,  status: "COMPLETED", tracking_number: "CLVT-REG-475612", created_at: "2026-01-28 14:20:00" },
      { product_id: 5,  total_amount: 295000,  status: "COMPLETED", tracking_number: "CLVT-REG-561293", created_at: "2026-02-05 16:45:00" },
      { product_id: 6,  total_amount: 275000,  status: "COMPLETED", tracking_number: "CLVT-REG-612938", created_at: "2026-02-12 13:10:00" },
      { product_id: 7,  total_amount: 450000,  status: "COMPLETED", tracking_number: "CLVT-REG-718293", created_at: "2026-02-18 11:00:00" },
      { product_id: 8,  total_amount: 195000,  status: "COMPLETED", tracking_number: "CLVT-REG-829384", created_at: "2026-02-22 20:30:00" },
      { product_id: 1,  total_amount: 150000,  status: "COMPLETED", tracking_number: "CLVT-REG-938475", created_at: "2026-03-05 10:00:00" },
      { product_id: 2,  total_amount: 185000,  status: "COMPLETED", tracking_number: "CLVT-REG-049382", created_at: "2026-03-12 15:00:00" },
      { product_id: 3,  total_amount: 125000,  status: "COMPLETED", tracking_number: "CLVT-REG-123456", created_at: "2026-03-18 10:00:00" },
      { product_id: 4,  total_amount: 350000,  status: "COMPLETED", tracking_number: "CLVT-REG-234567", created_at: "2026-03-24 11:30:00" },
      { product_id: 5,  total_amount: 295000,  status: "COMPLETED", tracking_number: "CLVT-REG-345678", created_at: "2026-04-03 14:15:00" },
      { product_id: 6,  total_amount: 275000,  status: "COMPLETED", tracking_number: "CLVT-REG-456789", created_at: "2026-04-10 16:45:00" },
      { product_id: 7,  total_amount: 450000,  status: "COMPLETED", tracking_number: "CLVT-REG-567890", created_at: "2026-04-17 13:00:00" },
      { product_id: 8,  total_amount: 195000,  status: "COMPLETED", tracking_number: "CLVT-REG-657483", created_at: "2026-04-25 12:00:00" },
      { product_id: 1,  total_amount: 150000,  status: "COMPLETED", tracking_number: "CLVT-REG-439281", created_at: "2026-05-02 09:30:00" },
      { product_id: 2,  total_amount: 185000,  status: "COMPLETED", tracking_number: "CLVT-REG-530291", created_at: "2026-05-08 14:10:00" },
      { product_id: 3,  total_amount: 125000,  status: "COMPLETED", tracking_number: "CLVT-REG-849301", created_at: "2026-05-14 11:45:00" },
      { product_id: 4,  total_amount: 350000,  status: "COMPLETED", tracking_number: "CLVT-REG-394019", created_at: "2026-05-20 16:00:00" },
      { product_id: 5,  total_amount: 295000,  status: "COMPLETED", tracking_number: "CLVT-REG-103948", created_at: "2026-05-24 10:15:00" },
      { product_id: 6,  total_amount: 275000,  status: "COMPLETED", tracking_number: "CLVT-REG-293849", created_at: "2026-05-26 13:00:00" },
      { product_id: 7,  total_amount: 450000,  status: "COMPLETED", tracking_number: "CLVT-REG-582910", created_at: "2026-05-28 17:30:00" },
      { product_id: 8,  total_amount: 195000,  status: "COMPLETED", tracking_number: "CLVT-REG-192837", created_at: "2026-05-29 11:00:00" },
      { product_id: 1,  total_amount: 250000,  status: "COMPLETED", tracking_number: "CLVT-REG-987654", created_at: "2026-05-30 15:45:00" },
      { product_id: 2,  total_amount: 185000,  status: "COMPLETED", tracking_number: "CLVT-REG-876543", created_at: "2026-05-31 18:20:00" },
      // June 2026 — active orders showing full BR-1 flow
      { product_id: 3,  total_amount: 220000,  status: "PAID",          tracking_number: "CLVT-REG-765432", created_at: "2026-06-01 08:30:00", reserved_size: "M" },
      { product_id: 4,  total_amount: 350000,  status: "IN_VERIFICATION", tracking_number: "CLVT-REG-654321", created_at: "2026-06-01 11:15:00", reserved_size: "L" },
      { product_id: 5,  total_amount: 295000,  status: "SHIPPED",       tracking_number: "CLVT-REG-543210", created_at: "2026-06-01 14:00:00", reserved_size: "S" },
    ];
    for (const o of orders) {
      await pool.query(
        "INSERT INTO orders (product_id, total_amount, status, tracking_number, created_at, customer_id, reserved_size) VALUES ($1,$2,$3,$4,$5,$6,$7)",
        [o.product_id, o.total_amount, o.status, o.tracking_number, o.created_at, 1, (o as any).reserved_size || null]
      );
    }
    console.log("Mock orders seeded.");

    await pool.query(`
      INSERT INTO ledger_history (amount, type, entity, created_at) VALUES
      (1500000,'EXTRACTION','BCA CENTRAL ASIA - 882X','2026-05-11 10:00:00'),
      (1500000,'EXTRACTION','BCA CENTRAL ASIA - 882X','2026-05-12 14:00:00')
    `);
    await pool.query(`
      INSERT INTO price_history (product_id, price, created_at) VALUES
      (1,120000,'2026-01-01'),(1,125000,'2026-02-01'),(1,130000,'2026-03-01'),
      (1,140000,'2026-04-01'),(1,150000,'2026-05-01'),
      (2,160000,'2026-01-01'),(2,185000,'2026-05-01')
    `);

    await seedMockReviews(pool);

    await pool.query("INSERT INTO metadata (key,value) VALUES ('db_initialized','true') ON CONFLICT (key) DO UPDATE SET value='true'");
    console.log("Database initialization complete.");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
};

const seedMockReviews = async (pool: any) => {
  try {
    await pool.query("DELETE FROM reviews");
    const productsResult = await pool.query("SELECT id, name, category FROM products");
    const reviewers = [
      "Alexander Vance","Brian Sterling","Claire Fontaine","David Thorne","Elizabeth Cole",
      "Frank Weston","Gabriel Mercer","Heather Brooks","Ian Gallagher","Julia Vance",
      "Katherine Croft","Liam Vance","Marcus Mercer","Natalia Croft","Oliver Thorne",
      "Penelope Cole","Quentin Weston","Rachel Brooks","Samuel Gallagher","Thomas Shelby",
      "Victor Vance","Winston Mercer","Sarah Jenkins","Michael Chen","Emma Watson",
    ];
    for (const prod of productsResult.rows) {
      const name = prod.name;
      const cat  = prod.category || "";
      let commentTemplates: { rating: number; comment: string }[] = [];
      if (cat.includes("Tops")) {
        commentTemplates = [
          { rating: 5, comment: `The material of this ${name} is extremely breathable, and the cotton feels super premium.` },
          { rating: 4, comment: `Color and size match the product images exactly. Clean stitching.` },
          { rating: 5, comment: `Purchased from Clovet multiple times and this ${name} never disappoints!` },
          { rating: 3, comment: `Quality is decent, though a bit thin for my taste. Comfortable for daily wear.` },
          { rating: 5, comment: `Love the cut and fit! The color is stunning and the material is incredibly soft.` },
        ];
      } else if (cat.includes("Bottoms")) {
        commentTemplates = [
          { rating: 5, comment: `The fabric of ${name} is thick and slightly stretchy, super comfortable.` },
          { rating: 4, comment: `Comfortable all day. Fits perfectly on the waist, highly recommended!` },
          { rating: 5, comment: `Super fashionable and the stitching at the seams feels durable.` },
          { rating: 3, comment: `Nice design, but slightly stiff at first. Got softer after first wash.` },
        ];
      } else if (cat.includes("Dresses") || cat.includes("Suits")) {
        commentTemplates = [
          { rating: 5, comment: `Incredibly elegant for formal events! Sharp silhouette and very luxurious.` },
          { rating: 5, comment: `Premium quality formal fabric. Tailored perfectly, got so many compliments!` },
          { rating: 4, comment: `Extremely classy! Very neat packaging, fast and helpful seller support.` },
          { rating: 4, comment: `Excellent styling, fit perfectly straight out of the box. Modern design.` },
        ];
      } else if (cat.includes("Knitwears") || cat.includes("Fleeces") || cat.includes("Outerwears")) {
        commentTemplates = [
          { rating: 5, comment: `Unbelievably warm and buttery soft! Perfect for rainy days or chilly AC.` },
          { rating: 5, comment: `The design of this ${name} is amazing. Very modern and no wrinkles.` },
          { rating: 4, comment: `Thick fabric, extremely gentle on skin. Slightly oversized sleeves but loving it.` },
          { rating: 4, comment: `Great piece! Buttons and zippers are functional, robust, and feel premium.` },
        ];
      } else {
        commentTemplates = [
          { rating: 5, comment: `Very pleased with the quality of ${name}. High-grade, thick material.` },
          { rating: 4, comment: `Decent purchase. Product matches the description well and sizing is accurate.` },
          { rating: 5, comment: `Outstanding quality, definitely no regrets. Friendly service and quick shipping.` },
        ];
      }
      const shuffledReviewers = [...reviewers].sort(() => 0.5 - Math.random());
      const numReviews = Math.floor(Math.random() * 3) + 3;
      for (let j = 0; j < Math.min(numReviews, commentTemplates.length); j++) {
        const tpl   = commentTemplates[j];
        const rName = shuffledReviewers[j];
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const reviewDate = new Date();
        reviewDate.setDate(reviewDate.getDate() - daysAgo);
        await pool.query(
          `INSERT INTO reviews (product_id, customer_id, order_id, rating, comment, user_name, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [prod.id, 1, null, tpl.rating, tpl.comment, rName, reviewDate]
        );
      }
    }
    console.log("Mock reviews seeded.");
  } catch (error) {
    console.error("Failed to seed mock reviews:", error);
  }
};
