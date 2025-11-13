import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PercentBadgeIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function AdminDiscounts() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/discount/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDiscounts(response.data.discounts);
      }
    } catch (error) {
      console.error('Error fetching discounts:', error);
      showError('Failed to load discount codes');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (discount = null) => {
    if (discount) {
      setEditingDiscount(discount);
      setFormData({
        code: discount.code,
        description: discount.description || '',
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        min_order_amount: discount.min_order_amount || '',
        max_discount_amount: discount.max_discount_amount || '',
        usage_limit: discount.usage_limit || '',
        valid_from: discount.valid_from ? new Date(discount.valid_from).toISOString().slice(0, 16) : '',
        valid_until: discount.valid_until ? new Date(discount.valid_until).toISOString().slice(0, 16) : '',
        is_active: discount.is_active
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        valid_from: '',
        valid_until: '',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDiscount(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_amount: '',
      max_discount_amount: '',
      usage_limit: '',
      valid_from: '',
      valid_until: '',
      is_active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.code || !formData.discount_value) {
      showError('Code and discount value are required');
      return;
    }

    if (formData.discount_type === 'percentage' && (formData.discount_value < 0 || formData.discount_value > 100)) {
      showError('Percentage discount must be between 0 and 100');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
        max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        valid_from: formData.valid_from || null,
        valid_until: formData.valid_until || null
      };

      if (editingDiscount) {
        // Update existing discount
        await axios.put(`${API_URL}/discount/admin/${editingDiscount.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Discount code updated successfully');
      } else {
        // Create new discount
        await axios.post(`${API_URL}/discount/admin/create`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Discount code created successfully');
      }

      handleCloseModal();
      fetchDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
      showError(error.response?.data?.message || 'Failed to save discount code');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete discount code "${code}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/discount/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('Discount code deleted successfully');
      fetchDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      showError('Failed to delete discount code');
    }
  };

  const toggleActive = async (discount) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/discount/admin/${discount.id}`, {
        is_active: !discount.is_active
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess(`Discount code ${!discount.is_active ? 'activated' : 'deactivated'}`);
      fetchDiscounts();
    } catch (error) {
      console.error('Error toggling discount:', error);
      showError('Failed to update discount status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDiscountStatus = (discount) => {
    const now = new Date();

    if (!discount.is_active) {
      return { status: 'Inactive', color: 'gray' };
    }

    if (discount.valid_from && new Date(discount.valid_from) > now) {
      return { status: 'Scheduled', color: 'blue' };
    }

    if (discount.valid_until && new Date(discount.valid_until) < now) {
      return { status: 'Expired', color: 'red' };
    }

    if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
      return { status: 'Limit Reached', color: 'orange' };
    }

    return { status: 'Active', color: 'green' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading discount codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Discount Codes</h1>
              <p className="mt-2 text-gray-600">Manage promotional discount codes</p>
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create Discount Code
            </button>
          </div>
        </div>

        {/* Discounts List */}
        {discounts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <TagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No discount codes yet</h3>
            <p className="text-gray-600 mb-6">Create your first discount code to start offering promotions</p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-5 h-5" />
              Create First Discount
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {discounts.map((discount) => {
              const statusInfo = getDiscountStatus(discount);
              return (
                <div
                  key={discount.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{discount.code}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                          statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                          statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {statusInfo.status}
                        </span>
                      </div>
                      {discount.description && (
                        <p className="text-sm text-gray-600">{discount.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Discount Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      {discount.discount_type === 'percentage' ? (
                        <PercentBadgeIcon className="w-5 h-5 text-blue-600" />
                      ) : (
                        <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                      )}
                      <span className="font-medium">
                        {discount.discount_type === 'percentage'
                          ? `${discount.discount_value}% off`
                          : `$${parseFloat(discount.discount_value).toFixed(2)} off`
                        }
                      </span>
                    </div>

                    {discount.min_order_amount > 0 && (
                      <div className="text-sm text-gray-600">
                        Min order: ${parseFloat(discount.min_order_amount).toFixed(2)}
                      </div>
                    )}

                    {discount.max_discount_amount && (
                      <div className="text-sm text-gray-600">
                        Max discount: ${parseFloat(discount.max_discount_amount).toFixed(2)}
                      </div>
                    )}

                    {discount.usage_limit && (
                      <div className="text-sm text-gray-600">
                        Usage: {discount.used_count} / {discount.usage_limit}
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min((discount.used_count / discount.usage_limit) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {(discount.valid_from || discount.valid_until) && (
                      <div className="text-xs text-gray-500 space-y-1">
                        {discount.valid_from && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            From: {formatDate(discount.valid_from)}
                          </div>
                        )}
                        {discount.valid_until && (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            Until: {formatDate(discount.valid_until)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <button
                      onClick={() => toggleActive(discount)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        discount.is_active
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {discount.is_active ? (
                        <span className="flex items-center justify-center gap-1">
                          <XCircleIcon className="w-4 h-4" />
                          Deactivate
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <CheckCircleIcon className="w-4 h-4" />
                          Activate
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenModal(discount)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id, discount.code)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingDiscount ? 'Edit Discount Code' : 'Create Discount Code'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    disabled={!!editingDiscount}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    placeholder="e.g., SAVE20"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {editingDiscount ? 'Code cannot be changed after creation' : 'Uppercase letters and numbers recommended'}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 20% off for new customers"
                  />
                </div>

                {/* Discount Type and Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type *
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Value *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={formData.discount_type === 'percentage' ? '100' : undefined}
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={formData.discount_type === 'percentage' ? '10' : '25.00'}
                      required
                    />
                  </div>
                </div>

                {/* Order Constraints */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Order Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Discount Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="No limit"
                    />
                  </div>
                </div>

                {/* Usage Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Unlimited"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty for unlimited uses
                  </p>
                </div>

                {/* Valid Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid From
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid Until
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Active Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active (discount can be used immediately)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingDiscount ? 'Update Discount' : 'Create Discount'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
