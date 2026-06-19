<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Quotes</h2>
        <p class="text-sm text-gray-500">Create price estimates and convert them to sales</p>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
        <Plus class="w-4 h-4" /> New Quote
      </button>
    </div>

    <!-- Status cards -->
    <div class="grid grid-cols-4 gap-4">
      <div v-for="s in statusCards" :key="s.label" class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div :class="`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`">
          <component :is="s.icon" :class="`w-4 h-4 ${s.color}`" />
        </div>
        <div><p class="text-xl font-bold text-gray-800">{{ s.count }}</p><p class="text-xs text-gray-500">{{ s.label }}</p></div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
      <input v-model="filters.search" type="text" placeholder="Quote #, customer..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="filters.status" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Status</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="expired">Expired</option>
        <option value="converted">Converted</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <button @click="Object.assign(filters, { search: '', status: '' })" class="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-2 rounded-lg">Reset</button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quote #</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valid Until</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="!filteredQuotes.length">
            <td colspan="8" class="px-4 py-10 text-center text-gray-400">No quotes found</td>
          </tr>
          <tr v-for="q in filteredQuotes" :key="q.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{{ q.id }}</td>
            <td class="px-4 py-3">
              <p class="font-medium text-gray-800">{{ q.customer || '—' }}</p>
              <p v-if="q.phone" class="text-xs text-gray-400">{{ q.phone }}</p>
            </td>
            <td class="px-4 py-3 text-gray-600 text-xs">{{ q.date }}</td>
            <td class="px-4 py-3 text-xs" :class="isExpired(q) && q.computedStatus !== 'converted' ? 'text-red-500 font-medium' : 'text-gray-500'">
              {{ q.validUntil || '—' }}
            </td>
            <td class="px-4 py-3 text-right text-gray-600">{{ q.items.length }}</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900">
              ₱{{ quoteStore.quoteTotal(q).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td class="px-4 py-3">
              <span :class="statusBadge(q.computedStatus)" class="px-2 py-1 rounded-full text-xs font-semibold capitalize">
                {{ q.computedStatus }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button @click="openView(q)" class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View"><Eye class="w-4 h-4" /></button>
                <button v-if="q.computedStatus === 'draft'" @click="openEdit(q)" class="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors" title="Edit"><Pencil class="w-4 h-4" /></button>
                <button v-if="q.computedStatus === 'draft'" @click="handleSend(q.id)" class="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Mark as Sent"><Send class="w-4 h-4" /></button>
                <button v-if="['draft','sent'].includes(q.computedStatus)" @click="handleConvert(q)"
                  class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                  <ShoppingCart class="w-3.5 h-3.5" /> Convert
                </button>
                <button v-if="['draft','sent'].includes(q.computedStatus)" @click="printQuote(q)" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors" title="Print"><Printer class="w-4 h-4" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="quoteStore.pagination.lastPage > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">Showing {{ quoteStore.pagination.from }}–{{ quoteStore.pagination.to }} of {{ quoteStore.pagination.total }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="quoteStore.pagination.currentPage <= 1" @click="quoteStore.fetchPage(quoteStore.pagination.currentPage - 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
          <span class="text-xs text-gray-600 px-2">{{ quoteStore.pagination.currentPage }} / {{ quoteStore.pagination.lastPage }}</span>
          <button :disabled="quoteStore.pagination.currentPage >= quoteStore.pagination.lastPage" @click="quoteStore.fetchPage(quoteStore.pagination.currentPage + 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- ── CREATE / EDIT MODAL ── -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800">{{ editTarget ? 'Edit Quote' : 'New Quote' }}</h3>
          <button @click="showForm = false" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X class="w-5 h-5" /></button>
        </div>

        <div class="overflow-y-auto flex-1 p-6 space-y-5">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Customer Name</label>
              <input v-model="form.customer" type="text" placeholder="Customer or company name"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input v-model="form.phone" type="text" placeholder="09XX-XXX-XXXX"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Valid Until</label>
              <input v-model="form.validUntil" type="date"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <input v-model="form.notes" type="text" placeholder="Internal notes..."
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <!-- Items table -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-gray-700">Items <span class="text-red-500">*</span></label>
              <button @click="addItem" type="button" class="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus class="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50"><tr>
                  <th class="text-left px-3 py-2 text-xs text-gray-500 font-semibold">Product</th>
                  <th class="text-center px-3 py-2 text-xs text-gray-500 font-semibold w-20">Qty</th>
                  <th class="text-right px-3 py-2 text-xs text-gray-500 font-semibold w-24">Price</th>
                  <th class="text-center px-3 py-2 text-xs text-gray-500 font-semibold w-20">Disc%</th>
                  <th class="text-right px-3 py-2 text-xs text-gray-500 font-semibold w-28">Subtotal</th>
                  <th class="w-8"></th>
                </tr></thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-if="!form.items.length">
                    <td colspan="6" class="px-3 py-6 text-center text-gray-400 text-xs">No items added</td>
                  </tr>
                  <tr v-for="(item, i) in form.items" :key="i">
                    <td class="px-3 py-2">
                      <select v-model="item.productId" @change="onProductSelect(item)" class="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">-- Select --</option>
                        <option v-for="p in activeProducts" :key="p.id" :value="p.id">{{ p.name }}</option>
                      </select>
                    </td>
                    <td class="px-3 py-2"><input v-model.number="item.qty" type="number" min="1" class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                    <td class="px-3 py-2"><input v-model.number="item.price" type="number" min="0" step="0.01" class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                    <td class="px-3 py-2"><input v-model.number="item.lineDiscount" type="number" min="0" max="100" class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500" /></td>
                    <td class="px-3 py-2 text-right font-medium text-xs text-gray-700">₱{{ formItemTotal(item).toFixed(2) }}</td>
                    <td class="px-3 py-2 text-center"><button @click="form.items.splice(i,1)" class="text-gray-300 hover:text-red-500"><X class="w-4 h-4" /></button></td>
                  </tr>
                </tbody>
                <tfoot v-if="form.items.length" class="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colspan="4" class="px-3 py-2 text-xs font-semibold text-gray-600 text-right">Quote Total:</td>
                    <td class="px-3 py-2 text-right font-bold text-gray-800">₱{{ formTotal.toFixed(2) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button @click="showForm = false" class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">Cancel</button>
          <button @click="saveQuote" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">{{ editTarget ? 'Save Changes' : 'Create Quote' }}</button>
        </div>
      </div>
    </div>

    <!-- ── VIEW MODAL ── -->
    <div v-if="viewQuote" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">{{ viewQuote.id }}</h3>
            <span :class="statusBadge(viewQuote.computedStatus)" class="text-xs px-2 py-0.5 rounded-full font-semibold capitalize">{{ viewQuote.computedStatus }}</span>
          </div>
          <button @click="viewQuote = null" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X class="w-5 h-5" /></button>
        </div>
        <div id="quote-print" class="overflow-y-auto flex-1 p-6 space-y-4">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><p class="text-xs text-gray-400">Customer</p><p class="font-semibold text-gray-800">{{ viewQuote.customer || '—' }}</p></div>
            <div><p class="text-xs text-gray-400">Phone</p><p class="text-gray-700">{{ viewQuote.phone || '—' }}</p></div>
            <div><p class="text-xs text-gray-400">Date</p><p class="text-gray-700">{{ viewQuote.date }}</p></div>
            <div><p class="text-xs text-gray-400">Valid Until</p><p :class="isExpired(viewQuote) ? 'text-red-500 font-medium' : 'text-gray-700'">{{ viewQuote.validUntil || 'No expiry' }}</p></div>
            <div v-if="viewQuote.notes" class="col-span-2"><p class="text-xs text-gray-400">Notes</p><p class="text-gray-700 italic">{{ viewQuote.notes }}</p></div>
            <div v-if="viewQuote.convertedTxnId" class="col-span-2"><p class="text-xs text-gray-400">Converted to</p><p class="font-mono text-blue-600 font-semibold">{{ viewQuote.convertedTxnId }}</p></div>
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
              <tr v-for="item in viewQuote.items" :key="item.productId">
                <td class="px-3 py-2 text-gray-800 font-medium">{{ item.name }}</td>
                <td class="px-3 py-2 text-center text-gray-600">{{ item.qty }} {{ item.unit }}</td>
                <td class="px-3 py-2 text-right text-gray-600">₱{{ item.price.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                <td class="px-3 py-2 text-center text-gray-500">{{ item.lineDiscount || 0 }}%</td>
                <td class="px-3 py-2 text-right font-semibold text-gray-800">₱{{ quoteStore.lineTotal(item).toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colspan="4" class="px-3 py-2 text-xs font-bold text-gray-600 text-right">TOTAL QUOTE VALUE:</td>
                <td class="px-3 py-2 text-right font-black text-gray-900">₱{{ quoteStore.quoteTotal(viewQuote).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex gap-3 flex-wrap">
          <button @click="viewQuote = null" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Close</button>
          <button @click="printQuote(viewQuote)" class="flex items-center justify-center gap-2 flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            <Printer class="w-4 h-4" /> Print
          </button>
          <button @click="handleEmailQuote(viewQuote)" class="flex items-center justify-center gap-2 flex-1 py-2.5 border border-blue-200 text-blue-600 rounded-lg text-sm hover:bg-blue-50">
            <Mail class="w-4 h-4" /> Email
          </button>
          <button v-if="['draft','sent'].includes(viewQuote.computedStatus)"
            @click="handleConvert(viewQuote); viewQuote = null"
            class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <ShoppingCart class="w-4 h-4" /> Convert to Sale
          </button>
        </div>
      </div>
    </div>

    <!-- Convert confirm -->
    <div v-if="convertTarget" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><ShoppingCart class="w-5 h-5 text-blue-600" /></div>
          <div><h3 class="text-base font-semibold text-gray-800">Convert to Sale</h3><p class="text-sm text-gray-500">{{ convertTarget.id }}</p></div>
        </div>
        <p class="text-sm text-gray-600">All items from this quote will be loaded into the POS cart. You can then process payment.</p>
        <div class="flex gap-3 pt-1">
          <button @click="convertTarget = null" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="confirmConvert" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <ShoppingCart class="w-4 h-4" /> Load into POS
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
      :class="toast.type === 'success' ? 'bg-green-600' : 'bg-blue-600'">{{ toast.message }}</div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useQuoteStore }   from '@/stores/quotes'
import { useProductStore } from '@/stores/products'
import { usePosStore }     from '@/stores/pos'
import { useAuthStore }    from '@/stores/auth'
import { Plus, Eye, Pencil, Send, ShoppingCart, Printer, X, Mail, Clock, CheckCircle, AlertCircle, FileText, ChevronLeft, ChevronRight } from '@lucide/vue'

const quoteStore  = useQuoteStore()
const prodStore   = useProductStore()
const posStore    = usePosStore()
const authStore   = useAuthStore()
const router      = useRouter()

const activeProducts = computed(() => prodStore.products.filter(p => p.status === 'active'))

function isExpired(q) { return q.validUntil && new Date(q.validUntil) < new Date() }

function statusBadge(s) {
  return { draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700', expired: 'bg-red-100 text-red-600', converted: 'bg-green-100 text-green-700', cancelled: 'bg-gray-200 text-gray-500' }[s] || 'bg-gray-100 text-gray-600'
}

const statusCards = computed(() => [
  { label: 'Draft',     count: quoteStore.statusCounts.draft,     bg: 'bg-gray-100',   color: 'text-gray-500',  icon: FileText       },
  { label: 'Sent',      count: quoteStore.statusCounts.sent,      bg: 'bg-blue-100',   color: 'text-blue-600',  icon: Send           },
  { label: 'Expired',   count: quoteStore.statusCounts.expired,   bg: 'bg-red-100',    color: 'text-red-500',   icon: AlertCircle    },
  { label: 'Converted', count: quoteStore.statusCounts.converted, bg: 'bg-green-100',  color: 'text-green-600', icon: CheckCircle    },
])

// ── Filters ──
const filters = reactive({ search: '', status: '' })
const filteredQuotes = computed(() => {
  let list = quoteStore.quotes
  const q = filters.search.toLowerCase()
  if (q) list = list.filter(x => x.id.toLowerCase().includes(q) || (x.customer || '').toLowerCase().includes(q))
  if (filters.status) list = list.filter(x => x.computedStatus === filters.status)
  return list
})

// ── Form ──
const showForm   = ref(false)
const editTarget = ref(null)
const formError  = ref('')
const viewQuote  = ref(null)

const form = reactive({ customer: '', phone: '', validUntil: '', notes: '', items: [] })
const formItemTotal = item => { const b = item.price * item.qty; return b - b * (item.lineDiscount || 0) / 100 }
const formTotal = computed(() => form.items.reduce((s, i) => s + formItemTotal(i), 0))

function blankItem() { return { productId: '', name: '', sku: '', qty: 1, price: 0, lineDiscount: 0, unit: '' } }
function addItem()   { form.items.push(blankItem()) }

function onProductSelect(item) {
  const p = activeProducts.value.find(x => x.id === item.productId)
  if (p) { item.name = p.name; item.sku = p.sku; item.price = p.sellingPrice; item.unit = p.unit }
}

function openCreate() {
  editTarget.value = null
  Object.assign(form, { customer: '', phone: '', validUntil: '', notes: '', items: [] })
  formError.value = ''; showForm.value = true
}
function openEdit(q) {
  editTarget.value = q
  Object.assign(form, { customer: q.customer, phone: q.phone, validUntil: q.validUntil, notes: q.notes, items: q.items.map(i => ({ ...i })) })
  formError.value = ''; showForm.value = true
}
function openView(q) { viewQuote.value = q }

function saveQuote() {
  formError.value = ''
  if (!form.items.length) { formError.value = 'Add at least one item.'; return }
  const bad = form.items.find(i => !i.productId || i.qty <= 0)
  if (bad) { formError.value = 'All items must have a product and qty > 0.'; return }
  const by = `${authStore.user?.firstName} ${authStore.user?.lastName}`
  if (editTarget.value) { quoteStore.updateQuote(editTarget.value.id, { ...form }); showToast('Quote updated') }
  else                   { const id = quoteStore.createQuote({ ...form, createdBy: by }); showToast(`${id} created`) }
  showForm.value = false
}

// ── Actions ──
function handleSend(id)      { quoteStore.markSent(id); showToast('Quote marked as sent') }
function handleEmailQuote(q) { showToast(`Email sent to ${q.customer || 'customer'}`) }

const convertTarget = ref(null)
function handleConvert(q) { convertTarget.value = q }
function confirmConvert() {
  const q     = convertTarget.value
  const items = quoteStore.convertToSale(q.id, 'pending')
  if (!items) return
  posStore.clearCart()
  items.forEach(item => {
    const p = prodStore.products.find(x => x.id === item.productId)
    if (p) {
      posStore.addToCart(p)
      const ci = posStore.cart.find(c => c.id === p.id)
      if (ci) { ci.qty = item.qty; ci.lineDiscount = item.lineDiscount || 0 }
    }
  })
  if (q.customer) posStore.customer = { name: q.customer }
  convertTarget.value = null
  showToast(`${q.id} loaded into POS cart`)
  setTimeout(() => router.push('/pos'), 1000)
}

// ── Print ──
function printQuote(q) {
  const win = window.open('', '_blank', 'width=700,height=500')
  const rows = q.items.map(i => `<tr><td>${i.name}</td><td style="text-align:center">${i.qty} ${i.unit}</td><td style="text-align:right">₱${i.price.toFixed(2)}</td><td style="text-align:center">${i.lineDiscount||0}%</td><td style="text-align:right">₱${quoteStore.lineTotal(i).toFixed(2)}</td></tr>`).join('')
  win.document.write(`<html><head><title>Quote ${q.id}</title>
    <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}h1{font-size:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px}th{background:#f5f5f5;font-weight:bold}p.meta{color:#666;font-size:11px}</style>
    </head><body>
    <h1>PRICE QUOTATION</h1>
    <p class="meta">Quote #: <strong>${q.id}</strong> | Date: ${q.date} | Valid Until: ${q.validUntil || 'N/A'}</p>
    <p class="meta">Customer: <strong>${q.customer || '—'}</strong> | Phone: ${q.phone || '—'}</p>
    <br><table><thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Disc%</th><th>Subtotal</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="4" style="text-align:right;font-weight:bold">TOTAL:</td><td style="text-align:right;font-weight:bold">₱${quoteStore.quoteTotal(q).toFixed(2)}</td></tr></tfoot>
    </table>${q.notes ? `<p style="margin-top:10px;font-style:italic">Notes: ${q.notes}</p>` : ''}
    <p style="margin-top:20px;font-size:10px;color:#999">This is a quotation only. Prices are subject to availability. Valid until ${q.validUntil || 'further notice'}.</p>
    </body></html>`)
  win.document.close(); win.focus(); setTimeout(() => { win.print() }, 300)
}

const toast = reactive({ show: false, type: 'success', message: '' })
function showToast(message, type = 'success') { Object.assign(toast, { show: true, type, message }); setTimeout(() => { toast.show = false }, 3000) }
</script>
