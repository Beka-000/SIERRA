"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  weightOrVolume: string | null;
  modifiers?: string[];
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalAmount: number;
  addItem: (product: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  loading: boolean;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "sierra_coffee_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка корзины из localStorage при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setItems(parsed);
      }
    } catch (error) {
      console.error("[Cart] Failed to load cart from storage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Сохранение корзины в localStorage при изменении
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("[Cart] Failed to save cart to storage:", error);
      }
    }
  }, [items, loading]);

  // Добавление товара в корзину
  const addItem = (product: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const quantityToAdd = product.quantity || 1;
    
    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.productId === product.productId
      );

      if (existingIndex >= 0) {
        // Товар уже есть - увеличиваем количество
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantityToAdd,
        };
        return updated;
      } else {
        // Новый товар - добавляем с указанным количеством
        const { quantity, ...productData } = product;
        return [...current, { ...productData, quantity: quantityToAdd }];
      }
    });
  };

  // Удаление товара из корзины
  const removeItem = (productId: string) => {
    setItems((current) => current.filter((item) => item.productId !== productId));
  };

  // Обновление количества товара
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((current) => {
      const index = current.findIndex((item) => item.productId === productId);
      if (index >= 0) {
        const updated = [...current];
        updated[index] = { ...updated[index], quantity };
        return updated;
      }
      return current;
    });
  };

  // Очистка корзины
  const clearCart = () => {
    setItems([]);
  };

  // Получение количества конкретного товара
  const getItemQuantity = (productId: string): number => {
    const item = items.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
  };

  // Подсчёт общего количества товаров
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Подсчёт общей суммы
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        totalAmount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
