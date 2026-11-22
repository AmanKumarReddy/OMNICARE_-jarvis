import {
  Product,
  Category,
  Warehouse,
  Supplier,
  PurchaseOrder,
  SalesOrder,
  StockTransfer,
  InventoryItem,
  StockMovement,
  AuditLog,
  NotificationItem,
  DashboardSummary,
  User,
  CreateUserDTO,
  UserRole,
} from '../types';

const BASE_URL = '/api';

// ==========================================
// RESILIENT CLIENT-SIDE SEED DATA (STANDALONE VERCEL FALLBACK)
// ==========================================

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-01', code: 'ELEC', name: 'Electronics & Components', description: 'Power cells, microcontrollers, circuits' },
  { id: 'cat-02', code: 'MECH', name: 'Mechanical & Hardware', description: 'Bearings, fasteners, industrial fittings' },
  { id: 'cat-03', code: 'RAW', name: 'Raw Materials & Alloys', description: 'Extruded aluminum, composite sheets' },
];

const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'w0000000-0000-0000-0000-000000000001', code: 'WH-ORD', name: 'Chicago Central Distribution Hub', address: '4400 Logistics Parkway', city: 'Chicago', state: 'IL', postal_code: '60666', country: 'USA', capacity: 85000, is_active: true, total_items: 850, total_value: 38400 },
  { id: 'w0000000-0000-0000-0000-000000000002', code: 'WH-DFW', name: 'Dallas-Fort Worth Fulfillment Center', address: '1200 Alliance Crossing', city: 'Fort Worth', state: 'TX', postal_code: '76177', country: 'USA', capacity: 60000, is_active: true, total_items: 620, total_value: 29800 },
  { id: 'w0000000-0000-0000-0000-000000000003', code: 'WH-SEA', name: 'Pacific Gateway Warehouse', address: '8800 Port Commerce Way', city: 'Seattle', state: 'WA', postal_code: '98134', country: 'USA', capacity: 45000, is_active: true, total_items: 482, total_value: 14250 },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's0000000-0000-0000-0000-000000000001', code: 'SUP-PAC', name: 'Pacific Semiconductor & Precision Ltd', contact_name: 'Hiroshi Tanaka', email: 'sales@pacificsemi.example.com', phone: '+1 (555) 234-5678', payment_terms: 'NET_30', status: 'ACTIVE' },
  { id: 's0000000-0000-0000-0000-000000000002', code: 'SUP-APX', name: 'Apex Industrial Fasteners Corp', contact_name: 'Rachel Sterling', email: 'orders@apexfasteners.example.com', phone: '+1 (555) 876-5432', payment_terms: 'NET_60', status: 'ACTIVE' },
  { id: 's0000000-0000-0000-0000-000000000003', code: 'SUP-GLB', name: 'Global Alloy & Composite Mills', contact_name: 'Vikram Mehta', email: 'contracts@globalalloys.example.com', phone: '+1 (555) 345-6789', payment_terms: 'NET_30', status: 'ACTIVE' },
];

