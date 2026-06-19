import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const user         = ref(JSON.parse(localStorage.getItem('pabili_user')          || 'null'))
  const currentStore = ref(JSON.parse(localStorage.getItem('pabili_current_store') || 'null'))
  const stores       = ref([])

  const isAuthenticated = computed(() => !!user.value && !!localStorage.getItem('pabili_token'))
  const role            = computed(() => user.value?.role || null)

  function can(permission) {
    const permissions = {
      owner:   ['all'],
      manager: ['products', 'inventory', 'purchase_orders', 'reports', 'approve_discounts'],
      cashier: ['pos', 'receipts', 'returns'],
    }
    const userPerms = permissions[role.value] || []
    return userPerms.includes('all') || userPerms.includes(permission)
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    const { token, user: userData, currentStore: storeData, stores: storeList } = data.data

    user.value         = userData
    currentStore.value = storeData || null
    stores.value       = storeList || []

    localStorage.setItem('pabili_token', token)
    localStorage.setItem('pabili_user', JSON.stringify(userData))
    if (storeData?.id) {
      localStorage.setItem('pabili_store_id', storeData.id)
      localStorage.setItem('pabili_current_store', JSON.stringify(storeData))
    }

    return userData
  }

  async function logout() {
    try { await api.post('/auth/logout') } catch { /* token already invalid */ }
    user.value         = null
    currentStore.value = null
    stores.value       = []
    localStorage.removeItem('pabili_token')
    localStorage.removeItem('pabili_user')
    localStorage.removeItem('pabili_store_id')
    localStorage.removeItem('pabili_current_store')
  }

  async function refreshToken() {
    const { data } = await api.post('/auth/refresh')
    const { token, user: userData, currentStore: storeData } = data.data
    user.value         = userData
    currentStore.value = storeData || null
    localStorage.setItem('pabili_token', token)
    localStorage.setItem('pabili_user', JSON.stringify(userData))
    if (storeData?.id) {
      localStorage.setItem('pabili_store_id', storeData.id)
      localStorage.setItem('pabili_current_store', JSON.stringify(storeData))
    }
  }

  return { user, currentStore, stores, isAuthenticated, role, can, login, logout, refreshToken }
})
