-- Enterprise Seed Data for OmniStock Cloud
-- Realistic demonstration data representing a mid-market global logistics distributor

-- 1. Organization
INSERT INTO organizations (id, name, slug, currency, timezone, address)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Apex Global Logistics & Distribution',
    'apex-global',
    'USD',
    'America/Chicago',
    '1000 Distribution Parkway, Suite 400, Chicago, IL 60607'
) ON CONFLICT (id) DO NOTHING;

-- 2. Users (Bcrypt hashes for 'Admin123!', 'Manager123!', 'Warehouse123!', 'Staff123!', 'Viewer123!')
-- Bcrypt cost 10 hash of:
-- Password123!: $2a$10$wS2WbK.hI0/z7Rk4y2gBdu.f6lQeH9kG7oQjUe2V4XhM9L0m1N6kO
INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, avatar_url)
VALUES 
(
    'u0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'admin@apexstock.com',
    '$2a$10$7Acg80v73Q8mN57yVz/wjeO1.0UjN4XG9U.1jBw2F9nQjS2WbK.hI', -- 'Password123!'
    'Alexander',
    'Wright',
    'SUPER_ADMIN',
    'ACTIVE',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
),
(
    'u0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'marcus.vance@apexstock.com',
    '$2a$10$7Acg80v73Q8mN57yVz/wjeO1.0UjN4XG9U.1jBw2F9nQjS2WbK.hI',
    'Marcus',
    'Vance',
    'INVENTORY_MANAGER',
    'ACTIVE',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
),
(
    'u0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'sarah.chen@apexstock.com',
    '$2a$10$7Acg80v73Q8mN57yVz/wjeO1.0UjN4XG9U.1jBw2F9nQjS2WbK.hI',
    'Sarah',
    'Chen',
    'WAREHOUSE_MANAGER',
    'ACTIVE',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
),
(
    'u0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'james.wilson@apexstock.com',
    '$2a$10$7Acg80v73Q8mN57yVz/wjeO1.0UjN4XG9U.1jBw2F9nQjS2WbK.hI',
    'James',
    'Wilson',
    'STAFF',
    'ACTIVE',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
),
(
    'u0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'auditor@apexstock.com',
    '$2a$10$7Acg80v73Q8mN57yVz/wjeO1.0UjN4XG9U.1jBw2F9nQjS2WbK.hI',
    'Elena',
    'Rostova',
    'VIEWER',
    'ACTIVE',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80'
) ON CONFLICT (email) DO NOTHING;

-- 3. Categories
INSERT INTO categories (id, org_id, code, name, description)
VALUES 
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'ELEC', 'Electronics & Components', 'Microcontrollers, sensors, power modules, and passive components'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'HARD', 'Industrial Hardware & Tools', 'Fasteners, calibrated hand tools, pneumatic fittings, and bearings'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'MED', 'Medical Consumables', 'Surgical masks, diagnostic sensors, sterile tubing, and PPE'),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'PACK', 'Packaging & Dispatch', 'Corrugated boxes, tamper tapes, thermal labels, and dunnage')
ON CONFLICT (org_id, code) DO NOTHING;

-- 4. Warehouses
INSERT INTO warehouses (id, org_id, code, name, address, city, state, postal_code, country, manager_id, capacity)
VALUES 
(
    'w0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'WH-ORD',
    'Chicago Central Distribution Hub',
    '4400 O''Hare Logistics Way',
    'Chicago',
    'IL',
    '60666',
    'USA',
    'u0000000-0000-0000-0000-000000000003',
    120000
),
(
    'w0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'WH-JFK',
    'East Coast Fulfillment Depot',
    '180 Port Newark Boulevard',
    'Newark',
    'NJ',
    '07114',
    'USA',
    NULL,
    85000
),
(
    'w0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'WH-LAX',
    'West Coast Maritime Gateway',
    '920 Harbor Scenic Expressway',
    'Long Beach',
    'CA',
    '90802',
    'USA',
    NULL,
    95000
)
ON CONFLICT (org_id, code) DO NOTHING;

