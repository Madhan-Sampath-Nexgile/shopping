import { Link } from "react-router-dom";
import { XMarkIcon, HeartIcon } from "@heroicons/react/24/outline";
import { useWishlist } from "../contexts/WishlistContext";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist, loading: wishlistLoading } = useWishlist();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();

  const handleRemove = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await removeFromWishlist(productId);

    if (result.success) {
      showSuccess('Removed from wishlist');
    } else {
      showError(result.error || 'Failed to remove from wishlist');
    }
  };

  const handleMoveToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    // Add to cart
    const cartResult = await addToCart(productId, 1);

    // If successful, remove from wishlist
    if (cartResult.success) {
      const wishlistResult = await removeFromWishlist(productId);
      if (wishlistResult.success) {
        showSuccess('Moved to cart');
      }
    } else {
      showError(cartResult.error || 'Failed to add to cart');
    }
  };

  if (wishlistLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Loading wishlist...</p>
      </div>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <div className="flex justify-center mb-4">
          <HeartIcon className="w-24 h-24 text-gray-300" strokeWidth={1} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Your wishlist is empty
        </h3>
        <p className="text-gray-600 mb-6">
          Save items you love for later
        </p>
        <Link
          to="/search"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        My Wishlist ({wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {wishlistItems.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition group relative bg-white"
          >
            {/* Remove Button */}
            <button
              onClick={(e) => handleRemove(item.id, e)}
              className="absolute top-2 right-2 z-10 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition opacity-0 group-hover:opacity-100 text-red-500"
              title="Remove from wishlist"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <Link to={`/product/${item.id}`} className="block">
              {/* Product Image */}
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={item.images?.[0] || "/placeholder.png"}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>

              {/* Product Info */}
              <div className="p-3">
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 leading-tight">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-blue-600">
                    ${(item.price / 100).toLocaleString()}
                  </span>
                  {item.stock > 0 ? (
                    <span className="text-xs text-green-600 font-medium">In Stock</span>
                  ) : (
                    <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                  )}
                </div>

                {/* Move to Cart Button */}
                <button
                  onClick={(e) => handleMoveToCart(item.id, e)}
                  disabled={item.stock === 0}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition ${
                    item.stock > 0
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {item.stock > 0 ? "Move to Cart" : "Out of Stock"}
                </button>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
