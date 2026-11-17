import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS headers
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Disposition');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ==========================================
// IN-MEMORY / PERSISTENT STATE ENGINE
// ==========================================

const org = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'Apex Global Logistics & Distribution',
  slug: 'apex-global',
  currency: 'USD',
  timezone: 'America/Chicago',
  address: '1000 Distribution Parkway, Suite 400, Chicago, IL 60607',
};

let users = [
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    org_id: org.id,
    email: 'admin@apexstock.com',
    first_name: 'Alexander',
    last_name: 'Wright',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    created_at: new Date('2026-01-15T08:00:00Z').toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    org_id: org.id,
    email: 'marcus.vance@apexstock.com',
    first_name: 'Marcus',
    last_name: 'Vance',
    role: 'INVENTORY_MANAGER',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    created_at: new Date('2026-02-01T08:00:00Z').toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000003',
    org_id: org.id,
    email: 'sarah.chen@apexstock.com',
    first_name: 'Sarah',
    last_name: 'Chen',
    role: 'WAREHOUSE_MANAGER',
    assigned_warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    created_at: new Date('2026-02-15T08:00:00Z').toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000004',
    org_id: org.id,
    email: 'james.wilson@apexstock.com',
    first_name: 'James',
    last_name: 'Wilson',
    role: 'STAFF',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    created_at: new Date('2026-03-01T08:00:00Z').toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000005',
    org_id: org.id,
    email: 'auditor@apexstock.com',
    first_name: 'Elena',
    last_name: 'Rostova',
    role: 'VIEWER',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    created_at: new Date('2026-03-10T08:00:00Z').toISOString(),
  },
];

let categories = [
  { id: 'c0000000-0000-0000-0000-000000000001', code: 'ELEC', name: 'Electronics & Components', description: 'Microcontrollers, sensors, power modules, and passive components' },
  { id: 'c0000000-0000-0000-0000-000000000002', code: 'HARD', name: 'Industrial Hardware & Tools', description: 'Fasteners, calibrated hand tools, and bearings' },
  { id: 'c0000000-0000-0000-0000-000000000003', code: 'MED', name: 'Medical Consumables', description: 'Surgical masks, diagnostic sensors, and PPE' },
  { id: 'c0000000-0000-0000-0000-000000000004', code: 'PACK', name: 'Packaging & Dispatch', description: 'Corrugated boxes, thermal labels, and tapes' },
];

let warehouses = [
  {
    id: 'w0000000-0000-0000-0000-000000000001',
    code: 'WH-ORD',
    name: 'Chicago Central Distribution Hub',
    address: "4400 O'Hare Logistics Way",
    city: 'Chicago',
    state: 'IL',
    postal_code: '60666',
    country: 'USA',
    manager_id: 'u0000000-0000-0000-0000-000000000003',
    manager_name: 'Sarah Chen',
    capacity: 120000,
    is_active: true,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000002',
    code: 'WH-JFK',
    name: 'East Coast Fulfillment Depot',
    address: '180 Port Newark Boulevard',
    city: 'Newark',
    state: 'NJ',
    postal_code: '07114',
    country: 'USA',
    capacity: 85000,
    is_active: true,
  },
  {
    id: 'w0000000-0000-0000-0000-000000000003',
    code: 'WH-LAX',
    name: 'West Coast Maritime Gateway',
    address: '920 Harbor Scenic Expressway',
    city: 'Long Beach',
    state: 'CA',
    postal_code: '90802',
    country: 'USA',
    capacity: 95000,
    is_active: true,
  },
];

let suppliers = [
  {
    id: 's0000000-0000-0000-0000-000000000001',
    code: 'SUP-001',
    name: 'Global Microtech Precision Ltd',
    contact_name: 'David Sterling',
    email: 'sales@globalmicrotech.io',
    phone: '+1 (512) 555-0144',
    address: '4200 Semiconductor Blvd',
    city: 'Austin, TX',
    payment_terms: 'Net 30',
    status: 'ACTIVE',
  },
  {
    id: 's0000000-0000-0000-0000-000000000002',
    code: 'SUP-002',
    name: 'Pacific Industrial Fasteners Corp',
    contact_name: 'Rachel Tanaka',
    email: 'orders@pacificfasteners.com',
    phone: '+1 (206) 555-0182',
    address: '880 Harbor Industrial Ave',
    city: 'Seattle, WA',
    payment_terms: 'Net 45',
    status: 'ACTIVE',
  },
  {
    id: 's0000000-0000-0000-0000-000000000003',
    code: 'SUP-003',
    name: 'Apex BioMed Consumables Inc',
    contact_name: 'Dr. Aris Thorne',
    email: 'procurement@apexbio.org',
    phone: '+1 (617) 555-0199',
    address: '350 Kendall Street',
    city: 'Boston, MA',
    payment_terms: 'Net 15',
    status: 'ACTIVE',
  },
  {
    id: 's0000000-0000-0000-0000-000000000004',
    code: 'SUP-004',
    name: 'EcoPack Global Logistics Supply',
    contact_name: 'Monica Morales',
    email: 'accounts@ecopackglobal.com',
    phone: '+1 (404) 555-0130',
    address: '150 Fulton Industrial Blvd',
    city: 'Atlanta, GA',
    payment_terms: 'Net 30',
    status: 'ACTIVE',
  },
];

