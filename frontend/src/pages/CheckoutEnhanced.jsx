import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export default function CheckoutEnhanced() {
  const { token } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [cartItems, setCartItems] = useState([]);
  const [summary, setSummary] = useState({ itemCount: 0, subtotal: 0, shipping: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);

  // New address form
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Discount code
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('COD');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCart();
    fetchSavedAddresses();
  }, [token, navigate]);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      if (!data.items || data.items.length === 0) {
        navigate('/cart');
        return;
      }
      setCartItems(data.items || []);
      setSummary(data.summary || { itemCount: 0, subtotal: 0, shipping: 0, total: 0 });
    } catch (error) {
      console.error('Error fetching cart:', error);
      navigate('/cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedAddresses = async () => {
    try {
      const response = await axios.get(`${API_URL}/shipping`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const addresses = response.data.addresses || [];
      setSavedAddresses(addresses);

      // Auto-select default address
      const defaultAddr = addresses.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      showError('Please enter a discount code');
      return;
    }

    setValidatingDiscount(true);
    try {
      const response = await axios.post(
        `${API_URL}/discount/validate`,
        {
          code: discountCode,
          orderTotal: summary.subtotal
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAppliedDiscount(response.data.discount);
        showSuccess('Discount code applied!');
      }
    } catch (error) {
      console.error('Error applying discount:', error);
      showError(error.response?.data?.message || 'Invalid discount code');
      setAppliedDiscount(null);
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setAppliedDiscount(null);
    showSuccess('Discount removed');
  };

  const calculateTotal = () => {
    let total = summary.subtotal;
    if (appliedDiscount) {
      total -= parseFloat(appliedDiscount.discountAmount);
    }
    return Math.max(0, total);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    // Validate address: either new address filled OR saved address selected
    const isFillingNewAddress = useNewAddress || savedAddresses.length === 0;

    if (isFillingNewAddress) {
      // Validate new address fields
      const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
      for (const field of required) {
        if (!newAddress[field]?.trim()) {
          showError(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
          return;
        }
      }
    } else if (!selectedAddressId) {
      // Must select a saved address
      showError('Please select a shipping address');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        paymentMethod,
      };

      if (isFillingNewAddress) {
        orderData.shippingAddress = newAddress;
      } else {
        orderData.shippingAddressId = selectedAddressId;
      }

      if (appliedDiscount) {
        orderData.discountCode = discountCode;
      }

      const { data } = await api.post('/orders/checkout', orderData);

      showSuccess('Order placed successfully!');
      navigate(`/orders`);
    } catch (error) {
      console.error('Error placing order:', error);
      showError(error.response?.data?.error || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading checkout...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Shipping & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>

              {savedAddresses.length > 0 && (
                <>
                  <div className="space-y-3 mb-4">
                    {savedAddresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedAddressId === address.id && !useNewAddress
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === address.id && !useNewAddress}
                          onChange={() => {
                            setSelectedAddressId(address.id);
                            setUseNewAddress(false);
                          }}
                          className="mr-3"
                        />
                        <div className="inline-block">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{address.full_name}</span>
                            <span className="text-sm bg-gray-200 px-2 py-0.5 rounded">{address.label}</span>
                            {address.is_default && (
                              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {address.address_line1}, {address.city}, {address.state} {address.postal_code}
                          </div>
                          <div className="text-sm text-gray-600">Phone: {address.phone}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setUseNewAddress(!useNewAddress)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm mb-4"
                  >
                    {useNewAddress ? '← Use saved address' : '+ Use a new address'}
                  </button>

                  <Link
                    to="/shipping-addresses"
                    className="text-sm text-gray-600 hover:text-gray-800 block"
                  >
                    Manage addresses →
                  </Link>
                </>
              )}

              {(useNewAddress || savedAddresses.length === 0) && (
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Full Name *"
                      value={newAddress.fullName}
                      onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone *"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email *"
                    value={newAddress.email}
                    onChange={(e) => setNewAddress({ ...newAddress, email: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <textarea
                    name="address"
                    placeholder="Address *"
                    rows="3"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      name="city"
                      placeholder="City *"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State *"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      name="pincode"
                      placeholder="Pincode *"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
              <div className="space-y-2">
                <label className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <span>Cash on Delivery (COD)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.cart_id} className="flex gap-3 text-sm">
                    <img
                      src={item.images?.[0] || '/placeholder.png'}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.variant_value && (
                        <p className="text-gray-600 text-xs">{item.variant_type}: {item.variant_value}</p>
                      )}
                      <p className="text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${(parseFloat(item.price) + (item.price_adjustment || 0)) * item.quantity}</p>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                {/* Discount Code */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Discount Code</label>
                  {!appliedDiscount ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      />
                      <button
                        onClick={handleApplyDiscount}
                        disabled={validatingDiscount}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                      >
                        {validatingDiscount ? 'Applying...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-800">{appliedDiscount.code}</p>
                        <p className="text-xs text-green-600">{appliedDiscount.description}</p>
                      </div>
                      <button
                        onClick={handleRemoveDiscount}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({summary.itemCount} items)</span>
                  <span>${summary.subtotal.toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span>-${appliedDiscount.discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{summary.shipping === 0 ? 'FREE' : `$${summary.shipping.toFixed(2)}`}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing your order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
