<template>
  <div class="space-y-5">

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div class="flex gap-2 flex-1">
        <div class="relative flex-1 max-w-72">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="search"
            placeholder="Search company, contact, code..."
            class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="active">Active</option>
          <option value="">All</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0">
        <Plus class="w-4 h-4" /> Add Supplier
      </button>
    </div>

    <!-- Summary pills -->
    <div class="flex gap-3 text-xs flex-wrap">
      <span class="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600">Total: <strong>{{ store.suppliers.length }}</strong></span>
      <span class="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700">Active: <strong>{{ store.suppliers.filter(s => s.status === 'active').length }}</strong></span>
      <span class="px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-600">With Balance: <strong>{{ store.suppliers.filter(s => s.outstandingBalance > 0).length }}</strong></span>
      <span class="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-blue-700">
        Total Payable: <strong>₱{{ totalPayable.toLocaleString() }}</strong>
      </span>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Terms</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Orders</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Outstanding</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th class="px-4 py-3 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="s in filtered" :key="s.id"
            class="hover:bg-gray-50 transition-colors"
            :class="s.status === 'inactive' ? 'opacity-60' : ''"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                  {{ initials(s.companyName) }}
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ s.companyName }}</p>
                  <p class="text-xs text-gray-400">{{ s.contactPerson }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ s.code }}</td>
            <td class="px-4 py-3">
              <p class="text-gray-700 text-sm">{{ s.phone }}</p>
              <p v-if="s.email" class="text-xs text-gray-400">{{ s.email }}</p>
            </td>
            <td class="px-4 py-3">
              <span :class="termsBadge(s.paymentTerms)" class="px-2 py-1 rounded-full text-xs font-medium">
                {{ termsLabel(s.paymentTerms) }}
              </span>
            </td>
            <td class="px-4 py-3 text-right text-gray-700 font-medium">{{ s.totalOrders }}</td>
            <td class="px-4 py-3 text-right">
              <span :class="s.outstandingBalance > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'">
                {{ s.outstandingBalance > 0 ? '₱' + s.outstandingBalance.toLocaleString() : '—' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                class="px-2 py-1 rounded-full text-xs font-medium capitalize">{{ s.status }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button @click="openProfile(s)" class="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="View">
                  <Eye class="w-4 h-4" />
                </button>
                <button @click="openEdit(s)" class="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Edit">
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  v-if="s.status === 'active'"
                  @click="askArchive(s)"
                  class="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Archive"
                ><Archive class="w-4 h-4" /></button>
                <button
                  v-else
                  @click="handleRestore(s)"
                  class="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Restore"
                ><RotateCcw class="w-4 h-4" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="8" class="px-4 py-12 text-center text-gray-400 text-sm">No suppliers found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="store.pagination.lastPage > 1" class="flex items-center justify-between">
      <span class="text-xs text-gray-400">Showing {{ store.pagination.from }}–{{ store.pagination.to }} of {{ store.pagination.total }}</span>
      <div class="flex items-center gap-1">
        <button :disabled="store.pagination.currentPage <= 1" @click="store.fetchPage(store.pagination.currentPage - 1)"
          class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronLeft class="w-4 h-4" /></button>
        <span class="text-xs text-gray-600 px-2">{{ store.pagination.currentPage }} / {{ store.pagination.lastPage }}</span>
        <button :disabled="store.pagination.currentPage >= store.pagination.lastPage" @click="store.fetchPage(store.pagination.currentPage + 1)"
          class="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronRight class="w-4 h-4" /></button>
      </div>
    </div>

    <!-- ── Create / Edit Modal ── -->
    <BaseModal v-model="showForm" :title="editTarget ? 'Edit Supplier' : 'Add Supplier'" max-width="max-w-lg">
      <form @submit.prevent="save" class="space-y-4">
        <div v-if="formError" class="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{{ formError }}</div>

        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Company Name *</label>
            <input v-model="form.companyName" required class="inp" placeholder="e.g. Coca-Cola Bottlers Philippines" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Contact Person *</label>
            <input v-model="form.contactPerson" required class="inp" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
            <input v-model="form.phone" required class="inp" placeholder="02-XXXX-XXXX" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input v-model="form.email" type="email" class="inp" placeholder="optional" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Tax Number (TIN)</label>
            <input v-model="form.taxNumber" class="inp" placeholder="000-000-000-000" />
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input v-model="form.address" class="inp" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Payment Terms *</label>
            <select v-model="form.paymentTerms" required class="inp">
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="net7">Net 7 Days</option>
              <option value="net15">Net 15 Days</option>
              <option value="net30">Net 30 Days</option>
              <option value="net60">Net 60 Days</option>
              <option value="prepaid">Prepaid</option>
            </select>
          </div>
          <div v-if="editTarget">
            <label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select v-model="form.status" class="inp">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea v-model="form.notes" rows="2" class="inp resize-none" placeholder="Internal notes..." />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showForm = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600">Cancel</button>
          <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {{ editTarget ? 'Save Changes' : 'Add Supplier' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- ── Archive Confirm ── -->
    <ConfirmDialog
      v-model="showConfirm"
      title="Archive Supplier"
      :message="`Archive &quot;${confirmTarget?.companyName}&quot;? This action cannot be done if they have existing purchase orders.`"
      confirmLabel="Archive"
      @confirm="doArchive"
    />

    <!-- ── Profile Drawer ── -->
    <Teleport to="body">
      <div v-if="profileSupplier" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/40" @click="profileSupplier = null"></div>
        <div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">

          <!-- Header -->
          <div class="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shrink-0">
                {{ initials(profileSupplier.companyName) }}
              </div>
              <div>
                <h2 class="text-base font-bold text-gray-900">{{ profileSupplier.companyName }}</h2>
                <p class="text-xs font-mono text-gray-400">{{ profileSupplier.code }}</p>
                <span :class="profileSupplier.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium capitalize mt-1 inline-block">
                  {{ profileSupplier.status }}
                </span>
              </div>
            </div>
            <button @click="profileSupplier = null" class="text-gray-400 hover:text-gray-600 mt-1">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-gray-100 px-6 shrink-0">
            <button
              v-for="t in drawerTabs" :key="t"
              @click="drawerTab = t"
              :class="drawerTab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
              class="px-1 py-3 text-xs font-semibold border-b-2 mr-5 capitalize transition-colors"
            >{{ t }}</button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            <!-- Info tab -->
            <template v-if="drawerTab === 'info'">
              <div class="grid grid-cols-2 gap-3">
                <div class="bg-gray-50 rounded-lg p-3">
                  <p class="text-xs text-gray-500">Total Orders</p>
                  <p class="text-lg font-bold text-gray-900 mt-0.5">{{ profileSupplier.totalOrders }}</p>
                </div>
                <div :class="profileSupplier.outstandingBalance > 0 ? 'bg-red-50' : 'bg-gray-50'" class="rounded-lg p-3">
                  <p class="text-xs text-gray-500">Outstanding</p>
                  <p :class="profileSupplier.outstandingBalance > 0 ? 'text-red-600' : 'text-gray-900'" class="text-lg font-bold mt-0.5">
                    ₱{{ profileSupplier.outstandingBalance.toLocaleString() }}
                  </p>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Details</p>
                <div class="space-y-2 text-sm">
                  <div class="flex items-center gap-3"><User class="w-4 h-4 text-gray-400 shrink-0" /><span class="text-gray-700">{{ profileSupplier.contactPerson }}</span></div>
                  <div class="flex items-center gap-3"><Phone class="w-4 h-4 text-gray-400 shrink-0" /><span class="text-gray-700">{{ profileSupplier.phone }}</span></div>
                  <div v-if="profileSupplier.email" class="flex items-center gap-3"><Mail class="w-4 h-4 text-gray-400 shrink-0" /><span class="text-gray-700">{{ profileSupplier.email }}</span></div>
                  <div v-if="profileSupplier.address" class="flex items-center gap-3"><MapPin class="w-4 h-4 text-gray-400 shrink-0" /><span class="text-gray-700">{{ profileSupplier.address }}</span></div>
                </div>
              </div>

              <div class="space-y-2">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business Details</p>
                <div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div class="flex justify-between"><span class="text-gray-500">TIN</span><span class="font-medium text-gray-900 font-mono">{{ profileSupplier.taxNumber || '—' }}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Payment Terms</span>
                    <span :class="termsBadge(profileSupplier.paymentTerms)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ termsLabel(profileSupplier.paymentTerms) }}</span>
                  </div>
                  <div class="flex justify-between"><span class="text-gray-500">Since</span><span class="text-gray-700">{{ profileSupplier.createdAt }}</span></div>
                </div>
              </div>

              <div v-if="profileSupplier.notes" class="space-y-2">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</p>
                <p class="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 italic">{{ profileSupplier.notes }}</p>
              </div>
            </template>

            <!-- Purchase Orders tab -->
            <template v-if="drawerTab === 'orders'">
              <div class="space-y-2">
                <div
                  v-for="po in supplierPOs" :key="po.id"
                  class="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-800 font-mono">{{ po.id }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ po.date }} · {{ po.items }} items</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-semibold text-gray-900">₱{{ po.total.toLocaleString() }}</p>
                    <span :class="po.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
                      class="text-xs px-2 py-0.5 rounded-full font-medium capitalize">{{ po.status }}</span>
                  </div>
                </div>
                <p v-if="!supplierPOs.length" class="text-sm text-gray-400 text-center py-6">No purchase orders yet</p>
              </div>
            </template>

            <!-- Goods Received tab -->
            <template v-if="drawerTab === 'received'">
              <div class="space-y-2">
                <div
                  v-for="gr in supplierGRs" :key="gr.id"
                  class="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-800 font-mono">{{ gr.id }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ gr.date }} · Ref: {{ gr.poRef }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-semibold text-gray-900">₱{{ gr.total.toLocaleString() }}</p>
                    <p class="text-xs text-gray-400">{{ gr.items }} items</p>
                  </div>
                </div>
                <p v-if="!supplierGRs.length" class="text-sm text-gray-400 text-center py-6">No goods received yet</p>
              </div>
            </template>

          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
            <button @click="openEdit(profileSupplier); profileSupplier = null"
              class="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:border-gray-400">
              <Pencil class="w-4 h-4" /> Edit
            </button>
            <button
              v-if="profileSupplier.status === 'active'"
              @click="askArchive(profileSupplier); profileSupplier = null"
              class="flex items-center gap-2 border border-red-200 text-red-500 py-2.5 px-4 rounded-lg text-sm hover:bg-red-50"
            ><Archive class="w-4 h-4" /> Archive</button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSupplierStore } from '@/stores/suppliers'
import { useToastStore } from '@/stores/toast'
import { mockPurchaseOrders, mockGoodsReceived } from '@/mock/suppliers'
import BaseModal from '@/components/ui/BaseModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { Plus, Search, Eye, Pencil, Archive, RotateCcw, X, Phone, Mail, MapPin, User, ChevronLeft, ChevronRight } from '@lucide/vue'

const store = useSupplierStore()
const toast = useToastStore()

const search       = ref('')
const filterStatus = ref('active')
const showForm     = ref(false)
const showConfirm  = ref(false)
const editTarget   = ref(null)
const confirmTarget = ref(null)
const formError    = ref('')

const drawerTabs      = ['info', 'orders', 'received']
const drawerTab       = ref('info')
const profileSupplier = ref(null)

const emptyForm = () => ({
  companyName: '', contactPerson: '', phone: '', email: '',
  address: '', taxNumber: '', paymentTerms: 'cod', notes: '', status: 'active'
})
const form = ref(emptyForm())

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return store.suppliers.filter(s => {
    const matchSearch = !q || [s.companyName, s.contactPerson, s.code, s.phone].some(v => v?.toLowerCase().includes(q))
    const matchStatus = !filterStatus.value || s.status === filterStatus.value
    return matchSearch && matchStatus
  })
})

const totalPayable = computed(() => store.suppliers.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0))

