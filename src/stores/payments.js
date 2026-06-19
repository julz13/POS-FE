import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const ELECTRONIC_TYPES = new Set(['GCash', 'Maya', 'QR Ph', 'Debit Card', 'Credit Card', 'e_wallet', 'card'])

function extractName(obj) {
  if (!obj || typeof obj !== 'object') return typeof obj === 'string' ? obj : ''
  return `${obj.firstName ?? obj.first_name ?? ''} ${obj.lastName ?? obj.last_name ?? ''}`.trim()
}

function mapPayment(p) {
  return {
    ...p,
    cashier:     extractName(p.cashier)  || p.cashierName || (typeof p.cashier  === 'string' ? p.cashier  : ''),
    paymentType: p.paymentMethod ?? p.paymentType,
    date:        p.createdAt ?? p.date,
    amount:      parseFloat(p.amount) || 0,
  }
}

const PER_PAGE = 25

export const usePaymentStore = defineStore('payments', () => {
  const payments   = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/payments', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      payments.value = (page?.data ?? []).map(mapPayment)
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

  // Called from pos store — backend already saved payments; just add to local list
  function saveForTransaction(txn) {
    ;(txn.payments ?? []).forEach(p => {
      payments.value.unshift(mapPayment({
        ...p,
        transactionId: txn.id,
        date:          txn.createdAt ?? txn.date ?? new Date().toISOString(),
        cashier:       txn.cashierName ?? txn.cashier ?? '',
        status:        'completed',
      }))
    })
  }

  async function voidPayment(id, { approvedBy, reason }) {
    await api.post(`/payments/${id}/void`, { reason })
    const pmt = payments.value.find(p => p.id === id)
    if (pmt) {
      pmt.status    = 'voided'
      pmt.voidedAt  = new Date().toISOString()
      pmt.voidedBy  = approvedBy
      pmt.voidReason = reason
    }
    return true
  }

  function voidAllForTransaction(txnId, { approvedBy, reason }) {
    payments.value
      .filter(p => p.transactionId === txnId && p.status !== 'voided')
      .forEach(p => {
        p.status     = 'voided'
        p.voidedAt   = new Date().toISOString()
        p.voidedBy   = approvedBy
        p.voidReason = reason
      })
  }

  function getById(id)          { return payments.value.find(p => p.id === id) || null }
  function getByTransaction(id) { return payments.value.filter(p => p.transactionId === id) }

  // ── Computed ──
  const completedPayments = computed(() => payments.value.filter(p => p.status === 'completed'))
  const voidedCount       = computed(() => payments.value.filter(p => p.status === 'voided').length)

  const totalByType = computed(() => {
    const map = {}
    completedPayments.value.forEach(p => {
      map[p.paymentType] = (map[p.paymentType] || 0) + p.amount
    })
    return map
  })

  const grandTotal = computed(() => completedPayments.value.reduce((s, p) => s + p.amount, 0))

  const todayPayments = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    return completedPayments.value.filter(p => (p.date ?? '').slice(0, 10) === today)
  })

  const todayCash       = computed(() => todayPayments.value.filter(p => p.paymentType === 'cash' || p.paymentType === 'Cash').reduce((s, p) => s + p.amount, 0))
  const todayElectronic = computed(() => todayPayments.value.filter(p => ELECTRONIC_TYPES.has(p.paymentType)).reduce((s, p) => s + p.amount, 0))
  const cashTotal       = computed(() => (totalByType.value['cash'] || totalByType.value['Cash'] || 0))
  const electronicTotal = computed(() => {
    let sum = 0
    ELECTRONIC_TYPES.forEach(t => { sum += totalByType.value[t] || 0 })
    return sum
  })

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return {
    payments, loading, completedPayments, voidedCount,
    totalByType, cashTotal, electronicTotal, grandTotal,
    todayPayments, todayCash, todayElectronic,
    pagination,
    fetchAll, fetchPage, saveForTransaction, voidPayment, voidAllForTransaction, getById, getByTransaction,
  }
})
