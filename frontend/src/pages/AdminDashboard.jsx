import { useEffect, useState } from 'react'
import api from '../services/api'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function AdminDashboard(){
  const [metrics,setMetrics]=useState([])
  const [metricsSummary, setMetricsSummary] = useState(null)
  const [products, setProducts] = useState([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    price: '',
    stock: ''
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('products') // 'products', 'orders', or 'metrics'
  const [orders, setOrders] = useState([])
  const [updatingOrder, setUpdatingOrder] = useState(null)

  useEffect(()=>{ (async ()=>{
    const { data } = await api.get('/abtest/metrics')
    setMetrics(data.timeseries || [])
    setMetricsSummary(data.summary || null)
  })() },[])

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts()
    } else if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [activeTab])

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products')
      setProducts(data.items || [])
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/all')
      setOrders(data.orders || [])
    } catch (err) {
      console.error('Failed to load orders:', err)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrder(orderId)
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus })
      fetchOrders()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock) || 0
      }

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload)
      } else {
        await api.post('/admin/products', payload)
      }

      setShowProductForm(false)
      setEditingProduct(null)
      setFormData({ name: '', description: '', category: 'Electronics', price: '', stock: '' })
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString()
    })
    setShowProductForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await api.delete(`/admin/products/${id}`)
      fetchProducts()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete product')
    }
  }

  const handleCancel = () => {
    setShowProductForm(false)
    setEditingProduct(null)
    setFormData({ name: '', description: '', category: 'Electronics', price: '', stock: '' })
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'products'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Product Management
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'orders'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Order Management
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 px-4 font-medium transition ${
            activeTab === 'metrics'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          A/B Test Metrics
        </button>
      </div>

      {/* Product Management Tab */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Add Product Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Products</h2>
            <button
              onClick={() => setShowProductForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <PlusIcon className="w-5 h-5" />
              Add Product
            </button>
          </div>

          {/* Product Form */}
          {showProductForm && (
            <div className="card bg-blue-50 border border-blue-200">
              <h3 className="font-bold text-lg mb-4">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., iPhone 15 Pro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home">Home</option>
                      <option value="Books">Books</option>
                      <option value="Sports">Sports</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="99.99"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Product description..."
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Stock</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-700">{product.category}</td>
                      <td className="py-3 px-4 text-gray-900 font-medium">${product.price}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-sm ${
                          product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-gray-500">
                        No products found. Click "Add Product" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Order Management Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-mono text-sm text-gray-600">
                          {order.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 text-sm">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-medium text-sm">
                          {order.user_email || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-900 font-semibold">
                        ${(order.total / 100).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {order.item_count}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          disabled={updatingOrder === order.id}
                          className={`text-sm font-medium px-3 py-1 rounded border ${
                            order.status === 'DELIVERED' ? 'bg-green-50 text-green-800 border-green-200' :
                            order.status === 'SHIPPED' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                            order.status === 'PROCESSING' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' :
                            order.status === 'CANCELLED' ? 'bg-red-50 text-red-800 border-red-200' :
                            'bg-blue-50 text-blue-800 border-blue-200'
                          } ${updatingOrder === order.id ? 'opacity-50' : ''}`}
                        >
                          <option value="PLACED">PLACED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            const details = order.shipping_address ?
                              `Address: ${order.shipping_address.address}, ${order.shipping_address.city}\nPhone: ${order.shipping_address.phone}` :
                              'No shipping details available'
                            alert(`Order Details:\n\n${details}\n\nPayment: ${order.payment_method || 'N/A'}\nPayment Status: ${order.payment_status || 'N/A'}`)
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500">
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* A/B Test Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold mb-3">A/B Test CTR Over Time</h2>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={metrics}>
                  <XAxis dataKey="t" /><YAxis /><Tooltip />
                  <Line dataKey="A" />
                  <Line dataKey="B" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="card">
              <div className="text-sm text-gray-500">Variant A CTR</div>
              <div className="text-2xl font-bold">{metricsSummary?.A?.ctr || '0.00'}%</div>
              <div className="text-xs text-gray-500 mt-1">
                {metricsSummary?.A?.clicks || 0} clicks / {metricsSummary?.A?.views || 0} views
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Variant B CTR</div>
              <div className="text-2xl font-bold">{metricsSummary?.B?.ctr || '0.00'}%</div>
              <div className="text-xs text-gray-500 mt-1">
                {metricsSummary?.B?.clicks || 0} clicks / {metricsSummary?.B?.views || 0} views
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-500">Total Purchases</div>
              <div className="text-2xl font-bold">
                {(metricsSummary?.A?.purchases || 0) + (metricsSummary?.B?.purchases || 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                A: {metricsSummary?.A?.purchases || 0} | B: {metricsSummary?.B?.purchases || 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
