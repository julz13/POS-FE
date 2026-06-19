import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

// Map API customer fields → fields pages already expect
function mapCustomer(c) {
  return {
    ...c,
    code:               c.customerCode ?? c.code,
    currentBalance:     c.creditBalance ?? c.currentBalance ?? 0,
    storeCreditBalance: c.storeCreditBalance ?? 0,
    totalSpent:         c.totalSpent ?? 0,
  }
}

const PER_PAGE = 25

export const useCustomerStore = defineStore('customers', () => {
  const customers  = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/customers', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      customers.value = (page?.data ?? []).map(mapCustomer)
      pagination.value = {
        currentPage: page?.currentPage ?? 1,
        lastPage:    page?.lastPage    ?? 1,
        total:       page?.total       ?? 0,
        perPage:     page?.perPage     ?? PER_PAGE,
        from:        page?.from        ?? 0,
        to:          page?.to          ?? 0,
      }
    } finally {
      loading.value = false
    }
  }

  function fetchPage(n) { return fetchAll({ page: n }) }

  async function add(payload) {
    const { data } = await api.post('/customers', payload)
    const customer = mapCustomer(data.data)
    customers.value.unshift(customer)
    return customer
  }

  async function update(id, payload) {
    const { data } = await api.put(`/customers/${id}`, payload)
    const updated = mapCustomer(data.data)
    const idx = customers.value.findIndex(c => c.id === id)
    if (idx !== -1) customers.value[idx] = { ...customers.value[idx], ...updated }
  }

  async function archive(id) { await update(id, { status: 'inactive' }) }
  async function restore(id) { await update(id, { status: 'active' })   }

  function getById(id) {
    return customers.value.find(c => c.id === id) || null
  }

  async function search(query) {
    if (!query?.trim()) return []
    const { data } = await api.get(`/customers/search/${encodeURIComponent(query)}`)
    return (data.data ?? []).map(mapCustomer)
  }

  async function fastRegister({ firstName, lastName, phone, customerType = 'regular' }) {
    return add({ firstName, lastName, phone, customerType })
  }

  // Backend tracks purchase history via transactions; kept for compatibility
  function recordPurchase() {}

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return {
    customers, loading, pagination,
    fetchAll, fetchPage, add, update, archive, restore, getById, search, fastRegister, recordPurchase,
  }
})
