import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../hooks/useAuth'
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid'
import { useState } from 'react'
import api from '../../services/api'

const ProductCard = ({ product, inWishlist = false, onWishlistToggle }) => {
  const { addToCart } = useCart()
  const { user, loading } = useAuth()
  const [isWishlisted, setIsWishlisted] = useState(inWishlist)

  const handleWishlist = async () => {
    console.log('Wishlist clicked, user:', user, 'loading:', loading)

    if (loading) {
      console.log('Still loading auth, ignoring click')
      return
    }

    if (!user) {
      console.log('No user, redirecting to login')
      window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`
      return
    }

    try {
      if (isWishlisted) {
        console.log('Removing from wishlist, product:', product._id)
        await api.delete(`/customer/wishlist/${product._id}`)
      } else {
        console.log('Adding to wishlist, product:', product._id)
        await api.post('/customer/wishlist', { productId: product._id })
      }
      setIsWishlisted(!isWishlisted)
      if (onWishlistToggle) onWishlistToggle(product._id)
    } catch (err) {
      console.error('Wishlist error:', err.response?.status, err.response?.data || err.message)
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        delete api.defaults.headers.Authorization
        window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}&message=session_expired`
      } else if (err.response?.status === 403) {
        alert('You do not have permission to modify wishlist.')
      } else {
        alert('Failed to update wishlist. Please try again.')
      }
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition relative">
      <Link to={`/product/${product._id}`}>
        <img
          src={product.images?.[0] || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-48 object-cover"
        />
      </Link>
      <button
        onClick={handleWishlist}
        disabled={loading}
        className={`absolute top-2 right-2 bg-white rounded-full p-1 shadow transition-opacity ${
          loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
        }`}
        title={loading ? 'Loading...' : (isWishlisted ? 'Remove from wishlist' : 'Add to wishlist')}
      >
        {loading ? (
          <div className="h-5 w-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
        ) : isWishlisted ? (
          <HeartSolid className="h-5 w-5 text-red-500" />
        ) : (
          <HeartOutline className="h-5 w-5 text-gray-600" />
        )}
      </button>
      <div className="p-4">
        <Link to={`/product/${product._id}`}>
          <h3 className="text-lg font-semibold hover:text-indigo-600">{product.name}</h3>
        </Link>
        <p className="text-gray-600 mt-1">KES {product.price}</p>
        <button
          onClick={() => addToCart(product._id)}
          className="mt-3 w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}

export default ProductCard