import { Router } from "express";
import { analyzeProductCategory } from "../ai/nlp";
import pool from "../database/db";

const router = Router();

// API routes go here
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Clovet Backend (Modular) is running" });
});

// AI Analysis
router.post("/analyze-category", async (req, res) => {
  try {
    const { name, description } = req.body;
    const categories = await analyzeProductCategory(name, description);
    res.json({ categories });
  } catch (error) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ 
      error: "Failed to analyze category", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Authentication
router.post("/register", async (req, res) => {
  try {
    const { username, firstName, lastName, email, phone, password } = req.body;
    const result = await pool.query(
      "INSERT INTO users (username, first_name, last_name, email, phone, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, username, role, first_name as \"firstName\", last_name as \"lastName\", phone",
      [username, firstName, lastName, email, phone, password] // In real app, hash password!
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user (Email or Username might be taken)" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body; // 'email' field in request can be either email or username
    const result = await pool.query(
      "SELECT id, email, username, role, first_name as \"firstName\", last_name as \"lastName\", phone FROM users WHERE (email = $1 OR username = $1) AND password = $2",
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, email, username, role, first_name as \"firstName\", last_name as \"lastName\", phone FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Fetch user error:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { username, firstName, lastName, email, phone } = req.body;
    const result = await pool.query(
      "UPDATE users SET username = $1, first_name = $2, last_name = $3, email = $4, phone = $5 WHERE id = $6 RETURNING id, email, username, role, first_name as \"firstName\", last_name as \"lastName\", phone",
      [username, firstName, lastName, email, phone, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Seller Stats
router.get("/seller/stats", async (req, res) => {
  try {
    const revenueResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders");
    const activeProductsResult = await pool.query("SELECT COUNT(*) as count FROM products WHERE status = 'VERIFIED'");
    const totalSalesResult = await pool.query("SELECT COUNT(*) as count FROM orders");
    
    // Aggregating monthly sales
    const monthlySalesResult = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        SUM(total_amount) as sales,
        MIN(created_at) as min_date
      FROM orders 
      GROUP BY TO_CHAR(created_at, 'Mon')
      ORDER BY MIN(created_at)
    `);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();
    const lastSixMonths = [];
    
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIndex - i + 12) % 12;
      const monthName = months[idx];
      const salesData = monthlySalesResult.rows.find(r => r.month === monthName);
      lastSixMonths.push({
        month: monthName,
        sales: salesData ? Number(salesData.sales) : 0
      });
    }

    res.json({
      revenue: Number(revenueResult.rows[0].revenue),
      activeProducts: Number(activeProductsResult.rows[0].count),
      totalSales: Number(totalSalesResult.rows[0].count),
      monthlySales: lastSixMonths
    });
  } catch (error) {
    console.error("Failed to fetch seller stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/seller/finance", async (req, res) => {
  try {
    const revenueResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders");
    const ledgerResult = await pool.query("SELECT * FROM ledger_history ORDER BY created_at DESC");
    
    // Simple logic for liquid balance vs pending
    const totalRevenue = Number(revenueResult.rows[0].revenue);
    const extractionsResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as extracted FROM ledger_history WHERE type = 'EXTRACTION'");
    const totalExtracted = Number(extractionsResult.rows[0].extracted);
    
    // Pending Valuation: Revenue from orders that are not yet 'COMPLETED' or 'CANCELLED'
    const pendingResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as pending FROM orders WHERE status NOT IN ('COMPLETED', 'CANCELLED', 'SHIPPED')");
    const pendingValuation = Number(pendingResult.rows[0].pending);
    
    // Liquid Balance: Starting 3M + Revenue from 'SHIPPED' or 'COMPLETED' orders - Extractions
    const settledResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as settled FROM orders WHERE status IN ('SHIPPED', 'COMPLETED')");
    const settledRevenue = Number(settledResult.rows[0].settled);
    const bridgeAmount = 3000000; // Mock initial wallet balance
    const liquidBalance = bridgeAmount + settledRevenue - totalExtracted;

    res.json({
      liquidBalance: liquidBalance,
      pendingValuation: pendingValuation,
      ledger: ledgerResult.rows
    });
  } catch (error) {
    console.error("Failed to fetch finance data:", error);
    res.status(500).json({ error: "Failed to fetch finance data" });
  }
});

router.post("/seller/extract", async (req, res) => {
  try {
    const { amount, bank, accountNumber } = req.body;
    
    if (!amount || !bank || !accountNumber) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const extractionAmount = Number(amount);
    if (isNaN(extractionAmount) || extractionAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Check balance first
    const revenueResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders");
    const settledResult = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as settled FROM orders WHERE status IN ('SHIPPED', 'COMPLETED')");
    const extractionsResult = await pool.query("SELECT COALESCE(SUM(amount), 0) as extracted FROM ledger_history WHERE type = 'EXTRACTION'");
    
    const settledRevenue = Number(settledResult.rows[0].settled);
    const totalExtracted = Number(extractionsResult.rows[0].extracted);
    const liquidBalance = 3000000 + settledRevenue - totalExtracted;

    if (extractionAmount > liquidBalance) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Proceed with extraction
    await pool.query(
      "INSERT INTO ledger_history (amount, type, entity, status) VALUES ($1, $2, $3, $4)",
      [extractionAmount, 'EXTRACTION', `${bank} - ${accountNumber.slice(-4)}`, 'PROCESSED']
    );

    res.json({ message: "Extraction successful" });
  } catch (error) {
    console.error("Failed to process extraction:", error);
    res.status(500).json({ error: "Failed to process extraction" });
  }
});

router.get("/products/:id/price-history", async (req, res) => {
  try {
    const { id } = req.params;
    const history = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as date, 
        price 
      FROM price_history 
      WHERE product_id = $1 
      ORDER BY created_at ASC
    `, [id]);
    
    res.json(history.rows);
  } catch (error) {
    console.error("Failed to fetch price history:", error);
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});

// Products
router.get("/products", async (req, res) => {
  try {
    const { status, limit, offset, condition, gender } = req.query;
    let query = "SELECT *, original_price as \"originalPrice\" FROM products";
    const params = [];
    
    const whereConditions = [];
    if (status) {
      whereConditions.push(`status = $${params.length + 1}`);
      params.push(status);
    }
    if (condition) {
      whereConditions.push(`condition = $${params.length + 1}`);
      params.push(condition);
    }
    if (gender) {
      whereConditions.push(`gender = $${params.length + 1}`);
      params.push(gender);
    }

    if (whereConditions.length > 0) {
      query += " WHERE " + whereConditions.join(" AND ");
    }
    
    query += " ORDER BY created_at DESC";
    
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }
    
    if (offset) {
      query += ` OFFSET $${params.length + 1}`;
      params.push(offset);
    }
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) FROM products";
    const countParams = [];
    if (whereConditions.length > 0) {
      countQuery += " WHERE " + whereConditions.join(" AND ");
      countParams.push(...params.filter((_, i) => i < whereConditions.length));
    }
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      products: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const { name, description, category, price, originalPrice, image, condition, gender, sizes } = req.body;
    const result = await pool.query(
      "INSERT INTO products (name, description, category, price, original_price, image, condition, gender, sizes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *, original_price as \"originalPrice\"",
      [name, description, category, price, originalPrice || null, image, condition, gender || 'Unisex', JSON.stringify(sizes), "PENDING"]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to add product:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
});

router.patch("/products/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // VERIFIED or REJECTED
    const result = await pool.query(
      "UPDATE products SET status = $1 WHERE id = $2 RETURNING *, original_price as \"originalPrice\"",
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to verify product:", error);
    res.status(500).json({ error: "Failed to verify product" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, originalPrice, image, condition, gender, sizes } = req.body;

    // Check current status and sizes to determine if there is stock addition
    const currentProdCheck = await pool.query("SELECT status, sizes FROM products WHERE id = $1", [id]);
    if (currentProdCheck.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    const currentProduct = currentProdCheck.rows[0];
    const currentStatus = currentProduct.status || 'PENDING';

    let currentSizes = typeof currentProduct.sizes === 'string' ? JSON.parse(currentProduct.sizes) : currentProduct.sizes;
    if (!currentSizes) {
      currentSizes = {};
    }

    let hasStockIncrease = false;
    if (sizes) {
      for (const sizeKey of Object.keys(sizes)) {
        const newStock = Number(sizes[sizeKey]) || 0;
        const oldStock = Number(currentSizes[sizeKey]) || 0;
        if (newStock > oldStock) {
          hasStockIncrease = true;
          break;
        }
      }
    }

    const nextStatus = hasStockIncrease ? 'PENDING' : currentStatus;

    const result = await pool.query(
      "UPDATE products SET name = $1, description = $2, category = $3, price = $4, original_price = $5, image = $6, condition = $7, gender = $8, sizes = $9, status = $10 WHERE id = $11 RETURNING *, original_price as \"originalPrice\"",
      [name, description, category, price, originalPrice || null, image, condition, gender || 'Unisex', JSON.stringify(sizes), nextStatus, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Failed to delete product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// Orders
router.get("/orders", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await pool.query(`
      SELECT o.*, p.name as product_name, p.image as product_image 
      FROM orders o 
      JOIN products p ON o.product_id = p.id 
      ORDER BY o.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    const countResult = await pool.query("SELECT COUNT(*) FROM orders");
    
    res.json({
      orders: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const { product_id, total_amount, size } = req.body;
    
    if (!size) {
      return res.status(400).json({ error: "Size is required" });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if product is still available and get sizes
      const productCheck = await client.query("SELECT status, sizes FROM products WHERE id = $1 FOR UPDATE", [product_id]);
      const product = productCheck.rows[0];

      if (!product || product.status !== 'VERIFIED') {
        throw new Error("Product no longer available");
      }

      let sizes = typeof product.sizes === 'string' ? JSON.parse(product.sizes) : product.sizes;
      
      if (!sizes[size] || sizes[size] <= 0) {
        throw new Error(`Size ${size} is out of stock`);
      }

      // Decrement stock
      sizes[size] = sizes[size] - 1;

      // Check total stock
      const totalStock = Object.values(sizes).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);
      
      // Update sizes in DB
      await client.query("UPDATE products SET sizes = $1 WHERE id = $2", [JSON.stringify(sizes), product_id]);

      // If stock is 0, mark as SOLD
      if (totalStock === 0) {
        await client.query("UPDATE products SET status = 'SOLD' WHERE id = $1", [product_id]);
      }

      const orderResult = await client.query(
        "INSERT INTO orders (product_id, total_amount, status) VALUES ($1, $2, $3) RETURNING *",
        [product_id, total_amount, "PAID"]
      );

      await client.query('COMMIT');
      res.status(201).json(orderResult.rows[0]);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Failed to place order:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to place order" });
  }
});

export default router;
