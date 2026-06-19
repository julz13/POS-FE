import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

// Map API product fields → fields pages already expect
function mapProduct(p) {
  const cat = p.category
  return {
    ...p,
    stock:      p.quantity ?? p.stock ?? 0,
    costPrice:  p.cost     ?? p.costPrice,
    category:   typeof cat === 'object' && cat !== null ? (cat.name ?? '') : (cat ?? ''),
    categoryId: typeof cat === 'object' && cat !== null ? cat.id : (p.categoryId ?? null),
  }
}

const PER_PAGE = 25

export const useProductStore = defineStore('products', () => {
  const products   = ref([])
  const categories = ref([])
  const loading    = ref(false)
  const pagination = ref({ currentPage: 1, lastPage: 1, total: 0, perPage: PER_PAGE, from: 0, to: 0 })

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const { data } = await api.get('/products', { params: { perPage: PER_PAGE, ...params } })
      const page = data.data
      products.value = (page?.data ?? []).map(mapProduct)
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

  async function fetchCategories() {
    const { data } = await api.get('/categories', { params: { perPage: 100 } })
    categories.value = data.data?.data ?? data.data ?? []
  }

  async function addProduct(payload) {
    const { data } = await api.post('/products', payload)
    const product = mapProduct(data.data)
    products.value.unshift(product)
    return product
  }

  async function updateProduct(id, updates) {
    const { data } = await api.put(`/products/${id}`, updates)
    const updated = mapProduct(data.data)
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) products.value[idx] = { ...products.value[idx], ...updated }
    return updated
  }

  async function archiveProduct(id) {
    await updateProduct(id, { status: 'archived' })
  }

  async function restoreProduct(id) {
    await updateProduct(id, { status: 'active' })
  }

  // Backend handles audit; kept for signature compatibility
  function getAuditForProduct() { return [] }

  async function addCategory(payload) {
    const { data } = await api.post('/categories', payload)
    const cat = data.data
    categories.value.push(cat)
    return cat
  }

  async function updateCategory(id, updates) {
    const { data } = await api.put(`/categories/${id}`, updates)
    const updated = data.data
    const idx = categories.value.findIndex(c => c.id === id)
    if (idx !== -1) categories.value[idx] = { ...categories.value[idx], ...updated }
  }

  async function searchByTerm(term) {
    const { data } = await api.get(`/products/search/${encodeURIComponent(term)}`)
    return (data.data ?? []).map(mapProduct)
  }

  async function searchByBarcode(barcode) {
    const { data } = await api.get(`/products/barcode/${encodeURIComponent(barcode)}`)
    return data.data ? mapProduct(data.data) : null
  }

  if (localStorage.getItem('pabili_token')) {
    Promise.all([fetchAll(), fetchCategories()]).catch(() => {})
  }

  return {
    products, categories, loading, pagination,
    fetchAll, fetchPage, fetchCategories,
    addProduct, updateProduct, archiveProduct, restoreProduct, getAuditForProduct,
    addCategory, updateCategory,
    searchByTerm, searchByBarcode,
  }
})
