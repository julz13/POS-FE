<template>
  <div class="space-y-5">

    <!-- Summary cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Today's Sales</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">₱{{ txnStore.todaySales.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ txnStore.todayCount }} transaction{{ txnStore.todayCount !== 1 ? 's' : '' }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Monthly Sales</p>
        <p class="text-2xl font-bold text-green-600 mt-1">₱{{ txnStore.monthlySales.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">{{ txnStore.monthCount }} transactions</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Voided</p>
        <p class="text-2xl font-bold text-red-500 mt-1">{{ txnStore.voidedCount }}</p>
        <p class="text-xs text-gray-400 mt-0.5">All time</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Total Records</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ txnStore.transactions.length }}</p>
        <p class="text-xs text-gray-400 mt-0.5">All time</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
      <input v-model="filters.search" type="text" placeholder="Receipt #, customer, cashier..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-52 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input v-model="filters.from" type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input v-model="filters.to" type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="filters.payment" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Payments</option>
        <option v-for="m in paymentMethods" :key="m">{{ m }}</option>
      </select>
      <select v-model="filters.status" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Status</option>
        <option value="completed">Completed</option>
        <option value="voided">Voided</option>
      </select>
      <button @click="resetFilters" class="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg">Reset</button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Receipt #</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cashier</th>
            <th class="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payments</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <!-- Loading skeleton rows -->
          <template v-if="txnStore.loading">
            <tr v-for="n in 7" :key="`sk${n}`" class="animate-pulse">
              <td class="px-4 py-3"><div class="h-3 bg-gray-100 rounded w-24"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-28 mb-1"></div><div class="h-3 bg-gray-100 rounded w-16"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-28"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-24"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-8 mx-auto"></div></td>
              <td class="px-4 py-3"><div class="h-5 bg-gray-100 rounded w-14"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-20 ml-auto"></div></td>
              <td class="px-4 py-3"><div class="h-5 bg-gray-100 rounded-full w-16"></div></td>
              <td class="px-4 py-3"></td>
            </tr>
          </template>
          <!-- Empty state -->
          <tr v-else-if="!filteredTxns.length">
            <td colspan="9" class="px-4 py-10 text-center text-gray-400">No transactions found</td>
          </tr>
          <tr v-else v-for="txn in filteredTxns" :key="txn.id"
            class="hover:bg-gray-50 transition-colors"
            :class="txn.status === 'voided' ? 'opacity-60' : ''">
            <td class="px-4 py-3 font-mono text-xs font-medium text-blue-600">{{ txn.id }}</td>
            <td class="px-4 py-3 text-gray-600 text-xs">
              <p>{{ formatDate(txn.date) }}</p>
              <p class="text-gray-400">{{ formatTime(txn.date) }}</p>
            </td>
            <td class="px-4 py-3 text-gray-700">{{ txn.customer || '—' }}</td>
            <td class="px-4 py-3 text-gray-700">{{ txn.cashier }}</td>
            <td class="px-4 py-3 text-center text-gray-600">{{ txn.items.length }}</td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span v-for="p in txn.payments" :key="p.paymentMethod ?? p.method"
                  class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{{ p.paymentMethod ?? p.method }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-right font-semibold"
              :class="txn.status === 'voided' ? 'text-red-400 line-through' : 'text-gray-900'">
              ₱{{ txn.total.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td class="px-4 py-3">
              <span :class="txn.status === 'voided' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'"
                class="px-2 py-1 rounded-full text-xs font-semibold capitalize">
                {{ txn.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <button @click="openView(txn)"
                  class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View Receipt">
                  <Eye class="w-4 h-4" />
                </button>
                <button v-if="txn.status === 'completed' && canVoid"
                  @click="openVoid(txn)"
                  class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Void Transaction">
                  <Ban class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">
          {{ txnStore.pagination.total > 0
            ? `Showing ${txnStore.pagination.from}–${txnStore.pagination.to} of ${txnStore.pagination.total} records`
            : `${filteredTxns.length} record(s)` }}
        </span>
        <div v-if="txnStore.pagination.lastPage > 1" class="flex items-center gap-1">
          <button :disabled="txnStore.pagination.currentPage <= 1"
            @click="txnStore.fetchPage(txnStore.pagination.currentPage - 1)"
            class="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-xs text-gray-600 px-2 font-medium">
            {{ txnStore.pagination.currentPage }} / {{ txnStore.pagination.lastPage }}
          </span>
          <button :disabled="txnStore.pagination.currentPage >= txnStore.pagination.lastPage"
            @click="txnStore.fetchPage(txnStore.pagination.currentPage + 1)"
            class="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── View Receipt Modal ── -->
    <div v-if="viewTxn" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        <!-- Void banner -->
        <div v-if="viewTxn.status === 'voided'"
          class="flex items-center gap-2 px-6 py-3 bg-red-50 border-b border-red-200 rounded-t-2xl">
          <Ban class="w-4 h-4 text-red-500" />
          <div class="text-sm">
            <span class="font-semibold text-red-600">VOIDED</span>
            <span class="text-red-500 ml-2">{{ formatDateTime(viewTxn.voidedAt) }} by {{ viewTxn.voidedBy }}</span>
          </div>
        </div>
        <div v-if="viewTxn.status === 'voided' && viewTxn.voidReason"
          class="px-6 py-1.5 bg-red-50 border-b border-red-100 text-xs text-red-500">
          Reason: {{ viewTxn.voidReason }}
        </div>

        <!-- Returns banner -->
        <div v-if="viewTxn.returns?.length"
          class="flex items-center gap-2 px-6 py-2 bg-orange-50 border-b border-orange-100">
          <RotateCcw class="w-4 h-4 text-orange-500" />
          <span class="text-xs text-orange-600 font-medium">{{ viewTxn.returns.length }} return(s) linked to this transaction</span>
        </div>

        <div class="overflow-y-auto flex-1">
          <!-- Receipt content -->
          <div id="receipt-print-view" class="p-6">
            <div class="text-center mb-4">
              <p class="font-bold text-base">{{ settingsStore.config.storeName }}</p>
              <div class="border-t border-dashed border-gray-300 my-3"></div>
              <p class="font-semibold text-sm">OFFICIAL RECEIPT</p>
              <p class="text-xs text-gray-400 font-mono mt-1">{{ viewTxn.receiptNumber ?? viewTxn.id }}</p>
              <p class="text-xs text-gray-400">{{ formatDateTime(viewTxn.date) }}</p>
              <p class="text-xs text-gray-500 mt-0.5">Cashier: {{ viewTxn.cashier }}</p>
              <p v-if="viewTxn.customer" class="text-xs text-gray-500">Customer: {{ viewTxn.customer }}</p>
            </div>

            <div class="border-t border-dashed border-gray-300 py-3 space-y-2">
              <div v-for="item in viewTxn.items" :key="item.id + '-' + (item.productName ?? item.name)">
                <div class="flex justify-between text-xs">
                  <span class="text-gray-800 font-medium">{{ item.productName ?? item.name }}</span>
                  <span class="text-gray-900">₱{{ itemLineTotal(item).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-xs text-gray-400 pl-2">
                  <span>{{ item.quantity ?? item.qty }} × ₱{{ item.unitPrice ?? item.sellingPrice }}<span v-if="(item.discountAmount ?? 0) > 0"> (−₱{{ (item.discountAmount ?? 0).toFixed(2) }})</span></span>
                </div>
              </div>
            </div>

            <div class="border-t border-dashed border-gray-300 pt-3 space-y-1">
              <div class="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span><span>₱{{ viewTxn.subtotal.toFixed(2) }}</span>
              </div>
              <div v-if="viewTxn.lineDiscounts > 0" class="flex justify-between text-xs text-red-400">
                <span>Line Discounts</span><span>−₱{{ viewTxn.lineDiscounts.toFixed(2) }}</span>
              </div>
              <div v-if="viewTxn.transactionDiscount > 0" class="flex justify-between text-xs text-red-400">
                <span>Transaction Discount</span><span>−₱{{ viewTxn.transactionDiscount.toFixed(2) }}</span>
              </div>
              <div v-if="parseFloat(viewTxn.taxAmount ?? 0) > 0" class="flex justify-between text-xs text-gray-500">
                <span>{{ viewTxn.taxName }} {{ viewTxn.taxRate }}%</span><span>₱{{ parseFloat(viewTxn.taxAmount ?? 0).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm font-bold text-gray-900 border-t border-dashed border-gray-300 pt-2 mt-1">
                <span>TOTAL</span><span>₱{{ viewTxn.total.toFixed(2) }}</span>
              </div>
              <div v-for="p in viewTxn.payments" :key="p.paymentMethod ?? p.method" class="flex justify-between text-xs text-gray-500">
                <span>{{ p.paymentMethod ?? p.method }}</span><span>₱{{ p.amount.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-xs font-semibold text-gray-700">
                <span>Change</span><span>₱{{ (viewTxn.change || 0).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button @click="viewTxn = null" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:text-gray-900">
            Close
          </button>
          <button @click="printReceipt" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <Printer class="w-4 h-4" /> Print
          </button>
          <button v-if="viewTxn.status === 'completed' && canVoid"
            @click="openVoid(viewTxn); viewTxn = null"
            class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
            <Ban class="w-4 h-4" /> Void
          </button>
        </div>
      </div>
    </div>

    <!-- ── Void Modal ── -->
    <div v-if="voidTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">Void Transaction</h3>
          <p class="text-sm text-gray-500 mt-0.5">{{ voidTarget.id }} — ₱{{ voidTarget.total.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        </div>

        <div class="p-6 space-y-5">
          <!-- Impact summary -->
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-xs font-semibold text-red-700 mb-2">What will happen:</p>
            <ul class="text-xs text-red-600 space-y-1">
              <li v-for="item in voidTarget.items" :key="item.id">
                ↩ {{ item.productName ?? item.name }} ×{{ item.quantity ?? item.qty }} will be returned to stock
              </li>
              <li>₱{{ voidTarget.total.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} will be marked as reversed in reports</li>
            </ul>
          </div>

          <!-- Void reason -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Void Reason <span class="text-red-500">*</span></label>
            <select v-model="voidForm.reason" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="">Select reason...</option>
              <option>Wrong items scanned</option>
              <option>Customer cancelled</option>
              <option>Payment error</option>
              <option>Duplicate transaction</option>
              <option>System error</option>
              <option>Other</option>
            </select>
          </div>

          <!-- Manager approval (cashier only) -->
          <template v-if="authStore.role === 'cashier'">
            <div class="border-t border-gray-100 pt-4">
              <p class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <ShieldCheck class="w-4 h-4 text-orange-500" />
                Manager Approval Required
              </p>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Manager / Owner Email</label>
                  <input v-model="voidForm.approverEmail" type="email" placeholder="manager@pabilipos.com"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 mb-1">Password</label>
                  <input v-model="voidForm.approverPassword" type="password" placeholder="Enter manager password"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </template>

          <p v-if="voidError" class="text-sm text-red-600 font-medium">{{ voidError }}</p>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button @click="voidTarget = null; voidError = ''" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button @click="confirmVoid"
            class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
            <Ban class="w-4 h-4" /> Confirm Void
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show"
      class="fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
      :class="toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'">
      <CheckCircle v-if="toast.type === 'success'" class="w-4 h-4" />
      <Ban v-else-if="toast.type === 'error'" class="w-4 h-4" />
      {{ toast.message }}
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { useAuthStore }        from '@/stores/auth'
import { useSettingsStore }    from '@/stores/settings'
import { mockUsers } from '@/mock/users'
import { Eye, Ban, Printer, RotateCcw, ShieldCheck, CheckCircle, ChevronLeft, ChevronRight } from '@lucide/vue'

const txnStore      = useTransactionStore()
const authStore     = useAuthStore()
const settingsStore = useSettingsStore()

const paymentMethods = ['Cash', 'GCash', 'Maya', 'QRPH', 'Debit', 'Credit']

// ── Void permission — only owner and manager can void (or cashier with manager approval) ──
const canVoid = computed(() => ['owner', 'manager', 'cashier'].includes(authStore.role))

// ── Filters ──
const filters = reactive({ search: '', from: '', to: '', payment: '', status: '' })

const filteredTxns = computed(() => {
  let list = [...txnStore.transactions]
  const q = filters.search.toLowerCase()
  if (q) list = list.filter(t =>
    t.id.toLowerCase().includes(q) ||
    (t.customer || '').toLowerCase().includes(q) ||
    t.cashier.toLowerCase().includes(q)
  )
  if (filters.from) list = list.filter(t => t.date.slice(0, 10) >= filters.from)
  if (filters.to)   list = list.filter(t => t.date.slice(0, 10) <= filters.to)
  if (filters.payment) list = list.filter(t => t.payments.some(p => (p.paymentMethod ?? p.method) === filters.payment))
  if (filters.status)  list = list.filter(t => t.status === filters.status)
  return list
})

function resetFilters() { Object.assign(filters, { search: '', from: '', to: '', payment: '', status: '' }) }

// ── Helpers ──
function formatDate(d) { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) }
function formatTime(d) { return new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) }
function formatDateTime(d) { return new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) }
function itemLineTotal(item) {
  if (item.lineTotal) return item.lineTotal
  const price = item.unitPrice ?? item.sellingPrice ?? 0
  const qty   = item.quantity  ?? item.qty          ?? 0
  return price * qty - (item.discountAmount ?? 0)
}

// ── View Receipt ──
const viewTxn = ref(null)
function openView(txn) { viewTxn.value = txn }

function printReceipt() {
  const content = document.getElementById('receipt-print-view')
  if (!content) return
  const win = window.open('', '_blank', 'width=400,height=600')
  win.document.write(`
    <html><head>
      <title>Receipt - ${viewTxn.value?.receiptNumber ?? viewTxn.value?.id}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier New',monospace; font-size:12px; width:80mm; padding:8px; }
        .text-center { text-align:center; }
        .font-bold { font-weight:bold; }
      </style>
    </head><body>${content.innerHTML}</body></html>
  `)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 300)
}

// ── Void ──
const voidTarget  = ref(null)
const voidError   = ref('')
const voidForm    = reactive({ reason: '', approverEmail: '', approverPassword: '' })

function openVoid(txn) {
  voidTarget.value = txn
  voidError.value = ''
  Object.assign(voidForm, { reason: '', approverEmail: '', approverPassword: '' })
}

function confirmVoid() {
  voidError.value = ''

  if (!voidForm.reason) {
    voidError.value = 'Please select a void reason.'
    return
  }

  let approvedBy = `${authStore.user?.firstName} ${authStore.user?.lastName}`

  // Cashier must get manager/owner approval
  if (authStore.role === 'cashier') {
    if (!voidForm.approverEmail || !voidForm.approverPassword) {
      voidError.value = 'Manager approval is required. Enter email and password.'
      return
    }
    const approver = mockUsers.find(u =>
      u.email === voidForm.approverEmail &&
      u.password === voidForm.approverPassword &&
      (u.role === 'manager' || u.role === 'owner')
    )
    if (!approver) {
      voidError.value = 'Invalid credentials or user is not a manager/owner.'
      return
    }
    approvedBy = `${approver.firstName} ${approver.lastName}`
  }

  const success = txnStore.voidTransaction(voidTarget.value.id, {
    approvedBy,
    reason: voidForm.reason,
  })

  if (success) {
    showToast(`Transaction ${voidTarget.value.id} voided successfully.`, 'success')
    voidTarget.value = null
  } else {
    voidError.value = 'Failed to void transaction.'
  }
}

// ── Toast ──
const toast = reactive({ show: false, type: 'success', message: '' })
function showToast(message, type = 'success') {
  Object.assign(toast, { show: true, type, message })
  setTimeout(() => { toast.show = false }, 3000)
}
</script>
