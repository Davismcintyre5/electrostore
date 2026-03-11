import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../context/CartContext'
import { ShoppingCartIcon, UserIcon, HeartIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

const Header = () => {
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-indigo-600">ElectroStore</Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-700 hover:text-indigo-600">Home</Link>
          <Link to="/products" className="text-gray-700 hover:text-indigo-600">Products</Link>
          <Link to="/promos" className="text-gray-700 hover:text-indigo-600">Promos</Link>
          <Link to="/contact" className="text-gray-700 hover:text-indigo-600">Contact</Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link to="/cart" className="relative">
            <ShoppingCartIcon className="h-6 w-6 text-gray-700 hover:text-indigo-600" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <>
              <Link to="/wishlist">
                <HeartIcon className="h-6 w-6 text-gray-700 hover:text-indigo-600" />
              </Link>
              <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center space-x-1">
                  <UserIcon className="h-6 w-6 text-gray-700" />
                  <span className="hidden sm:inline text-sm">{user.name}</span>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg py-1">
                    <Link to="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Account</Link>
                    <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Orders</Link>
                    <Link to="/addresses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Addresses</Link>
                    <Link to="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Wishlist</Link>
                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700">
              Login
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t py-2">
          <Link to="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Home</Link>
          <Link to="/products" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Products</Link>
          <Link to="/promos" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Promos</Link>
          <Link to="/contact" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Contact</Link>
          {user && (
            <>
              <Link to="/account" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">My Account</Link>
              <Link to="/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Orders</Link>
              <Link to="/addresses" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Addresses</Link>
              <Link to="/wishlist" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">Wishlist</Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}

export default Header