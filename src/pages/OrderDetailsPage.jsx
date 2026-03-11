import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../services/api'
import OrderDetails from '../components/orders/OrderDetails'

const OrderDetailsPage = () => {
  const { id } = useParams()
  const [order, setOrder] = useState(null)

  useEffect(() => {
    api.get(`/customer/orders/${id}`).then(res => setOrder(res.data))
  }, [id])

  if (!order) return <div className="text-center py-10">Loading...</div>

  return <OrderDetails order={order} />
}

export default OrderDetailsPage