import api from './api'

export const getAddresses = () => api.get('/customer/addresses')
export const createAddress = (data) => api.post('/customer/addresses', data)
export const updateAddress = (id, data) => api.put(`/customer/addresses/${id}`, data)
export const setDefaultAddress = (id) => api.patch(`/customer/addresses/${id}/default`)
export const deleteAddress = (id) => api.delete(`/customer/addresses/${id}`)