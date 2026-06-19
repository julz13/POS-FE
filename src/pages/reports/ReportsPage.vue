<template>
  <div class="flex gap-5 min-h-0">

    <!-- ── Sidebar: report selector ── -->
    <aside class="w-52 shrink-0 space-y-1">
      <button
        v-for="r in REPORT_LIST" :key="r.id"
        @click="selectReport(r.id)"
        class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
        :class="selected === r.id
          ? 'bg-blue-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'">
        <component :is="r.icon" class="w-4 h-4 shrink-0" />
        {{ r.label }}
      </button>
    </aside>

    <!-- ── Main area ── -->
    <div class="flex-1 min-w-0 space-y-4">

      <!-- Header + exports -->
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">{{ activeConfig?.label }}</h2>
          <p class="text-xs text-gray-400 mt-0.5">{{ activeConfig?.description }}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button @click="doExport('pdf')"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-600 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <FileText class="w-3.5 h-3.5" /> PDF
          </button>
          <button @click="doExport('excel')"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-600 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-colors">
            <Table class="w-3.5 h-3.5" /> Excel
          </button>
          <button @click="doExport('csv')"
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            <Download class="w-3.5 h-3.5" /> CSV
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <template v-if="activeConfig?.filters.includes('date')">
          <div class="flex items-center gap-1.5">
            <label class="text-xs text-gray-500 font-medium">From</label>
            <input v-model="f.from" type="date" class="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="flex items-center gap-1.5">
            <label class="text-xs text-gray-500 font-medium">To</label>
            <input v-model="f.to" type="date" class="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </template>
        <select v-if="activeConfig?.filters.includes('cashier')" v-model="f.cashier"
          class="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Cashiers</option>
          <option v-for="c in cashierOptions" :key="c">{{ c }}</option>
        </select>
        <select v-if="activeConfig?.filters.includes('category')" v-model="f.category"
          class="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          <option v-for="c in categoryOptions" :key="c">{{ c }}</option>
        </select>
        <select v-if="activeConfig?.filters.includes('payment')" v-model="f.payment"
          class="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Payments</option>
          <option v-for="p in PAYMENT_TYPES" :key="p">{{ p }}</option>
        </select>
        <select v-if="activeConfig?.filters.includes('status')" v-model="f.status"
          class="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="voided">Voided</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button @click="resetFilters" class="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2.5 py-1.5 rounded-lg">Reset</button>
        <span class="text-xs text-gray-400 ml-auto">{{ rows.length }} row{{ rows.length !== 1 ? 's' : '' }}</span>
      </div>

      <!-- Summary cards -->
      <div v-if="summary.length" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="s in summary" :key="s.label" class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">{{ s.label }}</p>
          <p class="text-xl font-bold mt-1" :class="s.color || 'text-gray-800'">{{ s.value }}</p>
          <p v-if="s.sub" class="text-xs text-gray-400 mt-0.5">{{ s.sub }}</p>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table id="report-table" class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th v-for="col in activeConfig?.columns" :key="col.key"
                  class="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="!rows.length">
                <td :colspan="activeConfig?.columns?.length || 1" class="px-4 py-10 text-center text-gray-400">
                  No data for the selected filters
                </td>
              </tr>
              <tr v-for="(row, i) in rows" :key="i" class="hover:bg-gray-50 transition-colors"
                :class="row._voided ? 'opacity-60' : ''">
                <td v-for="col in activeConfig?.columns" :key="col.key"
                  class="px-4 py-2.5 whitespace-nowrap"
                  :class="[col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left', col.cls?.(row) || '']">
                  <span v-if="col.badge" :class="col.badge(row)" class="px-2 py-0.5 rounded-full text-xs font-semibold">
                    {{ col.format ? col.format(row[col.key], row) : row[col.key] }}
                  </span>
                  <template v-else>{{ col.format ? col.format(row[col.key], row) : row[col.key] }}</template>
                </td>
              </tr>
            </tbody>
            <!-- Footer totals -->
            <tfoot v-if="footerRow.length" class="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td v-for="(cell, i) in footerRow" :key="i"
                  class="px-4 py-3 text-xs font-bold text-gray-700"
                  :class="activeConfig?.columns[i]?.align === 'right' ? 'text-right' : 'text-left'">
                  {{ cell }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { useProductStore }     from '@/stores/products'
import { usePaymentStore }     from '@/stores/payments'
import { useReturnStore }      from '@/stores/returns'
import {
  BarChart2, Package, Users, CreditCard, Warehouse, AlertTriangle,
  TrendingUp, RotateCcw, Receipt, FileText, Table, Download
} from '@lucide/vue'

const txnStore  = useTransactionStore()
const prodStore = useProductStore()
const pmtStore  = usePaymentStore()
const retStore  = useReturnStore()

// ── Format helpers ──
const php  = n => `₱${(+n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
const fmtD = d => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
const fmtDT= d => d ? new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const pct  = n => `${(+n || 0).toFixed(1)}%`

const PAYMENT_TYPES = ['Cash', 'GCash', 'Maya', 'QRPH', 'Debit', 'Credit', 'Store Credit']

// ── Filter state ──
const f = reactive({ from: '', to: '', cashier: '', category: '', payment: '', status: '' })
const resetFilters = () => Object.assign(f, { from: '', to: '', cashier: '', category: '', payment: '', status: '' })

const cashierOptions  = computed(() => [...new Set(txnStore.transactions.map(t => t.cashier))])
const categoryOptions = computed(() => [...new Set(prodStore.products.map(p => p.category).sort())])

// ── Helpers ──
function inDateRange(dateStr) {
  const d = dateStr?.slice(0, 10)
  if (f.from && d < f.from) return false
  if (f.to   && d > f.to)   return false
  return true
}

// ─────────────────────────────────────────────────────────────────────
// REPORT DATA FUNCTIONS
// ─────────────────────────────────────────────────────────────────────

function getDailySales() {
  let txns = txnStore.completedTransactions.filter(t => inDateRange(t.date))
  if (f.cashier) txns = txns.filter(t => t.cashier === f.cashier)
  const map = {}
  txns.forEach(t => {
    const d = t.date.slice(0, 10)
    if (!map[d]) map[d] = { date: d, count: 0, items: 0, subtotal: 0, discounts: 0, tax: 0, total: 0 }
    map[d].count++
    map[d].items    += t.items.reduce((s, i) => s + i.qty, 0)
    map[d].subtotal += t.subtotal
    map[d].discounts+= (t.lineDiscounts || 0) + (t.transactionDiscount || 0)
    map[d].tax      += t.taxAmount
    map[d].total    += t.total
  })
  return Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
}

function getProductSales() {
  let txns = txnStore.completedTransactions.filter(t => inDateRange(t.date))
  if (f.cashier) txns = txns.filter(t => t.cashier === f.cashier)
  const map = {}
  txns.forEach(t => t.items.forEach(item => {
    if (f.category && item.category !== f.category) return
    const k = item.name
    if (!map[k]) map[k] = { name: item.name, sku: item.sku, category: item.category, qty: 0, revenue: 0 }
    map[k].qty     += item.qty
    map[k].revenue += item.sellingPrice * item.qty * (1 - (item.lineDiscount || 0) / 100)
  }))
  const totalRev = Object.values(map).reduce((s, r) => s + r.revenue, 0)
  return Object.values(map)
    .map(r => ({ ...r, pct: totalRev ? (r.revenue / totalRev) * 100 : 0 }))
    .sort((a, b) => b.revenue - a.revenue)
}

function getCashierPerf() {
  let txns = txnStore.completedTransactions.filter(t => inDateRange(t.date))
  const map = {}
  txns.forEach(t => {
    if (!map[t.cashier]) map[t.cashier] = { cashier: t.cashier, count: 0, items: 0, total: 0 }
    map[t.cashier].count++
    map[t.cashier].items += t.items.reduce((s, i) => s + i.qty, 0)
    map[t.cashier].total += t.total
  })
  return Object.values(map)
    .map(r => ({ ...r, avg: r.count ? r.total / r.count : 0 }))
    .sort((a, b) => b.total - a.total)
}

function getPaymentSummary() {
  let pmts = pmtStore.completedPayments.filter(p => inDateRange(p.date))
  if (f.payment) pmts = pmts.filter(p => p.paymentType === f.payment)
  const map = {}
  pmts.forEach(p => {
    if (!map[p.paymentType]) map[p.paymentType] = { type: p.paymentType, count: 0, total: 0 }
    map[p.paymentType].count++
    map[p.paymentType].total += p.amount
  })
  const grandTotal = Object.values(map).reduce((s, r) => s + r.total, 0)
  return Object.values(map)
    .map(r => ({ ...r, pct: grandTotal ? (r.total / grandTotal) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
}

function getInventorySummary() {
  let prods = prodStore.products.filter(p => p.status === 'active')
  if (f.category) prods = prods.filter(p => p.category === f.category)
  return prods.map(p => ({
    name: p.name, sku: p.sku, category: p.category, unit: p.unit,
    stock: p.stock, reorderLevel: p.reorderLevel,
    costPrice: p.costPrice, value: p.costPrice * p.stock,
    status: p.stock === 0 ? 'Out of Stock' : p.stock <= p.reorderLevel ? 'Low Stock' : 'OK',
  })).sort((a, b) => a.stock - b.stock)
}

function getLowStock() {
  let prods = prodStore.products.filter(p => p.status === 'active' && p.stock <= p.reorderLevel)
  if (f.category) prods = prods.filter(p => p.category === f.category)
  return prods.map(p => ({
    name: p.name, sku: p.sku, category: p.category, unit: p.unit,
    stock: p.stock, reorderLevel: p.reorderLevel,
    shortage: Math.max(0, p.reorderLevel - p.stock),
    riskValue: p.costPrice * Math.max(0, p.reorderLevel - p.stock),
  })).sort((a, b) => a.stock - b.stock)
}

function getInventoryValuation() {
  let prods = prodStore.products.filter(p => p.status === 'active')
  if (f.category) prods = prods.filter(p => p.category === f.category)
  return prods.map(p => ({
    name: p.name, sku: p.sku, category: p.category,
    costPrice: p.costPrice, sellingPrice: p.sellingPrice, stock: p.stock,
    costValue:    p.costPrice * p.stock,
    sellingValue: p.sellingPrice * p.stock,
    margin:       p.costPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.costPrice) * 100 : 0,
  })).sort((a, b) => b.sellingValue - a.sellingValue)
}

function getReturnSummary() {
  let rets = retStore.returns.filter(r => inDateRange(r.date))
  if (f.status) rets = rets.filter(r => r.status === f.status)
  return rets.map(r => ({
    id: r.id, transactionId: r.transactionId, date: r.date,
    customer: r.customer, returnType: r.returnType, reason: r.reason,
    refundAmount: r.refundAmount, status: r.status,
  }))
}

function getTxnHistory() {
  let txns = txnStore.transactions.filter(t => inDateRange(t.date))
  if (f.cashier) txns = txns.filter(t => t.cashier === f.cashier)
  if (f.payment) txns = txns.filter(t => t.payments.some(p => p.method === f.payment))
  if (f.status)  txns = txns.filter(t => t.status === f.status)
  return txns.map(t => ({
    id: t.id, date: t.date, customer: t.customer, cashier: t.cashier,
    items: t.items.reduce((s, i) => s + i.qty, 0),
    payments: t.payments.map(p => p.method).join(' + '),
    total: t.total, status: t.status, _voided: t.status === 'voided',
  }))
}

// ─────────────────────────────────────────────────────────────────────
// REPORT CONFIGURATIONS
// ─────────────────────────────────────────────────────────────────────
const REPORT_LIST = [
  { id: 'daily-sales',   icon: BarChart2,     label: 'Daily Sales'      },
  { id: 'product-sales', icon: Package,        label: 'Product Sales'    },
  { id: 'cashier-perf',  icon: Users,          label: 'Cashier Perf.'    },
  { id: 'payment-summ',  icon: CreditCard,     label: 'Payment Summary'  },
  { id: 'inv-summary',   icon: Warehouse,      label: 'Inventory Summary'},
  { id: 'low-stock',     icon: AlertTriangle,  label: 'Low Stock'        },
  { id: 'inv-valuation', icon: TrendingUp,     label: 'Inv. Valuation'   },
  { id: 'returns',       icon: RotateCcw,      label: 'Returns'          },
  { id: 'txn-history',   icon: Receipt,        label: 'Transactions'     },
]

const REPORT_CONFIGS = {
  'daily-sales': {
    label: 'Daily Sales Report', description: 'Revenue summary grouped by date',
    filters: ['date', 'cashier'],
    columns: [
      { key: 'date',      label: 'Date',         align: 'left',  format: v => fmtD(v) },
      { key: 'count',     label: 'Transactions', align: 'right' },
      { key: 'items',     label: 'Items Sold',   align: 'right' },
      { key: 'subtotal',  label: 'Subtotal',     align: 'right', format: v => php(v) },
      { key: 'discounts', label: 'Discounts',    align: 'right', format: v => php(v) },
      { key: 'tax',       label: 'Tax',          align: 'right', format: v => php(v) },
      { key: 'total',     label: 'Total',        align: 'right', format: v => php(v), cls: () => 'font-semibold text-gray-900' },
    ],
    getData: getDailySales,
    getFooter: rows => ['TOTAL', rows.reduce((s,r)=>s+r.count,0), rows.reduce((s,r)=>s+r.items,0), php(rows.reduce((s,r)=>s+r.subtotal,0)), php(rows.reduce((s,r)=>s+r.discounts,0)), php(rows.reduce((s,r)=>s+r.tax,0)), php(rows.reduce((s,r)=>s+r.total,0))],
    getSummary: rows => [
      { label: 'Total Revenue',      value: php(rows.reduce((s,r)=>s+r.total,0)), color: 'text-blue-600' },
      { label: 'Total Transactions', value: rows.reduce((s,r)=>s+r.count,0) },
      { label: 'Days Covered',       value: rows.length },
      { label: 'Avg Daily Revenue',  value: php(rows.length ? rows.reduce((s,r)=>s+r.total,0)/rows.length : 0) },
    ],
  },

  'product-sales': {
    label: 'Product Sales Report', description: 'Sales breakdown by product',
    filters: ['date', 'cashier', 'category'],
    columns: [
      { key: 'name',     label: 'Product',    align: 'left' },
      { key: 'sku',      label: 'SKU',        align: 'left', cls: () => 'font-mono text-xs text-gray-500' },
      { key: 'category', label: 'Category',   align: 'left' },
      { key: 'qty',      label: 'Units Sold', align: 'right', cls: () => 'font-semibold' },
      { key: 'revenue',  label: 'Revenue',    align: 'right', format: v => php(v), cls: () => 'font-semibold text-gray-900' },
      { key: 'pct',      label: '% of Total', align: 'right', format: v => pct(v) },
    ],
    getData: getProductSales,
    getFooter: rows => ['TOTAL', '', '', rows.reduce((s,r)=>s+r.qty,0), php(rows.reduce((s,r)=>s+r.revenue,0)), '100.0%'],
    getSummary: rows => [
      { label: 'Total Revenue',   value: php(rows.reduce((s,r)=>s+r.revenue,0)), color: 'text-blue-600' },
      { label: 'Units Sold',      value: rows.reduce((s,r)=>s+r.qty,0) },
      { label: 'Products',        value: rows.length },
      { label: 'Top Product',     value: rows[0]?.name || '—' },
    ],
  },

  'cashier-perf': {
    label: 'Cashier Performance', description: 'Sales and transaction count per cashier',
    filters: ['date'],
    columns: [
      { key: 'cashier', label: 'Cashier',      align: 'left', cls: () => 'font-medium' },
      { key: 'count',   label: 'Transactions', align: 'right' },
      { key: 'items',   label: 'Items Sold',   align: 'right' },
      { key: 'total',   label: 'Total Sales',  align: 'right', format: v => php(v), cls: () => 'font-semibold text-gray-900' },
      { key: 'avg',     label: 'Avg / Txn',    align: 'right', format: v => php(v) },
    ],
    getData: getCashierPerf,
    getFooter: rows => ['TOTAL', rows.reduce((s,r)=>s+r.count,0), rows.reduce((s,r)=>s+r.items,0), php(rows.reduce((s,r)=>s+r.total,0)), ''],
    getSummary: rows => [
      { label: 'Total Revenue',  value: php(rows.reduce((s,r)=>s+r.total,0)), color: 'text-blue-600' },
      { label: 'Transactions',   value: rows.reduce((s,r)=>s+r.count,0) },
      { label: 'Cashiers',       value: rows.length },
      { label: 'Top Cashier',    value: rows[0]?.cashier || '—' },
    ],
  },

  'payment-summ': {
    label: 'Payment Method Summary', description: 'Revenue breakdown by payment type',
    filters: ['date', 'payment'],
    columns: [
      { key: 'type',  label: 'Payment Method', align: 'left', cls: () => 'font-medium' },
      { key: 'count', label: 'Count',           align: 'right' },
      { key: 'total', label: 'Total Amount',    align: 'right', format: v => php(v), cls: () => 'font-semibold text-gray-900' },
      { key: 'pct',   label: '% of Revenue',   align: 'right', format: v => pct(v) },
    ],
    getData: getPaymentSummary,
    getFooter: rows => ['TOTAL', rows.reduce((s,r)=>s+r.count,0), php(rows.reduce((s,r)=>s+r.total,0)), '100.0%'],
    getSummary: rows => [
      { label: 'Total Collected',   value: php(rows.reduce((s,r)=>s+r.total,0)), color: 'text-blue-600' },
      { label: 'Payment Records',   value: rows.reduce((s,r)=>s+r.count,0) },
      { label: 'Methods Used',      value: rows.length },
      { label: 'Top Method',        value: rows[0]?.type || '—' },
    ],
  },

  'inv-summary': {
    label: 'Inventory Summary', description: 'Current stock levels for all active products',
    filters: ['category'],
    columns: [
      { key: 'name',         label: 'Product',       align: 'left', cls: () => 'font-medium' },
      { key: 'sku',          label: 'SKU',            align: 'left', cls: () => 'font-mono text-xs text-gray-500' },
      { key: 'category',     label: 'Category',      align: 'left' },
      { key: 'unit',         label: 'Unit',           align: 'center' },
      { key: 'stock',        label: 'Stock',          align: 'right', cls: r => r.stock === 0 ? 'text-red-600 font-bold' : r.stock <= r.reorderLevel ? 'text-orange-600 font-semibold' : 'text-gray-700' },
      { key: 'reorderLevel', label: 'Reorder At',    align: 'right' },
      { key: 'costPrice',    label: 'Unit Cost',      align: 'right', format: v => php(v) },
      { key: 'value',        label: 'Stock Value',   align: 'right', format: v => php(v), cls: () => 'font-semibold text-gray-900' },
      { key: 'status',       label: 'Status',        align: 'left',
        badge: r => r.status === 'Out of Stock' ? 'bg-red-100 text-red-600' : r.status === 'Low Stock' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-700' },
    ],
    getData: getInventorySummary,
    getFooter: rows => ['TOTAL', '', '', '', '', '', '', php(rows.reduce((s,r)=>s+r.value,0)), ''],
    getSummary: rows => [
      { label: 'Total Value',    value: php(rows.reduce((s,r)=>s+r.value,0)), color: 'text-blue-600' },
      { label: 'Products',       value: rows.length },
      { label: 'Low Stock',      value: rows.filter(r=>r.status==='Low Stock').length, color: 'text-orange-600' },
      { label: 'Out of Stock',   value: rows.filter(r=>r.status==='Out of Stock').length, color: 'text-red-600' },
    ],
  },

  'low-stock': {
    label: 'Low Stock Report', description: 'Products at or below reorder level',
    filters: ['category'],
    columns: [
      { key: 'name',         label: 'Product',    align: 'left', cls: () => 'font-medium' },
      { key: 'sku',          label: 'SKU',         align: 'left', cls: () => 'font-mono text-xs text-gray-500' },
      { key: 'category',     label: 'Category',   align: 'left' },
      { key: 'unit',         label: 'Unit',        align: 'center' },
      { key: 'stock',        label: 'Current',     align: 'right', cls: r => r.stock === 0 ? 'text-red-600 font-bold' : 'text-orange-600 font-semibold' },
      { key: 'reorderLevel', label: 'Reorder At', align: 'right' },
      { key: 'shortage',     label: 'Shortage',   align: 'right', cls: () => 'text-red-500 font-semibold' },
      { key: 'riskValue',    label: 'Risk Value', align: 'right', format: v => php(v) },
    ],
    getData: getLowStock,
    getFooter: rows => ['TOTAL', '', '', '', '', '', rows.reduce((s,r)=>s+r.shortage,0), php(rows.reduce((s,r)=>s+r.riskValue,0))],
    getSummary: rows => [
      { label: 'Items Below Reorder', value: rows.length,                             color: 'text-orange-600' },
      { label: 'Out of Stock',        value: rows.filter(r=>r.stock===0).length,       color: 'text-red-600' },
      { label: 'Total Shortage Units',value: rows.reduce((s,r)=>s+r.shortage,0) },
      { label: 'Total Risk Value',    value: php(rows.reduce((s,r)=>s+r.riskValue,0)) },
    ],
  },

  'inv-valuation': {
    label: 'Inventory Valuation', description: 'Cost vs selling value and margin analysis',
    filters: ['category'],
    columns: [
      { key: 'name',         label: 'Product',       align: 'left', cls: () => 'font-medium' },
      { key: 'category',     label: 'Category',      align: 'left' },
      { key: 'costPrice',    label: 'Cost',           align: 'right', format: v => php(v) },
      { key: 'sellingPrice', label: 'Selling Price', align: 'right', format: v => php(v) },
      { key: 'stock',        label: 'Stock',          align: 'right' },
      { key: 'costValue',    label: 'Cost Value',    align: 'right', format: v => php(v) },
      { key: 'sellingValue', label: 'Selling Value', align: 'right', format: v => php(v), cls: () => 'font-semibold text-gray-900' },
      { key: 'margin',       label: 'Margin %',      align: 'right', format: v => pct(v), cls: r => r.margin >= 20 ? 'text-green-600' : r.margin > 0 ? 'text-orange-600' : 'text-red-500' },
    ],
    getData: getInventoryValuation,
    getFooter: rows => ['TOTAL', '', '', '', '', php(rows.reduce((s,r)=>s+r.costValue,0)), php(rows.reduce((s,r)=>s+r.sellingValue,0)), pct(rows.reduce((s,r)=>s+r.costValue,0)>0 ? ((rows.reduce((s,r)=>s+r.sellingValue,0)-rows.reduce((s,r)=>s+r.costValue,0))/rows.reduce((s,r)=>s+r.costValue,0))*100 : 0)],
    getSummary: rows => {
      const cv = rows.reduce((s,r)=>s+r.costValue,0)
      const sv = rows.reduce((s,r)=>s+r.sellingValue,0)
      return [
        { label: 'Total Cost Value',    value: php(cv) },
        { label: 'Total Selling Value', value: php(sv), color: 'text-blue-600' },
        { label: 'Gross Profit Potential', value: php(sv-cv), color: 'text-green-600' },
        { label: 'Avg Margin',          value: pct(cv>0 ? ((sv-cv)/cv)*100 : 0) },
      ]
    },
  },

  'returns': {
    label: 'Return & Refund Report', description: 'All return and refund transactions',
    filters: ['date', 'status'],
    columns: [
      { key: 'id',            label: 'Return #',     align: 'left', cls: () => 'font-mono text-xs text-orange-600' },
      { key: 'transactionId', label: 'Transaction',  align: 'left', cls: () => 'font-mono text-xs text-blue-600' },
      { key: 'date',          label: 'Date',          align: 'left', format: v => fmtD(v) },
      { key: 'customer',      label: 'Customer',      align: 'left', format: v => v || '—' },
      { key: 'returnType',    label: 'Type',          align: 'left',
        badge: r => r.returnType === 'refund' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700' },
      { key: 'reason',        label: 'Reason',        align: 'left', cls: () => 'text-gray-500 text-xs' },
      { key: 'refundAmount',  label: 'Refund',        align: 'right', format: v => php(v), cls: () => 'font-semibold text-gray-900' },
      { key: 'status',        label: 'Status',        align: 'left',
        badge: r => ({pending:'bg-yellow-100 text-yellow-700',approved:'bg-blue-100 text-blue-700',completed:'bg-green-100 text-green-700',rejected:'bg-red-100 text-red-600'})[r.status] || '' },
    ],
    getData: getReturnSummary,
    getFooter: rows => ['', '', '', '', '', 'TOTAL', php(rows.reduce((s,r)=>s+r.refundAmount,0)), ''],
    getSummary: rows => [
      { label: 'Total Returns',    value: rows.length },
      { label: 'Total Refunded',   value: php(rows.filter(r=>r.status==='completed').reduce((s,r)=>s+r.refundAmount,0)), color: 'text-orange-600' },
      { label: 'Pending Approval', value: rows.filter(r=>r.status==='pending').length, color: 'text-yellow-600' },
      { label: 'Completed',        value: rows.filter(r=>r.status==='completed').length, color: 'text-green-600' },
    ],
  },

  'txn-history': {
    label: 'Transaction History', description: 'Full transaction log with all statuses',
    filters: ['date', 'cashier', 'payment', 'status'],
    columns: [
      { key: 'id',       label: 'Receipt #',  align: 'left', cls: () => 'font-mono text-xs text-blue-600' },
      { key: 'date',     label: 'Date',        align: 'left', format: v => fmtDT(v) },
      { key: 'customer', label: 'Customer',    align: 'left', format: v => v || '—' },
      { key: 'cashier',  label: 'Cashier',     align: 'left' },
      { key: 'items',    label: 'Items',        align: 'right' },
      { key: 'payments', label: 'Payment',     align: 'left' },
      { key: 'total',    label: 'Total',        align: 'right', format: v => php(v), cls: r => r._voided ? 'line-through text-red-400' : 'font-semibold text-gray-900' },
      { key: 'status',   label: 'Status',      align: 'left',
        badge: r => r.status === 'voided' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700' },
    ],
    getData: getTxnHistory,
    getFooter: rows => { const comp = rows.filter(r=>!r._voided); return ['', '', '', '', comp.reduce((s,r)=>s+r.items,0), '', php(comp.reduce((s,r)=>s+r.total,0)), ''] },
    getSummary: rows => {
      const comp = rows.filter(r=>!r._voided)
      return [
        { label: 'Total Transactions', value: rows.length },
        { label: 'Total Revenue',      value: php(comp.reduce((s,r)=>s+r.total,0)), color: 'text-blue-600' },
        { label: 'Voided',             value: rows.filter(r=>r._voided).length, color: 'text-red-500' },
        { label: 'Avg Transaction',    value: php(comp.length ? comp.reduce((s,r)=>s+r.total,0)/comp.length : 0) },
      ]
    },
  },
}

// ── Active report ──
const selected = ref('daily-sales')
const activeConfig = computed(() => REPORT_CONFIGS[selected.value])
function selectReport(id) { selected.value = id; resetFilters() }

const rows      = computed(() => activeConfig.value?.getData() ?? [])
const summary   = computed(() => activeConfig.value?.getSummary(rows.value) ?? [])
const footerRow = computed(() => activeConfig.value?.getFooter(rows.value) ?? [])

// ─────────────────────────────────────────────────────────────────────
// EXPORT FUNCTIONS
// ─────────────────────────────────────────────────────────────────────

function flatCellValue(col, row) {
  const raw = row[col.key]
  return col.format && !col.badge ? String(col.format(raw, row)).replace(/[₱,]/g, '') : String(raw ?? '')
}

function doExport(type) {
  const cfg    = activeConfig.value
  if (!cfg) return
  const title   = cfg.label
  const headers = cfg.columns.map(c => c.label)
  const data    = rows.value.map(row => cfg.columns.map(col => flatCellValue(col, row)))
  const fname   = title.replace(/\s+/g, '-').toLowerCase()
  const now     = new Date().toLocaleString('en-PH')

  if (type === 'csv') {
    const csv = [headers, ...data].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
    trigger('﻿' + csv, `${fname}.csv`, 'text/csv;charset=utf-8;')

  } else if (type === 'excel') {
    const th = headers.map(h => `<th style="background:#f0f0f0;font-weight:bold;border:1px solid #ccc;padding:6px">${h}</th>`).join('')
    const tb = data.map(r => `<tr>${r.map(c => `<td style="border:1px solid #ccc;padding:5px">${c}</td>`).join('')}</tr>`).join('')
    const html = `<html><head><meta charset="utf-8"></head><body>
      <h2 style="font-family:Arial">${title}</h2>
      <p style="font-family:Arial;font-size:11px;color:#666">Generated: ${now} · PabiliPOS</p>
      <table style="border-collapse:collapse;font-family:Arial;font-size:12px"><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>
      </body></html>`
    trigger('﻿' + html, `${fname}.xls`, 'application/vnd.ms-excel;charset=utf-8;')

  } else if (type === 'pdf') {
    const th = headers.map(h => `<th>${h}</th>`).join('')
    const tb = data.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(`<html><head><title>${title}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;padding:20px}
      h1{font-size:16px;margin-bottom:4px}p.meta{color:#888;font-size:10px;margin-bottom:14px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px 8px;text-align:left}
      th{background:#f5f5f5;font-weight:600;font-size:10px;text-transform:uppercase}
      tr:nth-child(even){background:#fafafa}
    </style></head><body>
      <h1>${title}</h1><p class="meta">Generated: ${now} · PabiliPOS</p>
      <table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print() }, 400)
  }
}

function trigger(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
