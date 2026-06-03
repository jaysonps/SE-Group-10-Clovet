import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  cartId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  condition: 'New' | 'Pre-owned';
  quantity: number;
  brand: string;
  maxStock?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartId' | 'quantity'>) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  updateItem: (cartId: string, updates: Partial<Pick<CartItem, 'size' | 'condition'>>) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('clovet_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('clovet_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'cartId' | 'quantity'>) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        i => i.id === item.id && i.size === item.size && i.condition === item.condition
      );
      if (existingIndex > -1) {
        const next = [...prev];
        const existing = next[existingIndex];
        const maxAllowed = existing.maxStock ?? 99;
        next[existingIndex] = {
          ...existing,
          quantity: Math.min(existing.quantity + 1, maxAllowed),
        };
        return next;
      }
      return [...prev, { ...item, cartId: `${Date.now()}-${Math.random()}`, quantity: 1 }];
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.cartId !== cartId) return item;
        const maxAllowed = item.maxStock ?? 99;
        const newQty = Math.min(maxAllowed, Math.max(1, item.quantity + delta));
        return { ...item, quantity: newQty };
      })
    );
  };

  const updateItem = (cartId: string, updates: Partial<Pick<CartItem, 'size' | 'condition'>>) => {
    setCart(prev =>
      prev.map(item => (item.cartId === cartId ? { ...item, ...updates } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('clovet_cart');
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, updateItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
