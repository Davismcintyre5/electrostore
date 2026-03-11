import { useState, useEffect } from 'react'
import api from '../services/api'
import AddressList from '../components/addresses/AddressList'
import AddressForm from '../components/addresses/AddressForm'

const AddressesPage = () => {
  const [addresses, setAddresses] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    const res = await api.get('/customer/addresses')
    setAddresses(res.data)
  }

  const handleAdd = async (data) => {
    const res = await api.post('/customer/addresses', data)
    setAddresses([...addresses, res.data])
    setShowForm(false)
  }

  const handleEdit = async (updated) => {
    const res = await api.put(`/customer/addresses/${updated._id}`, updated)
    setAddresses(addresses.map(a => a._id === updated._id ? res.data : a))
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this address?')) {
      await api.delete(`/customer/addresses/${id}`)
      setAddresses(addresses.filter(a => a._id !== id))
    }
  }

  const handleSetDefault = async (id) => {
    await api.patch(`/customer/addresses/${id}/default`)
    setAddresses(addresses.map(a => ({
      ...a,
      isDefault: a._id === id ? true : false
    })))
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Addresses</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Add New Address
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">New Address</h2>
          <AddressForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {addresses.length === 0 ? (
        <p className="text-gray-500">You have no saved addresses.</p>
      ) : (
        <AddressList
          addresses={addresses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
        />
      )}
    </div>
  )
}

export default AddressesPage