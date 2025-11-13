import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../../store/userSlice'
import { useCart } from '../../contexts/CartContext'
import { useWishlist } from '../../contexts/WishlistContext'

export default function Navbar() {
  const { token, profile } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { cartCount } = useCart()
  const { wishlistCount } = useWishlist()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  // Helper function to check if a path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  // Helper function to get nav link classes
  const getNavLinkClass = (path) => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-in-out'

    if (isActive(path)) {
      return `${baseClasses} bg-blue-600 text-white shadow-md`
    }

    return `${baseClasses} text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm`
  }

  // Helper function for button-style links
  const getButtonLinkClass = (path, variant = 'primary') => {
    const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 ease-in-out shadow-sm'

    if (isActive(path)) {
      if (variant === 'primary') {
        return `${baseClasses} bg-blue-700 text-white shadow-lg scale-105`
      } else if (variant === 'secondary') {
        return `${baseClasses} bg-gray-700 text-white shadow-lg scale-105`
      }
    }

    if (variant === 'primary') {
      return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:scale-105`
    } else if (variant === 'secondary') {
      return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700 hover:shadow-md hover:scale-105`
    }

    return baseClasses
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            SmartShop AI
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-3">
            <Link to="/" className={getNavLinkClass('/')}>
              Home
            </Link>

            <Link to="/search" className={getNavLinkClass('/search')}>
              Products
            </Link>

            <Link to="/cart" className={`${getNavLinkClass('/cart')} relative`}>
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {token ? (
              <>
                <Link to="/wishlist" className={`${getNavLinkClass('/wishlist')} relative`}>
                  Wishlist
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </span>
                  )}
                </Link>

                <Link to="/orders" className={getNavLinkClass('/orders')}>
                  Orders
                </Link>

                <Link to="/profile" className={getNavLinkClass('/profile')}>
                  Profile
                </Link>

                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 hover:shadow-lg transition-all duration-200 ease-in-out hover:scale-105 shadow-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={getNavLinkClass('/login')}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className={getButtonLinkClass('/register', 'primary')}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
