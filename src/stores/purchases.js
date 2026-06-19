import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

// Map API PO item fields → what pages expect
function mapItem(i) {
  return {
    ...i,
    qty:       i.quantity  ?? i.qty  ?? 0,
    costPrice: i.unitCost  ?? i.costPrice ?? 0,
    receivedQty: i.quantityReceived ?? i.receivedQty ?? 0,
  }
}

function mapOrder(o) {
  return {
    ...o,
    poNumber: o.poNumber ?? o.id,
    items:    (o.items ?? []).map(mapItem),
  }
}

const PER_PAGE = 25

export const usePurchaseStore = defineStore('purchases', () => {
  const orders     = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/purchase-orders', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      orders.value = (page?.data ?? []).map(mapOrder)
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

  // ── Computed ──
  const pendingCount = computed(() =>
    orders.value.filter(o => ['submitted', 'approved', 'partially_received'].includes(o.status)).length
  )

  // ── Line helpers (local calculations, unchanged) ──
  function lineSubtotal(item) {
    const base = item.qty * item.costPrice
    return base - (base * (item.discount || 0) / 100)
  }
  function lineTax(item) {
    return lineSubtotal(item) * (item.tax || 0) / 100
  }
  function lineTotal(item) {
    return lineSubtotal(item) + lineTax(item)
  }
  function orderTotal(order) {
    return (order.items ?? []).reduce((s, i) => s + lineTotal(i), 0)
  }

  // ── CRUD ──
  async function create(payload) {
    const { data } = await api.post('/purchase-orders', {
      supplierId:   payload.supplierId,
      deliveryDate: payload.deliveryDate,
      notes:        payload.notes,
      items:        (payload.items ?? []).map(i => ({
        productId: i.productId,
        quantity:  i.qty ?? i.quantity,
        unitCost:  i.costPrice ?? i.unitCost,
      })),
    })
    const order = mapOrder(data.data)
    orders.value.unshift(order)
    return order
  }

  async function update(id, payload) {
    const { data } = await api.put(`/purchase-orders/${id}`, payload)
    const updated = mapOrder(data.data)
    const idx = orders.value.findIndex(o => o.id === id)
    if (idx !== -1) orders.value[idx] = { ...orders.value[idx], ...updated }
  }

  // API combines draft→approved in one step; submit proxies to approve
  async function submit(id)  { await approve(id) }

  async function approve(id) {
    const { data } = await api.post(`/purchase-orders/${id}/approve`)
    const idx = orders.value.findIndex(o => o.id === id)
    if (idx !== -1) orders.value[idx].status = data.data?.status ?? 'approved'
  }

  async function cancel(id) {
    await api.post(`/purchase-orders/${id}/cancel`)
    const idx = orders.value.findIndex(o => o.id === id)
    if (idx !== -1) orders.value[idx].status = 'cancelled'
  }

  function getById(id) {
    return orders.value.find(o => o.id === id) || null
  }

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return {
    orders, loading, pendingCount, pagination,
    lineSubtotal, lineTax, lineTotal, orderTotal,
    fetchAll, fetchPage, create, update, submit, approve, cancel, getById,
  }
})
