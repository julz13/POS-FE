<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @mousedown.self="$emit('update:modelValue', false)"
    >
      <div class="bg-white rounded-xl shadow-xl w-full" :class="maxWidth">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="text-base font-semibold text-gray-900">{{ title }}</h2>
          <button @click="$emit('update:modelValue', false)" class="text-gray-400 hover:text-gray-600 transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        <!-- Body -->
        <div class="px-6 py-5">
          <slot />
        </div>
        <!-- Footer -->
        <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { X } from '@lucide/vue'

defineProps({
  modelValue: Boolean,
  title: String,
  maxWidth: { type: String, default: 'max-w-lg' }
})
defineEmits(['update:modelValue'])
</script>
