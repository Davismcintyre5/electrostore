import { useState } from 'react'
import AddressForm from './AddressForm'

const AddressList = ({ addresses, onEdit, onDelete, onSetDefault }) => {
  const [editingId, setEditingId] = useState(null)

  return (
    <div className="space-y-4">
      {addresses.map(addr => (
        <div key={addr._id} className="border p-4 rounded-lg">
          {editingId === addr._id ? (
            <AddressForm
              address={addr}
              onSave={(updated) => {
                onEdit(updated)
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium">{addr.label}</span>
                  {addr.isDefault && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Default</span>}
                  <p className="text-gray-700 mt-1">{addr.recipientName}</p>
                  <p className="text-gray-600">{addr.addressLine1}</p>
                  {addr.addressLine2 && <p className="text-gray-600">{addr.addressLine2}</p>}
                  <p className="text-gray-600">{addr.city}, {addr.state} {addr.postalCode}</p>
                  <p className="text-gray-600">{addr.country}</p>
                  <p className="text-gray-600 mt-1">{addr.phone}</p>
                </div>
                <div className="flex space-x-2">
                  {!addr.isDefault && (
                    <button
                      onClick={() => onSetDefault(addr._id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => setEditingId(addr._id)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(addr._id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default AddressList