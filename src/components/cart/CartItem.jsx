const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  const { product, quantity } = item

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return
    updateQuantity(product._id, newQuantity)
  }

  return (
    <div className="flex items-center border-b py-4">
      <img
        src={product.images?.[0] || 'https://via.placeholder.com/80'}
        alt={product.name}
        className="w-20 h-20 object-cover rounded"
      />
      <div className="ml-4 flex-1">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-gray-600">KES {product.price}</p>
        <div className="flex items-center mt-2">
          <button
            onClick={() => handleQuantityChange(quantity - 1)}
            className="bg-gray-200 px-2 py-1 rounded-l"
          >
            -
          </button>
          <span className="px-4 py-1 border-t border-b">{quantity}</span>
          <button
            onClick={() => handleQuantityChange(quantity + 1)}
            className="bg-gray-200 px-2 py-1 rounded-r"
          >
            +
          </button>
          <button
            onClick={() => removeFromCart(product._id)}
            className="ml-4 text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="text-right font-semibold">
        KES {product.price * quantity}
      </div>
    </div>
  )
}

export default CartItem