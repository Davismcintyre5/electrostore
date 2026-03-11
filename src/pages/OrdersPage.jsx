import { useState, useEffect } from 'react'
import api from '../services/api'
import OrderCard from '../components/orders/OrderCard'

const OrdersPage = () => {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/customer/orders').then(res => setOrders(res.data))
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-gray-500">You have no orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => <OrderCard key={order._id} order={order} />)}
        </div>
      )}
    </div>
  )
}

export default OrdersPage