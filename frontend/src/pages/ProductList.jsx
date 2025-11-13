import { useEffect, useState, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { HeartIcon as HeartOutline, MagnifyingGlassIcon, ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import api from "../services/api";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useToast } from "../contexts/ToastContext";

export default function ProductList() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showSuccess, showError } = useToast();

  const q = new URLSearchParams(loc.search).get("q");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [compareList, setCompareList] = useState([]);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        q,
        minPrice: priceRange[0] * 100,
        maxPrice: priceRange[1] * 100,
        rating: minRating,
        inStock: inStockOnly ? "true" : undefined,
        sort: sortBy,
      };
      const { data } = await api.get("/products", { params });
      setItems(data.items || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, priceRange, minRating, inStockOnly, sortBy]);

  // Load compare list from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('compare') || '[]')
    setCompareList(stored)
  }, [])

  const isInCompare = (productId) => {
    return compareList.includes(productId)
  }

  const toggleCompare = (productId, e) => {
    e.preventDefault()
    e.stopPropagation()

    let updated
    if (isInCompare(productId)) {
      updated = compareList.filter(id => id !== productId)
      showSuccess('Removed from comparison')
    } else {
      if (compareList.length >= 4) {
        showError('You can compare maximum 4 products')
        return
      }
      updated = [...compareList, productId]
      showSuccess('Added to comparison')
    }

    setCompareList(updated)
    localStorage.setItem('compare', JSON.stringify(updated))
  }

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    // Just add to cart silently - no toasts
    await addToCart(productId, 1);
  };

  const handleToggleWishlist = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      showError("Please login to add to wishlist");
      navigate("/login");
      return;
    }

    const wasInWishlist = isInWishlist(productId);
    const result = await toggleWishlist(productId);

    if (result.success) {
      if (wasInWishlist) {
        showSuccess("Removed from wishlist");
      } else {
        showSuccess("Added to wishlist");
      }
    } else {
      showError(result.error || "Failed to update wishlist");
    }
  };

  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy("newest");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          {q ? `Search Results for "${q}"` : "All Products"}
        </h1>
      </div>

      {/* Horizontal Filters Bar */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Price Range */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([priceRange[0], parseInt(e.target.value)])
              }
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>${priceRange[0].toLocaleString()}</span>
              <span>${priceRange[1].toLocaleString()}</span>
            </div>
          </div>

          {/* Minimum Rating */}
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Rating
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="0">All</option>
              <option value="1">1★ & above</option>
              <option value="2">2★ & above</option>
              <option value="3">3★ & above</option>
              <option value="4">4★ & above</option>
              <option value="5">5★ only</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {/* In Stock Only */}
          <div className="flex items-end pb-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                In Stock Only
              </span>
            </label>
          </div>

          {/* Reset Button */}
          <div className="flex items-end pb-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {loading ? (
            "Loading..."
          ) : (
            <>
              Showing {items.length} product{items.length !== 1 ? "s" : ""}
            </>
          )}
        </p>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === "grid"
                ? "bg-white shadow text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === "list"
                ? "bg-white shadow text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div
          className={`grid ${
            viewMode === "grid"
              ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              : "grid-cols-1"
          } gap-4`}
        >
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-lg animate-pulse"
              style={{ height: viewMode === "grid" ? "240px" : "132px" }}
            ></div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <div className="flex justify-center mb-4">
            <MagnifyingGlassIcon className="w-24 h-24 text-gray-300" strokeWidth={1} />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No products found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your filters or search query
          </p>
          <button
            onClick={resetFilters}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Clear Filters
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition group relative"
            >
              {/* Wishlist Button */}
              <button
                onClick={(e) => handleToggleWishlist(product.id, e)}
                className={`absolute top-1.5 right-1.5 z-10 rounded-full p-1.5 shadow-sm transition opacity-0 group-hover:opacity-100 ${
                  isInWishlist(product.id)
                    ? "bg-red-50 hover:bg-red-100 text-red-500"
                    : "bg-white hover:bg-gray-100 text-gray-600"
                }`}
                title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              >
                {isInWishlist(product.id) ? (
                  <HeartSolid className="w-4 h-4" />
                ) : (
                  <HeartOutline className="w-4 h-4" />
                )}
              </button>

              {/* Compare Button */}
              <button
                onClick={(e) => toggleCompare(product.id, e)}
                className={`absolute top-1.5 left-1.5 z-10 rounded-full p-1.5 shadow-sm transition opacity-0 group-hover:opacity-100 ${
                  isInCompare(product.id)
                    ? "bg-blue-50 hover:bg-blue-100 text-blue-600"
                    : "bg-white hover:bg-gray-100 text-gray-600"
                }`}
                title={isInCompare(product.id) ? "Remove from comparison" : "Add to comparison"}
              >
                <ArrowsRightLeftIcon className="w-4 h-4" />
              </button>

              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.images?.[0] || "/placeholder.png"}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-2.5">
                <h3 className="font-medium text-sm text-gray-800 mb-1 line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-1.5">
                  {product.category}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-blue-600">
                    ${(product.price / 100).toLocaleString()}
                  </span>
                  {product.stock > 0 ? (
                    <span className="text-xs text-green-600 font-medium">
                      In Stock
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 font-medium">
                      Out
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => handleAddToCart(product.id, e)}
                  disabled={product.stock === 0}
                  className={`w-full py-1.5 rounded text-xs font-medium transition ${
                    product.stock > 0
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {items.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition flex group"
            >
              <div className="w-32 h-32 flex-shrink-0 bg-gray-100">
                <img
                  src={product.images?.[0] || "/placeholder.png"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-gray-800 mb-0.5 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {product.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs line-clamp-2 mb-2">
                    {product.description}
                  </p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600 block">
                      ${(product.price / 100).toLocaleString()}
                    </span>
                    {product.stock > 0 ? (
                      <span className="text-xs text-green-600 font-medium">
                        In Stock
                      </span>
                    ) : (
                      <span className="text-xs text-red-600 font-medium">
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => handleAddToCart(product.id, e)}
                      disabled={product.stock === 0}
                      className={`px-4 py-1.5 rounded text-sm font-medium transition whitespace-nowrap ${
                        product.stock > 0
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                    </button>
                    <button
                      onClick={(e) => handleToggleWishlist(product.id, e)}
                      className={`rounded px-4 py-1.5 transition text-sm flex items-center gap-1.5 ${
                        isInWishlist(product.id)
                          ? "bg-red-100 hover:bg-red-200 text-red-700"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                      title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      {isInWishlist(product.id) ? (
                        <>
                          <HeartSolid className="w-4 h-4" />
                          <span>In Wishlist</span>
                        </>
                      ) : (
                        <>
                          <HeartOutline className="w-4 h-4" />
                          <span>Wishlist</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => toggleCompare(product.id, e)}
                      className={`rounded px-4 py-1.5 transition text-sm flex items-center gap-1.5 ${
                        isInCompare(product.id)
                          ? "bg-blue-100 hover:bg-blue-200 text-blue-700"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                      title={isInCompare(product.id) ? "Remove from comparison" : "Add to comparison"}
                    >
                      <ArrowsRightLeftIcon className="w-4 h-4" />
                      <span>{isInCompare(product.id) ? "In Compare" : "Compare"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Floating Compare Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-blue-600 text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-4">
            <ArrowsRightLeftIcon className="w-5 h-5" />
            <span className="font-medium">
              {compareList.length} product{compareList.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => navigate('/compare')}
              className="bg-white text-blue-600 px-4 py-1.5 rounded-full font-semibold hover:bg-gray-100 transition"
            >
              Compare Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
