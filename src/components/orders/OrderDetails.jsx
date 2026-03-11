import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print' // we'll need to install react-to-print or use window.print
// For simplicity, we'll implement a print function using window.print with a hidden printable component.

const OrderDetails = ({ order }) => {
  const printRef = useRef()

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head><title>Order #${order._id}</title>
        <style>
          body { font-family: Arial; padding: 20px; }
          .header { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Invoice</h1>
            <p>Order ID: ${order._id}</p>
            <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
            <p>Status: ${order.orderStatus}</p>
            <p>Payment Method: ${order.paymentMethod}</p>
            <p>Payment Status: ${order.paymentStatus}</p>
          </div>
          <h2>Items</h2>
          <table>
            <thead>
              <tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product?.name || 'N/A'}</td>
                  <td>${item.quantity}</td>
                  <td>KES ${item.price}</td>
                  <td>KES ${item.price * item.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <h3>Total Amount: KES ${order.totalAmount}</h3>
          <h3>Shipping Address</h3>
          <p>${order.shippingAddress?.addressLine1}, ${order.shippingAddress?.city}, ${order.shippingAddress?.country}</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Order #{order._id}</h2>
        <button
          onClick={handlePrint}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Print Invoice
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Status:</strong> {order.orderStatus}</p>
          <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
          <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
        </div>
        {order.shippingAddress && (
          <div>
            <p><strong>Shipping Address:</strong></p>
            <p>{order.shippingAddress.recipientName}</p>
            <p>{order.shippingAddress.addressLine1}</p>
            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
            <p>{order.shippingAddress.country}</p>
            <p>{order.shippingAddress.phone}</p>
          </div>
        )}
      </div>

      <h3 className="text-lg font-semibold mb-2">Items</h3>
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Product</th>
            <th className="px-4 py-2 border">Quantity</th>
            <th className="px-4 py-2 border">Price</th>
            <th className="px-4 py-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={idx}>
              <td className="px-4 py-2 border">{item.product?.name}</td>
              <td className="px-4 py-2 border">{item.quantity}</td>
              <td className="px-4 py-2 border">KES {item.price}</td>
              <td className="px-4 py-2 border">KES {item.price * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-right mt-4 text-xl font-bold">
        Total: KES {order.totalAmount}
      </div>
    </div>
  )
}

export default OrderDetails