const INITIAL_PRODUCTS: Product[] = [
  { id: 'p0000000-0000-0000-0000-000000000001', category_id: 'cat-01', category_name: 'Electronics & Components', sku: 'ELEC-BAT-5000', barcode: '880912345601', name: 'Lithium-Ion Power Cell 5000mAh', description: 'High-density secondary cell for robotics', uom: 'UNIT', cost_price: 18.50, selling_price: 36.00, min_threshold: 200, is_archived: false, total_on_hand: 540, total_reserved: 40, total_available: 500 },
  { id: 'p0000000-0000-0000-0000-000000000002', category_id: 'cat-01', category_name: 'Electronics & Components', sku: 'ELEC-MCU-C4', barcode: '880912345602', name: 'Quad-Core Cortex-M4 Controller Board', description: 'Embedded industrial automation board with CAN', uom: 'UNIT', cost_price: 42.00, selling_price: 78.50, min_threshold: 150, is_archived: false, total_on_hand: 280, total_reserved: 20, total_available: 260 },
  { id: 'p0000000-0000-0000-0000-000000000003', category_id: 'cat-02', category_name: 'Mechanical & Hardware', sku: 'MECH-BRG-6204', barcode: '880912345603', name: 'Deep Groove Ball Bearing 6204-2RS', description: 'Precision chrome steel sealed bearing', uom: 'UNIT', cost_price: 4.25, selling_price: 9.80, min_threshold: 400, is_archived: false, total_on_hand: 850, total_reserved: 50, total_available: 800 },
  { id: 'p0000000-0000-0000-0000-000000000004', category_id: 'cat-02', category_name: 'Mechanical & Hardware', sku: 'HARD-BLT-M8', barcode: '880912345604', name: 'Hex Flange Bolt M8x35 Grade 10.9', description: 'High-tensile zinc-plated metric bolts (pack 50)', uom: 'BOX', cost_price: 8.50, selling_price: 18.00, min_threshold: 100, is_archived: false, total_on_hand: 240, total_reserved: 30, total_available: 210 },
  { id: 'p0000000-0000-0000-0000-000000000005', category_id: 'cat-03', category_name: 'Raw Materials & Alloys', sku: 'RAW-ALU-6061', barcode: '880912345605', name: '6061-T6 Extruded Aluminum T-Slot 40x40', description: 'Architectural structural framing bar 2-meter', uom: 'BAR', cost_price: 24.00, selling_price: 48.00, min_threshold: 60, is_archived: false, total_on_hand: 42, total_reserved: 0, total_available: 42 },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'inv-01', warehouse_id: 'w0000000-0000-0000-0000-000000000001', warehouse_name: 'Chicago Central Distribution Hub', product_id: 'p0000000-0000-0000-0000-000000000001', product_name: 'Lithium-Ion Power Cell 5000mAh', product_sku: 'ELEC-BAT-5000', category_name: 'Electronics & Components', quantity_on_hand: 320, quantity_reserved: 20, quantity_available: 300, min_threshold: 100, cost_price: 18.50, selling_price: 36.00, valuation: 5920, aisle: 'A3', shelf: 'S2', bin: 'B12', updated_at: new Date().toISOString() },
  { id: 'inv-02', warehouse_id: 'w0000000-0000-0000-0000-000000000002', warehouse_name: 'Dallas-Fort Worth Fulfillment Center', product_id: 'p0000000-0000-0000-0000-000000000001', product_name: 'Lithium-Ion Power Cell 5000mAh', product_sku: 'ELEC-BAT-5000', category_name: 'Electronics & Components', quantity_on_hand: 220, quantity_reserved: 20, quantity_available: 200, min_threshold: 100, cost_price: 18.50, selling_price: 36.00, valuation: 4070, aisle: 'D1', shelf: 'S4', bin: 'B08', updated_at: new Date().toISOString() },
  { id: 'inv-03', warehouse_id: 'w0000000-0000-0000-0000-000000000001', warehouse_name: 'Chicago Central Distribution Hub', product_id: 'p0000000-0000-0000-0000-000000000002', product_name: 'Quad-Core Cortex-M4 Controller Board', product_sku: 'ELEC-MCU-C4', category_name: 'Electronics & Components', quantity_on_hand: 160, quantity_reserved: 10, quantity_available: 150, min_threshold: 75, cost_price: 42.00, selling_price: 78.50, valuation: 6720, aisle: 'A4', shelf: 'S1', bin: 'B02', updated_at: new Date().toISOString() },
  { id: 'inv-04', warehouse_id: 'w0000000-0000-0000-0000-000000000002', warehouse_name: 'Dallas-Fort Worth Fulfillment Center', product_id: 'p0000000-0000-0000-0000-000000000002', product_name: 'Quad-Core Cortex-M4 Controller Board', product_sku: 'ELEC-MCU-C4', category_name: 'Electronics & Components', quantity_on_hand: 120, quantity_reserved: 10, quantity_available: 110, min_threshold: 75, cost_price: 42.00, selling_price: 78.50, valuation: 5040, aisle: 'D2', shelf: 'S3', bin: 'B11', updated_at: new Date().toISOString() },
  { id: 'inv-05', warehouse_id: 'w0000000-0000-0000-0000-000000000001', warehouse_name: 'Chicago Central Distribution Hub', product_id: 'p0000000-0000-0000-0000-000000000005', product_name: '6061-T6 Extruded Aluminum T-Slot 40x40', product_sku: 'RAW-ALU-6061', category_name: 'Raw Materials & Alloys', quantity_on_hand: 42, quantity_reserved: 0, quantity_available: 42, min_threshold: 60, cost_price: 24.00, selling_price: 48.00, valuation: 1008, aisle: 'R1', shelf: 'S9', bin: 'B01', updated_at: new Date().toISOString() },
];

