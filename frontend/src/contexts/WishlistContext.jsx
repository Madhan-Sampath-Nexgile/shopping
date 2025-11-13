import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { token } = useSelector((state) => state.user);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistProductIds, setWishlistProductIds] = useState(new Set());

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setWishlistCount(0);
      setWishlistItems([]);
      setWishlistProductIds(new Set());
      return;
    }

    try {
      const { data } = await api.get('/wishlist');
      const items = data.items || [];
      setWishlistItems(items);
      setWishlistCount(items.length);

      // Create a Set of product IDs for quick lookup
      const productIds = new Set(items.map(item => item.id));
      setWishlistProductIds(productIds);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistCount(0);
      setWishlistItems([]);
      setWishlistProductIds(new Set());
    }
  }, [token]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Listen for wishlist-updated custom events
  useEffect(() => {
    const handleWishlistUpdate = () => {
      fetchWishlist();
    };

    window.addEventListener('wishlist-updated', handleWishlistUpdate);
    return () => window.removeEventListener('wishlist-updated', handleWishlistUpdate);
  }, [fetchWishlist]);

  const addToWishlist = useCallback(async (productId) => {
    if (!token) {
      return {
        success: false,
        error: 'Please login to add to wishlist'
      };
    }

    setLoading(true);
    try {
      await api.post('/wishlist/add', { productId });
      await fetchWishlist();
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
      return { success: true };
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to add to wishlist'
      };
    } finally {
      setLoading(false);
    }
  }, [token, fetchWishlist]);

  const removeFromWishlist = useCallback(async (productId) => {
    if (!token) {
      return {
        success: false,
        error: 'Please login to manage wishlist'
      };
    }

    setLoading(true);
    try {
      await api.delete(`/wishlist/${productId}`);
      await fetchWishlist();
      window.dispatchEvent(new CustomEvent('wishlist-updated'));
      return { success: true };
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to remove from wishlist'
      };
    } finally {
      setLoading(false);
    }
  }, [token, fetchWishlist]);

  const isInWishlist = useCallback((productId) => {
    return wishlistProductIds.has(productId);
  }, [wishlistProductIds]);

  const toggleWishlist = useCallback(async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistCount,
        wishlistItems,
        loading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        refreshWishlist: fetchWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
