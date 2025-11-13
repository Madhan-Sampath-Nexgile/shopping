import { useParams, Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import api from '../services/api'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useToast } from '../contexts/ToastContext'

export default function Category(){
  const { name } = useParams()
  const navigate = useNavigate()
  const { token } = useSelector((state) => state.user)
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { showError } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get('/products?category='+encodeURIComponent(name))
        setItems(Array.isArray(data) ? data : data.items || [])
      } catch (err) {
        console.error('Error fetching category products:', err)
        setError('Failed to load products')
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [name])

  const handleAddToCart = async (productId, e) => {
    e.preventDefault()
    e.stopPropagation()

    // Just add to cart silently - no toasts
    await addToCart(productId, 1)
  }

  const handleToggleWishlist = async (productId, e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!token) {
      showError('Please login to add to wishlist')
      navigate('/login')
      return
    }

    // Toggle wishlist silently - no toasts
    await toggleWishlist(productId)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">{name}</h2>

      {loading ? (
        <p>Loading products...</p>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-600">No products found in this category</p>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map(p => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition group relative"
            >
              {/* Wishlist Button */}
              <button
                onClick={(e) => handleToggleWishlist(p.id, e)}
                className={`absolute top-1.5 right-1.5 z-10 rounded-full p-1.5 shadow-sm transition opacity-0 group-hover:opacity-100 ${
                  isInWishlist(p.id)
                    ? 'bg-red-50 hover:bg-red-100 text-red-500'
                    : 'bg-white hover:bg-gray-100 text-gray-600'
                }`}
                title={isInWishlist(p.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                {isInWishlist(p.id) ? (
                  <HeartSolid className="w-4 h-4" />
                ) : (
                  <HeartOutline className="w-4 h-4" />
                )}
              </button>

              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={p.images?.[0] || '/placeholder.png'}
                  alt={p.name}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-2.5">
                <h3 className="font-medium text-sm text-gray-800 mb-1 line-clamp-2 leading-tight">
                  {p.name}
                </h3>
                <p className="text-xs text-gray-500 mb-1.5">{p.category}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-blue-600">
                    ${(p.price / 100).toLocaleString()}
                  </span>
                  {p.stock > 0 ? (
                    <span className="text-xs text-green-600 font-medium">In Stock</span>
                  ) : (
                    <span className="text-xs text-red-600 font-medium">Out</span>
                  )}
                </div>
                <button
                  onClick={(e) => handleAddToCart(p.id, e)}
                  disabled={p.stock === 0}
                  className={`w-full py-1.5 rounded text-xs font-medium transition ${
                    p.stock > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {p.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
