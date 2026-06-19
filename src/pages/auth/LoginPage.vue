<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
          <ShoppingCart class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-3xl font-bold text-white">PabiliPOS</h1>
        <p class="text-slate-400 mt-1 text-sm">Sign in to your account</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              v-model="form.email"
              type="email"
              required
              placeholder="you@example.com"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Eye v-if="!showPassword" class="w-4 h-4" />
                <EyeOff v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div v-if="error" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{{ error }}</div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Demo accounts -->
        <div class="mt-6 pt-5 border-t border-gray-100">
          <p class="text-xs text-gray-500 text-center mb-3">Demo accounts (password: password)</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="demo in demoAccounts"
              :key="demo.role"
              @click="fillDemo(demo)"
              class="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors capitalize"
            >
              {{ demo.role }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ShoppingCart, Eye, EyeOff } from '@lucide/vue'

const authStore = useAuthStore()
const router = useRouter()

const form = ref({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const demoAccounts = [
  { role: 'owner', email: 'owner@pabilipos.com' },
  { role: 'manager', email: 'manager@pabilipos.com' },
  { role: 'cashier', email: 'cashier@pabilipos.com' }
]

function fillDemo(demo) {
  form.value.email = demo.email
  form.value.password = 'password'
}

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login(form.value.email, form.value.password)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.message ?? e.message ?? 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
