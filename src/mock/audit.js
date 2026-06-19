export const mockAuditLog = [
  // Logins
  { id: 1, timestamp: '2026-06-03T08:00:00', user: 'Pedro Reyes',  userId: 3, role: 'cashier',  action: 'LOGIN',               module: 'Auth',        description: 'User logged in', reference: null, severity: 'info',     details: {} },
  { id: 2, timestamp: '2026-06-03T08:01:00', user: 'Pedro Reyes',  userId: 3, role: 'cashier',  action: 'SHIFT_OPENED',        module: 'Shifts',      description: 'Shift opened — Opening cash ₱500', reference: 'SFT-00003', severity: 'info', details: { openingCash: 500 } },
  { id: 3, timestamp: '2026-06-03T09:20:00', user: 'Pedro Reyes',  userId: 3, role: 'cashier',  action: 'DISCOUNT_APPLIED',    module: 'POS',         description: 'Senior Citizen 20% applied on TXN-0002 — ₱24 saved', reference: 'TXN-0002', severity: 'warning', details: { type: 'senior', pct: 20, amount: 24 } },
  { id: 4, timestamp: '2026-06-03T11:45:00', user: 'Pedro Reyes',  userId: 3, role: 'cashier',  action: 'DISCOUNT_APPLIED',    module: 'POS',         description: 'Promo 5% applied on TXN-0003 — ₱25 saved', reference: 'TXN-0003', severity: 'warning', details: { type: 'promo', pct: 5, amount: 25 } },
  { id: 5, timestamp: '2026-06-02T09:00:00', user: 'Maria Santos', userId: 2, role: 'manager',  action: 'SETTINGS_CHANGED',    module: 'Settings',    description: 'Store name updated', reference: null, severity: 'info', details: { field: 'storeName' } },
  { id: 6, timestamp: '2026-06-01T10:45:00', user: 'Maria Santos', userId: 2, role: 'manager',  action: 'TRANSACTION_VOIDED',  module: 'Transactions',description: 'TXN-0007 voided — Wrong items scanned', reference: 'TXN-0007', severity: 'critical', details: { amount: 230, reason: 'Wrong items scanned — customer cancelled' } },
  { id: 7, timestamp: '2026-06-01T11:10:00', user: 'Maria Santos', userId: 2, role: 'manager',  action: 'RETURN_APPROVED',     module: 'Returns',     description: 'Return RTN-00002 approved — Lucky Me ×2', reference: 'RTN-00002', severity: 'warning', details: { amount: 32 } },
  { id: 8, timestamp: '2026-06-01T09:00:00', user: 'Pedro Reyes',  userId: 3, role: 'cashier',  action: 'DISCOUNT_APPLIED',    module: 'POS',         description: 'Manager Override 5% on TXN-0006 — ₱6 saved. Approved by Maria Santos', reference: 'TXN-0006', severity: 'critical', details: { type: 'manager', pct: 5, amount: 6, approvedBy: 'Maria Santos' } },
  { id: 9, timestamp: '2026-06-03T09:00:00', user: 'Juan Dela Cruz', userId: 1, role: 'owner',  action: 'LOGIN',               module: 'Auth',        description: 'User logged in', reference: null, severity: 'info', details: {} },
  { id: 10, timestamp: '2026-06-01T08:00:00', user: 'Maria Santos', userId: 2, role: 'manager', action: 'LOGIN',               module: 'Auth',        description: 'User logged in', reference: null, severity: 'info', details: {} },
]

export const AUDIT_ACTIONS = [
  'LOGIN', 'LOGOUT', 'SHIFT_OPENED', 'SHIFT_CLOSED',
  'TRANSACTION_COMPLETED', 'TRANSACTION_VOIDED',
  'DISCOUNT_APPLIED', 'PRICE_OVERRIDE',
  'RETURN_CREATED', 'RETURN_APPROVED', 'RETURN_COMPLETED',
  'STOCK_TAKE_POSTED', 'INVENTORY_ADJUSTED',
  'USER_CREATED', 'USER_UPDATED',
  'SETTINGS_CHANGED',
  'CUSTOMER_CREATED', 'CUSTOMER_UPDATED',
]

export const SEVERITY_STYLE = {
  info:     { bg: 'bg-blue-50',   text: 'text-blue-700',  dot: 'bg-blue-500'   },
  warning:  { bg: 'bg-yellow-50', text: 'text-yellow-700',dot: 'bg-yellow-500' },
  critical: { bg: 'bg-red-50',    text: 'text-red-700',   dot: 'bg-red-500'    },
}
