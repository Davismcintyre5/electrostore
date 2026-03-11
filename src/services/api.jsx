import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Prevent infinite loop: only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api