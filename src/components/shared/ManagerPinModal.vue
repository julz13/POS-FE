<template>
  <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xs">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-gray-100 text-center">
        <div class="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldCheck class="w-6 h-6 text-orange-500" />
        </div>
        <h3 class="text-base font-bold text-gray-800">{{ title }}</h3>
        <p class="text-xs text-gray-400 mt-1">{{ description || 'Manager or owner PIN required' }}</p>
      </div>

      <!-- PIN display -->
      <div class="px-6 pt-5 pb-2 flex justify-center gap-3">
        <div v-for="i in 4" :key="i"
          class="w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-colors"
          :class="pin.length >= i ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-200'">
          {{ pin.length >= i ? '●' : '○' }}
        </div>
      </div>

      <!-- Error message -->
      <p v-if="error" class="text-center text-xs text-red-600 font-medium px-6 pb-1">{{ error }}</p>
      <!-- Approver shown after success (not used directly, returned via emit) -->

      <!-- Numpad -->
      <div class="px-4 pb-4 grid grid-cols-3 gap-2 mt-2">
        <button v-for="n in [1,2,3,4,5,6,7,8,9,'',0,'⌫']" :key="n"
          @click="pressKey(n)"
          :disabled="n === ''"
          class="h-14 rounded-xl text-lg font-bold transition-colors"
          :class="n === '' ? 'opacity-0 cursor-default' : n === '⌫'
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            : 'bg-gray-50 text-gray-800 hover:bg-orange-50 hover:text-orange-700 border border-gray-200'">
          {{ n }}
        </button>
      </div>

      <!-- Cancel -->
      <div class="px-6 pb-5">
        <button @click="$emit('cancel')"
          class="w-full py-2.5 border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { mockUsers } from '@/mock/users'
import { ShieldCheck } from '@lucide/vue'

const props = defineProps({
  title:       { type: String, default: 'Manager Override Required' },
  description: { type: String, default: '' },
})
const emit = defineEmits(['approved', 'cancel'])

const pin   = ref('')
const error = ref('')

function pressKey(key) {
  error.value = ''
  if (key === '⌫') {
    pin.value = pin.value.slice(0, -1)
    return
  }
  if (typeof key !== 'number') return
  if (pin.value.length >= 4) return
  pin.value += String(key)

  if (pin.value.length === 4) {
    const approver = mockUsers.find(u =>
      u.pin === pin.value && (u.role === 'manager' || u.role === 'owner')
    )
    if (approver) {
      emit('approved', { id: approver.id, name: `${approver.firstName} ${approver.lastName}`, role: approver.role })
    } else {
      error.value = 'Incorrect PIN or not a manager/owner'
      pin.value = ''
    }
  }
}
</script>
