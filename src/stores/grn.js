import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

function mapItem(i) {
  return {
    ...i,
    receivedQty: i.quantityReceived ?? i.receivedQty ?? 0,
    costPrice:   i.unitCost ?? i.costPrice ?? 0,
  }
}

function mapGrn(g) {
  return {
    ...g,
    grnNumber: g.grnNumber ?? g.id,
    items:     (g.items ?? []).map(mapItem),
  }
}

const PER_PAGE = 25

export const useGrnStore = defineStore('grn', () => {
  const grns       = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/goods-received-notes', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      grns.value = (page?.data ?? []).map(mapGrn)
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

  const postedCount = computed(() => grns.value.filter(g => g.status === 'posted').length)

  function lineTotal(item) {
    const base = item.receivedQty * item.costPrice
    return parseFloat((base + base * (item.tax || 0) / 100).toFixed(2))
  }
  function grnTotal(grn) {
    return (grn.items ?? []).reduce((s, i) => s + lineTotal(i), 0)
  }

  // Create GRN (backend posts and updates inventory automatically)
  async function create(payload) {
    const body = {
      purchaseOrderId: payload.purchaseOrderId,
      receivedDate:    payload.receivedDate,
      invoiceNumber:   payload.invoiceNumber,
      notes:           payload.notes,
      items:           (payload.items ?? []).map(i => ({
        purchaseOrderItemId: i.purchaseOrderItemId ?? i.id,
        quantityReceived:    i.receivedQty ?? i.quantityReceived,
        notes:               i.notes ?? '',
      })),
    }
    const { data } = await api.post('/goods-received-notes', body)
    const grn = mapGrn(data.data)
    grns.value.unshift(grn)
    return grn
  }

  async function postGrn(id) {
    const { data } = await api.post(`/goods-received-notes/${id}/post`)
    const idx = grns.value.findIndex(g => g.id === id)
    if (idx !== -1) grns.value[idx].status = data.data?.status ?? 'posted'
  }

  // Kept for signature compatibility — no void endpoint in current API
  async function voidGRN() {
    throw new Error('Void GRN is not supported in the current API version')
  }

  function getById(id) {
    return grns.value.find(g => g.id === id) || null
  }

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return { grns, loading, postedCount, pagination, lineTotal, grnTotal, fetchAll, fetchPage, create, postGrn, voidGRN, getById }
})
