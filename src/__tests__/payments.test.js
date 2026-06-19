import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePaymentStore, ELECTRONIC_TYPES } from '@/stores/payments'

vi.mock('@/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(() => Promise.resolve({ data: { data: { data: [] } } })),
  }
}))

describe('Payment Store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('ELECTRONIC_TYPES', () => {
    it('includes common electronic payment methods', () => {
      expect(ELECTRONIC_TYPES.has('GCash')).toBe(true)
      expect(ELECTRONIC_TYPES.has('Maya')).toBe(true)
      expect(ELECTRONIC_TYPES.has('QR Ph')).toBe(true)
      expect(ELECTRONIC_TYPES.has('Debit Card')).toBe(true)
      expect(ELECTRONIC_TYPES.has('Credit Card')).toBe(true)
    })

    it('does not include cash', () => {
      expect(ELECTRONIC_TYPES.has('cash')).toBe(false)
      expect(ELECTRONIC_TYPES.has('Cash')).toBe(false)
    })
  })

  describe('mapPayment — field normalization', () => {
    it('normalizes paymentMethod to paymentType', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, paymentMethod: 'GCash', amount: '100', createdAt: '2025-01-01' }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = usePaymentStore()
      await store.fetchAll()

      expect(store.payments[0].paymentType).toBe('GCash')
    })

    it('parses amount as float', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, paymentMethod: 'cash', amount: '328.50' }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = usePaymentStore()
      await store.fetchAll()

      expect(store.payments[0].amount).toBe(328.5)
    })

    it('extracts cashier name from nested object', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, cashier: { firstName: 'Juan', lastName: 'Cruz' }, paymentMethod: 'cash', amount: '100' }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = usePaymentStore()
      await store.fetchAll()

      expect(store.payments[0].cashier).toBe('Juan Cruz')
    })

    it('uses cashierName fallback when cashier is not an object', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, cashierName: 'Maria Santos', paymentMethod: 'cash', amount: '50' }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = usePaymentStore()
      await store.fetchAll()

      expect(store.payments[0].cashier).toBe('Maria Santos')
    })
  })

  describe('computed — completedPayments', () => {
    it('filters only completed payments', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [
            { id: 1, status: 'completed', paymentMethod: 'cash', amount: '100' },
            { id: 2, status: 'voided', paymentMethod: 'cash', amount: '50' },
            { id: 3, status: 'completed', paymentMethod: 'GCash', amount: '200' },
          ],
          currentPage: 1, lastPage: 1, total: 3, perPage: 25, from: 1, to: 3,
        }}
      })

      const store = usePaymentStore()
      await store.fetchAll()

      expect(store.completedPayments).toHaveLength(2)
      expect(store.completedPayments.every(p => p.status === 'completed')).toBe(true)
    })
  })

  describe('computed — grandTotal', () => {
    it('sums all completed payment amounts', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [
            { id: 1, status: 'completed', paymentMethod: 'cash', amount: '100' },
            { id: 2, status: 'voided', paymentMethod: 'cash', amount: '999' },
            { id: 3, status: 'completed', paymentMethod: 'GCash', amount: '200' },
          ],
          currentPage: 1, lastPage: 1, total: 3, perPage: 25, from: 1, to: 3,
        }}
      })

      const store = usePaymentStore()
      await store.fetchAll()

      expect(store.grandTotal).toBe(300)
    })
  })

  describe('computed — voidedCount', () => {
    it('counts voided payments', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [
            { id: 1, status: 'completed', paymentMethod: 'cash', amount: '100' },
            { id: 2, status: 'voided', paymentMethod: 'cash', amount: '50' },
            { id: 3, status: 'voided', paymentMethod: 'cash', amount: '30' },
          ],
          currentPage: 1, lastPage: 1, total: 3, perPage: 25, from: 1, to: 3,
        }}
      })

      const store = usePaymentStore()
      await store.fetchAll()

      expect(store.voidedCount).toBe(2)
    })
  })
})
