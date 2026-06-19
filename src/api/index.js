import axios from 'axios'

// ── Key converters ──────────────────────────────────────────────────────────
const toCamel = s => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
const toSnake = s => s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)

function deepCamel(obj) {
  if (Array.isArray(obj)) return obj.map(deepCamel)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), deepCamel(v)]))
  }
  return obj
}

function deepSnake(obj) {
  if (Array.isArray(obj)) return obj.map(deepSnake)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toSnake(k), deepSnake(v)]))
  }
  return obj
}

// ── Axios instance ──────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// Outgoing: attach auth + store headers, convert body keys to snake_case
api.interceptors.request.use(config => {
  const token   = localStorage.getItem('pabili_token')
  const storeId = localStorage.getItem('pabili_store_id')
  if (token)   config.headers.Authorization = `Bearer ${token}`
  if (storeId) config.headers['X-Store-Id'] = storeId
  if (config.data && typeof config.data === 'object') {
    config.data = deepSnake(config.data)
  }
  if (config.params && typeof config.params === 'object') {
    config.params = deepSnake(config.params)
  }
  return config
})

// Incoming: convert response keys to camelCase, handle 401 globally
api.interceptors.response.use(
  res => {
    if (res.data) res.data = deepCamel(res.data)
    return res
  },
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pabili_token')
      localStorage.removeItem('pabili_user')
      localStorage.removeItem('pabili_store_id')
      localStorage.removeItem('pabili_current_store')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api
