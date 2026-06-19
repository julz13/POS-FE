import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTransactionStore } from '@/stores/transactions'

vi.mock('@/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(() => Promise.resolve({ data: { data: { data: [] } } })),
  }
}))

describe('Transaction Store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('mapTxn — field normalization', () => {
    it('extracts cashier name from nested object', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, cashier: { firstName: 'Juan', lastName: 'Cruz' }, totalAmount: '500', items: [], payments: [] }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useTransactionStore()
      await store.fetchAll()

      expect(store.transactions[0].cashier).toBe('Juan Cruz')
    })

    it('extracts customer name from nested object', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, customer: { firstName: 'Maria', lastName: 'Santos' }, totalAmount: '100', items: [], payments: [] }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useTransactionStore()
      await store.fetchAll()

      expect(store.transactions[0].customer).toBe('Maria Santos')
    })

    it('uses cashierName fallback when cashier is a string', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, cashierName: 'Pedro', totalAmount: '200', items: [], payments: [] }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useTransactionStore()
      await store.fetchAll()

      expect(store.transactions[0].cashier).toBe('Pedro')
    })

    it('normalizes totalAmount to total as float', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, totalAmount: '328.50', items: [], payments: [] }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useTransactionStore()
      await store.fetchAll()

      expect(store.transactions[0].total).toBe(328.5)
    })

    it('normalizes item fields', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{
            id: 1, totalAmount: '500',
            items: [{ productName: 'Coke', quantity: '3', unitPrice: '45.00', lineTotal: '135.00', discountAmount: '0' }],
            payments: [],
          }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useTransactionStore()
      await store.fetchAll()

      const item = store.transactions[0].items[0]
      expect(item.quantity).toBe(3)
      expect(item.unitPrice).toBe(45)
      expect(item.lineTotal).toBe(135)
      expect(item.discountAmount).toBe(0)
    })

    it('normalizes payment amounts', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{
            id: 1, totalAmount: '500',
            items: [],
            payments: [{ paymentMethod: 'cash', amount: '500.00' }],
          }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useTransactionStore()
      await store.fetchAll()

      expect(store.transactions[0].payments[0].amount).toBe(500)
    })

    it('uses createdAt as date', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, createdAt: '2025-06-19T10:30:00Z', totalAmount: '100', items: [], payments: [] }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useTransactionStore()
      await store.fetchAll()

      expect(store.transactions[0].date).toBe('2025-06-19T10:30:00Z')
    })
  })

  describe('pagination', () => {
    it('tracks pagination metadata', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [],
          currentPage: 3, lastPage: 10, total: 245, perPage: 25, from: 51, to: 75,
        }}
      })

      const store = useTransactionStore()
      await store.fetchAll({ page: 3 })

      expect(store.pagination.currentPage).toBe(3)
      expect(store.pagination.lastPage).toBe(10)
      expect(store.pagination.total).toBe(245)
    })
  })
})
