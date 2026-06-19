<template>
  <div class="space-y-5">

    <!-- Summary cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Today's Cash</p>
        <p class="text-2xl font-bold text-green-600 mt-1">₱{{ todayCashNet.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">In drawer</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Today's Electronic</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">₱{{ pmtStore.todayElectronic.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">GCash · Maya · Card</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">All-time Total</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">₱{{ grandTotalNet.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Completed payments</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Voided</p>
        <p class="text-2xl font-bold text-red-500 mt-1">{{ pmtStore.voidedCount }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Payment records</p>
      </div>
    </div>

    <!-- Payment method breakdown -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">Breakdown by Payment Method</h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div v-for="type in PAYMENT_TYPES" :key="type"
          class="rounded-lg border p-3 flex flex-col gap-1"
          :class="pmtStore.totalByType[type] ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'">
          <span :class="[PAYMENT_STYLE[type]?.bg, PAYMENT_STYLE[type]?.text, 'text-xs font-semibold px-2 py-0.5 rounded-full self-start']">
            {{ type }}
          </span>
          <p class="text-base font-bold text-gray-800 mt-1">
            ₱{{ (pmtStore.totalByType[type] || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
          </p>
          <p class="text-xs text-gray-400">
            {{ pmtStore.payments.filter(p => p.paymentType === type && p.status === 'completed').length }} payment(s)
          </p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
      <input v-model="filters.search" type="text" placeholder="Reference #, Transaction #..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input v-model="filters.from" type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input v-model="filters.to"   type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="filters.type" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Types</option>
        <option v-for="t in PAYMENT_TYPES" :key="t">{{ t }}</option>
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
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference #</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Change / Sukli</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cashier</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="!filteredPayments.length">
            <td colspan="10" class="px-4 py-10 text-center text-gray-400">No payment records found</td>
          </tr>
          <tr v-for="pmt in filteredPayments" :key="pmt.id"
            class="hover:bg-gray-50 transition-colors"
            :class="pmt.status === 'voided' ? 'opacity-60' : ''">
            <td class="px-4 py-3 font-mono text-xs font-medium text-blue-600">{{ pmt.referenceNumber }}</td>
            <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ pmt.transactionId }}</td>
            <td class="px-4 py-3 text-gray-600 text-xs">
              <p>{{ formatDate(pmt.date) }}</p>
              <p class="text-gray-400">{{ formatTime(pmt.date) }}</p>
            </td>
            <td class="px-4 py-3">
              <span :class="[typeStyle(pmt.paymentType), 'px-2 py-1 rounded-full text-xs font-semibold']">
                {{ pmt.paymentType }}
              </span>
              <span v-if="isElectronic(pmt.paymentType)" class="ml-1 text-xs text-gray-400">⚡</span>
            </td>
            <td class="px-4 py-3 text-right">
              <p class="font-semibold" :class="pmt.status === 'voided' ? 'text-red-400 line-through' : 'text-gray-900'">
                ₱{{ getNetAmount(pmt).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </p>
              <p v-if="getChange(pmt) !== null && pmt.amount !== getNetAmount(pmt)" class="text-xs text-gray-400 mt-0.5">
                Tendered: ₱{{ pmt.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </p>
            </td>
            <td class="px-4 py-3 text-right text-sm">
              <template v-if="getChange(pmt) !== null">
                <span :class="getChange(pmt) > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'">
                  {{ getChange(pmt) > 0 ? '₱' + getChange(pmt).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '—' }}
                </span>
              </template>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="px-4 py-3 text-gray-700">{{ pmt.cashier }}</td>
            <td class="px-4 py-3 text-gray-500">{{ pmt.customer || '—' }}</td>
            <td class="px-4 py-3">
              <span :class="pmt.status === 'voided' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'"
                class="px-2 py-1 rounded-full text-xs font-semibold capitalize">
                {{ pmt.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <button @click="openView(pmt)" class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                  <Eye class="w-4 h-4" />
                </button>
                <button v-if="pmt.status === 'completed'"
                  @click="openVoid(pmt)" class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Void Payment">
                  <Ban class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">
          {{ pmtStore.pagination.total > 0
            ? `Showing ${pmtStore.pagination.from}–${pmtStore.pagination.to} of ${pmtStore.pagination.total} records`
            : `${filteredPayments.length} record(s)` }}
        </span>
        <div v-if="pmtStore.pagination.lastPage > 1" class="flex items-center gap-1">
          <button :disabled="pmtStore.pagination.currentPage <= 1"
            @click="pmtStore.fetchPage(pmtStore.pagination.currentPage - 1)"
            class="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-xs text-gray-600 px-2 font-medium">
            {{ pmtStore.pagination.currentPage }} / {{ pmtStore.pagination.lastPage }}
          </span>
          <button :disabled="pmtStore.pagination.currentPage >= pmtStore.pagination.lastPage"
            @click="pmtStore.fetchPage(pmtStore.pagination.currentPage + 1)"
            class="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── View Modal ── -->
    <div v-if="viewPmt" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-800">Payment Detail</h3>
          <button @click="viewPmt = null" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Void banner -->
        <div v-if="viewPmt.status === 'voided'" class="px-6 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <Ban class="w-4 h-4 text-red-500 shrink-0" />
          <div class="text-xs">
            <span class="font-semibold text-red-600">VOIDED</span>
            <span class="text-red-500 ml-2">{{ formatDateTime(viewPmt.voidedAt) }} by {{ viewPmt.voidedBy }}</span>
            <p v-if="viewPmt.voidReason" class="text-red-400 mt-0.5">{{ viewPmt.voidReason }}</p>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <!-- Amount (prominent) -->
          <div class="text-center py-3 bg-gray-50 rounded-xl">
            <p class="text-xs text-gray-500 mb-1">Sale Amount</p>
            <p class="text-4xl font-bold" :class="viewPmt.status === 'voided' ? 'text-red-400 line-through' : 'text-gray-900'">
              ₱{{ getNetAmount(viewPmt).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </p>
            <p v-if="getChange(viewPmt) !== null && viewPmt.amount !== getNetAmount(viewPmt)" class="text-xs text-gray-400 mt-1">
              Cash tendered: ₱{{ viewPmt.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </p>
            <span :class="[typeStyle(viewPmt.paymentType), 'mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold']">
              {{ viewPmt.paymentType }}
              <span v-if="isElectronic(viewPmt.paymentType)" class="ml-1">⚡</span>
            </span>
          </div>

          <!-- Change highlight (cash only) -->
          <div v-if="getChange(viewPmt) !== null" class="flex items-center justify-between px-4 py-3 rounded-xl"
            :class="getChange(viewPmt) > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'">
            <div>
              <p class="text-xs font-semibold" :class="getChange(viewPmt) > 0 ? 'text-green-600' : 'text-gray-500'">Change / Sukli</p>
              <p class="text-xs text-gray-400 mt-0.5">Returned to customer</p>
            </div>
            <p class="text-2xl font-bold" :class="getChange(viewPmt) > 0 ? 'text-green-600' : 'text-gray-400'">
              {{ getChange(viewPmt) > 0 ? '₱' + getChange(viewPmt).toLocaleString('en-PH', { minimumFractionDigits: 2 }) : '₱0.00' }}
            </p>
          </div>

          <!-- Details grid -->
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-xs text-gray-400">Reference #</p>
              <p class="font-mono font-semibold text-gray-800">{{ viewPmt.referenceNumber }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Transaction</p>
              <p class="font-mono font-semibold text-blue-600">{{ viewPmt.transactionId }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Date</p>
              <p class="text-gray-700">{{ formatDate(viewPmt.date) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Time</p>
              <p class="text-gray-700">{{ formatTime(viewPmt.date) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Cashier</p>
              <p class="text-gray-700">{{ viewPmt.cashier }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Customer</p>
              <p class="text-gray-700">{{ viewPmt.customer || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Channel</p>
              <p class="text-gray-700">{{ isElectronic(viewPmt.paymentType) ? 'Electronic' : 'Cash / In-store' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Status</p>
              <span :class="viewPmt.status === 'voided' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'"
                class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                {{ viewPmt.status }}
              </span>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button @click="viewPmt = null" class="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Close
          </button>
          <button v-if="viewPmt.status === 'completed'"
            @click="openVoid(viewPmt); viewPmt = null"
            class="flex items-center justify-center gap-2 flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
            <Ban class="w-4 h-4" /> Void
          </button>
        </div>
      </div>
    </div>

    <!-- ── Void Modal ── -->
    <div v-if="voidTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">Void Payment</h3>
          <p class="text-sm text-gray-500 mt-0.5">
            {{ voidTarget.referenceNumber }}
            <span :class="[typeStyle(voidTarget.paymentType), 'ml-2 px-2 py-0.5 rounded-full text-xs font-semibold']">{{ voidTarget.paymentType }}</span>
            <span class="ml-2 font-semibold text-gray-800">₱{{ voidTarget.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </p>
        </div>

        <div class="p-6 space-y-4">
          <!-- Impact note -->
          <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 text-xs text-orange-700 space-y-1">
            <p class="font-semibold">⚠ Important:</p>
            <p>Only this payment record will be voided. The parent transaction <strong>{{ voidTarget.transactionId }}</strong> will remain active.</p>
            <p>To fully reverse the sale, also void the transaction from the Transactions page.</p>
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Void Reason <span class="text-red-500">*</span></label>
            <select v-model="voidForm.reason" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="">Select reason...</option>
              <option>Payment transfer failed</option>
              <option>Duplicate payment</option>
              <option>Wrong amount entered</option>
              <option>Customer payment bounced</option>
              <option>System error</option>
              <option>Other</option>
            </select>
          </div>

          <!-- Manager approval if cashier -->
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
                  <input v-model="voidForm.approverPassword" type="password"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </template>

          <p v-if="voidError" class="text-sm text-red-600 font-medium">{{ voidError }}</p>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button @click="voidTarget = null; voidError = ''" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button @click="confirmVoid" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
            <Ban class="w-4 h-4" /> Confirm Void
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show"
      class="fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
      :class="toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'">
      <CheckCircle v-if="toast.type === 'success'" class="w-4 h-4" />
      <Ban v-else class="w-4 h-4" />
      {{ toast.message }}
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { usePaymentStore }     from '@/stores/payments'
import { useTransactionStore } from '@/stores/transactions'
import { useAuthStore }        from '@/stores/auth'
import { mockUsers } from '@/mock/users'
import { PAYMENT_TYPES, PAYMENT_STYLE, ELECTRONIC_TYPES } from '@/mock/payments'
import { Eye, Ban, X, ShieldCheck, CheckCircle, ChevronLeft, ChevronRight } from '@lucide/vue'

const pmtStore  = usePaymentStore()
const txnStore  = useTransactionStore()
const authStore = useAuthStore()

function getChange(pmt) {
  if (isElectronic(pmt.paymentType)) return null
  const txn = txnStore.transactions.find(t => t.id?.toString() === pmt.transactionId?.toString())
  // Prefer stored value; backend currently saves change_given as 0, so fall back to amountPaid - total
  const stored = parseFloat(pmt.change ?? pmt.changeGiven ?? txn?.changeGiven ?? txn?.change ?? 0) || 0
  if (stored > 0) return stored
  const amountPaid = parseFloat(txn?.amountPaid ?? pmt.amount ?? 0)
  const total      = parseFloat(txn?.total ?? 0)
  return amountPaid > total ? parseFloat((amountPaid - total).toFixed(2)) : 0
}

function getNetAmount(pmt) {
  const change = getChange(pmt)
  if (change === null) return pmt.amount
  const txn = txnStore.transactions.find(t => t.id?.toString() === pmt.transactionId?.toString())
  // Use transaction total directly if available (most accurate)
  return parseFloat(txn?.total ?? Math.max(0, pmt.amount - change))
}

// Corrected totals using net amounts (exclude change from cash payments)
const todayCashNet = computed(() =>
  pmtStore.todayPayments
    .filter(p => !isElectronic(p.paymentType) && p.status === 'completed')
    .reduce((s, p) => s + getNetAmount(p), 0)
)
const grandTotalNet = computed(() =>
  pmtStore.completedPayments.reduce((s, p) => s + getNetAmount(p), 0)
)

// ── Helpers ──
function typeStyle(type) {
  const s = PAYMENT_STYLE[type]
  return s ? `${s.bg} ${s.text}` : 'bg-gray-100 text-gray-600'
}
function isElectronic(type) { return ELECTRONIC_TYPES.has(type) }
function formatDate(d)     { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) }
function formatTime(d)     { return new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—' }

// ── Filters ──
const filters = reactive({ search: '', from: '', to: '', type: '', status: '' })

const filteredPayments = computed(() => {
  let list = [...pmtStore.payments]
  const q = filters.search.toLowerCase()
  if (q) list = list.filter(p => p.id.toLowerCase().includes(q) || p.transactionId.toLowerCase().includes(q))
  if (filters.from)   list = list.filter(p => p.date.slice(0, 10) >= filters.from)
  if (filters.to)     list = list.filter(p => p.date.slice(0, 10) <= filters.to)
  if (filters.type)   list = list.filter(p => p.paymentType === filters.type)
  if (filters.status) list = list.filter(p => p.status === filters.status)
  return list
})

function resetFilters() { Object.assign(filters, { search: '', from: '', to: '', type: '', status: '' }) }

// ── View ──
const viewPmt = ref(null)
function openView(pmt) { viewPmt.value = pmt }

// ── Void ──
const voidTarget  = ref(null)
const voidError   = ref('')
const voidForm    = reactive({ reason: '', approverEmail: '', approverPassword: '' })

function openVoid(pmt) {
  voidTarget.value = pmt
  voidError.value  = ''
  Object.assign(voidForm, { reason: '', approverEmail: '', approverPassword: '' })
}

function confirmVoid() {
  voidError.value = ''
  if (!voidForm.reason) { voidError.value = 'Please select a void reason.'; return }

  let approvedBy = `${authStore.user?.firstName} ${authStore.user?.lastName}`

  if (authStore.role === 'cashier') {
    if (!voidForm.approverEmail || !voidForm.approverPassword) {
      voidError.value = 'Manager approval is required.'; return
    }
    const approver = mockUsers.find(u =>
      u.email    === voidForm.approverEmail &&
      u.password === voidForm.approverPassword &&
      (u.role === 'manager' || u.role === 'owner')
    )
    if (!approver) { voidError.value = 'Invalid credentials or not a manager/owner.'; return }
    approvedBy = `${approver.firstName} ${approver.lastName}`
  }

  const ok = pmtStore.voidPayment(voidTarget.value.id, { approvedBy, reason: voidForm.reason })
  if (ok) {
    showToast(`Payment ${voidTarget.value.referenceNumber} voided.`, 'success')
    voidTarget.value = null
  } else {
    voidError.value = 'Failed to void payment.'
  }
}

// ── Toast ──
const toast = reactive({ show: false, type: 'success', message: '' })
function showToast(message, type = 'success') {
  Object.assign(toast, { show: true, type, message })
  setTimeout(() => { toast.show = false }, 3000)
}
</script>