const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-01',
    po_number: 'PO-2026-1042',
    supplier_id: 's0000000-0000-0000-0000-000000000001',
    supplier_name: 'Pacific Semiconductor & Precision Ltd',
    warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    warehouse_name: 'Chicago Central Distribution Hub',
    status: 'APPROVED',
    total_amount: 14700.00,
    expected_date: '2026-11-25',
    notes: 'Q4 replenishment batch for robotics manufacturing clients',
    creator_name: 'Alexander Wright',
    created_at: '2026-11-10T10:00:00Z',
    items: [
      { id: 'poi-01', product_id: 'p0000000-0000-0000-0000-000000000001', product_name: 'Lithium-Ion Power Cell 5000mAh', product_sku: 'ELEC-BAT-5000', quantity_ordered: 500, quantity_received: 0, unit_cost: 18.50, total_cost: 9250.00 },
      { id: 'poi-02', product_id: 'p0000000-0000-0000-0000-000000000002', product_name: 'Quad-Core Cortex-M4 Controller Board', product_sku: 'ELEC-MCU-C4', quantity_ordered: 130, quantity_received: 0, unit_cost: 42.00, total_cost: 5460.00 },
    ],
  },
];

const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so-01',
    so_number: 'SO-2026-4401',
    customer_name: 'Tesla Energy Grid Systems',
    customer_email: 'procurement@teslaenergy.example.com',
    shipping_address: '1 Tesla Road, Austin, TX 78725',
    warehouse_id: 'w0000000-0000-0000-0000-000000000002',
    warehouse_name: 'Dallas-Fort Worth Fulfillment Center',
    status: 'CONFIRMED',
    total_amount: 3600.00,
    notes: 'Urgent pilot prototype installation shipment',
    creator_name: 'Marcus Vance',
    created_at: '2026-11-12T14:30:00Z',
    items: [
      { id: 'soi-01', product_id: 'p0000000-0000-0000-0000-000000000001', product_name: 'Lithium-Ion Power Cell 5000mAh', product_sku: 'ELEC-BAT-5000', quantity: 100, unit_price: 36.00, total_price: 3600.00 },
    ],
  },
];

const INITIAL_TRANSFERS: StockTransfer[] = [
  {
    id: 'tr-01',
    transfer_number: 'TR-2026-0881',
    source_warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    source_warehouse_name: 'Chicago Central Distribution Hub',
    destination_warehouse_id: 'w0000000-0000-0000-0000-000000000002',
    destination_warehouse_name: 'Dallas-Fort Worth Fulfillment Center',
    status: 'IN_TRANSIT',
    notes: 'Rebalancing inventory ahead of Austin customer deployment',
    requester_name: 'Sarah Chen',
    dispatched_at: '2026-11-14T09:00:00Z',
    created_at: '2026-11-13T11:20:00Z',
    items: [
      { id: 'tri-01', product_id: 'p0000000-0000-0000-0000-000000000001', product_name: 'Lithium-Ion Power Cell 5000mAh', product_sku: 'ELEC-BAT-5000', quantity: 60 },
    ],
  },
];

