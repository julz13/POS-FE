// Seed ledger entries — one row per stock movement
// Sources: sale, purchase, grn, return, adjustment, stock_take, manual_in, manual_out
export const mockLedger = [
  // Coca-Cola 1.5L (id: 1)
  { id: 1, productId: 1, productName: 'Coca-Cola 1.5L', sku: 'BEV-001',
    date: '2026-05-01T08:00:00', type: 'purchase', reference: 'GRN-00001',
    qtyIn: 48, qtyOut: 0, balance: 48, user: 'Maria Santos', notes: 'Initial stock received' },
  { id: 2, productId: 1, productName: 'Coca-Cola 1.5L', sku: 'BEV-001',
    date: '2026-06-01T09:00:00', type: 'sale', reference: 'TXN-0007',
    qtyIn: 0, qtyOut: 1, balance: 47, user: 'Pedro Reyes', notes: 'Sale (voided)' },
  { id: 3, productId: 1, productName: 'Coca-Cola 1.5L', sku: 'BEV-001',
    date: '2026-06-01T10:45:00', type: 'void_reversal', reference: 'TXN-0007',
    qtyIn: 1, qtyOut: 0, balance: 48, user: 'Maria Santos', notes: 'Void reversal' },
  { id: 4, productId: 1, productName: 'Coca-Cola 1.5L', sku: 'BEV-001',
    date: '2026-06-03T09:15:00', type: 'sale', reference: 'TXN-0001',
    qtyIn: 0, qtyOut: 2, balance: 46, user: 'Pedro Reyes', notes: '' },
  { id: 5, productId: 1, productName: 'Coca-Cola 1.5L', sku: 'BEV-001',
    date: '2026-06-03T11:45:00', type: 'sale', reference: 'TXN-0003',
    qtyIn: 0, qtyOut: 2, balance: 44, user: 'Pedro Reyes', notes: '' },

  // Lucky Me Pancit Canton (id: 2)
  { id: 6, productId: 2, productName: 'Lucky Me Pancit Canton', sku: 'SNK-001',
    date: '2026-05-01T08:00:00', type: 'purchase', reference: 'GRN-00001',
    qtyIn: 120, qtyOut: 0, balance: 120, user: 'Maria Santos', notes: 'Initial stock received' },
  { id: 7, productId: 2, productName: 'Lucky Me Pancit Canton', sku: 'SNK-001',
    date: '2026-06-03T09:15:00', type: 'sale', reference: 'TXN-0001',
    qtyIn: 0, qtyOut: 5, balance: 115, user: 'Pedro Reyes', notes: '' },
  { id: 8, productId: 2, productName: 'Lucky Me Pancit Canton', sku: 'SNK-001',
    date: '2026-06-03T10:30:00', type: 'sale', reference: 'TXN-0002',
    qtyIn: 0, qtyOut: 3, balance: 112, user: 'Pedro Reyes', notes: '' },
  { id: 9, productId: 2, productName: 'Lucky Me Pancit Canton', sku: 'SNK-001',
    date: '2026-06-03T11:00:00', type: 'return', reference: 'RTN-00002',
    qtyIn: 2, qtyOut: 0, balance: 114, user: 'Pedro Reyes', notes: 'Exchange — wrong flavor' },

  // Bear Brand Milk 300g (id: 5)
  { id: 10, productId: 5, productName: 'Bear Brand Milk 300g', sku: 'DAI-001',
    date: '2026-05-01T08:00:00', type: 'purchase', reference: 'GRN-00001',
    qtyIn: 10, qtyOut: 0, balance: 10, user: 'Maria Santos', notes: 'Initial stock' },
  { id: 11, productId: 5, productName: 'Bear Brand Milk 300g', sku: 'DAI-001',
    date: '2026-06-03T11:45:00', type: 'sale', reference: 'TXN-0003',
    qtyIn: 0, qtyOut: 2, balance: 8, user: 'Pedro Reyes', notes: '' },
  { id: 12, productId: 5, productName: 'Bear Brand Milk 300g', sku: 'DAI-001',
    date: '2026-06-02T14:20:00', type: 'sale', reference: 'TXN-0004',
    qtyIn: 0, qtyOut: 1, balance: 7, user: 'Pedro Reyes', notes: '' },
  { id: 13, productId: 5, productName: 'Bear Brand Milk 300g', sku: 'DAI-001',
    date: '2026-06-03T13:00:00', type: 'return', reference: 'RTN-00003',
    qtyIn: 0, qtyOut: 0, balance: 7, user: 'Pedro Reyes', notes: 'Pending return — not yet posted' },
  { id: 14, productId: 5, productName: 'Bear Brand Milk 300g', sku: 'DAI-001',
    date: '2026-06-04T09:00:00', type: 'adjustment', reference: 'ADJ-00001',
    qtyIn: 0, qtyOut: 2, balance: 5, user: 'Maria Santos', notes: 'Expired units removed' },
]

export const LEDGER_TYPES = {
  sale:          { label: 'Sale',           color: 'text-red-600',    bg: 'bg-red-50',    dir: 'out' },
  purchase:      { label: 'Purchase/GRN',   color: 'text-green-700',  bg: 'bg-green-50',  dir: 'in'  },
  return:        { label: 'Return',         color: 'text-blue-600',   bg: 'bg-blue-50',   dir: 'in'  },
  void_reversal: { label: 'Void Reversal',  color: 'text-purple-600', bg: 'bg-purple-50', dir: 'in'  },
  adjustment:    { label: 'Adjustment',     color: 'text-orange-600', bg: 'bg-orange-50', dir: 'both'},
  stock_take:    { label: 'Stock Take',     color: 'text-teal-600',   bg: 'bg-teal-50',   dir: 'both'},
  manual_in:     { label: 'Manual In',      color: 'text-green-600',  bg: 'bg-green-50',  dir: 'in'  },
  manual_out:    { label: 'Manual Out',     color: 'text-red-500',    bg: 'bg-red-50',    dir: 'out' },
  transfer_in:   { label: 'Transfer In',    color: 'text-cyan-600',   bg: 'bg-cyan-50',   dir: 'in'  },
  transfer_out:  { label: 'Transfer Out',   color: 'text-cyan-700',   bg: 'bg-cyan-50',   dir: 'out' },
}
