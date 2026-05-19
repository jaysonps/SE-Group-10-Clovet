export type UserRole = 'customer' | 'seller' | 'verifier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description?: string;
  condition?: string;
  size?: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  customerName: string;
  date: string;
  price: number;
  status: string;
  trackingNumber?: string;
}
