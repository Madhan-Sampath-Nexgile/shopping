import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { token } = useSelector((state) => state.user);
  const [cartCount, setCartCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCartCount = useCallback(async () => {
    if (!token) {
      setCartCount(0);
      setCartItems([]);
      return;
    }

    try {
      const { data } = await api.get('/cart');
      setCartItems(data.items || []);
      setCartCount(data.summary?.itemCount || 0);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
      setCartItems([]);
    }
  }, [token]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  // Listen for cart-updated custom events
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, [fetchCartCount]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    setLoading(true);
    try {
      await api.post('/cart/add', { productId, quantity });
      await fetchCartCount();
      window.dispatchEvent(new CustomEvent('cart-updated'));
      return { success: true };
    } catch (error) {
      console.error('Error adding to cart:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to add to cart'
      };
    } finally {
      setLoading(false);
    }
  }, [fetchCartCount]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      await api.put(`/cart/${productId}`, { quantity });
      await fetchCartCount();
      window.dispatchEvent(new CustomEvent('cart-updated'));
      return { success: true };
    } catch (error) {
      console.error('Error updating quantity:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update quantity'
      };
    }
  }, [fetchCartCount]);

  const removeFromCart = useCallback(async (productId) => {
    try {
      await api.delete(`/cart/${productId}`);
      await fetchCartCount();
      window.dispatchEvent(new CustomEvent('cart-updated'));
      return { success: true };
    } catch (error) {
      console.error('Error removing from cart:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove from cart'
      };
    }
  }, [fetchCartCount]);

  const clearCart = useCallback(async () => {
    try {
      await api.delete('/cart');
      await fetchCartCount();
      window.dispatchEvent(new CustomEvent('cart-updated'));
      return { success: true };
    } catch (error) {
      console.error('Error clearing cart:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to clear cart'
      };
    }
  }, [fetchCartCount]);

  return (
    <CartContext.Provider
      value={{
        cartCount,
        cartItems,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
