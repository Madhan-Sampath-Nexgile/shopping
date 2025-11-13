import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../services/api'
import { ClockIcon } from '@heroicons/react/24/outline'

export default function RecentlyViewed() {
  const { token } = useSelector((state) => state.user)
  const [recentProducts, setRecentProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchRecentlyViewed()
    } else {
      setLoading(false)
    }
  }, [token])

  const fetchRecentlyViewed = async () => {
    try {
      const { data } = await api.get('/products/recently-viewed')
      setRecentProducts(data.products || [])
    } catch (err) {
      console.error('Failed to fetch recently viewed:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!token || loading || recentProducts.length === 0) {
    return null
  }

  return (
    <div className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <ClockIcon className="w-6 h-6 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-800">Recently Viewed</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {recentProducts.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition group"
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.images?.[0] || '/placeholder.png'}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm text-gray-800 mb-1 line-clamp-2 leading-tight">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-1.5">{product.category}</p>
                <div className="text-sm font-bold text-blue-600">
                  ${product.price}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
