import { useState, useEffect } from 'react'
import api from '../services/api'
import ProductCard from '../components/products/ProductCard'
import ProductFilter from '../components/products/ProductFilter'
import { useDebounce } from '../hooks/useDebounce'

const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ category: '', search: '' })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const debouncedFilters = useDebounce(filters, 500)

  useEffect(() => {
    fetchProducts()
  }, [debouncedFilters, page])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/customer/products', {
        params: { ...debouncedFilters, page, limit: 12 }
      })
      setProducts(res.data.products)
      setTotalPages(res.data.pages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">All Products</h1>
      <ProductFilter onFilterChange={setFilters} />

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No products found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => <ProductCard key={product._id} product={product} />)}
          </div>

          <div className="mt-8 flex justify-center space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">Page {page} of {totalPages}</span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ProductsPage