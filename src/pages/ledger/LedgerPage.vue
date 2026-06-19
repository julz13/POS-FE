<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Inventory Ledger</h2>
        <p class="text-sm text-gray-500">Complete audit trail of every stock movement</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
          {{ ledgerStore.allSorted.length }} total entries
        </span>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
      <!-- Product selector -->
      <select v-model="filters.productId"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-52">
        <option value="">All Products</option>
        <option v-for="p in activeProducts" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <!-- Type -->
      <select v-model="filters.type"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Types</option>
        <option v-for="(cfg, key) in LEDGER_TYPES" :key="key" :value="key">{{ cfg.label }}</option>
      </select>
      <!-- Date range -->
      <input v-model="filters.from" type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input v-model="filters.to"   type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <button @click="resetFilters" class="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg">Reset</button>
      <span class="text-xs text-gray-400 ml-auto">{{ filtered.length }} rows</span>
    </div>

    <!-- Per-product balance card (shown when filtering by product) -->
    <div v-if="filters.productId && selectedProductInfo" class="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
      <div>
        <p class="text-sm font-bold text-gray-800">{{ selectedProductInfo.name }}</p>
        <p class="text-xs text-gray-400 font-mono">{{ selectedProductInfo.sku }} · {{ selectedProductInfo.category }}</p>
      </div>
      <div class="flex items-center gap-6 text-sm">
        <div class="text-center">
          <p class="text-xs text-gray-400">System Stock</p>
          <p class="text-xl font-black text-gray-900">{{ selectedProductInfo.stock }}</p>
        </div>
        <div class="text-center">
          <p class="text-xs text-gray-400">Ledger Balance</p>
          <p class="text-xl font-black" :class="latestBalance === selectedProductInfo.stock ? 'text-green-600' : 'text-orange-600'">
            {{ latestBalance ?? '—' }}
          </p>
        </div>
        <div v-if="latestBalance !== null && latestBalance !== selectedProductInfo.stock"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
          ⚠ Discrepancy: {{ latestBalance - selectedProductInfo.stock }}
        </div>
        <div v-else-if="latestBalance !== null"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
          ✓ Balanced
        </div>
      </div>
    </div>

    <!-- Ledger table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
              <th v-if="!filters.productId" class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-green-600">Qty In</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-red-500">Qty Out</th>
              <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="!filtered.length">
              <td :colspan="filters.productId ? 8 : 9" class="px-4 py-10 text-center text-gray-400">No ledger entries found</td>
            </tr>
            <tr v-for="entry in filtered" :key="entry.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 text-xs text-gray-500 font-mono">
                <p>{{ formatDate(entry.date) }}</p>
                <p class="text-gray-400">{{ formatTime(entry.date) }}</p>
              </td>
              <td class="px-4 py-3">
                <span :class="[typeStyle(entry.type).bg, typeStyle(entry.type).color]"
                  class="px-2 py-1 rounded-full text-xs font-semibold">
                  {{ typeStyle(entry.type).label }}
                </span>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-blue-600">{{ entry.reference || '—' }}</td>
              <td v-if="!filters.productId" class="px-4 py-3">
                <p class="font-medium text-gray-800 text-xs">{{ entry.productName }}</p>
                <p class="text-gray-400 text-xs font-mono">{{ entry.sku }}</p>
              </td>
              <td class="px-4 py-3 text-right">
                <span v-if="entry.qtyIn > 0" class="font-semibold text-green-600">+{{ entry.qtyIn }}</span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-4 py-3 text-right">
                <span v-if="entry.qtyOut > 0" class="font-semibold text-red-500">−{{ entry.qtyOut }}</span>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-4 py-3 text-right font-bold text-gray-800">{{ entry.balance }}</td>
              <td class="px-4 py-3 text-xs text-gray-600">{{ entry.user }}</td>
              <td class="px-4 py-3 text-xs text-gray-400 max-w-32 truncate">{{ entry.notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="ledgerStore.pagination.lastPage > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">Showing {{ ledgerStore.pagination.from }}–{{ ledgerStore.pagination.to }} of {{ ledgerStore.pagination.total }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="ledgerStore.pagination.currentPage <= 1" @click="ledgerStore.fetchPage(ledgerStore.pagination.currentPage - 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
          <span class="text-xs text-gray-600 px-2">{{ ledgerStore.pagination.currentPage }} / {{ ledgerStore.pagination.lastPage }}</span>
          <button :disabled="ledgerStore.pagination.currentPage >= ledgerStore.pagination.lastPage" @click="ledgerStore.fetchPage(ledgerStore.pagination.currentPage + 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useLedgerStore }  from '@/stores/ledger'
import { useProductStore } from '@/stores/products'
import { LEDGER_TYPES }    from '@/mock/ledger'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const ledgerStore = useLedgerStore()
const prodStore   = useProductStore()

const activeProducts = computed(() => prodStore.products.filter(p => p.status === 'active').sort((a,b) => a.name.localeCompare(b.name)))

// ── Filters ──
const filters = reactive({ productId: '', type: '', from: '', to: '' })
function resetFilters() { Object.assign(filters, { productId: '', type: '', from: '', to: '' }) }

const filtered = computed(() => {
  let list = ledgerStore.allSorted
  if (filters.productId) list = list.filter(e => e.productId === filters.productId)
  if (filters.type)      list = list.filter(e => e.type === filters.type)
  if (filters.from)      list = list.filter(e => e.date.slice(0,10) >= filters.from)
  if (filters.to)        list = list.filter(e => e.date.slice(0,10) <= filters.to)
  return list
})

// ── Per-product balance card ──
const selectedProductInfo = computed(() => filters.productId ? prodStore.products.find(p => p.id === filters.productId) : null)
const latestBalance       = computed(() => {
  if (!filters.productId) return null
  const entries = filtered.value
  return entries.length ? entries[0].balance : null
})

// ── Helpers ──
function typeStyle(type) {
  return LEDGER_TYPES[type] ?? { label: type, color: 'text-gray-600', bg: 'bg-gray-100' }
}
function formatDate(d) { return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) }
function formatTime(d) { return new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) }
</script>
