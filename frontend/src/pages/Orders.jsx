import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  MdInventory,
  MdFilterList,
  MdSearch,
  MdDownload,
  MdLocalShipping,
  MdCheckCircle,
  MdCancel,
  MdPending,
  MdRefresh,
  MdExpandMore,
  MdExpandLess,
  MdShoppingBag,
  MdAttachMoney,
  MdTrendingUp,
  MdCalendarToday
} from 'react-icons/md';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import OrderTimeline from '../components/OrderTimeline.jsx';

export default function Orders() {
  const { token } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [token, navigate]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showError('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setSelectedOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      showError('Failed to load order details');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setCancellingOrder(orderId);
    try {
      await api.put(`/orders/${orderId}/cancel`);
      showSuccess('Order cancelled successfully');
      await fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      showError(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleReorder = (order) => {
    // Navigate to cart and add items
    showSuccess('Added items to cart');
  };

  const handleDownloadInvoice = (order) => {
    showSuccess('Invoice download started');
    // Implement PDF generation
  };

  const toggleOrderExpansion = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setSelectedOrderDetails(null);
    } else {
      setExpandedOrder(orderId);
      await fetchOrderDetails(orderId);
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.total / 100), 0);
    const completedOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const pendingOrders = orders.filter(o => ['PLACED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length;

    return { totalOrders, totalSpent, completedOrders, pendingOrders };
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'LAST_7_DAYS':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'LAST_30_DAYS':
          filterDate.setDate(now.getDate() - 30);
          break;
        case 'LAST_3_MONTHS':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'LAST_YEAR':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(order =>
        new Date(order.created_at) >= filterDate
      );
    }

    return filtered;
  }, [orders, searchQuery, statusFilter, dateFilter]);

  const getStatusIcon = (status) => {
    const icons = {
      PLACED: <MdPending className="w-5 h-5" />,
      PROCESSING: <MdRefresh className="w-5 h-5 animate-spin" />,
      SHIPPED: <MdLocalShipping className="w-5 h-5" />,
      DELIVERED: <MdCheckCircle className="w-5 h-5" />,
      CANCELLED: <MdCancel className="w-5 h-5" />,
    };
    return icons[status] || <MdPending className="w-5 h-5" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      PLACED: 'bg-blue-100 text-blue-800 border-blue-200',
      PROCESSING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      SHIPPED: 'bg-purple-100 text-purple-800 border-purple-200',
      DELIVERED: 'bg-green-100 text-green-800 border-green-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      PENDING: 'text-yellow-600',
      PAID: 'text-green-600',
      FAILED: 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-12 shadow-lg">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-6 rounded-full shadow-lg">
              <MdInventory className="w-24 h-24 text-blue-500" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">No orders yet</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Start your shopping journey and your orders will appear here!
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
          >
            <MdShoppingBag className="w-5 h-5" />
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <MdFilterList className="w-5 h-5" />
          Filters
          {showFilters ? <MdExpandLess className="w-5 h-5" /> : <MdExpandMore className="w-5 h-5" />}
        </button>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Order ID
              </label>
              <div className="relative">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter order ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                <option value="PLACED">Placed</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Time</option>
                <option value="LAST_7_DAYS">Last 7 Days</option>
                <option value="LAST_30_DAYS">Last 30 Days</option>
                <option value="LAST_3_MONTHS">Last 3 Months</option>
                <option value="LAST_YEAR">Last Year</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || statusFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setDateFilter('ALL');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Orders Count */}
      <div className="flex items-center gap-2 text-gray-600">
        <span className="font-medium">
          Showing {filteredOrders.length} of {orders.length} orders
        </span>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <MdSearch className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No orders match your filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setDateFilter('ALL');
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Order Card */}
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                  {/* Order Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Order ID</div>
                      <div className="font-mono text-sm font-bold text-gray-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Order Date</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Total Amount</div>
                      <div className="text-sm font-bold text-gray-900">
                        ${(order.total / 100).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Items</div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                  >
                    <MdExpandMore className="w-4 h-4" />
                    View Details
                  </button>

                  <button
                    onClick={() => handleDownloadInvoice(order)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    <MdDownload className="w-4 h-4" />
                    Invoice
                  </button>

                  {['SHIPPED', 'PROCESSING'].includes(order.status) && (
                    <button
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition"
                    >
                      <MdLocalShipping className="w-4 h-4" />
                      Track
                    </button>
                  )}

                  {order.status === 'DELIVERED' && (
                    <button
                      onClick={() => handleReorder(order)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition"
                    >
                      <MdRefresh className="w-4 h-4" />
                      Reorder
                    </button>
                  )}

                  {order.status === 'PLACED' && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancellingOrder === order.id}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                    >
                      <MdCancel className="w-4 h-4" />
                      {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Order Details */}
              {expandedOrder === order.id && (
                <div className="px-6 py-6 bg-gray-50 border-t border-gray-200 animate-slideDown">
                  <div className="space-y-6">
                    {/* Order Timeline */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Timeline</h3>
                      <OrderTimeline
                        status={order.status}
                        createdAt={order.created_at}
                        tracking={selectedOrderDetails?.tracking}
                      />
                    </div>

                    {/* Order Items and Address Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Shipping Address */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <MdLocalShipping className="w-5 h-5 text-blue-600" />
                          Shipping Address
                        </h3>
                        {order.shipping_address ? (
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="font-semibold text-gray-800">
                              {order.shipping_address.fullName}
                            </div>
                            <div>{order.shipping_address.address}</div>
                            <div>
                              {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                            </div>
                            <div className="pt-2 border-t border-gray-200 mt-2">
                              <span className="text-gray-500">Phone:</span>{' '}
                              <span className="font-medium text-gray-800">{order.shipping_address.phone}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">No address available</div>
                        )}
                      </div>

                      {/* Payment Information */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <MdAttachMoney className="w-5 h-5 text-green-600" />
                          Payment Information
                        </h3>
                        <div className="text-sm text-gray-600 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Payment Method:</span>
                            <span className="font-medium text-gray-800 uppercase">{order.payment_method || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Payment Status:</span>
                            <span className={`font-semibold ${getPaymentStatusColor(order.payment_status)}`}>
                              {order.payment_status || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-gray-700 font-medium">Total Paid:</span>
                            <span className="font-bold text-lg text-green-600">
                              ${(order.total / 100).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    {selectedOrderDetails?.items && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Order Items</h3>
                        <div className="space-y-3">
                          {selectedOrderDetails.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <img
                                src={item.images?.[0] || '/placeholder.png'}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-800 truncate">{item.name}</h4>
                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-800">
                                  ${(item.price / 100).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">per item</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
