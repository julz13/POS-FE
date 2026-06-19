<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
        <FileQuestion class="w-10 h-10 text-gray-400" />
      </div>
      <h1 class="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p class="text-gray-500 mb-6">Page not found</p>
      <RouterLink to="/dashboard" class="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
        <Home class="w-4 h-4" />
        Back to Dashboard
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { FileQuestion, Home } from '@lucide/vue'
</script>
