import { Link } from 'react-router-dom';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '../../contexts/CartContext';

export default function CartQuickView({ isVisible }) {
  const { cartItems, cartCount } = useCart();

  if (!isVisible || cartCount === 0) {
    return null;
  }

  // Calculate total - cart items have flat structure
  const total = cartItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCartIcon className="w-5 h-5 text-blue-600" />
          <span>Shopping Cart ({cartCount} {cartCount === 1 ? 'item' : 'items'})</span>
        </h3>
      </div>

      {/* Cart Items List */}
      <div className="max-h-96 overflow-y-auto">
        {cartItems.map((item) => (
          <Link
            key={item.product_id}
            to={`/product/${item.product_id}`}
            className="flex gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition"
          >
            {/* Product Image */}
            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
              {item.images && item.images[0] ? (
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No image
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1">
                {item.name}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Qty: {item.quantity}
                </span>
                <span className="font-bold text-blue-600 text-sm">
                  ${((parseFloat(item.price) * item.quantity) / 100).toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer with Total and Actions */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-700">Subtotal:</span>
          <span className="font-bold text-xl text-blue-600">
            ${(total / 100).toLocaleString()}
          </span>
        </div>

        <div className="flex gap-2">
          <Link
            to="/cart"
            className="flex-1 py-2.5 text-center bg-white border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            View Cart
          </Link>
          <Link
            to="/checkout"
            className="flex-1 py-2.5 text-center bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-md hover:shadow-lg"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
