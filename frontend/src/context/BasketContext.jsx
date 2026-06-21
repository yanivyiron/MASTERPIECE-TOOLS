import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

const BasketContext = createContext(null);
const STORAGE_KEY = 'mpt_basket';

export const BasketProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {/* ignore */ }
  }, [items]);

  const addItem = useCallback((product, qty = 1, notes = '') => {
    setItems(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + qty, notes: notes || p.notes } : p);
      }
      return [...prev, { id: product.id, slug: product.slug, nameKey: product.nameKey, image: product.image, qty, notes }];
    });
    setDrawerOpen(true);
  }, []);

  const updateQty = useCallback((id, qty) => {
    setItems(prev => prev.map(p => p.id === id ? { ...p, qty: Math.max(1, qty) } : p));
  }, []);

  const updateNotes = useCallback((id, notes) => {
    setItems(prev => prev.map(p => p.id === id ? { ...p, notes } : p));
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((a, b) => a + b.qty, 0), [items]);

  const value = { items, count, addItem, updateQty, updateNotes, removeItem, clear, drawerOpen, setDrawerOpen };
  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
};

export const useBasket = () => {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error('useBasket must be inside BasketProvider');
  return ctx;
};
