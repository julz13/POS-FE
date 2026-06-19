<template>
  <div class="space-y-5">

    <!-- Shift banner -->
    <div v-if="!shiftStore.isOpen"
      class="flex items-center justify-between gap-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
      <div class="flex items-center gap-3">
        <AlertTriangle class="w-5 h-5 text-orange-500" />
        <div>
          <p class="text-sm font-semibold text-orange-700">No Active Shift</p>
          <p class="text-xs text-orange-400">Open a shift before processing transactions</p>
        </div>
      </div>
      <RouterLink to="/shifts" class="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">Open Shift</RouterLink>
    </div>
    <div v-else class="flex items-center justify-between px-5 py-3 bg-green-50 border border-green-200 rounded-xl">
      <div class="flex items-center gap-3">
        <div class="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
        <div>
          <p class="text-xs text-green-600 font-semibold uppercase tracking-wide">Shift Active</p>
          <p class="text-sm font-bold text-green-800">{{ shiftStore.activeShift.cashierName || `${authStore.user?.firstName} ${authStore.user?.lastName}`.trim() }}</p>
        </div>
      </div>
      <div class="flex items-center gap-5 text-xs text-green-700">
        <div><p class="text-green-500">Opened</p><p class="font-semibold">{{ fmtTime(shiftStore.activeShift.openedAt) }}</p></div>
        <div><p class="text-green-500">Opening Cash</p><p class="font-semibold">₱{{ (parseFloat(shiftStore.activeShift.openingCash) || 0).toLocaleString() }}</p></div>
        <div><p class="text-green-500">Sales Today</p><p class="font-bold text-base">₱{{ txnStore.todaySales.toLocaleString() }}</p></div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-4 gap-3">
      <div v-for="s in statsCards" :key="s.label" class="bg-white rounded-xl border border-gray-200 p-3.5 flex items-center gap-3">
        <div :class="`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`"><component :is="s.icon" :class="`w-4 h-4 ${s.color}`" /></div>
        <div><p class="text-lg font-bold text-gray-800">{{ s.value }}</p><p class="text-xs text-gray-400">{{ s.label }}</p></div>
      </div>
    </div>

    <!-- Main menu tiles -->
    <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
      <RouterLink v-for="item in menuItems" :key="item.to" :to="item.to"
        class="flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center group"
        :class="item.primary
          ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-sm'
          : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'">
        <div class="relative">
          <component :is="item.icon" class="w-8 h-8" />
          <span v-if="item.badge" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {{ item.badge }}
          </span>
        </div>
        <span class="text-xs font-semibold leading-tight">{{ item.label }}</span>
      </RouterLink>
    </div>

    <!-- Quick access row (shift operations) -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Shift Operations</p>
      <div class="grid grid-cols-4 gap-3">
        <button @click="showCashIn = true"
          class="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
          <ArrowDownToLine class="w-5 h-5 text-green-600 shrink-0" />
          <div class="text-left">
            <p class="text-xs font-semibold text-gray-800">Cash In</p>
            <p class="text-xs text-gray-400">Add to drawer</p>
          </div>
        </button>
        <button @click="showCashOut = true"
          class="flex items-center gap-3 p-3 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
          <ArrowUpFromLine class="w-5 h-5 text-red-500 shrink-0" />
          <div class="text-left">
            <p class="text-xs font-semibold text-gray-800">Cash Out</p>
            <p class="text-xs text-gray-400">Petty cash</p>
          </div>
        </button>
        <RouterLink to="/shifts"
          class="flex items-center gap-3 p-3 border border-gray-200 bg-white rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors">
          <Clock class="w-5 h-5 text-blue-500 shrink-0" />
          <div class="text-left">
            <p class="text-xs font-semibold text-gray-800">Shift Details</p>
            <p class="text-xs text-gray-400">View shift log</p>
          </div>
        </RouterLink>
        <RouterLink to="/shifts"
          class="flex items-center gap-3 p-3 border border-orange-200 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors">
          <LogOut class="w-5 h-5 text-orange-500 shrink-0" />
          <div class="text-left">
            <p class="text-xs font-semibold text-gray-800">Close Shift</p>
            <p class="text-xs text-gray-400">End of day</p>
          </div>
        </RouterLink>
      </div>
    </div>

    <!-- Recent transactions (today) -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700">My Transactions Today</h3>
        <RouterLink to="/transactions" class="text-xs text-blue-600 hover:text-blue-700">View all →</RouterLink>
      </div>
      <div v-if="!todayTxns.length" class="px-5 py-8 text-center text-gray-400 text-sm">No transactions yet today</div>
      <table v-else class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-xs text-gray-500 border-b border-gray-100">
            <th class="text-left px-5 py-2 font-medium">Time</th>
            <th class="text-left px-5 py-2 font-medium">Receipt #</th>
            <th class="text-left px-5 py-2 font-medium">Customer</th>
            <th class="text-center px-5 py-2 font-medium">Items</th>
            <th class="text-left px-5 py-2 font-medium">Payment</th>
            <th class="text-right px-5 py-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="t in todayTxns" :key="t.id" class="hover:bg-gray-50">
            <td class="px-5 py-2.5 text-xs text-gray-400 font-mono">{{ fmtTime(t.date) }}</td>
            <td class="px-5 py-2.5 font-mono text-xs text-blue-600">{{ t.id }}</td>
            <td class="px-5 py-2.5 text-gray-600">{{ t.customer || '—' }}</td>
            <td class="px-5 py-2.5 text-center text-gray-600">{{ t.items.reduce((s,i)=>s+i.qty,0) }}</td>
            <td class="px-5 py-2.5">
              <span v-for="p in t.payments" :key="p.method" class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs mr-1">{{ p.method }}</span>
            </td>
            <td class="px-5 py-2.5 text-right font-semibold text-gray-900">₱{{ t.total.toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Quick Cash In/Out Modals (reuse from Shifts) -->
    <div v-if="showCashIn" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2"><ArrowDownToLine class="w-5 h-5 text-green-600" /> Cash In</h3>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Amount (₱)</label>
          <input v-model.number="movForm.amount" type="number" min="0.01"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xl font-bold text-right focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Reason</label>
          <input v-model="movForm.reason" type="text" placeholder="e.g. Add change money"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button v-for="s in ['Add change money','Bank withdrawal','Owner deposit']" :key="s" @click="movForm.reason = s"
              class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-green-100 hover:text-green-700">{{ s }}</button>
          </div>
        </div>
        <p v-if="movError" class="text-sm text-red-600">{{ movError }}</p>
        <div class="flex gap-3">
          <button @click="showCashIn = false; movError = ''" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <button @click="confirmCashIn" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
            <ArrowDownToLine class="w-4 h-4" /> Add Cash
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCashOut" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2"><ArrowUpFromLine class="w-5 h-5 text-red-500" /> Cash Out</h3>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Amount (₱)</label>
          <input v-model.number="movForm.amount" type="number" min="0.01"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xl font-bold text-right focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Reason</label>
          <input v-model="movForm.reason" type="text" placeholder="e.g. Buy tape"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button v-for="s in ['Buy tape','Buy supplies','Delivery fee','Miscellaneous']" :key="s" @click="movForm.reason = s"
              class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-red-100 hover:text-red-600">{{ s }}</button>
          </div>
        </div>
        <p v-if="movError" class="text-sm text-red-600">{{ movError }}</p>
        <div class="flex gap-3">
          <button @click="showCashOut = false; movError = ''" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <button @click="confirmCashOut" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
            <ArrowUpFromLine class="w-4 h-4" /> Remove Cash
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useAuthStore }        from '@/stores/auth'
import { useShiftStore }       from '@/stores/shifts'
import { useTransactionStore } from '@/stores/transactions'
import { usePosStore }         from '@/stores/pos'
import {
  ShoppingCart, PauseCircle, RotateCcw, Gift, FileText, FileStack, Users, ScanSearch,
  Receipt, Clock, LogOut, AlertTriangle, ArrowDownToLine, ArrowUpFromLine,
  Wallet, Package
} from '@lucide/vue'

const authStore  = useAuthStore()
const shiftStore = useShiftStore()
const txnStore   = useTransactionStore()
const posStore   = usePosStore()

const fmtTime = d => d ? new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—'

const statsCards = computed(() => [
  { label: 'Today\'s Transactions', value: txnStore.todayCount,                   bg: 'bg-blue-100',   color: 'text-blue-600',   icon: Receipt     },
  { label: 'Today\'s Sales',        value: `₱${txnStore.todaySales.toLocaleString()}`, bg: 'bg-green-100',  color: 'text-green-600',  icon: Wallet      },
  { label: 'Held Sales',            value: posStore.heldTransactions.length,       bg: 'bg-orange-100', color: 'text-orange-500', icon: PauseCircle },
  { label: 'Cart Items',            value: posStore.cart.length,                   bg: 'bg-purple-100', color: 'text-purple-600', icon: Package     },
])

const menuItems = computed(() => [
  { to: '/pos',          label: 'New Sale',       icon: ShoppingCart, primary: true },
  { to: '/pos',          label: 'Held Sales',      icon: PauseCircle, badge: posStore.heldTransactions.length || null },
  { to: '/returns',      label: 'Returns',         icon: RotateCcw  },
  { to: '/quotes',       label: 'Quotes',          icon: FileText   },
  { to: '/sales-orders', label: 'Sales Orders',    icon: FileStack  },
  { to: '/vouchers',     label: 'Gift Vouchers',   icon: Gift       },
  { to: '/customers',    label: 'Customers',       icon: Users      },
  { to: '/pos',          label: 'Price Check',     icon: ScanSearch },
  { to: '/pos?reprint=1', label: 'Reprint Receipt', icon: Receipt    },
  { to: '/pos',          label: 'Account Sales',   icon: Wallet     },
])

const todayTxns = computed(() => txnStore.todayTransactions.slice(0, 8))

// ── Quick Cash In/Out ──
const showCashIn  = ref(false)
const showCashOut = ref(false)
const movError    = ref('')
const movForm     = reactive({ amount: null, reason: '' })

function confirmCashIn() {
  movError.value = ''
  if (!movForm.amount || movForm.amount <= 0) { movError.value = 'Enter a valid amount.'; return }
  if (!movForm.reason.trim()) { movError.value = 'Reason required.'; return }
  if (!shiftStore.isOpen) { movError.value = 'No active shift. Open a shift first.'; return }
  shiftStore.addMovement({ type: 'in', amount: movForm.amount, reason: movForm.reason, recordedBy: `${authStore.user?.firstName} ${authStore.user?.lastName}` })
  showCashIn.value = false; Object.assign(movForm, { amount: null, reason: '' })
}
function confirmCashOut() {
  movError.value = ''
  if (!movForm.amount || movForm.amount <= 0) { movError.value = 'Enter a valid amount.'; return }
  if (!movForm.reason.trim()) { movError.value = 'Reason required.'; return }
  if (!shiftStore.isOpen) { movError.value = 'No active shift. Open a shift first.'; return }
  shiftStore.addMovement({ type: 'out', amount: movForm.amount, reason: movForm.reason, recordedBy: `${authStore.user?.firstName} ${authStore.user?.lastName}` })
  showCashOut.value = false; Object.assign(movForm, { amount: null, reason: '' })
}
</script>
