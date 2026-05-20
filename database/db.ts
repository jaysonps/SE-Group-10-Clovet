import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    console.error("Check if DATABASE_URL is set correctly in your environment variables.");
  } else {
    console.log("✅ Database connected successfully");
    if (client) release();
  }
});

export const dbQueue = async (query: string, params?: any[]) => {
  const result = await pool.query(query, params);
  return result;
};

export default pool;
