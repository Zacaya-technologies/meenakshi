'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AppContext = createContext(null);

const LS = {
  user: 'meenakshi_user',
  token: 'meenakshi_token',
  cart: 'meenakshi_cart',
  wishlist: 'meenakshi_wishlist',
  compare: 'meenakshi_compare',
  theme: 'meenakshi_dark_mode'
};

function readLS(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [compare, setCompare] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(readLS(LS.user, null));
    setToken(readLS(LS.token, ''));
    setCart(readLS(LS.cart, []));
    setWishlist(readLS(LS.wishlist, []));
    setCompare(readLS(LS.compare, []));
    const dark = readLS(LS.theme, '0') === '1';
    setDarkMode(dark);
    if (dark) document.documentElement.classList.add('dark');
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    writeLS(LS.theme, darkMode ? '1' : '0');
  }, [darkMode, hydrated]);

  const persist = (key, value) => {
    writeLS(key, value);
  };

  const addToCart = (product, quantityBoxes = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      let next;
      if (existing) {
        next = prev.map(i => (i.product.id === product.id ? { ...i, quantityBoxes: i.quantityBoxes + quantityBoxes } : i));
      } else {
        next = [...prev, { product, quantityBoxes }];
      }
      persist(LS.cart, next);
      return next;
    });
  };

  const updateCartQty = (productId, qty) => {
    setCart(prev => {
      const next = prev.map(i => (i.product.id === productId ? { ...i, quantityBoxes: Math.max(1, qty) } : i));
      persist(LS.cart, next);
      return next;
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const next = prev.filter(i => i.product.id !== productId);
      persist(LS.cart, next);
      return next;
    });
  };

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const exists = prev.some(p => p.id === product.id);
      const next = exists ? prev.filter(p => p.id !== product.id) : [...prev, product];
      persist(LS.wishlist, next);
      return next;
    });
  };

  const toggleCompare = (product) => {
    setCompare(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        const next = prev.filter(p => p.id !== product.id);
        persist(LS.compare, next);
        return next;
      }
      if (prev.length >= 4) return prev; // Max 4
      const next = [...prev, product];
      persist(LS.compare, next);
      return next;
    });
  };

  const login = (u, t) => {
    setUser(u);
    setToken(t);
    persist(LS.user, u);
    writeLS(LS.token, t);
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem(LS.user);
    localStorage.removeItem(LS.token);
  };

  const cartCount = useMemo(() => cart.reduce((acc, i) => acc + i.quantityBoxes, 0), [cart]);
  const cartTotal = useMemo(
    () => cart.reduce((acc, i) => acc + (i.product.offer_price || i.product.price || 0) * i.quantityBoxes, 0),
    [cart]
  );

  const value = useMemo(
    () => ({
      user, token, cart, wishlist, compare, darkMode, hydrated,
      cartCount, cartTotal,
      addToCart, updateCartQty, removeFromCart, toggleWishlist, toggleCompare,
      login, logout, setDarkMode
    }),
    [user, token, cart, wishlist, compare, darkMode, hydrated, cartCount, cartTotal]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

