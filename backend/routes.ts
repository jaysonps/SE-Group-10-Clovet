import { Router } from "express";
import { analyzeProductCategory } from "../ai/nlp";
import pool from "../database/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "clovet_jwt_secret_dev";

// ─── Middleware ───────────────────────────────────────────────────────────────

function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
    }
    next();
  };
}

// ─── Health ───────────────────────────────────────────────────────────────────

router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Clovet Backend is running" });
});

// ─── NLP: Analyze Category (REQ-F3-1) ────────────────────────────────────────

router.post("/analyze-category", async (req, res) => {
  try {
    const { name, description } = req.body;
    const desc = description || "";
    const words = desc.trim().split(/\s+/).filter(Boolean).length;
    if (words < 15) {
      return res.status(400).json({
        error: "Product description must be at least 15 words for the AI assistant to predict the category classification.",
      });
    }
    const categories = await analyzeProductCategory(name, description);
    res.json({ categories });
  } catch (error) {
    console.error("AI Analysis error:", error);
    res.status(500).json({ error: "Failed to analyze category", details: error instanceof Error ? error.message : "Unknown error" });
  }
});

// ─── Auth: Register & Login (SEC-1) ──────────────────────────────────────────

router.post("/register", async (req, res) => {
  try {
    const { username, firstName, lastName, email, phone, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // SEC-1: bcrypt hash
    const result = await pool.query(
      `INSERT INTO users (username, first_name, last_name, email, phone, password)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, username, role, first_name as "firstName", last_name as "lastName", phone`,
      [username, firstName, lastName, email, phone, hashedPassword]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ ...user, token });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user (Email or Username might be taken)" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      `SELECT id, email, username, role, password, first_name as "firstName", last_name as "lastName", phone
       FROM users WHERE (email = $1 OR username = $1)`,
      [email]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────

router.get("/users/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT id, email, username, role, first_name as "firstName", last_name as "lastName", phone FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

router.put("/users/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, firstName, lastName, email, phone } = req.body;
    const result = await pool.query(
      `UPDATE users SET username=$1, first_name=$2, last_name=$3, email=$4, phone=$5
       WHERE id=$6
       RETURNING id, email, username, role, first_name as "firstName", last_name as "lastName", phone`,
      [username, firstName, lastName, email, phone, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

router.put("/users/:id/change-password", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current and new password are required" });
    const userResult = await pool.query("SELECT password FROM users WHERE id = $1", [id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const match = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!match) return res.status(400).json({ error: "Current password is incorrect" });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password=$1 WHERE id=$2", [hashed, id]);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to change password" });
  }
});

// ─── Logistics: Dummy Shipping Rate API (REQ-F2-3 / Feature 4.5) ─────────────
// Returns a deterministic dummy shipping cost based on destination postal code.
// Simulates a RajaOngkir/Shipper-style response without a real API key.

router.post("/shipping/rates", async (req, res) => {
  try {
    const { destination_postal_code, weight_grams = 500 } = req.body;

    if (!destination_postal_code) {
      return res.status(400).json({ error: "destination_postal_code is required" });
    }

    // Determine zone by first 2 digits of postal code (Indonesian regional zoning)
    const prefix = String(destination_postal_code).slice(0, 2);
    const prefixNum = parseInt(prefix, 10);

    let zone: "local" | "inter-island" | "remote";
    // Jakarta & surrounding: 10xxx–16xxx
    if (prefixNum >= 10 && prefixNum <= 16) zone = "local";
    // Java island: 17xxx–65xxx
    else if (prefixNum >= 17 && prefixNum <= 65) zone = "inter-island";
    // Outer islands (Sumatra, Kalimantan, Sulawesi, Papua, etc.)
    else zone = "remote";

    const weightKg = weight_grams / 1000;

    const rates: Record<string, { courier: string; service: string; estimated_days: string; price: number }[]> = {
      local: [
        { courier: "JNE",     service: "REG",  estimated_days: "1-2",  price: Math.round((9000  + weightKg * 2000) / 1000) * 1000 },
        { courier: "JNE",     service: "YES",  estimated_days: "1",    price: Math.round((18000 + weightKg * 3000) / 1000) * 1000 },
        { courier: "SiCepat", service: "HALU", estimated_days: "1-2",  price: Math.round((8000  + weightKg * 1800) / 1000) * 1000 },
        { courier: "AnterAja",service: "REG",  estimated_days: "1-2",  price: Math.round((7500  + weightKg * 1700) / 1000) * 1000 },
      ],
      "inter-island": [
        { courier: "JNE",     service: "REG",  estimated_days: "2-4",  price: Math.round((15000 + weightKg * 3500) / 1000) * 1000 },
        { courier: "JNE",     service: "OKE",  estimated_days: "3-5",  price: Math.round((12000 + weightKg * 3000) / 1000) * 1000 },
        { courier: "SiCepat", service: "BEST", estimated_days: "2-3",  price: Math.round((14000 + weightKg * 3200) / 1000) * 1000 },
        { courier: "TIKI",    service: "REG",  estimated_days: "3-5",  price: Math.round((13000 + weightKg * 3000) / 1000) * 1000 },
      ],
      remote: [
        { courier: "JNE",     service: "REG",  estimated_days: "5-7",  price: Math.round((25000 + weightKg * 5000) / 1000) * 1000 },
        { courier: "POS",     service: "Kilat", estimated_days: "4-7", price: Math.round((22000 + weightKg * 4500) / 1000) * 1000 },
        { courier: "TIKI",    service: "REG",  estimated_days: "5-8",  price: Math.round((24000 + weightKg * 4800) / 1000) * 1000 },
      ],
    };

    res.json({
      destination_postal_code,
      weight_grams,
      zone,
      rates: rates[zone],
    });
  } catch (error) {
    console.error("Shipping rates error:", error);
    res.status(500).json({ error: "Failed to calculate shipping rates" });
  }
});

// ─── Payment: Simulate Payment Gateway (REQ-F2-2, BR-1, BR-3) ────────────────
// Simulates Midtrans/Xendit webhook: charges a flat Rp 50.000 service fee,
// validates the pending order, then marks it SUBMITTED → PAID.

router.post("/payment/process", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: "order_id is required" });

    await client.query("BEGIN");

    // Fetch order and verify it is in SUBMITTED state
    const orderCheck = await client.query(
      "SELECT * FROM orders WHERE id = $1 FOR UPDATE",
      [order_id]
    );
    if (orderCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Order not found" });
    }
    const order = orderCheck.rows[0];
    if (order.status !== "SUBMITTED") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Order cannot be paid. Current status: ${order.status}` });
    }

    // BR-3: Check 15-minute payment window
    const createdAt = new Date(order.created_at);
    const now = new Date();
    const elapsedMs = now.getTime() - createdAt.getTime();
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    if (elapsedMs > FIFTEEN_MINUTES_MS) {
      // Auto-expire: release stock and cancel order
      const productResult = await client.query("SELECT sizes FROM products WHERE id = $1", [order.product_id]);
      if (productResult.rows.length > 0 && order.reserved_size) {
        const sizes = typeof productResult.rows[0].sizes === "string"
          ? JSON.parse(productResult.rows[0].sizes)
          : productResult.rows[0].sizes || {};
        sizes[order.reserved_size] = (sizes[order.reserved_size] || 0) + 1;
        await client.query("UPDATE products SET sizes=$1 WHERE id=$2", [JSON.stringify(sizes), order.product_id]);
      }
      await client.query("UPDATE orders SET status='EXPIRED' WHERE id=$1", [order_id]);
      await client.query("COMMIT");
      return res.status(410).json({ error: "Payment window expired (15 minutes). Order has been cancelled." });
    }

    // Simulate payment gateway charge (flat Rp 50.000 service fee already in total_amount)
    // Mark order as PAID — funds move to escrow
    await client.query(
      "UPDATE orders SET status='PAID', paid_at=CURRENT_TIMESTAMP WHERE id=$1",
      [order_id]
    );

    await client.query("COMMIT");

    const updatedOrder = await pool.query("SELECT * FROM orders WHERE id=$1", [order_id]);
    res.json({
      message: "Payment successful. Funds held in escrow.",
      order: updatedOrder.rows[0],
      payment_simulation: {
        gateway: "Midtrans (Simulated)",
        service_fee: 50000,
        status: "CAPTURED",
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Payment processing error:", error);
    res.status(500).json({ error: "Payment processing failed" });
  } finally {
    client.release();
  }
});

