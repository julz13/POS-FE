<template>
  <div class="space-y-5">

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div class="flex gap-2 flex-1">
        <div class="relative flex-1 max-w-72">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="search"
            placeholder="Search GRN, PO, supplier..."
            class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All</option>
          <option value="posted">Posted</option>
          <option value="voided">Voided</option>
        </select>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0">
        <Plus class="w-4 h-4" /> Receive Goods
      </button>
    </div>

    <!-- Summary pills -->
    <div class="flex gap-3 text-xs flex-wrap">
      <span class="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600">Total: <strong>{{ store.grns.length }}</strong></span>
      <span class="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700">Posted: <strong>{{ store.postedCount }}</strong></span>
      <span class="px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-600">Voided: <strong>{{ store.grns.filter(g => g.status === 'voided').length }}</strong></span>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">GRN #</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">PO Ref</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Invoice #</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Items</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th class="px-4 py-3 w-20"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="grn in filtered" :key="grn.id"
            class="hover:bg-gray-50 transition-colors"
            :class="grn.status === 'voided' ? 'opacity-60' : ''"
          >
            <td class="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{{ grn.grnNumber }}</td>
            <td class="px-4 py-3 font-mono text-xs text-blue-600">{{ grn.poNumber }}</td>
            <td class="px-4 py-3">
              <p class="text-gray-800 font-medium">{{ grn.supplierName }}</p>
              <p class="text-xs text-gray-400">by {{ grn.receivedBy }}</p>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ grn.invoiceNumber || '—' }}</td>
            <td class="px-4 py-3 text-gray-600">{{ grn.receiveDate }}</td>
            <td class="px-4 py-3 text-right text-gray-700">{{ grn.items.length }}</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900">₱{{ store.grnTotal(grn).toLocaleString() }}</td>
            <td class="px-4 py-3">
              <span :class="grn.status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                class="px-2 py-1 rounded-full text-xs font-medium capitalize">{{ grn.status }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button @click="openView(grn)" class="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="View">
                  <Eye class="w-4 h-4" />
                </button>
                <button
                  v-if="canVoid(grn)"
                  @click="askVoid(grn)"
                  class="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Void"
                ><Ban class="w-4 h-4" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="9" class="px-4 py-12 text-center text-gray-400 text-sm">No goods received notes found</td>
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

    <!-- ── Create GRN Modal ── -->
    <BaseModal v-model="showForm" title="Receive Goods" max-width="max-w-3xl">
      <form @submit.prevent="saveGRN" class="space-y-5">
        <div v-if="formError" class="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{{ formError }}</div>

        <!-- Header -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Purchase Order *</label>
            <select v-model="form.poId" required @change="onPOChange" class="inp">
              <option value="">Select PO...</option>
              <option
                v-for="po in receivablePOs"
                :key="po.id" :value="po.id"
              >{{ po.poNumber }} — {{ po.supplierName }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Receive Date *</label>
            <input v-model="form.receiveDate" type="date" required class="inp" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Supplier Invoice #</label>
            <input v-model="form.invoiceNumber" class="inp" placeholder="e.g. INV-CC-20250708" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
            <input v-model="form.remarks" class="inp" placeholder="Optional notes..." />
          </div>
        </div>

        <!-- Items -->
        <div v-if="form.items.length">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items to Receive</p>
          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-3 py-2 font-semibold text-gray-500">Product</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-24">Ordered</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-24">Pending</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-28">Receiving *</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-24">Cost (₱)</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-20">Tax %</th>
                  <th class="text-right px-3 py-2 font-semibold text-gray-500 w-24">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in form.items" :key="item.id" :class="item.pending <= 0 ? 'opacity-40' : ''">
                  <td class="px-3 py-2">
                    <p class="font-medium text-gray-800">{{ item.productName }}</p>
                    <p class="text-gray-400 font-mono">{{ item.sku }}</p>
                  </td>
                  <td class="px-3 py-2 text-right text-gray-600">{{ item.orderedQty }}</td>
                  <td class="px-3 py-2 text-right font-semibold" :class="item.pending > 0 ? 'text-orange-600' : 'text-gray-400'">{{ item.pending }}</td>
                  <td class="px-3 py-2">
                    <input
                      v-model.number="item.receivedQty"
                      type="number" min="0" :max="item.pending"
                      :disabled="item.pending <= 0"
                      class="inp text-xs text-right"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input v-model.number="item.costPrice" type="number" min="0" step="0.01" class="inp text-xs text-right" />
                  </td>
                  <td class="px-3 py-2">
                    <input v-model.number="item.tax" type="number" min="0" max="100" class="inp text-xs text-right" />
                  </td>
                  <td class="px-3 py-2 text-right font-semibold text-gray-800">
                    ₱{{ store.lineTotal(item).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colspan="6" class="px-3 py-2 text-right text-xs font-semibold text-gray-600">Total</td>
                  <td class="px-3 py-2 text-right font-bold text-gray-900">₱{{ formTotal.toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Stock impact preview -->
          <div class="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p class="text-xs font-semibold text-blue-700 mb-2">📦 Stock Impact Preview</p>
            <div class="space-y-1">
              <div v-for="item in form.items.filter(i => i.receivedQty > 0)" :key="item.id" class="flex items-center justify-between text-xs">
                <span class="text-gray-700">{{ item.productName }}</span>
                <span class="text-green-700 font-semibold">+{{ item.receivedQty }} {{ item.unit || 'pcs' }}</span>
              </div>
              <p v-if="!form.items.some(i => i.receivedQty > 0)" class="text-xs text-blue-500">Enter quantities above to see stock impact.</p>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showForm = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600">Cancel</button>
          <button
            type="submit"
            :disabled="!form.poId || !form.items.some(i => i.receivedQty > 0)"
            class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40"
          >Post GRN & Update Stock</button>
        </div>
      </form>
    </BaseModal>

    <!-- ── View Drawer ── -->
    <Teleport to="body">
      <div v-if="viewGRN" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/40" @click="viewGRN = null"></div>
        <div class="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">

          <!-- Header -->
          <div class="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
            <div>
              <h2 class="text-base font-bold text-gray-900 font-mono">{{ viewGRN.grnNumber }}</h2>
              <p class="text-xs text-gray-400 mt-0.5">Ref: {{ viewGRN.poNumber }}</p>
              <span :class="viewGRN.status === 'posted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                class="px-2 py-0.5 rounded-full text-xs font-medium capitalize mt-1 inline-block">{{ viewGRN.status }}</span>
            </div>
            <button @click="viewGRN = null" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            <!-- GRN info grid -->
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500">Supplier</p>
                <p class="font-medium text-gray-800 mt-0.5">{{ viewGRN.supplierName }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500">Receive Date</p>
                <p class="font-medium text-gray-800 mt-0.5">{{ viewGRN.receiveDate }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500">Invoice #</p>
                <p class="font-medium text-gray-800 mt-0.5 font-mono">{{ viewGRN.invoiceNumber || '—' }}</p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500">Received By</p>
                <p class="font-medium text-gray-800 mt-0.5">{{ viewGRN.receivedBy }}</p>
              </div>
              <div class="bg-blue-50 rounded-lg p-3 col-span-2">
                <p class="text-xs text-gray-500">GRN Total</p>
                <p class="font-bold text-blue-700 mt-0.5 text-lg">₱{{ store.grnTotal(viewGRN).toLocaleString() }}</p>
              </div>
            </div>

            <div v-if="viewGRN.remarks" class="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-gray-600 italic">
              {{ viewGRN.remarks }}
            </div>

            <!-- Void info -->
            <div v-if="viewGRN.status === 'voided'" class="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              <p class="text-xs font-semibold text-red-700">⚠ Voided</p>
              <p class="text-xs text-gray-600">By: {{ viewGRN.voidedBy }} — {{ viewGRN.voidedAt }}</p>
              <p class="text-xs text-gray-600">Reason: {{ viewGRN.voidReason }}</p>
            </div>

            <!-- Items -->
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Received Items</p>
              <div class="space-y-2">
                <div v-for="item in viewGRN.items" :key="item.id" class="border border-gray-200 rounded-lg p-3">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ item.productName }}</p>
                      <p class="text-xs text-gray-400 font-mono">{{ item.sku }}</p>
                    </div>
                    <p class="text-sm font-bold text-gray-900">₱{{ store.lineTotal(item).toFixed(2) }}</p>
                  </div>
                  <div class="mt-2 grid grid-cols-4 gap-2 text-xs">
                    <div><p class="text-gray-400">Ordered</p><p class="font-semibold text-gray-700">{{ item.orderedQty }}</p></div>
                    <div><p class="text-gray-400">Received</p><p class="font-semibold text-green-600">{{ item.receivedQty }}</p></div>
                    <div><p class="text-gray-400">Cost/unit</p><p class="font-semibold text-gray-700">₱{{ item.costPrice }}</p></div>
                    <div><p class="text-gray-400">Tax</p><p class="font-semibold text-gray-700">{{ item.tax || 0 }}%</p></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div v-if="canVoid(viewGRN)" class="px-6 py-4 border-t border-gray-100 shrink-0">
            <button @click="askVoid(viewGRN); viewGRN = null"
              class="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50">
              <Ban class="w-4 h-4" /> Void GRN
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Void Modal ── -->
    <BaseModal v-model="showVoid" title="Void GRN" max-width="max-w-sm">
      <div class="space-y-4">
        <div class="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
          <p class="font-semibold">⚠ Warning</p>
          <p class="mt-1">Voiding <strong>{{ voidTarget?.grnNumber }}</strong> will reverse all stock increments. This cannot be undone.</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Reason for Void *</label>
          <textarea v-model="voidReason" rows="3" required placeholder="Explain why this GRN is being voided..." class="inp resize-none" />
        </div>
        <div class="flex justify-end gap-3">
          <button @click="showVoid = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600">Cancel</button>
          <button
            @click="confirmVoid"
            :disabled="!voidReason.trim()"
            class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40"
          >Confirm Void</button>
        </div>
      </div>
    </BaseModal>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGrnStore } from '@/stores/grn'
import { usePurchaseStore } from '@/stores/purchases'
import { useProductStore } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import BaseModal from '@/components/ui/BaseModal.vue'
import { Plus, Search, Eye, X, Ban, ChevronLeft, ChevronRight } from '@lucide/vue'

const store         = useGrnStore()
const purchaseStore = usePurchaseStore()
const productStore  = useProductStore()
const authStore     = useAuthStore()
const toast         = useToastStore()

const search       = ref('')
const filterStatus = ref('')
const showForm     = ref(false)
const showVoid     = ref(false)
const formError    = ref('')
const viewGRN      = ref(null)
const voidTarget   = ref(null)
const voidReason   = ref('')

const emptyForm = () => ({
  poId: '', poNumber: '', supplierId: '', supplierName: '',
  invoiceNumber: '', receiveDate: new Date().toISOString().split('T')[0],
  remarks: '', items: [],
})
const form = ref(emptyForm())

// Only POs that can still receive items
const receivablePOs = computed(() =>
  purchaseStore.orders.filter(o => ['approved', 'partially_received'].includes(o.status))
)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return store.grns.filter(g => {
    const matchSearch = !q || g.grnNumber.toLowerCase().includes(q) || g.poNumber.toLowerCase().includes(q) || g.supplierName.toLowerCase().includes(q)
    const matchStatus = !filterStatus.value || g.status === filterStatus.value
    return matchSearch && matchStatus
  })
})

const formTotal = computed(() => form.value.items.reduce((s, i) => s + store.lineTotal(i), 0))

function onPOChange() {
  const po = purchaseStore.orders.find(o => o.id === form.value.poId)
  if (!po) { form.value.items = []; return }

  form.value.poNumber    = po.poNumber
  form.value.supplierId  = po.supplierId
  form.value.supplierName = po.supplierName

  // Build items from PO — only items with pending qty
  form.value.items = po.items.map(i => ({
    id:          i.id,
    productId:   i.productId,
    productName: i.productName,
    sku:         i.sku,
    unit:        productStore.products.find(p => p.id === i.productId)?.unit || 'pcs',
    orderedQty:  i.qty,
    pending:     Math.max(0, i.qty - (i.receivedQty || 0)),
    receivedQty: Math.max(0, i.qty - (i.receivedQty || 0)), // pre-fill with pending
    costPrice:   i.costPrice,
    tax:         i.tax || 0,
  }))
}

function openCreate() {
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

function saveGRN() {
  formError.value = ''
  const itemsToReceive = form.value.items.filter(i => i.receivedQty > 0)
  if (!itemsToReceive.length) { formError.value = 'Enter at least one item quantity to receive'; return }

  try {
    const grn = store.create({ ...form.value, items: itemsToReceive }, productStore)

    // Update PO received quantities
    const receivedMap = {}
    itemsToReceive.forEach(i => { receivedMap[i.id] = i.receivedQty })
    purchaseStore.receiveItems(form.value.poId, receivedMap)

    toast.success(`${grn.grnNumber} posted — stock updated`)
    showForm.value = false
  } catch (e) {
    formError.value = e.message
  }
}

function openView(grn) {
  viewGRN.value = store.grns.find(g => g.id === grn.id)
}

function askVoid(grn) {
  voidTarget.value = grn
  voidReason.value = ''
  showVoid.value = true
}

function confirmVoid() {
  try {
    store.voidGRN(voidTarget.value.id, voidReason.value, productStore)
    toast.warning(`${voidTarget.value.grnNumber} voided — stock reversed`)
    showVoid.value = false
  } catch (e) {
    toast.error(e.message)
  }
}

const canVoid = (grn) => grn.status === 'posted' && ['owner', 'manager'].includes(authStore.role)
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
