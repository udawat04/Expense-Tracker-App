import { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const token = await SecureStore.getItemAsync('token')
      const saved = await SecureStore.getItemAsync('user')
      if (token && saved) {
        try {
          setUser(JSON.parse(saved))
        } catch {
          await SecureStore.deleteItemAsync('token')
          await SecureStore.deleteItemAsync('user')
        }
      }
      setLoading(false)
    })()
  }, [])

  const signup = async (email, password, name) => {
    const { user: u, token } = await api.auth.signup(email, password, name)
    await SecureStore.setItemAsync('token', token)
    await SecureStore.setItemAsync('user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const login = async (email, password) => {
    const { user: u, token } = await api.auth.login(email, password)
    await SecureStore.setItemAsync('token', token)
    await SecureStore.setItemAsync('user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync('token')
    await SecureStore.deleteItemAsync('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
