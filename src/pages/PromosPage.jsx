import { useState, useEffect } from 'react'
import api from '../services/api'

const PromosPage = () => {
  const [promos, setPromos] = useState([])

  useEffect(() => {
    api.get('/customer/promos').then(res => setPromos(res.data))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Current Promotions</h1>
      {promos.length === 0 ? (
        <p className="text-gray-500">No active promotions at the moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promos.map(promo => (
            <div key={promo._id} className="border p-6 rounded-lg shadow hover:shadow-lg transition">
              <h2 className="text-xl font-bold text-indigo-600">{promo.code}</h2>
              <p className="text-gray-700 mt-2">{promo.description}</p>
              <p className="mt-4 text-sm text-gray-500">
                Valid until: {new Date(promo.validUntil).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PromosPage