export const mockSalesOrders = [
  {
    id: 'SO-0001',
    customer: 'Juan dela Cruz',
    date: '2025-07-08',
    expectedPickup: '2025-07-10',
    status: 'confirmed',
    items: [
      { productId: 1, name: 'Coca-Cola 1.5L', unit: 'Bottle', qty: 10, price: 75, lineDiscount: 0 },
      { productId: 2, name: 'Lucky Me Pancit Canton', unit: 'Pack', qty: 24, price: 16, lineDiscount: 0 },
    ],
    notes: 'Fiesta order',
    createdBy: 'Maria Santos',
  },
  {
    id: 'SO-0002',
    customer: 'Rosario Bautista',
    date: '2025-07-09',
    expectedPickup: '2025-07-11',
    status: 'draft',
    items: [
      { productId: 5, name: 'Bear Brand Milk 300g', unit: 'Can', qty: 5, price: 120, lineDiscount: 0 },
    ],
    notes: '',
    createdBy: 'Maria Santos',
  },
  {
    id: 'SO-0003',
    customer: 'Carlos Mendoza',
    date: '2025-07-07',
    expectedPickup: '2025-07-08',
    status: 'converted',
    convertedTxn: 'TXN-0003',
    items: [
      { productId: 7, name: 'Sky Flakes Crackers', unit: 'Pack', qty: 50, price: 12, lineDiscount: 5 },
    ],
    notes: 'Converted to sale',
    createdBy: 'Maria Santos',
  },
]

export const mockSOCustomers = [
  'Juan dela Cruz',
  'Rosario Bautista',
  'Carlos Mendoza',
  'Lorna Villanueva',
  'Eduardo Santos',
]
