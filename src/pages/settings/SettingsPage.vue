<template>
  <div class="flex gap-6" style="min-height: calc(100vh - 140px)">

    <!-- Tab sidebar -->
    <div class="w-52 shrink-0">
      <nav class="space-y-1">
        <button
          v-for="tab in tabs" :key="tab.id"
          @click="activeTab = tab.id"
          :class="activeTab === tab.id
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'text-gray-600 border-transparent hover:bg-gray-50'"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors text-left"
        >
          <component :is="tab.icon" class="w-4 h-4 shrink-0" />
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- Tab content -->
    <div class="flex-1 min-w-0">
      <div class="max-w-2xl space-y-5">

        <!-- ── 1. General / Business ── -->
        <template v-if="activeTab === 'general'">
          <Section title="Shop & Business Information" :icon="Store">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <Label>Business Name</Label>
                <input v-model="form.storeName" class="inp" />
              </div>
              <div class="col-span-2">
                <Label>Address</Label>
                <input v-model="form.storeAddress" class="inp" placeholder="Full store address" />
              </div>
              <div>
                <Label>Phone</Label>
                <input v-model="form.storePhone" class="inp" placeholder="09XX-XXX-XXXX" />
              </div>
              <div>
                <Label>Email</Label>
                <input v-model="form.storeEmail" class="inp" placeholder="store@email.com" />
              </div>
              <div>
                <Label>TIN (BIR)</Label>
                <input v-model="form.storeTIN" class="inp" placeholder="000-000-000-000" />
              </div>
              <div>
                <Label>Currency</Label>
                <select v-model="form.currency" class="inp">
                  <option value="PHP">PHP — Philippine Peso (₱)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                </select>
              </div>
              <div>
                <Label>Timezone</Label>
                <select v-model="form.timezone" class="inp">
                  <option value="Asia/Manila">Asia/Manila (PHT UTC+8)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Receipt Header & Footer" :icon="FileText">
            <div class="space-y-3">
              <div>
                <Label>Receipt Header <span class="text-gray-400 font-normal">(shown above items)</span></Label>
                <textarea v-model="form.receiptHeader" rows="2" class="inp resize-none" placeholder="e.g. BIR Accredited, VAT Reg TIN..." />
              </div>
              <div>
                <Label>Receipt Footer <span class="text-gray-400 font-normal">(shown below total)</span></Label>
                <textarea v-model="form.receiptFooter" rows="2" class="inp resize-none" placeholder="e.g. Thank you for shopping!" />
              </div>
            </div>
          </Section>

          <Section title="Receipt Layout" :icon="Layout">
            <div class="space-y-1">
              <Toggle v-model="form.showLogoOnReceipt"       label="Show Logo"             desc="Print store logo on receipt" />
              <Toggle v-model="form.showCashierOnReceipt"    label="Show Cashier Name"      desc="Print cashier name on receipt" />
              <Toggle v-model="form.showCustomerOnReceipt"   label="Show Customer Info"     desc="Print customer name on receipt" />
              <Toggle v-model="form.showTaxBreakdown"        label="Show Tax Breakdown"     desc="Print tax amount line on receipt" />
              <Toggle v-model="form.showDiscountBreakdown"   label="Show Discount Breakdown" desc="Print discount amount on receipt" />
              <Toggle v-model="form.showBarcodeOnReceipt"    label="Show Barcode"           desc="Print barcode on receipt" />
            </div>
          </Section>
        </template>

        <!-- ── 2. Tax ── -->
        <template v-if="activeTab === 'tax'">
          <Section title="Tax Rules Engine" :icon="Receipt">
            <div class="flex items-center justify-between py-2 mb-4 border-b border-gray-100">
              <div>
                <p class="text-sm font-medium text-gray-800">Enable Tax</p>
                <p class="text-xs text-gray-400 mt-0.5">Apply tax to all sales</p>
              </div>
              <ToggleBtn v-model="form.taxEnabled" />
            </div>

            <div v-if="form.taxEnabled" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tax Name</Label>
                  <input v-model="form.taxName" class="inp" placeholder="VAT, GST..." />
                </div>
                <div>
                  <Label>Tax Rate (%)</Label>
                  <input v-model.number="form.taxRate" type="number" min="0" max="100" step="0.01" class="inp" />
                </div>
              </div>

              <!-- Tax type cards -->
              <div>
                <Label>Tax Type</Label>
                <div class="grid grid-cols-2 gap-3 mt-1">
                  <button
                    v-for="t in taxTypes" :key="t.value"
                    @click="form.taxType = t.value"
                    :class="form.taxType === t.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
                    class="border rounded-lg p-3 text-left transition-colors"
                  >
                    <p class="text-sm font-medium text-gray-800">{{ t.label }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ t.desc }}</p>
                    <p class="text-xs font-mono mt-2 text-gray-500">{{ t.example(form.taxRate) }}</p>
                  </button>
                </div>
              </div>

              <!-- Calculation mode -->
              <div>
                <Label>Tax Calculation Mode</Label>
                <div class="grid grid-cols-2 gap-3 mt-1">
                  <button
                    v-for="m in calcModes" :key="m.value"
                    @click="form.taxCalculation = m.value"
                    :class="form.taxCalculation === m.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
                    class="border rounded-lg p-3 text-left transition-colors"
                  >
                    <p class="text-sm font-medium text-gray-800">{{ m.label }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ m.desc }}</p>
                  </button>
                </div>
              </div>

              <Toggle v-model="form.showTaxOnReceipt" label="Show Tax on Receipt" desc="Print tax breakdown line on receipt" />

              <!-- Zero-rated categories -->
              <div>
                <Label>Zero-Rated Categories <span class="text-gray-400 font-normal">(no tax applied)</span></Label>
                <div class="flex flex-wrap gap-2 mt-1">
                  <label v-for="cat in allCategories" :key="cat" class="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      :value="cat"
                      :checked="form.taxExemptCategories.includes(cat)"
                      @change="toggleExemptCat(cat)"
                      class="rounded"
                    />
                    {{ cat }}
                  </label>
                </div>
              </div>

              <!-- Live preview -->
              <div class="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Receipt Preview (₱1,000 sale)</p>
                <div class="space-y-1 text-sm font-mono">
                  <div class="flex justify-between text-gray-600"><span>Subtotal</span><span>₱1,000.00</span></div>
                  <div v-if="form.taxType === 'exclusive'" class="flex justify-between text-gray-600">
                    <span>{{ form.taxName }} {{ form.taxRate }}%</span>
                    <span>₱{{ (1000 * form.taxRate / 100).toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between font-bold text-gray-900 border-t border-dashed border-gray-300 pt-1">
                    <span>TOTAL</span>
                    <span>₱{{ form.taxType === 'exclusive' ? (1000 * (1 + form.taxRate / 100)).toFixed(2) : '1,000.00' }}</span>
                  </div>
                  <div v-if="form.taxType === 'inclusive'" class="flex justify-between text-xs text-gray-400">
                    <span>Incl. {{ form.taxName }} {{ form.taxRate }}%</span>
                    <span>₱{{ (1000 - 1000 / (1 + form.taxRate / 100)).toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        </template>

        <!-- ── 3. Customers ── -->
        <template v-if="activeTab === 'customers'">
          <Section title="Customer Module" :icon="Users">
            <Toggle v-model="form.requireCustomer"    label="Require Customer on Every Sale" desc="Cashier must select customer before checkout" />
            <Toggle v-model="form.skipCustomerField"  label="Skip Customer Field (Sari-sari Mode)" desc="Hide customer selection in POS entirely" />
          </Section>

          <Section title="Credit (Utang) System" :icon="CreditCard">
            <div class="space-y-3">
              <p class="text-xs text-gray-500">Credit limits and balance settings are configured per-customer in the Customers module.</p>
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700 space-y-1">
                <p class="font-semibold">How credit works in PabiliPOS:</p>
                <p>• Customer has a credit limit (e.g. ₱3,000)</p>
                <p>• When balance exceeds limit, system warns cashier</p>
                <p>• Owner/Manager can override</p>
                <p>• Payment history is tracked per customer</p>
              </div>
            </div>
          </Section>

          <Section title="Loyalty Points" :icon="Star">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label>Points per ₱1 Spent</Label>
                <input v-model.number="form.loyaltyPointsPerPeso" type="number" min="0" step="0.01" class="inp" placeholder="e.g. 1" />
              </div>
              <div>
                <Label>₱ Value per Point</Label>
                <input v-model.number="form.loyaltyPesoPerPoint" type="number" min="0" step="0.01" class="inp" placeholder="e.g. 0.25" />
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-2">
              e.g. ₱100 sale = {{ form.loyaltyPointsPerPeso || 1 }} pts &nbsp;·&nbsp;
              100 pts = ₱{{ ((form.loyaltyPesoPerPoint || 0.25) * 100).toFixed(2) }} discount
            </p>
          </Section>
        </template>

        <!-- ── 4. POS Behavior ── -->
        <template v-if="activeTab === 'pos'">
          <Section title="Sales Screen Behavior" :icon="ShoppingCart">
            <Toggle v-model="form.autoOpenSales"       label="Auto Open Sales Screen"       desc="Immediately show POS screen on login" />
            <Toggle v-model="form.autoSaveTransaction" label="Auto Save Transaction"         desc="Auto-save completed transactions to history" />
            <Toggle v-model="form.promptForReceipt"    label="Prompt for Receipt"            desc="Ask cashier to print receipt after every sale" />
            <Toggle v-model="form.enableHoldResume"    label="Enable Hold / Resume"          desc="Allow cashier to hold a transaction and resume later" />
            <Toggle v-model="form.enableSplitPayment"  label="Enable Split Payment"          desc="Allow multiple payment methods per transaction" />
            <Toggle v-model="form.barcodeOnlyMode"     label="Barcode-Only Mode"             desc="Disable manual product search, scan only" />
            <Toggle v-model="form.roundToTwoDecimals"  label="Round to 2 Decimals"           desc="Format prices as ₱10.50 not ₱10.5" />
          </Section>

          <Section title="Discount Rules" :icon="Tag">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Cashier Discount (%)</Label>
                <input v-model.number="form.maxCashierDiscount" type="number" min="0" max="100" class="inp" />
                <p class="text-xs text-gray-400 mt-1">Cashier cannot exceed this</p>
              </div>
              <div>
                <Label>Max Manager Discount (%)</Label>
                <input v-model.number="form.maxManagerDiscount" type="number" min="0" max="100" class="inp" />
                <p class="text-xs text-gray-400 mt-1">Manager override limit</p>
              </div>
              <div class="col-span-2">
                <Label>Require Manager Approval Above (%)</Label>
                <input v-model.number="form.requireManagerApprovalAbove" type="number" min="0" max="100" class="inp" />
                <p class="text-xs text-gray-400 mt-1">Discount above this % requires manager PIN</p>
              </div>
            </div>
            <Toggle v-model="form.canSellBelowCost" label="Allow Selling Below Cost Price" desc="Allow cashier to sell items below their cost price" />
          </Section>

          <Section title="Session" :icon="Clock">
            <div>
              <Label>Session Timeout (minutes)</Label>
              <input v-model.number="form.sessionTimeoutMinutes" type="number" min="1" class="inp w-40" />
              <p class="text-xs text-gray-400 mt-1">Auto logout after inactivity</p>
            </div>
          </Section>
        </template>

        <!-- ── 5. Payments ── -->
        <template v-if="activeTab === 'payments'">
          <Section title="Enabled Payment Methods" :icon="CreditCard">
            <p class="text-xs text-gray-500 mb-4">Only enabled methods will appear at checkout.</p>
            <div class="space-y-1">
              <Toggle v-model="form.paymentMethods.cash"        label="Cash"         desc="Physical cash payments" />
              <Toggle v-model="form.paymentMethods.gcash"       label="GCash"        desc="GCash QR / transfer" />
              <Toggle v-model="form.paymentMethods.maya"        label="Maya"         desc="Maya / PayMaya" />
              <Toggle v-model="form.paymentMethods.qrph"        label="QR Ph"        desc="InstaPay / PESONet QR" />
              <Toggle v-model="form.paymentMethods.debit"       label="Debit Card"   desc="Bancnet / Visa Debit" />
              <Toggle v-model="form.paymentMethods.credit"      label="Credit Card"  desc="Visa / Mastercard" />
              <Toggle v-model="form.paymentMethods.storeCredit" label="Store Credit" desc="Use refunded store credit balance" />
            </div>
          </Section>
        </template>

        <!-- ── 6. Inventory ── -->
        <template v-if="activeTab === 'inventory'">
          <Section title="Inventory Behavior" :icon="Warehouse">
            <Toggle v-model="form.autoDeductStock"         label="Auto Deduct Stock on Sale"     desc="Automatically reduce stock when a sale is completed" />
            <Toggle v-model="form.allowNegativeStock"      label="Allow Negative Stock"          desc="Allow selling items even when stock reaches zero" />
            <Toggle v-model="form.enableStockAlerts"       label="Enable Low Stock Alerts"       desc="Show alerts on dashboard when stock is below reorder level" />
            <Toggle v-model="form.enableReorderSuggestion" label="Enable Reorder Suggestions"    desc="Show suggested reorder quantities on inventory page" />
          </Section>
        </template>

        <!-- ── 7. Audit ── -->
        <template v-if="activeTab === 'audit'">
          <Section title="Audit & Logging" :icon="Shield">
            <Toggle v-model="form.logTransactionChanges" label="Log Transaction Changes" desc="Record every edit, void, or refund made to a transaction" />
            <Toggle v-model="form.logUserActions"        label="Log User Actions"        desc="Track login, logout, and setting changes per user" />
          </Section>

          <Section title="Audit Log (Mock)" :icon="ClipboardList">
            <div class="divide-y divide-gray-100 text-sm">
              <div v-for="log in auditLogs" :key="log.id" class="py-3 flex items-start justify-between gap-4">
                <div>
                  <p class="text-gray-800 font-medium">{{ log.action }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ log.user }} · {{ log.detail }}</p>
                </div>
                <span class="text-xs text-gray-400 whitespace-nowrap shrink-0">{{ log.time }}</span>
              </div>
            </div>
          </Section>
        </template>

        <!-- Save / Reset bar (all tabs) -->
        <div class="flex items-center justify-between pt-2 pb-6">
          <button @click="handleReset" class="text-sm text-gray-500 hover:text-red-500 border border-gray-200 px-4 py-2 rounded-lg">
            Reset to Defaults
          </button>
          <button @click="handleSave" class="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Save class="w-4 h-4" /> Save Settings
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineComponent, h, computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useProductStore } from '@/stores/products'
import { useToastStore } from '@/stores/toast'
import {
  Store, Receipt, Users, ShoppingCart, CreditCard,
  Warehouse, Shield, Save, Tag, Clock, Star,
  FileText, Layout, ClipboardList
} from '@lucide/vue'

const settingsStore = useSettingsStore()
const productStore  = useProductStore()
const toast         = useToastStore()

const form = ref({
  ...settingsStore.config,
  loyaltyPointsPerPeso: settingsStore.config.loyaltyPointsPerPeso ?? 1,
  loyaltyPesoPerPoint:  settingsStore.config.loyaltyPesoPerPoint  ?? 0.25,
  paymentMethods: { ...settingsStore.config.paymentMethods },
  taxExemptCategories: [...(settingsStore.config.taxExemptCategories || [])],
})

const activeTab = ref('general')

const tabs = [
  { id: 'general',   label: 'General',   icon: Store },
  { id: 'tax',       label: 'Tax',       icon: Receipt },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'pos',       label: 'POS',       icon: ShoppingCart },
  { id: 'payments',  label: 'Payments',  icon: CreditCard },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'audit',     label: 'Audit',     icon: Shield },
]

