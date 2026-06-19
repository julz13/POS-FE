import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

function computeStatus(q) {
  if (q.status === 'converted' || q.status === 'cancelled') return q.status
  if (q.expiryDate && new Date(q.expiryDate) < new Date()) return 'expired'
  return q.status
}

function mapQuote(q) {
  return {
    ...q,
    validUntil: q.expiryDate  ?? q.validUntil,
    customer:   q.customerName ?? q.customer ?? '',
    items:      q.items ?? [],
  }
}

const PER_PAGE = 25

export const useQuoteStore = defineStore('quotes', () => {
  const quotes     = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/quotes', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      quotes.value = (page?.data ?? []).map(mapQuote)
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

  function lineTotal(item) {
    const base = (item.price ?? item.unitPrice ?? 0) * (item.qty ?? item.quantity ?? 0)
    return base - (base * (item.lineDiscount || 0)) / 100
  }
  function quoteTotal(q) { return (q.items ?? []).reduce((s, i) => s + lineTotal(i), 0) }

  async function createQuote({ customer, phone, items, validUntil, notes, customerId }) {
    const { data } = await api.post('/quotes', {
      customerId:  customerId ?? null,
      expiryDate:  validUntil ?? null,
      notes:       notes ?? '',
      items:       items.map(i => ({
        productId: i.productId ?? i.id,
        quantity:  i.qty ?? i.quantity ?? 1,
        unitPrice: i.price ?? i.unitPrice ?? i.sellingPrice ?? 0,
      })),
    })
    const q = mapQuote(data.data)
    quotes.value.unshift(q)
    return q.id
  }

  async function updateQuote(id, payload) {
    const { data } = await api.put(`/quotes/${id}`, {
      expiryDate: payload.validUntil,
      notes:      payload.notes,
      items:      (payload.items ?? []).map(i => ({
        productId: i.productId ?? i.id,
        quantity:  i.qty ?? i.quantity ?? 1,
        unitPrice: i.price ?? i.unitPrice ?? i.sellingPrice ?? 0,
      })),
    })
    const updated = mapQuote(data.data)
    const idx = quotes.value.findIndex(q => q.id === id)
    if (idx !== -1) quotes.value[idx] = { ...quotes.value[idx], ...updated }
    return true
  }

  function markSent(id) {
    const q = quotes.value.find(q => q.id === id)
    if (q) q.status = 'sent'
  }

  async function convertToSale(id, txnId) {
    const { data } = await api.post(`/quotes/${id}/convert`, { shiftId: txnId ?? null })
    const q = quotes.value.find(q => q.id === id)
    if (q) {
      q.status         = 'converted'
      q.convertedTxnId = data.data?.transactionId ?? txnId ?? 'pending'
    }
    return quotes.value.find(q => q.id === id)?.items ?? []
  }

  async function cancelQuote(id) {
    await api.delete(`/quotes/${id}`)
    const q = quotes.value.find(q => q.id === id)
    if (q) q.status = 'cancelled'
  }

  function getById(id) { return quotes.value.find(q => q.id === id) || null }

  const liveQuotes = computed(() => quotes.value.map(q => ({ ...q, computedStatus: computeStatus(q) })))

  const statusCounts = computed(() => ({
    draft:     liveQuotes.value.filter(q => q.computedStatus === 'draft').length,
    sent:      liveQuotes.value.filter(q => q.computedStatus === 'sent').length,
    expired:   liveQuotes.value.filter(q => q.computedStatus === 'expired').length,
    converted: liveQuotes.value.filter(q => q.computedStatus === 'converted').length,
  }))

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return {
    quotes: liveQuotes, loading, statusCounts, pagination,
    fetchAll, fetchPage, createQuote, updateQuote, markSent, convertToSale, cancelQuote, getById,
    lineTotal, quoteTotal,
  }
})
