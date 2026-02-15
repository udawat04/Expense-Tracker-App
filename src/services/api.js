import * as SecureStore from 'expo-secure-store'
import { API_URL } from '../config'

async function getToken() {
  return SecureStore.getItemAsync('token')
}

async function headers(includeAuth = true) {
  const h = { 'Content-Type': 'application/json' }
  if (includeAuth) {
    const token = await getToken()
    if (token) h.Authorization = `Bearer ${token}`
  }
  return h
}

export async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...(await headers(options.auth !== false)), ...options.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

export const api = {
  auth: {
    login: (email, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        auth: false,
      }),
    signup: (email, password, name) =>
      request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
        auth: false,
      }),
    forgotPassword: (email) =>
      request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
        auth: false,
      }),
    resetPassword: (token, newPassword) =>
      request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
        auth: false,
      }),
  },
  categories: {
    list: (type) => request(`/categories${type ? `?type=${type}` : ''}`),
    create: (name, type) =>
      request('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, type }),
      }),
  },
  transactions: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request(`/transactions${q ? `?${q}` : ''}`)
    },
    create: (data) =>
      request('/transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/transactions/${id}`, {
        method: 'DELETE',
      }),
  },
  seed: { run: () => request('/seed', { method: 'POST' }) },
  budgets: {
    list: (year, month) => {
      const params = new URLSearchParams()
      if (year) params.set('year', year)
      if (month) params.set('month', month)
      return request(`/budgets${params.toString() ? `?${params}` : ''}`)
    },
    create: (data) =>
      request('/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/budgets/${id}`, {
        method: 'DELETE',
      }),
    alerts: () => request('/budgets/alerts'),
  },
}
