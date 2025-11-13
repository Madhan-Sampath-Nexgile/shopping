import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  EnvelopeIcon,
  ShoppingBagIcon,
  ClockIcon,
  CreditCardIcon,
  TrashIcon,
  XCircleIcon,
  ChartBarIcon,
  EyeIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  MapPinIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  MdDevices,
  MdCheckroom,
  MdCottage,
  MdMenuBook,
  MdSportsSoccer,
  MdSpa,
  MdTrendingUp,
  MdShoppingCart,
  MdFavorite,
  MdVisibility,
  MdStar,
  MdLocalShipping,
  MdVerified,
} from "react-icons/md";
import { useToast } from "../contexts/ToastContext";
import api from "../services/api";

export default function Profile() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [orders, setOrders] = useState([]);
  const [browsing, setBrowsing] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    recentActivity: 0,
    deliveredOrders: 0,
  });

  const categoryOptions = [
    { name: "Electronics", icon: <MdDevices className="w-5 h-5" />, color: "blue" },
    { name: "Fashion", icon: <MdCheckroom className="w-5 h-5" />, color: "pink" },
    { name: "Home & Garden", icon: <MdCottage className="w-5 h-5" />, color: "green" },
    { name: "Books", icon: <MdMenuBook className="w-5 h-5" />, color: "amber" },
    { name: "Sports", icon: <MdSportsSoccer className="w-5 h-5" />, color: "orange" },
    { name: "Beauty", icon: <MdSpa className="w-5 h-5" />, color: "purple" },
  ];

  const frequencyOptions = ["Daily", "Weekly", "Monthly", "Occasional"];

  const tabs = [
    { id: "overview", label: "Overview", icon: <ChartBarIcon className="w-5 h-5" /> },
    { id: "settings", label: "Settings", icon: <Cog6ToothIcon className="w-5 h-5" /> },
    { id: "security", label: "Security", icon: <ShieldCheckIcon className="w-5 h-5" /> },
    { id: "activity", label: "Activity", icon: <EyeIcon className="w-5 h-5" /> },
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [profileRes, ordersRes, browsingRes] = await Promise.all([
        api.get("/profile"),
        api.get("/profile/purchases"),
        api.get("/profile/browsing"),
      ]);

      setProfile(profileRes.data);
      setTempName(profileRes.data.name || "");
      setOrders(ordersRes.data || []);
      setBrowsing(browsingRes.data || []);

      const totalOrders = ordersRes.data?.length || 0;
      const totalSpent = ordersRes.data?.reduce((sum, order) => sum + parseFloat(order.total || 0), 0) || 0;
      const deliveredOrders = ordersRes.data?.filter(o => o.status === 'DELIVERED').length || 0;
      const recentActivity = browsingRes.data?.length || 0;

      setStats({ totalOrders, totalSpent, recentActivity, deliveredOrders });
    } catch (err) {
      console.error("Error fetching profile data:", err);
      if (err.response?.status === 401) {
        showError("Session expired. Please login again.");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleCategoryToggle = (category) => {
    const newPrefs = profile.preferences?.includes(category)
      ? profile.preferences.filter((c) => c !== category)
      : [...(profile.preferences || []), category];
    setProfile({ ...profile, preferences: newPrefs });
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      price_range: { ...profile.price_range, [name]: Number(value) },
    });
  };

  const handleNameEdit = async () => {
    if (editingName) {
      if (tempName.trim() && tempName !== profile.name) {
        setUpdating(true);
        try {
          const { data } = await api.put("/profile", {
            name: tempName,
            preferences: profile.preferences,
            price_range: profile.price_range,
            shopping_frequency: profile.shopping_frequency,
          });
          setProfile(data);
          showSuccess("Name updated successfully!");

          const user = JSON.parse(localStorage.getItem("user") || "{}");
          user.name = data.name;
          localStorage.setItem("user", JSON.stringify(user));
          window.dispatchEvent(new Event("authChange"));
        } catch (err) {
          showError("Failed to update name");
        } finally {
          setUpdating(false);
        }
      }
      setEditingName(false);
    } else {
      setEditingName(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { data } = await api.put("/profile", {
        name: profile.name,
        preferences: profile.preferences,
        price_range: profile.price_range,
        shopping_frequency: profile.shopping_frequency,
      });

      setProfile(data);
      showSuccess("Profile updated successfully!");

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.name = data.name;
      localStorage.setItem("user", JSON.stringify(user));
      window.dispatchEvent(new Event("authChange"));
    } catch (err) {
      console.error("Error updating profile:", err);
      showError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "⚠️ Are you absolutely sure you want to delete your account?\n\n" +
        "This action cannot be undone. All your data, orders, and history will be permanently deleted."
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "This is your last chance!\n\nClick OK to permanently delete your account."
    );

    if (!doubleConfirm) return;

    try {
      await api.delete("/profile/delete");
      showSuccess("Account deleted successfully");

      localStorage.clear();
      sessionStorage.clear();
      window.dispatchEvent(new Event("authChange"));

      setTimeout(() => {
        navigate("/register");
      }, 1500);
    } catch (err) {
      console.error("Error deleting account:", err);
      showError("Failed to delete account");
    }
  };

  const formatCurrency = (amount) => {
    return `$${(amount / 100).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      PLACED: "bg-blue-100 text-blue-800",
      PROCESSING: "bg-yellow-100 text-yellow-800",
      SHIPPED: "bg-purple-100 text-purple-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return statusMap[status] || "bg-gray-100 text-gray-800";
  };

  const formatActionType = (actionType) => {
    const actionMap = {
      view: "Viewed product",
      search: "Searched for products",
      filter: "Applied filters",
      click: "Clicked on product",
      add_to_cart: "Added to Cart",
      add_to_wishlist: "Added to Wishlist",
    };
    return actionMap[actionType] || actionType;
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded-xl mb-6"></div>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 bg-white rounded-xl shadow-lg">
        <XCircleIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" strokeWidth={1} />
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to load profile</h3>
        <p className="text-gray-600 mb-4">Please try again later</p>
        <button
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <ShoppingBagIcon className="w-4 h-4" />
            Orders
          </Link>
          <Link
            to="/wishlist"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
          >
            <MdFavorite className="w-4 h-4" />
            Wishlist
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6 animate-fadeIn">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingBagIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                </div>
                <Link
                  to="/orders"
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                >
                  View All →
                </Link>
              </div>

              {orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <Link
                      key={order.order_id}
                      to="/orders"
                      className="block border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            #{order.order_id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(order.total)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {new Date(order.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <Link
                    to="/search"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
                  >
                    Start Shopping
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <EyeIcon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Recent Activity</h3>
              </div>

              {browsing.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {browsing.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {formatActionType(activity.action_type)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No activity yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="grid lg:grid-cols-2 gap-6 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserCircleIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Profile Settings</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={profile.email || ""}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Shopping Frequency</label>
                  <select
                    name="shopping_frequency"
                    value={profile.shopping_frequency || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    {frequencyOptions.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className={`w-full py-3 rounded-xl font-bold text-white transition-all ${
                    updating ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                  }`}
                >
                  {updating ? "Updating..." : "Save Changes"}
                </button>
              </form>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MdSpa className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Preferences</h3>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Preferred Categories</label>
                  <div className="grid grid-cols-2 gap-3">
                    {categoryOptions.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => handleCategoryToggle(cat.name)}
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                          profile.preferences?.includes(cat.name)
                            ? `bg-${cat.color}-600 text-white border-${cat.color}-600 shadow-lg`
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                        }`}
                      >
                        {cat.icon}
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Price Range</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Min ($)</label>
                      <input
                        type="number"
                        name="min"
                        value={profile.price_range?.min || 0}
                        onChange={handlePriceChange}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-2">Max ($)</label>
                      <input
                        type="number"
                        name="max"
                        value={profile.price_range?.max || 0}
                        onChange={handlePriceChange}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={updating}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Update Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="grid lg:grid-cols-2 gap-6 animate-fadeIn">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Account Security</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <MdVerified className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="font-semibold text-gray-800">Email Verified</div>
                      <div className="text-sm text-gray-600">Your email is verified</div>
                    </div>
                  </div>
                  <CheckIcon className="w-6 h-6 text-green-600" />
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">Password</div>
                      <div className="text-sm text-gray-600">Last changed 3 months ago</div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
                      Change
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-800">Two-Factor Authentication</div>
                      <div className="text-sm text-gray-600">Add extra security to your account</div>
                    </div>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrashIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Danger Zone</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Delete Account</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Once you delete your account, there is no going back. All your data will be permanently removed.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="w-5 h-5" />
                    Delete My Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <EyeIcon className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Activity Timeline</h3>
            </div>

            {browsing.length > 0 ? (
              <div className="space-y-4">
                {browsing.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                    <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                      <MdVisibility className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{formatActionType(activity.action_type)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(activity.created_at).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-xl">
                <ClockIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No activity recorded yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
