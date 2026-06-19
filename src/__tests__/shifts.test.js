import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useShiftStore } from '@/stores/shifts'

vi.mock('@/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(() => Promise.resolve({ data: { data: { data: [] } } })),
  }
}))

describe('Shift Store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  describe('isOpen', () => {
    it('returns false when no active shift', () => {
      const store = useShiftStore()
      store.activeShift = null
      expect(store.isOpen).toBe(false)
    })

    it('returns true when shift status is open', () => {
      const store = useShiftStore()
      store.activeShift = { status: 'open', openedAt: new Date().toISOString(), movements: [] }
      expect(store.isOpen).toBe(true)
    })

    it('returns false when shift status is closed', () => {
      const store = useShiftStore()
      store.activeShift = { status: 'closed', openedAt: new Date().toISOString(), movements: [] }
      expect(store.isOpen).toBe(false)
    })
  })

  describe('isStaleShift', () => {
    it('returns false when no active shift', () => {
      const store = useShiftStore()
      store.activeShift = null
      expect(store.isStaleShift).toBe(false)
    })

    it('returns false when shift is closed', () => {
      const store = useShiftStore()
      store.activeShift = { status: 'closed', openedAt: '2025-01-01T08:00:00Z', movements: [] }
      expect(store.isStaleShift).toBe(false)
    })

    it('returns false when shift opened today', () => {
      const store = useShiftStore()
      store.activeShift = { status: 'open', openedAt: new Date().toISOString(), movements: [] }
      expect(store.isStaleShift).toBe(false)
    })

    it('returns true when shift opened on a previous day', () => {
      const store = useShiftStore()
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      store.activeShift = { status: 'open', openedAt: yesterday.toISOString(), movements: [] }
      expect(store.isStaleShift).toBe(true)
    })

    it('returns true when shift opened several days ago', () => {
      const store = useShiftStore()
      store.activeShift = { status: 'open', openedAt: '2024-01-15T08:00:00Z', movements: [] }
      expect(store.isStaleShift).toBe(true)
    })

    it('returns false when openedAt is missing', () => {
      const store = useShiftStore()
      store.activeShift = { status: 'open', openedAt: null, movements: [] }
      expect(store.isStaleShift).toBe(false)
    })
  })

  describe('cashInTotal / cashOutTotal', () => {
    it('sums cash-in movements', () => {
      const store = useShiftStore()
      store.activeShift = {
        status: 'open',
        openedAt: new Date().toISOString(),
        movements: [
          { type: 'in', amount: 100 },
          { type: 'in', amount: 50 },
          { type: 'out', amount: 30 },
        ],
      }
      expect(store.cashInTotal).toBe(150)
    })

    it('sums cash-out movements', () => {
      const store = useShiftStore()
      store.activeShift = {
        status: 'open',
        openedAt: new Date().toISOString(),
        movements: [
          { type: 'in', amount: 100 },
          { type: 'out', amount: 30 },
          { type: 'out', amount: 20 },
        ],
      }
      expect(store.cashOutTotal).toBe(50)
    })

    it('returns 0 when no movements', () => {
      const store = useShiftStore()
      store.activeShift = { status: 'open', openedAt: new Date().toISOString(), movements: [] }
      expect(store.cashInTotal).toBe(0)
      expect(store.cashOutTotal).toBe(0)
    })

    it('returns 0 when no active shift', () => {
      const store = useShiftStore()
      store.activeShift = null
      expect(store.cashInTotal).toBe(0)
      expect(store.cashOutTotal).toBe(0)
    })
  })
})
