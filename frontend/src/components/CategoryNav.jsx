import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdShoppingBag,
  MdSpa,
  MdMenuBook,
  MdDevices,
  MdCheckroom,
  MdCottage,
  MdSportsSoccer,
  MdInventory
} from "react-icons/md";
import api from "../services/api";

export default function CategoryNav() {
  const [cats, setCats] = useState([]);
  const location = useLocation();

  useEffect(() => {
    (async () => {
      const { data } = await api.get("/products/categories");
      setCats(data.categories || []);
    })();
  }, []);

  // Category icons mapping with Material Icons
  const categoryIcons = {
    'Electronics': <MdDevices className="w-5 h-5" />,
    'Fashion': <MdCheckroom className="w-5 h-5" />,
    'Home & Garden': <MdCottage className="w-5 h-5" />,
    'Books': <MdMenuBook className="w-5 h-5" />,
    'Sports': <MdSportsSoccer className="w-5 h-5" />,
    'Beauty': <MdSpa className="w-5 h-5" />,
  };

  // Check if category is active
  const isActiveCategory = (category) => {
    const currentPath = decodeURIComponent(location.pathname);
    return currentPath === `/category/${category}`;
  };

  // Get category classes
  const getCategoryClass = (category) => {
    const baseClasses = 'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap';

    if (isActiveCategory(category)) {
      return `${baseClasses} bg-blue-600 text-white shadow-md`;
    }

    return `${baseClasses} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm`;
  };

  // Only show on product-related pages
  const shouldShowCategoryNav =
    location.pathname === '/search' ||
    location.pathname.startsWith('/category/') ||
    location.pathname.startsWith('/product/');

  // Don't render if not on product pages
  if (!shouldShowCategoryNav) {
    return null;
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6 py-3">
        <div className="flex items-center gap-3">
          {/* "All Products" link */}
          <Link
            to="/search"
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
              location.pathname === '/search'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
            }`}
          >
            <MdShoppingBag className="w-5 h-5" />
            <span>All Products</span>
          </Link>

          <div className="w-px h-8 bg-gray-300"></div>

          {/* Category links */}
          {cats.map((category) => (
            <Link
              key={category}
              to={`/category/${encodeURIComponent(category)}`}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                isActiveCategory(category)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
              }`}
            >
              {categoryIcons[category] || <MdInventory className="w-5 h-5" />}
              <span>{category}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
