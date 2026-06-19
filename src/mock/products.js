export const mockProducts = [
  { id: 1, name: 'Coca-Cola 1.5L', sku: 'BEV-001', barcode: '4800888117090', category: 'Beverages', brand: 'Coca-Cola', description: 'Carbonated soft drink in 1.5 liter bottle.', costPrice: 55, sellingPrice: 75, stock: 48, reorderLevel: 10, unit: 'Bottle', taxCode: 'VAT', trackInventory: true, status: 'active' },
  { id: 2, name: 'Lucky Me Pancit Canton', sku: 'SNK-001', barcode: '4800016874017', category: 'Snacks', brand: 'Lucky Me', description: 'Instant noodles pancit canton flavor.', costPrice: 12, sellingPrice: 16, stock: 120, reorderLevel: 20, unit: 'Pack', taxCode: 'VAT', trackInventory: true, status: 'active' },
  { id: 3, name: 'Del Monte Tomato Sauce 250g', sku: 'GRO-001', barcode: '4800631026021', category: 'Grocery', brand: 'Del Monte', description: 'Tomato sauce in 250g can.', costPrice: 22, sellingPrice: 30, stock: 8, reorderLevel: 15, unit: 'Can', taxCode: 'VAT', trackInventory: true, status: 'active' },
  { id: 4, name: 'Tide Powder 500g', sku: 'HGC-001', barcode: '4902430163514', category: 'Household', brand: 'Tide', description: 'Laundry powder detergent 500g.', costPrice: 40, sellingPrice: 55, stock: 35, reorderLevel: 10, unit: 'Pack', taxCode: 'VAT', trackInventory: true, status: 'active' },
  { id: 5, name: 'Bear Brand Milk 300g', sku: 'DAI-001', barcode: '7613032474126', category: 'Dairy', brand: 'Bear Brand', description: 'Sterilized full cream milk powder 300g.', costPrice: 95, sellingPrice: 120, stock: 5, reorderLevel: 10, unit: 'Can', taxCode: 'VAT', trackInventory: true, status: 'active' },
  { id: 6, name: 'Marlboro Red', sku: 'TOB-001', barcode: '1234567890001', category: 'Tobacco', brand: 'Marlboro', description: 'Marlboro Red cigarettes per pack.', costPrice: 130, sellingPrice: 155, stock: 22, reorderLevel: 5, unit: 'Pack', taxCode: 'VAT', trackInventory: true, status: 'active' },
  { id: 7, name: 'Sky Flakes Crackers', sku: 'SNK-002', barcode: '4800339102604', category: 'Snacks', brand: 'Sky Flakes', description: 'Light and crispy crackers.', costPrice: 8, sellingPrice: 12, stock: 200, reorderLevel: 30, unit: 'Pack', taxCode: 'VAT', trackInventory: true, status: 'active' },
  { id: 8, name: 'Nescafe 3-in-1 Original', sku: 'BEV-002', barcode: '4800998020043', category: 'Beverages', brand: 'Nescafe', description: 'Instant coffee mix sachet.', costPrice: 7, sellingPrice: 10, stock: 300, reorderLevel: 50, unit: 'Sachet', taxCode: 'VAT', trackInventory: true, status: 'active' },
]

export const mockCategories = [
  { id: 1, name: 'Beverages', description: 'Drinks and liquid refreshments', status: 'active' },
  { id: 2, name: 'Snacks', description: 'Chips, crackers, and light snacks', status: 'active' },
  { id: 3, name: 'Grocery', description: 'Canned goods and pantry staples', status: 'active' },
  { id: 4, name: 'Household', description: 'Cleaning and home products', status: 'active' },
  { id: 5, name: 'Dairy', description: 'Milk and dairy products', status: 'active' },
  { id: 6, name: 'Tobacco', description: 'Cigarettes and tobacco products', status: 'active' },
]

export const mockInventoryHistory = {
  1: [
    { id: 1, type: 'in',  qty: 24, balance: 48, reason: 'Stock received from supplier', user: 'Maria Santos', date: '2025-07-08 09:00' },
    { id: 2, type: 'out', qty: 3,  balance: 24, reason: 'Sold — TXN-0011',              user: 'Pedro Reyes',  date: '2025-07-08 11:30' },
    { id: 3, type: 'in',  qty: 27, balance: 51, reason: 'Stock received from supplier', user: 'Maria Santos', date: '2025-07-01 08:00' },
  ],
  2: [
    { id: 1, type: 'in',  qty: 60, balance: 120, reason: 'Stock received from supplier', user: 'Maria Santos', date: '2025-07-05 09:00' },
    { id: 2, type: 'out', qty: 10, balance: 60,  reason: 'Sold — TXN-0008',              user: 'Pedro Reyes',  date: '2025-07-06 10:00' },
  ],
}

export const mockSalesHistory = {
  1: [
    { id: 'TXN-0011', date: '2025-07-08', qty: 2, price: 75, total: 150, cashier: 'Pedro Reyes' },
    { id: 'TXN-0007', date: '2025-07-03', qty: 4, price: 75, total: 300, cashier: 'Pedro Reyes' },
    { id: 'TXN-0003', date: '2025-06-28', qty: 1, price: 75, total: 75,  cashier: 'Pedro Reyes' },
  ],
  2: [
    { id: 'TXN-0008', date: '2025-07-05', qty: 5, price: 16, total: 80, cashier: 'Pedro Reyes' },
    { id: 'TXN-0002', date: '2025-06-30', qty: 3, price: 16, total: 48, cashier: 'Pedro Reyes' },
  ],
}
