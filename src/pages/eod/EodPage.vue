<template>
  <div class="space-y-5" id="eod-content">

    <!-- ── Header ── -->
    <div class="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">End of Day Report</h2>
        <p class="text-sm text-gray-500">{{ levelLabel }} — {{ settingsStore.config.storeName }}</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <input v-model="reportDate" type="date"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button @click="exportCsv"
          class="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-colors">
          <Download class="w-4 h-4" /> CSV
        </button>
        <button @click="printEod"
          class="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Printer class="w-4 h-4" /> Print Report
        </button>
        <button v-if="!reviewed" @click="markReviewed"
          class="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
          <CheckCircle class="w-4 h-4" /> Mark Reviewed
        </button>
        <span v-else class="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
          <CheckCircle class="w-4 h-4" /> Reviewed ✓
        </span>
      </div>
    </div>

    <!-- ── Shift / EOD header card ── -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
        <div><p class="text-xs text-gray-400">Report Date</p><p class="font-bold text-gray-900">{{ formatDate(reportDate) }}</p></div>
        <div><p class="text-xs text-gray-400">Cashier</p><p class="font-semibold text-gray-700">{{ todayShift?.cashierName || `${authStore.user?.firstName} ${authStore.user?.lastName}`.trim() }}</p></div>
        <div><p class="text-xs text-gray-400">Shift Opened</p><p class="font-semibold text-gray-700">{{ todayShift ? formatTime(todayShift.openedAt) : '—' }}</p></div>
        <div><p class="text-xs text-gray-400">Shift Closed</p><p class="font-semibold" :class="todayShift?.closedAt ? 'text-gray-700' : 'text-green-600'">{{ todayShift?.closedAt ? formatTime(todayShift.closedAt) : 'Still Open' }}</p></div>
        <div><p class="text-xs text-gray-400">Opening Cash</p><p class="font-semibold text-gray-700">{{ php(todayShift?.openingCash || 0) }}</p></div>
        <div><p class="text-xs text-gray-400">Status</p>
          <span :class="todayShift?.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'" class="text-xs px-2 py-0.5 rounded-full font-semibold capitalize">
            {{ todayShift?.status || 'Active' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ══════════ LEVEL 1 (ALL ROLES) ══════════ -->

    <!-- Sales Summary -->
    <div>
      <h3 class="eod-section-title">Sales Summary</h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Gross Sales</p>
          <p class="text-2xl font-black text-gray-900 mt-1">{{ php(grossSales) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Total Discounts</p>
          <p class="text-2xl font-black text-red-500 mt-1">−{{ php(totalDiscounts) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Returns</p>
          <p class="text-2xl font-black text-orange-500 mt-1">−{{ php(totalReturned) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 border-blue-200 bg-blue-50">
          <p class="text-xs text-blue-500 font-semibold">Net Sales</p>
          <p class="text-2xl font-black text-blue-700 mt-1">{{ php(netSales) }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ completedDayTxns.length }} txns · Avg {{ php(avgSale) }}</p>
        </div>
      </div>
    </div>

    <!-- Two-column: Payment Breakdown + Transaction Summary -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

      <!-- Payment Breakdown -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100"><h3 class="text-sm font-semibold text-gray-700">Payment Breakdown</h3></div>
        <table class="w-full text-sm">
          <thead class="bg-gray-50"><tr>
            <th class="text-left px-5 py-2 text-xs font-semibold text-gray-500">Method</th>
            <th class="text-right px-5 py-2 text-xs font-semibold text-gray-500">Count</th>
            <th class="text-right px-5 py-2 text-xs font-semibold text-gray-500">Amount</th>
            <th class="text-right px-5 py-2 text-xs font-semibold text-gray-500">%</th>
          </tr></thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-if="!paymentBreakdown.length"><td colspan="4" class="px-5 py-6 text-center text-gray-400 text-xs">No payments today</td></tr>
            <tr v-for="p in paymentBreakdown" :key="p.method" class="hover:bg-gray-50">
              <td class="px-5 py-2.5 font-medium text-gray-800">{{ p.method }}</td>
              <td class="px-5 py-2.5 text-right text-gray-500">{{ p.count }}</td>
              <td class="px-5 py-2.5 text-right font-semibold text-gray-900">{{ php(p.amount) }}</td>
              <td class="px-5 py-2.5 text-right text-gray-400 text-xs">{{ netSales > 0 ? ((p.amount / netSales) * 100).toFixed(1) : 0 }}%</td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-50 border-t-2 border-gray-200">
            <tr><td colspan="2" class="px-5 py-2 text-xs font-bold text-gray-600 text-right">TOTAL</td>
            <td class="px-5 py-2 text-right font-black text-gray-900">{{ php(netSales) }}</td>
            <td class="px-5 py-2 text-right text-xs text-gray-400">100%</td></tr>
          </tfoot>
        </table>
      </div>

      <!-- Transaction Summary -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100"><h3 class="text-sm font-semibold text-gray-700">Transaction Summary</h3></div>
        <div class="divide-y divide-gray-50">
          <div v-for="r in txnSummaryRows" :key="r.label" class="flex items-center justify-between px-5 py-3">
            <div class="flex items-center gap-2">
              <div :class="r.dot" class="w-2.5 h-2.5 rounded-full shrink-0"></div>
              <span class="text-sm text-gray-700">{{ r.label }}</span>
            </div>
            <span class="text-base font-bold" :class="r.color">{{ r.value }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cash Drawer Reconciliation -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100"><h3 class="text-sm font-semibold text-gray-700">Cash Drawer Reconciliation</h3></div>
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-gray-100">

        <!-- System Calculation -->
        <div class="p-5 space-y-2">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">System Calculation</p>
          <div v-for="r in cashCalcRows" :key="r.label" class="flex justify-between text-sm">
            <span class="text-gray-600">{{ r.label }}</span>
            <span :class="r.cls" class="font-medium">{{ r.value }}</span>
          </div>
          <div class="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-1">
            <span class="text-blue-700">Expected Cash</span>
            <span class="text-blue-700">{{ php(expectedCash) }}</span>
          </div>
        </div>

        <!-- Actual Count -->
        <div class="p-5">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Actual Count</p>
          <div v-if="todayShift?.countedCash != null">
            <p class="text-3xl font-black text-gray-900">{{ php(todayShift.countedCash) }}</p>
            <p class="text-xs text-gray-400 mt-1">Counted at shift close</p>
          </div>
          <div v-else class="text-gray-400 text-sm">Shift not yet closed</div>
        </div>

        <!-- Variance -->
        <div class="p-5">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Variance</p>
          <div v-if="todayShift?.countedCash != null">
            <p class="text-3xl font-black" :class="cashVariance >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ cashVariance >= 0 ? '+' : '' }}{{ php(cashVariance) }}
            </p>
            <p class="text-sm font-semibold mt-1" :class="cashVariance === 0 ? 'text-green-600' : cashVariance > 0 ? 'text-blue-600' : 'text-red-600'">
              {{ cashVariance === 0 ? '✓ Balanced' : cashVariance > 0 ? '⬆ Overage' : '⬇ Shortage' }}
            </p>
            <p v-if="todayShift?.notes" class="text-xs text-gray-500 mt-2 italic">Note: {{ todayShift.notes }}</p>
          </div>
          <div v-else class="text-gray-400 text-sm">—</div>
        </div>
      </div>
    </div>

    <!-- Top Selling Products -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100"><h3 class="text-sm font-semibold text-gray-700">Top Selling Products</h3></div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50"><tr>
          <th class="text-left px-5 py-2 text-xs font-semibold text-gray-500">#</th>
          <th class="text-left px-5 py-2 text-xs font-semibold text-gray-500">Product</th>
          <th class="text-right px-5 py-2 text-xs font-semibold text-gray-500">Units Sold</th>
          <th class="text-right px-5 py-2 text-xs font-semibold text-gray-500">Revenue</th>
        </tr></thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-if="!topProducts.length"><td colspan="4" class="px-5 py-6 text-center text-gray-400 text-xs">No sales today</td></tr>
          <tr v-for="(p, i) in topProducts" :key="p.name" class="hover:bg-gray-50">
            <td class="px-5 py-2.5">
              <span class="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center"
                :class="i < 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'">{{ i+1 }}</span>
            </td>
            <td class="px-5 py-2.5 font-medium text-gray-800">{{ p.name }}</td>
            <td class="px-5 py-2.5 text-right font-semibold text-gray-900">{{ p.qty }}</td>
            <td class="px-5 py-2.5 text-right text-gray-700">{{ php(p.revenue) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ══════════ LEVEL 2+3 (MANAGER / OWNER ONLY) ══════════ -->
    <template v-if="isManager">

      <!-- Discount Report -->
      <div>
        <h3 class="eod-section-title">Discount Report</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <!-- By type summary -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100"><p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">By Type</p></div>
            <table class="w-full text-sm">
              <tbody class="divide-y divide-gray-50">
                <tr v-if="!discountByType.length"><td colspan="3" class="px-5 py-6 text-center text-gray-400 text-xs">No discounts today</td></tr>
                <tr v-for="d in discountByType" :key="d.typeName" class="hover:bg-gray-50">
                  <td class="px-5 py-2.5 font-medium text-gray-800">{{ d.typeName }}</td>
                  <td class="px-5 py-2.5 text-right text-gray-500">{{ d.count }}</td>
                  <td class="px-5 py-2.5 text-right font-semibold text-red-500">−{{ php(d.amount) }}</td>
                </tr>
              </tbody>
              <tfoot v-if="dayDiscounts.length" class="bg-gray-50 border-t-2 border-gray-200">
                <tr><td class="px-5 py-2 text-xs font-bold text-gray-600">TOTAL DISCOUNTS</td>
                <td class="px-5 py-2 text-right font-bold text-gray-600">{{ dayDiscounts.length }}</td>
                <td class="px-5 py-2 text-right font-black text-red-600">−{{ php(totalDiscounts) }}</td></tr>
              </tfoot>
            </table>
          </div>

          <!-- Detailed log -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100"><p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detail Log ({{ dayDiscounts.length }})</p></div>
            <div class="max-h-56 overflow-y-auto divide-y divide-gray-50">
              <div v-if="!dayDiscounts.length" class="px-5 py-6 text-center text-gray-400 text-xs">No discounts today</div>
              <div v-for="d in dayDiscounts" :key="d.id" class="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50">
                <div>
                  <p class="text-xs font-semibold text-gray-800">{{ d.typeName }} {{ d.discountPct }}% · <span class="font-mono text-blue-500">{{ d.transactionId }}</span></p>
                  <p class="text-xs text-gray-400">{{ d.appliedBy }}<span v-if="d.overriddenBy"> · <span class="text-orange-500">Override by {{ d.overriddenBy }}</span></span></p>
                  <p v-if="d.reason" class="text-xs text-gray-400 italic">{{ d.reason }}</p>
                </div>
                <p class="text-sm font-semibold text-red-500 shrink-0 ml-3">−{{ php(d.discountAmount) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Returns & Refunds -->
      <div>
        <h3 class="eod-section-title">Returns &amp; Refunds</h3>
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex justify-between">
            <p class="text-sm font-semibold text-gray-700">{{ dayReturns.length }} return(s) today</p>
            <p class="text-sm font-bold text-orange-500">−{{ php(totalReturned) }}</p>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50"><tr>
              <th class="text-left px-5 py-2 text-xs font-semibold text-gray-500">Return #</th>
              <th class="text-left px-5 py-2 text-xs font-semibold text-gray-500">Transaction</th>
              <th class="text-left px-5 py-2 text-xs font-semibold text-gray-500">Type</th>
              <th class="text-left px-5 py-2 text-xs font-semibold text-gray-500">Reason</th>
              <th class="text-right px-5 py-2 text-xs font-semibold text-gray-500">Amount</th>
              <th class="text-left px-5 py-2 text-xs font-semibold text-gray-500">Status</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-if="!dayReturns.length"><td colspan="6" class="px-5 py-6 text-center text-gray-400 text-xs">No returns today</td></tr>
              <tr v-for="r in dayReturns" :key="r.id" class="hover:bg-gray-50">
                <td class="px-5 py-2.5 font-mono text-xs text-orange-600">{{ r.id }}</td>
                <td class="px-5 py-2.5 font-mono text-xs text-blue-600">{{ r.transactionId }}</td>
                <td class="px-5 py-2.5 capitalize text-gray-700">{{ r.returnType }}</td>
                <td class="px-5 py-2.5 text-xs text-gray-500">{{ r.reason }}</td>
                <td class="px-5 py-2.5 text-right font-semibold text-orange-500">−{{ php(r.refundAmount) }}</td>
                <td class="px-5 py-2.5"><span class="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                  :class="{pending:'bg-yellow-100 text-yellow-700',approved:'bg-blue-100 text-blue-700',completed:'bg-green-100 text-green-700',rejected:'bg-red-100 text-red-600'}[r.status]">{{ r.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Cashier Performance -->
      <div>
        <h3 class="eod-section-title">Cashier Performance</h3>
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50"><tr>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cashier</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transactions</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sales</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Discounts</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Voids</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Returns</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="!cashierPerformance.length"><td colspan="6" class="px-5 py-8 text-center text-gray-400 text-xs">No transactions today</td></tr>
              <tr v-for="c in cashierPerformance" :key="c.cashier" class="hover:bg-gray-50">
                <td class="px-5 py-3 font-semibold text-gray-800">{{ c.cashier }}</td>
                <td class="px-5 py-3 text-right text-gray-700">{{ c.transactions }}</td>
                <td class="px-5 py-3 text-right font-semibold text-gray-900">{{ php(c.sales) }}</td>
                <td class="px-5 py-3 text-right text-red-500">{{ c.discounts > 0 ? '−' + php(c.discounts) : '—' }}</td>
                <td class="px-5 py-3 text-right" :class="c.voids > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'">{{ c.voids || 0 }}</td>
                <td class="px-5 py-3 text-right" :class="c.returns > 0 ? 'text-orange-500 font-semibold' : 'text-gray-400'">{{ c.returns || 0 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Exception Report -->
      <div>
        <h3 class="eod-section-title">Exception Report <span v-if="exceptions.length" class="text-sm font-normal text-red-500">({{ exceptions.length }} event{{ exceptions.length !== 1 ? 's' : '' }})</span></h3>
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50"><tr>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cashier</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Detail</th>
              <th class="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
              <th class="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved By</th>
            </tr></thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="!exceptions.length"><td colspan="6" class="px-5 py-8 text-center text-gray-400 text-xs">No exceptions today ✓</td></tr>
              <tr v-for="(e, i) in exceptions" :key="i" class="hover:bg-gray-50">
                <td class="px-5 py-3">
                  <span :class="{
                    void:            'bg-red-100 text-red-700',
                    large_discount:  'bg-orange-100 text-orange-700',
                    manager_override:'bg-purple-100 text-purple-700',
                  }[e.type] || 'bg-gray-100 text-gray-600'" class="text-xs px-2 py-0.5 rounded-full font-semibold">
                    {{ exceptionTypeLabel(e.type) }}
                  </span>
                </td>
                <td class="px-5 py-3 font-mono text-xs text-blue-600">{{ e.txnId || '—' }}</td>
                <td class="px-5 py-3 text-gray-700">{{ e.cashier }}</td>
                <td class="px-5 py-3 text-xs text-gray-500">{{ e.detail }}</td>
                <td class="px-5 py-3 text-right font-semibold text-red-500">{{ e.amount > 0 ? php(e.amount) : '—' }}</td>
                <td class="px-5 py-3 text-xs text-orange-600 font-medium">{{ e.approvedBy || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Inventory Movement -->
      <div>
        <h3 class="eod-section-title">Inventory Movement</h3>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="s in inventoryStats" :key="s.label" class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500">{{ s.label }}</p>
            <p class="text-2xl font-bold mt-1" :class="s.color">{{ s.value }}</p>
          </div>
        </div>
      </div>

      <!-- Credit / Account Sales -->
      <div v-if="creditSales.count > 0 || creditSales.payments > 0">
        <h3 class="eod-section-title">Credit / Account Sales (Utang)</h3>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div class="text-center p-3 bg-red-50 rounded-xl">
              <p class="text-xs text-gray-500">New Credit Sales</p>
              <p class="text-2xl font-black text-red-600 mt-1">{{ php(creditSales.newCredit) }}</p>
              <p class="text-xs text-gray-400">{{ creditSales.count }} transactions</p>
            </div>
            <div class="text-center p-3 bg-green-50 rounded-xl">
              <p class="text-xs text-gray-500">Credit Payments Received</p>
              <p class="text-2xl font-black text-green-600 mt-1">{{ php(creditSales.payments) }}</p>
            </div>
            <div class="text-center p-3 bg-orange-50 rounded-xl">
              <p class="text-xs text-gray-500">Net Outstanding</p>
              <p class="text-2xl font-black text-orange-600 mt-1">{{ php(creditSales.newCredit - creditSales.payments) }}</p>
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- ── Footer / Reviewed by ── -->
    <div v-if="reviewed" class="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
      <div class="flex items-center gap-2 text-green-700">
        <CheckCircle class="w-5 h-5" />
        <span class="text-sm font-semibold">EOD Report reviewed and confirmed</span>
      </div>
      <span class="text-xs text-green-600">{{ reviewedBy }} · {{ reviewedAt }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { useDiscountStore }    from '@/stores/discounts'
import { useReturnStore }      from '@/stores/returns'
import { useShiftStore }       from '@/stores/shifts'
import { useProductStore }     from '@/stores/products'
import { useSettingsStore }    from '@/stores/settings'
import { useAuthStore }        from '@/stores/auth'
import { Download, Printer, CheckCircle } from '@lucide/vue'

const txnStore      = useTransactionStore()
const discStore     = useDiscountStore()
const retStore      = useReturnStore()
const shiftStore    = useShiftStore()
const prodStore     = useProductStore()
const settingsStore = useSettingsStore()
const authStore     = useAuthStore()

// ── Format helpers ──
const php      = n => `₱${(+n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
const formatDate = d => d ? new Date(d).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'
const formatTime = d => d ? new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—'
const formatDT   = d => d ? new Date(d).toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' }) : '—'

const isManager    = computed(() => ['owner', 'manager'].includes(authStore.role))
const levelLabel   = computed(() => ({ owner: 'Owner Dashboard', manager: 'Manager EOD', cashier: 'Cashier EOD' }[authStore.role] || 'EOD'))

// ── Date selector ──
const reportDate = ref(new Date().toISOString().slice(0, 10))

// ── Transactions for the selected date ──
const dayTxns          = computed(() => txnStore.transactions.filter(t => t.date.slice(0, 10) === reportDate.value))
const completedDayTxns = computed(() => dayTxns.value.filter(t => t.status === 'completed'))
const voidedDayTxns    = computed(() => dayTxns.value.filter(t => t.status === 'voided'))

// ── Sales calculations ──
const grossSales    = computed(() => completedDayTxns.value.reduce((s, t) => s + t.subtotal, 0))
const totalDiscounts= computed(() => completedDayTxns.value.reduce((s, t) => s + (t.lineDiscounts || 0) + (t.transactionDiscount || 0), 0))
const dayReturns    = computed(() => retStore.returns.filter(r => r.date.slice(0, 10) === reportDate.value))
const totalReturned = computed(() => dayReturns.value.filter(r => r.status === 'completed').reduce((s, r) => s + r.refundAmount, 0))
const netSales      = computed(() => completedDayTxns.value.reduce((s, t) => s + t.total, 0))
const avgSale       = computed(() => completedDayTxns.value.length ? netSales.value / completedDayTxns.value.length : 0)

// ── Payment breakdown ──
const paymentBreakdown = computed(() => {
  const map = {}
  completedDayTxns.value.forEach(t => {
    t.payments.forEach(p => {
      if (!map[p.method]) map[p.method] = { method: p.method, count: 0, amount: 0 }
      map[p.method].count++
      map[p.method].amount += p.amount
    })
  })
  return Object.values(map).sort((a, b) => b.amount - a.amount)
})

// ── Transaction summary rows ──
const heldDayCount = computed(() => {
  const today = reportDate.value
  return shiftStore.shiftHistory.find(s => s.openedAt.slice(0,10) === today)?.movements?.length || 0
})

const txnSummaryRows = computed(() => [
  { label: 'Completed Sales',    value: completedDayTxns.value.length, dot: 'bg-green-500', color: 'text-green-600' },
  { label: 'Voided Transactions',value: voidedDayTxns.value.length,    dot: 'bg-red-500',   color: voidedDayTxns.value.length > 0 ? 'text-red-600' : 'text-gray-400' },
  { label: 'Returns/Refunds',    value: dayReturns.value.length,       dot: 'bg-orange-500',color: dayReturns.value.length > 0 ? 'text-orange-500' : 'text-gray-400' },
  { label: 'Held Transactions',  value: posHeldCount.value,            dot: 'bg-yellow-500',color: 'text-yellow-600' },
  { label: 'Total Transactions', value: dayTxns.value.length,          dot: 'bg-blue-500',  color: 'text-blue-600'  },
])

const posHeldCount = computed(() => {
  // Count transactions from today's held log in shift movements (best we can do without a held log)
  return 0 // Held are in-memory, not persisted
})

// ── Cash drawer ──
const todayShift = computed(() => {
  const s = shiftStore.shiftHistory.find(s => s.openedAt.slice(0, 10) === reportDate.value)
  if (s) return s
  if (shiftStore.activeShift?.openedAt.slice(0, 10) === reportDate.value) return shiftStore.activeShift
  return null
})

const cashSalesDay     = computed(() => completedDayTxns.value.reduce((s, t) => s + t.payments.filter(p => p.method === 'Cash').reduce((a, p) => a + p.amount, 0), 0))
const changeGivenDay   = computed(() => completedDayTxns.value.filter(t => t.payments.some(p => p.method === 'Cash')).reduce((s, t) => s + (t.change || 0), 0))
const cashInDay        = computed(() => todayShift.value?.movements?.filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0) || 0)
const cashOutDay       = computed(() => todayShift.value?.movements?.filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0) || 0)
const expectedCash     = computed(() => (todayShift.value?.openingCash || 0) + cashSalesDay.value - changeGivenDay.value + cashInDay.value - cashOutDay.value)
const cashVariance     = computed(() => todayShift.value?.countedCash != null ? todayShift.value.countedCash - expectedCash.value : null)

const cashCalcRows = computed(() => [
  { label: 'Opening Cash',       value: php(todayShift.value?.openingCash || 0),  cls: 'text-gray-700' },
  { label: '+ Cash Sales',       value: `+${php(cashSalesDay.value)}`,             cls: 'text-green-600' },
  { label: '− Change Given',     value: `−${php(changeGivenDay.value)}`,           cls: 'text-red-400' },
  { label: '+ Cash In',          value: `+${php(cashInDay.value)}`,                cls: 'text-green-600' },
  { label: '− Cash Out',         value: `−${php(cashOutDay.value)}`,               cls: 'text-red-400' },
])

// ── Top products ──
const topProducts = computed(() => {
  const map = {}
  completedDayTxns.value.forEach(t => t.items.forEach(i => {
    if (!map[i.name]) map[i.name] = { name: i.name, qty: 0, revenue: 0 }
    map[i.name].qty     += i.qty
    map[i.name].revenue += i.sellingPrice * i.qty * (1 - (i.lineDiscount || 0) / 100)
  }))
  return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 10)
})

// ── Discounts ──
const dayDiscounts = computed(() => discStore.auditLog.filter(e => e.appliedAt.slice(0, 10) === reportDate.value))
const discountByType = computed(() => {
  const map = {}
  dayDiscounts.value.forEach(d => {
    if (!map[d.typeName]) map[d.typeName] = { typeName: d.typeName, count: 0, amount: 0 }
    map[d.typeName].count++
    map[d.typeName].amount += d.discountAmount
  })
  return Object.values(map).sort((a, b) => b.amount - a.amount)
})

// ── Cashier performance ──
const cashierPerformance = computed(() => {
  const map = {}
  completedDayTxns.value.forEach(t => {
    if (!map[t.cashier]) map[t.cashier] = { cashier: t.cashier, transactions: 0, sales: 0, discounts: 0, voids: 0, returns: 0 }
    map[t.cashier].transactions++
    map[t.cashier].sales      += t.total
    map[t.cashier].discounts  += (t.lineDiscounts || 0) + (t.transactionDiscount || 0)
  })
  voidedDayTxns.value.forEach(t => {
    if (!map[t.cashier]) map[t.cashier] = { cashier: t.cashier, transactions: 0, sales: 0, discounts: 0, voids: 0, returns: 0 }
    map[t.cashier].voids++
  })
  dayReturns.value.forEach(r => {
    if (!map[r.createdBy]) map[r.createdBy] = { cashier: r.createdBy, transactions: 0, sales: 0, discounts: 0, voids: 0, returns: 0 }
    map[r.createdBy].returns++
  })
  return Object.values(map)
})

// ── Exception report ──
const exceptions = computed(() => {
  const list = []
  voidedDayTxns.value.forEach(t => {
    list.push({ type: 'void', txnId: t.id, cashier: t.cashier, amount: t.total, detail: t.voidReason || 'No reason given', approvedBy: t.voidedBy, date: t.date })
  })
  dayDiscounts.value.filter(d => d.discountPct >= 20 || d.overriddenBy).forEach(d => {
    list.push({ type: d.overriddenBy ? 'manager_override' : 'large_discount', txnId: d.transactionId, cashier: d.appliedBy, amount: d.discountAmount, detail: `${d.typeName} ${d.discountPct}%${d.reason ? ' — ' + d.reason : ''}`, approvedBy: d.overriddenBy, date: d.appliedAt })
  })
  return list.sort((a, b) => new Date(b.date) - new Date(a.date))
})

function exceptionTypeLabel(type) {
  return { void: 'Void Sale', large_discount: 'Large Discount', manager_override: 'Manager Override' }[type] || type
}

// ── Inventory movement ──
const inventoryStats = computed(() => {
  const soldItems = completedDayTxns.value.reduce((s, t) => s + t.items.reduce((a, i) => a + i.qty, 0), 0)
  const returnedItems = dayReturns.value.filter(r => r.status === 'completed').reduce((s, r) => s + r.items.reduce((a, i) => a + (i.returnQty || 0), 0), 0)
  return [
    { label: 'Items Sold',        value: soldItems,     color: 'text-blue-600' },
    { label: 'Items Returned',    value: returnedItems, color: returnedItems > 0 ? 'text-orange-500' : 'text-gray-400' },
    { label: 'Voided Items',      value: voidedDayTxns.value.reduce((s, t) => s + t.items.reduce((a, i) => a + i.qty, 0), 0), color: 'text-red-400' },
    { label: 'Net Items Moved',   value: soldItems - returnedItems, color: 'text-gray-800' },
  ]
})

// ── Credit/Account sales ──
const creditSales = computed(() => {
  const newCredit = completedDayTxns.value
    .filter(t => t.payments.some(p => p.method === 'Account'))
    .reduce((s, t) => s + t.payments.filter(p => p.method === 'Account').reduce((a, p) => a + p.amount, 0), 0)
  const count = completedDayTxns.value.filter(t => t.payments.some(p => p.method === 'Account')).length
  return { newCredit, payments: 0, count }
})

// ── Reviewed state ──
const reviewed   = ref(false)
const reviewedBy = ref('')
const reviewedAt = ref('')

function markReviewed() {
  reviewed.value   = true
  reviewedBy.value = `${authStore.user?.firstName} ${authStore.user?.lastName}`
  reviewedAt.value = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

// ── Print ──
function printEod() {
  const content = document.getElementById('eod-content')
  if (!content) return
  const win = window.open('', '_blank', 'width=900,height=700')
  win.document.write(`<html><head><title>EOD Report — ${reportDate.value}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:11px;padding:20px;color:#222}
      h1{font-size:18px;margin-bottom:4px}
      .eod-section-title{font-size:13px;font-weight:bold;margin:16px 0 8px;border-bottom:2px solid #333;padding-bottom:4px;text-transform:uppercase}
      table{width:100%;border-collapse:collapse;margin-bottom:12px}
      th,td{border:1px solid #ddd;padding:5px 8px;text-align:left}
      th{background:#f5f5f5;font-weight:600;font-size:10px;text-transform:uppercase}
      tr:nth-child(even){background:#fafafa}
      .grid{display:grid;gap:12px}
      .grid-2{grid-template-columns:1fr 1fr}
      .grid-4{grid-template-columns:repeat(4,1fr)}
      .card{border:1px solid #ddd;border-radius:6px;padding:12px}
      .big{font-size:20px;font-weight:900}
      .text-red{color:#dc2626}.text-green{color:#16a34a}.text-blue{color:#2563eb}.text-orange{color:#ea580c}
      p.meta{color:#666;font-size:10px;margin-bottom:12px}
      @media print{body{padding:10px}}
    </style>
    </head><body>
    <h1>END OF DAY REPORT</h1>
    <p class="meta">Date: ${formatDate(reportDate.value)} · Store: ${settingsStore.config.storeName} · Generated: ${new Date().toLocaleString('en-PH')}</p>
    ${content.innerHTML}
    </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 500)
}

// ── Export CSV ──
function exportCsv() {
  const rows = [
    ['END OF DAY REPORT'],
    ['Date', reportDate.value],
    ['Store', settingsStore.config.storeName],
    [],
    ['SALES SUMMARY'],
    ['Gross Sales', grossSales.value],
    ['Total Discounts', totalDiscounts.value],
    ['Returns', totalReturned.value],
    ['Net Sales', netSales.value],
    ['Transactions', completedDayTxns.value.length],
    ['Average Sale', avgSale.value.toFixed(2)],
    [],
    ['PAYMENT BREAKDOWN'],
    ['Method', 'Count', 'Amount'],
    ...paymentBreakdown.value.map(p => [p.method, p.count, p.amount.toFixed(2)]),
    [],
    ['CASH RECONCILIATION'],
    ['Opening Cash', todayShift.value?.openingCash || 0],
    ['Cash Sales', cashSalesDay.value.toFixed(2)],
    ['Change Given', changeGivenDay.value.toFixed(2)],
    ['Cash In', cashInDay.value.toFixed(2)],
    ['Cash Out', cashOutDay.value.toFixed(2)],
    ['Expected Cash', expectedCash.value.toFixed(2)],
    ...(todayShift.value?.countedCash != null ? [['Actual Cash', todayShift.value.countedCash.toFixed(2)], ['Variance', cashVariance.value.toFixed(2)]] : []),
  ]
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), { href: url, download: `EOD-${reportDate.value}.csv` })
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
}
</script>

<style scoped>
.eod-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
  margin-bottom: 0.75rem;
}
</style>