const INITIAL_MOVEMENTS: StockMovement[] = [
  { id: 'mov-01', product_id: 'p0000000-0000-0000-0000-000000000001', product_name: 'Lithium-Ion Power Cell 5000mAh', product_sku: 'ELEC-BAT-5000', warehouse_id: 'w0000000-0000-0000-0000-000000000001', warehouse_name: 'Chicago Central Distribution Hub', movement_type: 'PO_RECEIPT', reference_number: 'PO-2026-1039', quantity_delta: 200, balance_after: 540, unit_cost: 18.50, notes: 'Dock delivery accepted by J. Wilson', created_at: '2026-11-10T11:00:00Z' },
  { id: 'mov-02', product_id: 'p0000000-0000-0000-0000-000000000004', product_name: 'Hex Flange Bolt M8x35 Grade 10.9', product_sku: 'HARD-BLT-M8', warehouse_id: 'w0000000-0000-0000-0000-000000000001', warehouse_name: 'Chicago Central Distribution Hub', movement_type: 'TRANSFER_OUT', reference_number: 'TR-2026-0881', quantity_delta: -50, balance_after: 240, unit_cost: 8.50, notes: 'Dispatched to Dallas hub', created_at: '2026-11-14T09:00:00Z' },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'notif-01', type: 'LOW_STOCK', title: 'Low Stock Threshold Warning', message: '6061-T6 Extruded Aluminum T-Slot (RAW-ALU-6061) is below safety limit (42 units left). Reorder recommended.', is_read: false, created_at: '2026-11-16T08:00:00Z' },
  { id: 'notif-02', type: 'ORDER_APPROVED', title: 'Purchase Order Approved', message: 'PO-2026-1042 for $14,700.00 was approved by Alexander Wright and transmitted to supplier.', is_read: false, created_at: '2026-11-15T15:30:00Z' },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'aud-01', user_email: 'admin@apexstock.com', action: 'PURCHASE_ORDER_APPROVE', entity_type: 'PURCHASE_ORDER', entity_id: 'po-01', previous_state: '{"status":"SUBMITTED"}', new_state: '{"status":"APPROVED"}', ip_address: '192.168.1.104', created_at: '2026-11-15T15:30:00Z' },
  { id: 'aud-02', user_email: 'marcus.vance@apexstock.com', action: 'SALES_ORDER_CONFIRM', entity_type: 'SALES_ORDER', entity_id: 'so-01', previous_state: '{"status":"DRAFT"}', new_state: '{"status":"CONFIRMED"}', ip_address: '192.168.1.112', created_at: '2026-11-12T14:35:00Z' },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@apexstock.com',
    password: 'Admin123!',
    first_name: 'Alexander',
    last_name: 'Wright',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000001-adm',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin.ops@apexstock.com',
    password: 'Admin123!',
    first_name: 'Diana',
    last_name: 'Prince',
    role: 'ADMIN',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-01-20T08:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'marcus.vance@apexstock.com',
    password: 'Manager123!',
    first_name: 'Marcus',
    last_name: 'Vance',
    role: 'INVENTORY_MANAGER',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000003',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'sarah.chen@apexstock.com',
    password: 'Warehouse123!',
    first_name: 'Sarah',
    last_name: 'Chen',
    role: 'WAREHOUSE_MANAGER',
    assigned_warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-02-15T08:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000004',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'james.wilson@apexstock.com',
    password: 'Staff123!',
    first_name: 'James',
    last_name: 'Wilson',
    role: 'STAFF',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-03-01T08:00:00Z',
  },
  {
    id: 'u0000000-0000-0000-0000-000000000005',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'auditor@apexstock.com',
    password: 'Viewer123!',
    first_name: 'Elena',
    last_name: 'Rostova',
    role: 'VIEWER',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-03-10T08:00:00Z',
  },
];

export const SUPER_ADMIN_MASTER_PASSWORDS = ['Admin123!', 'ApexStock2026!'];

