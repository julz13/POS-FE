import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

const PER_PAGE = 25

export const useDiscountStore = defineStore('discounts', () => {
  const types      = ref([])
  const auditLog   = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchTypes(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/discount-types', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      types.value = page?.data ?? []
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

  function fetchPage(n) { return fetchTypes({ page: n }) }

  async function fetchAuditLog(params = {}) {
    try {
      const { data } = await api.get('/reports/audit-log', {
        params: { module: 'discounts', perPage: PER_PAGE, ...params },
      })
      auditLog.value = data.data?.data ?? data.data ?? []
    } catch { /* audit log is optional */ }
  }

  // ── Type management ──
  async function updateType(id, updates) {
    const { data } = await api.put(`/discount-types/${id}`, updates)
    const updated = data.data
    const t = types.value.find(t => t.id === id)
    if (t) Object.assign(t, updated)
  }

  async function toggleType(id) {
    const t = types.value.find(t => t.id === id)
    if (!t) return
    await updateType(id, { status: t.status === 'active' ? 'inactive' : 'active' })
  }

  async function addType(payload) {
    const { data } = await api.post('/discount-types', payload)
    types.value.push(data.data)
    return data.data
  }

  async function deleteType(id) {
    await api.delete(`/discount-types/${id}`)
    types.value = types.value.filter(t => t.id !== id)
  }

  function getType(id) { return types.value.find(t => t.id === id) || null }

  const activeTypes = computed(() =>
    types.value.filter(t => t.status === 'active' || t.active === true)
  )

  // Backend handles discount audit on transaction creation — these are no-ops
  function log() {}
  function logTransactionDiscounts() {}

  // ── Stats ──
  const totalDiscountsGiven = computed(() => auditLog.value.reduce((s, e) => s + (e.discountAmount ?? 0), 0))
  const discountsByType     = computed(() => {
    const map = {}
    auditLog.value.forEach(e => {
      const name = e.typeName ?? e.discountType ?? 'Unknown'
      if (!map[name]) map[name] = { count: 0, total: 0 }
      map[name].count++
      map[name].total += e.discountAmount ?? 0
    })
    return map
  })

  if (localStorage.getItem('pabili_token')) {
    fetchTypes().catch(() => {})
  }

  return {
    types, auditLog, activeTypes, loading, pagination,
    totalDiscountsGiven, discountsByType,
    fetchTypes, fetchPage, fetchAuditLog,
    updateType, toggleType, addType, deleteType, getType,
    log, logTransactionDiscounts,
  }
})
