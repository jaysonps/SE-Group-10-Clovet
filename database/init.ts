import pool from "./db";

export const initDb = async () => {
  console.log("Initializing database...");
  try {
    // Users table
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure all columns exist for users (migration for existing DBs)
    const userColumns = [
      { name: 'username', type: 'TEXT UNIQUE NOT NULL' },
      { name: 'first_name', type: 'TEXT' },
      { name: 'last_name', type: 'TEXT' },
      { name: 'email', type: 'TEXT UNIQUE NOT NULL' },
      { name: 'phone', type: 'TEXT' },
      { name: 'password', type: 'TEXT NOT NULL' },
      { name: 'role', type: 'TEXT NOT NULL DEFAULT \'customer\'' }
    ];

    for (const col of userColumns) {
      try {
        if (col.name === 'username' || col.name === 'email') {
          // Unique constraints might already exist, so we use a simpler ALTER
          await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} TEXT`);
        } else {
          await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
        }
      } catch (e) {
        // Ignore errors if column exists or constraint fails
      }
    }

    // Products table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        price DECIMAL(12, 2) NOT NULL DEFAULT 0,
        original_price DECIMAL(12, 2),
        image TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        condition TEXT NOT NULL DEFAULT 'New',
        gender TEXT NOT NULL DEFAULT 'Unisex',
        sizes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

      // Create ledger_history table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ledger_history (
          id SERIAL PRIMARY KEY,
          amount DECIMAL(12, 2) NOT NULL,
          type TEXT NOT NULL, -- 'EXTRACTION', 'DEPOSIT'
          entity TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PROCESSED',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create price_history table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS price_history (
          id SERIAL PRIMARY KEY,
          product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
          price DECIMAL(12, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

    // Ensure original_price and gender exist in products (for existing DBs)
    try {
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price DECIMAL(12, 2)");
      await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'Unisex'");
      // Update some products to have 50% off for the demo
      await pool.query("UPDATE products SET original_price = price * 2 WHERE original_price IS NULL AND name IN ('Green T-Shirt', 'Colorblock Polo Shirt', 'Black Cropped Tee', 'Beige Fleece Jacket', 'Navy Fleece Jacket')");
    } catch (e) {
      console.log("Error updating columns or data:", e);
    }

    // Clean up: ensure condition is correct for existing items
    await pool.query("UPDATE products SET condition = 'Pre-owned' WHERE condition = 'Used'");

    // Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        product_id INTEGER REFERENCES products(id),
        status TEXT NOT NULL DEFAULT 'PENDING',
        total_amount DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist for tracking and verification (for existing DBs)
    try {
      await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT");
      await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS verifier_id INTEGER");
      await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_notes TEXT");
    } catch (e) {
      console.log("Error updating orders table columns:", e);
    }

    // Ensure metadata table exists to track initialization
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Check if already initialized
    const initCheck = await pool.query("SELECT value FROM metadata WHERE key = 'db_initialized'");
    if (initCheck.rowCount > 0 && initCheck.rows[0].value === 'true') {
      console.log("Database already initialized, skipping seeding.");
      return;
    }

    console.log("Database not initialized, performing first-time setup...");

    // Ensure unique constraints for users
    try {
      await pool.query("ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username)");
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email)");
    } catch (e) {}

    console.log("Schema verified. Seeding initial data...");
    
    // Initial users
    const initialUsers = [
      { username: 'customer', firstName: 'customer', lastName: '', email: 'customer@gmail.com', phone: '0123456789', password: '@Customer123', role: 'customer' },
      { username: 'seller', firstName: 'seller', lastName: '', email: 'seller@gmail.com', phone: '0123456789', password: '@Seller123', role: 'seller' },
      { username: 'verifier', firstName: 'verifier', lastName: '', email: 'verifier@gmail.com', phone: '0123456789', password: '@Verifier123', role: 'verifier' }
    ];

    for (const u of initialUsers) {
      try {
        // Use ON CONFLICT to update existing users to ensure credentials match initial setup
        await pool.query(
          `INSERT INTO users (username, first_name, last_name, email, phone, password, role) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (username) DO UPDATE SET 
             password = EXCLUDED.password,
             phone = EXCLUDED.phone,
             email = EXCLUDED.email,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             role = EXCLUDED.role`,
          [u.username, u.firstName, u.lastName, u.email, u.phone, u.password, u.role]
        );
      } catch (e: any) {
        console.log(`Error seeding user ${u.username}:`, e.message);
      }
    }

    // Seed products if empty
    const productCountResult = await pool.query("SELECT COUNT(*) FROM products");
    if (parseInt(productCountResult.rows[0].count) === 0) {
      console.log("Seeding mock products...");
      const mockProducts = [
        { name: 'Green T-Shirt', category: 'Tops', price: 150000, original_price: 300000, image: '/src/assets/tops1.PNG', status: 'VERIFIED', description: 'Premium cotton essentials.', gender: 'Men' },
        { name: 'Colorblock Polo Shirt', category: 'Tops', price: 185000, original_price: 370000, image: '/src/assets/tops2.PNG', status: 'VERIFIED', description: 'Modern polo with color accents.', gender: 'Unisex' },
        { name: 'Black Cropped Tee', category: 'Tops', price: 125000, original_price: 250000, image: '/src/assets/tops3.PNG', status: 'VERIFIED', description: 'Trendy cropped fit.', gender: 'Women' },
        { name: 'Black Cargo Pants', category: 'Bottoms', price: 350000, image: '/src/assets/bottoms1.PNG', status: 'VERIFIED', description: 'Durable and stylish cargo pants.', gender: 'Men' },
        { name: 'Light Blue Jeans', category: 'Bottoms', price: 295000, image: '/src/assets/bottoms2.PNG', status: 'VERIFIED', description: 'Classic light wash jeans.', gender: 'Unisex' },
        { name: 'Broken White Pants', category: 'Bottoms', price: 275000, image: '/src/assets/bottoms3.PNG', status: 'VERIFIED', description: 'Elegant off-white trousers.', gender: 'Women' },
        { name: 'Sleeveless Black Dress', category: 'Dresses & Suits', price: 450000, image: '/src/assets/dresses1.PNG', status: 'VERIFIED', description: 'Elegant evening dress.', gender: 'Women' },
        { name: 'Graphic Red T-Shirt', category: 'Tops', price: 195000, image: '/src/assets/Graphic Red T-shirts.PNG', status: 'VERIFIED', description: 'Bold graphic design tee.', gender: 'Unisex' },
        { name: 'Black Overall Dress', category: 'Dresses & Suits', price: 385000, image: '/src/assets/dresses3.PNG', status: 'VERIFIED', description: 'Versatile overall dress.', gender: 'Women' },
        { name: 'Beige Fleece Jacket', category: 'Knitwears & Fleeces', price: 260000, original_price: 520000, image: '/src/assets/fleeces1.PNG', status: 'VERIFIED', description: 'Warm and cozy fleece.', gender: 'Unisex' },
        { name: 'Navy Fleece Jacket', category: 'Knitwears & Fleeces', price: 260000, original_price: 520000, image: '/src/assets/fleeces2.PNG', status: 'VERIFIED', description: 'Classic navy fleece.', gender: 'Unisex' },
        { name: 'Gray Fleece Jacket', category: 'Knitwears & Fleeces', price: 520000, image: '/src/assets/fleeces3.PNG', status: 'VERIFIED', description: 'Soft gray fleece jacket.', gender: 'Unisex' },
        { name: 'Maroon Graphic Sweatshirt', category: 'Knitwears & Fleeces', price: 325000, image: '/src/assets/knitwears1.PNG', status: 'PENDING', description: 'Graphic sweatshirt in maroon.', gender: 'Unisex' },
        { name: 'Light Blue Sweatshirt', category: 'Knitwears & Fleeces', price: 310000, image: '/src/assets/knitwears2.PNG', status: 'PENDING', description: 'Casual light blue sweatshirt.', gender: 'Unisex' },
        { name: 'Striped Knit Cardigan', category: 'Knitwears & Fleeces', price: 425000, image: '/src/assets/knitwears3.PNG', status: 'PENDING', description: 'Stylish striped knitwear.', gender: 'Women' },
        { name: 'Black Varsity Jacket', category: 'Outerwears', price: 750000, image: '/src/assets/Outwears1.PNG', status: 'PENDING', description: 'Classic varsity style.', gender: 'Men' },
        { name: 'Olive Coach Jacket', category: 'Outerwears', price: 485000, image: '/src/assets/Outwears2.PNG', status: 'PENDING', description: 'Casual olive outer layer.', gender: 'Men' },
        { name: 'Navy Colorblock Windbreaker', category: 'Outerwears', price: 510000, image: '/src/assets/Outwears3.PNG', status: 'PENDING', description: 'Lightweight windbreaker.', gender: 'Unisex' },
        { name: 'Black Blazer Set', category: 'Dresses & Suits', price: 950000, image: '/src/assets/Suits1.PNG', status: 'VERIFIED', description: 'Professional blazer set.', gender: 'Women' },
        { name: 'Classic Black Suit', category: 'Dresses & Suits', price: 1250000, image: '/src/assets/Suits2.PNG', status: 'VERIFIED', description: 'Formal black suit.', gender: 'Men' },
        { name: 'Beige Blazer Set', category: 'Dresses & Suits', price: 920000, image: '/src/assets/Suits3.PNG', status: 'VERIFIED', description: 'Modern beige suit set.', gender: 'Women' }
      ];

      for (const p of mockProducts) {
        await pool.query(
          "INSERT INTO products (name, description, category, price, original_price, image, status, seller_id, condition, gender, sizes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)",
          [p.name, p.description, p.category, p.price, p.original_price || null, p.image, p.status, 1, 'New', p.gender, JSON.stringify({ XS: 2, S: 5, M: 8, L: 5, XL: 2 })]
        );
      }

      console.log("Seeding completed");

      // Seed some mock orders for charts
      console.log("Seeding mock orders for charts...");
      const orders = [
        { product_id: 1, total_amount: 150000, status: 'PAID', created_at: '2026-01-15 10:00:00' },
        { product_id: 2, total_amount: 185000, status: 'COMPLETED', created_at: '2026-01-20 11:30:00' },
        { product_id: 3, total_amount: 125000, status: 'COMPLETED', created_at: '2026-02-05 09:15:00' },
        { product_id: 4, total_amount: 350000, status: 'COMPLETED', created_at: '2026-02-25 14:20:00' },
        { product_id: 5, total_amount: 295000, status: 'PAID', created_at: '2026-03-10 16:45:00' },
        { product_id: 6, total_amount: 275000, status: 'PAID', created_at: '2026-03-22 13:10:00' },
        { product_id: 1, total_amount: 150000, status: 'COMPLETED', created_at: '2026-04-02 11:00:00' },
        { product_id: 7, total_amount: 450000, status: 'PAID', created_at: '2026-04-18 20:30:00' },
        { product_id: 8, total_amount: 195000, status: 'PAID', created_at: '2026-05-05 10:00:00' },
        { product_id: 1, total_amount: 150000, status: 'PAID', created_at: '2026-05-12 15:00:00' },
      ];

      for (const o of orders) {
        await pool.query(
          "INSERT INTO orders (product_id, total_amount, status, created_at) VALUES ($1, $2, $3, $4)",
          [o.product_id, o.total_amount, o.status, o.created_at]
        );
      }
      console.log("Mock orders seeded.");

      // Seed some mock ledger history
      console.log("Seeding mock ledger history...");
      await pool.query(`
        INSERT INTO ledger_history (amount, type, entity, created_at) VALUES 
        (1500000, 'EXTRACTION', 'BCA CENTRAL ASIA - 882X', '2026-05-11 10:00:00'),
        (1500000, 'EXTRACTION', 'BCA CENTRAL ASIA - 882X', '2026-05-12 14:00:00')
      `);

      // Seed some mock price history for product 1
      console.log("Seeding mock price history...");
      await pool.query(`
        INSERT INTO price_history (product_id, price, created_at) VALUES 
        (1, 120000, '2026-01-01 00:00:00'),
        (1, 125000, '2026-02-01 00:00:00'),
        (1, 130000, '2026-03-01 00:00:00'),
        (1, 140000, '2026-04-01 00:00:00'),
        (1, 150000, '2026-05-01 00:00:00'),
        (2, 160000, '2026-01-01 00:00:00'),
        (2, 185000, '2026-05-01 00:00:00')
      `);
      console.log("Finance and price history dummy data seeded.");
    }

    // Mark as initialized
    await pool.query("INSERT INTO metadata (key, value) VALUES ('db_initialized', 'true') ON CONFLICT (key) DO UPDATE SET value = 'true'");
    console.log("Database initialization state saved.");

  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
};
