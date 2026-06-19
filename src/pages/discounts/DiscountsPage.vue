<template>
  <div class="space-y-6">

    <!-- ── Summary cards ── -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Total Discounts Given</p>
        <p class="text-2xl font-bold text-red-500 mt-1">₱{{ discountStore.totalDiscountsGiven.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">All time</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Audit Entries</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ discountStore.auditLog.length }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Records logged</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Override Required</p>
        <p class="text-2xl font-bold text-orange-600 mt-1">{{ discountStore.auditLog.filter(e => e.overriddenBy).length }}</p>
        <p class="text-xs text-gray-400 mt-0.5">Manager approved</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Active Discount Types</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">{{ discountStore.activeTypes.length }}</p>
        <p class="text-xs text-gray-400 mt-0.5">of {{ discountStore.types.length }} configured</p>
      </div>
    </div>

    <!-- ── Two-column layout ── -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Discount Types panel -->
      <div class="lg:col-span-1 space-y-3">
        <h3 class="text-sm font-semibold text-gray-700">Discount Types</h3>

        <div class="space-y-2">
          <div v-for="type in discountStore.types" :key="type.id"
            class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <span :class="[typeColor(type.color).bg, typeColor(type.color).text, 'px-2 py-0.5 rounded-full text-xs font-semibold shrink-0']">
                  {{ type.customPct ? 'Custom' : type.pct + '%' }}
                </span>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-800 truncate">{{ type.name }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ type.description }}</p>
                </div>
              </div>
              <!-- Toggle -->
              <button @click="discountStore.toggleType(type.id)"
                class="shrink-0 w-10 h-5 rounded-full transition-colors relative"
                :class="type.active ? 'bg-blue-600' : 'bg-gray-200'">
                <span class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                  :class="type.active ? 'left-5' : 'left-0.5'"></span>
              </button>
            </div>

            <!-- Edit controls (owner/manager only) -->
            <template v-if="canManage && editingType === type.id">
              <div class="space-y-2 border-t border-gray-100 pt-3">
                <div v-if="!type.customPct" class="flex items-center gap-2">
                  <label class="text-xs text-gray-600 w-24 shrink-0">Default %</label>
                  <input :value="type.pct" @input="discountStore.updateType(type.id, { pct: +$event.target.value })"
                    type="number" min="0" max="100"
                    class="w-20 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-600 w-24 shrink-0">Max %</label>
                  <input :value="type.maxPct" @input="discountStore.updateType(type.id, { maxPct: +$event.target.value })"
                    type="number" min="0" max="100"
                    class="w-20 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-600 w-24 shrink-0">Requires ID</label>
                  <input type="checkbox" :checked="type.requiresId"
                    @change="discountStore.updateType(type.id, { requiresId: $event.target.checked })" class="rounded" />
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-600 w-24 shrink-0">Require Reason</label>
                  <input type="checkbox" :checked="type.requiresReason"
                    @change="discountStore.updateType(type.id, { requiresReason: $event.target.checked })" class="rounded" />
                </div>
              </div>
              <button @click="editingType = null" class="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-1">Done editing</button>
            </template>

            <div v-else-if="canManage" class="flex items-center justify-between text-xs text-gray-400 border-t border-gray-50 pt-2">
              <div class="flex gap-2">
                <span v-if="type.requiresId"     class="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded">ID required</span>
                <span v-if="type.requiresReason"  class="px-1.5 py-0.5 bg-orange-50 text-orange-500 rounded">Reason required</span>
                <span v-if="type.requiresOverride" class="px-1.5 py-0.5 bg-red-50 text-red-500 rounded">Override required</span>
              </div>
              <button @click="editingType = type.id" class="text-xs text-gray-400 hover:text-blue-600 transition-colors">Edit</button>
            </div>
            <div v-else class="flex gap-2 text-xs text-gray-400 border-t border-gray-50 pt-2">
              <span v-if="type.requiresId"     class="px-1.5 py-0.5 bg-blue-50 text-blue-500 rounded">ID required</span>
              <span v-if="type.requiresReason"  class="px-1.5 py-0.5 bg-orange-50 text-orange-500 rounded">Reason required</span>
              <span v-if="type.requiresOverride" class="px-1.5 py-0.5 bg-red-50 text-red-500 rounded">Override required</span>
            </div>
          </div>
        </div>

        <div v-if="discountStore.pagination.lastPage > 1" class="flex items-center justify-between">
          <span class="text-xs text-gray-400">Showing {{ discountStore.pagination.from }}–{{ discountStore.pagination.to }} of {{ discountStore.pagination.total }}</span>
          <div class="flex items-center gap-1">
            <button :disabled="discountStore.pagination.currentPage <= 1" @click="discountStore.fetchPage(discountStore.pagination.currentPage - 1)"
              class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
            <span class="text-xs text-gray-600 px-2">{{ discountStore.pagination.currentPage }} / {{ discountStore.pagination.lastPage }}</span>
            <button :disabled="discountStore.pagination.currentPage >= discountStore.pagination.lastPage" @click="discountStore.fetchPage(discountStore.pagination.currentPage + 1)"
              class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
          </div>
        </div>

        <!-- Discount settings summary -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Discount Limits</p>
          <div class="flex justify-between text-gray-600">
            <span>Cashier max</span>
            <span class="font-semibold">{{ settingsStore.config.maxCashierDiscount }}%</span>
          </div>
          <div class="flex justify-between text-gray-600">
            <span>Manager max</span>
            <span class="font-semibold">{{ settingsStore.config.maxManagerDiscount }}%</span>
          </div>
          <div class="flex justify-between text-gray-600">
            <span>Require override above</span>
            <span class="font-semibold">{{ settingsStore.config.requireManagerApprovalAbove }}%</span>
          </div>
          <RouterLink v-if="canManage" to="/settings"
            class="block text-center text-xs text-blue-600 hover:text-blue-700 pt-1 border-t border-gray-100">
            Edit limits in Settings →
          </RouterLink>
        </div>
      </div>

      <!-- Audit log -->
      <div class="lg:col-span-2 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">Discount Audit Log</h3>
          <span class="text-xs text-gray-400">{{ filteredAudit.length }} entries</span>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl border border-gray-200 p-3 flex flex-wrap gap-2 items-center">
          <input v-model="auditFilters.search" type="text" placeholder="Transaction #, cashier, type..."
            class="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs flex-1 min-w-40 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          <select v-model="auditFilters.typeId" class="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">All Types</option>
            <option v-for="t in discountStore.types" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <select v-model="auditFilters.scope" class="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">All Scope</option>
            <option value="line">Line Item</option>
            <option value="transaction">Transaction</option>
          </select>
          <label class="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" v-model="auditFilters.overridesOnly" class="rounded" />
            Overrides only
          </label>
          <button @click="Object.assign(auditFilters, { search: '', typeId: '', scope: '', overridesOnly: false })"
            class="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1.5 rounded-lg">Reset</button>
        </div>

        <!-- Audit table -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entry #</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Scope</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">By</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="!filteredAudit.length">
                <td colspan="8" class="px-4 py-10 text-center text-gray-400">No discount records found</td>
              </tr>
              <tr v-for="entry in filteredAudit" :key="entry.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 font-mono text-xs text-blue-600">{{ entry.id }}</td>
                <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ entry.transactionId || '—' }}</td>
                <td class="px-4 py-3 text-xs text-gray-600">{{ formatDateTime(entry.appliedAt) }}</td>
                <td class="px-4 py-3">
                  <span :class="[typeColorById(entry.typeId).bg, typeColorById(entry.typeId).text]"
                    class="px-2 py-0.5 rounded-full text-xs font-semibold">
                    {{ entry.typeName }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                    :class="entry.scope === 'line' ? 'bg-gray-100 text-gray-600' : 'bg-indigo-100 text-indigo-700'">
                    {{ entry.scope === 'line' ? 'Line' : 'Txn' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <p class="text-sm font-semibold text-red-500">−₱{{ entry.discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
                  <p class="text-xs text-gray-400">{{ entry.discountPct }}% off ₱{{ entry.originalAmount.toFixed(2) }}</p>
                </td>
                <td class="px-4 py-3 text-xs text-gray-600">
                  <p>{{ entry.appliedBy }}</p>
                  <p v-if="entry.overriddenBy" class="text-orange-600 font-medium">
                    Override: {{ entry.overriddenBy }}
                  </p>
                </td>
                <td class="px-4 py-3 text-right">
                  <button @click="openDetail(entry)" class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <Eye class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── Detail Modal ── -->
    <div v-if="detail" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-base font-semibold text-gray-800">{{ detail.id }}</h3>
          <button @click="detail = null" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X class="w-5 h-5" />
          </button>
        </div>
        <div class="p-6 space-y-3 text-sm">
          <div class="text-center py-3 bg-red-50 rounded-xl">
            <p class="text-xs text-gray-500">Discount Applied</p>
            <p class="text-3xl font-bold text-red-500">−₱{{ detail.discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
            <span :class="[typeColorById(detail.typeId).bg, typeColorById(detail.typeId).text]"
              class="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold">
              {{ detail.typeName }} {{ detail.discountPct }}%
            </span>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><p class="text-xs text-gray-400">Transaction</p><p class="font-mono font-semibold text-blue-600">{{ detail.transactionId || '—' }}</p></div>
            <div><p class="text-xs text-gray-400">Scope</p><p class="capitalize font-medium text-gray-700">{{ detail.scope }}</p></div>
            <div><p class="text-xs text-gray-400">Applied At</p><p class="text-gray-700">{{ formatDateTime(detail.appliedAt) }}</p></div>
            <div><p class="text-xs text-gray-400">Applied By</p><p class="text-gray-700">{{ detail.appliedBy }}</p></div>
            <div v-if="detail.productName" class="col-span-2"><p class="text-xs text-gray-400">Product</p><p class="text-gray-700">{{ detail.productName }}</p></div>
            <div><p class="text-xs text-gray-400">Original</p><p class="text-gray-700">₱{{ detail.originalAmount.toFixed(2) }}</p></div>
            <div><p class="text-xs text-gray-400">After Discount</p><p class="font-semibold text-green-700">₱{{ detail.finalAmount.toFixed(2) }}</p></div>
            <div v-if="detail.idNumber" class="col-span-2"><p class="text-xs text-gray-400">Customer ID</p><p class="font-mono text-gray-700">{{ detail.idNumber }}</p></div>
            <div v-if="detail.reason" class="col-span-2"><p class="text-xs text-gray-400">Reason</p><p class="text-gray-700">{{ detail.reason }}</p></div>
          </div>
          <div v-if="detail.overriddenBy" class="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p class="text-xs font-semibold text-orange-700 mb-0.5">Manager Override</p>
            <p class="text-sm text-orange-600">Approved by: <strong>{{ detail.overriddenBy }}</strong></p>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200">
          <button @click="detail = null" class="w-full py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useDiscountStore } from '@/stores/discounts'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore }     from '@/stores/auth'
import { TYPE_COLOR }       from '@/mock/discounts'
import { Eye, X, ChevronLeft, ChevronRight } from '@lucide/vue'

const discountStore = useDiscountStore()
const settingsStore = useSettingsStore()
const authStore     = useAuthStore()

const canManage  = computed(() => ['owner', 'manager'].includes(authStore.role))
const editingType = ref(null)
const detail      = ref(null)

function typeColor(color)     { return TYPE_COLOR[color] || TYPE_COLOR.gray }
function typeColorById(typeId) {
  const t = discountStore.types.find(t => t.id === typeId)
  return t ? typeColor(t.color) : TYPE_COLOR.gray
}
function formatDateTime(d) {
  return d ? new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
}

const auditFilters = reactive({ search: '', typeId: '', scope: '', overridesOnly: false })

const filteredAudit = computed(() => {
  let list = discountStore.auditLog
  const q = auditFilters.search.toLowerCase()
  if (q) list = list.filter(e =>
    (e.transactionId || '').toLowerCase().includes(q) ||
    e.appliedBy.toLowerCase().includes(q) ||
    e.typeName.toLowerCase().includes(q) ||
    (e.productName || '').toLowerCase().includes(q)
  )
  if (auditFilters.typeId)        list = list.filter(e => e.typeId === auditFilters.typeId)
  if (auditFilters.scope)         list = list.filter(e => e.scope === auditFilters.scope)
  if (auditFilters.overridesOnly) list = list.filter(e => e.overriddenBy)
  return list
})

function openDetail(entry) { detail.value = entry }
</script>
