import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

function computeStatus(v) {
  if (v.status === 'cancelled') return 'cancelled'
  if (v.expiryDate && new Date(v.expiryDate) < new Date()) return 'expired'
  if ((v.balance ?? v.remainingBalance) <= 0) return 'redeemed'
  if ((v.balance ?? v.remainingBalance) < (v.amount ?? v.originalAmount)) return 'partially_used'
  return 'active'
}

function mapVoucher(v) {
  return {
    ...v,
    code:             v.voucherCode ?? v.code,
    originalAmount:   v.amount      ?? v.originalAmount ?? 0,
    remainingBalance: v.balance     ?? v.remainingBalance ?? 0,
    expiresAt:        v.expiryDate  ?? v.expiresAt ?? null,
    usageHistory:     v.usages      ?? v.usageHistory ?? [],
  }
}

const PER_PAGE = 25

export const useVoucherStore = defineStore('vouchers', () => {
  const vouchers   = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/vouchers', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      vouchers.value = (page?.data ?? []).map(mapVoucher)
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

  async function issue({ amount, expiresAt = null, issuedTo = null, notes = '', issuedBy }) {
    const { data } = await api.post('/vouchers', {
      amount,
      issuedBy,
      issuedDate: new Date().toISOString().slice(0, 10),
      expiryDate: expiresAt,
      notes,
    })
    const v = mapVoucher(data.data)
    vouchers.value.unshift(v)
    return v
  }

  // Local balance check — actual redemption happens server-side on transaction POST
  function redeem({ code, amount }) {
    const v = vouchers.value.find(v => v.code === code.trim().toUpperCase())
    if (!v) return { ok: false, error: 'Voucher code not found' }
    const status = computeStatus(v)
    if (status === 'expired')   return { ok: false, error: 'Voucher has expired' }
    if (status === 'cancelled') return { ok: false, error: 'Voucher has been cancelled' }
    if (status === 'redeemed')  return { ok: false, error: 'Voucher has been fully redeemed' }
    if (amount > v.remainingBalance) return { ok: false, error: `Insufficient balance — only ₱${v.remainingBalance.toFixed(2)} remaining` }
    if (amount <= 0) return { ok: false, error: 'Amount must be greater than zero' }
    // Temporarily deduct locally so split payment UI shows correct remaining
    v.remainingBalance = parseFloat((v.remainingBalance - amount).toFixed(2))
    return { ok: true, voucher: v }
  }

  // Restore locally if payment is removed from split before transaction is posted
  function restoreAmount(code, amount) {
    const v = vouchers.value.find(v => v.code === code.trim().toUpperCase())
    if (!v) return
    v.remainingBalance = parseFloat((v.remainingBalance + parseFloat(amount)).toFixed(2))
  }

  // No-op: server finalizes on transaction create
  function finalizeRedemption() {}

  function checkBalance(code) {
    const v = vouchers.value.find(v => v.code === code.trim().toUpperCase())
    if (!v) return { ok: false, error: 'Voucher code not found' }
    return { ok: true, voucher: v, computedStatus: computeStatus(v) }
  }

  async function cancel(id) {
    await api.post(`/vouchers/${id}/cancel`, { reason: 'Cancelled by staff' })
    const v = vouchers.value.find(v => v.id === id)
    if (v) v.status = 'cancelled'
    return true
  }

  function getById(id)  { return vouchers.value.find(v => v.id === id) || null }
  function getByCode(c) { return vouchers.value.find(v => v.code === c.trim().toUpperCase()) || null }

  // ── Live computed list with derived status ──
  const liveVouchers = computed(() => vouchers.value.map(v => ({ ...v, computedStatus: computeStatus(v) })))

  const activeVouchers   = computed(() => liveVouchers.value.filter(v => ['active', 'partially_used'].includes(v.computedStatus)))
  const outstandingValue = computed(() => activeVouchers.value.reduce((s, v) => s + v.remainingBalance, 0))
  const redeemedCount    = computed(() => liveVouchers.value.filter(v => v.computedStatus === 'redeemed').length)
  const totalIssued      = computed(() => vouchers.value.reduce((s, v) => s + v.originalAmount, 0))

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return {
    vouchers, liveVouchers, loading, pagination,
    activeVouchers, outstandingValue, redeemedCount, totalIssued,
    fetchAll, fetchPage, issue, redeem, restoreAmount, finalizeRedemption, checkBalance, cancel, getById, getByCode,
    computeStatus,
  }
})