const taxTypes = [
  {
    value: 'exclusive',
    label: 'Exclusive',
    desc: 'Tax added on top of price',
    example: (r) => `₱100 + ${r}% = ₱${(100 + r).toFixed(2)}`
  },
  {
    value: 'inclusive',
    label: 'Inclusive',
    desc: 'Tax already inside the price',
    example: (r) => `₱100 includes ₱${(100 - 100 / (1 + r / 100)).toFixed(2)} tax`
  },
]

const calcModes = [
  { value: 'per_item',        label: 'Per Item',        desc: 'Tax calculated on each line item (recommended)' },
  { value: 'per_transaction', label: 'Per Transaction', desc: 'Tax calculated on the final total' },
]

const allCategories = computed(() => productStore.categories.map(c => c.name))

function toggleExemptCat(cat) {
  const idx = form.value.taxExemptCategories.indexOf(cat)
  if (idx === -1) form.value.taxExemptCategories.push(cat)
  else form.value.taxExemptCategories.splice(idx, 1)
}

const auditLogs = [
  { id: 1, action: 'Settings Saved',      user: 'Juan Dela Cruz (Owner)',   detail: 'Tax enabled, rate set to 12%',        time: 'Today 09:14' },
  { id: 2, action: 'User Created',         user: 'Juan Dela Cruz (Owner)',   detail: 'Added cashier: Pedro Reyes',           time: 'Today 08:50' },
  { id: 3, action: 'Transaction Voided',   user: 'Maria Santos (Manager)',   detail: 'TXN-00123 voided — wrong item',        time: 'Yesterday 14:22' },
  { id: 4, action: 'Stock Adjusted',       user: 'Maria Santos (Manager)',   detail: 'Coca-Cola 1.5L +24 units',             time: 'Yesterday 11:05' },
  { id: 5, action: 'Discount Override',    user: 'Maria Santos (Manager)',   detail: '20% discount applied on TXN-00119',    time: 'Yesterday 10:30' },
  { id: 6, action: 'Login',                user: 'Pedro Reyes (Cashier)',    detail: 'Shift opened ₱500 starting cash',      time: 'Yesterday 08:00' },
]

