import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

function mapOrder(o) {
  return {
    ...o,
    customer:       o.customerName ?? o.customer ?? '',
    expectedPickup: o.deliveryDate ?? o.expectedPickup ?? null,
    items:          o.items ?? [],
  }
}

const PER_PAGE = 25

export const useSalesOrderStore = defineStore('salesOrders', () => {
  const orders     = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/sales-orders', { params: { perPage: PER_PAGE, ...params } })
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

  const allOrders = computed(() => orders.value)

  const statusCounts = computed(() => ({
    draft:     orders.value.filter(o => o.status === 'draft').length,
    confirmed: orders.value.filter(o => o.status === 'confirmed' || o.status === 'approved').length,
    converted: orders.value.filter(o => o.status === 'converted' || o.status === 'fulfilled').length,
    cancelled: orders.value.filter(o => o.status === 'cancelled').length,
  }))

  async function createOrder(payload) {
    const { data } = await api.post('/sales-orders', {
      customerId:    payload.customerId ?? null,
      deliveryDate:  payload.expectedPickup ?? payload.deliveryDate ?? null,
      notes:         payload.notes ?? '',
      items:         (payload.items ?? []).map(i => ({
        productId: i.productId ?? i.id,
        quantity:  i.qty ?? i.quantity ?? 1,
        unitPrice: i.price ?? i.unitPrice ?? i.sellingPrice ?? 0,
      })),
    })
    const order = mapOrder(data.data)
    orders.value.unshift(order)
    return order.id
  }

  async function updateOrder(id, payload) {
    const { data } = await api.put(`/sales-orders/${id}`, {
      deliveryDate: payload.expectedPickup ?? payload.deliveryDate,
      notes:        payload.notes,
      items:        (payload.items ?? []).map(i => ({
        productId: i.productId ?? i.id,
        quantity:  i.qty ?? i.quantity ?? 1,
        unitPrice: i.price ?? i.unitPrice ?? i.sellingPrice ?? 0,
      })),
    })
    const updated = mapOrder(data.data)
    const idx = orders.value.findIndex(o => o.id === id)
    if (idx !== -1) orders.value[idx] = { ...orders.value[idx], ...updated }
    return true
  }

  async function confirmOrder(id) {
    await api.post(`/sales-orders/${id}/approve`)
    const order = orders.value.find(o => o.id === id)
    if (order) order.status = 'confirmed'
    return true
  }

  async function cancelOrder(id) {
    await api.post(`/sales-orders/${id}/cancel`)
    const order = orders.value.find(o => o.id === id)
    if (order) order.status = 'cancelled'
    return true
  }

  async function convertToSale(id, txnId) {
    const { data } = await api.post(`/sales-orders/${id}/convert`, { shiftId: txnId ?? null })
    const order = orders.value.find(o => o.id === id)
    if (order) {
      order.status       = 'converted'
      order.convertedTxn = data.data?.transactionId ?? txnId
    }
    return order?.items ?? []
  }

  function getOrder(id) { return orders.value.find(o => o.id === id) || null }

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return {
    orders, loading, allOrders, statusCounts, pagination,
    fetchAll, fetchPage, createOrder, updateOrder, confirmOrder, cancelOrder, convertToSale, getOrder,
  }
})
