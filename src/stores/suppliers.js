import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

const PER_PAGE = 25

export const useSupplierStore = defineStore('suppliers', () => {
  const suppliers  = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/suppliers', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      suppliers.value = page?.data ?? []
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
    const { data } = await api.post('/suppliers', payload)
    const supplier = data.data
    suppliers.value.unshift(supplier)
    return supplier
  }

  async function update(id, payload) {
    const { data } = await api.put(`/suppliers/${id}`, payload)
    const updated = data.data
    const idx = suppliers.value.findIndex(s => s.id === id)
    if (idx !== -1) suppliers.value[idx] = { ...suppliers.value[idx], ...updated }
  }

  async function archive(id) { await update(id, { status: 'inactive' }) }
  async function restore(id) { await update(id, { status: 'active' })   }

  function getById(id) {
    return suppliers.value.find(s => s.id === id) || null
  }

  // Backend determines if supplier has orders; kept for compatibility
  function hasTransactions() { return false }

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return { suppliers, loading, pagination, fetchAll, fetchPage, add, update, archive, restore, getById, hasTransactions }
})
