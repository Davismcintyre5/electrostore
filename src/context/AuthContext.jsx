import { createContext, useState, useEffect, useContext } from 'react'
import api from '../services/api'
import { login as apiLogin, register as apiRegister } from '../services/auth'

export const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async (token) => {
    try {
      api.defaults.headers.Authorization = `Bearer ${token}`
      const res = await api.get('/auth/me')
      if (res.data.role !== 'customer') {
        throw new Error('Invalid user role')
      }
      setUser(res.data)
    } catch (err) {
      console.error('Failed to fetch user:', err.response?.data || err.message)
      // If token is invalid, clear it
      localStorage.removeItem('token')
      delete api.defaults.headers.Authorization
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    fetchUser(token)
  }, []) // Run once on mount

  const login = async (email, password) => {
    const res = await apiLogin(email, password)
    const { token, user, requiresPasswordChange } = res.data

    if (user.role !== 'customer') {
      throw new Error('Only customers can log in here')
    }

    localStorage.setItem('token', token)
    api.defaults.headers.Authorization = `Bearer ${token}`
    setUser(user)
    return { requiresPasswordChange }
  }

  const register = async (userData) => {
    const res = await apiRegister(userData)
    const { token, user } = res.data
    localStorage.setItem('token', token)
    api.defaults.headers.Authorization = `Bearer ${token}`
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.Authorization
    setUser(null)
  }

  const value = { user, login, register, logout, loading }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}