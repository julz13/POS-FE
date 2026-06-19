// Discount types — editable by owner/manager
export const defaultDiscountTypes = [
  {
    id: 'senior',   name: 'Senior Citizen',    pct: 20, maxPct: 20, customPct: false,
    requiresId: true, requiresReason: false, requiresOverride: false,
    active: true, color: 'blue',   description: 'Gov\'t-mandated 20% senior citizen discount',
  },
  {
    id: 'pwd',      name: 'PWD',               pct: 20, maxPct: 20, customPct: false,
    requiresId: true, requiresReason: false, requiresOverride: false,
    active: true, color: 'green',  description: 'Person with disability — gov\'t-mandated 20%',
  },
  {
    id: 'promo',    name: 'Promo',             pct: 0,  maxPct: 50, customPct: true,
    requiresId: false, requiresReason: true,  requiresOverride: false,
    active: true, color: 'orange', description: 'Promotional discount — enter % and reason',
  },
  {
    id: 'employee', name: 'Employee',          pct: 10, maxPct: 10, customPct: false,
    requiresId: false, requiresReason: false, requiresOverride: false,
    active: true, color: 'purple', description: 'Staff purchase discount',
  },
  {
    id: 'loyalty',  name: 'Loyalty',           pct: 5,  maxPct: 5,  customPct: false,
    requiresId: false, requiresReason: false, requiresOverride: false,
    active: true, color: 'pink',   description: 'Returning customer loyalty discount',
  },
  {
    id: 'manager',  name: 'Manager Override',  pct: 0,  maxPct: 100, customPct: true,
    requiresId: false, requiresReason: true,  requiresOverride: true,
    active: true, color: 'red',    description: 'Manager-approved override — requires credentials',
  },
]

// Sample audit entries
export const sampleDiscountAudit = [
  {
    id: 'DISC-00001',
    transactionId: 'TXN-0002',
    appliedAt: '2026-06-03T10:30:00',
    appliedBy: 'Pedro Reyes',
    typeId: 'senior',
    typeName: 'Senior Citizen',
    scope: 'transaction',
    productName: null,
    originalAmount: 120,
    discountPct: 20,
    discountAmount: 24,
    finalAmount: 96,
    reason: '',
    idNumber: 'SC-123456',
    overriddenBy: null,
  },
  {
    id: 'DISC-00002',
    transactionId: 'TXN-0003',
    appliedAt: '2026-06-03T11:45:00',
    appliedBy: 'Pedro Reyes',
    typeId: 'promo',
    typeName: 'Promo',
    scope: 'transaction',
    productName: null,
    originalAmount: 500,
    discountPct: 5,
    discountAmount: 25,
    finalAmount: 475,
    reason: 'Weekend promo sale',
    idNumber: '',
    overriddenBy: null,
  },
  {
    id: 'DISC-00003',
    transactionId: 'TXN-0006',
    appliedAt: '2026-06-01T09:00:00',
    appliedBy: 'Pedro Reyes',
    typeId: 'manager',
    typeName: 'Manager Override',
    scope: 'line',
    productName: 'Sky Flakes Crackers',
    originalAmount: 120,
    discountPct: 5,
    discountAmount: 6,
    finalAmount: 114,
    reason: 'Near-expiry batch price reduction',
    idNumber: '',
    overriddenBy: 'Maria Santos',
  },
]

// Badge colors
export const TYPE_COLOR = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   ring: 'ring-blue-400'   },
  green:  { bg: 'bg-green-100',  text: 'text-green-700',  ring: 'ring-green-400'  },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-400' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-400' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-700',   ring: 'ring-pink-400'   },
  red:    { bg: 'bg-red-100',    text: 'text-red-700',    ring: 'ring-red-400'    },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-600',   ring: 'ring-gray-300'   },
}
