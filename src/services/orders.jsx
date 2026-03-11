import api from './api'

export const createOrder = (orderData) => api.post('/customer/checkout', orderData)
export const getMyOrders = () => api.get('/customer/orders')
export const getOrder = (id) => api.get(`/customer/orders/${id}`)