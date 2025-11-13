import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setToken, setProfile } from './store/userSlice'

// Pages
import Home from './pages/Home.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Category from './pages/Category.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/CheckoutEnhanced.jsx'
import Orders from './pages/Orders.jsx'
import Profile from './pages/Profile.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import ProductList from "./pages/ProductList.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Compare from "./pages/Compare.jsx";
import ShippingAddresses from "./pages/ShippingAddresses.jsx";
import RequestReset from "./pages/RequestReset.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import AdminDiscounts from "./pages/AdminDiscounts.jsx";

// Components
import Navbar from './components/common/Navbar.jsx'
import CategoryNav from './components/CategoryNav.jsx'
import Footer from './components/common/Footer.jsx'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'

// Contexts
import { ToastProvider } from './contexts/ToastContext.jsx'
import { CartProvider } from './contexts/CartContext.jsx'
import { WishlistProvider } from './contexts/WishlistContext.jsx'

export default function App() {
  const dispatch = useDispatch()

  // 🔒 Restore user session from localStorage on reload
  useEffect(() => {
    const loadAuth = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const user = localStorage.getItem('user') || sessionStorage.getItem('user')
      if (token && user) {
        dispatch(setToken(token))
        dispatch(setProfile(JSON.parse(user)))
      }
    }

    // Load on mount
    loadAuth()

    // Listen for auth changes (from login/logout)
    window.addEventListener('authChange', loadAuth)
    return () => window.removeEventListener('authChange', loadAuth)
  }, [dispatch])

  return (
    <ToastProvider>
      <CartProvider>
        <WishlistProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <CategoryNav />
            <main className="flex-1 container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/category/:name" element={<Category />} />
            <Route path="/search" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route path="/compare" element={<Compare />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipping-addresses"
              element={
                <ProtectedRoute>
                  <ShippingAddresses />
                </ProtectedRoute>
              }
            />

            <Route path="/admin" element={<AdminDashboard />} />
            <Route
              path="/admin/discounts"
              element={
                <ProtectedRoute>
                  <AdminDiscounts />
                </ProtectedRoute>
              }
            />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/request-reset" element={<RequestReset />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </main>

        <Footer />
      </div>
        </WishlistProvider>
      </CartProvider>
    </ToastProvider>
  )
}
