// One record per payment method per transaction (split payments = multiple records)
export const mockPayments = [
  {
    id: 'PMT-00001', referenceNumber: 'PMT-00001',
    transactionId: 'TXN-0001', date: '2026-06-03T09:15:00',
    paymentType: 'Cash', amount: 300,
    cashier: 'Pedro Reyes', customer: null,
    status: 'completed', voidedAt: null, voidedBy: null, voidReason: null,
  },
  {
    id: 'PMT-00002', referenceNumber: 'PMT-00002',
    transactionId: 'TXN-0002', date: '2026-06-03T10:30:00',
    paymentType: 'GCash', amount: 108,
    cashier: 'Pedro Reyes', customer: 'Rosario Bautista',
    status: 'completed', voidedAt: null, voidedBy: null, voidReason: null,
  },
  {
    id: 'PMT-00003', referenceNumber: 'PMT-00003',
    transactionId: 'TXN-0003', date: '2026-06-03T11:45:00',
    paymentType: 'Cash', amount: 500,
    cashier: 'Pedro Reyes', customer: null,
    status: 'completed', voidedAt: null, voidedBy: null, voidReason: null,
  },
  {
    id: 'PMT-00004', referenceNumber: 'PMT-00004',
    transactionId: 'TXN-0004', date: '2026-06-02T14:20:00',
    paymentType: 'Maya', amount: 216,
    cashier: 'Pedro Reyes', customer: 'Juan dela Cruz',
    status: 'completed', voidedAt: null, voidedBy: null, voidReason: null,
  },
  {
    id: 'PMT-00005', referenceNumber: 'PMT-00005',
    transactionId: 'TXN-0005', date: '2026-06-02T15:00:00',
    paymentType: 'Cash', amount: 100,
    cashier: 'Pedro Reyes', customer: null,
    status: 'completed', voidedAt: null, voidedBy: null, voidReason: null,
  },
  // TXN-0006 was a split payment — 2 records
  {
    id: 'PMT-00006', referenceNumber: 'PMT-00006',
    transactionId: 'TXN-0006', date: '2026-06-01T09:00:00',
    paymentType: 'GCash', amount: 200,
    cashier: 'Pedro Reyes', customer: null,
    status: 'completed', voidedAt: null, voidedBy: null, voidReason: null,
  },
  {
    id: 'PMT-00007', referenceNumber: 'PMT-00007',
    transactionId: 'TXN-0006', date: '2026-06-01T09:00:00',
    paymentType: 'Cash', amount: 129,
    cashier: 'Pedro Reyes', customer: null,
    status: 'completed', voidedAt: null, voidedBy: null, voidReason: null,
  },
  // TXN-0007 was voided — payment also voided
  {
    id: 'PMT-00008', referenceNumber: 'PMT-00008',
    transactionId: 'TXN-0007', date: '2026-06-01T10:00:00',
    paymentType: 'Cash', amount: 230,
    cashier: 'Pedro Reyes', customer: null,
    status: 'voided',
    voidedAt: '2026-06-01T10:45:00',
    voidedBy: 'Maria Santos',
    voidReason: 'Wrong items scanned — customer cancelled',
  },
]

export const PAYMENT_TYPES = ['Cash', 'GCash', 'Maya', 'QRPH', 'Debit', 'Credit', 'Store Credit', 'Bank Transfer', 'Gift Voucher']
export const ELECTRONIC_TYPES = new Set(['GCash', 'Maya', 'QRPH', 'Debit', 'Credit', 'Bank Transfer'])

export const PAYMENT_STYLE = {
  Cash:             { bg: 'bg-green-100',  text: 'text-green-700'  },
  GCash:            { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  Maya:             { bg: 'bg-violet-100', text: 'text-violet-700' },
  QRPH:             { bg: 'bg-teal-100',   text: 'text-teal-700'   },
  Debit:            { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  Credit:           { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Store Credit':   { bg: 'bg-pink-100',   text: 'text-pink-700'   },
  'Bank Transfer':  { bg: 'bg-gray-100',   text: 'text-gray-700'   },
  'Gift Voucher':   { bg: 'bg-yellow-100', text: 'text-yellow-700' },
}