-- 5. Suppliers
INSERT INTO suppliers (id, org_id, code, name, contact_name, email, phone, city, payment_terms, status)
VALUES 
(
    's0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'SUP-001',
    'Global Microtech Precision Ltd',
    'David Sterling',
    'sales@globalmicrotech.io',
    '+1 (512) 555-0144',
    'Austin, TX',
    'Net 30',
    'ACTIVE'
),
(
    's0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'SUP-002',
    'Pacific Industrial Fasteners Corp',
    'Rachel Tanaka',
    'orders@pacificfasteners.com',
    '+1 (206) 555-0182',
    'Seattle, WA',
    'Net 45',
    'ACTIVE'
),
(
    's0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'SUP-003',
    'Apex BioMed Consumables Inc',
    'Dr. Aris Thorne',
    'procurement@apexbio.org',
    '+1 (617) 555-0199',
    'Boston, MA',
    'Net 15',
    'ACTIVE'
),
(
    's0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'SUP-004',
    'EcoPack Global Logistics Supply',
    'Monica Morales',
    'accounts@ecopackglobal.com',
    '+1 (404) 555-0130',
    'Atlanta, GA',
    'Net 30',
    'ACTIVE'
)
ON CONFLICT (org_id, code) DO NOTHING;

-- 6. Products Master
INSERT INTO products (id, org_id, category_id, sku, barcode, name, description, uom, cost_price, selling_price, min_threshold)
VALUES 
(
    'p0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'ELEC-MC-04',
    '890123450001',
    'ARM Cortex-M4 Microcontroller Core Module',
    'Industrial grade 32-bit RISC microcontroller with CAN bus and hardware crypto engine',
    'Units',
    24.50,
    48.00,
    50
),
(
    'p0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'ELEC-MOT-24',
    '890123450002',
    'Brushless DC Servo Motor 24V 350W',
    'Precision motor with optical encoder and integrated thermal shutoff protection',
    'Units',
    115.00,
    195.00,
    25
),
(
    'p0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'HARD-BLT-M8',
    '890123450003',
    'Grade 316 Stainless Hex Bolts M8x40 (Box 500)',
    'Marine grade passivated corrosion-resistant structural fasteners',
    'Boxes',
    42.00,
    78.50,
    30
),
(
    'p0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'HARD-CAL-IP67',
    '890123450004',
    'Digital Vernier Caliper 150mm IP67 Coolant-Proof',
    'Hardened stainless steel with thumb roller and ISO 17025 calibration cert',
    'Units',
    68.00,
    135.00,
    15
),
(
    'p0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'MED-N95-50P',
    '890123450005',
    'NIOSH N95 Particulate Respirator (Pack of 50)',
    'Foldable medical-grade particulate respirator with adjustable aluminum nose clip',
    'Packs',
    18.50,
    34.99,
    100
),
(
    'p0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000003',
    'MED-GLV-NIT-L',
    '890123450006',
    'Heavy-Duty Chem-Resistant Nitrile Gloves (Box 100)',
    'Latex-free 6mil textured grip powder-free examination gloves',
    'Boxes',
    9.20,
    17.50,
    80
),
(
    'p0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000004',
    'PACK-LBL-4X6',
    '890123450007',
    'Direct Thermal Shipping Labels 4x6 (Roll 1000)',
    'Permanent adhesive perforated fanfold rolls for industrial Zebra printers',
    'Rolls',
    11.00,
    21.00,
    60
),
(
    'p0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000004',
    'PACK-BOX-12X',
    '890123450008',
    'Heavy Corrugated Shipping Cartons 12x12x12 (Bundle 25)',
    '200# Mullen test single-wall craft corrugated dispatch boxes',
    'Bundles',
    22.50,
    42.00,
    40
)
ON CONFLICT (org_id, sku) DO NOTHING;

