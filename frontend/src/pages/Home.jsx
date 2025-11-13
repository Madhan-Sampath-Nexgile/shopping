import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SparklesIcon, ChatBubbleLeftRightIcon, BoltIcon } from '@heroicons/react/24/outline'
import { MdDevices, MdCheckroom, MdCottage, MdMenuBook, MdSportsSoccer, MdSpa, MdInventory, MdGpsFixed } from 'react-icons/md'
import api from '../services/api'
import SmartSearch from '../components/ai/SmartSearch.jsx'
import QABot from '../components/ai/QABot.jsx'
import RecentlyViewed from '../components/RecentlyViewed.jsx'

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products?sort=newest&limit=8'),
        api.get('/products/categories')
      ])

      setFeaturedProducts(Array.isArray(productsRes.data) ? productsRes.data.slice(0, 8) : [])
      setCategories(categoriesRes.data.categories || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setFeaturedProducts([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const categoryIcons = {
    'Electronics': <MdDevices className="w-10 h-10" />,
    'Fashion': <MdCheckroom className="w-10 h-10" />,
    'Home & Garden': <MdCottage className="w-10 h-10" />,
    'Books': <MdMenuBook className="w-10 h-10" />,
    'Sports': <MdSportsSoccer className="w-10 h-10" />,
    'Beauty': <MdSpa className="w-10 h-10" />,
  }

  const categoryColors = {
    'Electronics': 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
    'Fashion': 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700',
    'Home & Garden': 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
    'Books': 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700',
    'Sports': 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700',
    'Beauty': 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
  }

  const features = [
    {
      icon: <SparklesIcon className="w-10 h-10" />,
      title: 'AI-Powered Search',
      description: 'Find exactly what you need with our intelligent search system'
    },
    {
      icon: <MdGpsFixed className="w-10 h-10" />,
      title: 'Personalized Recommendations',
      description: 'Get product suggestions tailored specifically for you'
    },
    {
      icon: <ChatBubbleLeftRightIcon className="w-10 h-10" />,
      title: 'Smart Q&A',
      description: 'Ask questions and get instant answers about any product'
    },
    {
      icon: <BoltIcon className="w-10 h-10" />,
      title: 'Fast Delivery',
      description: 'Quick and reliable shipping right to your doorstep'
    }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative px-8 py-16 md:py-24 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
            Welcome to SmartShop AI
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Experience the Future of Online Shopping with Artificial Intelligence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/search"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              Start Shopping
            </Link>
            <Link
              to="/category/Electronics"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition"
            >
              Browse Categories
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Why Choose SmartShop AI?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-xl transition transform hover:-translate-y-1"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/category/${encodeURIComponent(cat)}`}
              className={`${categoryColors[cat] || 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'} border-2 rounded-xl p-6 text-center hover:scale-105 transition transform shadow-sm`}
            >
              <div className="mb-2">{categoryIcons[cat] || <MdInventory className="w-10 h-10" />}</div>
              <div className="font-semibold">{cat}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Featured Products</h2>
          <Link to="/search" className="text-blue-600 hover:text-blue-700 font-semibold">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse"></div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-600">No products available at the moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1"
              >
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={product.images?.[0] || '/placeholder.png'}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-110 transition duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      ${(product.price / 100).toLocaleString()}
                    </span>
                    {product.stock > 0 ? (
                      <span className="text-xs text-green-600 font-medium">In Stock</span>
                    ) : (
                      <span className="text-xs text-red-600 font-medium">Out of Stock</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recently Viewed Products */}
      <RecentlyViewed />

      {/* AI Features Section */}
      <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 border border-indigo-200">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Experience AI-Powered Shopping
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <SmartSearch />
          <QABot />
        </div>
      </section>

      {/* Special Offers Banner */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-8 text-white text-center shadow-xl">
        <h2 className="text-3xl font-bold mb-4">Limited Time Offer!</h2>
        <p className="text-xl mb-6">Get up to 50% off on selected items</p>
        <Link
          to="/search"
          className="inline-block bg-white text-orange-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
        >
          Shop Deals
        </Link>
      </section>
    </div>
  )
}
