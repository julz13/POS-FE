import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

const STORAGE_KEY = 'pabili_active_shift'

function loadCached() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!s) return null
    // Evict cache entries that still hold raw Unix-second timestamps (numbers)
    if (typeof s.openedAt === 'number') { localStorage.removeItem(STORAGE_KEY); return null }
    return mapShift(s)
  } catch { return null }
}
function saveActive(shift) {
  if (shift) localStorage.setItem(STORAGE_KEY, JSON.stringify(shift))
  else       localStorage.removeItem(STORAGE_KEY)
}

function toDate(v) {
  if (!v) return null
  // API returns Unix timestamp in seconds (integer); strings are already valid dates
  return typeof v === 'number' ? new Date(v * 1000).toISOString() : v
}

function mapShift(s) {
  const cashierName = s.cashier
    ? `${s.cashier.firstName ?? ''} ${s.cashier.lastName ?? ''}`.trim()
    : (s.cashierName ?? '')

  return {
    ...s,
    cashierName,
    openingCash: parseFloat(s.openingCash ?? s.floatAmount ?? 0) || 0,
    openedAt:    toDate(s.openedAt) ?? toDate(s.createdAt),
    closedAt:    toDate(s.closedAt) ?? null,
    movements:   s.movements ?? [],
  }
}

const PER_PAGE = 25

export const useShiftStore = defineStore('shifts', () => {
  const activeShift  = ref(loadCached())
  const shiftHistory = ref([])
  const loading      = ref(false)
  const pagination   = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchHistory(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/shifts', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      shiftHistory.value = (page?.data ?? []).map(mapShift)
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

  function fetchPage(n) { return fetchHistory({ page: n }) }

  async function loadActiveShift() {
    try {
      const { data } = await api.get('/shifts/active/current')
      if (data.data) {
        activeShift.value = mapShift(data.data)
        saveActive(activeShift.value)
      } else {
        activeShift.value = null
        saveActive(null)
      }
    } catch {
      // No active shift or not authenticated yet
    }
  }

  async function openShift({ cashier, openingCash }) {
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    const { data } = await api.post('/shifts', {
      cashierId:   authStore.user?.id,
      openingCash: parseFloat(openingCash) || 0,
      notes:       cashier ? `Opened by ${cashier}` : '',
    })
    const shift = mapShift(data.data)
    activeShift.value = shift
    saveActive(shift)
    return shift.id
  }

  async function addMovement({ type, amount, reason, recordedBy }) {
    if (!activeShift.value) return null
    const { data } = await api.post(`/shifts/${activeShift.value.id}/movements`, {
      type,
      amount:    parseFloat(amount),
      reason,
      reference: recordedBy ?? '',
    })
    const mov = data.data
    activeShift.value.movements.push(mov)
    saveActive(activeShift.value)
    return mov
  }

  async function closeShift({ countedCash, closedBy, notes, expectedCash, cashSales, changeGiven }) {
    if (!activeShift.value) return null
    const { data } = await api.post(`/shifts/${activeShift.value.id}/close`, {
      countedCash: parseFloat(countedCash),
      notes:       notes || '',
    })
    const closed = {
      ...mapShift(data.data),
      cashSales:    parseFloat((cashSales || 0).toFixed(2)),
      changeGiven:  parseFloat((changeGiven || 0).toFixed(2)),
      expectedCash: parseFloat((expectedCash || 0).toFixed(2)),
      countedCash:  parseFloat(countedCash),
    }
    shiftHistory.value.unshift(closed)
    activeShift.value = null
    saveActive(null)
    return closed
  }

  // ── Computed ──
  const isOpen       = computed(() => !!activeShift.value && activeShift.value.status === 'open')
  const cashInTotal  = computed(() => (activeShift.value?.movements ?? []).filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0))
  const cashOutTotal = computed(() => (activeShift.value?.movements ?? []).filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0))

  if (localStorage.getItem('pabili_token')) {
    loadActiveShift().catch(() => {})
    fetchHistory().catch(() => {})
  }

  return {
    activeShift, shiftHistory, loading, pagination, isOpen, cashInTotal, cashOutTotal,
    loadActiveShift, fetchHistory, fetchPage, openShift, addMovement, closeShift,
  }
})
