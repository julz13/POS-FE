import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

function mapTake(t) {
  return {
    ...t,
    date:   t.countDate ?? t.date,
    items:  (t.items ?? []).map(i => ({
      ...i,
      productId:   i.productId   ?? null,
      productName: i.productName ?? '',
      systemQty:   i.systemQty   ?? i.quantity ?? 0,
      countedQty:  i.countedQty  ?? null,
      variance:    i.variance    ?? null,
    })),
  }
}

const PER_PAGE = 25

export const useStockTakeStore = defineStore('stocktake', () => {
  const takes      = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/stock-takes', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      takes.value = (page?.data ?? []).map(mapTake)
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

  async function createTake({ notes, createdBy, products }) {
    const { data } = await api.post('/stock-takes', {
      countDate: new Date().toISOString().slice(0, 10),
      notes:     notes ?? '',
    })
    const take = mapTake(data.data)

    // Populate items from current product list if backend doesn't return them
    if (!take.items?.length && products?.length) {
      take.items = products.map(p => ({
        productId:   p.id,
        productName: p.name,
        sku:         p.sku,
        systemQty:   p.stock ?? p.quantity ?? 0,
        countedQty:  null,
        variance:    null,
        notes:       '',
      }))
    }

    takes.value.unshift(take)
    return take.id
  }

  function setCount(takeId, productId, countedQty) {
    const take = takes.value.find(t => t.id === takeId)
    if (!take || take.status === 'posted') return
    const item = take.items.find(i => i.productId === productId)
    if (!item) return
    item.countedQty = countedQty === '' ? null : parseInt(countedQty, 10)
    item.variance   = item.countedQty != null ? item.countedQty - item.systemQty : null
  }

  async function completeTake(takeId) {
    const take = takes.value.find(t => t.id === takeId)
    if (!take) return false
    const allCounted = take.items.every(i => i.countedQty != null)
    if (!allCounted) return false
    await api.post(`/stock-takes/${takeId}/complete`, { notes: 'Count completed' })
    take.status      = 'completed'
    take.completedAt = new Date().toISOString()
    return true
  }

  async function postTake(takeId, postedBy) {
    const take = takes.value.find(t => t.id === takeId)
    if (!take || take.status !== 'completed') return false
    await api.post(`/stock-takes/${takeId}/post`, { notes: postedBy ? `Posted by ${postedBy}` : '' })
    take.status   = 'posted'
    take.postedAt = new Date().toISOString()
    take.postedBy = postedBy
    return true
  }

  function getById(id) { return takes.value.find(t => t.id === id) || null }

  const statusCounts = computed(() => ({
    in_progress: takes.value.filter(t => t.status === 'in_progress' || t.status === 'draft').length,
    completed:   takes.value.filter(t => t.status === 'completed').length,
    posted:      takes.value.filter(t => t.status === 'posted').length,
  }))

  if (localStorage.getItem('pabili_token')) {
    fetchAll().catch(() => {})
  }

  return { takes, loading, statusCounts, pagination, fetchAll, fetchPage, createTake, setCount, completeTake, postTake, getById }
})
