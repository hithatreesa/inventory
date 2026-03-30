export interface Item {
  id: string;
  name: string;
  sku: string;
  category: 'Hardware' | 'Software' | 'Networking';
  stock: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  warehouse?: string;
  brand?: string;
  image?: string;
}

export const mockItems: Item[] = [
  {
    id: '1',
    name: 'Workstation Pro X1',
    sku: 'WST-2024-X1',
    category: 'Hardware',
    stock: 142,
    price: 2499.00,
    status: 'In Stock',
    warehouse: 'Main Distribution',
    brand: 'Nvidia'
  },
  {
    id: '2',
    name: 'Quantum Tablet 11"',
    sku: 'QNT-TAB-11',
    category: 'Hardware',
    stock: 12,
    price: 899.00,
    status: 'Low Stock',
    warehouse: 'Secondary Hub',
    brand: 'Intel'
  },
  {
    id: '3',
    name: 'Neural Cloud License',
    sku: 'LIC-CLD-ENT',
    category: 'Software',
    stock: 0,
    price: 12000.00,
    status: 'Out of Stock',
    warehouse: 'Digital Vault',
    brand: 'Apex'
  },
  {
    id: '4',
    name: 'Apex Switch L3',
    sku: 'NET-SW-APEX',
    category: 'Networking',
    stock: 45,
    price: 1150.00,
    status: 'In Stock',
    warehouse: 'Main Distribution',
    brand: 'Cisco'
  },
  {
    id: '5',
    name: 'Quantum Processor X1',
    sku: 'QP-9902-X',
    category: 'Hardware',
    stock: 2,
    price: 4500.00,
    status: 'Low Stock',
    warehouse: 'Main Distribution',
    brand: 'Intel'
  },
  {
    id: '6',
    name: 'NVMe Rack - 2TB',
    sku: 'SS-2019-R',
    category: 'Hardware',
    stock: 15,
    price: 299.00,
    status: 'Low Stock',
    warehouse: 'Secondary Hub',
    brand: 'Samsung'
  },
  {
    id: '7',
    name: 'Fiber Router V6',
    sku: 'FR-7721-B',
    category: 'Networking',
    stock: 11,
    price: 189.00,
    status: 'Low Stock',
    warehouse: 'Main Distribution',
    brand: 'Nokia'
  }
];

export const dashboardStats = {
  todaySales: 42904.50,
  salesTrend: 12.5,
  purchases: 18230.15,
  purchaseTrend: -4.2,
  profitMargin: 25,
  profitTargetMet: true,
};

export const categorySplit = [
  { name: 'Cloud Infrastructure', value: 42 },
  { name: 'Data Analytics', value: 28 },
  { name: 'Security Suite', value: 18 },
  { name: 'API Connectors', value: 12 },
];

export const bestPerformingAssets = [
  { id: 'bpa-1', name: 'Architect Pro License', volume: 1240, revenue: 15400 },
  { id: 'bpa-2', name: 'Data Stream Unlimited', volume: 892, revenue: 12180 },
  { id: 'bpa-3', name: 'Security Vault Elite', volume: 455, revenue: 9230 },
];

export const stockTransferData = {
  txnId: 'TXN-8842',
  source: {
    name: 'North Distribution Hub',
    zone: 'Zone A - Cold Storage',
    capacity: 82,
  },
  target: {
    name: 'Central Metro Fulfillment',
    space: '4,200 sq.ft.',
    arrival: 'Tomorrow, 09:00 AM',
  },
  lineItems: [
    { id: '101', name: 'Onyx Pro Laptops', batch: 'B-2024-X1', sku: 'LP-ONYX-2024', inStock: 142, transferQty: 15, unitValue: 1249.00 },
    { id: '102', name: 'Prism Tab Mini', batch: 'B-2023-P5', sku: 'TB-PRISM-M', inStock: 892, transferQty: 200, unitValue: 499.00 },
    { id: '103', name: 'Studio Wireless X', batch: 'B-2024-H1', sku: 'HP-STUDIO-WX', inStock: 45, transferQty: 10, unitValue: 299.50 },
  ],
  metadata: {
    expectedArrival: 'May 24, 2024',
    logisticsPriority: 'High - Express Route',
  }
};

export const serialNumberRegistry = [
  { id: 'SN-001', asset: 'Industrial Turbine X-40', sn: 'SN-992384-BLX', status: 'OPERATIONAL', site: 'Houston Central Tech', lastModified: 'Oct 24, 2023' },
  { id: 'SN-002', asset: 'Edge Node Controller', sn: 'SN-110293-ENX', status: 'MAINTENANCE', site: 'Berlin Data Annex', lastModified: 'Oct 22, 2023' },
  { id: 'SN-003', asset: 'Logic Core v2.4', sn: 'SN-443821-LCV', status: 'OPERATIONAL', site: 'Tokyo Smart Plant', lastModified: 'Oct 21, 2023' },
];

export const auditLogs = [
  { id: 'LOG-1', title: 'Registry Entry Modified: SN-992384-BLX', desc: 'Updated by System Architect • 12 minutes ago', type: 'System', time: '12 minutes ago' },
  { id: 'LOG-2', title: 'New Batch Registration', desc: 'Bulk import from "Facility_Houston_09" • 4 hours ago', type: 'User', time: '4 hours ago' },
  { id: 'LOG-3', title: 'Audit Exception Flagged', desc: 'Mismatched serial format detected in 12 entries • Yesterday', type: 'Error', time: 'Yesterday' },
];