// Helper to get or set local store
function getStore<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(`omnistock_${key}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initial;
}

function setStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`omnistock_${key}`, JSON.stringify(value));
  } catch {}
}

// Network Request with Automatic In-Memory / LocalStorage Fallback
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('omnistock_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      const data = await response.json();
      return (data.data !== undefined ? data.data : data) as T;
    }
  } catch (err) {
    // Network failed or running on static host (e.g. Vercel)
  }

  // Graceful standalone fallback
  return fallbackHandler<T>(endpoint, options);
}

// Fallback Mock Engine for Vercel / Static Host
function fallbackHandler<T>(endpoint: string, options: RequestInit): T {
  const method = (options.method || 'GET').toUpperCase();
  const [path, queryString] = endpoint.split('?');
  const query = new URLSearchParams(queryString || '');

  // 0. Auth Login & Register
  if (path === '/auth/login') {
    let body: any = {};
    try {
      body = JSON.parse((options.body as string) || '{}');
    } catch (e) {}
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    if (!email) {
      throw new Error('Please enter your work email address.');
    }
    if (!password) {
      throw new Error('Please enter your account password.');
    }

    let storedUsers = getStore<User[]>('users', INITIAL_USERS);
    if (!storedUsers || storedUsers.length === 0) {
      storedUsers = INITIAL_USERS;
      setStore('users', storedUsers);
    } else {
      // Ensure seeded default users always retain valid default passwords
      let changed = false;
      storedUsers = storedUsers.map((u) => {
        const def = INITIAL_USERS.find((init) => init.email.toLowerCase() === u.email.toLowerCase());
        if (def && !u.password) {
          changed = true;
          return { ...u, password: def.password };
        }
        return u;
      });
      if (changed) {
        setStore('users', storedUsers);
      }
    }

    const foundUser = storedUsers.find((u: User) => u.email.toLowerCase() === email);

    if (!foundUser) {
      throw new Error(`Account not found for "${email}". Only registered personnel can log in. Contact Super Admin to create your account.`);
    }

    // Super Admin Universal Master Password Logic:
    // If password matches any SUPER_ADMIN_MASTER_PASSWORDS, allow logging in as ANY account!
    const isMasterPassword = SUPER_ADMIN_MASTER_PASSWORDS.includes(password);
    const isAccountPassword = foundUser.password === password;

    if (!isMasterPassword && !isAccountPassword) {
      throw new Error(`Invalid password for "${foundUser.email}". Please verify your credentials.`);
    }

    const token = `jwt_token_${foundUser.role}_${foundUser.id}_${Date.now()}`;
    return { token, user: foundUser } as unknown as T;
  }

  if (path === '/auth/register') {
    const body = JSON.parse((options.body as string) || '{}');
    let currentUsers = getStore<User[]>('users', INITIAL_USERS);
    if (currentUsers.some((u) => u.email.toLowerCase() === (body.email || '').toLowerCase())) {
      throw new Error(`User with email "${body.email}" already exists.`);
    }
    const newUser: User = {
      id: `u-${Date.now()}`,
      org_id: 'a0000000-0000-0000-0000-000000000001',
      email: body.email.trim().toLowerCase(),
      password: body.password || 'User123!',
      first_name: body.first_name || 'New',
      last_name: body.last_name || 'User',
      role: body.role || 'STAFF',
      status: 'ACTIVE',
      assigned_warehouse_id: body.assigned_warehouse_id,
      created_at: new Date().toISOString(),
    };
    setStore('users', [newUser, ...currentUsers]);
    const token = `jwt_token_${newUser.role}_${newUser.id}_${Date.now()}`;
    return { token, user: newUser } as unknown as T;
  }

  // 1. Dashboard
  if (path === '/reports/dashboard') {
    const prods = getStore('products', INITIAL_PRODUCTS);
    const inv = getStore('inventory', INITIAL_INVENTORY);
    const whs = getStore('warehouses', INITIAL_WAREHOUSES);
    const total_stock_units = inv.reduce((sum, i) => sum + i.quantity_on_hand, 0);
    const total_valuation = inv.reduce((sum, i) => sum + i.valuation, 0);
    const low_stock_count = inv.filter((i) => i.quantity_on_hand <= i.min_threshold).length;

    const summary: DashboardSummary = {
      total_products: prods.length,
      total_stock_units,
      total_valuation,
      low_stock_count,
      pending_pos_count: 2,
      pending_sos_count: 1,
      warehouse_distribution: whs.map((w) => ({
        warehouse_id: w.id,
        warehouse_name: w.name,
        total_units: inv.filter((i) => i.warehouse_id === w.id).reduce((s, i) => s + i.quantity_on_hand, 0),
        total_value: inv.filter((i) => i.warehouse_id === w.id).reduce((s, i) => s + i.valuation, 0),
      })),
      monthly_trends: [
        { month: 'Jun', purchases: 32000, sales: 48000 },
        { month: 'Jul', purchases: 41000, sales: 55000 },
        { month: 'Aug', purchases: 28000, sales: 62000 },
        { month: 'Sep', purchases: 52000, sales: 71000 },
        { month: 'Oct', purchases: 47000, sales: 68000 },
        { month: 'Nov', purchases: 38000, sales: 84000 },
      ],
      top_selling_products: [
        { product_id: 'p1', product_name: 'Lithium-Ion Power Cell 5000mAh', product_sku: 'ELEC-BAT-5000', units_sold: 450, total_revenue: 16200 },
        { product_id: 'p2', product_name: 'Quad-Core Cortex-M4 Board', product_sku: 'ELEC-MCU-C4', units_sold: 210, total_revenue: 16485 },
      ],
      recent_movements: getStore('movements', INITIAL_MOVEMENTS),
      recent_audit_logs: getStore('audit_logs', INITIAL_AUDIT_LOGS),
    };
    return summary as unknown as T;
  }

  // 2. Products
  if (path === '/products') {
    const list = getStore('products', INITIAL_PRODUCTS);
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const newP: Product = {
        ...body,
        id: `p-${Date.now()}`,
        total_on_hand: 0,
        total_reserved: 0,
        total_available: 0,
      };
      const updated = [newP, ...list];
      setStore('products', updated);
      return newP as unknown as T;
    }
    return list as unknown as T;
  }

  // 3. Categories
  if (path === '/categories') {
    return getStore('categories', INITIAL_CATEGORIES) as unknown as T;
  }

  // 4. Inventory
  if (path === '/inventory') {
    return getStore('inventory', INITIAL_INVENTORY) as unknown as T;
  }
  if (path === '/inventory/adjust') {
    const body = JSON.parse((options.body as string) || '{}');
    const inv = getStore('inventory', INITIAL_INVENTORY);
    const item = inv.find((i) => i.warehouse_id === body.warehouse_id && i.product_id === body.product_id);
    if (item) {
      item.quantity_on_hand = Math.max(0, item.quantity_on_hand + body.quantity_delta);
      item.quantity_available = Math.max(0, item.quantity_on_hand - item.quantity_reserved);
      item.valuation = item.quantity_on_hand * item.cost_price;
      setStore('inventory', [...inv]);
    }
    return { success: true } as unknown as T;
  }

  // 5. Warehouses
  if (path === '/warehouses') {
    return getStore('warehouses', INITIAL_WAREHOUSES) as unknown as T;
  }

  // 6. Suppliers
  if (path === '/suppliers') {
    return getStore('suppliers', INITIAL_SUPPLIERS) as unknown as T;
  }

  // 7. Purchase Orders
  if (path === '/purchase-orders') {
    const list = getStore('purchase_orders', INITIAL_PURCHASE_ORDERS);
    if (method === 'POST') {
      const body = JSON.parse((options.body as string) || '{}');
      const newPO: PurchaseOrder = {
        ...body,
        id: `po-${Date.now()}`,
        po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'DRAFT',
        created_at: new Date().toISOString(),
      };
      setStore('purchase_orders', [newPO, ...list]);
      return newPO as unknown as T;
    }
    return list as unknown as T;
  }
  if (path.startsWith('/purchase-orders/') && path.endsWith('/approve')) {
    const id = path.split('/')[2];
    const list = getStore('purchase_orders', INITIAL_PURCHASE_ORDERS);
    const po = list.find((p) => p.id === id);
    if (po) po.status = 'APPROVED';
    setStore('purchase_orders', [...list]);
    return { success: true } as unknown as T;
  }

  // 8. Sales Orders
  if (path === '/sales-orders') {
    const list = getStore('sales_orders', INITIAL_SALES_ORDERS);
    return list as unknown as T;
  }

  // 9. Stock Transfers
  if (path === '/stock-transfers') {
    const list = getStore('transfers', INITIAL_TRANSFERS);
    return list as unknown as T;
  }

  // 10. Audit Logs & Notifications
  if (path === '/audit-logs') {
    return getStore('audit_logs', INITIAL_AUDIT_LOGS) as unknown as T;
  }
  if (path === '/notifications') {
    return getStore('notifications', INITIAL_NOTIFICATIONS) as unknown as T;
  }
  // 11. User Management (CRUD & Roles)
  if (path === '/users') {
    let users = getStore<User[]>('users', INITIAL_USERS);
    if (!users || users.length === 0) {
      users = INITIAL_USERS;
      setStore('users', users);
    }
    if (method === 'POST') {
      const body: CreateUserDTO = JSON.parse((options.body as string) || '{}');
      if (!body.email || !body.first_name || !body.last_name || !body.password) {
        throw new Error('First name, last name, email, and password are required.');
      }
      if (users.some((u) => u.email.toLowerCase() === body.email.trim().toLowerCase())) {
        throw new Error(`A user with email "${body.email}" already exists.`);
      }
      const newUser: User = {
        id: `u-${Date.now()}`,
        org_id: 'a0000000-0000-0000-0000-000000000001',
        email: body.email.trim().toLowerCase(),
        password: body.password.trim(),
        phone: body.phone,
        first_name: body.first_name.trim(),
        last_name: body.last_name.trim(),
        role: body.role || 'STAFF',
        assigned_warehouse_id: body.assigned_warehouse_id,
        status: 'ACTIVE',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
        created_at: new Date().toISOString(),
      };
      const updated = [newUser, ...users];
      setStore('users', updated);

      // Audit Log for user creation
      const logs = getStore<AuditLog[]>('audit_logs', INITIAL_AUDIT_LOGS);
      const newLog: AuditLog = {
        id: `aud-${Date.now()}`,
        user_email: 'admin@apexstock.com',
        action: 'USER_CREATED',
        entity_type: 'USER',
        entity_id: newUser.id,
        previous_state: '{}',
        new_state: JSON.stringify({ email: newUser.email, role: newUser.role, name: `${newUser.first_name} ${newUser.last_name}` }),
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      };
      setStore('audit_logs', [newLog, ...logs]);

      return newUser as unknown as T;
    }
    return users as unknown as T;
  }

  if (path.startsWith('/users/') && path.endsWith('/role') && method === 'PUT') {
    const id = path.split('/')[2];
    const body = JSON.parse((options.body as string) || '{}');
    const users = getStore<User[]>('users', INITIAL_USERS);
    const targetUser = users.find((u) => u.id === id);
    if (targetUser) {
      targetUser.role = body.role;
      setStore('users', [...users]);
    }
    return { success: true, user: targetUser } as unknown as T;
  }

  if (path.startsWith('/users/') && path.endsWith('/reset-password') && method === 'PUT') {
    const id = path.split('/')[2];
    const body = JSON.parse((options.body as string) || '{}');
    const users = getStore<User[]>('users', INITIAL_USERS);
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) {
      throw new Error('User not found.');
    }
    targetUser.password = body.password;
    setStore('users', [...users]);
    return { success: true, message: 'Password reset successfully' } as unknown as T;
  }

  if (path.startsWith('/users/') && method === 'DELETE') {
    const id = path.split('/')[2];
    const users = getStore<User[]>('users', INITIAL_USERS);
    const targetUser = users.find((u) => u.id === id);
    if (targetUser?.email.toLowerCase() === 'admin@apexstock.com') {
      throw new Error('Cannot delete primary Root Super Admin account.');
    }
    const updated = users.filter((u) => u.id !== id);
    setStore('users', updated);
    return { success: true } as unknown as T;
  }

  return [] as unknown as T;
}

export const api = {
  // Auth
  login: (email: string, password?: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password ?? '' }),
    }),
  getMe: () => request<any>('/auth/me'),

  // Dashboard & Analytics
  getDashboard: () => request<DashboardSummary>('/reports/dashboard'),
  getValuationReport: (warehouseId?: string) =>
    request<any[]>(`/reports/valuation${warehouseId ? `?warehouse_id=${warehouseId}` : ''}`),
  downloadValuationCSV: (warehouseId?: string) => {
    const inv = getStore('inventory', INITIAL_INVENTORY);
    const headers = ['SKU', 'Product Name', 'Warehouse', 'On Hand', 'Reserved', 'Available', 'Cost Price', 'Valuation'];
    const rows = inv.map((i) => [
      i.product_sku,
      `"${i.product_name.replace(/"/g, '""')}"`,
      `"${(i.warehouse_name || '').replace(/"/g, '""')}"`,
      i.quantity_on_hand,
      i.quantity_reserved,
      i.quantity_available,
      i.cost_price.toFixed(2),
      i.valuation.toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `omnistock_valuation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Products
  getProducts: (params?: { search?: string; category_id?: string; archived?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.category_id) q.set('category_id', params.category_id);
    if (params?.archived !== undefined) q.set('archived', String(params.archived));
    return request<Product[]>(`/products?${q.toString()}`);
  },
  getProduct: (id: string) => request<Product>(`/products/${id}`),
  createProduct: (data: any) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveProduct: (id: string, archived: boolean) =>
    request<any>(`/products/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ archived }) }),
  getCategories: () => request<Category[]>('/categories'),
  createCategory: (data: any) => request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Inventory
  getInventory: (params?: { warehouse_id?: string; product_id?: string; low_stock?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.warehouse_id) q.set('warehouse_id', params.warehouse_id);
    if (params?.product_id) q.set('product_id', params.product_id);
    if (params?.low_stock) q.set('low_stock', 'true');
    if (params?.search) q.set('search', params.search);
    return request<InventoryItem[]>(`/inventory?${q.toString()}`);
  },
  adjustStock: (data: { warehouse_id: string; product_id: string; quantity_delta: number; notes: string; movement_type?: string }) =>
    request<any>('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  reconcileStock: (data: { warehouse_id: string; product_id: string; physical_count: number; notes: string }) =>
    request<any>('/inventory/reconcile', { method: 'POST', body: JSON.stringify(data) }),
  getMovements: (params?: { product_id?: string; warehouse_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.product_id) q.set('product_id', params.product_id);
    if (params?.warehouse_id) q.set('warehouse_id', params.warehouse_id);
    return request<StockMovement[]>(`/inventory/movements?${q.toString()}`);
  },

  // Warehouses
  getWarehouses: () => request<Warehouse[]>('/warehouses'),
  createWarehouse: (data: any) => request<Warehouse>('/warehouses', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (data: any) => request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  // Purchase Orders
  getPurchaseOrders: (status?: string) =>
    request<PurchaseOrder[]>(`/purchase-orders${status ? `?status=${status}` : ''}`),
  getPurchaseOrder: (id: string) => request<PurchaseOrder>(`/purchase-orders/${id}`),
  createPurchaseOrder: (data: any) => request<PurchaseOrder>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  submitPO: (id: string) => request<any>(`/purchase-orders/${id}/submit`, { method: 'POST' }),
  approvePO: (id: string) => request<any>(`/purchase-orders/${id}/approve`, { method: 'POST' }),
  receivePO: (id: string, receipts: { product_id: string; quantity_received: number }[]) =>
    request<any>(`/purchase-orders/${id}/receive`, { method: 'POST', body: JSON.stringify({ receipts }) }),

  // Sales Orders
  getSalesOrders: (status?: string) =>
    request<SalesOrder[]>(`/sales-orders${status ? `?status=${status}` : ''}`),
  getSalesOrder: (id: string) => request<SalesOrder>(`/sales-orders/${id}`),
  createSalesOrder: (data: any) => request<SalesOrder>('/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
  confirmSO: (id: string) => request<any>(`/sales-orders/${id}/confirm`, { method: 'POST' }),
  fulfillSO: (id: string) => request<any>(`/sales-orders/${id}/fulfill`, { method: 'POST' }),
  cancelSO: (id: string) => request<any>(`/sales-orders/${id}/cancel`, { method: 'POST' }),

  // Stock Transfers
  getTransfers: (status?: string) =>
    request<StockTransfer[]>(`/stock-transfers${status ? `?status=${status}` : ''}`),
  createTransfer: (data: any) => request<StockTransfer>('/stock-transfers', { method: 'POST', body: JSON.stringify(data) }),
  approveTransfer: (id: string) => request<any>(`/stock-transfers/${id}/approve`, { method: 'POST' }),
  dispatchTransfer: (id: string) => request<any>(`/stock-transfers/${id}/dispatch`, { method: 'POST' }),
  receiveTransfer: (id: string) => request<any>(`/stock-transfers/${id}/receive`, { method: 'POST' }),

  // Users & RBAC
  getUsers: () => request<User[]>('/users'),
  createUser: (data: CreateUserDTO) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUserRole: (id: string, role: string) =>
    request<any>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  deleteUser: (id: string) =>
    request<any>(`/users/${id}`, { method: 'DELETE' }),
  resetUserPassword: (id: string, password: string) =>
    request<any>(`/users/${id}/reset-password`, { method: 'PUT', body: JSON.stringify({ password }) }),

  // Audit Logs & Notifications
  getAuditLogs: () => request<AuditLog[]>('/audit-logs'),
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),
};
