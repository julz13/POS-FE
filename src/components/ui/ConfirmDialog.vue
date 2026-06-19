<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0" :class="iconBg">
            <component :is="iconComponent" class="w-5 h-5" :class="iconColor" />
          </div>
          <div>
            <p class="font-semibold text-gray-900">{{ title }}</p>
            <p class="text-sm text-gray-500 mt-0.5">{{ message }}</p>
          </div>
        </div>
        <div class="flex gap-3 justify-end">
          <button
            @click="$emit('update:modelValue', false)"
            class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900"
          >
            {{ cancelLabel }}
          </button>
          <button
            @click="confirm"
            :class="confirmClass"
            class="px-4 py-2 text-sm text-white rounded-lg font-medium"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { AlertTriangle, Trash2, Info } from '@lucide/vue'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: 'This action cannot be undone.' },
  variant: { type: String, default: 'danger' },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
})
const emit = defineEmits(['update:modelValue', 'confirm'])

const variants = {
  danger:  { bg: 'bg-red-100', color: 'text-red-600', btn: 'bg-red-600 hover:bg-red-700', icon: Trash2 },
  warning: { bg: 'bg-yellow-100', color: 'text-yellow-600', btn: 'bg-yellow-600 hover:bg-yellow-700', icon: AlertTriangle },
  info:    { bg: 'bg-blue-100', color: 'text-blue-600', btn: 'bg-blue-600 hover:bg-blue-700', icon: Info },
}

const v = computed(() => variants[props.variant] || variants.danger)
const iconBg        = computed(() => v.value.bg)
const iconColor     = computed(() => v.value.color)
const iconComponent = computed(() => v.value.icon)
const confirmClass  = computed(() => v.value.btn)

function confirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>
