import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  HeartIcon as HeartOutline,
  SparklesIcon,
  ShareIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid, StarIcon } from "@heroicons/react/24/solid";
import api from "../services/api";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useToast } from "../contexts/ToastContext";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.user);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showSuccess, showError } = useToast();

  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingQA, setLoadingQA] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Enhanced states
  const [selectedImage, setSelectedImage] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);

  // Review form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // AI review summary
  const [reviewSummary, setReviewSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`/products/${id}`);
      setP(data);
      setSelectedImage(0);
    } catch (err) {
      console.error(err);
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewSummary = async () => {
    if (!p || !p.reviews || p.reviews.length < 3) return;

    setLoadingSummary(true);
    try {
      const response = await fetch('http://localhost:8000/summarize-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName: p.name,
          reviews: p.reviews
        })
      });

      const data = await response.json();
      if (data.summary) {
        setReviewSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch review summary:', err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (p && p.reviews && p.reviews.length >= 3) {
      fetchReviewSummary();
    }
  }, [p]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoadingQA(true);
    setAnswer("");
    try {
      const { data } = await api.post(`/products/${id}/qa`, { question });

      // Parse the answer if it's a JSON string with error
      if (typeof data.answer === 'string' && data.answer.includes('AuthenticationError')) {
        setAnswer("⚠️ AI service is not configured. Please contact the administrator to set up the OpenAI API key.");
      } else if (typeof data.answer === 'string' && data.answer.includes('error')) {
        // Try to parse JSON error
        try {
          const errorObj = JSON.parse(data.answer);
          if (errorObj.error) {
            setAnswer(`⚠️ ${errorObj.error}`);
          } else {
            setAnswer(data.answer);
          }
        } catch {
          setAnswer(data.answer);
        }
      } else {
        setAnswer(data.answer);
      }
      setQuestion("");
    } catch (err) {
      console.error('Q&A Error:', err);

      // Provide specific error messages
      if (err.response?.status === 503) {
        setAnswer("⚠️ AI service is currently unavailable. Please try again later.");
      } else if (err.response?.data?.error) {
        setAnswer(`⚠️ ${err.response.data.error}`);
      } else if (err.message?.includes('Network Error')) {
        setAnswer("⚠️ Unable to connect to AI service. Please check if the service is running.");
      } else {
        setAnswer("⚠️ AI could not answer this question. Please try again or rephrase your question.");
      }
    } finally {
      setLoadingQA(false);
    }
  };

  const handleAddToCart = async () => {
    if (!token) {
      showError("Please login to add items to cart");
      navigate("/login");
      return;
    }

    if (!p || p.stock === 0) {
      showError("Product is out of stock");
      return;
    }

    if (quantity > p.stock) {
      showError(`Only ${p.stock} items available in stock`);
      return;
    }

    setAddingToCart(true);
    const result = await addToCart(id, quantity);
    setAddingToCart(false);

    if (result.success) {
      showSuccess(`Added ${quantity} ${quantity === 1 ? 'item' : 'items'} to cart!`);
      setQuantity(1);
    } else {
      showError(result.error || "Failed to add to cart");
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    if (p && quantity < p.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: p.name,
        text: p.description,
        url: window.location.href
      }).catch(() => setShowShareMenu(!showShareMenu));
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    showSuccess("Link copied to clipboard!");
    setShowShareMenu(false);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!token) {
      showError("Please login to write a review");
      navigate("/login");
      return;
    }

    if (reviewComment.trim().length < 10) {
      showError("Review must be at least 10 characters");
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`/products/${id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim()
      });

      showSuccess("Review submitted successfully!");
      setShowReviewForm(false);
      setReviewComment("");
      setReviewRating(5);

      // Refresh product to show new review
      fetchProduct();
    } catch (err) {
      showError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getRatingDistribution = () => {
    if (!p?.reviews || p.reviews.length === 0) return null;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    p.reviews.forEach(r => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    const total = p.reviews.length;
    const avgRating = (p.reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1);

    return { distribution, total, avgRating };
  };

  const filteredReviews = p?.reviews?.filter(r => {
    if (reviewFilter === "all") return true;
    return r.rating === parseInt(reviewFilter);
  }) || [];

  // Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-2xl"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-12 bg-gray-200 rounded w-1/3"></div>
              <div className="h-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <p className="text-red-600 text-lg font-semibold mb-4">{error}</p>
          <button
            onClick={() => navigate("/search")}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  if (!p) return null;

  const priceInRupees = (p.price / 100).toLocaleString();
  const isOutOfStock = p.stock === 0 || p.stock_status?.includes("Out");
  const ratingData = getRatingDistribution();
  const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-blue-600 transition">Home</Link>
        <ChevronRightIcon className="w-4 h-4" />
        <Link to="/search" className="hover:text-blue-600 transition">Products</Link>
        <ChevronRightIcon className="w-4 h-4" />
        <Link to={`/category/${encodeURIComponent(p.category)}`} className="hover:text-blue-600 transition">
          {p.category}
        </Link>
        <ChevronRightIcon className="w-4 h-4" />
        <span className="text-gray-800 font-medium truncate">{p.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative bg-white rounded-2xl overflow-hidden border-2 border-gray-200 group">
            {p.images && p.images.length > 0 ? (
              <>
                <div
                  className="aspect-square relative overflow-hidden cursor-zoom-in"
                  onClick={() => setShowImageModal(true)}
                  onMouseEnter={() => setImageZoom(true)}
                  onMouseLeave={() => setImageZoom(false)}
                >
                  <img
                    src={p.images[selectedImage]}
                    alt={p.name}
                    className={`w-full h-full object-contain transition-transform duration-300 ${
                      imageZoom ? 'scale-110' : 'scale-100'
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                    <MagnifyingGlassIcon className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Wishlist Badge */}
                <button
                  onClick={async () => {
                    if (!token) {
                      showError("Please login to add to wishlist");
                      navigate("/login");
                      return;
                    }
                    const wasInWishlist = isInWishlist(id);
                    const result = await toggleWishlist(id);

                    if (result.success) {
                      if (wasInWishlist) {
                        showSuccess("Removed from wishlist");
                      } else {
                        showSuccess("Added to wishlist");
                      }
                    } else {
                      showError(result.error || "Failed to update wishlist");
                    }
                  }}
                  className={`absolute top-4 right-4 p-3 rounded-full shadow-lg backdrop-blur-sm transition-all ${
                    isInWishlist(id)
                      ? "bg-red-500 text-white"
                      : "bg-white/90 text-gray-700 hover:bg-red-50"
                  }`}
                >
                  {isInWishlist(id) ? (
                    <HeartSolid className="w-6 h-6" />
                  ) : (
                    <HeartOutline className="w-6 h-6" />
                  )}
                </button>

                {/* Stock Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                    isOutOfStock
                      ? "bg-red-500 text-white"
                      : p.stock < 10
                      ? "bg-orange-500 text-white"
                      : "bg-green-500 text-white"
                  }`}>
                    {isOutOfStock ? "Out of Stock" : p.stock < 10 ? `Only ${p.stock} Left` : "In Stock"}
                  </span>
                </div>
              </>
            ) : (
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400 text-lg">No image available</span>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {p.images && p.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {p.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-all ${
                    selectedImage === i
                      ? "border-blue-600 ring-2 ring-blue-200 scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${p.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-4">
          {/* Category Badge */}
          <Link
            to={`/category/${encodeURIComponent(p.category)}`}
            className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full hover:bg-blue-100 transition"
          >
            {p.category}
          </Link>

          {/* Product Title */}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              {p.name}
            </h1>

            {/* Rating Summary */}
            {ratingData && (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(ratingData.avgRating)
                          ? "text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-700">
                  {ratingData.avgRating}
                </span>
                <span className="text-sm text-gray-500">
                  ({ratingData.total} {ratingData.total === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl font-bold text-blue-600">${priceInRupees}</span>
              <span className="text-base text-gray-500 line-through">${((p.price * 1.2) / 100).toLocaleString()}</span>
              <span className="text-base font-semibold text-green-600">17% off</span>
            </div>
            <p className="text-xs text-gray-600 mt-1.5">Inclusive of all taxes</p>
          </div>

          {/* Key Highlights */}
          {p.ai_summary && (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-start gap-2.5">
                <SparklesIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-purple-900 mb-1.5 text-sm">AI Product Summary</h3>
                  <p className="text-gray-700 text-xs leading-relaxed">{p.ai_summary}</p>
                </div>
              </div>
            </div>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center text-center p-2.5 bg-gray-50 rounded-lg">
              <TruckIcon className="w-6 h-6 text-blue-600 mb-1.5" />
              <span className="text-xs font-medium text-gray-700">Free Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 bg-gray-50 rounded-lg">
              <ArrowPathIcon className="w-6 h-6 text-green-600 mb-1.5" />
              <span className="text-xs font-medium text-gray-700">7 Day Return</span>
            </div>
            <div className="flex flex-col items-center text-center p-2.5 bg-gray-50 rounded-lg">
              <ShieldCheckIcon className="w-6 h-6 text-purple-600 mb-1.5" />
              <span className="text-xs font-medium text-gray-700">Warranty</span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2.5">
              <ClockIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900 text-sm mb-0.5">
                  Get it by {deliveryDate}
                </p>
                <p className="text-xs text-green-700">
                  Free delivery on orders above $49
                </p>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="flex items-center gap-3">
              <label className="font-medium text-gray-700">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                  className="px-3 py-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold transition"
                >
                  −
                </button>
                <span className="px-4 py-1.5 font-semibold text-base min-w-[50px] text-center bg-gray-50 border-x border-gray-300">
                  {quantity}
                </span>
                <button
                  onClick={increaseQuantity}
                  disabled={quantity >= p.stock}
                  className="px-3 py-1.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold transition"
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">
                {p.stock} available
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              className={`flex-1 py-3 rounded-lg font-semibold text-base transition-all duration-200 ${
                isOutOfStock
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : addingToCart
                  ? "bg-blue-400 text-white cursor-wait"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
              }`}
            >
              {addingToCart ? "Adding..." : isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </button>

            {!isOutOfStock && (
              <button
                onClick={async () => {
                  await handleAddToCart();
                  if (token) {
                    navigate("/cart");
                  }
                }}
                disabled={addingToCart}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold text-base hover:from-orange-600 hover:to-red-600 transition shadow-md hover:shadow-lg disabled:opacity-50"
              >
                Buy Now
              </button>
            )}
          </div>

          {/* Share Button */}
          <div className="relative">
            <button
              onClick={handleShare}
              className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
            >
              <ShareIcon className="w-4 h-4" />
              Share Product
            </button>

            {showShareMenu && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                <button
                  onClick={copyToClipboard}
                  className="w-full py-2 text-left px-3 hover:bg-gray-100 rounded-md transition text-sm"
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabbed Content Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Tab Headers */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: "description", label: "Description" },
            { id: "specifications", label: "Specifications" },
            { id: "reviews", label: `Reviews (${ratingData?.total || 0})` },
            { id: "qa", label: "Q&A" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-medium text-sm transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* Description Tab */}
          {activeTab === "description" && (
            <div className="prose max-w-none">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h3>
              <p className="text-gray-700 leading-relaxed text-lg mb-6">{p.description}</p>

              {p.specifications && Object.keys(p.specifications).length > 0 && (
                <>
                  <h4 className="text-xl font-bold text-gray-900 mb-3 mt-8">Key Features</h4>
                  <ul className="space-y-2">
                    {Object.entries(p.specifications).slice(0, 5).map(([key, val]) => (
                      <li key={key} className="flex items-start gap-2 text-gray-700">
                        <CheckBadgeIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span><strong>{key}:</strong> {val}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Specifications Tab */}
          {activeTab === "specifications" && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Technical Specifications</h3>
              {p.specifications && Object.keys(p.specifications).length > 0 ? (
                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                  {Object.entries(p.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-3 border-b border-gray-200">
                      <span className="font-semibold text-gray-700">{key}</span>
                      <span className="text-gray-600">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">No specifications available</p>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h3>

              {ratingData ? (
                <>
                  {/* Rating Summary */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 mb-8 border border-yellow-200">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-6xl font-bold text-gray-900 mb-2">
                          {ratingData.avgRating}
                        </div>
                        <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-6 h-6 ${
                                i < Math.round(ratingData.avgRating)
                                  ? "text-yellow-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-600">
                          Based on {ratingData.total} {ratingData.total === 1 ? 'review' : 'reviews'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map(rating => {
                          const count = ratingData.distribution[rating];
                          const percentage = Math.round((count / ratingData.total) * 100);
                          return (
                            <div key={rating} className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-700 w-12">
                                {rating} <StarIcon className="w-3 h-3 inline text-yellow-500" />
                              </span>
                              <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12 text-right">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* AI Review Summary */}
                  {(reviewSummary || loadingSummary) && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border border-purple-200">
                      <div className="flex items-start gap-3">
                        <SparklesIcon className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                            AI Review Summary
                          </h4>
                          {loadingSummary ? (
                            <div className="flex items-center gap-2 text-purple-700">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                              <span className="text-sm">Generating summary...</span>
                            </div>
                          ) : (
                            <>
                              <p className="text-gray-700 leading-relaxed mb-2">{reviewSummary}</p>
                              <p className="text-xs text-purple-600">
                                Based on {p.reviews.length} customer {p.reviews.length === 1 ? 'review' : 'reviews'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Write Review Button */}
                  <div className="mb-6">
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      {showReviewForm ? "Cancel" : "Write a Review"}
                    </button>
                  </div>

                  {/* Review Form */}
                  {showReviewForm && (
                    <form onSubmit={handleSubmitReview} className="bg-blue-50 rounded-xl p-6 mb-8 border border-blue-200">
                      <h4 className="font-bold text-gray-900 mb-4">Share Your Experience</h4>

                      {/* Rating Selector */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Rating
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none"
                            >
                              <StarIcon
                                className={`w-8 h-8 ${
                                  star <= reviewRating ? "text-yellow-500" : "text-gray-300"
                                } cursor-pointer hover:scale-110 transition`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Comment Input */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Your Review (minimum 10 characters)
                        </label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          rows={5}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Share your thoughts about this product..."
                          required
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={submittingReview || reviewComment.length < 10}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  )}

                  {/* Review Filter */}
                  <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <span className="font-medium text-gray-700 text-sm">Filter:</span>
                    {["all", "5", "4", "3", "2", "1"].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setReviewFilter(filter)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                          reviewFilter === filter
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {filter === "all" ? "All" : `${filter} Stars`}
                      </button>
                    ))}
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-6">
                    {filteredReviews.length > 0 ? (
                      filteredReviews.map((r) => (
                        <div
                          key={r.id}
                          className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-bold text-gray-900 text-lg">
                                  {r.reviewer || "Anonymous"}
                                </p>
                                {r.verified_purchase && (
                                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                                    <CheckBadgeIcon className="w-3 h-3" />
                                    Verified Purchase
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <StarIcon
                                    key={i}
                                    className={`w-5 h-5 ${
                                      i < r.rating ? "text-yellow-500" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(r.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                          <p className="text-gray-700 leading-relaxed">{r.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-12">
                        No reviews match your filter
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-lg mb-4">No reviews yet</p>
                  <p className="text-gray-400">Be the first to review this product!</p>
                </div>
              )}
            </div>
          )}

          {/* Q&A Tab */}
          {activeTab === "qa" && (
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Questions & Answers</h3>

              {/* Ask Question Form */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-8 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <SparklesIcon className="w-5 h-5 text-blue-600" />
                  Ask AI a Question
                </h4>
                <form onSubmit={handleAsk} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask anything about this product..."
                    className="flex-1 px-4 py-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={loadingQA}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:bg-blue-400 transition"
                  >
                    {loadingQA ? "Asking..." : "Ask AI"}
                  </button>
                </form>

                {answer && (
                  <div className={`mt-4 rounded-lg p-5 border-2 ${
                    answer.startsWith('⚠️')
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-white border-green-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <SparklesIcon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                        answer.startsWith('⚠️') ? 'text-yellow-600' : 'text-green-600'
                      }`} />
                      <div>
                        <p className={`font-bold mb-2 ${
                          answer.startsWith('⚠️') ? 'text-yellow-900' : 'text-green-900'
                        }`}>
                          {answer.startsWith('⚠️') ? 'Notice:' : 'AI Answer:'}
                        </p>
                        <p className="text-gray-800 leading-relaxed">{answer}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Q&A */}
              {p.qa && p.qa.length > 0 ? (
                <div className="space-y-4">
                  {p.qa.map((q) => (
                    <div key={q.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <p className="font-bold text-gray-900 mb-3 text-lg">
                        Q: {q.question}
                      </p>
                      <div className="pl-4 border-l-4 border-blue-500">
                        <p className="text-gray-700 leading-relaxed">
                          A: {q.answer || "No answer yet"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-12">
                  No questions yet. Be the first to ask!
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {p.related && p.related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {p.related.map((rp) => (
              <Link
                key={rp.id}
                to={`/product/${rp.id}`}
                className="group bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-2xl hover:border-blue-300 transition-all duration-300 hover:scale-105"
              >
                <div className="aspect-square overflow-hidden bg-gray-50">
                  {rp.images && rp.images[0] ? (
                    <img
                      src={rp.images[0]}
                      alt={rp.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100"></div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-600 transition">
                    {rp.name}
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    ${(rp.price / 100).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && p.images && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <img
            src={p.images[selectedImage]}
            alt={p.name}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
