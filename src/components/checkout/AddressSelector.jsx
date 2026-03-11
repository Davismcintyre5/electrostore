import { useState } from 'react'

const AddressSelector = ({ addresses, selectedId, onSelect }) => {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Select Delivery Address</h2>
      {addresses.length === 0 ? (
        <p className="text-gray-600 mb-4">No addresses saved. Please add one.</p>
      ) : (
        <div className="space-y-2">
          {addresses.map(addr => (
            <label key={addr._id} className="block border p-4 rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="address"
                value={addr._id}
                checked={selectedId === addr._id}
                onChange={() => onSelect(addr._id)}
                className="mr-2"
              />
              <span className="font-medium">{addr.label}</span>
              <p className="text-sm text-gray-600 ml-6">
                {addr.addressLine1}, {addr.addressLine2 && addr.addressLine2 + ', '}
                {addr.city}, {addr.state} {addr.postalCode}, {addr.country}
                {addr.isDefault && <span className="ml-2 text-green-600">(Default)</span>}
              </p>
            </label>
          ))}
        </div>
      )}
      <button
        onClick={() => setShowForm(true)}
        className="mt-4 text-indigo-600 hover:text-indigo-800"
      >
        + Add new address
      </button>

      {showForm && (
        <AddressForm
          onSave={(newAddr) => {
            setShowForm(false)
            // Optionally auto-select new address
            onSelect(newAddr._id)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

// Simple address form (could be reused from AddressesPage)
const AddressForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    label: 'Home',
    recipientName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Kenya'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/customer/addresses', formData)
      onSave(res.data)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add address')
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Add New Address</h3>
        <form onSubmit={handleSubmit}>
          <input name="label" placeholder="Label (e.g., Home, Work)" value={formData.label} onChange={handleChange} className="w-full mb-2 p-2 border rounded" required />
          <input name="recipientName" placeholder="Recipient Name" value={formData.recipientName} onChange={handleChange} className="w-full mb-2 p-2 border rounded" required />
          <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="w-full mb-2 p-2 border rounded" required />
          <input name="addressLine1" placeholder="Address Line 1" value={formData.addressLine1} onChange={handleChange} className="w-full mb-2 p-2 border rounded" required />
          <input name="addressLine2" placeholder="Address Line 2 (optional)" value={formData.addressLine2} onChange={handleChange} className="w-full mb-2 p-2 border rounded" />
          <input name="city" placeholder="City" value={formData.city} onChange={handleChange} className="w-full mb-2 p-2 border rounded" required />
          <input name="state" placeholder="State/County" value={formData.state} onChange={handleChange} className="w-full mb-2 p-2 border rounded" />
          <input name="postalCode" placeholder="Postal Code" value={formData.postalCode} onChange={handleChange} className="w-full mb-2 p-2 border rounded" />
          <input name="country" placeholder="Country" value={formData.country} onChange={handleChange} className="w-full mb-4 p-2 border rounded" required />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

import api from '../../services/api' // for the inner form
export default AddressSelector