<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <div class="flex items-center justify-between mb-3">
      <p class="text-sm text-gray-500 font-medium">{{ label }}</p>
      <div :class="iconBg" class="w-9 h-9 rounded-lg flex items-center justify-center">
        <component v-if="icon" :is="icon" :class="iconColor" class="w-5 h-5" />
      </div>
    </div>
    <p class="text-2xl font-bold text-gray-900">{{ value }}</p>
    <p v-if="sub" class="text-xs text-gray-400 mt-1">{{ sub }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: String,
  value: [String, Number],
  sub: String,
  icon: [Object, Function],
  color: { type: String, default: 'blue' }
})

const palettes = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-600'  },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  red:    { bg: 'bg-red-50',    text: 'text-red-600'    },
}

const iconBg    = computed(() => palettes[props.color]?.bg   || 'bg-blue-50')
const iconColor = computed(() => palettes[props.color]?.text || 'text-blue-600')
</script>
