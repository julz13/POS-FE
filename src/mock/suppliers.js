export const mockSuppliers = [
  {
    id: 1,
    code: 'SUP-0001',
    companyName: 'Coca-Cola Bottlers Philippines',
    contactPerson: 'Jose Reyes',
    phone: '02-8123-4567',
    email: 'jose.reyes@coca-cola.com.ph',
    address: 'Pinagbuhatan, Pasig City',
    taxNumber: '123-456-789-000',
    paymentTerms: 'net30',
    outstandingBalance: 12500,
    totalOrders: 18,
    status: 'active',
    notes: 'Main beverage supplier. Delivers every Monday.',
    createdAt: '2022-01-10',
  },
  {
    id: 2,
    code: 'SUP-0002',
    companyName: 'Monde Nissin Corporation',
    contactPerson: 'Maria Cruz',
    phone: '02-8234-5678',
    email: 'maria.cruz@mondenissin.com',
    address: 'General Trias, Cavite',
    taxNumber: '234-567-890-000',
    paymentTerms: 'net15',
    outstandingBalance: 0,
    totalOrders: 24,
    status: 'active',
    notes: 'Lucky Me and SkyFlakes supplier.',
    createdAt: '2022-03-15',
  },
  {
    id: 3,
    code: 'SUP-0003',
    companyName: 'Del Monte Philippines',
    contactPerson: 'Ramon Santos',
    phone: '02-8345-6789',
    email: 'rsantos@delmonte.com.ph',
    address: 'Bugo, Cagayan de Oro',
    taxNumber: '345-678-901-000',
    paymentTerms: 'cod',
    outstandingBalance: 5800,
    totalOrders: 11,
    status: 'active',
    notes: 'Canned goods and tomato products.',
    createdAt: '2022-06-20',
  },
  {
    id: 4,
    code: 'SUP-0004',
    companyName: 'Procter & Gamble Philippines',
    contactPerson: 'Linda Gomez',
    phone: '02-8456-7890',
    email: 'linda.g@pg.com',
    address: 'McKinley Hill, Taguig',
    taxNumber: '456-789-012-000',
    paymentTerms: 'net30',
    outstandingBalance: 0,
    totalOrders: 9,
    status: 'inactive',
    notes: 'Tide and household products.',
    createdAt: '2023-01-05',
  },
]

export const mockPurchaseOrders = {
  1: [
    { id: 'PO-0021', date: '2025-07-08', items: 4, total: 15000, status: 'received' },
    { id: 'PO-0015', date: '2025-06-24', items: 3, total: 12500, status: 'received' },
    { id: 'PO-0009', date: '2025-06-10', items: 5, total: 18000, status: 'received' },
  ],
  2: [
    { id: 'PO-0020', date: '2025-07-05', items: 6, total: 8400,  status: 'received' },
    { id: 'PO-0013', date: '2025-06-20', items: 4, total: 6200,  status: 'received' },
  ],
  3: [
    { id: 'PO-0018', date: '2025-07-01', items: 3, total: 5800,  status: 'pending' },
    { id: 'PO-0011', date: '2025-06-15', items: 2, total: 3400,  status: 'received' },
  ],
  4: [
    { id: 'PO-0005', date: '2025-04-10', items: 2, total: 9200,  status: 'received' },
  ],
}

export const mockGoodsReceived = {
  1: [
    { id: 'GR-0018', date: '2025-07-09', poRef: 'PO-0021', items: 4, total: 15000 },
    { id: 'GR-0012', date: '2025-06-25', poRef: 'PO-0015', items: 3, total: 12500 },
  ],
  2: [
    { id: 'GR-0017', date: '2025-07-06', poRef: 'PO-0020', items: 6, total: 8400 },
    { id: 'GR-0011', date: '2025-06-21', poRef: 'PO-0013', items: 4, total: 6200 },
  ],
  3: [
    { id: 'GR-0010', date: '2025-06-16', poRef: 'PO-0011', items: 2, total: 3400 },
  ],
  4: [
    { id: 'GR-0004', date: '2025-04-11', poRef: 'PO-0005', items: 2, total: 9200 },
  ],
}
