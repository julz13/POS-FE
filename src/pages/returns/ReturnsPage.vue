<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Returns & Refunds</h2>
        <p class="text-sm text-gray-500">Manage product returns with approval workflow</p>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors">
        <Plus class="w-4 h-4" /> New Return
      </button>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500">Total Refunded</p>
        <p class="text-xl font-bold text-orange-600 mt-1">₱{{ returnStore.totalRefunded.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
      </div>
      <div v-for="s in statusCards" :key="s.status" class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div :class="`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`">
          <component :is="s.icon" :class="`w-4 h-4 ${s.color}`" />
        </div>
        <div>
          <p class="text-xl font-bold text-gray-800">{{ returnStore.statusCounts[s.status] }}</p>
          <p class="text-xs text-gray-500 capitalize">{{ s.status }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
      <input v-model="filters.search" type="text" placeholder="Return #, Transaction #, customer..."
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-orange-400" />
      <select v-model="filters.status" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="completed">Completed</option>
        <option value="rejected">Rejected</option>
      </select>
      <select v-model="filters.type" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
        <option value="">All Types</option>
        <option value="refund">Refund</option>
        <option value="exchange">Exchange</option>
      </select>
      <input v-model="filters.from" type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      <input v-model="filters.to"   type="date" class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
      <button @click="resetFilters" class="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-2 rounded-lg">Reset</button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Return #</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Items</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Refund</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="!filteredReturns.length">
            <td colspan="9" class="px-4 py-10 text-center text-gray-400">No returns found</td>
          </tr>
          <tr v-for="r in filteredReturns" :key="r.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-mono text-xs font-medium text-orange-600">{{ r.id }}</td>
            <td class="px-4 py-3 font-mono text-xs text-blue-600">{{ r.transactionId }}</td>
            <td class="px-4 py-3 text-gray-600 text-xs">{{ formatDate(r.date) }}</td>
            <td class="px-4 py-3 text-gray-700">{{ r.customer || '—' }}</td>
            <td class="px-4 py-3">
              <span :class="r.returnType === 'refund' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'"
                class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">{{ r.returnType }}</span>
            </td>
            <td class="px-4 py-3 text-gray-600 text-xs">
              {{ r.items.map(i => `${i.returnQty}×${i.name.split(' ')[0]}`).join(', ') }}
            </td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900">
              ₱{{ r.refundAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </td>
            <td class="px-4 py-3">
              <span :class="statusStyle(r.status)" class="px-2 py-1 rounded-full text-xs font-semibold capitalize">{{ r.status }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button @click="openView(r)" class="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="View">
                  <Eye class="w-4 h-4" />
                </button>
                <button v-if="r.status === 'pending' && canApprove"
                  @click="openApprove(r)" class="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Approve">
                  <CheckCircle class="w-4 h-4" />
                </button>
                <button v-if="r.status === 'approved'"
                  @click="openComplete(r)" class="px-2.5 py-1 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors" title="Complete Return">
                  Complete
                </button>
                <button v-if="(r.status === 'pending' || r.status === 'approved') && canApprove"
                  @click="openReject(r)" class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Reject">
                  <XCircle class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="returnStore.pagination.lastPage > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">Showing {{ returnStore.pagination.from }}–{{ returnStore.pagination.to }} of {{ returnStore.pagination.total }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="returnStore.pagination.currentPage <= 1" @click="returnStore.fetchPage(returnStore.pagination.currentPage - 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
          <span class="text-xs text-gray-600 px-2">{{ returnStore.pagination.currentPage }} / {{ returnStore.pagination.lastPage }}</span>
          <button :disabled="returnStore.pagination.currentPage >= returnStore.pagination.lastPage" @click="returnStore.fetchPage(returnStore.pagination.currentPage + 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- ── NEW RETURN MODAL (multi-step) ── -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">New Return</h3>
            <div class="flex items-center gap-1 mt-1">
              <span v-for="(step, i) in createSteps" :key="i"
                :class="createStep > i ? 'bg-orange-500 text-white' : createStep === i ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-400' : 'bg-gray-100 text-gray-400'"
                class="text-xs px-2.5 py-0.5 rounded-full font-medium">{{ step }}</span>
            </div>
          </div>
          <button @click="closeCreate" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Step 0: Lookup Receipt -->
        <div v-if="createStep === 0" class="p-6 space-y-4">
          <p class="text-sm text-gray-600">Enter the original receipt number to start the return process.</p>
          <div class="flex gap-3">
            <input v-model="createForm.receiptRef" type="text" placeholder="e.g. TXN-0001"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              @keydown.enter="lookupForCreate" />
            <button @click="lookupForCreate" class="px-5 py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">Search</button>
          </div>
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
        </div>

        <!-- Step 1: Select Items + Return Qty -->
        <div v-else-if="createStep === 1" class="flex-1 overflow-y-auto p-6 space-y-4">
          <div class="bg-gray-50 rounded-lg p-3 text-sm">
            <p class="font-medium text-gray-700">Receipt: <span class="font-mono text-blue-600">{{ createForm.receiptRef }}</span></p>
            <p class="text-gray-500 mt-0.5">{{ formatDateTime(createForm.foundTxn?.date) }} · {{ createForm.foundTxn?.cashier }}
              <span v-if="createForm.foundTxn?.customer"> · {{ createForm.foundTxn.customer }}</span>
            </p>
          </div>

          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Select items to return</p>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="w-8 px-3 py-2"></th>
                    <th class="text-left px-3 py-2 text-xs text-gray-500 font-semibold">Product</th>
                    <th class="text-center px-3 py-2 text-xs text-gray-500 font-semibold">Bought</th>
                    <th class="text-center px-3 py-2 text-xs text-gray-500 font-semibold">Return Qty</th>
                    <th class="text-right px-3 py-2 text-xs text-gray-500 font-semibold">Refund</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="(item, i) in createForm.items" :key="i">
                    <td class="px-3 py-2.5 text-center">
                      <input type="checkbox" v-model="item.selected" class="rounded" />
                    </td>
                    <td class="px-3 py-2.5">
                      <p class="font-medium text-gray-800">{{ item.name }}</p>
                      <p class="text-xs text-gray-400">₱{{ item.sellingPrice }} / {{ item.unit }}</p>
                    </td>
                    <td class="px-3 py-2.5 text-center text-gray-600">{{ item.qty }}</td>
                    <td class="px-3 py-2.5 text-center">
                      <input v-model.number="item.returnQty" type="number" :min="1" :max="item.qty"
                        :disabled="!item.selected"
                        class="w-16 border border-gray-200 rounded px-2 py-1 text-xs text-center focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-40" />
                    </td>
                    <td class="px-3 py-2.5 text-right font-semibold text-gray-800">
                      ₱{{ item.selected ? calcItemRefund(item).toFixed(2) : '0.00' }}
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colspan="4" class="px-3 py-2 text-xs font-semibold text-gray-600 text-right">Total Refund:</td>
                    <td class="px-3 py-2 text-right font-bold text-orange-600">
                      ₱{{ createFormRefund.toFixed(2) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
        </div>

        <!-- Step 2: Type + Reason -->
        <div v-else-if="createStep === 2" class="p-6 space-y-5">
          <div class="bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm">
            <p class="font-medium text-gray-700">Returning {{ createForm.items.filter(i => i.selected).length }} item(s) — Refund: <span class="text-orange-600 font-bold">₱{{ createFormRefund.toFixed(2) }}</span></p>
            <p class="text-xs text-gray-500 mt-0.5">{{ createForm.items.filter(i => i.selected).map(i => `${i.returnQty} × ${i.name}`).join(', ') }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Return Type <span class="text-red-500">*</span></label>
              <select v-model="createForm.returnType" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="refund">Refund — return money</option>
                <option value="exchange">Exchange — replace item</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Reason <span class="text-red-500">*</span></label>
              <select v-model="createForm.reason" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="">Select reason...</option>
                <option>Defective / Damaged</option>
                <option>Wrong item delivered</option>
                <option>Customer changed mind</option>
                <option>Expired product</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div class="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            <p class="font-semibold mb-1">What happens after submission:</p>
            <ol class="space-y-0.5 list-decimal list-inside">
              <li>Return is saved as <strong>Pending</strong></li>
              <li>Manager reviews and <strong>Approves</strong> or Rejects</li>
              <li>Cashier marks as <strong>Completed</strong> — stock restored + refund issued</li>
            </ol>
          </div>
          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex justify-between gap-3">
          <button v-if="createStep > 0" @click="createStep--"
            class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
            ← Back
          </button>
          <div class="flex gap-3 ml-auto">
            <button @click="closeCreate" class="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button v-if="createStep < 2" @click="nextCreateStep"
              class="px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
              Next →
            </button>
            <button v-else @click="submitReturn"
              class="px-5 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600">
              Submit Return
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── VIEW DETAIL MODAL ── -->
    <div v-if="viewReturn" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">{{ viewReturn.id }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span :class="viewReturn.returnType === 'refund' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'"
                class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">{{ viewReturn.returnType }}</span>
              <span :class="statusStyle(viewReturn.status)" class="px-2 py-0.5 rounded-full text-xs font-semibold capitalize">{{ viewReturn.status }}</span>
            </div>
          </div>
          <button @click="viewReturn = null" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="overflow-y-auto flex-1 p-6 space-y-5">
          <!-- Details -->
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><p class="text-xs text-gray-400">Transaction</p><p class="font-mono font-semibold text-blue-600">{{ viewReturn.transactionId }}</p></div>
            <div><p class="text-xs text-gray-400">Date Created</p><p class="text-gray-700">{{ formatDateTime(viewReturn.date) }}</p></div>
            <div><p class="text-xs text-gray-400">Customer</p><p class="text-gray-700">{{ viewReturn.customer || '—' }}</p></div>
            <div><p class="text-xs text-gray-400">Created By</p><p class="text-gray-700">{{ viewReturn.createdBy }}</p></div>
            <div><p class="text-xs text-gray-400">Reason</p><p class="text-gray-700">{{ viewReturn.reason }}</p></div>
            <div><p class="text-xs text-gray-400">Stock Restored</p>
              <p :class="viewReturn.stockRestored ? 'text-green-600' : 'text-gray-400'" class="font-medium">
                {{ viewReturn.stockRestored ? 'Yes' : 'No' }}
              </p>
            </div>
          </div>

          <!-- Rejected reason -->
          <div v-if="viewReturn.status === 'rejected' && viewReturn.rejectReason"
            class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <p class="font-semibold mb-0.5">Reject Reason:</p>
            <p>{{ viewReturn.rejectReason }}</p>
          </div>

          <!-- Items table -->
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Return Items</p>
            <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead class="bg-gray-50">
                <tr>
                  <th class="text-left px-3 py-2 text-xs text-gray-500 font-semibold">Product</th>
                  <th class="text-center px-3 py-2 text-xs text-gray-500 font-semibold">Bought</th>
                  <th class="text-center px-3 py-2 text-xs text-gray-500 font-semibold">Returned</th>
                  <th class="text-right px-3 py-2 text-xs text-gray-500 font-semibold">Refund</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="item in viewReturn.items" :key="item.id">
                  <td class="px-3 py-2.5 text-gray-800 font-medium">{{ item.name }}</td>
                  <td class="px-3 py-2.5 text-center text-gray-600">{{ item.qty }} {{ item.unit }}</td>
                  <td class="px-3 py-2.5 text-center text-orange-600 font-semibold">{{ item.returnQty }}</td>
                  <td class="px-3 py-2.5 text-right font-semibold text-gray-800">₱{{ calcItemRefund(item).toFixed(2) }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td colspan="3" class="px-3 py-2 text-xs font-semibold text-gray-600 text-right">Total Refund:</td>
                  <td class="px-3 py-2 text-right font-bold text-orange-600">₱{{ viewReturn.refundAmount.toFixed(2) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Audit Log -->
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Audit Log</p>
            <div class="relative">
              <div class="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div class="space-y-3">
                <div v-for="(log, i) in viewReturn.auditLog" :key="i" class="flex items-start gap-3 relative">
                  <div :class="auditDotClass(log.action)" class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10">
                    <CheckCircle v-if="log.action === 'completed'" class="w-3.5 h-3.5" />
                    <ShieldCheck v-else-if="log.action === 'approved'" class="w-3.5 h-3.5" />
                    <XCircle v-else-if="log.action === 'rejected'" class="w-3.5 h-3.5" />
                    <Clock v-else class="w-3.5 h-3.5" />
                  </div>
                  <div class="flex-1 pb-1">
                    <p class="text-sm font-medium text-gray-800 capitalize">{{ log.action }}</p>
                    <p class="text-xs text-gray-500">{{ log.note }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ formatDateTime(log.at) }} · {{ log.by }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button @click="viewReturn = null" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Close
          </button>
          <button v-if="viewReturn.status === 'pending' && canApprove"
            @click="openApprove(viewReturn); viewReturn = null"
            class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
            <CheckCircle class="w-4 h-4" /> Approve
          </button>
          <button v-if="viewReturn.status === 'approved'"
            @click="openComplete(viewReturn); viewReturn = null"
            class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600">
            <PackageCheck class="w-4 h-4" /> Complete
          </button>
        </div>
      </div>
    </div>

    <!-- ── APPROVE MODAL ── -->
    <div v-if="approveTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">Approve Return</h3>
            <p class="text-sm text-gray-500">{{ approveTarget.id }} — ₱{{ approveTarget.refundAmount.toFixed(2) }}</p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
          <input v-model="approveNote" type="text" placeholder="e.g. Item confirmed defective"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
        </div>
        <p v-if="actionError" class="text-sm text-red-600">{{ actionError }}</p>
        <div class="flex gap-3 pt-1">
          <button @click="approveTarget = null" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="confirmApprove" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
            <CheckCircle class="w-4 h-4" /> Approve
          </button>
        </div>
      </div>
    </div>

    <!-- ── COMPLETE MODAL ── -->
    <div v-if="completeTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <PackageCheck class="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">Complete Return</h3>
            <p class="text-sm text-gray-500">{{ completeTarget.id }}</p>
          </div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3 text-xs space-y-1 text-gray-700">
          <p class="font-semibold text-gray-800">This will:</p>
          <p v-for="item in completeTarget.items" :key="item.id">
            ↩ Add <strong>{{ item.returnQty }} {{ item.unit }}</strong> of {{ item.name }} back to stock
          </p>
          <p class="text-orange-600 font-semibold pt-1 border-t border-gray-200">
            Issue refund of ₱{{ completeTarget.refundAmount.toFixed(2) }}
          </p>
        </div>
        <p v-if="actionError" class="text-sm text-red-600">{{ actionError }}</p>
        <div class="flex gap-3 pt-1">
          <button @click="completeTarget = null" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="confirmComplete" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600">
            <PackageCheck class="w-4 h-4" /> Confirm Complete
          </button>
        </div>
      </div>
    </div>

    <!-- ── REJECT MODAL ── -->
    <div v-if="rejectTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle class="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">Reject Return</h3>
            <p class="text-sm text-gray-500">{{ rejectTarget.id }}</p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Reason <span class="text-red-500">*</span></label>
          <input v-model="rejectReason" type="text" placeholder="Why is this return rejected?"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <p v-if="actionError" class="text-sm text-red-600">{{ actionError }}</p>
        <div class="flex gap-3 pt-1">
          <button @click="rejectTarget = null" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="confirmReject" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
            <XCircle class="w-4 h-4" /> Reject
          </button>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show"
      class="fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
      :class="toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-orange-500'">
      {{ toast.message }}
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useReturnStore }      from '@/stores/returns'
import { useTransactionStore } from '@/stores/transactions'
import { useAuthStore }        from '@/stores/auth'
import { Plus, Eye, CheckCircle, XCircle, X, Clock, ShieldCheck, PackageCheck, ChevronLeft, ChevronRight } from '@lucide/vue'

const returnStore = useReturnStore()
const txnStore    = useTransactionStore()
const authStore   = useAuthStore()

// ── Permissions ──
const canApprove = computed(() => ['owner', 'manager'].includes(authStore.role))

// ── Status helpers ──
function statusStyle(s) {
  return { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-600' }[s] || 'bg-gray-100 text-gray-600'
}
function auditDotClass(action) {
  return {
    created:   'bg-gray-100 text-gray-400',
    approved:  'bg-green-100 text-green-600',
    completed: 'bg-orange-100 text-orange-600',
    rejected:  'bg-red-100 text-red-500',
  }[action] || 'bg-gray-100 text-gray-400'
}

// ── Summary card config ──
const statusCards = [
  { status: 'pending',   icon: Clock,        bg: 'bg-yellow-100', color: 'text-yellow-600' },
  { status: 'approved',  icon: ShieldCheck,  bg: 'bg-blue-100',   color: 'text-blue-600'   },
  { status: 'completed', icon: CheckCircle,  bg: 'bg-green-100',  color: 'text-green-600'  },
  { status: 'rejected',  icon: XCircle,      bg: 'bg-red-100',    color: 'text-red-500'    },
]

// ── Filters ──
const filters = reactive({ search: '', status: '', type: '', from: '', to: '' })
const filteredReturns = computed(() => {
  let list = [...returnStore.returns]
  const q = filters.search.toLowerCase()
  if (q) list = list.filter(r => r.id.toLowerCase().includes(q) || r.transactionId.toLowerCase().includes(q) || (r.customer || '').toLowerCase().includes(q))
  if (filters.status) list = list.filter(r => r.status === filters.status)
  if (filters.type)   list = list.filter(r => r.returnType === filters.type)
  if (filters.from)   list = list.filter(r => r.date.slice(0, 10) >= filters.from)
  if (filters.to)     list = list.filter(r => r.date.slice(0, 10) <= filters.to)
  return list
})
function resetFilters() { Object.assign(filters, { search: '', status: '', type: '', from: '', to: '' }) }

// ── Helpers ──
function formatDate(d)     { return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) }
function formatDateTime(d) { return d ? new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—' }
function calcItemRefund(item) {
  const qty  = item.returnQty ?? item.qty
  const base = item.sellingPrice * qty
  return base - (base * (item.lineDiscount || 0)) / 100
}

// ── View ──
const viewReturn = ref(null)
function openView(r) { viewReturn.value = r }

// ── Create (multi-step) ──
const showCreate  = ref(false)
const createStep  = ref(0)
const createError = ref('')
const createSteps = ['Lookup Receipt', 'Select Items', 'Details']
const createForm  = reactive({
  receiptRef: '', foundTxn: null,
  items: [], returnType: 'refund', reason: '',
})
const createFormRefund = computed(() =>
  createForm.items.filter(i => i.selected).reduce((s, i) => s + calcItemRefund(i), 0)
)

function openCreate() {
  Object.assign(createForm, { receiptRef: '', foundTxn: null, items: [], returnType: 'refund', reason: '' })
  createStep.value  = 0
  createError.value = ''
  showCreate.value  = true
}
function closeCreate() { showCreate.value = false }

function lookupForCreate() {
  createError.value = ''
  const txn = txnStore.getById(createForm.receiptRef.trim().toUpperCase())
  if (!txn)                         { createError.value = 'Receipt not found.'; return }
  if (txn.status === 'voided')      { createError.value = 'This transaction has been voided — returns not allowed.'; return }
  createForm.foundTxn = txn
  createForm.items    = txn.items.map(i => ({ ...i, returnQty: 1, selected: false }))
  createStep.value    = 1
}

function nextCreateStep() {
  createError.value = ''
  if (createStep.value === 0) { lookupForCreate(); return }
  if (createStep.value === 1) {
    if (!createForm.items.some(i => i.selected)) { createError.value = 'Select at least one item to return.'; return }
    const bad = createForm.items.find(i => i.selected && (i.returnQty < 1 || i.returnQty > i.qty))
    if (bad) { createError.value = `Return quantity for "${bad.name}" must be between 1 and ${bad.qty}.`; return }
    createStep.value = 2
  }
}

function submitReturn() {
  createError.value = ''
  if (!createForm.reason) { createError.value = 'Please select a reason.'; return }
  const id = returnStore.createReturn({
    transactionId: createForm.foundTxn.id,
    customer:      createForm.foundTxn.customer,
    returnType:    createForm.returnType,
    reason:        createForm.reason,
    items:         createForm.items.filter(i => i.selected),
    createdBy:     `${authStore.user?.firstName} ${authStore.user?.lastName}`,
  })
  showToast(`Return ${id} submitted — pending manager approval`, 'success')
  closeCreate()
}

// ── Approve ──
const approveTarget = ref(null)
const approveNote   = ref('')
const actionError   = ref('')
function openApprove(r)  { approveTarget.value = r; approveNote.value = ''; actionError.value = '' }
function confirmApprove() {
  const ok = returnStore.approveReturn(approveTarget.value.id, {
    approvedBy: `${authStore.user?.firstName} ${authStore.user?.lastName}`,
    note: approveNote.value,
  })
  if (ok) { showToast(`Return ${approveTarget.value.id} approved`, 'success'); approveTarget.value = null }
  else    { actionError.value = 'Could not approve.' }
}

// ── Complete ──
const completeTarget = ref(null)
function openComplete(r) { completeTarget.value = r; actionError.value = '' }
function confirmComplete() {
  const ok = returnStore.completeReturn(completeTarget.value.id, {
    completedBy: `${authStore.user?.firstName} ${authStore.user?.lastName}`,
  })
  if (ok) { showToast(`Return ${completeTarget.value.id} completed — refund issued`, 'success'); completeTarget.value = null }
  else    { actionError.value = 'Could not complete.' }
}

// ── Reject ──
const rejectTarget = ref(null)
const rejectReason = ref('')
function openReject(r) { rejectTarget.value = r; rejectReason.value = ''; actionError.value = '' }
function confirmReject() {
  if (!rejectReason.value.trim()) { actionError.value = 'Reason is required.'; return }
  const ok = returnStore.rejectReturn(rejectTarget.value.id, {
    rejectedBy:   `${authStore.user?.firstName} ${authStore.user?.lastName}`,
    rejectReason: rejectReason.value,
  })
  if (ok) { showToast(`Return ${rejectTarget.value.id} rejected`, 'error'); rejectTarget.value = null }
  else    { actionError.value = 'Could not reject.' }
}

// ── Toast ──
const toast = reactive({ show: false, type: 'success', message: '' })
function showToast(message, type = 'success') {
  Object.assign(toast, { show: true, type, message })
  setTimeout(() => { toast.show = false }, 3500)
}
</script>
