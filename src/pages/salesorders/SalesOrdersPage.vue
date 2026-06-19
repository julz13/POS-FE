<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Sales Orders</h2>
        <p class="text-sm text-gray-500">Manage customer reservations and convert them to sales</p>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
        <Plus class="w-4 h-4" />
        New Sales Order
      </button>
    </div>

    <!-- Status Summary -->
    <div class="grid grid-cols-4 gap-4">
      <div v-for="s in statusSummary" :key="s.label"
        class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <div :class="`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg}`">
          <component :is="s.icon" :class="`w-5 h-5 ${s.color}`" />
        </div>
        <div>
          <p class="text-2xl font-bold text-gray-800">{{ s.value }}</p>
          <p class="text-xs text-gray-500">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
      <input v-model="search" type="text" placeholder="Search by SO # or customer..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-52 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="filterStatus" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Status</option>
        <option value="draft">Draft</option>
        <option value="confirmed">Confirmed</option>
        <option value="converted">Converted</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">SO #</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected Pickup</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="!filteredOrders.length">
            <td colspan="8" class="px-4 py-10 text-center text-gray-400">No sales orders found</td>
          </tr>
          <tr v-for="order in filteredOrders" :key="order.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-mono font-medium text-blue-600">{{ order.id }}</td>
            <td class="px-4 py-3 text-gray-800 font-medium">{{ order.customer }}</td>
            <td class="px-4 py-3 text-gray-600">{{ formatDate(order.date) }}</td>
            <td class="px-4 py-3 text-gray-600">
              <span :class="isOverdue(order) ? 'text-red-600 font-medium' : ''">
                {{ formatDate(order.expectedPickup) }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-800">₱{{ orderTotal(order).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td class="px-4 py-3">
              <span :class="statusClass(order.status)" class="px-2 py-1 rounded-full text-xs font-semibold capitalize">
                {{ order.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <button @click="openView(order)" class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                  <Eye class="w-4 h-4" />
                </button>
                <button v-if="order.status === 'draft' || order.status === 'confirmed'"
                  @click="openEdit(order)" class="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors" title="Edit">
                  <Pencil class="w-4 h-4" />
                </button>
                <button v-if="order.status === 'draft'"
                  @click="handleConfirm(order.id)" class="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Confirm">
                  <CheckCircle class="w-4 h-4" />
                </button>
                <button v-if="order.status === 'confirmed'"
                  @click="handleConvert(order)" class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors" title="Convert to Sale">
                  <ShoppingCart class="w-3.5 h-3.5" />
                  Convert
                </button>
                <button v-if="order.status === 'draft' || order.status === 'confirmed'"
                  @click="handleCancel(order.id)" class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Cancel">
                  <XCircle class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="soStore.pagination.lastPage > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">Showing {{ soStore.pagination.from }}–{{ soStore.pagination.to }} of {{ soStore.pagination.total }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="soStore.pagination.currentPage <= 1" @click="soStore.fetchPage(soStore.pagination.currentPage - 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
          <span class="text-xs text-gray-600 px-2">{{ soStore.pagination.currentPage }} / {{ soStore.pagination.lastPage }}</span>
          <button :disabled="soStore.pagination.currentPage >= soStore.pagination.lastPage" @click="soStore.fetchPage(soStore.pagination.currentPage + 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800">{{ editingOrder ? 'Edit Sales Order' : 'New Sales Order' }}</h3>
          <button @click="closeForm" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="overflow-y-auto flex-1 p-6 space-y-5">
          <!-- Customer + Dates -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Customer <span class="text-red-500">*</span></label>
              <input v-model="form.customer" list="customer-list" type="text" placeholder="Enter or select customer"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <datalist id="customer-list">
                <option v-for="c in mockSOCustomers" :key="c" :value="c" />
              </datalist>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Order Date <span class="text-red-500">*</span></label>
              <input v-model="form.date" type="date"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Expected Pickup <span class="text-red-500">*</span></label>
              <input v-model="form.expectedPickup" type="date"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input v-model="form.notes" type="text" placeholder="Optional notes"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <!-- Items -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">Order Items <span class="text-red-500">*</span></label>
              <button @click="addFormItem" type="button" class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus class="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="text-left px-3 py-2 text-xs text-gray-500 font-semibold">Product</th>
                    <th class="text-center px-3 py-2 text-xs text-gray-500 font-semibold w-20">Qty</th>
                    <th class="text-right px-3 py-2 text-xs text-gray-500 font-semibold w-24">Price</th>
                    <th class="text-center px-3 py-2 text-xs text-gray-500 font-semibold w-20">Disc %</th>
                    <th class="text-right px-3 py-2 text-xs text-gray-500 font-semibold w-24">Subtotal</th>
                    <th class="w-8"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-if="!form.items.length">
                    <td colspan="6" class="px-3 py-6 text-center text-gray-400 text-xs">No items added yet</td>
                  </tr>
                  <tr v-for="(item, idx) in form.items" :key="idx">
                    <td class="px-3 py-2">
                      <select v-model="item.productId" @change="onProductSelect(item)" class="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">-- Select --</option>
                        <option v-for="p in activeProducts" :key="p.id" :value="p.id">{{ p.name }}</option>
                      </select>
                    </td>
                    <td class="px-3 py-2">
                      <input v-model.number="item.qty" type="number" min="1" class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model.number="item.price" type="number" min="0" step="0.01" class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </td>
                    <td class="px-3 py-2">
                      <input v-model.number="item.lineDiscount" type="number" min="0" max="100" class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </td>
                    <td class="px-3 py-2 text-right font-medium text-gray-700 text-xs">
                      ₱{{ lineSubtotal(item).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                    </td>
                    <td class="px-3 py-2 text-center">
                      <button @click="removeFormItem(idx)" class="text-gray-300 hover:text-red-500 transition-colors">
                        <X class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="form.items.length" class="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colspan="4" class="px-3 py-2 text-xs font-semibold text-gray-600 text-right">Order Total:</td>
                    <td class="px-3 py-2 text-right text-sm font-bold text-gray-800">
                      ₱{{ formTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Validation error -->
          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button @click="closeForm" class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button @click="saveForm" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            {{ editingOrder ? 'Save Changes' : 'Create Sales Order' }}
          </button>
        </div>
      </div>
    </div>

    <!-- View Modal -->
    <div v-if="viewOrder" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">{{ viewOrder.id }}</h3>
            <span :class="statusClass(viewOrder.status)" class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
              {{ viewOrder.status }}
            </span>
          </div>
          <button @click="viewOrder = null" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><p class="text-gray-500">Customer</p><p class="font-medium text-gray-800">{{ viewOrder.customer }}</p></div>
            <div><p class="text-gray-500">Order Date</p><p class="font-medium text-gray-800">{{ formatDate(viewOrder.date) }}</p></div>
            <div><p class="text-gray-500">Expected Pickup</p><p class="font-medium" :class="isOverdue(viewOrder) ? 'text-red-600' : 'text-gray-800'">{{ formatDate(viewOrder.expectedPickup) }}</p></div>
            <div><p class="text-gray-500">Created By</p><p class="font-medium text-gray-800">{{ viewOrder.createdBy }}</p></div>
            <div v-if="viewOrder.notes" class="col-span-2"><p class="text-gray-500">Notes</p><p class="font-medium text-gray-800">{{ viewOrder.notes }}</p></div>
            <div v-if="viewOrder.convertedTxn" class="col-span-2">
              <p class="text-gray-500">Converted to Transaction</p>
              <p class="font-mono font-medium text-blue-600">{{ viewOrder.convertedTxn }}</p>
            </div>
          </div>
          <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-3 py-2 text-xs text-gray-500 font-semibold">Product</th>
                <th class="text-center px-3 py-2 text-xs text-gray-500 font-semibold">Qty</th>
                <th class="text-right px-3 py-2 text-xs text-gray-500 font-semibold">Price</th>
                <th class="text-center px-3 py-2 text-xs text-gray-500 font-semibold">Disc%</th>
                <th class="text-right px-3 py-2 text-xs text-gray-500 font-semibold">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in viewOrder.items" :key="item.productId">
                <td class="px-3 py-2 text-gray-800">{{ item.name }}</td>
                <td class="px-3 py-2 text-center text-gray-600">{{ item.qty }} {{ item.unit }}</td>
                <td class="px-3 py-2 text-right text-gray-600">₱{{ item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                <td class="px-3 py-2 text-center text-gray-600">{{ item.lineDiscount || 0 }}%</td>
                <td class="px-3 py-2 text-right font-semibold text-gray-800">₱{{ lineSubtotal(item).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colspan="4" class="px-3 py-2 text-xs font-semibold text-gray-600 text-right">Total:</td>
                <td class="px-3 py-2 text-right font-bold text-gray-800">₱{{ orderTotal(viewOrder).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button @click="viewOrder = null" class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button v-if="viewOrder.status === 'confirmed'" @click="handleConvert(viewOrder); viewOrder = null"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <ShoppingCart class="w-4 h-4" /> Convert to Sale
          </button>
        </div>
      </div>
    </div>

    <!-- Convert Confirm Modal -->
    <div v-if="convertTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <ShoppingCart class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">Convert to Sale</h3>
            <p class="text-sm text-gray-500">{{ convertTarget.id }} — {{ convertTarget.customer }}</p>
          </div>
        </div>
        <p class="text-sm text-gray-600">
          This will load all items from this sales order directly into the POS cart and mark the order as <strong>Converted</strong>. The cashier will then complete payment at the POS.
        </p>
        <div class="flex justify-end gap-3 pt-2">
          <button @click="convertTarget = null" class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button @click="confirmConvert" class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <ShoppingCart class="w-4 h-4" /> Load into POS
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium transition-all"
      :class="toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'">
      <CheckCircle v-if="toast.type === 'success'" class="w-4 h-4" />
      <XCircle v-else-if="toast.type === 'error'" class="w-4 h-4" />
      {{ toast.message }}
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesOrderStore } from '@/stores/salesOrders'
import { useProductStore } from '@/stores/products'
import { usePosStore } from '@/stores/pos'
import { mockSOCustomers } from '@/mock/salesOrders'
import { Plus, Eye, Pencil, X, CheckCircle, XCircle, ShoppingCart, FileText, Clock, RefreshCw, Ban, ChevronLeft, ChevronRight } from '@lucide/vue'

const soStore  = useSalesOrderStore()
const prodStore = useProductStore()
const posStore  = usePosStore()
const router   = useRouter()

// ── Filters ──
const search = ref('')
const filterStatus = ref('')

const filteredOrders = computed(() => {
  let list = soStore.allOrders
  if (filterStatus.value) list = list.filter(o => o.status === filterStatus.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(o => o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q))
  }
  return list
})

// ── Status summary ──
const statusSummary = computed(() => [
  { label: 'Draft',     value: soStore.statusCounts.draft,     icon: FileText,  bg: 'bg-gray-100',   color: 'text-gray-500' },
  { label: 'Confirmed', value: soStore.statusCounts.confirmed, icon: CheckCircle, bg: 'bg-green-100', color: 'text-green-600' },
  { label: 'Converted', value: soStore.statusCounts.converted, icon: RefreshCw,  bg: 'bg-blue-100',  color: 'text-blue-600' },
  { label: 'Cancelled', value: soStore.statusCounts.cancelled, icon: Ban,        bg: 'bg-red-100',   color: 'text-red-500' },
])

// ── Products list ──
const activeProducts = computed(() => prodStore.products.filter(p => p.status === 'active'))

// ── Helpers ──
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}
function isOverdue(order) {
  if (order.status !== 'confirmed' && order.status !== 'draft') return false
  return new Date(order.expectedPickup) < new Date()
}
function statusClass(s) {
  return {
    draft:     'bg-gray-100 text-gray-600',
    confirmed: 'bg-green-100 text-green-700',
    converted: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-600',
  }[s] || 'bg-gray-100 text-gray-600'
}
function lineSubtotal(item) {
  const base = (item.price || 0) * (item.qty || 0)
  return base - (base * (item.lineDiscount || 0)) / 100
}
function orderTotal(order) {
  return order.items.reduce((s, i) => s + lineSubtotal(i), 0)
}

// ── Toast ──
const toast = reactive({ show: false, type: 'success', message: '' })
function showToast(message, type = 'success') {
  toast.message = message
  toast.type = type
  toast.show = true
  setTimeout(() => { toast.show = false }, 3000)
}

// ── View ──
const viewOrder = ref(null)
function openView(order) { viewOrder.value = order }

// ── Form state ──
const showForm = ref(false)
const editingOrder = ref(null)
const formError = ref('')
const form = reactive({
  customer: '',
  date: new Date().toISOString().slice(0, 10),
  expectedPickup: '',
  notes: '',
  items: [],
})

function blankItem() {
  return { productId: '', name: '', unit: '', qty: 1, price: 0, lineDiscount: 0 }
}
function openCreate() {
  editingOrder.value = null
  Object.assign(form, { customer: '', date: new Date().toISOString().slice(0, 10), expectedPickup: '', notes: '', items: [] })
  formError.value = ''
  showForm.value = true
}
function openEdit(order) {
  editingOrder.value = order
  Object.assign(form, {
    customer: order.customer,
    date: order.date,
    expectedPickup: order.expectedPickup,
    notes: order.notes,
    items: order.items.map(i => ({ ...i })),
  })
  formError.value = ''
  showForm.value = true
}
function closeForm() { showForm.value = false }

function addFormItem() { form.items.push(blankItem()) }
function removeFormItem(idx) { form.items.splice(idx, 1) }

function onProductSelect(item) {
  const p = activeProducts.value.find(x => x.id === item.productId)
  if (p) {
    item.name  = p.name
    item.unit  = p.unit
    item.price = p.sellingPrice
  }
}

const formTotal = computed(() => form.items.reduce((s, i) => s + lineSubtotal(i), 0))

function saveForm() {
  formError.value = ''
  if (!form.customer.trim())   { formError.value = 'Customer is required.'; return }
  if (!form.date)              { formError.value = 'Order date is required.'; return }
  if (!form.expectedPickup)    { formError.value = 'Expected pickup date is required.'; return }
  if (!form.items.length)      { formError.value = 'Add at least one item.'; return }
  const bad = form.items.find(i => !i.productId || i.qty <= 0)
  if (bad) { formError.value = 'All items must have a product and quantity > 0.'; return }

  if (editingOrder.value) {
    soStore.updateOrder(editingOrder.value.id, { ...form })
    showToast(`Sales order ${editingOrder.value.id} updated.`)
  } else {
    const id = soStore.createOrder({ ...form, createdBy: 'Staff' })
    showToast(`Sales order ${id} created.`)
  }
  closeForm()
}

// ── Actions ──
function handleConfirm(id) {
  soStore.confirmOrder(id)
  showToast(`Order ${id} confirmed.`)
}

function handleCancel(id) {
  soStore.cancelOrder(id)
  showToast(`Order ${id} cancelled.`, 'error')
}

// ── Convert to Sale ──
const convertTarget = ref(null)
function handleConvert(order) { convertTarget.value = order }

function confirmConvert() {
  const order = convertTarget.value
  const txnId = `TXN-SO-${String(Date.now()).slice(-5)}`
  const items = soStore.convertToSale(order.id, txnId)
  if (!items) return

  // Load items into POS cart
  posStore.clearCart()
  items.forEach(item => {
    const product = prodStore.products.find(p => p.id === item.productId)
    if (product) {
      posStore.addToCart(product)
      // set correct qty
      const cartItem = posStore.cart.find(c => c.id === product.id)
      if (cartItem) {
        cartItem.qty = item.qty
        cartItem.lineDiscount = item.lineDiscount || 0
      }
    }
  })
  posStore.customer = { name: order.customer }

  convertTarget.value = null
  showToast(`Order ${order.id} loaded into POS cart.`)
  setTimeout(() => router.push('/pos'), 1200)
}
</script>
