import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCustomerStore } from '@/stores/customers'

vi.mock('@/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(() => Promise.resolve({ data: { data: { data: [] } } })),
    put: vi.fn(),
  }
}))

describe('Customer Store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('mapCustomer — field normalization', () => {
    it('normalizes customerCode to code', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, firstName: 'Juan', lastName: 'Cruz', customerCode: 'CUST-001', creditBalance: 500 }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useCustomerStore()
      await store.fetchAll()

      expect(store.customers[0].code).toBe('CUST-001')
    })

    it('normalizes creditBalance to currentBalance', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, firstName: 'Juan', creditBalance: 1500 }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useCustomerStore()
      await store.fetchAll()

      expect(store.customers[0].currentBalance).toBe(1500)
    })

    it('defaults currentBalance to 0 when missing', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, firstName: 'Juan' }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useCustomerStore()
      await store.fetchAll()

      expect(store.customers[0].currentBalance).toBe(0)
    })
  })

  describe('getById', () => {
    it('returns customer by id', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [
            { id: 1, firstName: 'Juan' },
            { id: 2, firstName: 'Maria' },
          ],
          currentPage: 1, lastPage: 1, total: 2, perPage: 25, from: 1, to: 2,
        }}
      })

      const store = useCustomerStore()
      await store.fetchAll()

      expect(store.getById(2).firstName).toBe('Maria')
    })

    it('returns null for non-existent id', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: { data: [{ id: 1, firstName: 'Juan' }], currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1 } }
      })

      const store = useCustomerStore()
      await store.fetchAll()

      expect(store.getById(999)).toBeNull()
    })
  })

  describe('add', () => {
    it('prepends new customer to list', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: { data: [], currentPage: 1, lastPage: 1, total: 0, perPage: 25, from: 0, to: 0 } }
      })
      api.post.mockResolvedValue({
        data: { data: { id: 10, firstName: 'New', lastName: 'Customer', customerCode: 'C-010' } }
      })

      const store = useCustomerStore()
      await store.fetchAll()
      const result = await store.add({ firstName: 'New', lastName: 'Customer' })

      expect(result.code).toBe('C-010')
      expect(store.customers[0].id).toBe(10)
    })
  })
})
