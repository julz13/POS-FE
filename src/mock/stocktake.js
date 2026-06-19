export const mockStockTakes = [
  {
    id: 'ST-00001',
    date: '2026-06-01',
    status: 'posted',
    notes: 'Monthly physical count — June 1',
    createdBy: 'Maria Santos',
    completedAt: '2026-06-01T17:00:00',
    postedAt: '2026-06-01T17:30:00',
    postedBy: 'Maria Santos',
    items: [
      { productId: 1, productName: 'Coca-Cola 1.5L',       sku: 'BEV-001', systemQty: 50, countedQty: 48, variance: -2, notes: '2 bottles broken' },
      { productId: 2, productName: 'Lucky Me Pancit Canton', sku: 'SNK-001', systemQty: 125, countedQty: 120, variance: -5, notes: 'Missing — possibly miscounted' },
      { productId: 8, productName: 'Nescafe 3-in-1 Original', sku: 'BEV-002', systemQty: 302, countedQty: 300, variance: -2, notes: '' },
    ],
  },
]
