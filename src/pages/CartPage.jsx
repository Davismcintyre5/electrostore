import { useState, useEffect } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import CartItem from '../components/cart/CartItem'
import { Link } from 'react-router-dom'
import api from '../services/api'

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart } = useCart()
  const { user } = useAuth()
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(false)

  // For guest cart, fetch product details for each item
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (user) return // logged in cart already has populated products

      const productIds = cart.items.map(item => item.product._id || item.product)
      if (productIds.length === 0) return

      setLoading(true)
      try {
        // Fetch each product individually (or batch if you have a "get multiple" endpoint)
        const promises = productIds.map(id => api.get(`/customer/products/${id}`))
        const results = await Promise.all(promises)
        const productMap = {}
        results.forEach(res => {
          productMap[res.data._id] = res.data
        })
        setProducts(productMap)
      } catch (err) {
        console.error('Failed to fetch product details', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProductDetails()
  }, [cart.items, user])

  // For logged-in users, cart items already have populated product
  const cartItems = user
    ? cart.items
    : cart.items.map(item => ({
        ...item,
        product: products[item.product._id || item.product] || { name: 'Loading...', price: 0, images: [] }
      }))

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0)

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-4">Your Cart is Empty</h1>
        <Link to="/products" className="bg-indigo-600 text-white px-6 py-3 rounded-lg">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Shopping Cart</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {loading && <div className="text-center py-4">Loading product details...</div>}
          {cartItems.map(item => (
            <CartItem
              key={item.product._id || item.product}
              item={item}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
            />
          ))}
        </div>
        <div className="bg-white p-6 rounded-lg shadow h-fit">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>KES {subtotal}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <hr className="my-4" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>KES {subtotal}</span>
          </div>
          <Link
            to="/checkout"
            className="block mt-6 bg-indigo-600 text-white text-center py-3 rounded-lg hover:bg-indigo-700"
          >
            Proceed to Checkout
          </Link>
          {!user && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              You'll need to log in to complete checkout.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CartPage