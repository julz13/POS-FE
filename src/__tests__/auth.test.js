import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('isAuthenticated', () => {
    it('returns false when no user and no token', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('returns true when user and token both exist', () => {
      localStorage.setItem('pabili_token', 'test-token')
      localStorage.setItem('pabili_user', JSON.stringify({ id: 1, role: 'cashier' }))
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(true)
    })

    it('returns false when token exists but user is null', () => {
      localStorage.setItem('pabili_token', 'test-token')
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('role', () => {
    it('returns null when no user', () => {
      const store = useAuthStore()
      expect(store.role).toBeNull()
    })

    it('returns user role', () => {
      localStorage.setItem('pabili_user', JSON.stringify({ id: 1, role: 'manager' }))
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.role).toBe('manager')
    })
  })

  describe('can()', () => {
    it('owner can do everything', () => {
      localStorage.setItem('pabili_user', JSON.stringify({ id: 1, role: 'owner' }))
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.can('products')).toBe(true)
      expect(store.can('pos')).toBe(true)
      expect(store.can('reports')).toBe(true)
      expect(store.can('anything')).toBe(true)
    })

    it('cashier can only access pos, receipts, returns', () => {
      localStorage.setItem('pabili_user', JSON.stringify({ id: 1, role: 'cashier' }))
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.can('pos')).toBe(true)
      expect(store.can('receipts')).toBe(true)
      expect(store.can('returns')).toBe(true)
      expect(store.can('products')).toBe(false)
      expect(store.can('reports')).toBe(false)
    })

    it('manager can access products, inventory, reports but not pos', () => {
      localStorage.setItem('pabili_user', JSON.stringify({ id: 1, role: 'manager' }))
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.can('products')).toBe(true)
      expect(store.can('inventory')).toBe(true)
      expect(store.can('reports')).toBe(true)
      expect(store.can('approve_discounts')).toBe(true)
      expect(store.can('pos')).toBe(false)
    })

    it('unknown role has no permissions', () => {
      localStorage.setItem('pabili_user', JSON.stringify({ id: 1, role: 'intern' }))
      setActivePinia(createPinia())
      const store = useAuthStore()
      expect(store.can('pos')).toBe(false)
      expect(store.can('products')).toBe(false)
    })
  })

  describe('logout()', () => {
    it('clears all state and localStorage', async () => {
      const api = (await import('@/api')).default
      api.post.mockResolvedValue({})

      localStorage.setItem('pabili_token', 'tok')
      localStorage.setItem('pabili_user', JSON.stringify({ id: 1 }))
      localStorage.setItem('pabili_store_id', '5')
      localStorage.setItem('pabili_current_store', JSON.stringify({ id: 5 }))
      setActivePinia(createPinia())
      const store = useAuthStore()

      await store.logout()

      expect(store.user).toBeNull()
      expect(store.currentStore).toBeNull()
      expect(store.stores).toEqual([])
      expect(localStorage.getItem('pabili_token')).toBeNull()
      expect(localStorage.getItem('pabili_user')).toBeNull()
      expect(localStorage.getItem('pabili_store_id')).toBeNull()
      expect(localStorage.getItem('pabili_current_store')).toBeNull()
    })
  })
})
