import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'

export const CartContext = createContext()

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}

const LOCAL_CART_KEY = 'electrostore_cart'

export const CartProvider = ({ children }) => {
  const { user } = useAuth()
  const [cart, setCart] = useState({ items: [] })
  const [loading, setLoading] = useState(true)

  // Load initial cart
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        try {
          const res = await api.get('/customer/cart')
          setCart(res.data)
        } catch (err) {
          console.error('Failed to fetch cart', err)
          setCart({ items: [] })
        }
      } else {
        const stored = localStorage.getItem(LOCAL_CART_KEY)
        if (stored) {
          try {
            setCart(JSON.parse(stored))
          } catch {
            setCart({ items: [] })
          }
        } else {
          setCart({ items: [] })
        }
      }
      setLoading(false)
    }

    loadCart()
  }, [user])

  // Save guest cart to localStorage
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart))
    }
  }, [cart, user])

  // Merge guest cart on login
  useEffect(() => {
    const mergeCart = async () => {
      if (!user) return

      const localCart = localStorage.getItem(LOCAL_CART_KEY)
      if (!localCart) return

      const localItems = JSON.parse(localCart).items || []
      if (localItems.length === 0) return

      // Add each local item to server cart
      for (const item of localItems) {
        try {
          await api.post('/customer/cart', {
            productId: item.product._id || item.product,
            quantity: item.quantity
          })
        } catch (err) {
          console.error('Failed to merge cart item', err)
        }
      }

      localStorage.removeItem(LOCAL_CART_KEY)
      const res = await api.get('/customer/cart')
      setCart(res.data)
    }

    mergeCart()
  }, [user])

  const addToCart = async (productId, quantity = 1) => {
    if (user) {
      try {
        const res = await api.post('/customer/cart', { productId, quantity })
        setCart(res.data)
      } catch (err) {
        console.error('Add to cart error:', err.response?.data || err.message)
        if (err.response?.status === 401) {
          alert('Your session has expired. Please log in again.')
        } else if (err.response?.status === 403) {
          alert('You do not have permission to add items to cart.')
        } else {
          alert('Failed to add item. Please try again later.')
        }
      }
    } else {
      // Guest: store locally
      setCart(prev => {
        const existingIndex = prev.items.findIndex(item => 
          (item.product._id || item.product) === productId
        )
        let newItems
        if (existingIndex >= 0) {
          newItems = prev.items.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        } else {
          newItems = [...prev.items, { product: productId, quantity }]
        }
        return { ...prev, items: newItems }
      })
    }
  }

  const updateQuantity = async (productId, quantity) => {
    if (user) {
      try {
        const res = await api.put('/customer/cart', { productId, quantity })
        setCart(res.data)
      } catch (err) {
        console.error('Update cart error:', err.response?.data || err.message)
        alert('Failed to update cart.')
      }
    } else {
      setCart(prev => ({
        ...prev,
        items: prev.items
          .map(item =>
            (item.product._id || item.product) === productId
              ? { ...item, quantity }
              : item
          )
          .filter(item => item.quantity > 0)
      }))
    }
  }

  const removeFromCart = async (productId) => {
    if (user) {
      try {
        const res = await api.delete(`/customer/cart/${productId}`)
        setCart(res.data)
      } catch (err) {
        console.error('Remove from cart error:', err.response?.data || err.message)
        alert('Failed to remove item.')
      }
    } else {
      setCart(prev => ({
        ...prev,
        items: prev.items.filter(item => (item.product._id || item.product) !== productId)
      }))
    }
  }

  const clearCart = () => {
    if (user) {
      // Optional: add bulk delete endpoint
      setCart({ items: [] })
    } else {
      setCart({ items: [] })
      localStorage.removeItem(LOCAL_CART_KEY)
    }
  }

  const value = {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: () => {
      if (user) {
        api.get('/customer/cart').then(res => setCart(res.data))
      } else {
        const stored = localStorage.getItem(LOCAL_CART_KEY)
        setCart(stored ? JSON.parse(stored) : { items: [] })
      }
    },
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}