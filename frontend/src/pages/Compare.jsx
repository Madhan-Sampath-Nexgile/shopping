import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import api from '../services/api'

export default function Compare() {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { showSuccess } = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompareProducts()
  }, [])

  const loadCompareProducts = async () => {
    const compareIds = JSON.parse(localStorage.getItem('compare') || '[]')

    if (compareIds.length === 0) {
      setLoading(false)
      return
    }

    try {
      // Fetch full product details for each ID
      const promises = compareIds.map(id => api.get(`/products/${id}`))
      const responses = await Promise.all(promises)
      setProducts(responses.map(r => r.data))
    } catch (err) {
      console.error('Failed to load compare products:', err)
    } finally {
      setLoading(false)
    }
  }

  const removeFromCompare = (productId) => {
    const compareIds = JSON.parse(localStorage.getItem('compare') || '[]')
    const updated = compareIds.filter(id => id !== productId)
    localStorage.setItem('compare', JSON.stringify(updated))
    setProducts(products.filter(p => p.id !== productId))
  }

  const handleAddToCart = async (productId) => {
    await addToCart(productId, 1)
    showSuccess('Added to cart')
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading comparison...</div>
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-gray-50 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">No Products to Compare</h2>
        <p className="text-gray-600 mb-6">
          Start adding products to compare their features side by side
        </p>
        <Link
          to="/search"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Browse Products
        </Link>
      </div>
    )
  }

  // Extract all unique specification keys
  const allSpecKeys = new Set()
  products.forEach(p => {
    if (p.specifications && typeof p.specifications === 'object') {
      Object.keys(p.specifications).forEach(key => allSpecKeys.add(key))
    }
  })
  const specKeys = Array.from(allSpecKeys)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          Product Comparison ({products.length})
        </h1>
        <button
          onClick={() => navigate('/search')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Add More Products
        </button>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="sticky left-0 bg-gray-50 text-left py-4 px-4 font-semibold text-gray-700 w-48">
                Feature
              </th>
              {products.map((product) => (
                <th key={product.id} className="bg-gray-50 py-4 px-4 min-w-[250px]">
                  <div className="relative">
                    <button
                      onClick={() => removeFromCompare(product.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      title="Remove from comparison"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Product Images */}
            <tr className="border-b border-gray-100">
              <td className="sticky left-0 bg-white py-4 px-4 font-medium text-gray-700">
                Image
              </td>
              {products.map((product) => (
                <td key={product.id} className="py-4 px-4">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={product.images?.[0] || '/placeholder.png'}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg hover:opacity-90 transition"
                    />
                  </Link>
                </td>
              ))}
            </tr>

            {/* Product Names */}
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="sticky left-0 bg-gray-50 py-4 px-4 font-medium text-gray-700">
                Name
              </td>
              {products.map((product) => (
                <td key={product.id} className="py-4 px-4">
                  <Link
                    to={`/product/${product.id}`}
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {product.name}
                  </Link>
                </td>
              ))}
            </tr>

            {/* Category */}
            <tr className="border-b border-gray-100">
              <td className="sticky left-0 bg-white py-4 px-4 font-medium text-gray-700">
                Category
              </td>
              {products.map((product) => (
                <td key={product.id} className="py-4 px-4 text-gray-600">
                  {product.category}
                </td>
              ))}
            </tr>

            {/* Price */}
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="sticky left-0 bg-gray-50 py-4 px-4 font-medium text-gray-700">
                Price
              </td>
              {products.map((product) => (
                <td key={product.id} className="py-4 px-4">
                  <span className="text-xl font-bold text-blue-600">
                    ${product.price}
                  </span>
                </td>
              ))}
            </tr>

            {/* Stock Status */}
            <tr className="border-b border-gray-100">
              <td className="sticky left-0 bg-white py-4 px-4 font-medium text-gray-700">
                Availability
              </td>
              {products.map((product) => (
                <td key={product.id} className="py-4 px-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      product.stock > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.stock_status || (product.stock > 0 ? 'In Stock' : 'Out of Stock')}
                  </span>
                </td>
              ))}
            </tr>

            {/* Average Rating */}
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="sticky left-0 bg-gray-50 py-4 px-4 font-medium text-gray-700">
                Rating
              </td>
              {products.map((product) => (
                <td key={product.id} className="py-4 px-4">
                  {product.average_rating > 0 ? (
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500 text-lg">★</span>
                      <span className="font-semibold">{product.average_rating.toFixed(1)}</span>
                      <span className="text-gray-500 text-sm">
                        ({product.reviews?.length || 0} reviews)
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No reviews</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Description */}
            <tr className="border-b border-gray-100">
              <td className="sticky left-0 bg-white py-4 px-4 font-medium text-gray-700">
                Description
              </td>
              {products.map((product) => (
                <td key={product.id} className="py-4 px-4 text-gray-600 text-sm">
                  {product.description || 'No description available'}
                </td>
              ))}
            </tr>

            {/* Specifications */}
            {specKeys.length > 0 && (
              <>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <td
                    colSpan={products.length + 1}
                    className="py-3 px-4 font-bold text-gray-800 text-center"
                  >
                    Specifications
                  </td>
                </tr>
                {specKeys.map((key, index) => (
                  <tr
                    key={key}
                    className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}
                  >
                    <td className="sticky left-0 bg-inherit py-4 px-4 font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </td>
                    {products.map((product) => (
                      <td key={product.id} className="py-4 px-4 text-gray-600">
                        {product.specifications?.[key] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}

            {/* Action Buttons */}
            <tr className="bg-gray-50">
              <td className="sticky left-0 bg-gray-50 py-4 px-4 font-medium text-gray-700">
                Actions
              </td>
              {products.map((product) => (
                <td key={product.id} className="py-4 px-4">
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock === 0}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition ${
                      product.stock > 0
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCartIcon className="w-5 h-5" />
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Clear All Button */}
      <div className="text-center">
        <button
          onClick={() => {
            localStorage.removeItem('compare')
            setProducts([])
          }}
          className="text-red-600 hover:text-red-700 font-medium"
        >
          Clear All Comparisons
        </button>
      </div>
    </div>
  )
}
