<template>
  <div class="flex h-screen bg-gray-100 overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-64 flex flex-col" style="background-color: #0f172a">
      <!-- Logo -->
      <div class="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <ShoppingCart class="w-5 h-5 text-white" />
        </div>
        <span class="text-white font-bold text-lg">PabiliPOS</span>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in visibleNav"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="isActive(item.to)
            ? 'bg-blue-600 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'"
        >
          <component :is="item.icon" class="w-5 h-5 shrink-0" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- User info -->
      <div class="px-4 py-4 border-t border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {{ initials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-medium truncate">{{ authStore.user?.firstName }}</p>
            <p class="text-slate-400 text-xs capitalize">{{ authStore.role }}</p>
          </div>
          <button @click="handleLogout" class="text-slate-400 hover:text-white transition-colors">
            <LogOut class="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Topbar -->
      <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <h1 class="text-xl font-semibold text-gray-800">{{ currentPageTitle }}</h1>
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <span>{{ currentDate }}</span>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LayoutDashboard, Package, Tag, Warehouse,
  ShoppingCart, BarChart2, Users, Clock, LogOut, RotateCcw, Settings, UserCircle, Truck, ClipboardList, PackageCheck, FileStack, Receipt, CreditCard, Percent, Gift, FileText, Monitor, Sunset,
  BookOpen, ScanLine, Shield
} from '@lucide/vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const allNav = [
  { to: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard, roles: ['owner', 'manager'] },
  { to: '/cashier',   label: 'Cashier Hub',   icon: Monitor,         roles: ['cashier'] },
  { to: '/quotes',    label: 'Quotes',        icon: FileText,        roles: ['owner', 'manager', 'cashier'] },
  { to: '/pos',          label: 'Point of Sale',    icon: ShoppingCart, roles: ['owner', 'cashier'] },
  { to: '/sales-orders', label: 'Sales Orders',     icon: FileStack,    roles: ['owner', 'manager', 'cashier'] },
  { to: '/transactions', label: 'Transactions',     icon: Receipt,      roles: ['owner', 'manager'] },
  { to: '/payments',     label: 'Payments',         icon: CreditCard,   roles: ['owner', 'manager'] },
  { to: '/vouchers',    label: 'Gift Vouchers',     icon: Gift,         roles: ['owner', 'manager', 'cashier'] },
  { to: '/discounts',   label: 'Discounts',        icon: Percent,      roles: ['owner', 'manager'] },
  { to: '/products', label: 'Products', icon: Package, roles: ['owner', 'manager'] },
  { to: '/categories', label: 'Categories', icon: Tag, roles: ['owner', 'manager'] },
  { to: '/inventory',  label: 'Inventory',       icon: Warehouse, roles: ['owner', 'manager'] },
  { to: '/ledger',     label: 'Inventory Ledger',icon: BookOpen,  roles: ['owner', 'manager'] },
  { to: '/stock-take', label: 'Stock Take',      icon: ScanLine,  roles: ['owner', 'manager'] },
  { to: '/shifts',  label: 'Shifts',   icon: Clock,      roles: ['owner', 'cashier'] },
  { to: '/returns',   label: 'Returns',   icon: RotateCcw,   roles: ['owner', 'manager', 'cashier'] },
  { to: '/customers', label: 'Customers', icon: UserCircle, roles: ['owner', 'manager'] },
  { to: '/suppliers', label: 'Suppliers',       icon: Truck,         roles: ['owner', 'manager'] },
  { to: '/purchases', label: 'Purchase Orders', icon: ClipboardList, roles: ['owner', 'manager'] },
  { to: '/grn',       label: 'Goods Received',  icon: PackageCheck,  roles: ['owner', 'manager'] },
  { to: '/eod',       label: 'End of Day', icon: Sunset,      roles: ['owner', 'manager', 'cashier'] },
  { to: '/reports',   label: 'Reports',   icon: BarChart2,   roles: ['owner', 'manager'] },
  { to: '/users',    label: 'Users',    icon: Users,    roles: ['owner'] },
  { to: '/audit',    label: 'Audit Trail',icon: Shield,   roles: ['owner', 'manager'] },
  { to: '/settings', label: 'Settings',   icon: Settings, roles: ['owner'] },
]

const visibleNav = computed(() => allNav.filter(n => n.roles.includes(authStore.role)))
const isActive = (path) => route.path === path
const initials = computed(() => {
  const u = authStore.user
  return u ? `${u.firstName[0]}${u.lastName[0]}` : 'U'
})
const currentPageTitle = computed(() => {
  const allRoutes = [...allNav, { to: '/returns', label: 'Returns & Refunds' }]
  const match = allRoutes.find(n => n.to === route.path)
  return match?.label || 'PabiliPOS'
})
const currentDate = computed(() => new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
