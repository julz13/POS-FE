<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h2 class="text-lg font-semibold text-gray-800">Stock Take</h2>
        <p class="text-sm text-gray-500">Physical count → variance → post adjustment</p>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
        <Plus class="w-4 h-4" /> New Stock Take
      </button>
    </div>

    <!-- Status cards -->
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div class="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center"><ClipboardList class="w-4 h-4 text-blue-600" /></div>
        <div><p class="text-xl font-bold text-gray-800">{{ stStore.statusCounts.in_progress }}</p><p class="text-xs text-gray-500">In Progress</p></div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div class="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center"><Clock class="w-4 h-4 text-yellow-600" /></div>
        <div><p class="text-xl font-bold text-gray-800">{{ stStore.statusCounts.completed }}</p><p class="text-xs text-gray-500">Pending Post</p></div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
        <div class="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle class="w-4 h-4 text-green-600" /></div>
        <div><p class="text-xl font-bold text-gray-800">{{ stStore.statusCounts.posted }}</p><p class="text-xs text-gray-500">Posted</p></div>
      </div>
    </div>

    <!-- List -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Take #</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Variances</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Posted By</th>
            <th class="text-right px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="!stStore.takes.length">
            <td colspan="7" class="px-4 py-10 text-center text-gray-400">No stock takes yet</td>
          </tr>
          <tr v-for="t in stStore.takes" :key="t.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-mono text-xs font-semibold text-blue-600">{{ t.id }}</td>
            <td class="px-4 py-3 text-gray-600 text-xs">{{ t.date }}</td>
            <td class="px-4 py-3 text-gray-700">{{ t.items.length }} products</td>
            <td class="px-4 py-3 text-right">
              <span v-if="varianceCount(t) > 0" class="text-orange-600 font-semibold">{{ varianceCount(t) }} items</span>
              <span v-else class="text-gray-300">—</span>
            </td>
            <td class="px-4 py-3">
              <span :class="statusBadge(t.status)" class="px-2 py-1 rounded-full text-xs font-semibold capitalize">
                {{ t.status.replace('_', ' ') }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ t.postedBy || '—' }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button @click="openDetail(t.id)"
                  class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                  :class="t.status === 'in_progress' || t.status === 'completed'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'">
                  {{ t.status === 'in_progress' ? 'Count' : t.status === 'completed' ? 'Review & Post' : 'View' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="stStore.pagination.lastPage > 1" class="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <span class="text-xs text-gray-400">Showing {{ stStore.pagination.from }}–{{ stStore.pagination.to }} of {{ stStore.pagination.total }}</span>
        <div class="flex items-center gap-1">
          <button :disabled="stStore.pagination.currentPage <= 1" @click="stStore.fetchPage(stStore.pagination.currentPage - 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
          <span class="text-xs text-gray-600 px-2">{{ stStore.pagination.currentPage }} / {{ stStore.pagination.lastPage }}</span>
          <button :disabled="stStore.pagination.currentPage >= stStore.pagination.lastPage" @click="stStore.fetchPage(stStore.pagination.currentPage + 1)"
            class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
        </div>
      </div>
    </div>

    <!-- ── CREATE MODAL ── -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 class="text-base font-semibold text-gray-800">New Stock Take</h3>
        <p class="text-sm text-gray-500">A count sheet will be generated for all <strong>{{ activeProducts.length }}</strong> active products.</p>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Notes <span class="text-gray-400 font-normal">(optional)</span></label>
          <input v-model="createNotes" type="text" placeholder="e.g. Monthly count — June"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="flex gap-3 pt-1">
          <button @click="showCreate = false" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="submitCreate" class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            <ClipboardList class="w-4 h-4" /> Create Count Sheet
          </button>
        </div>
      </div>
    </div>

    <!-- ── DETAIL / COUNT MODAL ── -->
    <div v-if="activeDetail" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">{{ activeDetail.id }}</h3>
            <div class="flex items-center gap-2 mt-0.5">
              <span :class="statusBadge(activeDetail.status)" class="text-xs px-2 py-0.5 rounded-full font-semibold capitalize">
                {{ activeDetail.status.replace('_', ' ') }}
              </span>
              <span class="text-xs text-gray-400">{{ activeDetail.date }} · {{ activeDetail.createdBy }}</span>
            </div>
          </div>
          <button @click="activeDetail = null; pinError = ''" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>

        <!-- Count progress bar -->
        <div v-if="activeDetail.status === 'in_progress'" class="px-6 py-3 border-b border-gray-100 flex items-center gap-3">
          <div class="flex-1 bg-gray-200 rounded-full h-1.5">
            <div class="bg-blue-600 rounded-full h-1.5 transition-all" :style="{ width: countProgress + '%' }"></div>
          </div>
          <span class="text-xs text-gray-500 shrink-0">{{ countedItems }}/{{ activeDetail.items.length }} counted</span>
        </div>

        <!-- Items table -->
        <div class="overflow-y-auto flex-1">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">System Qty</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Counted Qty</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Variance</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in activeDetail.items" :key="item.productId"
                class="hover:bg-gray-50"
                :class="item.variance !== 0 && item.variance != null ? 'bg-orange-50/30' : ''">
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-800 text-xs">{{ item.productName }}</p>
                  <p class="text-gray-400 text-xs font-mono">{{ item.sku }}</p>
                </td>
                <td class="px-4 py-3 text-right font-mono font-semibold text-gray-800">{{ item.systemQty }}</td>
                <td class="px-4 py-3 text-right">
                  <input v-if="activeDetail.status === 'in_progress'"
                    :value="item.countedQty ?? ''"
                    @input="stStore.setCount(activeDetail.id, item.productId, $event.target.value)"
                    type="number" min="0"
                    class="w-20 border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :class="item.variance !== null && item.variance !== 0 ? 'border-orange-300 bg-orange-50' : ''"
                  />
                  <span v-else class="font-mono font-semibold" :class="item.countedQty !== item.systemQty ? 'text-orange-600' : 'text-gray-800'">
                    {{ item.countedQty ?? '—' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span v-if="item.variance != null" class="font-bold"
                    :class="item.variance > 0 ? 'text-green-600' : item.variance < 0 ? 'text-red-600' : 'text-gray-400'">
                    {{ item.variance > 0 ? '+' : '' }}{{ item.variance }}
                  </span>
                  <span v-else class="text-gray-300">—</span>
                </td>
                <td class="px-4 py-3">
                  <input v-if="activeDetail.status === 'in_progress'"
                    v-model="item.notes" type="text" placeholder="optional note"
                    class="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  <span v-else class="text-xs text-gray-400">{{ item.notes || '—' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Variance summary -->
        <div v-if="activeDetail.status !== 'in_progress'" class="px-6 py-3 border-t border-gray-100 flex gap-4 text-sm">
          <div class="flex items-center gap-1.5 text-red-600">
            <ArrowDown class="w-4 h-4" />
            <span class="font-semibold">{{ shortageCount }} shortage{{ shortageCount !== 1 ? 's' : '' }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-green-600">
            <ArrowUp class="w-4 h-4" />
            <span class="font-semibold">{{ overageCount }} overage{{ overageCount !== 1 ? 's' : '' }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-gray-500">
            <span class="font-semibold">{{ noChangeCount }} balanced</span>
          </div>
        </div>

        <!-- Footer actions -->
        <div class="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button @click="activeDetail = null; pinError = ''" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Close</button>

          <!-- Complete count button -->
          <button v-if="activeDetail.status === 'in_progress'"
            @click="handleComplete"
            :disabled="countedItems < activeDetail.items.length"
            class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40">
            <CheckCircle class="w-4 h-4" /> Finish Counting
          </button>

          <!-- Post adjustment (manager PIN required) -->
          <div v-if="activeDetail.status === 'completed'" class="flex-1 space-y-2">
            <div v-if="!showPostPin" class="flex gap-2">
              <button @click="showPostPin = true"
                class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
                <ArrowUp class="w-4 h-4" /> Post Adjustments
              </button>
            </div>
            <div v-else class="space-y-2">
              <p class="text-xs text-gray-600 font-medium flex items-center gap-1.5">
                <ShieldCheck class="w-3.5 h-3.5 text-orange-500" />
                Enter manager PIN to post {{ varianceCount(activeDetail) }} adjustment(s)
              </p>
              <div class="flex gap-2">
                <input v-model="postPin" type="password" maxlength="4" placeholder="••••"
                  class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-center text-lg font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                  @keydown.enter="handlePost" />
                <button @click="handlePost" class="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">Post</button>
                <button @click="showPostPin = false; postPin = ''; pinError = ''" class="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
              </div>
              <p v-if="pinError" class="text-xs text-red-600 font-medium">{{ pinError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="toast.show" class="fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium"
      :class="toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useStockTakeStore } from '@/stores/stocktake'
import { useProductStore }   from '@/stores/products'
import { useAuthStore }      from '@/stores/auth'
import { mockUsers }         from '@/mock/users'
import { Plus, ClipboardList, Clock, CheckCircle, X, ArrowDown, ArrowUp, ShieldCheck, ChevronLeft, ChevronRight } from '@lucide/vue'

const stStore   = useStockTakeStore()
const prodStore = useProductStore()
const authStore = useAuthStore()

const activeProducts = computed(() => prodStore.products.filter(p => p.status === 'active'))

// ── Helpers ──
function statusBadge(s) {
  return { in_progress: 'bg-blue-100 text-blue-700', completed: 'bg-yellow-100 text-yellow-700', posted: 'bg-green-100 text-green-700' }[s] || 'bg-gray-100 text-gray-600'
}
function varianceCount(t) { return t.items.filter(i => i.variance !== 0 && i.variance != null).length }

// ── Create ──
const showCreate  = ref(false)
const createNotes = ref('')
function openCreate() { createNotes.value = ''; showCreate.value = true }
function submitCreate() {
  const by = `${authStore.user?.firstName} ${authStore.user?.lastName}`
  const id = stStore.createTake({ notes: createNotes.value, createdBy: by, products: activeProducts.value })
  showCreate.value = false
  showToast(`Stock take ${id} created — ${activeProducts.value.length} products loaded`, 'success')
  openDetail(id)
}

// ── Detail ──
const activeDetail = ref(null)
function openDetail(id) { activeDetail.value = stStore.getById(id) }

const countedItems   = computed(() => activeDetail.value?.items.filter(i => i.countedQty != null).length || 0)
const countProgress  = computed(() => activeDetail.value?.items.length ? (countedItems.value / activeDetail.value.items.length) * 100 : 0)
const shortageCount  = computed(() => activeDetail.value?.items.filter(i => i.variance < 0).length || 0)
const overageCount   = computed(() => activeDetail.value?.items.filter(i => i.variance > 0).length || 0)
const noChangeCount  = computed(() => activeDetail.value?.items.filter(i => i.variance === 0).length || 0)

function handleComplete() {
  const ok = stStore.completeTake(activeDetail.value.id)
  if (!ok) { showToast('Count all items before completing', 'error'); return }
  showToast('Count completed — review variances and post', 'success')
}

// ── Post with manager PIN ──
const showPostPin = ref(false)
const postPin     = ref('')
const pinError    = ref('')

function handlePost() {
  pinError.value = ''
  const approver = mockUsers.find(u => u.pin === postPin.value && (u.role === 'manager' || u.role === 'owner'))
  if (!approver) { pinError.value = 'Incorrect PIN or not a manager/owner.'; return }
  const ok = stStore.postTake(activeDetail.value.id, `${approver.firstName} ${approver.lastName}`)
  if (ok) {
    showPostPin.value = false; postPin.value = ''
    showToast(`Stock take posted — ${varianceCount(activeDetail.value)} adjustment(s) applied`, 'success')
    activeDetail.value = stStore.getById(activeDetail.value.id) // refresh
  }
}

// ── Toast ──
const toast = reactive({ show: false, type: 'success', message: '' })
function showToast(message, type = 'success') {
  Object.assign(toast, { show: true, type, message })
  setTimeout(() => { toast.show = false }, 3500)
}
</script>
