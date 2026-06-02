# Clovet — Premium Fashion Marketplace

Clovet adalah platform marketplace fashion digital yang mengintegrasikan transaksi aman antara penjual dan pembeli. Fokus utama pada produk fashion premium dengan mekanisme **escrow**, **autentikasi produk** oleh Expert Verifier, serta klasifikasi produk berbasis **AI/NLP**.

---

## Prasyarat

| Komponen | Versi Minimum | Rekomendasi |
|---|---|---|
| Node.js | v18 LTS | v20 LTS |
| PostgreSQL | v14 | v16 *(opsional — ada fallback PGlite)* |
| Python | v3.9 | v3.11 |

> **Catatan PGlite:** Jika PostgreSQL tidak terinstal atau tidak berjalan, sistem otomatis menggunakan **PGlite** (in-process PostgreSQL) dengan penyimpanan persisten di `./database/pglite_data`.

---

## Setup Lokal

### 1. Clone & Install
```bash
npm install
```

### 2. Environment Variables
Salin `.env.example` menjadi `.env` dan sesuaikan:

```env
DATABASE_URL=          # Kosongkan untuk pakai PGlite otomatis, atau isi string koneksi PostgreSQL
PYTHON_PATH=python3    # Path ke executable Python
NODE_ENV=development
JWT_SECRET=clovet_jwt_secret_dev
```

### 3. Jalankan Aplikasi
```bash
npm run dev
```

Aplikasi tersedia di: **http://localhost:3000**

---

## Akun Test

| Role | Username | Email | Password |
|---|---|---|---|
| **Customer** | `CUST001` | `customer@gmail.com` | `@Customer123` |
| **Seller** | `seller` | `seller@gmail.com` | `@Seller123` |
| **Verifier** | `verifier` | `verifier@gmail.com` | `@Verifier123` |

> Login bisa menggunakan **email** atau **username**.

---

## API Endpoints

### Auth
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/register` | Registrasi akun baru |
| `POST` | `/api/login` | Login → return JWT token |

### Products
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/products` | — | Daftar produk (filter: status, gender, condition, limit, offset) |
| `POST` | `/api/products` | Seller | Tambah produk baru (status: `ACTIVE`) |
| `PUT` | `/api/products/:id` | Seller | Edit produk (status tidak berubah — BR-4) |
| `DELETE` | `/api/products/:id` | Seller | Hapus produk |
| `POST` | `/api/analyze-category` | — | Analisis kategori produk via NLP (min. 15 kata) |
| `GET` | `/api/products/:id/price-history` | — | Riwayat harga produk |

### Orders — Alur BR-1
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/orders` | Customer | Buat pesanan → status **`SUBMITTED`** |
| `POST` | `/api/payment/process` | Customer | Simulasi payment gateway → status **`PAID`** (escrow) |
| `PATCH` | `/api/orders/:id/ship` | Seller | Kirim ke verifikator → status **`IN_VERIFICATION`** |
| `PATCH` | `/api/orders/:id/verify` | Verifier | Verifikasi keaslian → `SHIPPED` atau `REFUNDED` |
| `PATCH` | `/api/orders/:id/deliver` | — | Konfirmasi pengiriman → status **`DELIVERED`** |
| `PATCH` | `/api/orders/:id/complete` | — | Selesaikan pesanan → status **`COMPLETED`** |
| `GET` | `/api/orders` | ✓ | Daftar pesanan (filter: status, search) |

### Logistik (Dummy API)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/shipping/rates` | — | Hitung ongkir berdasarkan kode pos tujuan |

**Request body:**
```json
{
  "destination_postal_code": "12345",
  "weight_grams": 500
}
```
**Response:**
```json
{
  "destination_postal_code": "12345",
  "weight_grams": 500,
  "zone": "local",
  "rates": [
    { "courier": "JNE",      "service": "REG",  "estimated_days": "1-2", "price": 11000 },
    { "courier": "JNE",      "service": "YES",  "estimated_days": "1",   "price": 21000 },
    { "courier": "SiCepat",  "service": "HALU", "estimated_days": "1-2", "price": 10000 },
    { "courier": "AnterAja", "service": "REG",  "estimated_days": "1-2", "price": 9500  }
  ]
}
```

