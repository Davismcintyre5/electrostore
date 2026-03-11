import { Link } from 'react-router-dom'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const OrderCard = ({ order }) => {
  return (
    <div className="border rounded-lg p-4 mb-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">Order #{order._id.slice(-8)}</p>
          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.orderStatus]}`}>
          {order.orderStatus}
        </span>
      </div>
      <div className="mt-2">
        <p className="font-semibold">Total: KES {order.totalAmount}</p>
        <p className="text-sm text-gray-600">Items: {order.items.length}</p>
      </div>
      <div className="mt-3">
        <Link to={`/order/${order._id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          View Details →
        </Link>
      </div>
    </div>
  )
}

export default OrderCard