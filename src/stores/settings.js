import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

const STORAGE_KEY = 'pabili_settings'

const defaults = {
  storeName:          'PabiliPOS Store',
  storeAddress:       '',
  storePhone:         '',
  storeEmail:         '',
  storeTIN:           '',
  currency:           'PHP',
  timezone:           'Asia/Manila',
  receiptHeader:      '',
  receiptFooter:      'Thank you for shopping!',
  taxEnabled:         false,
  taxName:            'VAT',
  taxRate:            12,
  taxType:            'exclusive',
  taxCalculation:     'per_item',
  showTaxOnReceipt:   true,
  taxExemptCategories: [],
  autoOpenSales:        true,
  autoSaveTransaction:  true,
  promptForReceipt:     true,
  enableHoldResume:     true,
  enableSplitPayment:   true,
  requireCustomer:      false,
  barcodeOnlyMode:      false,
  skipCustomerField:    true,
  roundToTwoDecimals:   true,
  maxCashierDiscount:   10,
  maxManagerDiscount:   30,
  requireManagerApprovalAbove: 5,
  canSellBelowCost:     false,
  paymentMethods: {
    cash: true, gcash: true, maya: true, qrph: true,
    debit: true, credit: true, storeCredit: true,
  },
  autoDeductStock:      true,
  allowNegativeStock:   false,
  enableStockAlerts:    true,
  enableReorderSuggestion: true,
  logTransactionChanges: true,
  logUserActions:        true,
  showLogoOnReceipt:     true,
  showCashierOnReceipt:  true,
  showCustomerOnReceipt: true,
  showTaxBreakdown:      true,
  showDiscountBreakdown: true,
  showBarcodeOnReceipt:  false,
  sessionTimeoutMinutes: 30,
}

export const useSettingsStore = defineStore('settings', () => {
  const saved  = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  const config = ref({ ...defaults, ...saved })

  async function fetchFromApi() {
    try {
      const { data } = await api.get('/settings')
      const remote = data.data ?? {}
      // Merge remote settings (API fields) into local config
      const merged = {
        storeName:    remote.storeName    ?? config.value.storeName,
        storeAddress: remote.storeAddress ?? config.value.storeAddress,
        storePhone:   remote.storePhone   ?? config.value.storePhone,
        storeEmail:   remote.storeEmail   ?? config.value.storeEmail,
        taxRate:      remote.taxRate      ?? config.value.taxRate,
        receiptFooter:remote.receiptFooter?? config.value.receiptFooter,
        currency:     remote.currency     ?? config.value.currency,
      }
      config.value = { ...config.value, ...merged }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
    } catch { /* use local defaults if API not reachable */ }
  }

  const taxMultiplier = computed(() => config.value.taxRate / 100)

  function taxOnAmount(amount) {
    if (!config.value.taxEnabled) return 0
    if (config.value.taxType === 'inclusive') {
      return parseFloat((amount - amount / (1 + taxMultiplier.value)).toFixed(2))
    }
    return parseFloat((amount * taxMultiplier.value).toFixed(2))
  }

  function totalWithTax(amount) {
    if (!config.value.taxEnabled) return amount
    if (config.value.taxType === 'inclusive') return amount
    return parseFloat((amount + taxOnAmount(amount)).toFixed(2))
  }

  async function save(updates) {
    config.value = { ...config.value, ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
    try {
      await api.put('/settings', {
        storeName:     config.value.storeName,
        storeAddress:  config.value.storeAddress,
        storePhone:    config.value.storePhone,
        storeEmail:    config.value.storeEmail,
        taxRate:       config.value.taxRate,
        receiptFooter: config.value.receiptFooter,
        currency:      config.value.currency,
      })
    } catch { /* best-effort remote sync */ }
  }

  function reset() {
    config.value = { ...defaults }
    localStorage.removeItem(STORAGE_KEY)
  }

  if (localStorage.getItem('pabili_token')) {
    fetchFromApi().catch(() => {})
  }

  return { config, taxMultiplier, taxOnAmount, totalWithTax, save, reset, fetchFromApi }
})
