<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Gift Vouchers</h2>
        <p class="text-sm text-gray-500">Issue, redeem, and manage gift vouchers</p>
      </div>
      <button v-if="canManage" @click="openIssue"
        class="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors">
        <Gift class="w-4 h-4" /> Issue Voucher
      </button>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Active Vouchers</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ vStore.activeVouchers.length }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Active + partially used</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Outstanding Value</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">₱{{ vStore.outstandingValue.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Remaining balances</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Redeemed</p>
        <p class="text-2xl font-bold text-gray-600 mt-1">{{ vStore.redeemedCount }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Fully used</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Total Issued</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">₱{{ vStore.totalIssued.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">All time</p>
      </div>
    </div>

    <!-- Check Balance section -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Search class="w-4 h-4 text-gray-400" /> Check Voucher Balance
      </h3>
      <div class="flex gap-3 items-end">
        <div class="flex-1">
          <input v-model="checkCode" type="text" placeholder="Enter voucher code e.g. GV-ABCD1234"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-yellow-400"
            @keydown.enter="doCheckBalance" @input="checkResult = null" />
        </div>
        <button @click="doCheckBalance"
          class="px-5 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors whitespace-nowrap">
          Check Balance
        </button>
      </div>

      <!-- Check result -->
      <div v-if="checkResult" class="mt-3">
        <div v-if="checkResult.ok" class="bg-green-50 border border-green-200 rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-sm font-bold text-gray-800 font-mono">{{ checkResult.voucher.code }}</p>
              <span :class="statusBadge(checkResult.computedStatus)" class="text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-0.5 inline-block">
                {{ checkResult.computedStatus.replace('_', ' ') }}
              </span>
            </div>
            <div class="text-right">
              <p class="text-xs text-gray-500">Remaining Balance</p>
              <p class="text-2xl font-bold text-green-700">₱{{ checkResult.voucher.remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
              <p class="text-xs text-gray-400">of ₱{{ checkResult.voucher.originalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} face value</p>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3 text-xs border-t border-green-200 pt-3">
            <div><p class="text-gray-500">Issued At</p><p class="font-medium text-gray-700">{{ formatDate(checkResult.voucher.issuedAt) }}</p></div>
            <div><p class="text-gray-500">Expires</p><p class="font-medium text-gray-700">{{ checkResult.voucher.expiresAt || 'No expiry' }}</p></div>
            <div><p class="text-gray-500">Issued To</p><p class="font-medium text-gray-700">{{ checkResult.voucher.issuedTo || '—' }}</p></div>
          </div>
        </div>
        <div v-else class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-600">
          <span class="font-bold">✗</span> {{ checkResult.error }}
        </div>
      </div>
    </div>

    <!-- Filters + Table -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
      <input v-model="filters.search" type="text" placeholder="Code, issued-to..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-40 focus:outline-none focus:ring-2 focus:ring-yellow-400" />
      <select v-model="filters.status" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="partially_used">Partially Used</option>
        <option value="redeemed">Redeemed</option>
        <option value="expired">Expired</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <button @click="Object.assign(filters, { search: '', status: '' })"
        class="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg">Reset</button>
      <span class="text-xs text-gray-400 ml-auto">{{ filteredVouchers.length }} records</span>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Code</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Face Value</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expires</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Issued To</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="!filteredVouchers.length">
            <td colspan="8" class="px-4 py-10 text-center text-gray-400">No vouchers found</td>
          </tr>
          <tr v-for="v in filteredVouchers" :key="v.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-mono text-sm font-bold text-yellow-700">{{ v.code }}</td>
            <td class="px-4 py-3 text-right text-gray-700">₱{{ v.originalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td class="px-4 py-3 text-right">
              <span :class="v.remainingBalance > 0 ? 'text-green-700 font-bold' : 'text-gray-400'">
                ₱{{ v.remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="statusBadge(v.computedStatus)" class="px-2 py-1 rounded-full text-xs font-semibold capitalize">
                {{ v.computedStatus.replace('_', ' ') }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-600">{{ formatDate(v.issuedAt) }}</td>
            <td class="px-4 py-3 text-xs"
              :class="isExpiringSoon(v) ? 'text-orange-600 font-medium' : 'text-gray-500'">
              {{ v.expiresAt || '—' }}
            </td>
            <td class="px-4 py-3 text-gray-600">{{ v.issuedTo || '—' }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button @click="openDetail(v)" class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                  <Eye class="w-4 h-4" />
                </button>
                <button v-if="canManage && ['active','partially_used'].includes(v.computedStatus)"
                  @click="confirmCancel(v)" class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Cancel Voucher">
                  <XCircle class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="vStore.pagination.lastPage > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">Showing {{ vStore.pagination.from }}–{{ vStore.pagination.to }} of {{ vStore.pagination.total }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="vStore.pagination.currentPage <= 1" @click="vStore.fetchPage(vStore.pagination.currentPage - 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
          <span class="text-xs text-gray-600 px-2">{{ vStore.pagination.currentPage }} / {{ vStore.pagination.lastPage }}</span>
          <button :disabled="vStore.pagination.currentPage >= vStore.pagination.lastPage" @click="vStore.fetchPage(vStore.pagination.currentPage + 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- ── ISSUE VOUCHER MODAL ── -->
    <div v-if="showIssue" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <Gift class="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">Issue Gift Voucher</h3>
            <p class="text-xs text-gray-400">A unique code will be generated automatically</p>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Amount (₱) <span class="text-red-500">*</span></label>
            <input v-model.number="issueForm.amount" type="number" min="1" step="50" placeholder="0.00"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xl font-bold text-right focus:outline-none focus:ring-2 focus:ring-yellow-400" />
            <!-- Quick amounts -->
            <div class="flex gap-2 mt-2 flex-wrap">
              <button v-for="amt in [100, 200, 300, 500, 1000]" :key="amt"
                @click="issueForm.amount = amt"
                class="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:border-yellow-400 hover:bg-yellow-50 transition-colors">
                ₱{{ amt }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Expiry Date <span class="text-gray-400 font-normal">(optional)</span></label>
            <input v-model="issueForm.expiresAt" type="date"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Issued To <span class="text-gray-400 font-normal">(optional)</span></label>
            <input v-model="issueForm.issuedTo" type="text" placeholder="Customer name"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
            <input v-model="issueForm.notes" type="text" placeholder="e.g. Birthday gift"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
          </div>
        </div>

        <p v-if="issueError" class="text-sm text-red-600">{{ issueError }}</p>

        <div class="flex gap-3 pt-1">
          <button @click="showIssue = false; issueError = ''" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="submitIssue" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600">
            <Gift class="w-4 h-4" /> Issue Voucher
          </button>
        </div>
      </div>
    </div>

    <!-- ── ISSUED SUCCESS MODAL ── -->
    <div v-if="issuedVoucher" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
        <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
          <Gift class="w-8 h-8 text-yellow-600" />
        </div>
        <div>
          <p class="text-lg font-bold text-gray-800">Voucher Issued!</p>
          <p class="text-xs text-gray-500 mt-1">Give this code to the customer</p>
        </div>
        <div class="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
          <p class="text-xs text-gray-500 mb-1">Voucher Code</p>
          <p class="text-3xl font-black font-mono tracking-widest text-yellow-700">{{ issuedVoucher.code }}</p>
          <p class="text-lg font-bold text-gray-800 mt-2">₱{{ issuedVoucher.originalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
          <p v-if="issuedVoucher.expiresAt" class="text-xs text-gray-500 mt-1">Expires: {{ issuedVoucher.expiresAt }}</p>
          <p v-else class="text-xs text-gray-400 mt-1">No expiry</p>
        </div>
        <button @click="issuedVoucher = null; resetIssueForm()"
          class="w-full py-2.5 bg-yellow-500 text-white rounded-lg text-sm font-semibold hover:bg-yellow-600">Done</button>
      </div>
    </div>

    <!-- ── DETAIL MODAL ── -->
    <div v-if="detailVoucher" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p class="text-base font-bold text-yellow-700 font-mono">{{ detailVoucher.code }}</p>
            <span :class="statusBadge(detailVoucher.computedStatus)" class="text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-0.5 inline-block">
              {{ detailVoucher.computedStatus.replace('_', ' ') }}
            </span>
          </div>
          <button @click="detailVoucher = null" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>

        <div class="overflow-y-auto flex-1 p-6 space-y-5">
          <!-- Balance bar -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div class="flex justify-between items-end mb-2">
              <div>
                <p class="text-xs text-gray-500">Remaining Balance</p>
                <p class="text-3xl font-black text-yellow-700">₱{{ detailVoucher.remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs text-gray-500">Face Value</p>
                <p class="text-lg font-bold text-gray-600">₱{{ detailVoucher.originalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
              </div>
            </div>
            <!-- Progress bar -->
            <div class="w-full bg-yellow-200 rounded-full h-2">
              <div class="bg-yellow-500 rounded-full h-2 transition-all"
                :style="{ width: (detailVoucher.remainingBalance / detailVoucher.originalAmount * 100) + '%' }"></div>
            </div>
            <p class="text-xs text-gray-500 mt-1 text-right">
              {{ (detailVoucher.remainingBalance / detailVoucher.originalAmount * 100).toFixed(0) }}% remaining
            </p>
          </div>

          <!-- Details -->
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><p class="text-xs text-gray-400">Issued At</p><p class="text-gray-700">{{ formatDateTime(detailVoucher.issuedAt) }}</p></div>
            <div><p class="text-xs text-gray-400">Issued By</p><p class="text-gray-700">{{ detailVoucher.issuedBy }}</p></div>
            <div><p class="text-xs text-gray-400">Issued To</p><p class="text-gray-700">{{ detailVoucher.issuedTo || '—' }}</p></div>
            <div><p class="text-xs text-gray-400">Expires</p>
              <p :class="isExpiringSoon(detailVoucher) ? 'text-orange-600 font-medium' : 'text-gray-700'">
                {{ detailVoucher.expiresAt || 'No expiry' }}
              </p>
            </div>
            <div v-if="detailVoucher.notes" class="col-span-2">
              <p class="text-xs text-gray-400">Notes</p>
              <p class="text-gray-700 italic">{{ detailVoucher.notes }}</p>
            </div>
          </div>

          <!-- Usage history -->
          <div v-if="detailVoucher.usageHistory.length">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Usage History</p>
            <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-3 py-2 text-xs text-gray-500 font-semibold">Date</th>
                  <th class="text-right px-3 py-2 text-xs text-gray-500 font-semibold">Used</th>
                  <th class="text-right px-3 py-2 text-xs text-gray-500 font-semibold">Remaining</th>
                  <th class="text-left px-3 py-2 text-xs text-gray-500 font-semibold">By</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="h in detailVoucher.usageHistory" :key="h.id">
                  <td class="px-3 py-2 text-gray-600">{{ formatDate(h.date) }}</td>
                  <td class="px-3 py-2 text-right text-red-500 font-semibold">−₱{{ h.amountUsed.toFixed(2) }}</td>
                  <td class="px-3 py-2 text-right text-gray-700">₱{{ h.remainingAfter.toFixed(2) }}</td>
                  <td class="px-3 py-2 text-gray-500 text-xs">
                    <p>{{ h.redeemedBy }}</p>
                    <p class="font-mono text-blue-500">{{ h.transactionId === 'pending' ? 'pending' : h.transactionId }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-4 text-gray-400 text-sm">No usage history</div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button @click="detailVoucher = null" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Close</button>
          <button v-if="canManage && ['active','partially_used'].includes(detailVoucher.computedStatus)"
            @click="confirmCancel(detailVoucher); detailVoucher = null"
            class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
            <XCircle class="w-4 h-4" /> Cancel Voucher
          </button>
        </div>
      </div>
    </div>

    <!-- ── CANCEL CONFIRM ── -->
    <div v-if="cancelTarget" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center space-y-4">
        <XCircle class="w-12 h-12 text-red-500 mx-auto" />
        <div>
          <p class="text-base font-semibold text-gray-800">Cancel Voucher?</p>
          <p class="text-sm text-gray-500 mt-1">{{ cancelTarget.code }}</p>
          <p class="text-sm text-orange-600 mt-0.5">₱{{ cancelTarget.remainingBalance.toFixed(2) }} will be forfeited</p>
        </div>
        <div class="flex gap-3">
          <button @click="cancelTarget = null" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600">Keep</button>
          <button @click="doCancel" class="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Cancel Voucher</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show"
      class="fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
      :class="toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-yellow-500'">
      {{ toast.message }}
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useVoucherStore }  from '@/stores/vouchers'
import { useAuthStore }     from '@/stores/auth'
import { Gift, Eye, XCircle, X, Search, ChevronLeft, ChevronRight } from '@lucide/vue'

const vStore    = useVoucherStore()
const authStore = useAuthStore()

const canManage = computed(() => ['owner', 'manager'].includes(authStore.role))

// ── Helpers ──
function formatDate(d)     { return d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—' }

function statusBadge(s) {
  return {
    active:         'bg-green-100 text-green-700',
    partially_used: 'bg-blue-100 text-blue-700',
    redeemed:       'bg-gray-100 text-gray-500',
    expired:        'bg-red-100 text-red-600',
    cancelled:      'bg-red-200 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600'
}

function isExpiringSoon(v) {
  if (!v.expiresAt) return false
  const diff = new Date(v.expiresAt) - new Date()
  return diff > 0 && diff < 30 * 86400 * 1000 // within 30 days
}

// ── Check Balance ──
const checkCode   = ref('')
const checkResult = ref(null)

function doCheckBalance() {
  if (!checkCode.value.trim()) return
  checkResult.value = vStore.checkBalance(checkCode.value)
}

// ── Filters ──
const filters = reactive({ search: '', status: '' })

const filteredVouchers = computed(() => {
  let list = vStore.liveVouchers
  const q = filters.search.toLowerCase()
  if (q) list = list.filter(v =>
    v.code.toLowerCase().includes(q) ||
    (v.issuedTo || '').toLowerCase().includes(q)
  )
  if (filters.status) list = list.filter(v => v.computedStatus === filters.status)
  return list
})

// ── Issue Voucher ──
const showIssue    = ref(false)
const issuedVoucher= ref(null)
const issueError   = ref('')
const issueForm    = reactive({ amount: null, expiresAt: '', issuedTo: '', notes: '' })

function openIssue() { resetIssueForm(); issueError.value = ''; showIssue.value = true }
function resetIssueForm() { Object.assign(issueForm, { amount: null, expiresAt: '', issuedTo: '', notes: '' }) }

function submitIssue() {
  issueError.value = ''
  if (!issueForm.amount || issueForm.amount <= 0) { issueError.value = 'Enter a valid amount.'; return }
  const v = vStore.issue({
    amount:    issueForm.amount,
    expiresAt: issueForm.expiresAt || null,
    issuedTo:  issueForm.issuedTo || null,
    notes:     issueForm.notes,
    issuedBy:  `${authStore.user?.firstName} ${authStore.user?.lastName}`,
  })
  showIssue.value  = false
  issuedVoucher.value = v
}

// ── Detail view ──
const detailVoucher = ref(null)
function openDetail(v) { detailVoucher.value = v }

// ── Cancel ──
const cancelTarget = ref(null)
function confirmCancel(v) { cancelTarget.value = v }
function doCancel() {
  vStore.cancel(cancelTarget.value.id)
  showToast(`Voucher ${cancelTarget.value.code} cancelled`, 'success')
  cancelTarget.value = null
}

// ── Toast ──
const toast = reactive({ show: false, type: 'success', message: '' })
function showToast(message, type = 'success') {
  Object.assign(toast, { show: true, type, message })
  setTimeout(() => { toast.show = false }, 3000)
}
</script>
