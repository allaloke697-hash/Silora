import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CartItem } from './types';
import { supabase } from './supabase';

const CART_KEY = 'silora_cart';

interface CartContextValue {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  subtotal: 0,
  itemCount: 0,
  loading: false,
});

function loadFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadFromStorage);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === item.product_id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === item.product_id
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) }
            : i,
        );
      }
      return [...prev, item];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) }
          : i,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + (i.sale_price ?? i.price) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Sync cart quantities with current product stock on mount/login changes
  useEffect(() => {
    if (items.length === 0) return;
    (async () => {
      setLoading(true);
      const ids = items.map((i) => i.product_id);
      const { data } = await supabase
        .from('products')
        .select('id, stock, visibility, status')
        .in('id', ids);

      if (data) {
        const productMap = new Map(data.map((p) => [p.id, p]));
        setItems((prev) =>
          prev
            .map((i) => {
              const p = productMap.get(i.product_id);
              if (!p) return i;
              if (!p.visibility || p.status !== 'active') return null;
              return { ...i, stock: p.stock, quantity: Math.min(i.quantity, p.stock) };
            })
            .filter((x): x is CartItem => x !== null),
        );
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        itemCount,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
