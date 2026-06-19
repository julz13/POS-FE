import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settings'
import api from '@/api'

// Map frontend payment method labels → API method values
const PAYMENT_METHOD_MAP = {
  'Cash':        'cash',
  'GCash':       'e_wallet',
  'Maya':        'e_wallet',
  'QR Ph':       'e_wallet',
  'Debit Card':  'card',
  'Credit Card': 'card',
  'Account':     'credit',
  'Store Credit':'store_credit',
  'Gift Voucher':'voucher',
}

export const usePosStore = defineStore('pos', () => {
  const cart                   = ref([])
  const transactionDiscount    = ref(0)
  const txnDiscountType        = ref(null)
  const txnDiscountTypeName    = ref('')
  const txnDiscountReason      = ref('')
  const txnDiscountIdNumber    = ref('')
  const txnDiscountOverriddenBy= ref(null)
  const heldTransactions       = ref([])
  const splitPayments          = ref([])
  const customer               = ref(null)

  const settings = ref({
    promptForReceipt:      true,
    skipCustomerField:     false,
    roundToTwoDecimals:    true,
    maxCashierDiscount:    10,
    maxManagerDiscount:    30,
  })

  const settingsStore = useSettingsStore()

  // ── Computed totals (unchanged) ──
  const subtotal = computed(() =>
    cart.value.reduce((sum, item) => {
      const lineTotal   = item.sellingPrice * item.qty
      const lineDiscount = (lineTotal * (item.lineDiscount || 0)) / 100
      return sum + lineTotal - lineDiscount
    }, 0)
  )

  const transactionDiscountAmount = computed(() =>
    parseFloat(((subtotal.value * transactionDiscount.value) / 100).toFixed(2))
  )

  const taxAmount = computed(() =>
    settingsStore.taxOnAmount(subtotal.value - transactionDiscountAmount.value)
  )

  const total = computed(() => {
    const raw = settingsStore.totalWithTax(subtotal.value - transactionDiscountAmount.value)
    return settingsStore.config.roundToTwoDecimals ? parseFloat(raw.toFixed(2)) : raw
  })

  const splitTotal    = computed(() => splitPayments.value.reduce((s, p) => s + (p.amount || 0), 0))
  const splitBalance  = computed(() => parseFloat((total.value - splitTotal.value).toFixed(2)))
  const splitComplete = computed(() => splitBalance.value <= 0)

  // ── Cart actions (unchanged) ──
  function addToCart(product) {
    const existing = cart.value.find(i => i.id === product.id)
    if (existing) {
      existing.qty++
    } else {
      cart.value.push({
        ...product, qty: 1,
        lineDiscount: 0, lineDiscountType: null, lineDiscountTypeName: '',
        lineDiscountReason: '', lineDiscountIdNumber: '', lineDiscountOverriddenBy: null,
      })
    }
  }

  function updateQty(productId, qty) {
    const item = cart.value.find(i => i.id === productId)
    if (!item) return
    if (qty <= 0) removeFromCart(productId)
    else item.qty = qty
  }

  function setLineDiscount(productId, pct) {
    const item = cart.value.find(i => i.id === productId)
    if (item) item.lineDiscount = Math.min(Math.max(0, pct), 100)
  }

  function setLineDiscountDetails(productId, { pct, type, typeName, reason, idNumber, overriddenBy }) {
    const item = cart.value.find(i => i.id === productId)
    if (!item) return
    item.lineDiscount             = Math.min(Math.max(0, pct), 100)
    item.lineDiscountType         = type || null
    item.lineDiscountTypeName     = typeName || ''
    item.lineDiscountReason       = reason || ''
    item.lineDiscountIdNumber     = idNumber || ''
    item.lineDiscountOverriddenBy = overriddenBy || null
  }

  function setTransactionDiscountDetails({ pct, type, typeName, reason, idNumber, overriddenBy }) {
    transactionDiscount.value          = Math.min(Math.max(0, pct), 100)
    txnDiscountType.value              = type || null
    txnDiscountTypeName.value          = typeName || ''
    txnDiscountReason.value            = reason || ''
    txnDiscountIdNumber.value          = idNumber || ''
    txnDiscountOverriddenBy.value      = overriddenBy || null
  }

  function clearLineDiscount(productId) {
    const item = cart.value.find(i => i.id === productId)
    if (!item) return
    item.lineDiscount = 0
    item.lineDiscountType = null; item.lineDiscountTypeName = ''
    item.lineDiscountReason = ''; item.lineDiscountIdNumber = ''; item.lineDiscountOverriddenBy = null
  }

  function clearTransactionDiscount() {
    transactionDiscount.value = 0
    txnDiscountType.value = null; txnDiscountTypeName.value = ''
    txnDiscountReason.value = ''; txnDiscountIdNumber.value = ''; txnDiscountOverriddenBy.value = null
  }

  function removeFromCart(productId) {
    cart.value = cart.value.filter(i => i.id !== productId)
  }

  // ── Split payment actions (unchanged) ──
  function addSplitPayment(method, customAmount) {
    const remaining = splitBalance.value
    if (remaining <= 0 && !customAmount) return
    splitPayments.value.push({
      id: Date.now(), method,
      amount:      parseFloat((customAmount ?? remaining).toFixed(2)),
      referenceNo: '',
      voucherCode: '',
    })
  }

  function addPaymentWithDetails({ method, amount, referenceNo = '', voucherCode = '' }) {
    splitPayments.value.push({
      id: Date.now(), method,
      amount: parseFloat(parseFloat(amount).toFixed(2)),
      referenceNo, voucherCode,
    })
  }

  function updateSplitAmount(id, amount) {
    const entry = splitPayments.value.find(p => p.id === id)
    if (entry) entry.amount = parseFloat(amount) || 0
  }

  function removeSplitPayment(id) {
    const pmt = splitPayments.value.find(p => p.id === id)
    if (pmt?.method === 'Gift Voucher' && pmt.voucherCode) {
      import('@/stores/vouchers').then(({ useVoucherStore }) => {
        useVoucherStore().restoreAmount(pmt.voucherCode, pmt.amount)
      })
    }
    splitPayments.value = splitPayments.value.filter(p => p.id !== id)
  }

  function clearSplit() {
    const gv = splitPayments.value.filter(p => p.method === 'Gift Voucher' && p.voucherCode)
    if (gv.length) {
      import('@/stores/vouchers').then(({ useVoucherStore }) => {
        const vs = useVoucherStore()
        gv.forEach(p => vs.restoreAmount(p.voucherCode, p.amount))
      })
    }
    splitPayments.value = []
  }

  // ── Hold / Resume (unchanged) ──
  function holdTransaction(reason = '') {
    if (!cart.value.length) return null
    const holdNumber = heldTransactions.value.length + 1
    const held = {
      id:                  Date.now(),
      holdNumber,
      heldAt:              new Date().toISOString(),
      reason,
      items:               cart.value.map(i => ({ ...i })),
      transactionDiscount: transactionDiscount.value,
      txnDiscountType:     txnDiscountType.value,
      txnDiscountTypeName: txnDiscountTypeName.value,
      customer:            customer.value,
    }
    heldTransactions.value.push(held)
    clearCart()
    return holdNumber
  }

  function resumeTransaction(id) {
    const held = heldTransactions.value.find(t => t.id === id)
    if (!held) return
    cart.value                = held.items
    transactionDiscount.value = held.transactionDiscount
    txnDiscountType.value     = held.txnDiscountType || null
    txnDiscountTypeName.value = held.txnDiscountTypeName || ''
    customer.value            = held.customer
    heldTransactions.value    = heldTransactions.value.filter(t => t.id !== id)
  }

  // ── Complete sale — posts to API, backend handles inventory/ledger/payments ──
  async function completeTransaction() {
    const { useShiftStore } = await import('@/stores/shifts')
    const shiftStore = useShiftStore()

    const payments = splitPayments.value.length
      ? [...splitPayments.value]
      : [{ method: 'Cash', amount: total.value }]

    const amountPaid = payments.reduce((s, p) => s + p.amount, 0)

    const payload = {
      shiftId:        shiftStore.activeShift?.id ?? null,
      customerId:     customer.value?.id ?? null,
      subtotal:       parseFloat(subtotal.value.toFixed(2)),
      total:          parseFloat(total.value.toFixed(2)),
      amountPaid:     parseFloat(amountPaid.toFixed(2)),
      discountTotal:  parseFloat(transactionDiscountAmount.value.toFixed(2)),
      discountTypeId: txnDiscountType.value ?? null,
      taxAmount:      parseFloat(taxAmount.value.toFixed(2)),
      items: cart.value.map(item => {
        const discountAmount = parseFloat(((item.sellingPrice * item.qty * (item.lineDiscount || 0)) / 100).toFixed(2))
        const lineTotal      = parseFloat((item.sellingPrice * item.qty - discountAmount).toFixed(2))
        return {
          productId:      item.id,
          productName:    item.name,
          sku:            item.sku ?? '',
          unit:           item.unit ?? 'pc',
          quantity:       item.qty,
          unitPrice:      item.sellingPrice,
          discountAmount,
          lineTotal,
        }
      }),
      payments: payments.map(p => ({
        paymentMethod: PAYMENT_METHOD_MAP[p.method] ?? p.method.toLowerCase().replace(' ', '_'),
        amount:        parseFloat(p.amount.toFixed(2)),
        reference:     p.referenceNo || p.voucherCode || null,
      })),
    }

    const { data } = await api.post('/transactions', payload)
    const txn = {
      ...data.data,
      amountPaid,
      change: parseFloat(data.data.changeGiven ?? (amountPaid - total.value).toFixed(2)),
    }

    // Refresh transaction list in background
    import('@/stores/transactions').then(({ useTransactionStore }) => {
      useTransactionStore().save(txn)
    })

    clearCart()
    return txn
  }

  function cashOut(amount, reason) {
    return {
      id:     `CASH-${String(Date.now()).slice(-5)}`,
      date:   new Date().toISOString(),
      type:   'cash_out',
      amount: parseFloat(amount),
      reason,
    }
  }

  function clearCart() {
    cart.value = []
    transactionDiscount.value = 0
    txnDiscountType.value = null; txnDiscountTypeName.value = ''
    txnDiscountReason.value = ''; txnDiscountIdNumber.value = ''; txnDiscountOverriddenBy.value = null
    customer.value = null
    splitPayments.value = []
  }

  return {
    cart, transactionDiscount,
    txnDiscountType, txnDiscountTypeName,
    heldTransactions, splitPayments,
    customer, settings,
    subtotal, transactionDiscountAmount, taxAmount, total,
    splitTotal, splitBalance, splitComplete,
    addToCart, updateQty, setLineDiscount, setLineDiscountDetails, clearLineDiscount,
    setTransactionDiscountDetails, clearTransactionDiscount, removeFromCart,
    addSplitPayment, addPaymentWithDetails, updateSplitAmount, removeSplitPayment, clearSplit,
    holdTransaction, resumeTransaction,
    completeTransaction, cashOut, clearCart,
  }
})
