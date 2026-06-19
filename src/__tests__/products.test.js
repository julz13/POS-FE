import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProductStore } from '@/stores/products'

vi.mock('@/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(() => Promise.resolve({ data: { data: { data: [] } } })),
    put: vi.fn(),
  }
}))

describe('Product Store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('mapProduct — category normalization', () => {
    it('extracts category name from nested object', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, name: 'Coke', quantity: 50, category: { id: 3, name: 'Beverages' } }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useProductStore()
      await store.fetchAll()

      expect(store.products[0].category).toBe('Beverages')
      expect(store.products[0].categoryId).toBe(3)
    })

    it('keeps category as string when already a string', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, name: 'Coke', quantity: 50, category: 'Beverages' }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useProductStore()
      await store.fetchAll()

      expect(store.products[0].category).toBe('Beverages')
    })

    it('handles null category', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, name: 'Item', quantity: 10, category: null }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useProductStore()
      await store.fetchAll()

      expect(store.products[0].category).toBe('')
    })
  })

  describe('mapProduct — stock normalization', () => {
    it('uses quantity field as stock', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, name: 'Item', quantity: 42, category: 'Test' }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useProductStore()
      await store.fetchAll()

      expect(store.products[0].stock).toBe(42)
    })

    it('falls back to stock field when quantity is missing', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, name: 'Item', stock: 10, category: 'Test' }],
          currentPage: 1, lastPage: 1, total: 1, perPage: 25, from: 1, to: 1,
        }}
      })

      const store = useProductStore()
      await store.fetchAll()

      expect(store.products[0].stock).toBe(10)
    })
  })

  describe('pagination', () => {
    it('tracks pagination from API response', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: {
          data: [{ id: 1, name: 'A', category: 'X', quantity: 1 }],
          currentPage: 2, lastPage: 5, total: 120, perPage: 25, from: 26, to: 50,
        }}
      })

      const store = useProductStore()
      await store.fetchAll({ page: 2 })

      expect(store.pagination.currentPage).toBe(2)
      expect(store.pagination.lastPage).toBe(5)
      expect(store.pagination.total).toBe(120)
      expect(store.pagination.from).toBe(26)
      expect(store.pagination.to).toBe(50)
    })

    it('fetchPage calls fetchAll with page param', async () => {
      const api = (await import('@/api')).default
      api.get.mockResolvedValue({
        data: { data: { data: [], currentPage: 3, lastPage: 5, total: 100, perPage: 25, from: 51, to: 75 } }
      })

      const store = useProductStore()
      await store.fetchPage(3)

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: expect.objectContaining({ page: 3 })
      })
    })
  })
})