function handleSave() {
  settingsStore.save(form.value)
  toast.success('Settings saved')
}

function handleReset() {
  settingsStore.reset()
  form.value = {
    ...settingsStore.config,
    loyaltyPointsPerPeso: 1,
    loyaltyPesoPerPoint: 0.25,
    paymentMethods: { ...settingsStore.config.paymentMethods },
    taxExemptCategories: [],
  }
  toast.info('Settings reset to defaults')
}

// ── Shared sub-components ──
const Section = defineComponent({
  props: { title: String, icon: [Object, Function] },
  setup(props, { slots }) {
    return () => h('div', { class: 'bg-white rounded-xl border border-gray-200 p-6' }, [
      h('h2', { class: 'text-sm font-semibold text-gray-700 mb-5 flex items-center gap-2' }, [
        h(props.icon, { class: 'w-4 h-4 text-gray-400' }),
        props.title
      ]),
      slots.default?.()
    ])
  }
})

const Label = defineComponent({
  setup(_, { slots }) {
    return () => h('label', { class: 'block text-xs font-medium text-gray-600 mb-1' }, slots.default?.())
  }
})

const ToggleBtn = defineComponent({
  props: { modelValue: Boolean },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('button', {
      onClick: () => emit('update:modelValue', !props.modelValue),
      class: `relative w-11 h-6 rounded-full transition-colors ${props.modelValue ? 'bg-blue-600' : 'bg-gray-200'}`
    }, [
      h('span', {
        class: `block w-5 h-5 bg-white rounded-full shadow transition-transform ${props.modelValue ? 'translate-x-5' : 'translate-x-0.5'}`
      })
    ])
  }
})

const Toggle = defineComponent({
  props: { modelValue: Boolean, label: String, desc: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', { class: 'flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0' }, [
      h('div', {}, [
        h('p', { class: 'text-sm font-medium text-gray-800' }, props.label),
        h('p', { class: 'text-xs text-gray-400 mt-0.5' }, props.desc),
      ]),
      h(ToggleBtn, {
        modelValue: props.modelValue,
        'onUpdate:modelValue': (v) => emit('update:modelValue', v)
      })
    ])
  }
})
</script>

<style scoped>
.inp {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}
.inp:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px #bfdbfe; }
</style>