> **Zona otomatis** berdasarkan 2 digit pertama kode pos:
> - `10–16` → `local` (Jabodetabek)
> - `17–65` → `inter-island` (Pulau Jawa)
> - Lainnya → `remote` (Luar Jawa)

### Payment (Simulasi Gateway)
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `POST` | `/api/payment/process` | ✓ | Simulasi Midtrans/Xendit — validasi order `SUBMITTED`, cek 15 menit (BR-3), update ke `PAID` |

**Request body:**
```json
{ "order_id": 123 }
```
**Response:**
```json
{
  "message": "Payment successful. Funds held in escrow.",
  "order": { "id": 123, "status": "PAID", "paid_at": "..." },
  "payment_simulation": {
    "gateway": "Midtrans (Simulated)",
    "service_fee": 50000,
    "status": "CAPTURED"
  }
}
```

### Seller Finance & OTP
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/seller/finance` | Seller | Saldo, pending valuation, riwayat ledger |
| `GET` | `/api/seller/stats` | Seller | Statistik penjualan (7D/1M/3M/ALL) |
| `POST` | `/api/seller/otp/request` | Seller | Request OTP untuk penarikan saldo (REQ-F6-2) |
| `POST` | `/api/seller/extract` | Seller | Tarik saldo — wajib sertakan `otp_code` |

**Extract request body:**
```json
{
  "amount": 500000,
  "bank": "BCA CENTRAL ASIA",
  "accountNumber": "1234567890",
  "otp_code": "123456"
}
```

### Reviews
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/reviews/product/:productId` | — | Semua ulasan untuk suatu produk |
| `POST` | `/api/reviews` | ✓ | Buat ulasan (hanya untuk order `COMPLETED`, satu per order) |

### Users
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| `GET` | `/api/users/:id` | ✓ | Profil pengguna |
| `PUT` | `/api/users/:id` | ✓ | Update profil |
| `PUT` | `/api/users/:id/change-password` | ✓ | Ganti password |

---

## Alur Transaksi (BR-1)

```
SUBMITTED → PAID → IN_VERIFICATION → SHIPPED → DELIVERED → COMPLETED
                                   ↘ REJECTED → REFUNDED
SUBMITTED (>15 menit tanpa bayar) → EXPIRED
```

---

## Status Produk

| Status | Keterangan |
|---|---|
| `ACTIVE` | Produk aktif, tersedia untuk dibeli |
| `VERIFIED` | Produk telah lolos verifikasi keaslian |
| `SOLD` | Stok habis |
| `REJECTED` | Produk palsu, ditolak verifikator |

> Produk baru langsung masuk status `ACTIVE` saat dipublish. Verifikasi dilakukan **setelah ada pesanan berbayar** (bukan saat listing).

---

## Struktur Proyek

```
clovet/
├── backend/
│   └── routes.ts          # Semua API endpoints
├── database/
│   ├── db.ts              # Koneksi pool (PostgreSQL / PGlite fallback)
│   └── init.ts            # Inisialisasi tabel & seed data
├── ai/
│   └── nlp.ts             # Bridge Node.js → Python NLP classifier
├── front-end/
│   └── src/
│       ├── pages/         # Halaman React (Checkout, SellerDashboard, dll)
│       ├── context/       # AuthContext, CartContext
│       └── assets/        # Gambar produk
├── server.ts              # Entry point Express + Vite
└── .env.example
```

---

## Fitur NLP

Classifier Python menganalisis judul dan deskripsi produk untuk menyarankan kategori secara otomatis. Minimal **15 kata** deskripsi diperlukan (REQ-F3-1). Kategori yang didukung:

- Tops
- Outerwears
- Bottoms
- Knitwears & Fleeces
- Dresses & Suits
