import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function ShippingAddresses() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA',
    is_default: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/shipping`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAddresses(response.data.addresses || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        showError('Failed to load addresses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');

      if (editingId) {
        // Update existing
        await axios.put(`${API_URL}/shipping/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Address updated successfully');
      } else {
        // Create new
        await axios.post(`${API_URL}/shipping`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showSuccess('Address added successfully');
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();
      fetchAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      showError(error.response?.data?.message || 'Failed to save address');
    }
  };

  const handleEdit = (address) => {
    setFormData({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      is_default: address.is_default
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/shipping/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Address deleted successfully');
      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      showError('Failed to delete address');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/shipping/${id}/set-default`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Default address updated');
      fetchAddresses();
    } catch (error) {
      console.error('Error setting default:', error);
      showError('Failed to set default address');
    }
  };

  const resetForm = () => {
    setFormData({
      label: 'Home',
      full_name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'USA',
      is_default: false
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Shipping Addresses</h1>
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add New Address
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Label</label>
                  <select
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  >
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                  <input
                    type="text"
                    value={formData.address_line1}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address Line 2</label>
                  <input
                    type="text"
                    value={formData.address_line2}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">State *</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Postal Code *</label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Country *</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="is_default" className="text-sm">Set as default address</label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingId ? 'Update Address' : 'Add Address'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Address List */}
        {addresses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No addresses saved yet</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first address
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-lg shadow p-6 ${
                  address.is_default ? 'border-2 border-blue-500' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block bg-gray-200 px-3 py-1 rounded-full text-sm font-medium">
                        {address.label}
                      </span>
                      {address.is_default && (
                        <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Edit
                    </button>
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-gray-700">
                  <p className="font-semibold">{address.full_name}</p>
                  <p>{address.address_line1}</p>
                  {address.address_line2 && <p>{address.address_line2}</p>}
                  <p>
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  <p>{address.country}</p>
                  <p className="text-sm text-gray-600">Phone: {address.phone}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
