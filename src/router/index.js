import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { guest: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/pages/dashboard/DashboardPage.vue')
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/pages/products/ProductsPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/pages/categories/CategoriesPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/pages/inventory/InventoryPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'pos',
        name: 'POS',
        component: () => import('@/pages/pos/PosPage.vue'),
        meta: { requiresRole: ['owner', 'cashier'] }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/pages/reports/ReportsPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/pages/users/UsersPage.vue'),
        meta: { requiresRole: ['owner'] }
      },
      {
        path: 'customers',
        name: 'Customers',
        component: () => import('@/pages/customers/CustomersPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'suppliers',
        name: 'Suppliers',
        component: () => import('@/pages/suppliers/SuppliersPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'purchases',
        name: 'Purchases',
        component: () => import('@/pages/purchases/PurchasesPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'grn',
        name: 'GRN',
        component: () => import('@/pages/grn/GrnPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'eod',
        name: 'EOD',
        component: () => import('@/pages/eod/EodPage.vue'),
        meta: { requiresRole: ['owner', 'manager', 'cashier'] }
      },
      {
        path: 'ledger',
        name: 'Ledger',
        component: () => import('@/pages/ledger/LedgerPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'stock-take',
        name: 'StockTake',
        component: () => import('@/pages/stocktake/StockTakePage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'audit',
        name: 'Audit',
        component: () => import('@/pages/audit/AuditPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'cashier',
        name: 'CashierHub',
        component: () => import('@/pages/cashier/CashierHubPage.vue'),
        meta: { requiresRole: ['cashier'] }
      },
      {
        path: 'quotes',
        name: 'Quotes',
        component: () => import('@/pages/quotes/QuotesPage.vue'),
        meta: { requiresRole: ['owner', 'manager', 'cashier'] }
      },
      {
        path: 'vouchers',
        name: 'Vouchers',
        component: () => import('@/pages/vouchers/VouchersPage.vue'),
        meta: { requiresRole: ['owner', 'manager', 'cashier'] }
      },
      {
        path: 'discounts',
        name: 'Discounts',
        component: () => import('@/pages/discounts/DiscountsPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'payments',
        name: 'Payments',
        component: () => import('@/pages/payments/PaymentsPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('@/pages/transactions/TransactionsPage.vue'),
        meta: { requiresRole: ['owner', 'manager'] }
      },
      {
        path: 'sales-orders',
        name: 'SalesOrders',
        component: () => import('@/pages/salesorders/SalesOrdersPage.vue'),
        meta: { requiresRole: ['owner', 'manager', 'cashier'] }
      },
      {
        path: 'shifts',
        name: 'Shifts',
        component: () => import('@/pages/shifts/ShiftsPage.vue'),
        meta: { requiresRole: ['owner', 'cashier'] }
      },
      {
        path: 'returns',
        name: 'Returns',
        component: () => import('@/pages/returns/ReturnsPage.vue'),
        meta: { requiresRole: ['owner', 'manager', 'cashier'] }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/pages/settings/SettingsPage.vue'),
        meta: { requiresRole: ['owner'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/pages/NotFoundPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  // Import inside guard so Pinia is guaranteed to be ready
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore()

  if (to.meta.guest && authStore.isAuthenticated) {
    return next('/dashboard')
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/login')
  }

  if (to.meta.requiresRole && !to.meta.requiresRole.includes(authStore.role)) {
    return next('/dashboard')
  }

  next()
})

export default router
