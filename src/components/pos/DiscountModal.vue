<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm">

      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-base font-semibold text-gray-800">Apply Discount</h3>
        <p class="text-xs text-gray-500 mt-0.5">
          {{ scope === 'line' ? `Line item: ${targetName}` : 'Entire transaction' }}
        </p>
      </div>

      <div class="p-5 space-y-4">

        <!-- Discount type selector -->
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Discount Type</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="t in discountStore.activeTypes" :key="t.id"
              @click="selectType(t)"
              class="flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors"
              :class="selected?.id === t.id
                ? `${typeColor(t.color).bg} ${typeColor(t.color).text} ring-2 ${typeColor(t.color).ring} border-transparent`
                : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'">
              <span>{{ t.name }}</span>
              <span class="opacity-70">{{ t.customPct ? 'Custom' : t.pct + '%' }}</span>
            </button>
            <!-- Custom / No type -->
            <button @click="selectType(null)"
              class="flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors"
              :class="selected === null && form.pct > 0
                ? 'bg-gray-100 text-gray-700 ring-2 ring-gray-300 border-transparent'
                : 'border-gray-200 text-gray-400 hover:border-gray-300 bg-white'">
              <span>Custom</span>
              <span class="opacity-70">%</span>
            </button>
          </div>
        </div>

        <!-- Discount % -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Discount %
            <span class="text-gray-400 font-normal">(max {{ maxAllowed }}% for {{ authStore.role }})</span>
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="form.pct"
              type="number" min="0" :max="selected?.maxPct || 100" step="0.5"
              :readonly="selected && !selected.customPct"
              class="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-lg font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
              :class="selected && !selected.customPct ? 'bg-gray-50' : ''"
            />
            <span class="text-gray-500 font-bold text-lg">%</span>
          </div>
          <p v-if="form.pct > maxAllowed && !needsOverride" class="text-xs text-orange-600 mt-1">
            Exceeds your limit — manager override required below
          </p>
        </div>

        <!-- ID Number (Senior / PWD) -->
        <div v-if="selected?.requiresId">
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Customer ID Number <span class="text-red-500">*</span>
          </label>
          <input v-model="form.idNumber" type="text" placeholder="e.g. SC-12345678"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- Reason -->
        <div v-if="selected?.requiresReason || form.pct > 0">
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Reason <span v-if="selected?.requiresReason" class="text-red-500">*</span>
            <span v-else class="text-gray-400 font-normal">(optional)</span>
          </label>
          <input v-model="form.reason" type="text" :placeholder="reasonPlaceholder"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- Manager override section -->
        <div v-if="needsOverride" class="border border-orange-200 bg-orange-50 rounded-xl p-4 space-y-3">
          <p class="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
            <ShieldCheck class="w-3.5 h-3.5" />
            Manager Approval Required
          </p>
          <p class="text-xs text-orange-600">
            {{ form.pct }}% exceeds the cashier limit of {{ settingsStore.config.maxCashierDiscount }}%.
            A manager or owner must approve.
          </p>
          <div class="space-y-2">
            <input v-model="form.overrideEmail" type="email" placeholder="Manager / Owner email"
              class="w-full px-3 py-2 border border-orange-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
            <input v-model="form.overridePassword" type="password" placeholder="Password"
              class="w-full px-3 py-2 border border-orange-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
          </div>
        </div>

        <!-- Preview -->
        <div v-if="form.pct > 0" class="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1.5 text-sm">
          <div class="flex justify-between text-gray-600">
            <span>Original amount</span>
            <span>₱{{ originalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="flex justify-between text-red-600">
            <span>Discount {{ form.pct }}% ({{ selected?.name || 'Custom' }})</span>
            <span>−₱{{ discountAmt.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </div>
          <div class="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
            <span>After discount</span>
            <span class="text-green-700">₱{{ finalAmt.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-600 font-medium">{{ error }}</p>
      </div>

      <div class="px-6 py-4 border-t border-gray-200 flex gap-2">
        <button v-if="currentPct > 0" @click="removeDiscount"
          class="px-4 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
          Remove
        </button>
        <button @click="$emit('close')"
          class="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button @click="applyDiscount"
          :disabled="!form.pct || form.pct <= 0"
          class="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-40 transition-colors">
          Apply Discount
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useDiscountStore } from '@/stores/discounts'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore }     from '@/stores/auth'
import { mockUsers }        from '@/mock/users'
import { TYPE_COLOR }       from '@/mock/discounts'
import { ShieldCheck }      from '@lucide/vue'

const props = defineProps({
  scope:          { type: String, default: 'transaction' }, // 'line' | 'transaction'
  targetName:     { type: String, default: '' },
  originalAmount: { type: Number, default: 0 },
  currentPct:     { type: Number, default: 0 },
  currentType:    { type: String, default: null },
})

const emit = defineEmits(['apply', 'remove', 'close'])

const discountStore = useDiscountStore()
const settingsStore = useSettingsStore()
const authStore     = useAuthStore()

// ── Local state ──
const selected = ref(props.currentType ? discountStore.getType(props.currentType) : null)
const error    = ref('')

const form = reactive({
  pct:              props.currentPct || 0,
  reason:           '',
  idNumber:         '',
  overrideEmail:    '',
  overridePassword: '',
  overriddenBy:     null,
})

// ── Helpers ──
function typeColor(color) { return TYPE_COLOR[color] || TYPE_COLOR.gray }

const maxAllowed = computed(() => {
  if (authStore.role === 'owner') return 100
  if (authStore.role === 'manager') return settingsStore.config.maxManagerDiscount
  return settingsStore.config.maxCashierDiscount
})

const needsOverride = computed(() =>
  authStore.role === 'cashier' && form.pct > settingsStore.config.maxCashierDiscount
)

const discountAmt = computed(() => parseFloat((props.originalAmount * form.pct / 100).toFixed(2)))
const finalAmt    = computed(() => parseFloat((props.originalAmount - discountAmt.value).toFixed(2)))

const reasonPlaceholder = computed(() => {
  if (selected.value?.id === 'promo')   return 'e.g. Weekend sale, buy 2 get 1'
  if (selected.value?.id === 'manager') return 'e.g. Near-expiry batch, damaged packaging'
  return 'Optional note'
})

function selectType(type) {
  selected.value = type
  if (type && !type.customPct) {
    form.pct = type.pct
  } else if (type?.customPct) {
    form.pct = 0
  }
  error.value = ''
  form.idNumber = ''
  form.overrideEmail = ''
  form.overridePassword = ''
  form.overriddenBy = null
}

// ── Apply ──
function applyDiscount() {
  error.value = ''

  if (!form.pct || form.pct <= 0)               { error.value = 'Enter a discount percentage.'; return }
  if (form.pct > 100)                           { error.value = 'Discount cannot exceed 100%.'; return }
  if (selected.value?.requiresId && !form.idNumber.trim())     { error.value = 'Customer ID number is required for this discount type.'; return }
  if (selected.value?.requiresReason && !form.reason.trim())   { error.value = 'A reason is required for this discount type.'; return }

  // Manager override validation
  if (needsOverride.value) {
    if (!form.overrideEmail || !form.overridePassword) {
      error.value = 'Manager approval required — enter email and password.'; return
    }
    const approver = mockUsers.find(u =>
      u.email    === form.overrideEmail &&
      u.password === form.overridePassword &&
      (u.role === 'manager' || u.role === 'owner')
    )
    if (!approver) { error.value = 'Invalid credentials or not a manager/owner.'; return }
    form.overriddenBy = `${approver.firstName} ${approver.lastName}`
  }

  emit('apply', {
    pct:          form.pct,
    type:         selected.value?.id || 'custom',
    typeName:     selected.value?.name || 'Custom',
    reason:       form.reason,
    idNumber:     form.idNumber,
    overriddenBy: form.overriddenBy,
  })
}

function removeDiscount() {
  emit('remove')
}
</script>
