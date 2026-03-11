import { useState, useEffect } from 'react'
import api from '../services/api'
import ProductCard from '../components/products/ProductCard'

const WishlistPage = () => {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/customer/wishlist')
      setProducts(res.data.products)
    } catch (err) {
      console.error('Failed to fetch wishlist', err)
    }
  }

  const handleRemove = (productId) => {
    setProducts(products.filter(p => p._id !== productId))
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Wishlist</h1>
      {products.length === 0 ? (
        <p className="text-gray-500">Your wishlist is empty.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              inWishlist={true}
              onWishlistToggle={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default WishlistPage