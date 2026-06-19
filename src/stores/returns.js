import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

function mapReturn(r) {
  return {
    ...r,
    id:           r.returnNumber ?? r.id,
    date:         r.createdAt ?? r.date,
    refundAmount: r.totalAmount ?? r.refundAmount ?? 0,
    items:        r.items ?? [],
    auditLog:     r.auditLog ?? [],
  }
}

const PER_PAGE = 25

export const useReturnStore = defineStore('returns', () => {
  const returns    = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/returns', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      returns.value = (page?.data ?? []).map(mapReturn)
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

  async function createReturn({ transactionId, reason, items, refundMethod }) {
    const { data } = await api.post('/returns', {
      transactionId,
      reason,
      refundMethod: refundMethod ?? 'cash',
      items: items.map(i => ({
        transactionItemId: i.transactionItemId ?? i.id,
        quantity:          i.returnQty ?? i.quantity ?? 1,
        reason:            i.reason ?? reason,
      })),
    })
    const ret = mapReturn(data.data)
    returns.value.unshift(ret)
    return ret.id
  }

  async function approveReturn(id, { approvedBy, note = '' }) {
    await api.post(`/returns/${id}/approve`, { notes: note || 'Approved' })
    const r = returns.value.find(r => r.id === id)
    if (r) {
      r.status     = 'approved'
      r.approvedBy = approvedBy
      r.approvedAt = new Date().toISOString()
    }
    return true
  }

  async function completeReturn(id, { completedBy }) {
    await api.post(`/returns/${id}/complete`, { refundDate: new Date().toISOString().slice(0, 10) })
    const r = returns.value.find(r => r.id === id)
    if (r) {
      r.status      = 'completed'
      r.completedBy = completedBy
      r.completedAt = new Date().toISOString()
    }
    return true
  }

  async function rejectReturn(id, { rejectedBy, rejectReason }) {
    await api.post(`/returns/${id}/reject`, { reason: rejectReason })
    const r = returns.value.find(r => r.id === id)
    if (r) {
      r.status       = 'rejected'
      r.rejectedBy   = rejectedBy
      r.rejectedAt   = new Date().toISOString()
      r.rejectReason = rejectReason
    }
    return true
  }

  function getById(id) { return returns.value.find(r => r.id === id) || null }

  // ── Stats ──
  const statusCounts = computed(() => ({
    pending:   returns.value.filter(r => r.status === 'pending').length,
    approved:  returns.value.filter(r => r.status === 'approved').length,
    completed: returns.value.filter(r => r.status === 'completed').length,
    rejected:  returns.value.filter(r => r.status === 'rejected').length,
  }))

  const totalRefunded = computed(() =>
    returns.value.filter(r => r.status === 'completed').reduce((s, r) => s + r.refundAmount, 0)
  )

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return {
    returns, loading, statusCounts, totalRefunded, pagination,
    fetchAll, fetchPage, createReturn, approveReturn, completeReturn, rejectReturn, getById,
  }
})
