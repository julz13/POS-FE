import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])

  function show(message, type = 'info', duration = 3000) {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    return id
  }

  function remove(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function success(message) { return show(message, 'success') }
  function error(message)   { return show(message, 'error') }
  function warning(message) { return show(message, 'warning') }
  function info(message)    { return show(message, 'info') }

  return { toasts, show, remove, success, error, warning, info }
})
