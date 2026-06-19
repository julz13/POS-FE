export const mockShifts = [
  {
    id: 'SFT-00001',
    cashier: 'Pedro Reyes', cashierId: 3,
    openedAt: '2026-06-02T08:00:00',
    closedAt: '2026-06-02T18:15:00',
    closedBy: 'Pedro Reyes',
    openingCash: 500,
    movements: [
      { id: 1, type: 'in',  amount: 200, reason: 'Add change money',       recordedBy: 'Pedro Reyes', at: '2026-06-02T10:00:00' },
      { id: 2, type: 'out', amount: 50,  reason: 'Buy tape and staple wire', recordedBy: 'Pedro Reyes', at: '2026-06-02T14:30:00' },
    ],
    cashSales:     291,    // cash received from transactions (TXN-0005: ₱100 + TXN-0006 cash split: ₱129 + TXN-0004 n/a Maya + adjustment)
    changeGiven:   25,     // change returned to customers
    cashInTotal:   200,
    cashOutTotal:  50,
    expectedCash:  916,   // 500 + 291 - 25 + 200 - 50
    countedCash:   920,
    variance:      4,
    notes:         '',
    status: 'closed',
  },
  {
    id: 'SFT-00002',
    cashier: 'Pedro Reyes', cashierId: 3,
    openedAt: '2026-06-01T08:00:00',
    closedAt: '2026-06-01T18:30:00',
    closedBy: 'Pedro Reyes',
    openingCash: 500,
    movements: [
      { id: 1, type: 'out', amount: 80, reason: 'Buy ice and plastic bags', recordedBy: 'Pedro Reyes', at: '2026-06-01T11:00:00' },
    ],
    cashSales:    359,   // TXN-0006 cash portion ₱129 + TXN-0007 (voided) excluded
    changeGiven:  0,
    cashInTotal:  0,
    cashOutTotal: 80,
    expectedCash: 779,  // 500 + 359 - 0 + 0 - 80 = 779
    countedCash:  775,
    variance:     -4,
    notes:        'Short ₱4 — needs investigation',
    status: 'closed',
  },
]

export const PHPDenominations = [
  { label: '₱1,000', value: 1000, type: 'bill' },
  { label: '₱500',   value: 500,  type: 'bill' },
  { label: '₱200',   value: 200,  type: 'bill' },
  { label: '₱100',   value: 100,  type: 'bill' },
  { label: '₱50',    value: 50,   type: 'bill' },
  { label: '₱20',    value: 20,   type: 'bill' },
  { label: '₱20',    value: 20,   type: 'coin' },
  { label: '₱10',    value: 10,   type: 'coin' },
  { label: '₱5',     value: 5,    type: 'coin' },
  { label: '₱1',     value: 1,    type: 'coin' },
  { label: '₱0.25',  value: 0.25, type: 'coin' },
]
