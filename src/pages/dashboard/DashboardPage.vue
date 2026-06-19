<template>
  <div class="space-y-6">

    <!-- OWNER -->
    <template v-if="role === 'owner'">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales"       :value="'₱' + stats.todaySales.toLocaleString()"     color="blue"   :icon="DollarSign" :sub="`${stats.todayTransactions} transactions`" />
        <StatCard label="Monthly Sales"       :value="'₱' + stats.monthlySales.toLocaleString()"   color="green"  :icon="TrendingUp"     :sub="`${stats.monthlyTransactions} transactions`" />
        <StatCard label="Inventory Value"     :value="'₱' + stats.inventoryValue.toLocaleString()" color="purple" :icon="Warehouse" />
        <StatCard label="Low Stock Items"     :value="lowStock.length"                              color="red"    :icon="AlertTriangle"  sub="Below reorder level" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top selling -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Top Selling Products</h3>
          <div class="space-y-3">
            <div v-for="(p, i) in stats.topProducts" :key="p.name" class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">{{ i + 1 }}</span>
              <span class="flex-1 text-sm text-gray-700 truncate">{{ p.name }}</span>
              <span class="text-xs text-gray-400">{{ p.sold }} sold</span>
              <span class="text-sm font-semibold text-gray-900">₱{{ p.revenue.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- Low stock -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            Low Stock Alerts
            <span v-if="lowStock.length" class="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">{{ lowStock.length }}</span>
          </h3>
          <div class="space-y-3">
            <div v-for="p in lowStock" :key="p.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p class="text-sm text-gray-800 font-medium">{{ p.name }}</p>
                <p class="text-xs text-gray-400">Reorder at {{ p.reorderLevel }}</p>
              </div>
              <span class="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full font-medium">{{ p.stock }} left</span>
            </div>
            <p v-if="!lowStock.length" class="text-sm text-gray-400 py-2">All stocks are sufficient ✓</p>
          </div>
        </div>
      </div>

      <!-- Recent transactions -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-gray-700">Recent Transactions</h3>
          <RouterLink to="/reports" class="text-xs text-blue-600 hover:text-blue-700">View all →</RouterLink>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-xs text-gray-500 border-b border-gray-100">
              <th class="text-left pb-2 font-medium">Receipt #</th>
              <th class="text-left pb-2 font-medium">Date</th>
              <th class="text-left pb-2 font-medium">Payment</th>
              <th class="text-right pb-2 font-medium">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="t in recentTxns" :key="t.id" class="hover:bg-gray-50">
              <td class="py-2.5 font-mono text-xs text-gray-500">{{ t.id }}</td>
              <td class="py-2.5 text-gray-600">{{ t.date.slice(0, 10) }}</td>
              <td class="py-2.5">
                <span v-for="p in t.payments" :key="p.method" class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs mr-1">{{ p.method }}</span>
              </td>
              <td class="py-2.5 text-right font-semibold"
                :class="t.status === 'voided' ? 'text-red-400 line-through' : 'text-gray-900'">
                ₱{{ t.total.toLocaleString() }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- MANAGER -->
    <template v-else-if="role === 'manager'">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Low Stock Items"  :value="lowStock.length"                                                      color="red"    :icon="AlertTriangle" />
        <StatCard label="Active Products"  :value="productStore.products.filter(p => p.status === 'active').length"      color="blue"   :icon="Package" />
        <StatCard label="Categories"       :value="productStore.categories.length"                                        color="purple" :icon="Tag" />
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Low Stock Items</h3>
        <div class="divide-y divide-gray-50">
          <div v-for="p in lowStock" :key="p.id" class="flex items-center justify-between py-3">
            <div>
              <p class="text-sm font-medium text-gray-800">{{ p.name }}</p>
              <p class="text-xs text-gray-400">{{ p.category }} · Reorder at {{ p.reorderLevel }}</p>
            </div>
            <span class="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full font-medium">{{ p.stock }} left</span>
          </div>
          <p v-if="!lowStock.length" class="text-sm text-gray-400 py-4 text-center">All stocks are sufficient ✓</p>
        </div>
      </div>
    </template>

    <!-- Cashier redirects to /cashier hub — see onMounted -->
    <template v-else-if="role === 'cashier'">
      <div class="flex items-center justify-center py-20 text-gray-400">
        <div class="text-center space-y-2">
          <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p class="text-sm">Redirecting to Cashier Hub...</p>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore }        from '@/stores/auth'
import { useProductStore }     from '@/stores/products'
import { useTransactionStore } from '@/stores/transactions'
import { mockDashboardStats }  from '@/mock/transactions'
import StatCard from '@/components/ui/StatCard.vue'
import {
  TrendingUp, Warehouse, AlertTriangle, Package, Tag, Receipt, DollarSign
} from '@lucide/vue'

const router       = useRouter()
const authStore    = useAuthStore()

// Cashiers have their own dedicated hub — redirect immediately
onMounted(() => {
  if (authStore.role === 'cashier') router.replace('/cashier')
})
const productStore = useProductStore()
const txnStore     = useTransactionStore()
const role         = computed(() => authStore.role)

const stats = computed(() => ({
  todaySales:          txnStore.todaySales,
  monthlySales:        txnStore.monthlySales,
  todayTransactions:   txnStore.todayCount,
  monthlyTransactions: txnStore.monthCount,
  inventoryValue:      productStore.products.reduce((s, p) => s + p.costPrice * p.stock, 0),
  topProducts:         txnStore.topProducts.length ? txnStore.topProducts : mockDashboardStats.topProducts,
}))

const recentTxns = computed(() => txnStore.transactions.slice(0, 5))
const lowStock   = computed(() => productStore.products.filter(p => p.stock <= p.reorderLevel && p.status === 'active'))
</script>
