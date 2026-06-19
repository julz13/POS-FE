import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

function mapEntry(e) {
  return {
    ...e,
    timestamp: e.createdAt ?? e.timestamp,
    user:      e.userName  ?? e.user ?? 'System',
    userId:    e.userId    ?? null,
  }
}

const PER_PAGE = 25

export const useAuditStore = defineStore('audit', () => {
  const entries    = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/reports/audit-log', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      entries.value = (page?.data ?? []).map(mapEntry)
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

  // ── Stats ──
  const criticalToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return entries.value.filter(e => e.severity === 'critical' && (e.timestamp ?? '').slice(0, 10) === today).length
  })

  const byModule = computed(() => {
    const map = {}
    entries.value.forEach(e => { map[e.module] = (map[e.module] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  })

  // Backend handles all audit logging; these are no-ops kept for compatibility
  function log()                  {}
  function logLogin()             {}
  function logLogout()            {}
  function logVoid()              {}
  function logDiscount()          {}
  function logPriceOverride()     {}
  function logReturn()            {}
  function logShiftOpen()         {}
  function logShiftClose()        {}
  function logInventoryAdjustment(){}
  function logSettingsChange()    {}
  function logUserChange()        {}

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return {
    entries, loading, criticalToday, byModule, pagination,
    fetchAll, fetchPage,
    log, logLogin, logLogout, logVoid, logDiscount, logPriceOverride,
    logReturn, logShiftOpen, logShiftClose, logInventoryAdjustment,
    logSettingsChange, logUserChange,
  }
})