-- 7. Inventory Levels
-- Low stock demonstration: ELEC-MOT-24 at WH-ORD has 12 (threshold is 25)
INSERT INTO inventory (id, org_id, warehouse_id, product_id, quantity_on_hand, quantity_reserved, aisle, shelf, bin)
VALUES 
-- WH-ORD (Chicago)
('i0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 340, 40, 'A-01', 'S-03', 'B-12'),
('i0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 12, 0, 'A-02', 'S-01', 'B-04'), -- LOW STOCK ALERT!
('i0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000003', 180, 20, 'B-04', 'S-02', 'B-09'),
('i0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000005', 450, 50, 'C-01', 'S-04', 'B-20'),
('i0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000007', 220, 0, 'D-02', 'S-01', 'B-01'),

-- WH-JFK (Newark)
('i0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000001', 120, 0, 'A-01', 'S-02', 'B-05'),
('i0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000004', 45, 0, 'B-03', 'S-01', 'B-08'),
('i0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000006', 310, 30, 'C-02', 'S-05', 'B-15'),

-- WH-LAX (Long Beach)
('i0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000002', 85, 10, 'A-04', 'S-01', 'B-02'),
('i0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000008', 190, 0, 'D-01', 'S-02', 'B-11')
ON CONFLICT (warehouse_id, product_id) DO NOTHING;

-- 8. Purchase Orders
INSERT INTO purchase_orders (id, org_id, po_number, supplier_id, warehouse_id, status, total_amount, expected_date, notes, created_by, approved_by, approved_at)
VALUES 
(
    'po000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'PO-2026-0891',
    's0000000-0000-0000-0000-000000000001',
    'w0000000-0000-0000-0000-000000000001',
    'APPROVED',
    11500.00,
    '2026-11-20',
    'Restock order for high-demand brushless DC servo motors',
    'u0000000-0000-0000-0000-000000000002',
    'u0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP
),
(
    'po000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'PO-2026-0892',
    's0000000-0000-0000-0000-000000000003',
    'w0000000-0000-0000-0000-000000000001',
    'PARTIALLY_RECEIVED',
    3700.00,
    '2026-11-15',
    'Q4 seasonal medical replenishment',
    'u0000000-0000-0000-0000-000000000002',
    'u0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP
)
ON CONFLICT (org_id, po_number) DO NOTHING;

INSERT INTO purchase_order_items (id, po_id, product_id, quantity_ordered, quantity_received, unit_cost, total_cost)
VALUES 
('poi00000-0000-0000-0000-000000000001', 'po000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 100, 0, 115.00, 11500.00),
('poi00000-0000-0000-0000-000000000002', 'po000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000005', 200, 100, 18.50, 3700.00)
ON CONFLICT (id) DO NOTHING;

-- 9. Sales Orders
INSERT INTO sales_orders (id, org_id, so_number, customer_name, customer_email, shipping_address, warehouse_id, status, total_amount, created_by)
VALUES 
(
    'so000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'SO-2026-4421',
    'OmniTech Robotics Systems Corp',
    'procure@omnitech-robotics.com',
    '720 Innovation Way, Austin, TX 78701',
    'w0000000-0000-0000-0000-000000000001',
    'CONFIRMED',
    1920.00,
    'u0000000-0000-0000-0000-000000000004'
),
(
    'so000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'so-2026-4422',
    'Midwest Surgical Center',
    'purchasing@midwestsurgical.org',
    '120 Medical Plaza, Chicago, IL 60611',
    'w0000000-0000-0000-0000-000000000001',
    'FULFILLED',
    1749.50,
    'u0000000-0000-0000-0000-000000000004'
)
ON CONFLICT (org_id, so_number) DO NOTHING;

INSERT INTO sales_order_items (id, so_id, product_id, quantity, unit_price, total_price)
VALUES 
('soi00000-0000-0000-0000-000000000001', 'so000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 40, 48.00, 1920.00),
('soi00000-0000-0000-0000-000000000002', 'so000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000005', 50, 34.99, 1749.50)
ON CONFLICT (id) DO NOTHING;

-- 10. Stock Transfers
INSERT INTO stock_transfers (id, org_id, transfer_number, source_warehouse_id, destination_warehouse_id, status, notes, requested_by, approved_by, dispatched_at)
VALUES 
(
    'tr000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'TR-2026-0155',
    'w0000000-0000-0000-0000-000000000003',
    'w0000000-0000-0000-0000-000000000001',
    'IN_TRANSIT',
    'Emergency inter-facility stock balance of servo motors to ORD',
    'u0000000-0000-0000-0000-000000000002',
    'u0000000-0000-0000-0000-000000000001',
    CURRENT_TIMESTAMP
)
ON CONFLICT (org_id, transfer_number) DO NOTHING;

INSERT INTO stock_transfer_items (id, transfer_id, product_id, quantity)
VALUES 
('tri00000-0000-0000-0000-000000000001', 'tr000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 20)
ON CONFLICT (id) DO NOTHING;

-- 11. Initial Stock Movements
INSERT INTO stock_movements (id, org_id, product_id, warehouse_id, movement_type, reference_type, reference_number, quantity_delta, balance_after, unit_cost, notes, created_by)
VALUES 
('sm000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000005', 'w0000000-0000-0000-0000-000000000001', 'PURCHASE_RECEIPT', 'PURCHASE_ORDER', 'PO-2026-0892', 100, 450, 18.50, 'Partial dock receipt received by J. Wilson', 'u0000000-0000-0000-0000-000000000004'),
('sm000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000005', 'w0000000-0000-0000-0000-000000000001', 'SALE_FULFILLMENT', 'SALES_ORDER', 'SO-2026-4422', -50, 400, 18.50, 'Dispatched to Midwest Surgical Center', 'u0000000-0000-0000-0000-000000000004'),
('sm000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000003', 'TRANSFER_OUT', 'STOCK_TRANSFER', 'TR-2026-0155', -20, 85, 115.00, 'Transit dispatched to WH-ORD', 'u0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 12. In-App Notifications
INSERT INTO notifications (id, org_id, user_id, type, title, message, link, is_read)
VALUES 
(
    'not00000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000001',
    'LOW_STOCK',
    'Low Stock Alert: Brushless DC Servo Motor 24V',
    'Warehouse WH-ORD is at 12 units (threshold is 25). Replenishment recommended immediately.',
    '/inventory',
    FALSE
),
(
    'not00000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000001',
    'PURCHASE_ORDER',
    'Purchase Order PO-2026-0891 Approved',
    'PO-2026-0891 has been authorized for supplier Global Microtech ($11,500.00).',
    '/purchase-orders',
    TRUE
),
(
    'not00000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000001',
    'TRANSFER',
    'Stock Transfer TR-2026-0155 In Transit',
    '20 units of Brushless DC Servo Motor dispatched from WH-LAX to WH-ORD.',
    '/transfers',
    FALSE
)
ON CONFLICT (id) DO NOTHING;

-- 13. Audit Logs
INSERT INTO audit_logs (id, org_id, user_id, user_email, action, entity_type, entity_id, previous_state, new_state, ip_address)
VALUES 
(
    'aud00000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000001',
    'admin@apexstock.com',
    'PURCHASE_ORDER_APPROVE',
    'PURCHASE_ORDER',
    'po000000-0000-0000-0000-000000000001',
    '{"status": "SUBMITTED"}',
    '{"status": "APPROVED", "approved_by": "u0000000-0000-0000-0000-000000000001"}',
    '192.168.1.104'
),
(
    'aud00000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'u0000000-0000-0000-0000-000000000004',
    'james.wilson@apexstock.com',
    'SALES_ORDER_FULFILL',
    'SALES_ORDER',
    'so000000-0000-0000-0000-000000000002',
    '{"status": "CONFIRMED"}',
    '{"status": "FULFILLED", "deducted_stock": 50}',
    '192.168.1.140'
)
ON CONFLICT (id) DO NOTHING;
