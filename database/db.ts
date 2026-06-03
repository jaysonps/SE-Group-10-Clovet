import pg from "pg";
import { PGlite } from "@electric-sql/pglite";
import path from "path";

const { Pool } = pg;

let pool: any = null;
let pgliteInstance: PGlite | null = null;
let isPglite = false;

let connectionString = process.env.DATABASE_URL;
if (connectionString) {
  connectionString = connectionString.trim().split(/\s+/)[0];
}

const usePglite = !connectionString || connectionString.includes("localhost") || connectionString.includes("127.0.0.1");

if (usePglite) {
  console.log("ℹ️ Using persistent PGlite fallback for development database...");
  pgliteInstance = new PGlite(path.join(process.cwd(), "database", "pglite_data"));
  isPglite = true;
} else {
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });
}

const dbPool = {
  query: async (text: string, params?: any[]) => {
    if (isPglite && pgliteInstance) {
      const res = await pgliteInstance.query(text, params);
      return {
        rows: res.rows,
        rowCount: res.affectedRows ?? res.rows.length,
        command: "SELECT"
      };
    } else {
      return await pool.query(text, params);
    }
  },
  connect: (cb?: any) => {
    if (isPglite) {
      const dbClient = {
        query: dbPool.query,
        release: () => {}
      };
      if (cb) cb(null, dbClient, () => {});
      return Promise.resolve(dbClient);
    } else {
      return pool.connect(cb);
    }
  },
  on: (event: string, cb: any) => {
    if (!isPglite && pool) {
      pool.on(event, cb);
    }
  }
};

if (isPglite) {
  console.log("✅ PGlite fallback initialized successfully");
} else {
  pool.connect((err: any, client: any, release: any) => {
    if (err) {
      console.error("❌ Database connection failed:", err.message);
    } else {
      console.log("✅ Database connected successfully");
      if (client) release();
    }
  });
}

export const dbQueue = async (query: string, params?: any[]) => {
  const result = await dbPool.query(query, params);
  return result;
};

export default dbPool;
