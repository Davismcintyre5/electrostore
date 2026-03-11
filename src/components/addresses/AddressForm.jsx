import { useState } from 'react'

const AddressForm = ({ address, onSave, onCancel }) => {
  const [formData, setFormData] = useState(address || {
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

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input name="label" placeholder="Label (e.g., Home, Work)" value={formData.label} onChange={handleChange} className="w-full p-2 border rounded" required />
      <input name="recipientName" placeholder="Recipient Name" value={formData.recipientName} onChange={handleChange} className="w-full p-2 border rounded" required />
      <input name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded" required />
      <input name="addressLine1" placeholder="Address Line 1" value={formData.addressLine1} onChange={handleChange} className="w-full p-2 border rounded" required />
      <input name="addressLine2" placeholder="Address Line 2 (optional)" value={formData.addressLine2} onChange={handleChange} className="w-full p-2 border rounded" />
      <input name="city" placeholder="City" value={formData.city} onChange={handleChange} className="w-full p-2 border rounded" required />
      <input name="state" placeholder="State/County" value={formData.state} onChange={handleChange} className="w-full p-2 border rounded" />
      <input name="postalCode" placeholder="Postal Code" value={formData.postalCode} onChange={handleChange} className="w-full p-2 border rounded" />
      <input name="country" placeholder="Country" value={formData.country} onChange={handleChange} className="w-full p-2 border rounded" required />
      <div className="flex justify-end space-x-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Save</button>
      </div>
    </form>
  )
}

export default AddressForm