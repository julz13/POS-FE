<template>
  <div class="space-y-5">

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div class="relative w-full sm:w-72">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          v-model="search"
          placeholder="Search by name, SKU, category..."
          class="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="flex gap-2">
        <select v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button @click="openModal()" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus class="w-4 h-4" /> Add Product
        </button>
      </div>
    </div>

    <!-- Summary pills -->
    <div class="flex gap-3 text-xs">
      <span class="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600">
        Total: <strong>{{ productStore.products.length }}</strong>
      </span>
      <span class="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700">
        Active: <strong>{{ productStore.products.filter(p => p.status === 'active').length }}</strong>
      </span>
      <span class="px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-600">
        Low Stock: <strong>{{ lowStockCount }}</strong>
      </span>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU / Barcode</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cost</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th class="px-4 py-3 w-20"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <!-- Loading skeleton rows -->
          <template v-if="productStore.loading">
            <tr v-for="n in 7" :key="`sk${n}`" class="animate-pulse">
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-3/4 mb-1.5"></div><div class="h-3 bg-gray-100 rounded w-1/2"></div></td>
              <td class="px-4 py-3"><div class="h-3 bg-gray-100 rounded w-4/5"></div></td>
              <td class="px-4 py-3"><div class="h-5 bg-gray-100 rounded-full w-20"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-16 ml-auto"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-16 ml-auto"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-10 ml-auto"></div></td>
              <td class="px-4 py-3"><div class="h-5 bg-gray-100 rounded-full w-14"></div></td>
              <td class="px-4 py-3"></td>
            </tr>
          </template>
          <!-- Empty state -->
          <tr v-else-if="!filteredProducts.length">
            <td colspan="8" class="px-4 py-10 text-center text-gray-400">No products found</td>
          </tr>
          <tr v-else v-for="p in filteredProducts" :key="p.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <p class="font-medium text-gray-900">{{ p.name }}</p>
              <p class="text-xs text-gray-400">{{ p.brand }} · {{ p.unit }}</p>
            </td>
            <td class="px-4 py-3">
              <p class="text-gray-600 font-mono text-xs">{{ p.sku }}</p>
              <p class="text-gray-400 font-mono text-xs">{{ p.barcode || '—' }}</p>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{{ p.category }}</span>
            </td>
            <td class="px-4 py-3 text-right text-gray-500 text-xs">₱{{ p.costPrice.toLocaleString() }}</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900">₱{{ p.sellingPrice.toLocaleString() }}</td>
            <td class="px-4 py-3 text-right">
              <span :class="p.stock <= p.reorderLevel ? 'text-red-600 font-bold' : 'text-gray-700'">{{ p.stock }}</span>
              <p class="text-xs text-gray-400">min {{ p.reorderLevel }}</p>
            </td>
            <td class="px-4 py-3">
              <span
                :class="p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                class="px-2 py-1 rounded-full text-xs font-medium capitalize"
              >{{ p.status }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <button @click="openModal(p)" class="text-gray-400 hover:text-blue-600 transition-colors" title="Edit">
                  <Pencil class="w-4 h-4" />
                </button>
                <button @click="askArchive(p)" class="text-gray-400 hover:text-red-500 transition-colors" title="Archive">
                  <Archive class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filteredProducts.length">
            <td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">No products found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="productStore.pagination.lastPage > 1" class="flex items-center justify-between">
      <span class="text-xs text-gray-400">Showing {{ productStore.pagination.from }}–{{ productStore.pagination.to }} of {{ productStore.pagination.total }}</span>
      <div class="flex items-center gap-1">
        <button :disabled="productStore.pagination.currentPage <= 1" @click="productStore.fetchPage(productStore.pagination.currentPage - 1)"
          class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
        <span class="text-xs text-gray-600 px-2">{{ productStore.pagination.currentPage }} / {{ productStore.pagination.lastPage }}</span>
        <button :disabled="productStore.pagination.currentPage >= productStore.pagination.lastPage" @click="productStore.fetchPage(productStore.pagination.currentPage + 1)"
          class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <BaseModal v-model="showModal" :title="editTarget ? 'Edit Product' : 'Add Product'">
      <form @submit.prevent="saveProduct" class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
          <input v-model="form.name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">SKU *</label>
          <input v-model="form.sku" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Barcode</label>
          <input v-model="form.barcode" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Category *</label>
          <select v-model="form.category" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select...</option>
            <option v-for="c in productStore.categories" :key="c.id" :value="c.name">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Brand</label>
          <input v-model="form.brand" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Cost Price (₱) *</label>
          <input v-model.number="form.costPrice" type="number" min="0" step="0.01" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Selling Price (₱) *</label>
          <input v-model.number="form.sellingPrice" type="number" min="0" step="0.01" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Stock *</label>
          <input v-model.number="form.stock" type="number" min="0" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Reorder Level *</label>
          <input v-model.number="form.reorderLevel" type="number" min="0" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Unit *</label>
          <input v-model="form.unit" required placeholder="Piece, Pack, Bottle..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div v-if="editTarget">
          <label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select v-model="form.status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <!-- margin preview -->
        <div v-if="form.costPrice && form.sellingPrice" class="col-span-2 bg-blue-50 rounded-lg px-4 py-2 text-xs text-blue-700 flex items-center justify-between">
          <span>Margin: ₱{{ (form.sellingPrice - form.costPrice).toFixed(2) }}</span>
          <span class="font-semibold">{{ marginPct }}%</span>
        </div>

        <div class="col-span-2 flex justify-end gap-3 pt-2">
          <button type="button" @click="showModal = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900">Cancel</button>
          <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {{ editTarget ? 'Save Changes' : 'Add Product' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Archive confirm -->
    <ConfirmDialog
      v-model="showConfirm"
      title="Archive Product"
      :message="`Archive &quot;${confirmTarget?.name}&quot;? It will be hidden from POS.`"
      confirmLabel="Archive"
      @confirm="doArchive"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/products'
import { useToastStore } from '@/stores/toast'
import BaseModal from '@/components/ui/BaseModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { Plus, Pencil, Archive, Search, ChevronLeft, ChevronRight } from '@lucide/vue'

const productStore = useProductStore()
const toast = useToastStore()

onMounted(() => {
  productStore.fetchAll()
})

const search = ref('')
const filterStatus = ref('')
const showModal = ref(false)
const showConfirm = ref(false)
const editTarget = ref(null)
const confirmTarget = ref(null)

const emptyForm = () => ({ name: '', sku: '', barcode: '', category: '', brand: '', costPrice: 0, sellingPrice: 0, stock: 0, reorderLevel: 5, unit: 'Piece', status: 'active' })
const form = ref(emptyForm())

const marginPct = computed(() => {
  if (!form.value.sellingPrice) return 0
  return ((form.value.sellingPrice - form.value.costPrice) / form.value.sellingPrice * 100).toFixed(1)
})

const lowStockCount = computed(() => productStore.products.filter(p => p.stock <= p.reorderLevel && p.status === 'active').length)

const filteredProducts = computed(() => {
  const q = search.value.toLowerCase()
  return productStore.products.filter(p => {
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    const matchStatus = !filterStatus.value || p.status === filterStatus.value
    return matchSearch && matchStatus
  })
})

function openModal(product = null) {
  editTarget.value = product
  form.value = product ? { ...product } : emptyForm()
  showModal.value = true
}

function saveProduct() {
  if (editTarget.value) {
    productStore.updateProduct(editTarget.value.id, form.value)
    toast.success('Product updated successfully')
  } else {
    productStore.addProduct(form.value)
    toast.success('Product added successfully')
  }
  showModal.value = false
}

function askArchive(product) {
  confirmTarget.value = product
  showConfirm.value = true
}

function doArchive() {
  productStore.archiveProduct(confirmTarget.value.id)
  toast.warning(`"${confirmTarget.value.name}" has been archived`)
}
</script>
