import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useToast } from '../contexts/ToastContext';

export default function Cart() {
  const { token } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const { showSuccess, showError } = useToast();

  const [cartItems, setCartItems] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [summary, setSummary] = useState({ itemCount: 0, subtotal: 0, shipping: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [token, navigate]);

  const fetchCart = async () => {
    try {
      const [cartRes, savedRes] = await Promise.all([
        api.get('/cart'),
        api.get('/cart/saved')
      ]);

      setCartItems(cartRes.data.items || []);
      setSavedItems(savedRes.data.items || []);
      setSummary(cartRes.data.summary || { itemCount: 0, subtotal: 0, shipping: 0, total: 0 });
      refreshCart(); // Update global cart count
    } catch (error) {
      console.error('Error fetching cart:', error);

      // Don't show error toast for empty cart (404) or if cart doesn't exist yet
      // Only show error for actual server errors (500, network errors, etc.)
      if (error.response?.status && error.response.status >= 500) {
        showError('Failed to load cart');
      }

      // Set empty arrays regardless of error type
      setCartItems([]);
      setSavedItems([]);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdating(productId);
    try {
      await api.put(`/cart/${productId}`, { quantity: newQuantity });
      await fetchCart();
      showSuccess('Quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      showError(error.response?.data?.error || 'Failed to update quantity');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (productId) => {
    setUpdating(productId);
    try {
      await api.delete(`/cart/${productId}`);
      await fetchCart();
      showSuccess('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      showError('Failed to remove item');
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;

    try {
      await api.delete('/cart');
      await fetchCart();
      showSuccess('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      showError('Failed to clear cart');
    }
  };

  const saveForLater = async (productId) => {
    setUpdating(productId);
    try {
      await api.post(`/cart/save/${productId}`);
      await fetchCart();
      showSuccess('Saved for later');
    } catch (error) {
      console.error('Error saving for later:', error);
      showError('Failed to save for later');
    } finally {
      setUpdating(null);
    }
  };

  const moveToCart = async (productId) => {
    setUpdating(productId);
    try {
      await api.post(`/cart/move-to-cart/${productId}`);
      await fetchCart();
      showSuccess('Moved to cart');
    } catch (error) {
      console.error('Error moving to cart:', error);
      showError(error.response?.data?.error || 'Failed to move to cart');
    } finally {
      setUpdating(null);
    }
  };

  const removeSavedItem = async (productId) => {
    setUpdating(productId);
    try {
      await api.delete(`/cart/saved/${productId}`);
      await fetchCart();
      showSuccess('Removed from saved list');
    } catch (error) {
      console.error('Error removing saved item:', error);
      showError('Failed to remove saved item');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="flex justify-center mb-4">
          <ShoppingCartIcon className="w-24 h-24 text-gray-300" strokeWidth={1} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
        <p className="text-gray-600 mb-8">Add some products to get started!</p>
        <Link
          to="/search"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 font-medium text-sm"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.product_id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex gap-4"
            >
              <Link
                to={`/product/${item.product_id}`}
                className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  src={item.images?.[0] || '/placeholder.png'}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${item.product_id}`}
                  className="font-semibold text-gray-800 hover:text-blue-600 block mb-1 truncate"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-gray-300 rounded">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      disabled={updating === item.product_id || item.quantity <= 1}
                      className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                    >
                      -
                    </button>
                    <span className="px-2 font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      disabled={updating === item.product_id || item.quantity >= item.stock}
                      className="px-3 py-1 hover:bg-gray-100 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  {item.stock < 10 && (
                    <span className="text-xs text-orange-600 font-medium">
                      Only {item.stock} left
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => saveForLater(item.product_id)}
                    disabled={updating === item.product_id}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Save for Later
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    disabled={updating === item.product_id}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    ${((item.price * item.quantity) / 100).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    ${(item.price / 100).toLocaleString()} each
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Items ({summary.itemCount})</span>
                <span>${(summary.subtotal / 100).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-800">
                <span>Total</span>
                <span>${(summary.total / 100).toLocaleString()}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-center block"
            >
              Proceed to Checkout
            </Link>

            <Link
              to="/search"
              className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition text-center block"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Saved for Later Section */}
      {savedItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Saved for Later ({savedItems.length})</h2>
          <div className="space-y-4">
            {savedItems.map((item) => (
              <div
                key={item.product_id}
                className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex gap-4"
              >
                <Link
                  to={`/product/${item.product_id}`}
                  className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={item.images?.[0] || '/placeholder.png'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.product_id}`}
                    className="font-semibold text-gray-800 hover:text-blue-600 block mb-1 truncate"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-gray-500 mb-2">{item.category}</p>
                  <div className="text-base font-semibold text-blue-600">
                    ${(item.price / 100).toLocaleString()}
                  </div>
                  {item.stock === 0 && (
                    <p className="text-xs text-red-600 font-medium mt-1">Out of stock</p>
                  )}
                  {item.stock > 0 && item.stock < 10 && (
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      Only {item.stock} left
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end justify-between">
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveToCart(item.product_id)}
                      disabled={updating === item.product_id || item.stock === 0}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Move to Cart
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => removeSavedItem(item.product_id)}
                      disabled={updating === item.product_id}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
