// ─── User ─────────────────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'seller' | 'verifier';

export interface User {
  id: string | number;
  username: string;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  rating?: number;
}

// ─── Product ──────────────────────────────────────────────────────────────────
export type ProductStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SOLD';
export type ProductCondition = 'New' | 'Pre-owned';
export type ProductGender = 'Men' | 'Women' | 'Unisex';

export interface Product {
  id: string | number;
  sellerId?: number;
  name: string;
  brand?: string;
  description?: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  status: ProductStatus;
  condition: ProductCondition;
  gender: ProductGender;
  sizes: Record<string, number>;
  createdAt?: string;
}

// ─── Order ────────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'SUBMITTED'
  | 'PAID'
  | 'IN_VERIFICATION'
  | 'VERIFIED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'REFUNDED';

export interface Order {
  id: string | number;
  productId: string | number;
  productName: string;
  productImage: string;
  customerId?: number;
  date: string;
  price: number;
  status: OrderStatus;
  size?: string;
  trackingNumber?: string;
  verifierId?: number;
  verifiedAt?: string;
  verificationNotes?: string;
  verificationEvidenceImage?: string;
  reviewId?: number;
  reviewed?: boolean;
}

// ─── Review ───────────────────────────────────────────────────────────────────
export interface Review {
  id: string | number;
  productId: string | number;
  customerId?: number;
  orderId?: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  verified: boolean;
}

// ─── Escrow ───────────────────────────────────────────────────────────────────
export interface Escrow {
  id: string | number;
  transactionId: string | number;
  jumlahDana: number;
  statusDana: 'HELD' | 'RELEASED' | 'REFUNDED';
}

// ─── Ledger ───────────────────────────────────────────────────────────────────
export interface LedgerEntry {
  id: string | number;
  amount: number;
  type: 'EXTRACTION' | 'DEPOSIT';
  entity: string;
  status: string;
  createdAt: string;
}

// ─── Finance ──────────────────────────────────────────────────────────────────
export interface FinanceData {
  liquidBalance: number;
  pendingValuation: number;
  ledger: LedgerEntry[];
}

// ─── NLP ──────────────────────────────────────────────────────────────────────
export interface CategoryResult {
  category: string;
  confidence: number;
}
