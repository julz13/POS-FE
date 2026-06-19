import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

function todayStr()  { return new Date().toISOString().slice(0, 10) }
function monthStr()  {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function extractName(obj) {
  if (!obj || typeof obj !== 'object') return typeof obj === 'string' ? obj : ''
  return `${obj.firstName ?? obj.first_name ?? ''} ${obj.lastName ?? obj.last_name ?? ''}`.trim()
}

function mapTxn(t) {
  return {
    ...t,
    cashier:  extractName(t.cashier)  || t.cashierName || '',
    customer: extractName(t.customer) || t.customerName || (typeof t.customer === 'string' ? t.customer : ''),
    date:          t.createdAt ?? t.date,
    total:         parseFloat(t.totalAmount    ?? t.total    ?? 0) || 0,
    subtotal:      parseFloat(t.subtotal       ?? t.subtotalAmount ?? 0) || 0,
    discountTotal: parseFloat(t.discountTotal  ?? t.transactionDiscount ?? 0) || 0,
    taxAmount:     parseFloat(t.taxAmount      ?? 0) || 0,
    items: (t.items ?? []).map(i => ({
      ...i,
      quantity:       parseFloat(i.quantity      ?? i.qty           ?? 0) || 0,
      unitPrice:      parseFloat(i.unitPrice     ?? i.sellingPrice  ?? 0) || 0,
      lineTotal:      parseFloat(i.lineTotal     ?? 0) || 0,
      discountAmount: parseFloat(i.discountAmount ?? 0) || 0,
    })),
    payments: (t.payments ?? []).map(p => ({
      ...p,
      amount: parseFloat(p.amount ?? 0) || 0,
    })),
    returns: t.returns ?? [],
  }
}

const PER_PAGE = 25

export const useTransactionStore = defineStore('transactions', () => {
  const transactions = ref([])
  const loading      = ref(false)
  const pagination   = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/transactions', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      transactions.value = (page?.data ?? []).map(mapTxn)
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

  // Called from pos store after a successful API transaction creation
  function save(txn) {
    transactions.value.unshift(mapTxn(txn))
  }

  async function voidTransaction(id, { approvedBy, reason }) {
    const { data } = await api.post(`/transactions/${id}/void`, { reason })
    const idx = transactions.value.findIndex(t => t.id === id)
    if (idx !== -1) {
      transactions.value[idx] = {
        ...transactions.value[idx],
        status:    data.data?.status ?? 'voided',
        voidedAt:  data.data?.voidedAt ?? new Date().toISOString(),
        voidedBy:  approvedBy,
        voidReason: reason,
      }
    }
    return true
  }

  function addReturn(txnId, returnRef) {
    const txn = transactions.value.find(t => t.id === txnId)
    if (txn) txn.returns.push(returnRef)
  }

  function getById(id) {
    if (!id) return null
    const q = id.toString().toUpperCase()
    return transactions.value.find(t =>
      t.id?.toString() === q ||
      t.receiptNumber?.toUpperCase() === q
    ) || null
  }

  // ── Computed stats ──
  const completedTransactions = computed(() =>
    transactions.value.filter(t => t.status === 'completed')
  )
  const todayTransactions = computed(() => {
    const today = todayStr()
    return completedTransactions.value.filter(t => (t.date ?? '').slice(0, 10) === today)
  })
  const monthTransactions = computed(() => {
    const month = monthStr()
    return completedTransactions.value.filter(t => (t.date ?? '').slice(0, 7) === month)
  })
  const todaySales   = computed(() => todayTransactions.value.reduce((s, t) => s + t.total, 0))
  const monthlySales = computed(() => monthTransactions.value.reduce((s, t) => s + t.total, 0))
  const todayCount   = computed(() => todayTransactions.value.length)
  const monthCount   = computed(() => monthTransactions.value.length)
  const voidedCount  = computed(() => transactions.value.filter(t => t.status === 'voided').length)

  const topProducts = computed(() => {
    const map = {}
    completedTransactions.value.forEach(t => {
      (t.items ?? []).forEach(item => {
        const name = item.productName ?? item.name ?? ''
        if (!map[name]) map[name] = { name, sold: 0, revenue: 0 }
        map[name].sold    += item.quantity ?? item.qty ?? 0
        map[name].revenue += (item.unitPrice ?? item.sellingPrice ?? 0) * (item.quantity ?? item.qty ?? 0)
      })
    })
    return Object.values(map).sort((a, b) => b.sold - a.sold).slice(0, 5)
  })

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return {
    transactions, loading, completedTransactions,
    todayTransactions, monthTransactions,
    todaySales, monthlySales, todayCount, monthCount, voidedCount, topProducts,
    pagination,
    fetchAll, fetchPage, save, voidTransaction, addReturn, getById,
    normalize: mapTxn,
  }
})