let products = [
  {
    id: 'p0000000-0000-0000-0000-000000000001',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    category_name: 'Electronics & Components',
    sku: 'ELEC-MC-04',
    barcode: '890123450001',
    name: 'ARM Cortex-M4 Microcontroller Core Module',
    description: 'Industrial grade 32-bit RISC microcontroller with CAN bus and hardware crypto engine',
    uom: 'Units',
    cost_price: 24.50,
    selling_price: 48.00,
    min_threshold: 50,
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&auto=format&fit=crop&q=80',
    is_archived: false,
    created_at: new Date('2026-01-20T10:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000002',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    category_name: 'Electronics & Components',
    sku: 'ELEC-MOT-24',
    barcode: '890123450002',
    name: 'Brushless DC Servo Motor 24V 350W',
    description: 'Precision motor with optical encoder and integrated thermal shutoff protection',
    uom: 'Units',
    cost_price: 115.00,
    selling_price: 195.00,
    min_threshold: 25,
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80',
    is_archived: false,
    created_at: new Date('2026-01-22T10:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000003',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    category_name: 'Industrial Hardware & Tools',
    sku: 'HARD-BLT-M8',
    barcode: '890123450003',
    name: 'Grade 316 Stainless Hex Bolts M8x40 (Box 500)',
    description: 'Marine grade passivated corrosion-resistant structural fasteners',
    uom: 'Boxes',
    cost_price: 42.00,
    selling_price: 78.50,
    min_threshold: 30,
    image_url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=200&auto=format&fit=crop&q=80',
    is_archived: false,
    created_at: new Date('2026-01-25T10:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000004',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    category_name: 'Industrial Hardware & Tools',
    sku: 'HARD-CAL-IP67',
    barcode: '890123450004',
    name: 'Digital Vernier Caliper 150mm IP67 Coolant-Proof',
    description: 'Hardened stainless steel with thumb roller and ISO 17025 calibration cert',
    uom: 'Units',
    cost_price: 68.00,
    selling_price: 135.00,
    min_threshold: 15,
    image_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=200&auto=format&fit=crop&q=80',
    is_archived: false,
    created_at: new Date('2026-02-01T10:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000005',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    category_name: 'Medical Consumables',
    sku: 'MED-N95-50P',
    barcode: '890123450005',
    name: 'NIOSH N95 Particulate Respirator (Pack of 50)',
    description: 'Foldable medical-grade particulate respirator with adjustable aluminum nose clip',
    uom: 'Packs',
    cost_price: 18.50,
    selling_price: 34.99,
    min_threshold: 100,
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80',
    is_archived: false,
    created_at: new Date('2026-02-05T10:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000006',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    category_name: 'Medical Consumables',
    sku: 'MED-GLV-NIT-L',
    barcode: '890123450006',
    name: 'Heavy-Duty Chem-Resistant Nitrile Gloves (Box 100)',
    description: 'Latex-free 6mil textured grip powder-free examination gloves',
    uom: 'Boxes',
    cost_price: 9.20,
    selling_price: 17.50,
    min_threshold: 80,
    image_url: 'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=200&auto=format&fit=crop&q=80',
    is_archived: false,
    created_at: new Date('2026-02-10T10:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000007',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    category_name: 'Packaging & Dispatch',
    sku: 'PACK-LBL-4X6',
    barcode: '890123450007',
    name: 'Direct Thermal Shipping Labels 4x6 (Roll 1000)',
    description: 'Permanent adhesive perforated fanfold rolls for industrial Zebra printers',
    uom: 'Rolls',
    cost_price: 11.00,
    selling_price: 21.00,
    min_threshold: 60,
    image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
    is_archived: false,
    created_at: new Date('2026-02-12T10:00:00Z').toISOString(),
  },
  {
    id: 'p0000000-0000-0000-0000-000000000008',
    category_id: 'c0000000-0000-0000-0000-000000000004',
    category_name: 'Packaging & Dispatch',
    sku: 'PACK-BOX-12X',
    barcode: '890123450008',
    name: 'Heavy Corrugated Shipping Cartons 12x12x12 (Bundle 25)',
    description: '200# Mullen test single-wall craft corrugated dispatch boxes',
    uom: 'Bundles',
    cost_price: 22.50,
    selling_price: 42.00,
    min_threshold: 40,
    image_url: 'https://images.unsplash.com/photo-1586528116493-a029325540fa?w=200&auto=format&fit=crop&q=80',
    is_archived: false,
    created_at: new Date('2026-02-15T10:00:00Z').toISOString(),
  },
];

let inventory = [
  // WH-ORD (Chicago)
  { id: 'i0000000-0000-0000-0000-000000000001', warehouse_id: 'w0000000-0000-0000-0000-000000000001', product_id: 'p0000000-0000-0000-0000-000000000001', quantity_on_hand: 340, quantity_reserved: 40, aisle: 'A-01', shelf: 'S-03', bin: 'B-12', updated_at: new Date().toISOString() },
  { id: 'i0000000-0000-0000-0000-000000000002', warehouse_id: 'w0000000-0000-0000-0000-000000000001', product_id: 'p0000000-0000-0000-0000-000000000002', quantity_on_hand: 12, quantity_reserved: 0, aisle: 'A-02', shelf: 'S-01', bin: 'B-04', updated_at: new Date().toISOString() }, // LOW STOCK!
  { id: 'i0000000-0000-0000-0000-000000000003', warehouse_id: 'w0000000-0000-0000-0000-000000000001', product_id: 'p0000000-0000-0000-0000-000000000003', quantity_on_hand: 180, quantity_reserved: 20, aisle: 'B-04', shelf: 'S-02', bin: 'B-09', updated_at: new Date().toISOString() },
  { id: 'i0000000-0000-0000-0000-000000000004', warehouse_id: 'w0000000-0000-0000-0000-000000000001', product_id: 'p0000000-0000-0000-0000-000000000005', quantity_on_hand: 450, quantity_reserved: 50, aisle: 'C-01', shelf: 'S-04', bin: 'B-20', updated_at: new Date().toISOString() },
  { id: 'i0000000-0000-0000-0000-000000000005', warehouse_id: 'w0000000-0000-0000-0000-000000000001', product_id: 'p0000000-0000-0000-0000-000000000007', quantity_on_hand: 220, quantity_reserved: 0, aisle: 'D-02', shelf: 'S-01', bin: 'B-01', updated_at: new Date().toISOString() },

  // WH-JFK (Newark)
  { id: 'i0000000-0000-0000-0000-000000000006', warehouse_id: 'w0000000-0000-0000-0000-000000000002', product_id: 'p0000000-0000-0000-0000-000000000001', quantity_on_hand: 120, quantity_reserved: 0, aisle: 'A-01', shelf: 'S-02', bin: 'B-05', updated_at: new Date().toISOString() },
  { id: 'i0000000-0000-0000-0000-000000000007', warehouse_id: 'w0000000-0000-0000-0000-000000000002', product_id: 'p0000000-0000-0000-0000-000000000004', quantity_on_hand: 45, quantity_reserved: 0, aisle: 'B-03', shelf: 'S-01', bin: 'B-08', updated_at: new Date().toISOString() },
  { id: 'i0000000-0000-0000-0000-000000000008', warehouse_id: 'w0000000-0000-0000-0000-000000000002', product_id: 'p0000000-0000-0000-0000-000000000006', quantity_on_hand: 310, quantity_reserved: 30, aisle: 'C-02', shelf: 'S-05', bin: 'B-15', updated_at: new Date().toISOString() },

  // WH-LAX (Long Beach)
  { id: 'i0000000-0000-0000-0000-000000000009', warehouse_id: 'w0000000-0000-0000-0000-000000000003', product_id: 'p0000000-0000-0000-0000-000000000002', quantity_on_hand: 85, quantity_reserved: 10, aisle: 'A-04', shelf: 'S-01', bin: 'B-02', updated_at: new Date().toISOString() },
  { id: 'i0000000-0000-0000-0000-000000000010', warehouse_id: 'w0000000-0000-0000-0000-000000000003', product_id: 'p0000000-0000-0000-0000-000000000008', quantity_on_hand: 190, quantity_reserved: 0, aisle: 'D-01', shelf: 'S-02', bin: 'B-11', updated_at: new Date().toISOString() },
];

let purchaseOrders = [
  {
    id: 'po000000-0000-0000-0000-000000000001',
    po_number: 'PO-2026-0891',
    supplier_id: 's0000000-0000-0000-0000-000000000001',
    supplier_name: 'Global Microtech Precision Ltd',
    warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    warehouse_name: 'Chicago Central Distribution Hub',
    status: 'APPROVED',
    total_amount: 11500.00,
    expected_date: '2026-11-20',
    notes: 'Restock order for high-demand brushless DC servo motors',
    created_by: 'u0000000-0000-0000-0000-000000000002',
    creator_name: 'Marcus Vance',
    approved_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    items: [
      {
        id: 'poi00000-0000-0000-0000-000000000001',
        product_id: 'p0000000-0000-0000-0000-000000000002',
        product_name: 'Brushless DC Servo Motor 24V 350W',
        product_sku: 'ELEC-MOT-24',
        quantity_ordered: 100,
        quantity_received: 0,
        unit_cost: 115.00,
        total_cost: 11500.00,
      },
    ],
  },
  {
    id: 'po000000-0000-0000-0000-000000000002',
    po_number: 'PO-2026-0892',
    supplier_id: 's0000000-0000-0000-0000-000000000003',
    supplier_name: 'Apex BioMed Consumables Inc',
    warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    warehouse_name: 'Chicago Central Distribution Hub',
    status: 'PARTIALLY_RECEIVED',
    total_amount: 3700.00,
    expected_date: '2026-11-15',
    notes: 'Q4 seasonal medical replenishment',
    created_by: 'u0000000-0000-0000-0000-000000000002',
    creator_name: 'Marcus Vance',
    approved_by: 'u0000000-0000-0000-0000-000000000001',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: [
      {
        id: 'poi00000-0000-0000-0000-000000000002',
        product_id: 'p0000000-0000-0000-0000-000000000005',
        product_name: 'NIOSH N95 Particulate Respirator (Pack of 50)',
        product_sku: 'MED-N95-50P',
        quantity_ordered: 200,
        quantity_received: 100,
        unit_cost: 18.50,
        total_cost: 3700.00,
      },
    ],
  },
];

let salesOrders = [
  {
    id: 'so000000-0000-0000-0000-000000000001',
    so_number: 'SO-2026-4421',
    customer_name: 'OmniTech Robotics Systems Corp',
    customer_email: 'procure@omnitech-robotics.com',
    shipping_address: '720 Innovation Way, Austin, TX 78701',
    warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    warehouse_name: 'Chicago Central Distribution Hub',
    status: 'CONFIRMED',
    total_amount: 1920.00,
    created_by: 'u0000000-0000-0000-0000-000000000004',
    creator_name: 'James Wilson',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: [
      {
        id: 'soi00000-0000-0000-0000-000000000001',
        product_id: 'p0000000-0000-0000-0000-000000000001',
        product_name: 'ARM Cortex-M4 Microcontroller Core Module',
        product_sku: 'ELEC-MC-04',
        quantity: 40,
        unit_price: 48.00,
        total_price: 1920.00,
      },
    ],
  },
  {
    id: 'so000000-0000-0000-0000-000000000002',
    so_number: 'SO-2026-4422',
    customer_name: 'Midwest Surgical Center',
    customer_email: 'purchasing@midwestsurgical.org',
    shipping_address: '120 Medical Plaza, Chicago, IL 60611',
    warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    warehouse_name: 'Chicago Central Distribution Hub',
    status: 'FULFILLED',
    total_amount: 1749.50,
    created_by: 'u0000000-0000-0000-0000-000000000004',
    creator_name: 'James Wilson',
    fulfilled_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    items: [
      {
        id: 'soi00000-0000-0000-0000-000000000002',
        product_id: 'p0000000-0000-0000-0000-000000000005',
        product_name: 'NIOSH N95 Particulate Respirator (Pack of 50)',
        product_sku: 'MED-N95-50P',
        quantity: 50,
        unit_price: 34.99,
        total_price: 1749.50,
      },
    ],
  },
];

let stockTransfers = [
  {
    id: 'tr000000-0000-0000-0000-000000000001',
    transfer_number: 'TR-2026-0155',
    source_warehouse_id: 'w0000000-0000-0000-0000-000000000003',
    source_warehouse_name: 'West Coast Maritime Gateway',
    destination_warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    destination_warehouse_name: 'Chicago Central Distribution Hub',
    status: 'IN_TRANSIT',
    notes: 'Emergency inter-facility stock balance of servo motors to ORD',
    requested_by: 'u0000000-0000-0000-0000-000000000002',
    requester_name: 'Marcus Vance',
    approved_by: 'u0000000-0000-0000-0000-000000000001',
    dispatched_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    items: [
      {
        id: 'tri00000-0000-0000-0000-000000000001',
        product_id: 'p0000000-0000-0000-0000-000000000002',
        product_name: 'Brushless DC Servo Motor 24V 350W',
        product_sku: 'ELEC-MOT-24',
        quantity: 20,
      },
    ],
  },
];

let stockMovements = [
  {
    id: 'sm000000-0000-0000-0000-000000000001',
    product_id: 'p0000000-0000-0000-0000-000000000005',
    product_name: 'NIOSH N95 Particulate Respirator (Pack of 50)',
    product_sku: 'MED-N95-50P',
    warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    warehouse_name: 'Chicago Central Distribution Hub',
    movement_type: 'PURCHASE_RECEIPT',
    reference_type: 'PURCHASE_ORDER',
    reference_number: 'PO-2026-0892',
    quantity_delta: 100,
    balance_after: 450,
    unit_cost: 18.50,
    notes: 'Partial dock receipt received by J. Wilson',
    created_by_name: 'James Wilson',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sm000000-0000-0000-0000-000000000002',
    product_id: 'p0000000-0000-0000-0000-000000000005',
    product_name: 'NIOSH N95 Particulate Respirator (Pack of 50)',
    product_sku: 'MED-N95-50P',
    warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    warehouse_name: 'Chicago Central Distribution Hub',
    movement_type: 'SALE_FULFILLMENT',
    reference_type: 'SALES_ORDER',
    reference_number: 'SO-2026-4422',
    quantity_delta: -50,
    balance_after: 400,
    unit_cost: 18.50,
    notes: 'Dispatched to Midwest Surgical Center',
    created_by_name: 'James Wilson',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'sm000000-0000-0000-0000-000000000003',
    product_id: 'p0000000-0000-0000-0000-000000000002',
    product_name: 'Brushless DC Servo Motor 24V 350W',
    product_sku: 'ELEC-MOT-24',
    warehouse_id: 'w0000000-0000-0000-0000-000000000003',
    warehouse_name: 'West Coast Maritime Gateway',
    movement_type: 'TRANSFER_OUT',
    reference_type: 'STOCK_TRANSFER',
    reference_number: 'TR-2026-0155',
    quantity_delta: -20,
    balance_after: 85,
    unit_cost: 115.00,
    notes: 'Transit dispatched to WH-ORD',
    created_by_name: 'Marcus Vance',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

let auditLogs = [
  {
    id: 'aud00000-0000-0000-0000-000000000001',
    user_email: 'admin@apexstock.com',
    action: 'PURCHASE_ORDER_APPROVE',
    entity_type: 'PURCHASE_ORDER',
    entity_id: 'po000000-0000-0000-0000-000000000001',
    previous_state: '{"status": "SUBMITTED"}',
    new_state: '{"status": "APPROVED"}',
    ip_address: '192.168.1.104',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'aud00000-0000-0000-0000-000000000002',
    user_email: 'james.wilson@apexstock.com',
    action: 'SALES_ORDER_FULFILL',
    entity_type: 'SALES_ORDER',
    entity_id: 'so000000-0000-0000-0000-000000000002',
    previous_state: '{"status": "CONFIRMED"}',
    new_state: '{"status": "FULFILLED"}',
    ip_address: '192.168.1.140',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

let notifications = [
  {
    id: 'not00000-0000-0000-0000-000000000001',
    user_id: 'u0000000-0000-0000-0000-000000000001',
    type: 'LOW_STOCK',
    title: 'Low Stock Alert: Brushless DC Servo Motor 24V',
    message: 'Warehouse WH-ORD is at 12 units (threshold is 25). Replenishment recommended immediately.',
    link: '/inventory',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'not00000-0000-0000-0000-000000000002',
    user_id: 'u0000000-0000-0000-0000-000000000001',
    type: 'PURCHASE_ORDER',
    title: 'Purchase Order PO-2026-0891 Approved',
    message: 'PO-2026-0891 has been authorized for supplier Global Microtech ($11,500.00).',
    link: '/purchase-orders',
    is_read: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'not00000-0000-0000-0000-000000000003',
    user_id: 'u0000000-0000-0000-0000-000000000001',
    type: 'TRANSFER',
    title: 'Stock Transfer TR-2026-0155 In Transit',
    message: '20 units of Brushless DC Servo Motor dispatched from WH-LAX to WH-ORD.',
    link: '/transfers',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

// Helper to log audit
function recordAudit(userEmail: string, action: string, entityType: string, entityId: string, prev: any, next: any) {
  auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    user_email: userEmail || 'admin@apexstock.com',
    action,
    entity_type: entityType,
    entity_id: entityId,
    previous_state: typeof prev === 'string' ? prev : JSON.stringify(prev),
    new_state: typeof next === 'string' ? next : JSON.stringify(next),
    ip_address: '127.0.0.1',
    created_at: new Date().toISOString(),
  });
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'HEALTHY',
      service: 'omnistock-cloud-api',
      version: '2.4.0',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
    },
  });
});

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((u) => u.email.toLowerCase() === email?.toLowerCase());
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  // Token simulation
  const token = `jwt_token_${user.id}_${Date.now()}`;
  res.json({
    success: true,
    data: {
      token,
      user,
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, first_name, last_name, role } = req.body;
  if (!email || !first_name || !last_name) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ success: false, error: 'Email already registered' });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    org_id: org.id,
    email,
    first_name,
    last_name,
    role: role || 'STAFF',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString(),
  };
  users.push(newUser);

  res.status(201).json({
    success: true,
    data: {
      token: `jwt_token_${newUser.id}_${Date.now()}`,
      user: newUser,
    },
  });
});

app.get('/api/auth/me', (req, res) => {
  // Return admin by default or matching bearer
  const token = req.headers.authorization?.replace('Bearer ', '');
  let user = users[0];
  if (token) {
    const matched = users.find((u) => token.includes(u.id));
    if (matched) user = matched;
  }
  res.json({ success: true, data: user });
});

// Products & Categories
app.get('/api/products', (req, res) => {
  const { search, category_id, archived } = req.query;
  let filtered = [...products];

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode?.toLowerCase().includes(q));
  }
  if (category_id) {
    filtered = filtered.filter((p) => p.category_id === category_id);
  }
  if (archived !== undefined) {
    const isArch = archived === 'true' || archived === '1';
    filtered = filtered.filter((p) => p.is_archived === isArch);
  } else {
    filtered = filtered.filter((p) => !p.is_archived);
  }

  // Calculate aggregated stock across warehouses
  const enriched = filtered.map((p) => {
    const invRecords = inventory.filter((i) => i.product_id === p.id);
    const total_on_hand = invRecords.reduce((sum, r) => sum + r.quantity_on_hand, 0);
    const total_reserved = invRecords.reduce((sum, r) => sum + r.quantity_reserved, 0);
    return {
      ...p,
      total_on_hand,
      total_reserved,
      total_available: total_on_hand - total_reserved,
    };
  });

  res.json({
    success: true,
    data: enriched,
    meta: { total: enriched.length, limit: 50, page: 1 },
  });
});

app.get('/api/products/:id', (req, res) => {
  const p = products.find((prod) => prod.id === req.params.id);
  if (!p) return res.status(404).json({ success: false, error: 'Product not found' });

  const invRecords = inventory.filter((i) => i.product_id === p.id);
  const total_on_hand = invRecords.reduce((sum, r) => sum + r.quantity_on_hand, 0);
  const total_reserved = invRecords.reduce((sum, r) => sum + r.quantity_reserved, 0);

  res.json({
    success: true,
    data: {
      ...p,
      total_on_hand,
      total_reserved,
      total_available: total_on_hand - total_reserved,
      warehouse_breakdown: invRecords.map((r) => {
        const wh = warehouses.find((w) => w.id === r.warehouse_id);
        return {
          warehouse_id: r.warehouse_id,
          warehouse_name: wh?.name || 'Unknown',
          quantity_on_hand: r.quantity_on_hand,
          quantity_reserved: r.quantity_reserved,
          quantity_available: r.quantity_on_hand - r.quantity_reserved,
          aisle: r.aisle,
          shelf: r.shelf,
          bin: r.bin,
        };
      }),
    },
  });
});

app.post('/api/products', (req, res) => {
  const { name, sku, barcode, category_id, description, uom, cost_price, selling_price, min_threshold, image_url } = req.body;
  if (!name || !sku) {
    return res.status(400).json({ success: false, error: 'Name and SKU are required' });
  }

  if (products.some((p) => p.sku.toLowerCase() === sku.toLowerCase())) {
    return res.status(400).json({ success: false, error: `SKU '${sku}' already exists` });
  }

  const category = categories.find((c) => c.id === category_id);

  const newProd = {
    id: `p-${Date.now()}`,
    category_id,
    category_name: category?.name || 'General',
    sku: sku.toUpperCase(),
    barcode: barcode || '',
    name,
    description: description || '',
    uom: uom || 'Units',
    cost_price: Number(cost_price) || 0,
    selling_price: Number(selling_price) || 0,
    min_threshold: Number(min_threshold) || 10,
    image_url: image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80',
    is_archived: false,
    created_at: new Date().toISOString(),
  };

  products.push(newProd);

  // Initialize 0 balance across existing warehouses
  warehouses.forEach((wh) => {
    inventory.push({
      id: `i-${Date.now()}-${wh.code}`,
      warehouse_id: wh.id,
      product_id: newProd.id,
      quantity_on_hand: 0,
      quantity_reserved: 0,
      aisle: 'A-01',
      shelf: 'S-01',
      bin: 'B-01',
      updated_at: new Date().toISOString(),
    });
  });

  recordAudit('admin@apexstock.com', 'PRODUCT_CREATE', 'PRODUCT', newProd.id, null, newProd);

  res.status(201).json({ success: true, data: newProd });
});

app.put('/api/products/:id', (req, res) => {
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Product not found' });

  const existing = products[idx];
  const { name, sku, barcode, category_id, description, uom, cost_price, selling_price, min_threshold, image_url } = req.body;

  if (sku && sku !== existing.sku && products.some((p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== existing.id)) {
    return res.status(400).json({ success: false, error: `SKU '${sku}' already in use` });
  }

  const category = categories.find((c) => c.id === (category_id || existing.category_id));

  const updated = {
    ...existing,
    name: name !== undefined ? name : existing.name,
    sku: sku !== undefined ? sku.toUpperCase() : existing.sku,
    barcode: barcode !== undefined ? barcode : existing.barcode,
    category_id: category_id !== undefined ? category_id : existing.category_id,
    category_name: category?.name || existing.category_name,
    description: description !== undefined ? description : existing.description,
    uom: uom !== undefined ? uom : existing.uom,
    cost_price: cost_price !== undefined ? Number(cost_price) : existing.cost_price,
    selling_price: selling_price !== undefined ? Number(selling_price) : existing.selling_price,
    min_threshold: min_threshold !== undefined ? Number(min_threshold) : existing.min_threshold,
    image_url: image_url !== undefined ? image_url : existing.image_url,
  };

  products[idx] = updated;
  recordAudit('admin@apexstock.com', 'PRODUCT_UPDATE', 'PRODUCT', updated.id, existing, updated);

  res.json({ success: true, data: updated });
});

app.patch('/api/products/:id/archive', (req, res) => {
  const prod = products.find((p) => p.id === req.params.id);
  if (!prod) return res.status(404).json({ success: false, error: 'Product not found' });

  prod.is_archived = req.body.archived !== undefined ? Boolean(req.body.archived) : true;
  recordAudit('admin@apexstock.com', 'PRODUCT_ARCHIVE', 'PRODUCT', prod.id, null, { is_archived: prod.is_archived });

  res.json({ success: true, message: 'Archive status updated' });
});

app.get('/api/categories', (_req, res) => {
  res.json({ success: true, data: categories });
});

app.post('/api/categories', (req, res) => {
  const { code, name, description } = req.body;
  if (!code || !name) return res.status(400).json({ success: false, error: 'Code and name required' });
  const newCat = { id: `c-${Date.now()}`, code: code.toUpperCase(), name, description: description || '' };
  categories.push(newCat);
  res.status(201).json({ success: true, data: newCat });
});

// Inventory
app.get('/api/inventory', (req, res) => {
  const { warehouse_id, product_id, low_stock, search } = req.query;

  let list = inventory.map((inv) => {
    const prod = products.find((p) => p.id === inv.product_id);
    const wh = warehouses.find((w) => w.id === inv.warehouse_id);
    return {
      ...inv,
      product_name: prod?.name || 'Unknown',
      product_sku: prod?.sku || 'UNKNOWN',
      category_name: prod?.category_name || 'General',
      min_threshold: prod?.min_threshold || 10,
      cost_price: prod?.cost_price || 0,
      selling_price: prod?.selling_price || 0,
      valuation: (inv.quantity_on_hand * (prod?.cost_price || 0)),
      quantity_available: inv.quantity_on_hand - inv.quantity_reserved,
      warehouse_name: wh?.name || 'Unknown',
    };
  });

  if (warehouse_id) {
    list = list.filter((i) => i.warehouse_id === warehouse_id);
  }
  if (product_id) {
    list = list.filter((i) => i.product_id === product_id);
  }
  if (low_stock === 'true' || low_stock === '1') {
    list = list.filter((i) => i.quantity_on_hand <= i.min_threshold);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter((i) => i.product_name.toLowerCase().includes(q) || i.product_sku.toLowerCase().includes(q) || i.warehouse_name.toLowerCase().includes(q));
  }

  res.json({
    success: true,
    data: list,
    meta: { total: list.length, limit: 50, page: 1 },
  });
});

app.post('/api/inventory/adjust', (req, res) => {
  const { warehouse_id, product_id, quantity_delta, notes, movement_type } = req.body;
  if (!warehouse_id || !product_id || quantity_delta === undefined || Number(quantity_delta) === 0) {
    return res.status(400).json({ success: false, error: 'warehouse_id, product_id, and non-zero quantity_delta required' });
  }

  let inv = inventory.find((i) => i.warehouse_id === warehouse_id && i.product_id === product_id);
  if (!inv) {
    inv = {
      id: `i-${Date.now()}`,
      warehouse_id,
      product_id,
      quantity_on_hand: 0,
      quantity_reserved: 0,
      aisle: 'A-01',
      shelf: 'S-01',
      bin: 'B-01',
      updated_at: new Date().toISOString(),
    };
    inventory.push(inv);
  }

  const delta = Number(quantity_delta);
  const newOnHand = inv.quantity_on_hand + delta;
  if (newOnHand < 0) {
    return res.status(400).json({ success: false, error: `Adjustment delta (${delta}) would cause negative stock (current: ${inv.quantity_on_hand})` });
  }
  if (newOnHand < inv.quantity_reserved) {
    return res.status(400).json({ success: false, error: `New on-hand (${newOnHand}) cannot fall below reserved stock (${inv.quantity_reserved})` });
  }

  const prevOnHand = inv.quantity_on_hand;
  inv.quantity_on_hand = newOnHand;
  inv.updated_at = new Date().toISOString();

  const prod = products.find((p) => p.id === product_id);
  const wh = warehouses.find((w) => w.id === warehouse_id);

  stockMovements.unshift({
    id: `sm-${Date.now()}`,
    product_id,
    product_name: prod?.name || '',
    product_sku: prod?.sku || '',
    warehouse_id,
    warehouse_name: wh?.name || '',
    movement_type: movement_type || (delta > 0 ? 'ADJUSTMENT_INCREASE' : 'ADJUSTMENT_DECREASE'),
    reference_type: 'MANUAL_ADJUSTMENT',
    reference_number: 'ADJ-MANUAL',
    quantity_delta: delta,
    balance_after: newOnHand,
    unit_cost: prod?.cost_price || 0,
    notes: notes || 'Manual inventory adjustment',
    created_by_name: 'Alexander Wright',
    created_at: new Date().toISOString(),
  });

  recordAudit('admin@apexstock.com', 'STOCK_ADJUSTMENT', 'INVENTORY', inv.id, { quantity_on_hand: prevOnHand }, { quantity_on_hand: newOnHand, delta });

  res.json({
    success: true,
    data: {
      ...inv,
      quantity_available: inv.quantity_on_hand - inv.quantity_reserved,
    },
  });
});

app.post('/api/inventory/reconcile', (req, res) => {
  const { warehouse_id, product_id, physical_count, notes } = req.body;
  if (!warehouse_id || !product_id || physical_count === undefined || Number(physical_count) < 0) {
    return res.status(400).json({ success: false, error: 'Valid warehouse_id, product_id, and non-negative physical_count required' });
  }

  let inv = inventory.find((i) => i.warehouse_id === warehouse_id && i.product_id === product_id);
  if (!inv) {
    inv = {
      id: `i-${Date.now()}`,
      warehouse_id,
      product_id,
      quantity_on_hand: 0,
      quantity_reserved: 0,
      aisle: 'A-01',
      shelf: 'S-01',
      bin: 'B-01',
      updated_at: new Date().toISOString(),
    };
    inventory.push(inv);
  }

  const targetCount = Number(physical_count);
  const delta = targetCount - inv.quantity_on_hand;
  const prevOnHand = inv.quantity_on_hand;

  inv.quantity_on_hand = targetCount;
  inv.updated_at = new Date().toISOString();

  const prod = products.find((p) => p.id === product_id);
  const wh = warehouses.find((w) => w.id === warehouse_id);

  stockMovements.unshift({
    id: `sm-${Date.now()}`,
    product_id,
    product_name: prod?.name || '',
    product_sku: prod?.sku || '',
    warehouse_id,
    warehouse_name: wh?.name || '',
    movement_type: 'RECONCILIATION',
    reference_type: 'STOCK_COUNT',
    reference_number: 'REC-CYCLE-COUNT',
    quantity_delta: delta,
    balance_after: targetCount,
    unit_cost: prod?.cost_price || 0,
    notes: notes || `Reconciled from ${prevOnHand} to ${targetCount} (delta: ${delta > 0 ? '+' : ''}${delta})`,
    created_by_name: 'Alexander Wright',
    created_at: new Date().toISOString(),
  });

  recordAudit('admin@apexstock.com', 'STOCK_RECONCILE', 'INVENTORY', inv.id, { quantity_on_hand: prevOnHand }, { quantity_on_hand: targetCount, delta });

  res.json({
    success: true,
    data: {
      ...inv,
      quantity_available: inv.quantity_on_hand - inv.quantity_reserved,
    },
  });
});

app.get('/api/inventory/movements', (req, res) => {
  const { product_id, warehouse_id } = req.query;
  let list = [...stockMovements];
  if (product_id) list = list.filter((m) => m.product_id === product_id);
  if (warehouse_id) list = list.filter((m) => m.warehouse_id === warehouse_id);

  res.json({
    success: true,
    data: list,
    meta: { total: list.length, limit: 50, page: 1 },
  });
});

// Warehouses
app.get('/api/warehouses', (_req, res) => {
  const enriched = warehouses.map((wh) => {
    const whInv = inventory.filter((i) => i.warehouse_id === wh.id);
    const total_items = whInv.reduce((sum, i) => sum + i.quantity_on_hand, 0);
    const total_value = whInv.reduce((sum, i) => {
      const p = products.find((prod) => prod.id === i.product_id);
      return sum + i.quantity_on_hand * (p?.cost_price || 0);
    }, 0);

    return {
      ...wh,
      total_items,
      total_value,
    };
  });
  res.json({ success: true, data: enriched });
});

app.post('/api/warehouses', (req, res) => {
  const { code, name, address, city, state, postal_code, country, capacity, manager_id } = req.body;
  if (!code || !name) return res.status(400).json({ success: false, error: 'Code and name are required' });

  const mgr = users.find((u) => u.id === manager_id);

  const newWh = {
    id: `w-${Date.now()}`,
    code: code.toUpperCase(),
    name,
    address: address || '',
    city: city || '',
    state: state || '',
    postal_code: postal_code || '',
    country: country || 'USA',
    manager_id: manager_id || null,
    manager_name: mgr ? `${mgr.first_name} ${mgr.last_name}` : undefined,
    capacity: Number(capacity) || 50000,
    is_active: true,
  };
  warehouses.push(newWh);

  // Initialize inventory entries for new warehouse
  products.forEach((p) => {
    inventory.push({
      id: `i-${Date.now()}-${p.sku}`,
      warehouse_id: newWh.id,
      product_id: p.id,
      quantity_on_hand: 0,
      quantity_reserved: 0,
      aisle: 'A-01',
      shelf: 'S-01',
      bin: 'B-01',
      updated_at: new Date().toISOString(),
    });
  });

  recordAudit('admin@apexstock.com', 'WAREHOUSE_CREATE', 'WAREHOUSE', newWh.id, null, newWh);
  res.status(201).json({ success: true, data: newWh });
});

// Suppliers
app.get('/api/suppliers', (_req, res) => {
  res.json({ success: true, data: suppliers });
});

app.post('/api/suppliers', (req, res) => {
  const { code, name, contact_name, email, phone, address, city, payment_terms } = req.body;
  if (!code || !name) return res.status(400).json({ success: false, error: 'Code and name are required' });

  const newSupp = {
    id: `s-${Date.now()}`,
    code: code.toUpperCase(),
    name,
    contact_name: contact_name || '',
    email: email || '',
    phone: phone || '',
    address: address || '',
    city: city || '',
    payment_terms: payment_terms || 'Net 30',
    status: 'ACTIVE',
  };
  suppliers.push(newSupp);
  recordAudit('admin@apexstock.com', 'SUPPLIER_CREATE', 'SUPPLIER', newSupp.id, null, newSupp);
  res.status(201).json({ success: true, data: newSupp });
});

// Purchase Orders
app.get('/api/purchase-orders', (req, res) => {
  const { status } = req.query;
  let list = [...purchaseOrders];
  if (status) list = list.filter((p) => p.status === status);
  res.json({ success: true, data: list });
});

app.get('/api/purchase-orders/:id', (req, res) => {
  const po = purchaseOrders.find((p) => p.id === req.params.id);
  if (!po) return res.status(404).json({ success: false, error: 'Purchase order not found' });
  res.json({ success: true, data: po });
});

app.post('/api/purchase-orders', (req, res) => {
  const { supplier_id, warehouse_id, expected_date, notes, items } = req.body;
  if (!supplier_id || !warehouse_id || !items || items.length === 0) {
    return res.status(400).json({ success: false, error: 'supplier_id, warehouse_id, and items are required' });
  }

  const supp = suppliers.find((s) => s.id === supplier_id);
  const wh = warehouses.find((w) => w.id === warehouse_id);

  const poItems = items.map((it: any) => {
    const prod = products.find((p) => p.id === it.product_id);
    const cost = Number(it.unit_cost) || prod?.cost_price || 0;
    const qty = Number(it.quantity_ordered) || 1;
    return {
      id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: it.product_id,
      product_name: prod?.name || '',
      product_sku: prod?.sku || '',
      quantity_ordered: qty,
      quantity_received: 0,
      unit_cost: cost,
      total_cost: qty * cost,
    };
  });

  const total_amount = poItems.reduce((sum: number, it: any) => sum + it.total_cost, 0);

  const newPO = {
    id: `po-${Date.now()}`,
    po_number: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    supplier_id,
    supplier_name: supp?.name || '',
    warehouse_id,
    warehouse_name: wh?.name || '',
    status: 'DRAFT',
    total_amount,
    expected_date: expected_date || '',
    notes: notes || '',
    created_by: 'u0000000-0000-0000-0000-000000000001',
    creator_name: 'Alexander Wright',
    approved_by: '',
    created_at: new Date().toISOString(),
    items: poItems,
  };

  purchaseOrders.unshift(newPO);
  recordAudit('admin@apexstock.com', 'PURCHASE_ORDER_CREATE', 'PURCHASE_ORDER', newPO.id, null, newPO);
  res.status(201).json({ success: true, data: newPO });
});

app.post('/api/purchase-orders/:id/submit', (req, res) => {
  const po = purchaseOrders.find((p) => p.id === req.params.id);
  if (!po) return res.status(404).json({ success: false, error: 'PO not found' });
  po.status = 'SUBMITTED';
  recordAudit('admin@apexstock.com', 'PURCHASE_ORDER_SUBMIT', 'PURCHASE_ORDER', po.id, { status: 'DRAFT' }, { status: 'SUBMITTED' });
  res.json({ success: true, message: 'Submitted for approval' });
});

app.post('/api/purchase-orders/:id/approve', (req, res) => {
  const po = purchaseOrders.find((p) => p.id === req.params.id);
  if (!po) return res.status(404).json({ success: false, error: 'PO not found' });
  po.status = 'APPROVED';
  po.approved_by = 'u0000000-0000-0000-0000-000000000001';
  recordAudit('admin@apexstock.com', 'PURCHASE_ORDER_APPROVE', 'PURCHASE_ORDER', po.id, { status: 'SUBMITTED' }, { status: 'APPROVED' });
  res.json({ success: true, message: 'PO approved successfully' });
});

app.post('/api/purchase-orders/:id/receive', (req, res) => {
  const po = purchaseOrders.find((p) => p.id === req.params.id);
  if (!po) return res.status(404).json({ success: false, error: 'PO not found' });
  if (po.status !== 'APPROVED' && po.status !== 'PARTIALLY_RECEIVED') {
    return res.status(400).json({ success: false, error: `Cannot receive PO in '${po.status}' status (must be APPROVED or PARTIALLY_RECEIVED)` });
  }

  const { receipts } = req.body; // array of { product_id, quantity_received }
  if (!receipts || receipts.length === 0) {
    return res.status(400).json({ success: false, error: 'Receipt quantities required' });
  }

  for (const rcv of receipts) {
    const item = po.items.find((it: any) => it.product_id === rcv.product_id);
    if (!item) continue;
    const rcvQty = Number(rcv.quantity_received) || 0;
    if (rcvQty <= 0) continue;

    if (item.quantity_received + rcvQty > item.quantity_ordered) {
      return res.status(400).json({ success: false, error: `Receiving ${rcvQty} would exceed ordered quantity for ${item.product_sku}` });
    }

    item.quantity_received += rcvQty;

    // Atomically increment inventory
    let inv = inventory.find((i) => i.warehouse_id === po.warehouse_id && i.product_id === rcv.product_id);
    if (!inv) {
      inv = {
        id: `i-${Date.now()}`,
        warehouse_id: po.warehouse_id,
        product_id: rcv.product_id,
        quantity_on_hand: 0,
        quantity_reserved: 0,
        aisle: 'A-01',
        shelf: 'S-01',
        bin: 'B-01',
        updated_at: new Date().toISOString(),
      };
      inventory.push(inv);
    }

    inv.quantity_on_hand += rcvQty;
    inv.updated_at = new Date().toISOString();

    const prod = products.find((p) => p.id === rcv.product_id);
    const wh = warehouses.find((w) => w.id === po.warehouse_id);

    stockMovements.unshift({
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: rcv.product_id,
      product_name: prod?.name || '',
      product_sku: prod?.sku || '',
      warehouse_id: po.warehouse_id,
      warehouse_name: wh?.name || '',
      movement_type: 'PURCHASE_RECEIPT',
      reference_type: 'PURCHASE_ORDER',
      reference_number: po.po_number,
      quantity_delta: rcvQty,
      balance_after: inv.quantity_on_hand,
      unit_cost: item.unit_cost,
      notes: `Receipt against ${po.po_number}`,
      created_by_name: 'Alexander Wright',
      created_at: new Date().toISOString(),
    });
  }

  const allFulfilled = po.items.every((it: any) => it.quantity_received >= it.quantity_ordered);
  po.status = allFulfilled ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

  recordAudit('admin@apexstock.com', 'PURCHASE_ORDER_RECEIVE', 'PURCHASE_ORDER', po.id, null, { status: po.status, receipts });
  res.json({ success: true, data: po });
});

// Sales Orders
app.get('/api/sales-orders', (req, res) => {
  const { status } = req.query;
  let list = [...salesOrders];
  if (status) list = list.filter((s) => s.status === status);
  res.json({ success: true, data: list });
});

app.get('/api/sales-orders/:id', (req, res) => {
  const so = salesOrders.find((s) => s.id === req.params.id);
  if (!so) return res.status(404).json({ success: false, error: 'Sales order not found' });
  res.json({ success: true, data: so });
});

app.post('/api/sales-orders', (req, res) => {
  const { customer_name, customer_email, shipping_address, warehouse_id, notes, items } = req.body;
  if (!customer_name || !warehouse_id || !items || items.length === 0) {
    return res.status(400).json({ success: false, error: 'customer_name, warehouse_id, and items required' });
  }

  const wh = warehouses.find((w) => w.id === warehouse_id);

  const soItems = items.map((it: any) => {
    const prod = products.find((p) => p.id === it.product_id);
    const price = Number(it.unit_price) || prod?.selling_price || 0;
    const qty = Number(it.quantity) || 1;
    return {
      id: `soi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: it.product_id,
      product_name: prod?.name || '',
      product_sku: prod?.sku || '',
      quantity: qty,
      unit_price: price,
      total_price: qty * price,
    };
  });

  const total_amount = soItems.reduce((sum: number, it: any) => sum + it.total_price, 0);

  const newSO = {
    id: `so-${Date.now()}`,
    so_number: `SO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    customer_name,
    customer_email: customer_email || '',
    shipping_address: shipping_address || '',
    warehouse_id,
    warehouse_name: wh?.name || '',
    status: 'DRAFT',
    total_amount,
    notes: notes || '',
    created_by: 'u0000000-0000-0000-0000-000000000001',
    creator_name: 'Alexander Wright',
    created_at: new Date().toISOString(),
    items: soItems,
  };

  salesOrders.unshift(newSO);
  recordAudit('admin@apexstock.com', 'SALES_ORDER_CREATE', 'SALES_ORDER', newSO.id, null, newSO);
  res.status(201).json({ success: true, data: newSO });
});

app.post('/api/sales-orders/:id/confirm', (req, res) => {
  const so = salesOrders.find((s) => s.id === req.params.id);
  if (!so) return res.status(404).json({ success: false, error: 'Sales order not found' });
  if (so.status !== 'DRAFT') {
    return res.status(400).json({ success: false, error: `Cannot confirm order in status '${so.status}'` });
  }

  // Stock check & atomic reservation
  for (const it of so.items) {
    const inv = inventory.find((i) => i.warehouse_id === so.warehouse_id && i.product_id === it.product_id);
    const available = inv ? inv.quantity_on_hand - inv.quantity_reserved : 0;
    if (available < it.quantity) {
      return res.status(400).json({ success: false, error: `Insufficient stock for '${it.product_name}' (SKU: ${it.product_sku}). Requested ${it.quantity}, but only ${available} available.` });
    }
  }

  // Apply reservations
  for (const it of so.items) {
    const inv = inventory.find((i) => i.warehouse_id === so.warehouse_id && i.product_id === it.product_id)!;
    inv.quantity_reserved += it.quantity;
    inv.updated_at = new Date().toISOString();
  }

  so.status = 'CONFIRMED';
  recordAudit('admin@apexstock.com', 'SALES_ORDER_CONFIRM', 'SALES_ORDER', so.id, { status: 'DRAFT' }, { status: 'CONFIRMED' });
  res.json({ success: true, data: so });
});

app.post('/api/sales-orders/:id/fulfill', (req, res) => {
  const so = salesOrders.find((s) => s.id === req.params.id);
  if (!so) return res.status(404).json({ success: false, error: 'Sales order not found' });
  if (so.status !== 'CONFIRMED') {
    return res.status(400).json({ success: false, error: `Order must be CONFIRMED before fulfillment (currently: '${so.status}')` });
  }

  const wh = warehouses.find((w) => w.id === so.warehouse_id);

  // Atomically deduct on-hand and release reservation
  for (const it of so.items) {
    const inv = inventory.find((i) => i.warehouse_id === so.warehouse_id && i.product_id === it.product_id);
    if (!inv) continue;

    inv.quantity_on_hand -= it.quantity;
    inv.quantity_reserved -= it.quantity;
    inv.updated_at = new Date().toISOString();

    const prod = products.find((p) => p.id === it.product_id);

    stockMovements.unshift({
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: it.product_id,
      product_name: prod?.name || '',
      product_sku: prod?.sku || '',
      warehouse_id: so.warehouse_id,
      warehouse_name: wh?.name || '',
      movement_type: 'SALE_FULFILLMENT',
      reference_type: 'SALES_ORDER',
      reference_number: so.so_number,
      quantity_delta: -it.quantity,
      balance_after: inv.quantity_on_hand,
      unit_cost: prod?.cost_price || 0,
      notes: `Order fulfilled for ${so.customer_name}`,
      created_by_name: 'Alexander Wright',
      created_at: new Date().toISOString(),
    });
  }

  so.status = 'FULFILLED';
  (so as any).fulfilled_at = new Date().toISOString();
  recordAudit('admin@apexstock.com', 'SALES_ORDER_FULFILL', 'SALES_ORDER', so.id, { status: 'CONFIRMED' }, { status: 'FULFILLED' });

  res.json({ success: true, data: so });
});

app.post('/api/sales-orders/:id/cancel', (req, res) => {
  const so = salesOrders.find((s) => s.id === req.params.id);
  if (!so) return res.status(404).json({ success: false, error: 'Sales order not found' });
  if (so.status === 'FULFILLED') {
    return res.status(400).json({ success: false, error: 'Cannot cancel an already fulfilled sales order' });
  }

  // Release reservation if confirmed
  if (so.status === 'CONFIRMED') {
    for (const it of so.items) {
      const inv = inventory.find((i) => i.warehouse_id === so.warehouse_id && i.product_id === it.product_id);
      if (inv) {
        inv.quantity_reserved = Math.max(0, inv.quantity_reserved - it.quantity);
      }
    }
  }

  so.status = 'CANCELLED';
  recordAudit('admin@apexstock.com', 'SALES_ORDER_CANCEL', 'SALES_ORDER', so.id, null, { status: 'CANCELLED' });
  res.json({ success: true, message: 'Sales order cancelled' });
});

// Stock Transfers
app.get('/api/stock-transfers', (req, res) => {
  const { status } = req.query;
  let list = [...stockTransfers];
  if (status) list = list.filter((t) => t.status === status);
  res.json({ success: true, data: list });
});

app.post('/api/stock-transfers', (req, res) => {
  const { source_warehouse_id, destination_warehouse_id, notes, items } = req.body;
  if (!source_warehouse_id || !destination_warehouse_id || !items || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Source warehouse, destination warehouse, and items required' });
  }
  if (source_warehouse_id === destination_warehouse_id) {
    return res.status(400).json({ success: false, error: 'Source and destination cannot be identical' });
  }

  const src = warehouses.find((w) => w.id === source_warehouse_id);
  const dst = warehouses.find((w) => w.id === destination_warehouse_id);

  const transferItems = items.map((it: any) => {
    const prod = products.find((p) => p.id === it.product_id);
    return {
      id: `tri-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: it.product_id,
      product_name: prod?.name || '',
      product_sku: prod?.sku || '',
      quantity: Number(it.quantity) || 1,
    };
  });

  const newTransfer = {
    id: `tr-${Date.now()}`,
    transfer_number: `TR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    source_warehouse_id,
    source_warehouse_name: src?.name || '',
    destination_warehouse_id,
    destination_warehouse_name: dst?.name || '',
    status: 'REQUESTED',
    notes: notes || '',
    requested_by: 'u0000000-0000-0000-0000-000000000001',
    requester_name: 'Alexander Wright',
    approved_by: '',
    dispatched_at: '',
    created_at: new Date().toISOString(),
    items: transferItems,
  };

  stockTransfers.unshift(newTransfer);
  recordAudit('admin@apexstock.com', 'TRANSFER_REQUEST', 'STOCK_TRANSFER', newTransfer.id, null, newTransfer);
  res.status(201).json({ success: true, data: newTransfer });
});

app.post('/api/stock-transfers/:id/approve', (req, res) => {
  const t = stockTransfers.find((tr) => tr.id === req.params.id);
  if (!t) return res.status(404).json({ success: false, error: 'Transfer not found' });
  t.status = 'APPROVED';
  recordAudit('admin@apexstock.com', 'TRANSFER_APPROVE', 'STOCK_TRANSFER', t.id, { status: 'REQUESTED' }, { status: 'APPROVED' });
  res.json({ success: true, message: 'Transfer approved' });
});

app.post('/api/stock-transfers/:id/dispatch', (req, res) => {
  const t = stockTransfers.find((tr) => tr.id === req.params.id);
  if (!t) return res.status(404).json({ success: false, error: 'Transfer not found' });
  if (t.status !== 'APPROVED') {
    return res.status(400).json({ success: false, error: `Transfer must be APPROVED to dispatch (currently: ${t.status})` });
  }

  // Deduct from source warehouse
  for (const it of t.items) {
    const inv = inventory.find((i) => i.warehouse_id === t.source_warehouse_id && i.product_id === it.product_id);
    const available = inv ? inv.quantity_on_hand - inv.quantity_reserved : 0;
    if (available < it.quantity) {
      return res.status(400).json({ success: false, error: `Insufficient stock at source warehouse for ${it.product_sku}` });
    }
  }

  for (const it of t.items) {
    const inv = inventory.find((i) => i.warehouse_id === t.source_warehouse_id && i.product_id === it.product_id)!;
    inv.quantity_on_hand -= it.quantity;
    inv.updated_at = new Date().toISOString();

    const prod = products.find((p) => p.id === it.product_id);
    stockMovements.unshift({
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: it.product_id,
      product_name: prod?.name || '',
      product_sku: prod?.sku || '',
      warehouse_id: t.source_warehouse_id,
      warehouse_name: t.source_warehouse_name,
      movement_type: 'TRANSFER_OUT',
      reference_type: 'STOCK_TRANSFER',
      reference_number: t.transfer_number,
      quantity_delta: -it.quantity,
      balance_after: inv.quantity_on_hand,
      unit_cost: prod?.cost_price || 0,
      notes: `Transfer out to ${t.destination_warehouse_name}`,
      created_by_name: 'Alexander Wright',
      created_at: new Date().toISOString(),
    });
  }

  t.status = 'IN_TRANSIT';
  (t as any).dispatched_at = new Date().toISOString();
  recordAudit('admin@apexstock.com', 'TRANSFER_DISPATCH', 'STOCK_TRANSFER', t.id, { status: 'APPROVED' }, { status: 'IN_TRANSIT' });

  res.json({ success: true, data: t });
});

app.post('/api/stock-transfers/:id/receive', (req, res) => {
  const t = stockTransfers.find((tr) => tr.id === req.params.id);
  if (!t) return res.status(404).json({ success: false, error: 'Transfer not found' });
  if (t.status !== 'IN_TRANSIT') {
    return res.status(400).json({ success: false, error: `Transfer must be IN_TRANSIT to receive (currently: ${t.status})` });
  }

  for (const it of t.items) {
    let inv = inventory.find((i) => i.warehouse_id === t.destination_warehouse_id && i.product_id === it.product_id);
    if (!inv) {
      inv = {
        id: `i-${Date.now()}`,
        warehouse_id: t.destination_warehouse_id,
        product_id: it.product_id,
        quantity_on_hand: 0,
        quantity_reserved: 0,
        aisle: 'A-01',
        shelf: 'S-01',
        bin: 'B-01',
        updated_at: new Date().toISOString(),
      };
      inventory.push(inv);
    }

    inv.quantity_on_hand += it.quantity;
    inv.updated_at = new Date().toISOString();

    const prod = products.find((p) => p.id === it.product_id);
    stockMovements.unshift({
      id: `sm-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product_id: it.product_id,
      product_name: prod?.name || '',
      product_sku: prod?.sku || '',
      warehouse_id: t.destination_warehouse_id,
      warehouse_name: t.destination_warehouse_name,
      movement_type: 'TRANSFER_IN',
      reference_type: 'STOCK_TRANSFER',
      reference_number: t.transfer_number,
      quantity_delta: it.quantity,
      balance_after: inv.quantity_on_hand,
      unit_cost: prod?.cost_price || 0,
      notes: `Transfer received from ${t.source_warehouse_name}`,
      created_by_name: 'Alexander Wright',
      created_at: new Date().toISOString(),
    });
  }

  t.status = 'RECEIVED';
  (t as any).received_at = new Date().toISOString();
  recordAudit('admin@apexstock.com', 'TRANSFER_RECEIVE', 'STOCK_TRANSFER', t.id, { status: 'IN_TRANSIT' }, { status: 'RECEIVED' });

  res.json({ success: true, data: t });
});

// Reports & Dashboard
app.get('/api/reports/dashboard', (_req, res) => {
  const totalProducts = products.filter((p) => !p.is_archived).length;
  const totalStockUnits = inventory.reduce((sum, i) => sum + i.quantity_on_hand, 0);
  const totalValuation = inventory.reduce((sum, i) => {
    const prod = products.find((p) => p.id === i.product_id);
    return sum + i.quantity_on_hand * (prod?.cost_price || 0);
  }, 0);

  const lowStockCount = inventory.filter((i) => {
    const prod = products.find((p) => p.id === i.product_id);
    return prod ? i.quantity_on_hand <= prod.min_threshold : false;
  }).length;

  const pendingPOs = purchaseOrders.filter((p) => ['SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED'].includes(p.status)).length;
  const pendingSOs = salesOrders.filter((s) => ['DRAFT', 'CONFIRMED'].includes(s.status)).length;

  const warehouseDistribution = warehouses.map((wh) => {
    const whInv = inventory.filter((i) => i.warehouse_id === wh.id);
    const units = whInv.reduce((sum, i) => sum + i.quantity_on_hand, 0);
    const val = whInv.reduce((sum, i) => {
      const p = products.find((prod) => prod.id === i.product_id);
      return sum + i.quantity_on_hand * (p?.cost_price || 0);
    }, 0);
    return {
      warehouse_id: wh.id,
      warehouse_name: wh.name,
      total_units: units,
      total_value: val,
    };
  });

  res.json({
    success: true,
    data: {
      total_products: totalProducts,
      total_stock_units: totalStockUnits,
      total_valuation: totalValuation,
      low_stock_count: lowStockCount,
      pending_pos_count: pendingPOs,
      pending_sos_count: pendingSOs,
      warehouse_distribution: warehouseDistribution,
      monthly_trends: [
        { month: 'Jul', purchases: 14200, sales: 18500 },
        { month: 'Aug', purchases: 16800, sales: 22100 },
        { month: 'Sep', purchases: 19400, sales: 24300 },
        { month: 'Oct', purchases: 22100, sales: 28900 },
        { month: 'Nov', purchases: 15200, sales: 19800 },
      ],
      top_selling_products: [
        { product_id: 'p0000000-0000-0000-0000-000000000001', product_name: 'ARM Cortex-M4 Microcontroller', product_sku: 'ELEC-MC-04', units_sold: 140, total_revenue: 6720 },
        { product_id: 'p0000000-0000-0000-0000-000000000005', product_name: 'N95 Particulate Respirator', product_sku: 'MED-N95-50P', units_sold: 150, total_revenue: 5248.5 },
        { product_id: 'p0000000-0000-0000-0000-000000000002', product_name: 'Brushless DC Servo Motor 24V', product_sku: 'ELEC-MOT-24', units_sold: 25, total_revenue: 4875 },
      ],
      recent_movements: stockMovements.slice(0, 6),
      recent_audit_logs: auditLogs.slice(0, 5),
    },
  });
});

app.get('/api/reports/valuation', (req, res) => {
  const { warehouse_id } = req.query;
  let items = inventory.map((inv) => {
    const prod = products.find((p) => p.id === inv.product_id);
    const wh = warehouses.find((w) => w.id === inv.warehouse_id);
    const cat = categories.find((c) => c.id === prod?.category_id);
    return {
      sku: prod?.sku || '',
      product_name: prod?.name || '',
      category_name: cat?.name || 'Uncategorized',
      warehouse_name: wh?.name || '',
      warehouse_id: inv.warehouse_id,
      quantity: inv.quantity_on_hand,
      cost_price: prod?.cost_price || 0,
      valuation: inv.quantity_on_hand * (prod?.cost_price || 0),
    };
  });

  if (warehouse_id) {
    items = items.filter((i) => i.warehouse_id === warehouse_id);
  }

  const totalValuation = items.reduce((sum, i) => sum + i.valuation, 0);
  res.json({
    success: true,
    data: items,
    meta: { total_valuation: totalValuation, item_count: items.length },
  });
});

app.get('/api/reports/valuation/csv', (req, res) => {
  const { warehouse_id } = req.query;
  let items = inventory.map((inv) => {
    const prod = products.find((p) => p.id === inv.product_id);
    const wh = warehouses.find((w) => w.id === inv.warehouse_id);
    const cat = categories.find((c) => c.id === prod?.category_id);
    return {
      sku: prod?.sku || '',
      product_name: prod?.name || '',
      category_name: cat?.name || 'Uncategorized',
      warehouse_name: wh?.name || '',
      warehouse_id: inv.warehouse_id,
      quantity: inv.quantity_on_hand,
      cost_price: prod?.cost_price || 0,
      valuation: inv.quantity_on_hand * (prod?.cost_price || 0),
    };
  });

  if (warehouse_id) {
    items = items.filter((i) => i.warehouse_id === warehouse_id);
  }

  let csv = 'SKU,Product Name,Category,Warehouse,Quantity On Hand,Unit Cost ($),Total Valuation ($)\n';
  let total = 0;
  items.forEach((it) => {
    total += it.valuation;
    csv += `"${it.sku}","${it.product_name}","${it.category_name}","${it.warehouse_name}",${it.quantity},${it.cost_price.toFixed(2)},${it.valuation.toFixed(2)}\n`;
  });
  csv += `TOTAL,,,,,,${total.toFixed(2)}\n`;

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename=valuation-${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
});

// Users
app.get('/api/users', (_req, res) => {
  res.json({ success: true, data: users });
});

app.put('/api/users/:id/role', (req, res) => {
  const u = users.find((user) => user.id === req.params.id);
  if (!u) return res.status(404).json({ success: false, error: 'User not found' });
  const prevRole = u.role;
  u.role = req.body.role;
  recordAudit('admin@apexstock.com', 'USER_ROLE_UPDATE', 'USER', u.id, { role: prevRole }, { role: u.role });
  res.json({ success: true, data: u });
});

// Audit Logs & Notifications
app.get('/api/audit-logs', (_req, res) => {
  res.json({
    success: true,
    data: auditLogs,
    meta: { total: auditLogs.length, limit: 50, page: 1 },
  });
});

app.get('/api/notifications', (_req, res) => {
  res.json({ success: true, data: notifications });
});

app.post('/api/notifications/:id/read', (req, res) => {
  const n = notifications.find((notif) => notif.id === req.params.id);
  if (n) n.is_read = true;
  res.json({ success: true, message: 'Notification marked as read' });
});

app.post('/api/notifications/read-all', (_req, res) => {
  notifications.forEach((n) => (n.is_read = true));
  res.json({ success: true, message: 'All notifications marked as read' });
});

// Start Server with Vite Middleware in Dev or Static Serving in Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[OmniStock Enterprise] Server active on port ${PORT}`);
    console.log(`[OmniStock Enterprise] Health Check: http://localhost:${PORT}/api/health`);
    console.log(`[OmniStock Enterprise] SPA UI: http://localhost:${PORT}`);
  });
}

startServer();
