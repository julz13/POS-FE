<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toastStore.toasts"
          :key="toast.id"
          :class="styles[toast.type]"
          class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium cursor-pointer"
          @click="toastStore.remove(toast.id)"
        >
          <component :is="icons[toast.type]" class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toast'
import { CheckCircle, XCircle, AlertTriangle, Info } from '@lucide/vue'

const toastStore = useToastStore()

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
}

const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info }
</script>

<style scoped>
.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to   { opacity: 0; transform: translateX(20px); }
</style>
