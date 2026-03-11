import { useEffect, useState } from 'react'
import api from '../services/api'
import ProductCard from '../components/products/ProductCard'
import { Link } from 'react-router-dom'

const HomePage = () => {
  const [featured, setFeatured] = useState([])
  const [promos, setPromos] = useState([])

  useEffect(() => {
    api.get('/customer/products?limit=8').then(res => setFeatured(res.data.products))
    api.get('/customer/promos').then(res => setPromos(res.data))
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-16 rounded-lg mb-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to ElectroStore</h1>
          <p className="text-xl mb-6">Your one-stop shop for the latest electronics</p>
          <Link to="/products" className="bg-white text-indigo-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100">
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featured.map(product => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>

      {/* Promos */}
      {promos.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Current Promotions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promos.map(promo => (
              <div key={promo._id} className="border p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg">{promo.code}</h3>
                <p className="text-gray-600">{promo.description}</p>
                <p className="text-sm text-gray-500 mt-2">Valid until: {new Date(promo.validUntil).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default HomePage