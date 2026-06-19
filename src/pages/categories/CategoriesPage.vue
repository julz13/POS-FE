<template>
  <div class="space-y-5">

    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div class="flex gap-2 flex-1">
        <div class="relative flex-1 max-w-72">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            v-model="search"
            placeholder="Search category name..."
            class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select v-model="filterStatus" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="active">Active</option>
          <option value="">All</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <button
        @click="openCreate"
        class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shrink-0"
      >
        <Plus class="w-4 h-4" /> Add Category
      </button>
    </div>

    <!-- Summary pills -->
    <div class="flex gap-3 text-xs flex-wrap">
      <span class="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600">
        Total: <strong>{{ productStore.categories.length }}</strong>
      </span>
      <span class="px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700">
        Active: <strong>{{ productStore.categories.filter(c => c.status === 'active').length }}</strong>
      </span>
      <span class="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-500">
        Inactive: <strong>{{ productStore.categories.filter(c => c.status === 'inactive').length }}</strong>
      </span>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
            <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Products</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
            <th class="px-4 py-3 w-24"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="cat in filtered"
            :key="cat.id"
            class="hover:bg-gray-50 transition-colors"
            :class="cat.status === 'inactive' ? 'opacity-60' : ''"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  :style="{ backgroundColor: categoryColor(cat.name) + '20', color: categoryColor(cat.name) }">
                  {{ cat.name[0] }}
                </div>
                <p class="font-medium text-gray-900">{{ cat.name }}</p>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-500 text-xs">{{ cat.description || '—' }}</td>
            <td class="px-4 py-3 text-right">
              <span class="text-sm font-medium text-gray-700">{{ productCountFor(cat.name) }}</span>
              <p class="text-xs text-gray-400">products</p>
            </td>
            <td class="px-4 py-3">
              <span
                :class="cat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                class="px-2 py-1 rounded-full text-xs font-medium capitalize"
              >{{ cat.status }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1">
                <button @click="openEdit(cat)" class="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Edit">
                  <Pencil class="w-4 h-4" />
                </button>
                <button
                  v-if="cat.status === 'active'"
                  @click="askArchive(cat)"
                  class="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Archive"
                >
                  <Archive class="w-4 h-4" />
                </button>
                <button
                  v-else
                  @click="handleRestore(cat)"
                  class="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Restore"
                >
                  <RotateCcw class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="5" class="px-4 py-12 text-center text-gray-400 text-sm">No categories found</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / Edit Modal -->
    <BaseModal v-model="showForm" :title="editTarget ? 'Edit Category' : 'Add Category'" max-width="max-w-md">
      <form @submit.prevent="save" class="space-y-4">
        <div v-if="formError" class="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg">{{ formError }}</div>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Category Name *</label>
          <input
            v-model="form.name"
            required
            placeholder="e.g. Beverages, Snacks, Hardware..."
            class="inp"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Brief description of this category..."
            class="inp resize-none"
          />
        </div>

        <div v-if="editTarget">
          <label class="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select v-model="form.status" class="inp">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <!-- Preview -->
        <div v-if="form.name" class="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
          <div
            class="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
            :style="{ backgroundColor: categoryColor(form.name) + '20', color: categoryColor(form.name) }"
          >{{ form.name[0] }}</div>
          <div>
            <p class="text-sm font-medium text-gray-900">{{ form.name }}</p>
            <p class="text-xs text-gray-400">{{ form.description || 'No description' }}</p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" @click="showForm = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900">Cancel</button>
          <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {{ editTarget ? 'Save Changes' : 'Add Category' }}
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Archive Confirm -->
    <ConfirmDialog
      v-model="showConfirm"
      title="Archive Category"
      :message="`Archive &quot;${confirmTarget?.name}&quot;? Products in this category will not be affected but the category will be hidden.`"
      confirmLabel="Archive"
      @confirm="doArchive"
    />

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProductStore } from '@/stores/products'
import { useToastStore } from '@/stores/toast'
import BaseModal from '@/components/ui/BaseModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { Plus, Search, Pencil, Archive, RotateCcw } from '@lucide/vue'

const productStore = useProductStore()
const toast        = useToastStore()

const search       = ref('')
const filterStatus = ref('active')
const showForm     = ref(false)
const showConfirm  = ref(false)
const editTarget   = ref(null)
const confirmTarget = ref(null)
const formError    = ref('')

const emptyForm = () => ({ name: '', description: '', status: 'active' })
const form      = ref(emptyForm())

// ── Filtered list ──
const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return productStore.categories.filter(c => {
    const matchSearch = !q || c.name.toLowerCase().includes(q)
    const matchStatus = !filterStatus.value || c.status === filterStatus.value
    return matchSearch && matchStatus
  })
})

// ── Product count per category ──
function productCountFor(catName) {
  return productStore.products.filter(p => p.category === catName && p.status === 'active').length
}

// ── Create ──
function openCreate() {
  editTarget.value = null
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

// ── Edit ──
function openEdit(cat) {
  editTarget.value = cat
  form.value = { name: cat.name, description: cat.description || '', status: cat.status }
  formError.value = ''
  showForm.value = true
}

// ── Save (Create or Update) ──
function save() {
  formError.value = ''

  // Unique name validation (excluding self on edit)
  const duplicate = productStore.categories.find(c =>
    c.name.toLowerCase() === form.value.name.toLowerCase() &&
    (!editTarget.value || c.id !== editTarget.value.id)
  )
  if (duplicate) {
    formError.value = `Category "${form.value.name}" already exists`
    return
  }

  if (editTarget.value) {
    productStore.updateCategory(editTarget.value.id, form.value)
    toast.success('Category updated')
  } else {
    productStore.addCategory(form.value)
    toast.success(`Category "${form.value.name}" added`)
  }
  showForm.value = false
}

// ── Archive ──
function askArchive(cat) {
  confirmTarget.value = cat
  showConfirm.value = true
}

function doArchive() {
  productStore.updateCategory(confirmTarget.value.id, { status: 'inactive' })
  toast.warning(`"${confirmTarget.value.name}" archived`)
}

// ── Restore ──
function handleRestore(cat) {
  productStore.updateCategory(cat.id, { status: 'active' })
  toast.success(`"${cat.name}" restored`)
}

// ── Color helper — consistent color per category name ──
const palette = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#84cc16','#f97316','#6366f1']
function categoryColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return palette[Math.abs(hash) % palette.length]
}
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
