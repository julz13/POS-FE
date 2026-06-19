<template>
  <div class="space-y-5">
    <!-- Summary cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Total SKUs</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ productStore.products.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-red-200 p-4">
        <p class="text-xs text-gray-500">Low Stock</p>
        <p class="text-2xl font-bold text-red-600 mt-1">{{ lowStockItems.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Total Units</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ totalUnits }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Inventory Value</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">₱{{ inventoryValue.toLocaleString() }}</p>
      </div>
    </div>

    <!-- Actions + table -->
    <div class="flex gap-3 items-center justify-between">
      <input v-model="search" placeholder="Search products..." class="px-4 py-2 border border-gray-300 rounded-lg text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <div class="flex gap-2">
        <button @click="openAdjust('in')" class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
          <ArrowDownToLine class="w-4 h-4" /> Stock In
        </button>
        <button @click="openAdjust('out')" class="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600">
          <ArrowUpFromLine class="w-4 h-4" /> Stock Out
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Product</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stock</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reorder At</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="!paginatedProducts.length">
            <td colspan="5" class="px-4 py-8 text-center text-sm text-gray-400">No products found</td>
          </tr>
          <tr v-for="p in paginatedProducts" :key="p.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900">{{ p.name }}</p>
              <p class="text-xs text-gray-400">{{ p.sku }}</p>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ p.category }}</td>
            <td class="px-4 py-3 text-right">
              <span :class="p.stock <= p.reorderLevel ? 'text-red-600 font-bold' : 'text-gray-700'">{{ p.stock }}</span>
            </td>
            <td class="px-4 py-3 text-right text-gray-500">{{ p.reorderLevel }}</td>
            <td class="px-4 py-3">
              <span :class="p.stock <= p.reorderLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ p.stock <= p.reorderLevel ? 'Low Stock' : 'OK' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <p class="text-xs text-gray-400">
          Showing {{ pageStart }}–{{ pageEnd }} of {{ filteredProducts.length }} products
        </p>
        <div class="flex items-center gap-1">
          <button
            @click="currentPage--"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            Prev
          </button>
          <button
            v-for="page in pageNumbers"
            :key="page"
            @click="currentPage = page"
            :class="page === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
            class="w-8 h-8 text-xs rounded-lg border">
            {{ page }}
          </button>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- History log -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">Movement History</h3>
      <div class="space-y-2">
        <div v-for="log in history" :key="log.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <div class="flex items-center gap-3">
            <span :class="log.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'" class="px-2 py-1 rounded text-xs font-medium uppercase">
              {{ log.type }}
            </span>
            <div>
              <p class="text-sm text-gray-700">{{ log.product }}</p>
              <p class="text-xs text-gray-400">{{ log.remarks }}</p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-medium text-gray-900">{{ log.type === 'in' ? '+' : '-' }}{{ log.qty }}</p>
            <p class="text-xs text-gray-400">{{ log.date }}</p>
          </div>
        </div>
        <p v-if="!history.length" class="text-sm text-gray-400 py-4 text-center">No movements yet</p>
      </div>
    </div>

    <!-- Adjust Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-5 capitalize">Stock {{ adjustType }}</h2>
        <form @submit.prevent="saveAdjustment" class="space-y-4">
          <div>
            <label class="text-xs font-medium text-gray-600">Product</label>
            <select v-model="adjustForm.productId" required class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select product...</option>
              <option v-for="p in productStore.products" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Quantity</label>
            <input v-model.number="adjustForm.qty" type="number" min="1" required class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Remarks</label>
            <input v-model="adjustForm.remarks" placeholder="Reason for adjustment..." class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600">Cancel</button>
            <button type="submit" :class="adjustType === 'in' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'" class="px-4 py-2 text-sm text-white rounded-lg capitalize">
              {{ adjustType === 'in' ? 'Add Stock' : 'Remove Stock' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useProductStore } from '@/stores/products'
import { ArrowDownToLine, ArrowUpFromLine } from '@lucide/vue'

const productStore = useProductStore()
const search = ref('')
const showModal = ref(false)
const adjustType = ref('in')
const adjustForm = ref({ productId: '', qty: 1, remarks: '' })
const history = ref([])

const PER_PAGE = 20
const currentPage = ref(1)

const filteredProducts = computed(() => {
  const q = search.value.toLowerCase()
  return productStore.products.filter(p =>
    p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
  )
})

// Reset to page 1 whenever the search changes
watch(search, () => { currentPage.value = 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / PER_PAGE)))
const pageStart  = computed(() => filteredProducts.value.length === 0 ? 0 : (currentPage.value - 1) * PER_PAGE + 1)
const pageEnd    = computed(() => Math.min(currentPage.value * PER_PAGE, filteredProducts.value.length))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * PER_PAGE
  return filteredProducts.value.slice(start, start + PER_PAGE)
})

// Show at most 5 page buttons centred around the current page
const pageNumbers = computed(() => {
  const total = totalPages.value
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  const cur = currentPage.value
  let start = Math.max(1, cur - 2)
  let end   = Math.min(total, start + 4)
  if (end - start < 4) start = Math.max(1, end - 4)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const lowStockItems = computed(() => productStore.products.filter(p => p.stock <= p.reorderLevel))
const totalUnits = computed(() => productStore.products.reduce((s, p) => s + p.stock, 0))
const inventoryValue = computed(() => productStore.products.reduce((s, p) => s + p.stock * p.costPrice, 0))

function openAdjust(type) {
  adjustType.value = type
  adjustForm.value = { productId: '', qty: 1, remarks: '' }
  showModal.value = true
}

function saveAdjustment() {
  const product = productStore.products.find(p => p.id === adjustForm.value.productId)
  if (!product) return
  const newStock = adjustType.value === 'in'
    ? product.stock + adjustForm.value.qty
    : Math.max(0, product.stock - adjustForm.value.qty)
  productStore.updateProduct(product.id, { stock: newStock })
  history.value.unshift({
    id: Date.now(),
    type: adjustType.value,
    product: product.name,
    qty: adjustForm.value.qty,
    remarks: adjustForm.value.remarks || '-',
    date: new Date().toLocaleString('en-PH')
  })
  showModal.value = false
}
</script>
