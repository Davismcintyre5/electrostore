import api from './api'

export const getProducts = (params) => api.get('/customer/products', { params })
export const getProduct = (id) => api.get(`/customer/products/${id}`)
export const getPromos = () => api.get('/customer/promos')