// ─── Seller Stats ─────────────────────────────────────────────────────────────

router.get("/seller/stats", authMiddleware, requireRole("seller"), async (req, res) => {
  try {
    const activeProductsResult = await pool.query(
      "SELECT COUNT(*) as count FROM products WHERE status NOT IN ('REJECTED','SOLD')"
    );
    const activeProducts = Number(activeProductsResult.rows[0].count);
    const ordersResult = await pool.query("SELECT total_amount, created_at, status FROM orders ORDER BY created_at ASC");
    const orders = ordersResult.rows.map((row) => ({
      amount: Number(row.total_amount),
      createdAt: new Date(row.created_at),
    }));

    const now = new Date();
    const daysOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    const range7D = [];
    let revenue7D = 0, sales7D = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const dayOrders = orders.filter((o) => o.createdAt >= start && o.createdAt <= end);
      const sum = dayOrders.reduce((s, o) => s + o.amount, 0);
      revenue7D += sum; sales7D += dayOrders.length;
      range7D.push({ month: daysOfWeek[d.getDay()], sales: sum });
    }
    const range1M = [];
    let revenue1M = 0, sales1M = 0;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const dayOrders = orders.filter((o) => o.createdAt >= start && o.createdAt <= end);
      const sum = dayOrders.reduce((s, o) => s + o.amount, 0);
      revenue1M += sum; sales1M += dayOrders.length;
      range1M.push({ month: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), sales: sum });
    }
    const buildMonthRange = (count: number) => {
      const names = [];
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - i);
        names.push(d.toLocaleDateString("en-US", { month: "short" }));
      }
      let rev = 0, sal = 0;
      const data = names.map((mName) => {
        const mo = orders.filter((o) => o.createdAt.toLocaleDateString("en-US", { month: "short" }) === mName);
        const sum = mo.reduce((s, o) => s + o.amount, 0);
        rev += sum; sal += mo.length;
        return { month: mName, sales: sum };
      });
      return { data, rev, sal };
    };
    const r3M = buildMonthRange(3);
    const rALL = buildMonthRange(6);
    res.json({
      activeProducts,
      ranges: {
        "7D": { revenue: revenue7D, totalSales: sales7D, chartData: range7D },
        "1M": { revenue: revenue1M, totalSales: sales1M, chartData: range1M },
        "3M": { revenue: r3M.rev, totalSales: r3M.sal, chartData: r3M.data },
        ALL: { revenue: rALL.rev, totalSales: rALL.sal, chartData: rALL.data },
      },
    });
  } catch (error) {
    console.error("Failed to fetch seller stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── Seller Finance ───────────────────────────────────────────────────────────

router.get("/seller/finance", authMiddleware, requireRole("seller"), async (req, res) => {
  try {
    const ledgerResult = await pool.query("SELECT * FROM ledger_history ORDER BY created_at DESC");
    const extractionsResult = await pool.query("SELECT COALESCE(SUM(amount),0) as extracted FROM ledger_history WHERE type='EXTRACTION'");
    const totalExtracted = Number(extractionsResult.rows[0].extracted);
    const pendingResult = await pool.query("SELECT COALESCE(SUM(total_amount),0) as pending FROM orders WHERE status NOT IN ('COMPLETED','REJECTED','EXPIRED')");
    const pendingValuation = Number(pendingResult.rows[0].pending);
    const settledResult = await pool.query("SELECT COALESCE(SUM(total_amount),0) as settled FROM orders WHERE status='COMPLETED'");
    const settledRevenue = Number(settledResult.rows[0].settled);
    const bridgeAmount = 3000000;
    const liquidBalance = bridgeAmount + settledRevenue - totalExtracted;
    res.json({ liquidBalance, pendingValuation, ledger: ledgerResult.rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch finance data" });
  }
});

// ─── Seller OTP: Request extraction OTP (REQ-F6-2) ───────────────────────────
// In production this would send via SMS/email. Here we return the OTP in the
// response so the frontend can simulate the "you received an SMS" experience.

router.post("/seller/otp/request", authMiddleware, requireRole("seller"), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // DELETE existing OTP for this user+purpose, then INSERT fresh.
    // Avoids dependency on UNIQUE constraint which may not exist on older DBs.
    await pool.query(
      `DELETE FROM otp_tokens WHERE user_id=$1 AND purpose='EXTRACTION'`,
      [userId]
    );
    await pool.query(
      `INSERT INTO otp_tokens (user_id, otp_code, expires_at, purpose, used)
       VALUES ($1, $2, $3, 'EXTRACTION', false)`,
      [userId, otp, expiresAt]
    );

    res.json({
      message: "OTP generated (simulation — in production this would be sent via SMS)",
      otp_simulation: otp, // exposed for demo/simulation only
      expires_in_seconds: 300,
    });
  } catch (error) {
    console.error("OTP request error:", error);
    res.status(500).json({ error: "Failed to generate OTP" });
  }
});

// ─── Seller Extract / Disburse (REQ-F6-1, REQ-F6-2) ─────────────────────────

router.post("/seller/extract", authMiddleware, requireRole("seller"), async (req, res) => {
  try {
    const { amount, bank, accountNumber, otp_code } = req.body;
    if (!amount || !bank || !accountNumber || !otp_code) {
      return res.status(400).json({ error: "amount, bank, accountNumber, and otp_code are required" });
    }
    const extractionAmount = Number(amount);
    if (isNaN(extractionAmount) || extractionAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // REQ-F6-2: Verify OTP
    const otpResult = await pool.query(
      `SELECT * FROM otp_tokens WHERE user_id=$1 AND purpose='EXTRACTION' AND used=false AND expires_at > NOW()`,
      [(req as any).user.id]
    );
    if (otpResult.rows.length === 0) {
      return res.status(401).json({ error: "OTP expired or not requested. Please request a new OTP." });
    }
    if (otpResult.rows[0].otp_code !== String(otp_code)) {
      return res.status(401).json({ error: "Invalid OTP code." });
    }
    // Mark OTP used
    await pool.query("UPDATE otp_tokens SET used=true WHERE id=$1", [otpResult.rows[0].id]);

    // REQ-F6-1: Check balance
    const settledResult = await pool.query("SELECT COALESCE(SUM(total_amount),0) as settled FROM orders WHERE status='COMPLETED'");
    const extractionsResult = await pool.query("SELECT COALESCE(SUM(amount),0) as extracted FROM ledger_history WHERE type='EXTRACTION'");
    const liquidBalance = 3000000 + Number(settledResult.rows[0].settled) - Number(extractionsResult.rows[0].extracted);
    if (extractionAmount > liquidBalance) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    await pool.query(
      "INSERT INTO ledger_history (amount, type, entity, status) VALUES ($1,'EXTRACTION',$2,'PROCESSED')",
      [extractionAmount, `${bank} - ${accountNumber.slice(-4)}`]
    );
    res.json({ message: "Extraction successful", withdrawn: extractionAmount });
  } catch (error) {
    console.error("Failed to process extraction:", error);
    res.status(500).json({ error: "Failed to process extraction" });
  }
});

// ─── Products: Price History ──────────────────────────────────────────────────

router.get("/products/:id/price-history", async (req, res) => {
  try {
    const { id } = req.params;
    const productResult = await pool.query("SELECT price FROM products WHERE id=$1", [id]);
    let currentPrice = 150000;
    if (productResult.rows.length > 0) currentPrice = Number(productResult.rows[0].price);
    const history = await pool.query(
      "SELECT TO_CHAR(created_at,'Mon') as date, price FROM price_history WHERE product_id=$1 ORDER BY created_at ASC",
      [id]
    );
    const dbHistoryMap: Record<string,number> = {};
    for (const r of history.rows) dbHistoryMap[r.date] = Number(r.price);
    const months = ["Jan","Feb","Mar","Apr","May"];
    const paddedHistory = months.map((m) => ({
      date: m,
      price: dbHistoryMap[m] || Math.round(currentPrice * (0.8 + months.indexOf(m) * 0.05)),
    }));
    res.json(paddedHistory);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});

// ─── Products: List ───────────────────────────────────────────────────────────

router.get("/products", async (req, res) => {
  try {
    const { status, limit, offset, condition, gender } = req.query;
    let query = `SELECT *, original_price as "originalPrice" FROM products`;
    const params: any[] = [];
    const whereConditions: string[] = [];

    if (status) {
      // Per updated SRS: products are ACTIVE (available) by default; no status filter based on verification for listing
      if (status === "VERIFIED") {
        whereConditions.push(`status NOT IN ('REJECTED','SOLD')`);
      } else {
        whereConditions.push(`status = $${params.length + 1}`);
        params.push(status);
      }
    } else {
      whereConditions.push(`status NOT IN ('REJECTED','SOLD')`);
    }
    if (condition) { whereConditions.push(`condition = $${params.length + 1}`); params.push(condition); }
    if (gender)    { whereConditions.push(`gender = $${params.length + 1}`);    params.push(gender);    }
    if (whereConditions.length > 0) query += " WHERE " + whereConditions.join(" AND ");
    query += " ORDER BY created_at DESC";

    const countParams = [...params];
    if (limit)  { query += ` LIMIT $${params.length + 1}`;  params.push(limit);  }
    if (offset) { query += ` OFFSET $${params.length + 1}`; params.push(offset); }

    const result = await pool.query(query, params);
    let countQuery = "SELECT COUNT(*) FROM products";
    if (whereConditions.length > 0) countQuery += " WHERE " + whereConditions.join(" AND ");
    const countResult = await pool.query(countQuery, countParams);

    res.json({ products: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─── Products: Create (Seller) — no verification needed on add/edit (BR-4 updated) ─

router.post("/products", authMiddleware, requireRole("seller"), async (req, res) => {
  try {
    const { name, description, category, price, originalPrice, image, condition, gender, sizes } = req.body;
    // Per updated SRS: new products go ACTIVE immediately (no pre-listing verification).
    // Verification happens AFTER a buyer pays (per the escrow/authentication flow).
    const result = await pool.query(
      `INSERT INTO products (name, description, category, price, original_price, image, condition, gender, sizes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'ACTIVE')
       RETURNING *, original_price as "originalPrice"`,
      [name, description, category, price, originalPrice || null, image, condition, gender || "Unisex", JSON.stringify(sizes)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to add product:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
});

// ─── Products: Edit (Seller) — BR-4: edit never changes verification status ──

router.put("/products/:id", authMiddleware, requireRole("seller"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, originalPrice, image, condition, gender, sizes } = req.body;
    const current = await pool.query("SELECT status FROM products WHERE id=$1", [id]);
    if (current.rows.length === 0) return res.status(404).json({ error: "Product not found" });

    // BR-4 (updated per SRS clarification): editing a product — including changing stock —
    // does NOT trigger re-verification. Status is preserved as-is.
    const currentStatus = current.rows[0].status;

    const result = await pool.query(
      `UPDATE products SET name=$1, description=$2, category=$3, price=$4, original_price=$5,
       image=$6, condition=$7, gender=$8, sizes=$9, status=$10 WHERE id=$11
       RETURNING *, original_price as "originalPrice"`,
      [name, description, category, price, originalPrice || null, image, condition, gender || "Unisex", JSON.stringify(sizes), currentStatus, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update product:", error);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/products/:id", authMiddleware, requireRole("seller"), async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete product" });
  }
});

// ─── Orders: List ─────────────────────────────────────────────────────────────

router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const limit  = parseInt(req.query.limit  as string) || 120;
    const offset = parseInt(req.query.offset as string) || 0;
    const { status, search } = req.query;

    let query = `
      SELECT o.*, p.name as product_name, p.image as product_image, p.category, p.condition,
             p.sizes as product_sizes, p.id as product_internal_id,
             r.id as review_id, r.rating as review_rating, r.comment as review_comment,
             r.created_at as review_created_at
      FROM orders o
      JOIN products p ON o.product_id = p.id
      LEFT JOIN reviews r ON o.id = r.order_id
    `;
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (status) {
      const statusMap: Record<string,string> = {
        Processing: "PAID", "In Verification": "IN_VERIFICATION",
        Shipped: "SHIPPED", Completed: "COMPLETED", Rejected: "REJECTED",
        Submitted: "SUBMITTED",
      };
      whereConditions.push(`o.status = $${params.length + 1}`);
      params.push(statusMap[status as string] || status);
    }
    if (search) {
      const cleanSearch = (search as string).trim().toLowerCase();
      const orderIdMatch = cleanSearch.match(/^ord-(\d+)$/i);
      if (orderIdMatch) {
        whereConditions.push(`(o.id=$${params.length+1} OR p.name ILIKE $${params.length+2})`);
        params.push(parseInt(orderIdMatch[1]), `%${cleanSearch}%`);
      } else if (!isNaN(Number(cleanSearch))) {
        whereConditions.push(`(o.id=$${params.length+1} OR p.name ILIKE $${params.length+2})`);
        params.push(parseInt(cleanSearch), `%${cleanSearch}%`);
      } else {
        whereConditions.push(`p.name ILIKE $${params.length+1}`);
        params.push(`%${cleanSearch}%`);
      }
    }
    if (whereConditions.length > 0) query += " WHERE " + whereConditions.join(" AND ");
    query += " ORDER BY o.created_at DESC";

    const countParams = [...params];
    query += ` LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    let countQuery = `SELECT COUNT(*) FROM orders o JOIN products p ON o.product_id=p.id`;
    if (whereConditions.length > 0) countQuery += " WHERE " + whereConditions.join(" AND ");
    const countResult = await pool.query(countQuery, countParams);

    res.json({ orders: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ─── Orders: Create — BR-1 (SUBMITTED first), REQ-F2-1 (stock lock) ──────────

router.post("/orders", authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { product_id, total_amount, size } = req.body;
    if (!size)         return res.status(400).json({ error: "Size is required" });
    if (!total_amount) return res.status(400).json({ error: "total_amount is required" });

    await client.query("BEGIN");

    // Lock the product row to prevent concurrent stock deduction (REQ-F2-1)
    const productCheck = await client.query(
      "SELECT status, sizes FROM products WHERE id=$1 FOR UPDATE",
      [product_id]
    );
    const product = productCheck.rows[0];
    if (!product || product.status === "SOLD" || product.status === "REJECTED") {
      throw new Error("Product is no longer available");
    }

    let sizes = typeof product.sizes === "string" ? JSON.parse(product.sizes) : product.sizes;
    if (!sizes[size] || sizes[size] <= 0) throw new Error(`Size ${size} is out of stock`);

    // Deduct stock immediately (prevents race condition / double-buy)
    sizes[size] = sizes[size] - 1;
    const totalStock = Object.values(sizes).reduce((acc: number, curr: any) => acc + (Number(curr) || 0), 0);
    await client.query("UPDATE products SET sizes=$1 WHERE id=$2", [JSON.stringify(sizes), product_id]);
    if (totalStock === 0) {
      await client.query("UPDATE products SET status='SOLD' WHERE id=$1", [product_id]);
    }

    // BR-1: Order starts as SUBMITTED (not yet PAID)
    // REQ-F2-1: reserved_size stored so stock can be restored on expire
    const orderResult = await client.query(
      `INSERT INTO orders (product_id, total_amount, status, customer_id, reserved_size)
       VALUES ($1,$2,'SUBMITTED',$3,$4) RETURNING *`,
      [product_id, total_amount, (req as any).user?.id || null, size]
    );

    await client.query("COMMIT");
    res.status(201).json({
      ...orderResult.rows[0],
      payment_window_seconds: 900, // 15 minutes (BR-3)
      message: "Order created. Proceed to payment within 15 minutes.",
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Failed to place order:", e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to place order" });
  } finally {
    client.release();
  }
});

// ─── Orders: Seller ships to verifier ────────────────────────────────────────

router.patch("/orders/:id/ship", authMiddleware, requireRole("seller"), async (req, res) => {
  try {
    const { id } = req.params;
    const { tracking_number } = req.body;
    const result = await pool.query(
      "UPDATE orders SET tracking_number=$1, status='IN_VERIFICATION' WHERE id=$2 AND status='PAID' RETURNING *",
      [tracking_number, id]
    );
    if (!result.rows[0]) return res.status(400).json({ error: "Order not found or not in PAID status" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to ship order to verifier" });
  }
});

// ─── Orders: Verifier authenticates (REQ-F4-1, REQ-F4-2) ─────────────────────

router.patch("/orders/:id/verify", authMiddleware, requireRole("verifier"), async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, notes, evidence_image } = req.body;
    const verifierId = (req as any).user?.id;
    const nextOrderStatus = status === "AUTHENTIC" ? "SHIPPED" : "REJECTED";

    await client.query("BEGIN");

    const orderResult = await client.query(
      `UPDATE orders
       SET status=$1, verification_notes=$2, verification_evidence_image=$3,
           verifier_id=$4, verified_at=CURRENT_TIMESTAMP
       WHERE id=$5 RETURNING *`,
      [nextOrderStatus, notes || null, evidence_image || null, verifierId, id]
    );
    const order = orderResult.rows[0];

    if (order && order.product_id) {
      if (status === "AUTHENTIC") {
        await client.query("UPDATE products SET status='VERIFIED' WHERE id=$1", [order.product_id]);
      } else if (status === "COUNTERFEIT") {
        // BR-2: suspend seller (or apply penalty) + refund flow
        await client.query(
          `UPDATE users SET suspended_until = NOW() + INTERVAL '30 days'
           WHERE id = (SELECT seller_id FROM products WHERE id=$1)`,
          [order.product_id]
        );
        // Restore stock
        const prodResult = await client.query("SELECT sizes FROM products WHERE id=$1", [order.product_id]);
        if (prodResult.rows.length > 0 && order.reserved_size) {
          const sizes = typeof prodResult.rows[0].sizes === "string"
            ? JSON.parse(prodResult.rows[0].sizes) : prodResult.rows[0].sizes || {};
          sizes[order.reserved_size] = (sizes[order.reserved_size] || 0) + 1;
          await client.query("UPDATE products SET sizes=$1 WHERE id=$2", [JSON.stringify(sizes), order.product_id]);
        }
        // Initiate refund record
        await client.query(
          "INSERT INTO ledger_history (amount, type, entity, status) VALUES ($1,'REFUND','Buyer Refund - Order #'||$2,'PROCESSED')",
          [order.total_amount, id]
        );
        // Final order status: REFUNDED
        await client.query("UPDATE orders SET status='REFUNDED' WHERE id=$1", [id]);
      }
    }
    await client.query("COMMIT");
    const finalOrder = await pool.query("SELECT * FROM orders WHERE id=$1", [id]);
    res.json(finalOrder.rows[0] || order);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to verify order:", error);
    res.status(500).json({ error: "Failed to verify order" });
  } finally {
    client.release();
  }
});

// ─── Orders: Delivery tracking ────────────────────────────────────────────────

router.patch("/orders/:id/deliver", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE orders SET status='DELIVERED' WHERE id=$1 AND status='SHIPPED' RETURNING *",
      [id]
    );
    res.json(result.rows[0] || { message: "Order not found or not in SHIPPED status" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update delivery status" });
  }
});

router.patch("/orders/:id/complete", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE orders SET status='COMPLETED' WHERE id=$1 AND status='DELIVERED' RETURNING *",
      [id]
    );
    res.json(result.rows[0] || { message: "Order not found or not in DELIVERED status" });
  } catch (error) {
    res.status(500).json({ error: "Failed to complete order" });
  }
});

// ─── Reviews (REQ-F7-1, REQ-F7-2, REQ-F7-3) ──────────────────────────────────

router.get("/reviews/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      `SELECT r.id, r.product_id, r.customer_id, r.order_id, r.rating, r.comment, r.created_at,
              COALESCE(r.user_name, u.username, 'Anonymous') as user_name
       FROM reviews r
       LEFT JOIN users u ON r.customer_id = u.id
       WHERE r.product_id=$1 ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json({ reviews: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.post("/reviews", authMiddleware, async (req, res) => {
  try {
    const { product_id, order_id, rating, comment, customer_id, user_name } = req.body;
    if (!product_id || !rating) return res.status(400).json({ error: "Product ID and rating are required" });

    if (order_id) {
      const orderCheck = await pool.query("SELECT status FROM orders WHERE id=$1", [order_id]);
      if (orderCheck.rows.length === 0) return res.status(404).json({ error: "Order not found" });
      // REQ-F7-1: Only COMPLETED orders
      if (orderCheck.rows[0].status !== "COMPLETED") {
        return res.status(400).json({ error: "Review can only be submitted for completed orders" });
      }
      const existing = await pool.query("SELECT id FROM reviews WHERE order_id=$1", [order_id]);
      if (existing.rows.length > 0) return res.status(400).json({ error: "A review for this order has already been submitted." });
    }

    // REQ-F7-3: No update/delete — INSERT only
    const result = await pool.query(
      `INSERT INTO reviews (product_id, customer_id, order_id, rating, comment, user_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [product_id, customer_id || null, order_id || null, rating, comment || "", user_name || "Anonymous"]
    );

    // REQ-F7-2: Auto-recalculate seller average rating
    await pool.query(
      `UPDATE users u
       SET rating = (
         SELECT ROUND(AVG(r.rating)::numeric,1)
         FROM reviews r JOIN products p ON r.product_id=p.id
         WHERE p.seller_id=u.id
       )
       WHERE u.id=(SELECT seller_id FROM products WHERE id=$1)`,
      [product_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to save review:", error);
    res.status(500).json({ error: "Failed to save review" });
  }
});

export default router;
