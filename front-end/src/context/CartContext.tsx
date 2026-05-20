import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string;
  cartId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  condition: 'brand-new' | 'used';
  quantity: number;
  brand: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'cartId' | 'quantity'>) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, delta: number) => void;
  updateItem: (cartId: string, updates: Partial<Pick<CartItem, 'size' | 'condition'>>) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('clovet_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('clovet_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItem, 'cartId' | 'quantity'>) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(i => i.id === item.id && i.size === item.size && i.condition === item.condition);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], quantity: next[existingIndex].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, cartId: `${Date.now()}-${Math.random()}`, quantity: 1 }];
    });
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateItem = (cartId: string, updates: Partial<Pick<CartItem, 'size' | 'condition'>>) => {
    setCart(prev => prev.map(item => {
      if (item.cartId === cartId) {
        return { ...item, ...updates };
      }
      return item;
    }));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, updateItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
