<template>
  <div class="space-y-5">

    <!-- ══ NO ACTIVE SHIFT ══ -->
    <template v-if="!shiftStore.isOpen">
      <div class="max-w-md mx-auto">
        <div class="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-5">
          <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
            <Clock class="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-800">No Active Shift</h3>
            <p class="text-sm text-gray-400 mt-1">Count your opening cash and open a shift to begin.</p>
          </div>

          <div class="text-left space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Cashier</label>
              <input :value="`${authStore.user?.firstName} ${authStore.user?.lastName}`" readonly
                class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Opening Cash (₱)</label>
              <input v-model.number="openingCash" type="number" min="0" step="0.01" placeholder="0.00"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-right text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                :class="openShiftError ? 'border-red-400' : ''" />
            </div>
          </div>

          <p v-if="openShiftError" class="text-sm text-red-600 text-left">{{ openShiftError }}</p>
          <button @click="handleOpenShift" :disabled="openShiftLoading"
            class="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            <span v-if="openShiftLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ openShiftLoading ? 'Opening...' : 'Open Shift' }}
          </button>
        </div>
      </div>
    </template>

    <!-- ══ ACTIVE SHIFT ══ -->
    <template v-else>

      <!-- Status banner -->
      <div class="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <p class="text-xs text-green-600 font-semibold uppercase tracking-wide">Shift Active</p>
            <p class="text-base font-bold text-green-800">{{ shiftStore.activeShift.cashierName || `${authStore.user?.firstName} ${authStore.user?.lastName}`.trim() }}</p>
          </div>
        </div>
        <div class="flex items-center gap-6 text-sm">
          <div>
            <p class="text-xs text-green-600">Opened At</p>
            <p class="font-semibold text-green-800">{{ formatTime(shiftStore.activeShift.openedAt) }}</p>
          </div>
          <div>
            <p class="text-xs text-green-600">Opening Cash</p>
            <p class="font-semibold text-green-800">₱{{ shiftStore.activeShift.openingCash.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
          </div>
          <div>
            <p class="text-xs text-green-600">Elapsed</p>
            <p class="font-semibold text-green-800">{{ elapsed }}</p>
          </div>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Cash Sales</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">₱{{ cashSales.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ cashSalesCount }} transaction(s)</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Cash In</p>
          <p class="text-2xl font-bold text-green-600 mt-1">+₱{{ shiftStore.cashInTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ shiftStore.activeShift.movements.filter(m => m.type === 'in').length }} movement(s)</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Cash Out</p>
          <p class="text-2xl font-bold text-red-500 mt-1">-₱{{ shiftStore.cashOutTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
          <p class="text-xs text-gray-400 mt-0.5">{{ shiftStore.activeShift.movements.filter(m => m.type === 'out').length }} movement(s)</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500">Expected Cash</p>
          <p class="text-2xl font-bold text-blue-600 mt-1">₱{{ expectedCash.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
          <p class="text-xs text-gray-400 mt-0.5">In drawer now</p>
        </div>
      </div>

      <!-- Main content row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- Drawer log (2/3 width) -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-700">Cash Drawer Log</h3>
            <span class="text-xs text-gray-400">{{ drawerLog.length }} event(s)</span>
          </div>
          <div class="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            <div v-if="!drawerLog.length" class="px-5 py-8 text-center text-gray-400 text-sm">
              No movements yet this shift
            </div>
            <div v-for="entry in drawerLog" :key="entry.id" class="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
              <div class="flex items-center gap-3">
                <div :class="logDotClass(entry.type)" class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                  <component :is="logIcon(entry.type)" class="w-4 h-4" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ logLabel(entry) }}</p>
                  <p class="text-xs text-gray-400">{{ formatDateTime(entry.at) }} · {{ entry.recordedBy || entry.cashier }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold" :class="entry.type === 'cash_out' || entry.type === 'out' || entry.type === 'change' ? 'text-red-500' : 'text-green-600'">
                  {{ (entry.type === 'cash_out' || entry.type === 'out' || entry.type === 'change') ? '-' : '+' }}₱{{ entry.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions panel (1/3 width) -->
        <div class="space-y-3">
          <!-- Cash In -->
          <button @click="showCashIn = true"
            class="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-colors text-left">
            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
              <ArrowDownToLine class="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">Cash In</p>
              <p class="text-xs text-gray-400">Add money to drawer</p>
            </div>
          </button>

          <!-- Cash Out -->
          <button @click="showCashOut = true"
            class="w-full flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-colors text-left">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <ArrowUpFromLine class="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">Cash Out</p>
              <p class="text-xs text-gray-400">Petty cash / expenses</p>
            </div>
          </button>

          <!-- Close Shift -->
          <button @click="showClose = true"
            class="w-full flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors text-left">
            <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
              <LogOut class="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-800">Close Shift</p>
              <p class="text-xs text-gray-400">Count cash & end shift</p>
            </div>
          </button>
        </div>
      </div>
    </template>

    <!-- Shift History -->
    <div v-if="shiftStore.shiftHistory.length || shiftStore.pagination.total > 0" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-gray-700">Shift History</h3>
        <span class="text-xs text-gray-400">{{ shiftStore.pagination.total }} total shift(s)</span>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift #</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cashier</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Opened</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Closed</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Opening</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expected</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Counted</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Variance</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="s in shiftStore.shiftHistory" :key="s.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-xs text-blue-600">{{ s.id }}</td>
            <td class="px-4 py-3 text-gray-700">{{ s.cashierName }}</td>
            <td class="px-4 py-3 text-gray-600 text-xs">{{ formatDateTime(s.openedAt) }}</td>
            <td class="px-4 py-3 text-gray-600 text-xs">{{ formatDateTime(s.closedAt) }}</td>
            <td class="px-4 py-3 text-right text-gray-600">₱{{ s.openingCash.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td class="px-4 py-3 text-right text-gray-600">₱{{ (s.expectedCash || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td class="px-4 py-3 text-right font-semibold text-gray-800">₱{{ (s.countedCash || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
            <td class="px-4 py-3 text-right font-semibold" :class="(s.variance || 0) >= 0 ? 'text-green-600' : 'text-red-500'">
              {{ (s.variance || 0) >= 0 ? '+' : '' }}₱{{ (s.variance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td class="px-4 py-3 text-right">
              <button @click="openHistoryView(s)" class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <Eye class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- Pagination -->
      <div v-if="shiftStore.pagination.lastPage > 1" class="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">
          Showing {{ shiftStore.pagination.from }}–{{ shiftStore.pagination.to }} of {{ shiftStore.pagination.total }}
        </span>
        <div class="flex items-center gap-1">
          <button :disabled="shiftStore.pagination.currentPage <= 1"
            @click="shiftStore.fetchPage(shiftStore.pagination.currentPage - 1)"
            class="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft class="w-4 h-4" />
          </button>
          <span class="text-xs text-gray-600 px-2 font-medium">
            {{ shiftStore.pagination.currentPage }} / {{ shiftStore.pagination.lastPage }}
          </span>
          <button :disabled="shiftStore.pagination.currentPage >= shiftStore.pagination.lastPage"
            @click="shiftStore.fetchPage(shiftStore.pagination.currentPage + 1)"
            class="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronRight class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- ── CASH IN MODAL ── -->
    <div v-if="showCashIn" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <ArrowDownToLine class="w-5 h-5 text-green-600" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800">Cash In</h3>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Amount (₱) <span class="text-red-500">*</span></label>
          <input v-model.number="movForm.amount" type="number" min="0.01" step="0.01" placeholder="0.00"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-right text-xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Reason <span class="text-red-500">*</span></label>
          <input v-model="movForm.reason" type="text" placeholder="e.g. Add change money"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button v-for="s in cashInSuggestions" :key="s" @click="movForm.reason = s"
              class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-green-100 hover:text-green-700">{{ s }}</button>
          </div>
        </div>
        <p v-if="movError" class="text-sm text-red-600">{{ movError }}</p>
        <div class="flex gap-3 pt-1">
          <button @click="showCashIn = false; movError = ''" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="confirmCashIn" :disabled="movLoading" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
            <span v-if="movLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <ArrowDownToLine v-else class="w-4 h-4" />
            {{ movLoading ? 'Saving...' : 'Add Cash' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── CASH OUT MODAL ── -->
    <div v-if="showCashOut" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <ArrowUpFromLine class="w-5 h-5 text-red-500" />
          </div>
          <h3 class="text-lg font-semibold text-gray-800">Cash Out</h3>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Amount (₱) <span class="text-red-500">*</span></label>
          <input v-model.number="movForm.amount" type="number" min="0.01" step="0.01" placeholder="0.00"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-right text-xl font-bold focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Reason <span class="text-red-500">*</span></label>
          <input v-model="movForm.reason" type="text" placeholder="e.g. Buy tape"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          <div class="flex flex-wrap gap-1.5 mt-2">
            <button v-for="s in cashOutSuggestions" :key="s" @click="movForm.reason = s"
              class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-red-100 hover:text-red-600">{{ s }}</button>
          </div>
        </div>
        <p v-if="movError" class="text-sm text-red-600">{{ movError }}</p>
        <div class="flex gap-3 pt-1">
          <button @click="showCashOut = false; movError = ''" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="confirmCashOut" :disabled="movLoading" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50">
            <span v-if="movLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <ArrowUpFromLine v-else class="w-4 h-4" />
            {{ movLoading ? 'Saving...' : 'Remove Cash' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── CLOSE SHIFT MODAL ── -->
    <div v-if="showClose" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800">Close Shift — Cash Count</h3>
          <button @click="showClose = false" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="overflow-y-auto flex-1 p-6 space-y-5">
          <!-- Denomination counter -->
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Count Denominations</p>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="text-left px-3 py-2 text-xs text-gray-500 font-semibold">Denomination</th>
                    <th class="text-xs text-gray-500 font-semibold px-3 py-2 text-center">Type</th>
                    <th class="text-xs text-gray-500 font-semibold px-3 py-2 text-center w-24">Count</th>
                    <th class="text-xs text-gray-500 font-semibold px-3 py-2 text-right w-28">Amount</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="(d, i) in denominations" :key="i">
                    <td class="px-3 py-2 font-semibold text-gray-800">{{ d.label }}</td>
                    <td class="px-3 py-2 text-center">
                      <span :class="d.type === 'bill' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
                        class="text-xs px-2 py-0.5 rounded-full font-medium">{{ d.type }}</span>
                    </td>
                    <td class="px-3 py-2">
                      <input v-model.number="d.count" type="number" min="0"
                        class="w-full border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </td>
                    <td class="px-3 py-2 text-right font-semibold text-gray-700">
                      ₱{{ ((d.count || 0) * d.value).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-blue-50 border-t-2 border-blue-100">
                  <tr>
                    <td colspan="3" class="px-3 py-3 text-sm font-bold text-blue-800">Total Counted</td>
                    <td class="px-3 py-3 text-right text-lg font-bold text-blue-700">₱{{ denominationTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Override / direct input -->
          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-gray-200"></div>
            <span class="text-xs text-gray-400">or enter directly</span>
            <div class="flex-1 h-px bg-gray-200"></div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Actual Cash Counted (₱)</label>
            <input v-model.number="closeForm.countedCash" type="number" min="0" step="0.01"
              :placeholder="denominationTotal > 0 ? denominationTotal.toString() : '0.00'"
              class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-right text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p v-if="denominationTotal > 0 && !closeForm.countedCash" class="text-xs text-blue-600 mt-1">
              Using denomination count: ₱{{ denominationTotal.toFixed(2) }}
            </p>
          </div>

          <!-- Variance summary -->
          <div class="rounded-xl border border-gray-200 divide-y divide-gray-100">
            <div v-for="row in varianceSummary" :key="row.label" class="flex justify-between px-4 py-3 text-sm">
              <span class="text-gray-600">{{ row.label }}</span>
              <span :class="row.highlight" class="font-semibold">{{ row.value }}</span>
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Closing Notes (optional)</label>
            <input v-model="closeForm.notes" type="text" placeholder="e.g. Short ₱50 — will check CCTV"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button @click="showClose = false" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="confirmClose" :disabled="closeLoading" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
            <span v-if="closeLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <LogOut v-else class="w-4 h-4" />
            {{ closeLoading ? 'Closing...' : 'Close Shift' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── HISTORY VIEW MODAL ── -->
    <div v-if="historyView" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-800">{{ historyView.id }} — Shift Summary</h3>
            <p class="text-xs text-gray-500 mt-0.5">{{ historyView.cashierName }} · {{ formatDateTime(historyView.openedAt) }} → {{ formatDateTime(historyView.closedAt) }}</p>
          </div>
          <button @click="historyView = null" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X class="w-5 h-5" /></button>
        </div>
        <div class="overflow-y-auto flex-1 p-6 space-y-4">
          <!-- Summary table -->
          <div class="rounded-xl border border-gray-200 divide-y divide-gray-100">
            <div v-for="row in historyViewRows" :key="row.label" class="flex justify-between px-4 py-3 text-sm">
              <span class="text-gray-600">{{ row.label }}</span>
              <span :class="row.cls" class="font-semibold">{{ row.value }}</span>
            </div>
          </div>
          <!-- Movements -->
          <div v-if="historyView.movements?.length">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Movements</p>
            <div class="space-y-2">
              <div v-for="m in historyView.movements" :key="m.id" class="flex justify-between items-center text-sm">
                <div>
                  <span :class="m.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'" class="text-xs px-2 py-0.5 rounded-full font-medium mr-2">{{ m.type === 'in' ? 'Cash In' : 'Cash Out' }}</span>
                  <span class="text-gray-700">{{ m.reason }}</span>
                </div>
                <span :class="m.type === 'in' ? 'text-green-600' : 'text-red-500'" class="font-semibold">
                  {{ m.type === 'in' ? '+' : '-' }}₱{{ m.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="historyView.notes" class="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-sm text-yellow-800">
            <p class="font-semibold mb-0.5">Notes:</p>{{ historyView.notes }}
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200">
          <button @click="historyView = null" class="w-full py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show"
      class="fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
      :class="toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'">
      {{ toast.message }}
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useShiftStore }       from '@/stores/shifts'
import { useTransactionStore } from '@/stores/transactions'
import { useAuthStore }        from '@/stores/auth'
import { PHPDenominations }    from '@/mock/shifts'
import { Clock, Eye, ArrowDownToLine, ArrowUpFromLine, LogOut, X, ShoppingCart, Plus, Minus, ChevronLeft, ChevronRight } from '@lucide/vue'

const shiftStore = useShiftStore()
const txnStore   = useTransactionStore()
const authStore  = useAuthStore()

// ── Elapsed time ──
const elapsed = ref('')
let timer = null
function updateElapsed() {
  if (!shiftStore.activeShift?.openedAt) { elapsed.value = ''; return }
  const ms = Date.now() - new Date(shiftStore.activeShift.openedAt).getTime()
  const h  = Math.floor(ms / 3600000)
  const m  = Math.floor((ms % 3600000) / 60000)
  elapsed.value = `${h}h ${m}m`
}
onMounted(() => { updateElapsed(); timer = setInterval(updateElapsed, 30000) })
onUnmounted(() => clearInterval(timer))

// ── Helpers ──
function formatTime(d)     { return d ? new Date(d).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '—' }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—' }

// ── Drawer log: merge shift movements + cash transactions since open ──
const drawerLog = computed(() => {
  if (!shiftStore.activeShift) return []
  const openedAt = new Date(shiftStore.activeShift.openedAt)

  // Cash transactions since shift opened
  const cashTxns = txnStore.completedTransactions
    .filter(t => new Date(t.date) >= openedAt)
    .flatMap(t => [
      ...t.payments
        .filter(p => p.method === 'Cash')
        .map(p => ({
          id: `txn-in-${t.id}`,
          type: 'sale',
          amount: p.amount,
          reason: `Sale ${t.id} — cash received`,
          recordedBy: t.cashier,
          at: t.date,
        })),
      ...(t.change > 0 ? [{
        id: `txn-chg-${t.id}`,
        type: 'change',
        amount: t.change,
        reason: `Change for ${t.id}`,
        recordedBy: t.cashier,
        at: t.date,
      }] : []),
    ])

  const movements = shiftStore.activeShift.movements.map(m => ({ ...m }))
  return [...cashTxns, ...movements].sort((a, b) => new Date(b.at) - new Date(a.at))
})

// Opening balance entry (first line)
const cashSales = computed(() => {
  if (!shiftStore.activeShift) return 0
  const openedAt = new Date(shiftStore.activeShift.openedAt)
  return txnStore.completedTransactions
    .filter(t => new Date(t.date) >= openedAt)
    .reduce((s, t) => s + t.payments.filter(p => p.method === 'Cash').reduce((a, p) => a + p.amount, 0), 0)
})

const changeGiven = computed(() => {
  if (!shiftStore.activeShift) return 0
  const openedAt = new Date(shiftStore.activeShift.openedAt)
  return txnStore.completedTransactions
    .filter(t => new Date(t.date) >= openedAt && t.payments.some(p => p.method === 'Cash'))
    .reduce((s, t) => s + (t.change || 0), 0)
})

const cashSalesCount = computed(() => {
  if (!shiftStore.activeShift) return 0
  const openedAt = new Date(shiftStore.activeShift.openedAt)
  return txnStore.completedTransactions.filter(t => new Date(t.date) >= openedAt && t.payments.some(p => p.method === 'Cash')).length
})

const expectedCash = computed(() => {
  if (!shiftStore.activeShift) return 0
  return parseFloat((
    shiftStore.activeShift.openingCash
    + cashSales.value
    - changeGiven.value
    + shiftStore.cashInTotal - shiftStore.cashOutTotal
  ).toFixed(2))
})

// ── Drawer log icons ──
function logIcon(type) {
  if (type === 'sale')   return ShoppingCart
  if (type === 'in')     return ArrowDownToLine
  if (type === 'out')    return ArrowUpFromLine
  if (type === 'change') return Minus
  return Plus
}
function logDotClass(type) {
  if (type === 'sale')   return 'bg-blue-100 text-blue-600'
  if (type === 'in')     return 'bg-green-100 text-green-600'
  if (type === 'out')    return 'bg-red-100 text-red-500'
  if (type === 'change') return 'bg-orange-100 text-orange-500'
  return 'bg-gray-100 text-gray-400'
}
function logLabel(entry) {
  if (entry.type === 'sale')   return entry.reason
  if (entry.type === 'change') return entry.reason
  if (entry.type === 'in')     return `Cash In — ${entry.reason}`
  if (entry.type === 'out')    return `Cash Out — ${entry.reason}`
  return entry.reason
}

// ── Open shift ──
const openingCash     = ref(null)
const openShiftError  = ref('')
const openShiftLoading = ref(false)

async function handleOpenShift() {
  openShiftError.value = ''
  if (openingCash.value === null || openingCash.value === '' || isNaN(openingCash.value)) {
    openShiftError.value = 'Enter the opening cash amount (0 or more).'
    return
  }
  if (openingCash.value < 0) {
    openShiftError.value = 'Opening cash cannot be negative.'
    return
  }
  openShiftLoading.value = true
  try {
    await shiftStore.openShift({
      cashier: `${authStore.user?.firstName} ${authStore.user?.lastName}`,
      openingCash: openingCash.value,
    })
    showToast('Shift opened successfully', 'success')
  } catch (err) {
    openShiftError.value = err?.response?.data?.message ?? 'Failed to open shift. Please try again.'
  } finally {
    openShiftLoading.value = false
  }
}

// ── Cash In / Out ──
const showCashIn  = ref(false)
const showCashOut = ref(false)
const movForm     = reactive({ amount: null, reason: '' })
const movError    = ref('')

const cashInSuggestions  = ['Add change money', 'Bank withdrawal', 'Owner deposit']
const cashOutSuggestions = ['Buy tape', 'Buy supplies', 'Delivery fee', 'Miscellaneous expense']

const movLoading = ref(false)

async function confirmCashIn() {
  movError.value = ''
  if (!movForm.amount || movForm.amount <= 0) { movError.value = 'Enter a valid amount.'; return }
  if (!movForm.reason.trim()) { movError.value = 'Reason is required.'; return }
  movLoading.value = true
  try {
    await shiftStore.addMovement({ type: 'in', amount: movForm.amount, reason: movForm.reason,
      recordedBy: `${authStore.user?.firstName} ${authStore.user?.lastName}` })
    showToast(`Cash In: ₱${movForm.amount.toFixed(2)} — ${movForm.reason}`, 'success')
    Object.assign(movForm, { amount: null, reason: '' })
    showCashIn.value = false
  } catch (err) {
    movError.value = err?.response?.data?.message ?? 'Failed to record cash in.'
  } finally {
    movLoading.value = false
  }
}

async function confirmCashOut() {
  movError.value = ''
  if (!movForm.amount || movForm.amount <= 0) { movError.value = 'Enter a valid amount.'; return }
  if (!movForm.reason.trim()) { movError.value = 'Reason is required.'; return }
  movLoading.value = true
  try {
    await shiftStore.addMovement({ type: 'out', amount: movForm.amount, reason: movForm.reason,
      recordedBy: `${authStore.user?.firstName} ${authStore.user?.lastName}` })
    showToast(`Cash Out: ₱${movForm.amount.toFixed(2)} — ${movForm.reason}`, 'success')
    Object.assign(movForm, { amount: null, reason: '' })
    showCashOut.value = false
  } catch (err) {
    movError.value = err?.response?.data?.message ?? 'Failed to record cash out.'
  } finally {
    movLoading.value = false
  }
}

// ── Close shift ──
const showClose   = ref(false)
const closeForm   = reactive({ countedCash: null, notes: '' })
const denominations = ref(PHPDenominations.map(d => ({ ...d, count: 0 })))

const denominationTotal = computed(() => parseFloat(denominations.value.reduce((s, d) => s + (d.count || 0) * d.value, 0).toFixed(2)))
const effectiveCounted  = computed(() => closeForm.countedCash !== null && closeForm.countedCash !== '' ? parseFloat(closeForm.countedCash) : denominationTotal.value)
const closeVariance     = computed(() => parseFloat((effectiveCounted.value - expectedCash.value).toFixed(2)))

const varianceSummary = computed(() => {
  if (!shiftStore.activeShift) return []
  const n = v => parseFloat(v) || 0
  const opening  = n(shiftStore.activeShift.openingCash)
  const sales    = n(cashSales.value)
  const change   = n(changeGiven.value)
  const cashIn   = n(shiftStore.cashInTotal)
  const cashOut  = n(shiftStore.cashOutTotal)
  const expected = n(expectedCash.value)
  const counted  = n(effectiveCounted.value)
  const variance = n(closeVariance.value)
  return [
    { label: 'Opening Cash',          value: `₱${opening.toFixed(2)}`,                                    highlight: '' },
    { label: 'Cash Received (Sales)', value: `+₱${sales.toFixed(2)}`,                                     highlight: 'text-green-600' },
    { label: 'Change Given',          value: `-₱${change.toFixed(2)}`,                                    highlight: 'text-red-500' },
    { label: 'Cash In',               value: `+₱${cashIn.toFixed(2)}`,                                    highlight: 'text-green-600' },
    { label: 'Cash Out',              value: `-₱${cashOut.toFixed(2)}`,                                   highlight: 'text-red-500' },
    { label: 'Expected Cash',         value: `₱${expected.toFixed(2)}`,                                   highlight: 'text-blue-600 font-bold' },
    { label: 'Counted Cash',          value: `₱${counted.toFixed(2)}`,                                    highlight: 'text-gray-800 font-bold' },
    { label: 'Variance',              value: `${variance >= 0 ? '+' : ''}₱${variance.toFixed(2)}`,        highlight: variance === 0 ? 'text-green-600' : variance > 0 ? 'text-blue-600' : 'text-red-600' },
  ]
})

const closeLoading = ref(false)

async function confirmClose() {
  closeLoading.value = true
  try {
    await shiftStore.closeShift({
      countedCash:  effectiveCounted.value,
      closedBy:     `${authStore.user?.firstName} ${authStore.user?.lastName}`,
      notes:        closeForm.notes,
      expectedCash: expectedCash.value,
      cashSales:    cashSales.value,
      changeGiven:  changeGiven.value,
    })
    showToast('Shift closed successfully', 'success')
    showClose.value = false
    denominations.value.forEach(d => { d.count = 0 })
    Object.assign(closeForm, { countedCash: null, notes: '' })
  } catch (err) {
    showToast(err?.response?.data?.message ?? 'Failed to close shift. Please try again.', 'error')
  } finally {
    closeLoading.value = false
  }
}

// ── History View ──
const historyView = ref(null)
function openHistoryView(s) { historyView.value = s }
const historyViewRows = computed(() => {
  if (!historyView.value) return []
  const s = historyView.value
  const n = x => parseFloat(x) || 0
  const v = n(s.variance)
  return [
    { label: 'Opening Cash',   value: `₱${n(s.openingCash).toFixed(2)}`,   cls: '' },
    { label: 'Cash Sales',     value: `+₱${n(s.cashSales).toFixed(2)}`,    cls: 'text-green-600' },
    { label: 'Change Given',   value: `-₱${n(s.changeGiven).toFixed(2)}`,  cls: 'text-red-500' },
    { label: 'Cash In',        value: `+₱${n(s.cashInTotal).toFixed(2)}`,  cls: 'text-green-600' },
    { label: 'Cash Out',       value: `-₱${n(s.cashOutTotal).toFixed(2)}`, cls: 'text-red-500' },
    { label: 'Expected Cash',  value: `₱${n(s.expectedCash).toFixed(2)}`,  cls: 'text-blue-600 font-bold' },
    { label: 'Counted Cash',   value: `₱${n(s.countedCash).toFixed(2)}`,   cls: 'text-gray-800 font-bold' },
    { label: 'Variance',       value: `${v >= 0 ? '+' : ''}₱${v.toFixed(2)}`, cls: v === 0 ? 'text-green-600' : v > 0 ? 'text-blue-600' : 'text-red-600' },
  ]
})

// ── Toast ──
const toast = reactive({ show: false, type: 'success', message: '' })
function showToast(message, type = 'success') {
  Object.assign(toast, { show: true, type, message })
  setTimeout(() => { toast.show = false }, 3000)
}
</script>
