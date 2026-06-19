<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Audit Trail</h2>
        <p class="text-sm text-gray-500">Complete log of every significant action in the system</p>
      </div>
      <button @click="exportCsv" class="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors">
        <Download class="w-4 h-4" /> Export CSV
      </button>
    </div>

    <!-- Summary row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Total Events</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ auditStore.entries.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-red-200 bg-red-50 p-4">
        <p class="text-xs text-red-500 font-semibold">Critical Today</p>
        <p class="text-2xl font-bold mt-1" :class="auditStore.criticalToday > 0 ? 'text-red-600' : 'text-gray-400'">{{ auditStore.criticalToday }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Top Module</p>
        <p class="text-lg font-bold text-gray-800 mt-1">{{ auditStore.byModule[0]?.[0] || '—' }}</p>
        <p class="text-xs text-gray-400">{{ auditStore.byModule[0]?.[1] || 0 }} events</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Filtered Events</p>
        <p class="text-2xl font-bold text-blue-600 mt-1">{{ filtered.length }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
      <input v-model="f.search" type="text" placeholder="User, description, reference..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-52 focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select v-model="f.severity" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Severity</option>
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="critical">Critical</option>
      </select>
      <select v-model="f.module" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Modules</option>
        <option v-for="[mod] in auditStore.byModule" :key="mod" :value="mod">{{ mod }}</option>
      </select>
      <select v-model="f.role" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">All Roles</option>
        <option value="owner">Owner</option>
        <option value="manager">Manager</option>
        <option value="cashier">Cashier</option>
      </select>
      <input v-model="f.from" type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input v-model="f.to"   type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <button @click="Object.assign(f, { search: '', severity: '', module: '', role: '', from: '', to: '' })"
        class="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg">Reset</button>
    </div>

    <!-- Audit table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-4"></th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Module</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="!filtered.length">
            <td colspan="7" class="px-4 py-10 text-center text-gray-400">No audit entries found</td>
          </tr>
          <tr v-for="entry in filtered.slice(0, 200)" :key="entry.id"
            class="hover:bg-gray-50 transition-colors"
            :class="entry.severity === 'critical' ? 'bg-red-50/30 border-l-2 border-red-300' : ''">
            <!-- Severity dot -->
            <td class="px-4 py-3">
              <div :class="severityStyle(entry.severity).dot" class="w-2 h-2 rounded-full mx-auto"></div>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500 font-mono whitespace-nowrap">
              <p>{{ formatDate(entry.timestamp) }}</p>
              <p class="text-gray-400">{{ formatTime(entry.timestamp) }}</p>
            </td>
            <td class="px-4 py-3">
              <p class="text-xs font-semibold text-gray-800">{{ entry.user }}</p>
              <span class="text-xs capitalize" :class="roleColor(entry.role)">{{ entry.role }}</span>
            </td>
            <td class="px-4 py-3">
              <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">{{ entry.module }}</span>
            </td>
            <td class="px-4 py-3">
              <span :class="[severityStyle(entry.severity).bg, severityStyle(entry.severity).text]"
                class="text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                {{ formatAction(entry.action) }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-600 max-w-xs">{{ entry.description }}</td>
            <td class="px-4 py-3 font-mono text-xs text-blue-600">{{ entry.reference || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="auditStore.pagination.lastPage > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">Showing {{ auditStore.pagination.from }}–{{ auditStore.pagination.to }} of {{ auditStore.pagination.total }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="auditStore.pagination.currentPage <= 1" @click="auditStore.fetchPage(auditStore.pagination.currentPage - 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
          <span class="text-xs text-gray-600 px-2">{{ auditStore.pagination.currentPage }} / {{ auditStore.pagination.lastPage }}</span>
          <button :disabled="auditStore.pagination.currentPage >= auditStore.pagination.lastPage" @click="auditStore.fetchPage(auditStore.pagination.currentPage + 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useAuditStore }    from '@/stores/audit'
import { useSettingsStore } from '@/stores/settings'
import { SEVERITY_STYLE }   from '@/mock/audit'
import { Download, ChevronLeft, ChevronRight } from '@lucide/vue'

const auditStore    = useAuditStore()
const settingsStore = useSettingsStore()

// ── Filters ──
const f = reactive({ search: '', severity: '', module: '', role: '', from: '', to: '' })

const filtered = computed(() => {
  let list = auditStore.entries
  const q  = f.search.toLowerCase()
  if (q) list = list.filter(e => e.user.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || (e.reference || '').toLowerCase().includes(q))
  if (f.severity) list = list.filter(e => e.severity === f.severity)
  if (f.module)   list = list.filter(e => e.module === f.module)
  if (f.role)     list = list.filter(e => e.role === f.role)
  if (f.from)     list = list.filter(e => e.timestamp.slice(0, 10) >= f.from)
  if (f.to)       list = list.filter(e => e.timestamp.slice(0, 10) <= f.to)
  return list
})

// ── Helpers ──
function severityStyle(s) { return SEVERITY_STYLE[s] || SEVERITY_STYLE.info }
function formatDate(d)    { return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) }
function formatTime(d)    { return new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
function formatAction(a)  { return a.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) }
function roleColor(role)  { return { owner: 'text-purple-600', manager: 'text-blue-600', cashier: 'text-green-600' }[role] || 'text-gray-400' }

// ── CSV export ──
function exportCsv() {
  const rows = [
    ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Description', 'Reference', 'Severity'],
    ...filtered.value.map(e => [
      new Date(e.timestamp).toLocaleString('en-PH'),
      e.user, e.role, e.module,
      formatAction(e.action),
      e.description,
      e.reference || '',
      e.severity,
    ]),
  ]
  const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `AuditTrail-${new Date().toISOString().slice(0,10)}.csv` })
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}
</script>
