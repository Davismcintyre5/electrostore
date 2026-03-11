import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import AddressSelector from '../components/checkout/AddressSelector'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const { user } = useAuth()
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/customer/addresses')
      setAddresses(res.data)
      const defaultAddr = res.data.find(a => a.isDefault)
      if (defaultAddr) setSelectedAddress(defaultAddr._id)
    } catch (err) {
      console.error(err)
    }
  }

  const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address')
      return
    }

    // Validate phone number for M-Pesa
    if (paymentMethod === 'mpesa') {
      if (!phoneNumber || phoneNumber.length < 10) {
        alert('Please enter a valid M-Pesa phone number')
        return
      }
    }

    setLoading(true)
    try {
      // Step 1: Create order
      const orderData = {
        addressId: selectedAddress,
        paymentMethod
      }
      const orderRes = await api.post('/customer/checkout', orderData)
      const order = orderRes.data

      // Step 2: If M-Pesa, initiate STK push
      if (paymentMethod === 'mpesa') {
        await api.post('/mpesa/stkpush', {
          phone: phoneNumber,
          amount: order.totalAmount,
          orderId: order._id
        })
        // Optionally show a message that STK push was sent
        alert('STK push sent to your phone. Please enter PIN to complete payment.')
      }

      clearCart()
      navigate(`/order/${order._id}`)
    } catch (err) {
      alert(err.response?.data?.message || 'Order failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <AddressSelector
          addresses={addresses}
          selectedId={selectedAddress}
          onSelect={setSelectedAddress}
        />

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="mpesa"
                checked={paymentMethod === 'mpesa'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              M-Pesa
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mr-2"
              />
              Card (Simulated)
            </label>
          </div>

          {paymentMethod === 'mpesa' && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">M-Pesa Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g., 254700000000"
                className="w-full p-2 border rounded"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter your M-Pesa registered phone number (format: 254XXXXXXXXX)</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow h-fit">
        <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
        {cart.items.map(item => (
          <div key={item.product._id} className="flex justify-between text-sm mb-2">
            <span>{item.product.name} x {item.quantity}</span>
            <span>KES {item.product.price * item.quantity}</span>
          </div>
        ))}
        <hr className="my-4" />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>KES {subtotal}</span>
        </div>
        <button
          onClick={handlePlaceOrder}
          disabled={loading || !selectedAddress}
          className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  )
}

export default CheckoutPage