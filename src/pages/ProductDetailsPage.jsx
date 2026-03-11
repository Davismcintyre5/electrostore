import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/products/ProductCard'

const ProductDetailsPage = () => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [quantity, setQuantity] = useState(1)
  const { addToCart } = useCart()

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/customer/products/${id}`)
      setProduct(res.data)
      // Fetch related products (same category)
      if (res.data.category) {
        const relatedRes = await api.get('/customer/products', {
          params: { category: res.data.category, limit: 4 }
        })
        setRelated(relatedRes.data.products.filter(p => p._id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddToCart = () => {
    addToCart(product._id, quantity)
  }

  if (!product) return <div className="text-center py-10">Loading...</div>

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/500'}
            alt={product.name}
            className="w-full rounded-lg shadow"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-2xl text-indigo-600 font-semibold mb-4">KES {product.price}</p>
          <p className="text-gray-700 mb-6">{product.description}</p>
          <div className="flex items-center mb-4">
            <label className="mr-2">Quantity:</label>
            <input
              type="number"
              min="1"
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-16 border rounded px-2 py-1"
            />
            <span className="ml-2 text-sm text-gray-600">({product.stock} available)</span>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {related.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetailsPage