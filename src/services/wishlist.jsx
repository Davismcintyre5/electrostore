import api from './api'

export const getWishlist = () => api.get('/customer/wishlist')
export const addToWishlist = (productId) => api.post('/customer/wishlist', { productId })
export const removeFromWishlist = (productId) => api.delete(`/customer/wishlist/${productId}`)