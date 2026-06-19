<template>
  <div class="space-y-5">

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div class="flex gap-2 flex-1">
        <div class="relative flex-1 max-w-72">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="search"
            placeholder="Search PO number, supplier..."
            class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="partially_received">Partially Received</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0">
        <Plus class="w-4 h-4" /> Create PO
      </button>
    </div>

    <!-- Summary pills -->
    <div class="flex gap-3 text-xs flex-wrap">
      <span class="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600">Total: <strong>{{ store.orders.length }}</strong></span>
      <span class="px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full text-yellow-700">Pending: <strong>{{ store.pendingCount }}</strong></span>
      <span class="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700">Completed: <strong>{{ store.orders.filter(o => o.status === 'completed').length }}</strong></span>
      <span class="px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-600">Cancelled: <strong>{{ store.orders.filter(o => o.status === 'cancelled').length }}</strong></span>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">PO Number</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Order Date</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Expected</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th class="px-4 py-3 w-28"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="po in filtered" :key="po.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{{ po.poNumber }}</td>
            <td class="px-4 py-3">
              <p class="text-gray-800 font-medium">{{ po.supplierName }}</p>
              <p class="text-xs text-gray-400">by {{ po.createdBy }}</p>
            </td>
            <td class="px-4 py-3 text-gray-600">{{ po.orderDate }}</td>
            <td class="px-4 py-3">
              <span :class="isOverdue(po) ? 'text-red-600 font-semibold' : 'text-gray-600'">{{ po.expectedDelivery }}</span>
            </td>
            <td class="px-4 py-3 text-right text-gray-700">{{ po.items.length }}</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900">₱{{ store.orderTotal(po).toLocaleString() }}</td>
            <td class="px-4 py-3">
              <span :class="statusBadge(po.status)" class="px-2 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap">
                {{ statusLabel(po.status) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button @click="openView(po)" class="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="View">
                  <Eye class="w-4 h-4" />
                </button>
                <button
                  v-if="canEdit(po)"
                  @click="openEdit(po)"
                  class="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Edit"
                ><Pencil class="w-4 h-4" /></button>
                <button
                  v-if="canCancel(po)"
                  @click="askCancel(po)"
                  class="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Cancel"
                ><XCircle class="w-4 h-4" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">No purchase orders found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.pagination.lastPage > 1" class="flex items-center justify-between">
      <span class="text-xs text-gray-400">Showing {{ store.pagination.from }}–{{ store.pagination.to }} of {{ store.pagination.total }}</span>
      <div class="flex items-center gap-1">
        <button :disabled="store.pagination.currentPage <= 1" @click="store.fetchPage(store.pagination.currentPage - 1)"
          class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
        <span class="text-xs text-gray-600 px-2">{{ store.pagination.currentPage }} / {{ store.pagination.lastPage }}</span>
        <button :disabled="store.pagination.currentPage >= store.pagination.lastPage" @click="store.fetchPage(store.pagination.currentPage + 1)"
          class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
      </div>
    </div>

    <!-- ── Create / Edit Modal ── -->
    <BaseModal v-model="showForm" :title="editTarget ? `Edit ${editTarget.poNumber}` : 'Create Purchase Order'" max-width="max-w-3xl">
      <form @submit.prevent="savePO" class="space-y-5">
        <div v-if="formError" class="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{{ formError }}</div>

        <!-- Header fields -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
            <select v-model="form.supplierId" required @change="onSupplierChange" class="inp">
              <option value="">Select supplier...</option>
              <option v-for="s in supplierStore.suppliers.filter(s => s.status === 'active')" :key="s.id" :value="s.id">
                {{ s.companyName }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Order Date *</label>
            <input v-model="form.orderDate" type="date" required class="inp" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Expected Delivery *</label>
            <input v-model="form.expectedDelivery" type="date" required class="inp" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
            <input v-model="form.remarks" class="inp" placeholder="Optional notes..." />
          </div>
        </div>

        <!-- Line items -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Items</label>
            <button type="button" @click="addLine" class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
              <Plus class="w-3 h-3" /> Add Item
            </button>
          </div>

          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-3 py-2 font-semibold text-gray-500">Product</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-20">Qty</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-24">Cost (₱)</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-20">Disc %</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-20">Tax %</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-24">Total</th>
                  <th class="w-8"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(line, idx) in form.items" :key="idx">
                  <td class="px-3 py-2">
                    <select v-model="line.productId" @change="onProductChange(line)" required class="inp text-xs">
                      <option value="">Select product...</option>
                      <option v-for="p in productStore.products.filter(p => p.status === 'active')" :key="p.id" :value="p.id">
                        {{ p.name }} ({{ p.sku }})
                      </option>
                    </select>
                  </td>
                  <td class="px-3 py-2">
                    <input v-model.number="line.qty" type="number" min="1" required class="inp text-xs text-right" />
                  </td>
                  <td class="px-3 py-2">
                    <input v-model.number="line.costPrice" type="number" min="0" step="0.01" required class="inp text-xs text-right" />
                  </td>
                  <td class="px-3 py-2">
                    <input v-model.number="line.discount" type="number" min="0" max="100" class="inp text-xs text-right" />
                  </td>
                  <td class="px-3 py-2">
                    <input v-model.number="line.tax" type="number" min="0" max="100" class="inp text-xs text-right" />
                  </td>
                  <td class="px-3 py-2 text-right font-semibold text-gray-800">
                    ₱{{ store.lineTotal(line).toFixed(2) }}
                  </td>
                  <td class="px-3 py-2 text-center">
                    <button type="button" @click="removeLine(idx)" class="text-gray-300 hover:text-red-500">
                      <X class="w-3 h-3" />
                    </button>
                  </td>
                </tr>
                <tr v-if="!form.items.length">
                  <td colspan="7" class="px-3 py-4 text-center text-gray-400">No items added yet</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colspan="5" class="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</td>
                  <td class="px-3 py-2 text-right font-bold text-gray-900">₱{{ formTotal.toFixed(2) }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showForm = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600">Cancel</button>
          <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {{ editTarget ? 'Save Changes' : 'Create PO' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- ── View / Detail Drawer ── -->
    <Teleport to="body">
      <div v-if="viewPO" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/40" @click="viewPO = null"></div>
        <div class="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">

          <!-- Header -->
          <div class="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
            <div>
              <h2 class="text-base font-bold text-gray-900 font-mono">{{ viewPO.poNumber }}</h2>
              <p class="text-xs text-gray-400 mt-0.5">{{ viewPO.supplierName }}</p>
              <span :class="statusBadge(viewPO.status)" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize mt-1 inline-block">
                {{ statusLabel(viewPO.status) }}
              </span>
            </div>
            <button @click="viewPO = null" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
          </div>

          <!-- Status actions -->
          <div class="px-6 py-3 border-b border-gray-100 flex gap-2 shrink-0 flex-wrap">
            <button v-if="viewPO.status === 'draft'" @click="doSubmit" class="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Submit PO
            </button>
            <button v-if="viewPO.status === 'submitted'" @click="doApprove" class="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700">
              Approve PO
            </button>
            <button v-if="canReceive(viewPO)" @click="openReceive" class="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Receive Items
            </button>
            <button v-if="canCancel(viewPO)" @click="askCancel(viewPO)" class="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-500 rounded-lg hover:bg-red-50">
              Cancel PO
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            <!-- PO info -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500">Order Date</p>
                <p class="font-medium text-gray-800 mt-0.5">{{ viewPO.orderDate }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500">Expected Delivery</p>
                <p :class="isOverdue(viewPO) ? 'text-red-600 font-bold' : 'font-medium text-gray-800'" class="mt-0.5">{{ viewPO.expectedDelivery }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500">Created By</p>
                <p class="font-medium text-gray-800 mt-0.5">{{ viewPO.createdBy }}</p>
              </div>
              <div class="bg-blue-50 rounded-lg p-3">
                <p class="text-xs text-gray-500">PO Total</p>
                <p class="font-bold text-blue-700 mt-0.5">₱{{ store.orderTotal(viewPO).toLocaleString() }}</p>
              </div>
            </div>

            <div v-if="viewPO.remarks" class="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-gray-600 italic">
              {{ viewPO.remarks }}
            </div>

            <!-- Line items -->
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ordered Items</p>
              <div class="space-y-2">
                <div v-for="item in viewPO.items" :key="item.id" class="border border-gray-200 rounded-lg p-3">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ item.productName }}</p>
                      <p class="text-xs text-gray-400 font-mono">{{ item.sku }}</p>
                    </div>
                    <p class="text-sm font-bold text-gray-900 shrink-0">₱{{ store.lineTotal(item).toFixed(2) }}</p>
                  </div>
                  <div class="mt-2 grid grid-cols-4 gap-2 text-xs text-gray-500">
                    <div><p class="text-gray-400">Ordered</p><p class="font-semibold text-gray-700">{{ item.qty }}</p></div>
                    <div><p class="text-gray-400">Received</p><p :class="item.receivedQty >= item.qty ? 'text-green-600' : 'text-orange-500'" class="font-semibold">{{ item.receivedQty }}</p></div>
                    <div><p class="text-gray-400">Pending</p><p class="font-semibold text-gray-700">{{ Math.max(0, item.qty - item.receivedQty) }}</p></div>
                    <div><p class="text-gray-400">Cost</p><p class="font-semibold text-gray-700">₱{{ item.costPrice }}</p></div>
                  </div>
                  <!-- progress bar -->
                  <div class="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-green-500 rounded-full transition-all" :style="{ width: (item.receivedQty / item.qty * 100) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Receive Items Modal ── -->
    <BaseModal v-model="showReceive" title="Receive Items" max-width="max-w-md">
      <div class="space-y-3">
        <p class="text-xs text-gray-500">Enter quantities received for each item.</p>
        <div v-for="item in receiveForm" :key="item.id" class="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">{{ item.productName }}</p>
            <p class="text-xs text-gray-400">Pending: {{ item.pending }}</p>
          </div>
          <input
            v-model.number="item.receiving"
            type="number" min="0" :max="item.pending"
            class="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button @click="showReceive = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600">Cancel</button>
          <button @click="confirmReceive" class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">Confirm Receipt</button>
        </div>
      </div>
    </BaseModal>

    <!-- ── Cancel Confirm ── -->
    <ConfirmDialog
      v-model="showConfirm"
      title="Cancel Purchase Order"
      :message="`Cancel ${confirmTarget?.poNumber}? This cannot be undone.`"
      confirmLabel="Cancel PO"
      variant="danger"
      @confirm="doCancel"
    />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePurchaseStore } from '@/stores/purchases'
import { useSupplierStore } from '@/stores/suppliers'
import { useProductStore } from '@/stores/products'
import { useToastStore } from '@/stores/toast'
import BaseModal from '@/components/ui/BaseModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { Plus, Search, Eye, Pencil, XCircle, X, ChevronLeft, ChevronRight } from '@lucide/vue'

const store         = usePurchaseStore()
const supplierStore = useSupplierStore()
const productStore  = useProductStore()
const toast         = useToastStore()

const search        = ref('')
const filterStatus  = ref('')
const showForm      = ref(false)
const showReceive   = ref(false)
const showConfirm   = ref(false)
const editTarget    = ref(null)
const confirmTarget = ref(null)
const viewPO        = ref(null)
const formError     = ref('')
const receiveForm   = ref([])

const emptyForm = () => ({
  supplierId: '',
  supplierName: '',
  orderDate: new Date().toISOString().split('T')[0],
  expectedDelivery: '',
  remarks: '',
  items: [],
})
const form = ref(emptyForm())

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return store.orders.filter(o => {
    const matchSearch = !q || o.poNumber.toLowerCase().includes(q) || o.supplierName.toLowerCase().includes(q)
    const matchStatus = !filterStatus.value || o.status === filterStatus.value
    return matchSearch && matchStatus
  })
})

const formTotal = computed(() => form.value.items.reduce((s, i) => s + store.lineTotal(i), 0))

function onSupplierChange() {
  const s = supplierStore.suppliers.find(s => s.id === form.value.supplierId)
  form.value.supplierName = s?.companyName || ''
}

function onProductChange(line) {
  const p = productStore.products.find(p => p.id === line.productId)
  if (p) {
    line.productName = p.name
    line.sku         = p.sku
    line.costPrice   = p.costPrice
  }
}

function addLine() {
  form.value.items.push({ id: Date.now(), productId: '', productName: '', sku: '', qty: 1, costPrice: 0, discount: 0, tax: 0, receivedQty: 0 })
}

function removeLine(idx) {
  form.value.items.splice(idx, 1)
}

function openCreate() {
  editTarget.value = null
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

function openEdit(po) {
  editTarget.value = po
  form.value = {
    supplierId:       po.supplierId,
    supplierName:     po.supplierName,
    orderDate:        po.orderDate,
    expectedDelivery: po.expectedDelivery,
    remarks:          po.remarks,
    items:            po.items.map(i => ({ ...i })),
  }
  formError.value = ''
  showForm.value = true
}

function openView(po) {
  viewPO.value = store.orders.find(o => o.id === po.id)
}

function savePO() {
  formError.value = ''
  if (!form.value.items.length) { formError.value = 'Add at least one item'; return }
  if (form.value.items.some(i => !i.productId)) { formError.value = 'Select a product for all items'; return }
  try {
    if (editTarget.value) {
      store.update(editTarget.value.id, form.value)
      toast.success('Purchase order updated')
    } else {
      const po = store.create(form.value)
      toast.success(`${po.poNumber} created`)
    }
    showForm.value = false
  } catch (e) {
    formError.value = e.message
  }
}

function doSubmit() {
  store.submit(viewPO.value.id)
  toast.success(`${viewPO.value.poNumber} submitted`)
}

function doApprove() {
  store.approve(viewPO.value.id)
  toast.success(`${viewPO.value.poNumber} approved`)
}

function openReceive() {
  receiveForm.value = viewPO.value.items
    .filter(i => i.receivedQty < i.qty)
    .map(i => ({ ...i, pending: i.qty - i.receivedQty, receiving: i.qty - i.receivedQty }))
  showReceive.value = true
}

function confirmReceive() {
  const map = {}
  receiveForm.value.forEach(i => { map[i.id] = i.receiving })
  try {
    store.receiveItems(viewPO.value.id, map)
    toast.success('Items received and stock updated')
    showReceive.value = false
  } catch (e) {
    toast.error(e.message)
  }
}

function askCancel(po) {
  confirmTarget.value = po
  showConfirm.value = true
}

function doCancel() {
  try {
    store.cancel(confirmTarget.value.id)
    toast.warning(`${confirmTarget.value.poNumber} cancelled`)
    if (viewPO.value?.id === confirmTarget.value.id) viewPO.value = null
  } catch (e) {
    toast.error(e.message)
  }
}

const canEdit   = (po) => ['draft', 'submitted'].includes(po.status)
const canCancel = (po) => ['draft', 'submitted', 'approved'].includes(po.status)
const canReceive = (po) => ['approved', 'partially_received'].includes(po.status)
const isOverdue  = (po) => !['completed','cancelled'].includes(po.status) && new Date(po.expectedDelivery) < new Date()

const statusLabel = (s) => ({ draft: 'Draft', submitted: 'Submitted', approved: 'Approved', partially_received: 'Partial', completed: 'Completed', cancelled: 'Cancelled' }[s] || s)
const statusBadge = (s) => ({
  draft:              'bg-gray-100 text-gray-600',
  submitted:          'bg-blue-100 text-blue-700',
  approved:           'bg-purple-100 text-purple-700',
  partially_received: 'bg-orange-100 text-orange-700',
  completed:          'bg-green-100 text-green-700',
  cancelled:          'bg-red-100 text-red-600',
}[s] || 'bg-gray-100 text-gray-600')
</script>

<style scoped>
.inp {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}
.inp:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px #bfdbfe; }
</style>
