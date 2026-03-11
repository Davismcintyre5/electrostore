import api from './api'

export const getCart = () => api.get('/customer/cart')
export const addToCart = (productId, quantity) => api.post('/customer/cart', { productId, quantity })
export const updateCartItem = (productId, quantity) => api.put('/customer/cart', { productId, quantity })
export const removeFromCart = (productId) => api.delete(`/customer/cart/${productId}`)