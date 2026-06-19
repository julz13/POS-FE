<template>
  <div class="space-y-5">

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div class="flex gap-2 flex-1">
        <div class="relative flex-1 max-w-72">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="search"
            placeholder="Search name, phone, code..."
            class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select v-model="filterType" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Types</option>
          <option value="regular">Regular</option>
          <option value="vip">VIP</option>
          <option value="credit">Credit</option>
          <option value="wholesale">Wholesale</option>
        </select>
        <select v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="active">Active</option>
          <option value="">All</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <button @click="openCreate" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0">
        <Plus class="w-4 h-4" /> Add Customer
      </button>
    </div>

    <!-- Summary pills -->
    <div class="flex gap-3 text-xs flex-wrap">
      <span class="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600">Total: <strong>{{ store.customers.length }}</strong></span>
      <span class="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700">Active: <strong>{{ store.customers.filter(c => c.status === 'active').length }}</strong></span>
      <span class="px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full text-purple-700">VIP: <strong>{{ store.customers.filter(c => c.customerType === 'vip').length }}</strong></span>
      <span class="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-orange-700">With Balance: <strong>{{ store.customers.filter(c => c.currentBalance > 0).length }}</strong></span>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Code</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Balance</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total Spent</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Points</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th class="px-4 py-3 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <!-- Loading skeleton rows -->
          <template v-if="store.loading">
            <tr v-for="n in 7" :key="`sk${n}`" class="animate-pulse">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gray-100 shrink-0"></div>
                  <div class="h-4 bg-gray-100 rounded w-32"></div>
                </div>
              </td>
              <td class="px-4 py-3"><div class="h-3 bg-gray-100 rounded w-20"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-28"></div></td>
              <td class="px-4 py-3"><div class="h-5 bg-gray-100 rounded-full w-16"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-16 ml-auto"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-16 ml-auto"></div></td>
              <td class="px-4 py-3"><div class="h-4 bg-gray-100 rounded w-12 ml-auto"></div></td>
              <td class="px-4 py-3"><div class="h-5 bg-gray-100 rounded-full w-14"></div></td>
              <td class="px-4 py-3"></td>
            </tr>
          </template>
          <!-- Empty state -->
          <tr v-else-if="!filtered.length">
            <td colspan="9" class="px-4 py-10 text-center text-gray-400">No customers found</td>
          </tr>
          <tr v-else v-for="c in filtered" :key="c.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div :class="avatarColor(c.customerType)" class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                  {{ c.firstName[0] }}{{ c.lastName[0] }}
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ c.firstName }} {{ c.lastName }}</p>
                  <p v-if="c.notes" class="text-xs text-gray-400 truncate max-w-32">{{ c.notes }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ c.code }}</td>
            <td class="px-4 py-3">
              <p class="text-gray-700">{{ c.phone }}</p>
              <p v-if="c.email" class="text-xs text-gray-400">{{ c.email }}</p>
            </td>
            <td class="px-4 py-3">
              <span :class="typeBadge(c.customerType)" class="px-2 py-1 rounded-full text-xs font-medium capitalize">
                {{ c.customerType }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <span :class="c.currentBalance > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'">
                {{ c.currentBalance > 0 ? '₱' + c.currentBalance.toLocaleString() : '—' }}
              </span>
              <p v-if="c.creditLimit > 0" class="text-xs text-gray-400">limit: ₱{{ c.creditLimit.toLocaleString() }}</p>
            </td>
            <td class="px-4 py-3 text-right text-gray-700 font-medium">₱{{ c.totalSpent.toLocaleString() }}</td>
            <td class="px-4 py-3 text-right">
              <span class="text-xs text-amber-600 font-medium">{{ c.loyaltyPoints.toLocaleString() }} pts</span>
            </td>
            <td class="px-4 py-3">
              <span :class="c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                class="px-2 py-1 rounded-full text-xs font-medium capitalize">{{ c.status }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button @click="openProfile(c)" class="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="View Profile">
                  <Eye class="w-4 h-4" />
                </button>
                <button @click="openEdit(c)" class="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Edit">
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  v-if="c.status === 'active'"
                  @click="askArchive(c)"
                  class="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Archive"
                >
                  <Archive class="w-4 h-4" />
                </button>
                <button
                  v-else
                  @click="handleRestore(c)"
                  class="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Restore"
                >
                  <RotateCcw class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="9" class="px-4 py-12 text-center text-gray-400 text-sm">No customers found</td>
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
    <BaseModal v-model="showForm" :title="editTarget ? 'Edit Customer' : 'Add Customer'" max-width="max-w-lg">
      <form @submit.prevent="saveCustomer" class="space-y-4">
        <div v-if="formError" class="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{{ formError }}</div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
            <input v-model="form.firstName" required class="inp" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
            <input v-model="form.lastName" required class="inp" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Mobile * <span class="text-gray-400 font-normal">(unique)</span></label>
            <input v-model="form.phone" required placeholder="09XX-XXX-XXXX" class="inp" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Email <span class="text-gray-400 font-normal">(unique)</span></label>
            <input v-model="form.email" type="email" placeholder="optional" class="inp" />
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input v-model="form.address" class="inp" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Customer Type *</label>
            <select v-model="form.customerType" required class="inp">
              <option value="regular">Regular</option>
              <option value="vip">VIP</option>
              <option value="credit">Credit</option>
              <option value="wholesale">Wholesale</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Credit Limit (₱)</label>
            <input v-model.number="form.creditLimit" type="number" min="0" class="inp" />
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea v-model="form.notes" rows="2" class="inp resize-none" placeholder="Internal notes..." />
          </div>
          <div v-if="editTarget">
            <label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select v-model="form.status" class="inp">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showForm = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600">Cancel</button>
          <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {{ editTarget ? 'Save Changes' : 'Add Customer' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- ── Archive Confirm ── -->
    <ConfirmDialog
      v-model="showConfirm"
      title="Archive Customer"
      :message="`Archive &quot;${confirmTarget?.firstName} ${confirmTarget?.lastName}&quot;? They will be set to inactive but their transaction history is kept.`"
      confirmLabel="Archive"
      @confirm="doArchive"
    />

    <!-- ── Profile Drawer ── -->
    <Teleport to="body">
      <div v-if="profileCustomer" class="fixed inset-0 z-50 flex justify-end">
        <div class="absolute inset-0 bg-black/40" @click="profileCustomer = null"></div>
        <div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden">

          <!-- Drawer header -->
          <div class="px-6 py-5 border-b border-gray-100 flex items-start justify-between shrink-0">
            <div class="flex items-center gap-4">
              <div :class="avatarColor(profileCustomer.customerType)" class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
                {{ profileCustomer.firstName[0] }}{{ profileCustomer.lastName[0] }}
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-900">{{ profileCustomer.firstName }} {{ profileCustomer.lastName }}</h2>
                <p class="text-xs text-gray-400 font-mono">{{ profileCustomer.code }}</p>
                <span :class="typeBadge(profileCustomer.customerType)" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize mt-1 inline-block">
                  {{ profileCustomer.customerType }}
                </span>
              </div>
            </div>
            <button @click="profileCustomer = null" class="text-gray-400 hover:text-gray-600 mt-1">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Drawer body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            <!-- Stats row -->
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <p class="text-xs text-gray-500">Total Spent</p>
                <p class="text-sm font-bold text-gray-900 mt-0.5">₱{{ profileCustomer.totalSpent.toLocaleString() }}</p>
              </div>
              <div :class="profileCustomer.currentBalance > 0 ? 'bg-red-50' : 'bg-gray-50'" class="rounded-lg p-3 text-center">
                <p class="text-xs text-gray-500">Balance</p>
                <p :class="profileCustomer.currentBalance > 0 ? 'text-red-600' : 'text-gray-900'" class="text-sm font-bold mt-0.5">
                  {{ profileCustomer.currentBalance > 0 ? '₱' + profileCustomer.currentBalance.toLocaleString() : '₱0' }}
                </p>
              </div>
              <div class="bg-amber-50 rounded-lg p-3 text-center">
                <p class="text-xs text-gray-500">Points</p>
                <p class="text-sm font-bold text-amber-700 mt-0.5">{{ profileCustomer.loyaltyPoints.toLocaleString() }}</p>
              </div>
            </div>

            <!-- Contact info -->
            <div class="space-y-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Information</p>
              <div class="space-y-1.5 text-sm">
                <div class="flex items-center gap-3">
                  <Phone class="w-4 h-4 text-gray-400 shrink-0" />
                  <span class="text-gray-700">{{ profileCustomer.phone }}</span>
                </div>
                <div v-if="profileCustomer.email" class="flex items-center gap-3">
                  <Mail class="w-4 h-4 text-gray-400 shrink-0" />
                  <span class="text-gray-700">{{ profileCustomer.email }}</span>
                </div>
                <div v-if="profileCustomer.address" class="flex items-center gap-3">
                  <MapPin class="w-4 h-4 text-gray-400 shrink-0" />
                  <span class="text-gray-700">{{ profileCustomer.address }}</span>
                </div>
              </div>
            </div>

            <!-- Financial info -->
            <div class="space-y-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Financial</p>
              <div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Credit Limit</span>
                  <span class="font-medium text-gray-900">₱{{ profileCustomer.creditLimit.toLocaleString() }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Outstanding Balance</span>
                  <span :class="profileCustomer.currentBalance > 0 ? 'text-red-600 font-semibold' : 'text-gray-900'">
                    ₱{{ profileCustomer.currentBalance.toLocaleString() }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Available Credit</span>
                  <span class="font-medium text-green-600">₱{{ Math.max(0, profileCustomer.creditLimit - profileCustomer.currentBalance).toLocaleString() }}</span>
                </div>
                <div class="flex justify-between border-t border-gray-200 pt-2">
                  <span class="text-gray-500">Store Credit</span>
                  <span class="font-medium text-blue-600">₱{{ profileCustomer.storeCreditBalance.toLocaleString() }}</span>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="profileCustomer.notes" class="space-y-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</p>
              <p class="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 italic">{{ profileCustomer.notes }}</p>
            </div>

            <!-- Purchase History -->
            <div class="space-y-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Purchase History</p>
              <div class="space-y-2">
                <div
                  v-for="txn in purchaseHistory"
                  :key="txn.id"
                  class="flex items-center justify-between py-2.5 px-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p class="text-sm font-medium text-gray-800 font-mono">{{ txn.id }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ txn.date }} · {{ txn.items }} items · {{ txn.payment }}</p>
                  </div>
                  <span class="text-sm font-semibold text-gray-900">₱{{ txn.total.toLocaleString() }}</span>
                </div>
                <p v-if="!purchaseHistory.length" class="text-sm text-gray-400 text-center py-4">No transactions yet</p>
              </div>
            </div>

          </div>

          <!-- Drawer footer -->
          <div class="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
            <button @click="openEdit(profileCustomer); profileCustomer = null" class="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:border-gray-400">
              <Pencil class="w-4 h-4" /> Edit
            </button>
            <button
              v-if="profileCustomer.status === 'active'"
              @click="askArchive(profileCustomer); profileCustomer = null"
              class="flex items-center justify-center gap-2 border border-red-200 text-red-500 py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-red-50"
            >
              <Archive class="w-4 h-4" /> Archive
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCustomerStore } from '@/stores/customers'
import { useToastStore } from '@/stores/toast'
import { mockPurchaseHistory } from '@/mock/customers'
import BaseModal from '@/components/ui/BaseModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { Plus, Search, Eye, Pencil, Archive, RotateCcw, X, Phone, Mail, MapPin, ChevronLeft, ChevronRight } from '@lucide/vue'

const store = useCustomerStore()
const toast = useToastStore()

// ── Filters ──
const search       = ref('')
const filterType   = ref('')
const filterStatus = ref('active')

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return store.customers.filter(c => {
    const matchSearch = !q || [c.firstName, c.lastName, c.phone, c.code].some(v => v?.toLowerCase().includes(q))
    const matchType   = !filterType.value   || c.customerType === filterType.value
    const matchStatus = !filterStatus.value || c.status === filterStatus.value
    return matchSearch && matchType && matchStatus
  })
})

// ── Form ──
const showForm   = ref(false)
const editTarget = ref(null)
const formError  = ref('')
const emptyForm  = () => ({ firstName: '', lastName: '', phone: '', email: '', address: '', customerType: 'regular', creditLimit: 0, notes: '', status: 'active' })
const form       = ref(emptyForm())

function openCreate() {
  editTarget.value = null
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

function openEdit(customer) {
  editTarget.value = customer
  form.value = {
    firstName:    customer.firstName,
    lastName:     customer.lastName,
    phone:        customer.phone,
    email:        customer.email,
    address:      customer.address,
    customerType: customer.customerType,
    creditLimit:  customer.creditLimit,
    notes:        customer.notes,
    status:       customer.status,
  }
  formError.value = ''
  showForm.value = true
}

function saveCustomer() {
  formError.value = ''
  try {
    if (editTarget.value) {
      store.update(editTarget.value.id, form.value)
      toast.success('Customer updated')
    } else {
      store.add(form.value)
      toast.success('Customer added')
    }
    showForm.value = false
  } catch (e) {
    formError.value = e.message
  }
}

// ── Archive ──
const showConfirm   = ref(false)
const confirmTarget = ref(null)

function askArchive(customer) {
  confirmTarget.value = customer
  showConfirm.value = true
}

function doArchive() {
  store.archive(confirmTarget.value.id)
  toast.warning(`${confirmTarget.value.firstName} ${confirmTarget.value.lastName} archived`)
}

function handleRestore(customer) {
  store.restore(customer.id)
  toast.success(`${customer.firstName} ${customer.lastName} restored`)
}

// ── Profile drawer ──
const profileCustomer = ref(null)

function openProfile(customer) {
  profileCustomer.value = customer
}

const purchaseHistory = computed(() => {
  if (!profileCustomer.value) return []
  return mockPurchaseHistory[profileCustomer.value.id] || []
})

// ── Helpers ──
const typeBadge = (type) => ({
  regular:   'bg-gray-100 text-gray-700',
  vip:       'bg-purple-100 text-purple-700',
  credit:    'bg-orange-100 text-orange-700',
  wholesale: 'bg-blue-100 text-blue-700',
}[type] || 'bg-gray-100 text-gray-700')

const avatarColor = (type) => ({
  regular:   'bg-gray-100 text-gray-600',
  vip:       'bg-purple-100 text-purple-700',
  credit:    'bg-orange-100 text-orange-700',
  wholesale: 'bg-blue-100 text-blue-700',
}[type] || 'bg-gray-100 text-gray-600')
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
