<template>
  <div class="flex gap-3" style="height: calc(100vh - 120px)">

    <!-- ══ LEFT: Product lookup panel ══ -->
    <div class="flex-1 flex flex-col gap-2 min-w-0">

      <!-- Search bar + action buttons -->
      <div class="flex gap-2">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref="searchInput"
            v-model="search"
            placeholder="Scan barcode · type SKU · search product name..."
            class="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keydown.enter="scanBarcode"
            @keydown.escape="search = ''"
          />
          <button v-if="search" @click="search = ''" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X class="w-4 h-4" />
          </button>
        </div>
        <!-- Price Check -->
        <button @click="openPriceCheck"
          class="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors whitespace-nowrap"
          title="Price Check">
          <ScanSearch class="w-4 h-4" /> Price Check
        </button>
        <!-- Reprint Receipt -->
        <button @click="showReprint = true"
          class="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors whitespace-nowrap"
          title="Reprint Receipt">
          <Printer class="w-4 h-4" /> Reprint
        </button>
        <!-- Clear cart -->
        <button v-if="posStore.cart.length" @click="showClearConfirm = true"
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Clear Cart">
          <Trash2 class="w-4 h-4" />
        </button>
      </div>

      <!-- Back button (shown when a category is selected) -->
      <div v-if="activeCat !== null" class="flex items-center gap-2">
        <button @click="activeCat = null"
          class="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors">
          <ChevronLeft class="w-4 h-4" /> All Categories
        </button>
        <span class="text-sm font-semibold text-gray-800">{{ activeCat }}</span>
      </div>

      <!-- Category grid (initial view) -->
      <div v-if="showCategories" class="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 content-start pb-2">
        <!-- Loading skeleton -->
        <template v-if="productStore.loading">
          <div v-for="n in 8" :key="n" class="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-pulse">
            <div class="h-4 bg-blue-100 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-blue-100 rounded w-1/3"></div>
          </div>
        </template>
        <!-- Empty state -->
        <div v-else-if="!categories.length" class="col-span-full flex flex-col items-center justify-center py-12 text-gray-300 gap-2">
          <Tag class="w-10 h-10" />
          <p class="text-sm">No categories</p>
        </div>
        <!-- Category tiles -->
        <template v-else>
          <button
            v-for="cat in categories" :key="cat"
            @click="activeCat = cat"
            class="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left hover:bg-blue-100 hover:border-blue-300 active:scale-95 transition-all"
          >
            <p class="text-base font-semibold text-blue-900 leading-tight line-clamp-2">{{ cat }}</p>
            <p class="text-sm text-blue-400 mt-1.5">{{ categoryProductCounts[cat] ?? 0 }} items</p>
          </button>
        </template>
      </div>

      <!-- Product grid (after category selected or search active) -->
      <div v-else class="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 content-start pb-2">
        <!-- Loading skeleton -->
        <template v-if="productStore.loading">
          <div v-for="n in 8" :key="n" class="bg-white border border-gray-200 rounded-xl p-3 animate-pulse">
            <div class="h-2.5 bg-gray-200 rounded w-2/5 mb-2"></div>
            <div class="h-3.5 bg-gray-200 rounded w-4/5 mb-1.5"></div>
            <div class="h-2.5 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div class="flex justify-between">
              <div class="h-3.5 bg-blue-100 rounded w-1/3"></div>
              <div class="h-2.5 bg-gray-100 rounded w-1/4"></div>
            </div>
          </div>
        </template>
        <!-- Empty state -->
        <div v-else-if="!filteredProducts.length" class="col-span-full flex flex-col items-center justify-center py-12 text-gray-300 gap-2">
          <Package class="w-10 h-10" />
          <p class="text-sm">No products found</p>
        </div>
        <!-- Product tiles -->
        <template v-else>
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            @click="addProduct(p)"
            :disabled="p.stock === 0"
            class="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-blue-400 hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
          >
            <p class="text-xs text-gray-400 mb-0.5">{{ p.sku }}</p>
            <p class="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{{ p.name }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ p.category }}</p>
            <div class="flex items-center justify-between mt-2">
              <p class="text-sm font-bold text-blue-600">₱{{ p.sellingPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
              <p class="text-xs" :class="p.stock === 0 ? 'text-red-500 font-semibold' : p.stock <= p.reorderLevel ? 'text-orange-400' : 'text-gray-400'">
                {{ p.stock === 0 ? 'Out' : `${p.stock} left` }}
              </p>
            </div>
          </button>
        </template>
      </div>
    </div>

    <!-- ══ RIGHT: Cart panel ══ -->
    <div class="w-84 flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shrink-0" style="width: 340px">

      <!-- Cart header with customer field -->
      <div class="px-4 py-3 border-b border-gray-100 space-y-2">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold text-gray-800">Current Sale</h2>
          <div class="flex items-center gap-1.5">
            <button
              v-if="posStore.cart.length"
              @click="showHoldModal = true"
              class="text-xs text-gray-500 hover:text-orange-600 border border-gray-200 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
              <PauseCircle class="w-3.5 h-3.5" /> Hold
            </button>
            <button
              v-if="posStore.heldTransactions.length"
              @click="showHeld = true"
              class="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-1 rounded-lg flex items-center gap-1">
              <PlayCircle class="w-3.5 h-3.5" /> {{ posStore.heldTransactions.length }}
            </button>
          </div>
        </div>

        <!-- Customer lookup field -->
        <div>
          <!-- No customer selected -->
          <button v-if="!selectedCustomer"
            @click="showCustomerSearch = true"
            class="w-full flex items-center gap-2 px-2.5 py-1.5 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors">
            <UserCircle class="w-3.5 h-3.5 shrink-0" />
            <span>Search or select customer...</span>
          </button>

          <!-- Customer selected — mini card -->
          <div v-else class="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <div :class="typeBadgeColor(selectedCustomer.customerType)" class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
              {{ selectedCustomer.firstName[0] }}{{ selectedCustomer.lastName[0] }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <p class="text-xs font-semibold text-gray-800 truncate">{{ selectedCustomer.firstName }} {{ selectedCustomer.lastName }}</p>
                <span :class="typeBadgeColor(selectedCustomer.customerType)" class="text-xs px-1.5 py-0.5 rounded-full font-medium capitalize">
                  {{ selectedCustomer.customerType }}
                </span>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                <span class="text-amber-600">{{ selectedCustomer.loyaltyPoints }} pts</span>
                <span v-if="selectedCustomer.storeCreditBalance > 0" class="ml-2 text-blue-600">₱{{ selectedCustomer.storeCreditBalance }} credit</span>
                <span v-if="selectedCustomer.currentBalance > 0" class="ml-2 text-red-500">₱{{ selectedCustomer.currentBalance }} balance</span>
              </p>
            </div>
            <button @click="clearSelectedCustomer" class="text-gray-300 hover:text-gray-500 shrink-0"><X class="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      <!-- Cart items -->
      <div class="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        <div v-if="!posStore.cart.length" class="flex flex-col items-center justify-center h-full text-gray-300 gap-2">
          <ShoppingCart class="w-10 h-10" />
          <p class="text-sm">Cart is empty</p>
          <p class="text-xs text-gray-300">Scan a barcode or tap a product</p>
        </div>

        <!-- Cart item row -->
        <div v-for="item in posStore.cart" :key="item.id"
          class="bg-gray-50 rounded-lg px-3 py-2.5 space-y-1.5 border border-gray-100 hover:border-gray-200 transition-colors">

          <!-- Row 1: Name + total + void -->
          <div class="flex items-start gap-2">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-900 leading-tight">{{ item.name }}</p>
              <p class="text-xs text-gray-400 mt-0.5">
                <span class="font-mono">{{ item.sku }}</span>
                <span v-if="item.barcode" class="ml-2 font-mono text-gray-300">{{ item.barcode }}</span>
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-bold text-gray-900">₱{{ lineTotal(item).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
              <button @click="openPriceOverride(item)"
                class="text-xs text-gray-400 hover:text-orange-600 transition-colors"
                :class="item._priceOverridden ? 'text-orange-500 font-medium' : ''">
                ₱{{ item.sellingPrice }} / {{ item.unit }}{{ item._priceOverridden ? ' ✎' : '' }}
              </button>
            </div>
            <button @click="voidLineItem(item.id)"
              class="text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-0.5" title="Void line item">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Row 2: Qty controls + line discount -->
          <div class="flex items-center gap-2">
            <!-- Qty controls -->
            <div class="flex items-center gap-1 bg-white border border-gray-200 rounded-lg overflow-hidden">
              <button @click="posStore.updateQty(item.id, item.qty - 1)"
                class="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-sm font-bold">−</button>
              <input
                :value="item.qty"
                @change="posStore.updateQty(item.id, +$event.target.value || 1)"
                type="number" min="1"
                class="w-10 text-center text-sm font-semibold border-none outline-none bg-transparent py-0"
              />
              <button @click="posStore.updateQty(item.id, item.qty + 1)"
                class="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-sm font-bold">+</button>
            </div>
            <!-- Line discount badge / button -->
            <div class="flex-1">
              <button @click="openLineDiscount(item)"
                class="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg transition-colors"
                :class="item.lineDiscount
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
                <Tag class="w-3 h-3" />
                <span v-if="item.lineDiscount">
                  {{ item.lineDiscountTypeName || 'Custom' }} {{ item.lineDiscount }}% · −₱{{ ((item.sellingPrice * item.qty * item.lineDiscount) / 100).toFixed(2) }}
                </span>
                <span v-else>Add Discount</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Totals -->
      <div class="border-t border-gray-100 px-4 py-3 space-y-1.5">
        <div class="flex justify-between text-sm text-gray-600">
          <span>Subtotal ({{ posStore.cart.length }} item{{ posStore.cart.length !== 1 ? 's' : '' }})</span>
          <span>₱{{ posStore.subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
        </div>
        <!-- Transaction discount badge -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">Discount</span>
          <button @click="openTxnDiscount"
            class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors"
            :class="posStore.transactionDiscount
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'">
            <Tag class="w-3 h-3" />
            <span v-if="posStore.transactionDiscount">
              {{ posStore.txnDiscountTypeName || 'Custom' }} {{ posStore.transactionDiscount }}%
              · −₱{{ posStore.transactionDiscountAmount.toFixed(2) }}
            </span>
            <span v-else>Apply Discount</span>
          </button>
        </div>
        <div v-if="posStore.taxAmount > 0" class="flex justify-between text-xs text-gray-400">
          <span>{{ settingsStore.config.taxName }} {{ settingsStore.config.taxRate }}%</span>
          <span>₱{{ posStore.taxAmount.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between text-lg font-bold text-gray-900 pt-1.5 border-t border-gray-100">
          <span>TOTAL</span>
          <span class="text-blue-600">₱{{ posStore.total.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="px-3 py-3 flex gap-2">
        <button
          @click="showCashOut = true"
          class="flex-none w-10 h-10 border border-gray-300 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 flex items-center justify-center"
          title="Petty Cash Out">
          <Minus class="w-4 h-4" />
        </button>
        <button
          @click="showPayment = true"
          :disabled="!posStore.cart.length"
          class="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <CreditCard class="w-4 h-4" />
          Process Payment
          <span v-if="posStore.cart.length" class="text-xs opacity-75">(₱{{ posStore.total.toFixed(2) }})</span>
        </button>
      </div>
    </div>

    <!-- ══ PRICE CHECK MODAL ══ -->
    <div v-if="showPriceCheck" class="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-16">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div class="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
          <ScanSearch class="w-5 h-5 text-blue-500 shrink-0" />
          <div class="flex-1 relative">
            <input
              ref="pcInput"
              v-model="pcQuery"
              type="text"
              placeholder="Scan barcode, type SKU or product name..."
              class="w-full pr-8 text-sm border-none outline-none text-gray-800 placeholder-gray-400"
            />
            <button v-if="pcQuery" @click="pcQuery = ''" class="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X class="w-4 h-4" />
            </button>
          </div>
          <button @click="showPriceCheck = false" class="text-gray-400 hover:text-gray-600 shrink-0">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="max-h-96 overflow-y-auto">
          <!-- Empty state -->
          <div v-if="!pcQuery" class="px-5 py-10 text-center text-gray-400">
            <ScanSearch class="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p class="text-sm">Start typing a product name, SKU, or scan a barcode</p>
          </div>
          <!-- No results -->
          <div v-else-if="!pcResults.length" class="px-5 py-10 text-center text-gray-400 text-sm">
            No product found for "{{ pcQuery }}"
          </div>
          <!-- Results -->
          <div v-else class="divide-y divide-gray-100">
            <div v-for="p in pcResults" :key="p.id"
              class="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900">{{ p.name }}</p>
                <p class="text-xs text-gray-400 mt-0.5">
                  <span class="font-mono">{{ p.sku }}</span>
                  <span class="mx-1.5">·</span>{{ p.category }}
                  <span v-if="p.barcode" class="ml-1.5 font-mono text-gray-300">{{ p.barcode }}</span>
                </p>
                <p class="text-xs mt-1" :class="p.stock === 0 ? 'text-red-500' : p.stock <= p.reorderLevel ? 'text-orange-400' : 'text-gray-400'">
                  {{ p.stock === 0 ? '⚠ Out of stock' : `${p.stock} ${p.unit}${p.stock !== 1 ? 's' : ''} in stock` }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-lg font-bold text-blue-600">₱{{ p.sellingPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
                <p class="text-xs text-gray-400">per {{ p.unit }}</p>
              </div>
              <button
                @click="addFromPriceCheck(p)"
                :disabled="p.stock === 0"
                class="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Add
              </button>
            </div>
          </div>
        </div>

        <div class="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          Press <kbd class="px-1.5 py-0.5 bg-gray-100 rounded font-mono">Esc</kbd> to close · Click Add to add directly to cart
        </div>
      </div>
    </div>

    <!-- ══ CLEAR CART CONFIRM ══ -->
    <div v-if="showClearConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 text-center space-y-4">
        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <Trash2 class="w-6 h-6 text-red-500" />
        </div>
        <div>
          <p class="text-base font-semibold text-gray-800">Clear Cart?</p>
          <p class="text-sm text-gray-500 mt-1">{{ posStore.cart.length }} item{{ posStore.cart.length !== 1 ? 's' : '' }} will be removed</p>
        </div>
        <div class="flex gap-3">
          <button @click="showClearConfirm = false" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600">Keep</button>
          <button @click="posStore.clearCart(); showClearConfirm = false; clearSelectedCustomer()"
            class="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">Clear</button>
        </div>
      </div>
    </div>

    <!-- ══ PAYMENT MODAL (enhanced) ══ -->
    <div v-if="showPayment" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 class="text-lg font-semibold text-gray-900">Accept Payment</h2>
          <p class="text-2xl font-bold text-blue-600">₱{{ posStore.total.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        </div>

        <div class="overflow-y-auto flex-1 p-5 space-y-4">

          <!-- Split payments list -->
          <div v-if="posStore.splitPayments.length" class="space-y-2">
            <div v-for="sp in posStore.splitPayments" :key="sp.id"
              class="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <span class="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full font-semibold text-gray-600 shrink-0">{{ sp.method }}</span>
              <span v-if="sp.referenceNo" class="text-xs text-gray-400 flex-1 truncate">Ref: {{ sp.referenceNo }}</span>
              <span v-else-if="sp.voucherCode" class="text-xs text-gray-400 flex-1 truncate">Voucher: {{ sp.voucherCode }}</span>
              <span v-else class="flex-1"></span>
              <span class="text-sm font-semibold text-gray-800">₱{{ sp.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
              <button @click="posStore.removeSplitPayment(sp.id)" class="text-gray-300 hover:text-red-500 shrink-0"><X class="w-4 h-4" /></button>
            </div>

            <!-- Balance indicator -->
            <div class="flex justify-between items-center px-1 py-1.5"
              :class="posStore.splitBalance > 0 ? 'text-orange-600' : 'text-green-600'">
              <span class="text-sm font-semibold">{{ posStore.splitBalance > 0 ? 'Remaining' : 'Change' }}</span>
              <span class="text-xl font-bold">₱{{ Math.abs(posStore.splitBalance).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
            </div>

            <!-- Change denomination breakdown -->
            <div v-if="posStore.splitBalance < 0 && changeDenoms.length"
              class="bg-green-50 border border-green-200 rounded-xl p-3">
              <p class="text-xs font-semibold text-green-700 mb-2">Change Breakdown</p>
              <div class="flex flex-wrap gap-2">
                <div v-for="d in changeDenoms" :key="d.value"
                  class="flex items-center gap-1 bg-white border border-green-200 rounded-lg px-2.5 py-1.5 text-xs">
                  <span class="font-semibold text-green-700">₱{{ d.value.toLocaleString() }}</span>
                  <span class="text-gray-400">×</span>
                  <span class="font-bold text-gray-800">{{ d.count }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Method selector -->
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {{ posStore.splitPayments.length ? 'Add Another Payment' : 'Select Payment Method' }}
            </p>
            <div class="grid grid-cols-3 gap-1.5">
              <button v-for="m in allPaymentMethods" :key="m.label"
                @click="selectPaymentMethod(m)"
                class="py-2.5 px-2 rounded-xl text-xs font-semibold border transition-colors"
                :class="pmInput.method === m.label
                  ? `${m.color} ring-2 ${m.ring} border-transparent`
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'">
                <span class="block text-base mb-0.5">{{ m.icon }}</span>
                {{ m.label }}
              </button>
            </div>
          </div>

          <!-- Method-specific input panel -->
          <div v-if="pmInput.method" class="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <p class="text-xs font-semibold text-gray-600">{{ pmInput.method }}</p>

            <!-- Store Credit: validate customer -->
            <div v-if="pmInput.method === 'Store Credit'">
              <div v-if="!selectedCustomer" class="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                ⚠ Select a customer first to use store credit
              </div>
              <div v-else class="flex justify-between text-sm mb-2">
                <span class="text-gray-600">{{ selectedCustomer.firstName }}'s available credit</span>
                <span class="font-bold text-blue-600">₱{{ selectedCustomer.storeCreditBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
              </div>
            </div>

            <!-- Account Sale: credit check -->
            <div v-if="pmInput.method === 'Account'">
              <div v-if="!selectedCustomer" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                ⚠ Select a customer first to use account / utang
              </div>
              <div v-else>
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 text-sm mb-2">
                  <div class="flex justify-between"><span class="text-gray-500">Customer</span><span class="font-semibold text-gray-800">{{ selectedCustomer.firstName }} {{ selectedCustomer.lastName }}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Credit Limit</span><span class="font-medium text-gray-700">₱{{ (selectedCustomer.creditLimit || 0).toLocaleString() }}</span></div>
                  <div class="flex justify-between"><span class="text-gray-500">Current Balance (owed)</span><span :class="(selectedCustomer.currentBalance || 0) > 0 ? 'text-red-600 font-semibold' : 'text-gray-700'">₱{{ (selectedCustomer.currentBalance || 0).toLocaleString() }}</span></div>
                  <div class="flex justify-between border-t border-gray-200 pt-1.5">
                    <span class="text-gray-500">Available Credit</span>
                    <span :class="availableCredit >= 0 ? 'text-green-700 font-bold' : 'text-red-600 font-bold'">₱{{ availableCredit.toLocaleString() }}</span>
                  </div>
                </div>
                <div v-if="availableCredit < (pmInput.amount || pmReqAmount)" class="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 mb-2">
                  ⚠ Insufficient credit. Customer needs ₱{{ ((pmInput.amount || pmReqAmount) - availableCredit).toFixed(2) }} more credit.
                </div>
              </div>
            </div>

            <!-- Amount input -->
            <div v-if="(pmInput.method !== 'Store Credit' && pmInput.method !== 'Account') || selectedCustomer">
              <label class="block text-xs font-medium text-gray-600 mb-1">Amount (₱)</label>
              <input v-model.number="pmInput.amount" type="number" min="0.01" step="0.01"
                class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xl font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />

              <!-- Cash: quick tender buttons -->
              <div v-if="pmInput.method === 'Cash'" class="flex flex-wrap gap-1.5 mt-2">
                <button v-for="amt in quickTenders" :key="amt" @click="pmInput.amount = amt"
                  class="px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors"
                  :class="pmInput.amount === amt ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50 bg-white'">
                  {{ amt === pmInput.exactAmount ? 'Exact' : `₱${amt.toLocaleString()}` }}
                </button>
              </div>

              <!-- Cash: projected change -->
              <div v-if="pmInput.method === 'Cash' && pmInput.amount > 0" class="mt-2">
                <div v-if="pmInput.amount >= pmReqAmount" class="flex justify-between items-center bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span class="text-xs font-semibold text-green-700">Change</span>
                  <span class="text-lg font-bold text-green-700">₱{{ (pmInput.amount - pmReqAmount).toFixed(2) }}</span>
                </div>
                <div v-else class="flex justify-between items-center bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                  <span class="text-xs text-orange-600">Insufficient</span>
                  <span class="text-sm font-semibold text-orange-600">₱{{ (pmReqAmount - pmInput.amount).toFixed(2) }} more needed</span>
                </div>
                <!-- Denomination breakdown for projected change -->
                <div v-if="pmInput.amount >= pmReqAmount && pmChangeBreakdown.length" class="mt-2 flex flex-wrap gap-1.5">
                  <div v-for="d in pmChangeBreakdown" :key="d.value"
                    class="flex items-center gap-1 bg-white border border-green-200 rounded-lg px-2 py-1 text-xs">
                    <span class="font-semibold text-green-600">₱{{ d.value.toLocaleString() }}</span>
                    <span class="text-gray-400">×{{ d.count }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bank Transfer: reference number -->
            <div v-if="pmInput.method === 'Bank Transfer'">
              <label class="block text-xs font-medium text-gray-600 mb-1">Reference Number <span class="text-red-500">*</span></label>
              <input v-model="pmInput.referenceNo" type="text" placeholder="e.g. 20240603-1234"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <!-- Gift Voucher: code + live balance check -->
            <div v-if="pmInput.method === 'Gift Voucher'" class="space-y-2">
              <label class="block text-xs font-medium text-gray-600">Voucher Code <span class="text-red-500">*</span></label>
              <div class="flex gap-2">
                <input v-model="pmInput.voucherCode" type="text" placeholder="GV-ABCD1234"
                  class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  @keydown.enter="lookupVoucher" @input="voucherLookup = null" />
                <button @click="lookupVoucher"
                  class="px-3 py-2 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 transition-colors whitespace-nowrap">
                  Check
                </button>
              </div>

              <!-- Voucher lookup result -->
              <div v-if="voucherLookup">
                <!-- Valid -->
                <div v-if="voucherLookup.ok"
                  class="bg-green-50 border border-green-200 rounded-xl p-3 space-y-1.5">
                  <div class="flex items-center gap-2">
                    <span class="text-green-600 font-bold text-sm">✓ Valid Voucher</span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                      :class="voucherStatusBadge(voucherLookup.computedStatus)">
                      {{ voucherLookup.computedStatus.replace('_',' ') }}
                    </span>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span class="text-gray-500">Face Value</span>
                      <p class="font-semibold text-gray-800">₱{{ voucherLookup.voucher.originalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
                    </div>
                    <div>
                      <span class="text-gray-500">Remaining Balance</span>
                      <p class="font-bold text-green-700 text-base">₱{{ voucherLookup.voucher.remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
                    </div>
                    <div v-if="voucherLookup.voucher.expiresAt">
                      <span class="text-gray-500">Expires</span>
                      <p class="font-medium text-gray-700">{{ voucherLookup.voucher.expiresAt }}</p>
                    </div>
                    <div v-if="voucherLookup.voucher.issuedTo">
                      <span class="text-gray-500">Issued To</span>
                      <p class="font-medium text-gray-700">{{ voucherLookup.voucher.issuedTo }}</p>
                    </div>
                  </div>
                </div>
                <!-- Invalid -->
                <div v-else class="bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span class="text-red-500 font-bold">✗</span>
                  <span class="text-sm text-red-600">{{ voucherLookup.error }}</span>
                </div>
              </div>
            </div>

            <p v-if="pmError" class="text-xs text-red-600 font-medium">{{ pmError }}</p>

            <button @click="addPaymentEntry"
              :disabled="isAddPaymentDisabled"
              class="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors">
              + Add ₱{{ (pmInput.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }} {{ pmInput.method }}
            </button>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t border-gray-200 space-y-3 shrink-0">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="shouldPrint" class="rounded" />
            <span class="text-xs text-gray-600">Print receipt after sale</span>
          </label>
          <div class="flex gap-3">
            <button @click="cancelPayment" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
            <button @click="completeSale" :disabled="!posStore.splitComplete || checkoutLoading"
              class="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              <span v-if="checkoutLoading" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else>✓</span>
              {{ checkoutLoading ? 'Processing...' : 'Complete Sale' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ RECEIPT / CHANGE MODAL ══ -->
    <div v-if="receipt" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[95vh]">

        <!-- ── Change due header ── -->
        <div class="bg-green-500 rounded-t-2xl px-6 py-5 text-center text-white shrink-0">
          <div class="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 class="w-6 h-6" />
          </div>
          <p class="text-xs font-semibold uppercase tracking-widest opacity-80">Sale Complete</p>

          <!-- Change -->
          <template v-if="(receipt.change || 0) > 0">
            <p class="text-5xl font-black mt-2 tracking-tight">
              ₱{{ (receipt.change || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </p>
            <p class="text-sm opacity-75 mt-0.5">Change Due</p>
            <!-- Denomination breakdown -->
            <div v-if="changeDenoms.length" class="flex flex-wrap justify-center gap-1.5 mt-3">
              <span v-for="d in changeDenoms" :key="d.value"
                class="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                {{ d.count }}×₱{{ d.value }}
              </span>
            </div>
          </template>
          <template v-else>
            <p class="text-2xl font-bold mt-2">No Change</p>
          </template>

          <p class="text-sm opacity-70 mt-2">Paid: ₱{{ (receipt.amountPaid ?? receipt.total ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</p>
        </div>

        <!-- ── Receipt slip (scrollable) ── -->
        <div class="overflow-y-auto flex-1">
          <div id="receipt-print" class="p-5">
            <!-- Store header -->
            <div class="text-center mb-3">
              <p class="font-bold text-sm">{{ settingsStore.config.storeName }}</p>
              <p v-if="settingsStore.config.storeAddress" class="text-xs text-gray-500 mt-0.5">{{ settingsStore.config.storeAddress }}</p>
              <p v-if="settingsStore.config.storePhone"   class="text-xs text-gray-500">{{ settingsStore.config.storePhone }}</p>
              <p v-if="settingsStore.config.storeTIN"     class="text-xs text-gray-500">TIN: {{ settingsStore.config.storeTIN }}</p>
              <p v-if="settingsStore.config.receiptHeader" class="text-xs text-gray-400 mt-1 italic">{{ settingsStore.config.receiptHeader }}</p>
              <div class="border-t border-dashed border-gray-300 my-2"></div>
              <p class="font-semibold text-xs tracking-wide">OFFICIAL RECEIPT</p>
              <p class="text-xs text-gray-400 font-mono mt-0.5">{{ receipt.receiptNumber ?? receipt.id }}</p>
              <p class="text-xs text-gray-400">{{ new Date(receipt.createdAt ?? receipt.date).toLocaleString('en-PH') }}</p>
              <p v-if="settingsStore.config.showCashierOnReceipt && receipt.cashier" class="text-xs text-gray-500 mt-0.5">Cashier: {{ receipt.cashier }}</p>
              <p v-if="settingsStore.config.showCustomerOnReceipt && receipt.customer" class="text-xs text-gray-500">Customer: {{ receipt.customer }}</p>
            </div>

            <!-- Items -->
            <div class="border-t border-dashed border-gray-300 py-2 space-y-1.5">
              <div v-for="item in receipt.items" :key="item.id ?? item.productId">
                <div class="flex justify-between text-xs">
                  <span class="font-medium">{{ item.name ?? item.productName }}</span>
                  <span>₱{{ ((item.unitPrice ?? item.sellingPrice ?? 0) * (item.quantity ?? item.qty ?? 1) - (item.discountAmount ?? 0)).toFixed(2) }}</span>
                </div>
                <div class="text-xs text-gray-400 pl-2">
                  {{ item.quantity ?? item.qty }} × ₱{{ item.unitPrice ?? item.sellingPrice }}
                  <span v-if="item.discountAmount > 0"> (−₱{{ item.discountAmount.toFixed(2) }})</span>
                </div>
              </div>
            </div>

            <!-- Totals -->
            <div class="border-t border-dashed border-gray-300 pt-2 space-y-0.5">
              <div class="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span>₱{{ receipt.subtotal.toFixed(2) }}</span>
              </div>
              <div v-if="receipt.discountTotal > 0"
                class="flex justify-between text-xs text-red-500">
                <span>Discount</span>
                <span>−₱{{ receipt.discountTotal.toFixed(2) }}</span>
              </div>
              <div v-if="settingsStore.config.showTaxBreakdown && (receipt.taxAmount ?? 0) > 0"
                class="flex justify-between text-xs text-gray-500">
                <span>{{ settingsStore.config.taxName }} {{ settingsStore.config.taxRate }}%</span>
                <span>₱{{ parseFloat(receipt.taxAmount ?? 0).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm font-bold text-gray-900 border-t border-dashed border-gray-300 pt-1 mt-1">
                <span>TOTAL</span>
                <span>₱{{ receipt.total.toFixed(2) }}</span>
              </div>
              <!-- Payments -->
              <div v-for="p in (receipt.payments ?? [])" :key="p.method ?? p.paymentMethod"
                class="flex justify-between text-xs text-gray-500">
                <span>{{ p.method ?? p.paymentMethod }}</span>
                <span>₱{{ (p.amount ?? 0).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-xs font-semibold text-gray-800">
                <span>Amount Paid</span>
                <span>₱{{ (receipt.amountPaid ?? receipt.total ?? 0).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-sm font-bold" :class="(receipt.change || 0) > 0 ? 'text-green-600' : 'text-gray-700'">
                <span>Change</span>
                <span>₱{{ (receipt.change || 0).toFixed(2) }}</span>
              </div>
            </div>

            <!-- Footer -->
            <div v-if="settingsStore.config.receiptFooter" class="text-center mt-3">
              <div class="border-t border-dashed border-gray-300 mb-2"></div>
              <p class="text-xs text-gray-400 italic">{{ settingsStore.config.receiptFooter }}</p>
            </div>
          </div>
        </div>

        <!-- ── Action buttons ── -->
        <div class="px-5 py-4 border-t border-gray-100 flex gap-2 shrink-0">
          <button @click="receipt = null"
            class="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            New Sale
          </button>
          <button @click="printReceipt"
            class="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
            <Printer class="w-4 h-4" /> Print Receipt
          </button>
        </div>
      </div>
    </div>

    <!-- ══ HELD TRANSACTIONS MODAL (enhanced) ══ -->
    <div v-if="showHeld" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <PauseCircle class="w-5 h-5 text-orange-500" />
            Held Transactions
            <span class="text-sm font-normal text-gray-400">({{ posStore.heldTransactions.length }})</span>
          </h2>
          <button @click="showHeld = false" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>

        <!-- Search by customer name or hold # -->
        <div class="px-5 pt-4 pb-2" v-if="posStore.heldTransactions.length > 2">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input v-model="heldSearch" type="text" placeholder="Search by customer or hold #..."
              class="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>

        <div class="px-5 py-3 max-h-80 overflow-y-auto space-y-3">
          <div v-if="!filteredHeld.length" class="text-center py-8 text-gray-400 text-sm">No held transactions</div>
          <div v-for="held in filteredHeld" :key="held.id"
            class="border border-gray-200 rounded-xl p-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors">
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <!-- Hold number badge -->
                <div class="flex items-center gap-2 mb-1">
                  <span class="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                    Hold #{{ held.holdNumber }}
                  </span>
                  <span class="text-xs text-gray-400">{{ heldTimeAgo(held.heldAt) }}</span>
                </div>
                <!-- Customer -->
                <p v-if="held.customer?.name" class="text-sm font-semibold text-gray-800">
                  {{ held.customer.name }}
                </p>
                <p v-else class="text-sm text-gray-400 italic">No customer</p>
                <!-- Items summary -->
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ held.items.length }} item(s) —
                  {{ held.items.slice(0,2).map(i => i.name.split(' ')[0]).join(', ') }}{{ held.items.length > 2 ? '...' : '' }}
                </p>
                <!-- Reason -->
                <p v-if="held.reason" class="text-xs text-orange-600 mt-0.5">{{ held.reason }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-bold text-gray-800">₱{{ held.items.reduce((s,i)=>s+(i.sellingPrice*i.qty*(1-(i.lineDiscount||0)/100)),0).toFixed(2) }}</p>
                <button @click="resumeHeld(held.id)"
                  class="mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-1">
                  <PlayCircle class="w-3.5 h-3.5" /> Resume
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-gray-100">
          <button @click="showHeld = false" class="w-full py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Close</button>
        </div>
      </div>
    </div>

    <!-- ══ PETTY CASH OUT MODAL ══ -->
    <div v-if="showCashOut" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Petty Cash Out</h2>
        <div class="space-y-3">
          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1">Amount (₱)</label>
            <input v-model.number="cashOutForm.amount" type="number" min="1"
              class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-right" />
          </div>
          <div>
            <label class="text-xs font-medium text-gray-600 block mb-1">Reason</label>
            <input v-model="cashOutForm.reason" placeholder="e.g. Buy tape"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div class="flex gap-3 mt-5">
          <button @click="showCashOut = false" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600">Cancel</button>
          <button @click="processCashOut" :disabled="!cashOutForm.amount || !cashOutForm.reason"
            class="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-40">Confirm</button>
        </div>
      </div>
    </div>

    <!-- ══ CUSTOMER SEARCH MODAL ══ -->
    <div v-if="showCustomerSearch" class="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-16">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
          <Search class="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref="custSearchInput"
            v-model="custQuery"
            type="text"
            placeholder="Name, phone number, or customer code..."
            class="flex-1 text-sm border-none outline-none text-gray-800"
          />
          <button @click="showCustomerSearch = false" class="text-gray-400 hover:text-gray-600 shrink-0"><X class="w-5 h-5" /></button>
        </div>

        <div class="max-h-80 overflow-y-auto">
          <!-- Idle state -->
          <div v-if="!custQuery" class="px-5 py-8 text-center text-gray-400 text-sm">
            <UserCircle class="w-8 h-8 mx-auto mb-2 opacity-40" />
            Start typing to search customers
          </div>
          <!-- No results -->
          <div v-else-if="!custResults.length" class="px-5 py-6 text-center text-gray-400 text-sm">
            No customer found for "{{ custQuery }}"
          </div>
          <!-- Results -->
          <div v-else class="divide-y divide-gray-100">
            <div v-for="c in custResults" :key="c.id"
              class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
              <div :class="typeBadgeColor(c.customerType)" class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {{ c.firstName[0] }}{{ c.lastName[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-semibold text-gray-900">{{ c.firstName }} {{ c.lastName }}</p>
                  <span :class="typeBadgeColor(c.customerType)" class="text-xs px-1.5 py-0.5 rounded-full font-medium capitalize">{{ c.customerType }}</span>
                </div>
                <p class="text-xs text-gray-400 mt-0.5">
                  {{ c.phone }}
                  <span class="ml-2 text-amber-600">{{ c.loyaltyPoints }} pts</span>
                  <span v-if="c.currentBalance > 0" class="ml-2 text-red-500 font-medium">₱{{ c.currentBalance }} owed</span>
                  <span v-if="c.storeCreditBalance > 0" class="ml-2 text-blue-600">₱{{ c.storeCreditBalance }} credit</span>
                </p>
              </div>
              <button @click="selectCustomer(c)"
                class="shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Select
              </button>
            </div>
          </div>
        </div>

        <!-- Footer: register new -->
        <div class="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span class="text-xs text-gray-400">Can't find customer?</span>
          <button @click="openFastReg"
            class="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            <Plus class="w-3.5 h-3.5" /> Register New
          </button>
        </div>
      </div>
    </div>

    <!-- ══ FAST CUSTOMER REGISTRATION MODAL ══ -->
    <div v-if="showFastReg" class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <UserCircle class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">Register New Customer</h3>
            <p class="text-xs text-gray-400">Quick registration — takes 10 seconds</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">First Name <span class="text-red-500">*</span></label>
            <input v-model="regForm.firstName" type="text" placeholder="Ana"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Last Name <span class="text-red-500">*</span></label>
            <input v-model="regForm.lastName" type="text" placeholder="Reyes"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Mobile Number <span class="text-red-500">*</span></label>
            <input v-model="regForm.phone" type="tel" placeholder="09XX-XXX-XXXX"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Customer Type</label>
            <div class="grid grid-cols-4 gap-1.5">
              <button v-for="t in ['regular','vip','credit','wholesale']" :key="t"
                @click="regForm.customerType = t"
                class="py-1.5 text-xs font-medium rounded-lg border transition-colors capitalize"
                :class="regForm.customerType === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-300'">
                {{ t }}
              </button>
            </div>
          </div>
        </div>

        <p v-if="regError" class="text-sm text-red-600">{{ regError }}</p>

        <div class="flex gap-3 pt-1">
          <button @click="showFastReg = false; regError = ''" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="submitFastReg" class="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
            Register & Select
          </button>
        </div>
      </div>
    </div>

    <!-- ══ HOLD SALE MODAL ══ -->
    <div v-if="showHoldModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <PauseCircle class="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">Hold Sale</h3>
            <p class="text-xs text-gray-400">{{ posStore.cart.length }} item(s) · ₱{{ posStore.total.toFixed(2) }}</p>
          </div>
        </div>

        <div v-if="selectedCustomer" class="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
          Customer: <strong>{{ selectedCustomer.firstName }} {{ selectedCustomer.lastName }}</strong>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Hold Reason</label>
          <div class="grid grid-cols-1 gap-1.5">
            <button v-for="r in holdReasons" :key="r"
              @click="holdReason = r"
              class="text-left px-3 py-2 rounded-lg border text-xs font-medium transition-colors"
              :class="holdReason === r ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'">
              {{ r }}
            </button>
          </div>
        </div>

        <div class="flex gap-3">
          <button @click="showHoldModal = false" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="confirmHold"
            class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600">
            <PauseCircle class="w-4 h-4" /> Hold Sale
          </button>
        </div>
      </div>
    </div>

    <!-- ══ REPRINT RECEIPT MODAL ══ -->
    <div v-if="showReprint" class="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-16">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Printer class="w-5 h-5 text-gray-500" /> Reprint Receipt
          </h3>
          <button @click="showReprint = false; reprintTxn = null; reprintError = ''" class="text-gray-400 hover:text-gray-600"><X class="w-5 h-5" /></button>
        </div>

        <div class="p-5 space-y-4">
          <!-- Search bar -->
          <div class="flex gap-2">
            <input
              v-model="reprintQuery"
              type="text"
              placeholder="Receipt number, e.g. REC-001"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              @keydown.enter="lookupReprint"
              @input="reprintTxn = null; reprintError = ''"
            />
            <button @click="lookupReprint" :disabled="reprintLoading"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2">
              <span v-if="reprintLoading" class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else>Search</span>
            </button>
          </div>

          <!-- Error -->
          <p v-if="reprintError" class="text-sm text-red-600">{{ reprintError }}</p>

          <!-- Found transaction preview -->
          <div v-if="reprintTxn" class="border border-gray-200 rounded-xl overflow-hidden">
            <div class="bg-gray-50 px-4 py-3 flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold font-mono text-blue-600">{{ reprintTxn.receiptNumber ?? reprintTxn.id }}</p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ new Date(reprintTxn.createdAt ?? reprintTxn.date).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) }}
                </p>
                <p v-if="reprintTxn.customerName ?? reprintTxn.customer" class="text-xs text-gray-500">
                  Customer: {{ reprintTxn.customerName ?? reprintTxn.customer }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-lg font-black text-gray-900">₱{{ reprintTxn.total.toFixed(2) }}</p>
                <span :class="reprintTxn.status === 'voided' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'"
                  class="text-xs px-2 py-0.5 rounded-full font-semibold capitalize">{{ reprintTxn.status }}</span>
              </div>
            </div>
            <div v-if="reprintTxn.status === 'voided'" class="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 flex items-center gap-2">
              <span class="font-bold">⚠</span> This transaction was voided.
            </div>
            <div class="px-4 py-3 space-y-1">
              <div v-for="item in (reprintTxn.items ?? []).slice(0, 3)" :key="item.id ?? item.productId" class="flex justify-between text-xs text-gray-600">
                <span>{{ item.quantity }}× {{ item.productName ?? item.name }}</span>
                <span class="font-medium">₱{{ item.lineTotal.toFixed(2) }}</span>
              </div>
              <p v-if="(reprintTxn.items ?? []).length > 3" class="text-xs text-gray-400">+ {{ reprintTxn.items.length - 3 }} more items</p>
              <p v-if="!(reprintTxn.items ?? []).length" class="text-xs text-gray-400 italic">Item details not available</p>
            </div>
            <div class="px-4 py-2 border-t border-gray-100 flex gap-2 flex-wrap">
              <span v-for="p in (reprintTxn.payments ?? [])" :key="p.paymentMethod ?? p.method"
                class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {{ p.paymentMethod ?? p.method }} ₱{{ (p.amount ?? 0).toFixed(2) }}
              </span>
            </div>
          </div>

          <!-- Recent transactions quick-pick -->
          <div v-if="!reprintTxn && txnStore.todayTransactions.length">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Today's Transactions</p>
            <div class="space-y-1.5 max-h-48 overflow-y-auto">
              <button v-for="t in txnStore.todayTransactions.slice(0, 8)" :key="t.id"
                @click="reprintQuery = t.receiptNumber ?? t.id?.toString(); lookupReprint()"
                class="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-xs hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
                <div>
                  <span class="font-mono font-semibold text-blue-600">{{ t.receiptNumber ?? t.id }}</span>
                  <span class="text-gray-400 ml-2">{{ new Date(t.createdAt ?? t.date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) }}</span>
                </div>
                <span class="font-semibold text-gray-800">₱{{ t.total.toFixed(2) }}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button @click="showReprint = false; reprintTxn = null; reprintError = ''" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button @click="printReprintReceipt"
            :disabled="!reprintTxn"
            class="flex items-center justify-center gap-2 flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors">
            <Printer class="w-4 h-4" /> Print Receipt
          </button>
        </div>
      </div>
    </div>

    <!-- ══ PRICE OVERRIDE MODAL ══ -->
    <div v-if="showPriceOverride && priceOverrideItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Pencil class="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-gray-800">Price Override</h3>
            <p class="text-xs text-gray-400 truncate max-w-48">{{ priceOverrideItem.name }}</p>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs text-gray-500 mb-1">
            <span>Original price</span>
            <span class="font-medium">₱{{ (priceOverrideItem._originalPrice || priceOverrideItem.sellingPrice).toFixed(2) }}</span>
          </div>
          <label class="block text-xs font-medium text-gray-600 mb-1">New Price (₱) <span class="text-red-500">*</span></label>
          <input v-model.number="priceOverrideValue" type="number" min="0" step="0.01"
            class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xl font-bold text-right focus:outline-none focus:ring-2 focus:ring-orange-400" />
          <p class="text-xs text-orange-600 mt-1 flex items-center gap-1">
            <span>⚠</span> Manager approval required
          </p>
        </div>
        <div class="flex gap-3">
          <button @click="showPriceOverride = false; priceOverrideItem = null" class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button @click="requestPriceOverride"
            :disabled="!priceOverrideValue || priceOverrideValue <= 0"
            class="flex-1 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-40">
            Request Override
          </button>
        </div>
      </div>
    </div>

    <!-- ══ MANAGER PIN MODAL ══ -->
    <ManagerPinModal
      v-if="showManagerPin"
      :title="pinContext === 'price_override' ? 'Approve Price Override' : 'Manager Approval'"
      :description="pinContext === 'price_override' ? `Set price to ₱${priceOverrideValue} for ${priceOverrideItem?.name}` : ''"
      @approved="onManagerPinApproved"
      @cancel="showManagerPin = false; pinContext = null"
    />

    <!-- ══ DISCOUNT MODAL ══ -->
    <DiscountModal
      v-if="discountTarget !== undefined"
      :scope="discountTarget === 'transaction' ? 'transaction' : 'line'"
      :target-name="discountTarget === 'transaction' ? 'Entire Transaction' : discountTarget?.name"
      :original-amount="discountTarget === 'transaction' ? posStore.subtotal : (discountTarget?.sellingPrice * discountTarget?.qty)"
      :current-pct="discountTarget === 'transaction' ? posStore.transactionDiscount : discountTarget?.lineDiscount"
      :current-type="discountTarget === 'transaction' ? posStore.txnDiscountType : discountTarget?.lineDiscountType"
      @apply="handleDiscountApply"
      @remove="handleDiscountRemove"
      @close="discountTarget = undefined"
    />

  </div>
</template>

<script setup>
import { ref, computed, reactive, nextTick, onMounted, watch } from 'vue'
import { usePosStore }       from '@/stores/pos'
import { useProductStore }   from '@/stores/products'
import { useToastStore }     from '@/stores/toast'
import { useSettingsStore }  from '@/stores/settings'
import { useShiftStore }     from '@/stores/shifts'
import { useAuthStore }      from '@/stores/auth'
import { useCustomerStore }     from '@/stores/customers'
import { useVoucherStore }      from '@/stores/vouchers'
import { useTransactionStore }  from '@/stores/transactions'
import { useRoute }             from 'vue-router'
import DiscountModal      from '@/components/pos/DiscountModal.vue'
import ManagerPinModal    from '@/components/shared/ManagerPinModal.vue'
import {
  Search, ShoppingCart, X, Minus, Printer, ScanSearch,
  Trash2, Package, PauseCircle, PlayCircle, CreditCard, UserCircle, Tag, Plus, Pencil, ChevronLeft,
  CheckCircle2
} from '@lucide/vue'

const posStore      = usePosStore()
const productStore  = useProductStore()
const toast         = useToastStore()
const settingsStore = useSettingsStore()
const shiftStore    = useShiftStore()
const authStore     = useAuthStore()
const custStore     = useCustomerStore()
const voucherStore  = useVoucherStore()
const txnStore      = useTransactionStore()
const route         = useRoute()

// Auto-open reprint modal if navigated here with ?reprint=1
onMounted(() => {
  if (route.query.reprint) showReprint.value = true
  // Load all products for in-memory browsing — POS needs the full list, not a paginated slice
  productStore.fetchAll({ perPage: 500 })
})

// ── State ──
const search          = ref('')
const activeCat       = ref(null)
const showPayment     = ref(false)
const showHeld        = ref(false)
const showCashOut       = ref(false)
const showClearConfirm  = ref(false)
const showPriceCheck    = ref(false)
const showReprint       = ref(false)
const showPriceOverride = ref(false)
const shouldPrint     = ref(true)
const receipt         = ref(null)
const cashOutForm     = ref({ amount: 0, reason: '' })
const pcQuery         = ref('')
const pcInput         = ref(null)
const searchInput     = ref(null)
const heldSearch      = ref('')

// ── Customer lookup ──
const showCustomerSearch = ref(false)
const custQuery          = ref('')
const custSearchInput    = ref(null)
const selectedCustomer   = ref(posStore.customer?.id ? custStore.getById(posStore.customer.id) : null)

// Local filter — customers already loaded on startup, no API call needed per keystroke
const custResults = computed(() => {
  const q = custQuery.value.trim().toLowerCase()
  if (!q) return []
  return custStore.customers.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
    c.phone?.includes(q) ||
    c.code?.toLowerCase().includes(q)
  ).slice(0, 8)
})

function selectCustomer(c) {
  selectedCustomer.value = c
  posStore.customer = { id: c.id, name: `${c.firstName} ${c.lastName}` }
  showCustomerSearch.value = false
  showFastReg.value = false
  custQuery.value = ''
  toast.success(`${c.firstName} ${c.lastName} selected`)
}

function clearSelectedCustomer() {
  selectedCustomer.value = null
  posStore.customer = null
}

function typeBadgeColor(type) {
  return {
    regular:   'bg-gray-100 text-gray-600',
    vip:       'bg-purple-100 text-purple-700',
    credit:    'bg-orange-100 text-orange-700',
    wholesale: 'bg-blue-100 text-blue-700',
  }[type] || 'bg-gray-100 text-gray-600'
}

// ── Fast Registration ──
const showFastReg = ref(false)
const regError    = ref('')
const regForm     = reactive({ firstName: '', lastName: '', phone: '', customerType: 'regular' })

function openFastReg() {
  showCustomerSearch.value = false
  Object.assign(regForm, { firstName: '', lastName: '', phone: custQuery.value.includes('09') ? custQuery.value : '', customerType: 'regular' })
  regError.value = ''
  showFastReg.value = true
}

async function submitFastReg() {
  regError.value = ''
  if (!regForm.firstName.trim() || !regForm.lastName.trim()) { regError.value = 'First and last name required.'; return }
  if (!regForm.phone.trim()) { regError.value = 'Mobile number required.'; return }
  try {
    const newCustomer = await custStore.fastRegister({ ...regForm })
    selectCustomer(newCustomer)
    toast.success(`${newCustomer.firstName} ${newCustomer.lastName} registered and selected`)
    showFastReg.value = false
  } catch (e) {
    regError.value = e?.response?.data?.message ?? e.message ?? 'Registration failed.'
  }
}

// ── Hold Sale ──
const showHoldModal = ref(false)
const holdReason    = ref('')
const holdReasons   = [
  'Customer forgot wallet',
  'Customer still shopping',
  'Customer checking price',
  'Customer on the phone',
  'Other — will return shortly',
]

function confirmHold() {
  const num = posStore.holdTransaction(holdReason.value)
  clearSelectedCustomer()
  showHoldModal.value = false
  holdReason.value = ''
  toast.success(`Sale held as Hold #${num}`)
}

// ── Held transaction helpers ──
const filteredHeld = computed(() => {
  const q = heldSearch.value.toLowerCase()
  if (!q) return posStore.heldTransactions
  return posStore.heldTransactions.filter(h =>
    `#${h.holdNumber}`.includes(heldSearch.value) ||
    (h.customer?.name || '').toLowerCase().includes(q) ||
    (h.reason || '').toLowerCase().includes(q)
  )
})

function heldTimeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  return `${Math.floor(m / 60)}h ago`
}

// ── Payment methods config (icon + color for the method grid) ──
const allPaymentMethods = [
  { label: 'Cash',          icon: '💵', color: 'bg-green-50 text-green-700',   ring: 'ring-green-400'   },
  { label: 'GCash',         icon: '📱', color: 'bg-blue-50 text-blue-700',     ring: 'ring-blue-400'    },
  { label: 'Maya',          icon: '💜', color: 'bg-purple-50 text-purple-700', ring: 'ring-purple-400'  },
  { label: 'QRPH',          icon: '🔲', color: 'bg-teal-50 text-teal-700',     ring: 'ring-teal-400'    },
  { label: 'Debit',         icon: '💳', color: 'bg-indigo-50 text-indigo-700', ring: 'ring-indigo-400'  },
  { label: 'Credit',        icon: '💳', color: 'bg-orange-50 text-orange-700', ring: 'ring-orange-400'  },
  { label: 'Store Credit',  icon: '🏷',  color: 'bg-pink-50 text-pink-700',    ring: 'ring-pink-400'    },
  { label: 'Bank Transfer', icon: '🏦', color: 'bg-gray-100 text-gray-700',    ring: 'ring-gray-400'    },
  { label: 'Gift Voucher',  icon: '🎁', color: 'bg-yellow-50 text-yellow-700', ring: 'ring-yellow-400'  },
  { label: 'Account',       icon: '📒', color: 'bg-red-50 text-red-700',     ring: 'ring-red-400'     },
]
const paymentMethods = allPaymentMethods.map(m => m.label)

// ── Payment input state ──
const pmInput = reactive({
  method:      null,
  amount:      0,
  referenceNo: '',
  voucherCode: '',
  exactAmount: 0, // cached exact for "Exact" quick tender button
})
const pmError = ref('')

// Amount needed for the current payment entry
const pmReqAmount = computed(() =>
  posStore.splitBalance > 0 ? posStore.splitBalance : posStore.total
)

// Quick tender amounts for Cash
const quickTenders = computed(() => {
  const req = pmReqAmount.value
  pmInput.exactAmount = parseFloat(req.toFixed(2))
  const candidates = new Set([parseFloat(req.toFixed(2))])
  ;[50, 100, 500, 1000, 2000].forEach(r => {
    const rounded = Math.ceil(req / r) * r
    if (rounded >= req) candidates.add(rounded)
  })
  return [...candidates].sort((a, b) => a - b).slice(0, 5)
})

// Change denomination breakdown for the payment input
const pmChangeBreakdown = computed(() => {
  if (pmInput.method !== 'Cash' || pmInput.amount <= pmReqAmount.value) return []
  return calcChangeDenominations(pmInput.amount - pmReqAmount.value)
})

// Change denomination breakdown — used in payment panel and in receipt modal
const changeDenoms = computed(() => {
  const change = receipt.value
    ? (receipt.value.change || 0)
    : (posStore.splitBalance < 0 ? Math.abs(posStore.splitBalance) : 0)
  return change > 0 ? calcChangeDenominations(change) : []
})

function calcChangeDenominations(change) {
  const denoms = [1000, 500, 200, 100, 50, 20, 10, 5, 1]
  const result = []
  let remaining = Math.round(change * 100) // work in cents to avoid float issues
  for (const d of denoms) {
    const dCents = d * 100
    if (remaining >= dCents) {
      const count = Math.floor(remaining / dCents)
      result.push({ value: d, count })
      remaining -= dCents * count
    }
  }
  return result
}

// ── Account Sale: available credit ──
const availableCredit = computed(() => {
  if (!selectedCustomer.value) return 0
  return Math.max(0, (selectedCustomer.value.creditLimit || 0) - (selectedCustomer.value.currentBalance || 0))
})

// ── Reprint Receipt ──
const reprintQuery   = ref('')
const reprintTxn     = ref(null)
const reprintError   = ref('')
const reprintLoading = ref(false)

async function lookupReprint() {
  reprintError.value = ''
  reprintTxn.value   = null
  const q = reprintQuery.value.trim()
  if (!q) return

  reprintLoading.value = true
  try {
    // 1. Try local store first
    let txn = txnStore.getById(q)

    // 2. If not found locally OR items are missing, fetch full record from API
    if (!txn || !txn.items?.length) {
      try {
        // Try receipt number endpoint first
        const { data } = await api.get(`/transactions/receipt/${encodeURIComponent(q.toUpperCase())}`)
        txn = txnStore.normalize(data.data)
      } catch {
        try {
          // Fall back to ID lookup
          const { data } = await api.get(`/transactions/${encodeURIComponent(q)}`)
          txn = txnStore.normalize(data.data)
        } catch {
          txn = null
        }
      }
    }

    if (!txn) {
      reprintError.value = 'Transaction not found. Check the receipt number.'
      return
    }
    reprintTxn.value = txn
  } finally {
    reprintLoading.value = false
  }
}

function printReprintReceipt() {
  if (!reprintTxn.value) return
  const t = reprintTxn.value

  const receiptNo   = t.receiptNumber ?? t.id ?? ''
  const dateStr     = new Date(t.createdAt ?? t.date ?? Date.now()).toLocaleString('en-PH')
  const subtotal    = t.subtotal   ?? 0
  const discount    = t.discountTotal ?? 0
  const totalAmt    = t.total      ?? 0
  const change      = t.change ?? 0

  const items = (t.items ?? []).map(i => {
    const name      = i.productName ?? i.name ?? ''
    const qty       = i.quantity    ?? i.qty  ?? 1
    const price     = i.unitPrice   ?? i.sellingPrice ?? 0
    const lineTotal = i.lineTotal   ?? (price * qty - (i.discountAmount ?? 0))
    return `<div class="row"><span>${name}</span><span>&#8369;${lineTotal.toFixed(2)}</span></div>
            <div class="row indent"><span>${qty} x &#8369;${price}${i.discountAmount > 0 ? ` (-&#8369;${i.discountAmount.toFixed(2)})` : ''}</span><span></span></div>`
  }).join('')

  const payments = (t.payments ?? []).map(p => {
    const method = p.paymentMethod ?? p.method ?? ''
    return `<div class="row"><span>${method}</span><span>&#8369;${(p.amount ?? 0).toFixed(2)}</span></div>`
  }).join('')

  const win = window.open('', '_blank', 'width=400,height=600')
  if (!win) {
    toast.error('Pop-up blocked. Please allow pop-ups for this site to print receipts.')
    return
  }

  win.document.write(`<!DOCTYPE html><html><head><title>Reprint - ${receiptNo}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:8px}
    .center{text-align:center}.row{display:flex;justify-content:space-between;margin:2px 0}.indent{padding-left:8px;color:#888}
    .dashed{border-top:1px dashed #999;margin:6px 0}.bold{font-weight:bold}.big{font-size:14px}</style>
    </head><body>
    <div class="center"><p class="bold">${settingsStore.config?.storeName ?? ''}</p>
    ${settingsStore.config?.storeAddress ? `<p>${settingsStore.config.storeAddress}</p>` : ''}
    </div>
    <div class="dashed"></div>
    <div class="center"><p class="bold">** REPRINT **</p><p>OFFICIAL RECEIPT</p>
    <p style="color:#888">${receiptNo}</p>
    <p style="color:#888">${dateStr}</p></div>
    <div class="dashed"></div>
    ${items || '<p style="color:#888;text-align:center">No item details</p>'}
    <div class="dashed"></div>
    <div class="row"><span>Subtotal</span><span>&#8369;${subtotal.toFixed(2)}</span></div>
    ${discount > 0 ? `<div class="row" style="color:red"><span>Discount</span><span>-&#8369;${discount.toFixed(2)}</span></div>` : ''}
    <div class="row bold big"><span>TOTAL</span><span>&#8369;${totalAmt.toFixed(2)}</span></div>
    <div class="dashed"></div>
    ${payments}
    <div class="row bold"><span>Change</span><span>&#8369;${change.toFixed(2)}</span></div>
    </body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 300)
  showReprint.value = false
}

// ── Price Override ──
const priceOverrideItem  = ref(null)
const priceOverrideValue = ref(0)
const showManagerPin     = ref(false)
const pinContext         = ref(null)  // 'price_override'

function openPriceOverride(item) {
  priceOverrideItem.value  = item
  priceOverrideValue.value = item.sellingPrice
  showPriceOverride.value  = true
}

function requestPriceOverride() {
  showPriceOverride.value = false
  pinContext.value = 'price_override'
  showManagerPin.value = true
}

function onManagerPinApproved(approver) {
  showManagerPin.value = false
  if (pinContext.value === 'price_override' && priceOverrideItem.value) {
    const item = posStore.cart.find(i => i.id === priceOverrideItem.value.id)
    if (item) {
      item._originalPrice    = item.sellingPrice
      item.sellingPrice      = parseFloat(priceOverrideValue.value)
      item._priceOverridden  = true
      item._priceOverrideBy  = approver.name
    }
    toast.success(`Price override approved by ${approver.name}`)
  }
  pinContext.value = null
  priceOverrideItem.value = null
}

// ── Voucher lookup state ──
const voucherLookup = ref(null)

function lookupVoucher() {
  if (!pmInput.voucherCode.trim()) { voucherLookup.value = null; return }
  const result = voucherStore.checkBalance(pmInput.voucherCode)
  voucherLookup.value = result
  if (result.ok) {
    // Pre-fill amount with min(remaining balance, required payment)
    pmInput.amount = Math.min(result.voucher.remainingBalance, pmInput.exactAmount || posStore.total)
  }
}

function voucherStatusBadge(status) {
  return {
    active:         'bg-green-100 text-green-700',
    partially_used: 'bg-blue-100 text-blue-700',
    redeemed:       'bg-gray-100 text-gray-500',
    expired:        'bg-red-100 text-red-600',
    cancelled:      'bg-red-200 text-red-700',
  }[status] || 'bg-gray-100 text-gray-600'
}

const isAddPaymentDisabled = computed(() => {
  if (!pmInput.method || !pmInput.amount || pmInput.amount <= 0) return true
  if (pmInput.method === 'Store Credit' && !selectedCustomer.value) return true
  if (pmInput.method === 'Gift Voucher' && (!voucherLookup.value?.ok)) return true
  return false
})

function selectPaymentMethod(m) {
  pmInput.method      = pmInput.method === m.label ? null : m.label
  pmInput.referenceNo = ''
  pmInput.voucherCode = ''
  pmError.value       = ''
  voucherLookup.value = null

  // Pre-fill amount with remaining balance
  const req = pmReqAmount.value
  if (pmInput.method === 'Store Credit' && selectedCustomer.value) {
    pmInput.amount = Math.min(selectedCustomer.value.storeCreditBalance, req)
  } else {
    pmInput.amount = parseFloat(req.toFixed(2))
  }
}

function addPaymentEntry() {
  pmError.value = ''
  const { method, amount, referenceNo, voucherCode } = pmInput

  if (!method)                   { pmError.value = 'Select a payment method.'; return }
  if (!amount || amount <= 0)    { pmError.value = 'Enter a valid amount.'; return }
  if (method === 'Bank Transfer' && !referenceNo.trim()) { pmError.value = 'Reference number is required for Bank Transfer.'; return }
  if (method === 'Gift Voucher') {
    if (!voucherLookup.value?.ok) { pmError.value = 'Check the voucher code first.'; return }
    const result = voucherStore.redeem({
      code: voucherCode,
      amount,
      redeemedBy: `${authStore.user?.firstName} ${authStore.user?.lastName}`,
    })
    if (!result.ok) { pmError.value = result.error; return }
  }
  if (method === 'Store Credit') {
    if (!selectedCustomer.value)                              { pmError.value = 'Select a customer first.'; return }
    if (amount > selectedCustomer.value.storeCreditBalance)   { pmError.value = `Insufficient store credit (available: ₱${selectedCustomer.value.storeCreditBalance}).`; return }
  }
  if (method === 'Account') {
    if (!selectedCustomer.value)    { pmError.value = 'Select a customer first to use Account / Utang.'; return }
    if (availableCredit.value < amount) { pmError.value = `Insufficient credit. Available: ₱${availableCredit.value.toLocaleString()}.`; return }
  }

  posStore.addPaymentWithDetails({ method, amount, referenceNo, voucherCode })
  pmInput.method = null
  pmInput.amount = 0
  pmInput.referenceNo = ''
  pmInput.voucherCode = ''
  pmError.value = ''
  voucherLookup.value = null
}

// ── Discount modal ──
// undefined = closed, 'transaction' = txn-level, item object = line-level
const discountTarget = ref(undefined)
function openLineDiscount(item) { discountTarget.value = item }
function openTxnDiscount()      { discountTarget.value = 'transaction' }

function handleDiscountApply({ pct, type, typeName, reason, idNumber, overriddenBy }) {
  if (discountTarget.value === 'transaction') {
    posStore.setTransactionDiscountDetails({ pct, type, typeName, reason, idNumber, overriddenBy })
    toast.success(`Transaction discount ${pct}% applied`)
  } else {
    posStore.setLineDiscountDetails(discountTarget.value.id, { pct, type, typeName, reason, idNumber, overriddenBy })
    toast.success(`${typeName} ${pct}% applied to ${discountTarget.value.name}`)
  }
  discountTarget.value = undefined
}

function handleDiscountRemove() {
  if (discountTarget.value === 'transaction') {
    posStore.clearTransactionDiscount()
    toast.info('Transaction discount removed')
  } else {
    posStore.clearLineDiscount(discountTarget.value.id)
    toast.info('Line discount removed')
  }
  discountTarget.value = undefined
}

// ── Category list ──
// Use the dedicated categories list from /categories so all categories show regardless
// of how many products are currently loaded in memory
const categories = computed(() => {
  if (productStore.categories.length) {
    return productStore.categories.map(c => c.name ?? c).filter(Boolean).sort()
  }
  return [...new Set(productStore.products.filter(p => p.status === 'active').map(p => p.category))].sort()
})

const categoryProductCounts = computed(() => {
  const counts = {}
  productStore.products.filter(p => p.status === 'active').forEach(p => {
    counts[p.category] = (counts[p.category] || 0) + 1
  })
  return counts
})

// Show category tiles when no category is selected and no search is active
const showCategories = computed(() => activeCat.value === null && !search.value)

// ── Product filtering ──
const filteredProducts = computed(() => {
  let prods = productStore.products.filter(p => p.status === 'active')
  if (activeCat.value !== null) prods = prods.filter(p => p.category === activeCat.value)
  if (!search.value) return prods
  const q = search.value.toLowerCase()
  return prods.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.sku?.toLowerCase().includes(q) ||
    p.barcode?.includes(search.value.trim()) ||
    p.category.toLowerCase().includes(q)
  )
})

// ── Line total helper ──
function lineTotal(item) {
  const base = item.sellingPrice * item.qty
  return base - (base * (item.lineDiscount || 0)) / 100
}

// ── Add product (with barcode exact-match priority) ──
function addProduct(product) {
  posStore.addToCart(product)
  toast.success(`${product.name} added`)
}

function scanBarcode() {
  const q = search.value.trim()
  if (!q) return
  const exact = productStore.products.find(p => p.barcode === q || p.sku?.toLowerCase() === q.toLowerCase())
  if (exact) {
    posStore.addToCart(exact)
    toast.success(`${exact.name} added`)
    search.value = ''
  }
}

// ── Void line item ──
function voidLineItem(productId) {
  const item = posStore.cart.find(i => i.id === productId)
  if (item) toast.info(`${item.name} removed from cart`)
  posStore.removeFromCart(productId)
}

// ── Price Check ──
const pcResults = computed(() => {
  if (!pcQuery.value.trim()) return []
  const q = pcQuery.value.toLowerCase()
  return productStore.products.filter(p =>
    p.status === 'active' && (
      p.name.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.barcode?.includes(pcQuery.value.trim()) ||
      p.category.toLowerCase().includes(q)
    )
  ).slice(0, 8)
})

function openPriceCheck() {
  showPriceCheck.value = true
  pcQuery.value = ''
  nextTick(() => pcInput.value?.focus())
}

function addFromPriceCheck(product) {
  posStore.addToCart(product)
  toast.success(`${product.name} added to cart`)
  showPriceCheck.value = false
}

// ── Payment ──
const checkoutLoading = ref(false)

function cancelPayment() {
  showPayment.value = false
  posStore.clearSplit()
  pmInput.method = null
  pmInput.amount = 0
  pmInput.referenceNo = ''
  pmInput.voucherCode = ''
  pmError.value = ''
}

async function completeSale() {
  if (!shiftStore.isOpen) {
    toast.error('No active shift. Open a shift before processing sales.')
    return
  }
  if (checkoutLoading.value) return
  checkoutLoading.value = true
  showPayment.value = false   // close modal immediately — don't wait for API
  try {
    const txn = await posStore.completeTransaction()
    selectedCustomer.value = null
    receipt.value = txnStore.normalize(txn)
    toast.success('Sale completed!')
  } catch (err) {
    showPayment.value = true  // re-open so cashier can retry or cancel
    const msg = err?.response?.data?.message ?? err?.message ?? 'Transaction failed. Please try again.'
    toast.error(msg)
  } finally {
    checkoutLoading.value = false
  }
}

// Auto-print when receipt modal opens (if checkbox is checked)
watch(receipt, (val) => {
  if (val && shouldPrint.value) nextTick(() => printReceipt())
})

function printReceipt() {
  const content = document.getElementById('receipt-print')
  if (!content) return
  const win = window.open('', '_blank', 'width=400,height=600')
  win.document.write(`<html><head><title>Receipt - ${receipt.value?.id}</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:8px}</style>
    </head><body>${content.innerHTML}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 300)
}

function resumeHeld(id) {
  const held = posStore.heldTransactions.find(t => t.id === id)
  posStore.resumeTransaction(id)
  // Restore full customer object if known
  if (held?.customer?.id) {
    selectedCustomer.value = custStore.getById(held.customer.id) || null
  } else if (held?.customer?.name) {
    selectedCustomer.value = { firstName: held.customer.name, lastName: '', customerType: 'regular', loyaltyPoints: 0, storeCreditBalance: 0, currentBalance: 0 }
  } else {
    selectedCustomer.value = null
  }
  heldSearch.value = ''
  showHeld.value = false
  toast.info(`Hold #${held?.holdNumber || '?'} resumed`)
}

function processCashOut() {
  const log = posStore.cashOut(cashOutForm.value.amount, cashOutForm.value.reason)
  if (shiftStore.isOpen) {
    shiftStore.addMovement({
      type: 'out', amount: log.amount, reason: log.reason,
      recordedBy: `${authStore.user?.firstName || ''} ${authStore.user?.lastName || ''}`.trim(),
    })
  }
  toast.warning(`Cash out: ₱${log.amount} — ${log.reason}`)
  cashOutForm.value = { amount: 0, reason: '' }
  showCashOut.value = false
}
</script>