const supplierPOs  = computed(() => profileSupplier.value ? (mockPurchaseOrders[profileSupplier.value.id] || []) : [])
const supplierGRs  = computed(() => profileSupplier.value ? (mockGoodsReceived[profileSupplier.value.id]  || []) : [])

function openCreate() {
  editTarget.value = null
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

function openEdit(s) {
  editTarget.value = s
  form.value = {
    companyName: s.companyName, contactPerson: s.contactPerson,
    phone: s.phone, email: s.email, address: s.address,
    taxNumber: s.taxNumber, paymentTerms: s.paymentTerms,
    notes: s.notes, status: s.status
  }
  formError.value = ''
  showForm.value = true
}

function save() {
  formError.value = ''
  try {
    if (editTarget.value) {
      store.update(editTarget.value.id, form.value)
      toast.success('Supplier updated')
    } else {
      store.add(form.value)
      toast.success('Supplier added')
    }
    showForm.value = false
  } catch (e) {
    formError.value = e.message
  }
}

function askArchive(s) {
  confirmTarget.value = s
  showConfirm.value = true
}

function doArchive() {
  try {
    store.archive(confirmTarget.value.id)
    toast.warning(`"${confirmTarget.value.companyName}" archived`)
  } catch (e) {
    toast.error(e.message)
  }
}

function handleRestore(s) {
  store.restore(s.id)
  toast.success(`"${s.companyName}" restored`)
}

function openProfile(s) {
  profileSupplier.value = s
  drawerTab.value = 'info'
}

const termsLabel = (t) => ({ cod: 'COD', net7: 'Net 7', net15: 'Net 15', net30: 'Net 30', net60: 'Net 60', prepaid: 'Prepaid' }[t] || t)
const termsBadge = (t) => t === 'cod' ? 'bg-green-100 text-green-700' : t === 'prepaid' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
const initials   = (name) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
</script>

<style scoped>
.inp {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}
.inp:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px #bfdbfe; }
</style>
