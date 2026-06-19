import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

function mapEntry(e) {
  return {
    ...e,
    productId:   e.productId   ?? null,
    productName: e.productName ?? '',
    date:        e.createdAt   ?? e.date,
    qtyIn:       e.qtyIn       ?? 0,
    qtyOut:      e.qtyOut      ?? 0,
    balance:     e.balanceAfter ?? e.balance ?? 0,
    reference:   e.reference   ?? '',
    user:        e.user        ?? '',
  }
}

const PER_PAGE = 25

export const useLedgerStore = defineStore('ledger', () => {
  const entries    = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/inventory-ledger', { params: { perPage: PER_PAGE, ...params } })
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

  function getForProduct(productId) {
    return entries.value
      .filter(e => e.productId === productId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const allSorted = computed(() =>
    [...entries.value].sort((a, b) => new Date(b.date) - new Date(a.date))
  )

  // Backend logs all movements automatically; these are no-ops kept for compatibility
  function addEntry()       {}
  function logSale()        {}
  function logVoidReversal(){}
  function logReturn()      {}
  function logGrnReceipt()  {}
  function logAdjustment()  {}
  function logStockTake()   {}

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return {
    entries, allSorted, loading, pagination,
    fetchAll, fetchPage, getForProduct,
    addEntry, logSale, logVoidReversal, logReturn, logGrnReceipt, logAdjustment, logStockTake,
  }
})
