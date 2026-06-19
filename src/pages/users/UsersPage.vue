<template>
  <div class="space-y-5">
    <div class="flex justify-between items-center">
      <p class="text-sm text-gray-500">{{ users.length }} users</p>
      <button @click="openModal()" class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
        <Plus class="w-4 h-4" /> Add User
      </button>
    </div>

    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
            <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                  {{ u.firstName[0] }}{{ u.lastName[0] }}
                </div>
                <span class="font-medium text-gray-900">{{ u.firstName }} {{ u.lastName }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-500">{{ u.email }}</td>
            <td class="px-4 py-3">
              <span :class="roleColors[u.role]" class="px-2 py-1 rounded-full text-xs font-medium capitalize">{{ u.role }}</span>
            </td>
            <td class="px-4 py-3">
              <span :class="u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="px-2 py-1 rounded-full text-xs font-medium capitalize">
                {{ u.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-2">
                <button @click="openModal(u)" class="text-gray-400 hover:text-blue-600"><Pencil class="w-4 h-4" /></button>
                <button @click="toggleStatus(u.id)" class="text-gray-400 hover:text-orange-500">
                  <component :is="u.status === 'active' ? UserX : UserCheck" class="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-5">{{ editTarget ? 'Edit User' : 'Add User' }}</h2>
        <form @submit.prevent="save" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-medium text-gray-600">First Name</label>
              <input v-model="form.firstName" required class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="text-xs font-medium text-gray-600">Last Name</label>
              <input v-model="form.lastName" required class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Email</label>
            <input v-model="form.email" type="email" required class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600">Role</label>
            <select v-model="form.role" required class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600">Cancel</button>
            <button type="submit" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { mockUsers } from '@/mock/users'
import { Plus, Pencil, UserX, UserCheck } from '@lucide/vue'

const users = ref(mockUsers.map(u => ({ ...u, status: 'active' })))
const showModal = ref(false)
const editTarget = ref(null)
const form = ref({ firstName: '', lastName: '', email: '', role: 'cashier' })

const roleColors = {
  owner: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  cashier: 'bg-gray-100 text-gray-700'
}

function openModal(user = null) {
  editTarget.value = user
  form.value = user ? { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } : { firstName: '', lastName: '', email: '', role: 'cashier' }
  showModal.value = true
}

function save() {
  if (editTarget.value) {
    Object.assign(editTarget.value, form.value)
  } else {
    users.value.push({ id: Date.now(), ...form.value, status: 'active' })
  }
  showModal.value = false
}

function toggleStatus(id) {
  const u = users.value.find(u => u.id === id)
  if (u) u.status = u.status === 'active' ? 'inactive' : 'active'
}
</script>
