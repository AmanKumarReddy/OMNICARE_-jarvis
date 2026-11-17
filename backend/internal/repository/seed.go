package repository

import (
	"log"

	"golang.org/x/crypto/bcrypt"
)

func (db *DB) SeedInitialData() error {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Organization
	orgID := "a0000000-0000-0000-0000-000000000001"
	_, err = tx.Exec(`
		INSERT INTO organizations (id, name, slug, currency, timezone, address)
		VALUES (?, ?, ?, ?, ?, ?)
	`, orgID, "Apex Global Logistics & Distribution", "apex-global", "USD", "America/Chicago", "1000 Distribution Parkway, Suite 400, Chicago, IL 60607")
	if err != nil {
		return err
	}

	// Password hashes for "Admin123!", "Manager123!", "Warehouse123!", "Staff123!", "Viewer123!"
	pwdHash, _ := bcrypt.GenerateFromPassword([]byte("Admin123!"), 10)

	// 2. Users
	users := []struct {
		id, email, first, last, role, avatar string
	}{
		{"u0000000-0000-0000-0000-000000000001", "admin@apexstock.com", "Alexander", "Wright", "SUPER_ADMIN", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"},
		{"u0000000-0000-0000-0000-000000000002", "marcus.vance@apexstock.com", "Marcus", "Vance", "INVENTORY_MANAGER", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"},
		{"u0000000-0000-0000-0000-000000000003", "sarah.chen@apexstock.com", "Sarah", "Chen", "WAREHOUSE_MANAGER", "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"},
		{"u0000000-0000-0000-0000-000000000004", "james.wilson@apexstock.com", "James", "Wilson", "STAFF", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"},
		{"u0000000-0000-0000-0000-000000000005", "auditor@apexstock.com", "Elena", "Rostova", "VIEWER", "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80"},
	}

	for _, u := range users {
		_, err = tx.Exec(`
			INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, avatar_url)
			VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
		`, u.id, orgID, u.email, string(pwdHash), u.first, u.last, u.role, u.avatar)
		if err != nil {
			return err
		}
	}

	// 3. Categories
	categories := []struct {
		id, code, name, desc string
	}{
		{"c0000000-0000-0000-0000-000000000001", "ELEC", "Electronics & Components", "Microcontrollers, sensors, and power modules"},
		{"c0000000-0000-0000-0000-000000000002", "HARD", "Industrial Hardware & Tools", "Fasteners, calibrated hand tools, and bearings"},
		{"c0000000-0000-0000-0000-000000000003", "MED", "Medical Consumables", "Surgical masks, diagnostic sensors, and PPE"},
		{"c0000000-0000-0000-0000-000000000004", "PACK", "Packaging & Dispatch", "Corrugated boxes, thermal labels, and tapes"},
	}
	for _, c := range categories {
		_, err = tx.Exec(`
			INSERT INTO categories (id, org_id, code, name, description)
			VALUES (?, ?, ?, ?, ?)
		`, c.id, orgID, c.code, c.name, c.desc)
		if err != nil {
			return err
		}
	}

	// 4. Warehouses
	warehouses := []struct {
		id, code, name, addr, city, state, postal, country, mgr string
		cap                                                     int
	}{
		{"w0000000-0000-0000-0000-000000000001", "WH-ORD", "Chicago Central Distribution Hub", "4400 O'Hare Logistics Way", "Chicago", "IL", "60666", "USA", "u0000000-0000-0000-0000-000000000003", 120000},
		{"w0000000-0000-0000-0000-000000000002", "WH-JFK", "East Coast Fulfillment Depot", "180 Port Newark Boulevard", "Newark", "NJ", "07114", "USA", "", 85000},
		{"w0000000-0000-0000-0000-000000000003", "WH-LAX", "West Coast Maritime Gateway", "920 Harbor Scenic Expressway", "Long Beach", "CA", "90802", "USA", "", 95000},
	}
	for _, w := range warehouses {
		var mgrID *string
		if w.mgr != "" {
			mgrID = &w.mgr
		}
		_, err = tx.Exec(`
			INSERT INTO warehouses (id, org_id, code, name, address, city, state, postal_code, country, manager_id, capacity, is_active)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
		`, w.id, orgID, w.code, w.name, w.addr, w.city, w.state, w.postal, w.country, mgrID, w.cap)
		if err != nil {
			return err
		}
	}

	// 5. Suppliers
	suppliers := []struct {
		id, code, name, contact, email, phone, city, terms string
	}{
		{"s0000000-0000-0000-0000-000000000001", "SUP-001", "Global Microtech Precision Ltd", "David Sterling", "sales@globalmicrotech.io", "+1 (512) 555-0144", "Austin, TX", "Net 30"},
		{"s0000000-0000-0000-0000-000000000002", "SUP-002", "Pacific Industrial Fasteners Corp", "Rachel Tanaka", "orders@pacificfasteners.com", "+1 (206) 555-0182", "Seattle, WA", "Net 45"},
		{"s0000000-0000-0000-0000-000000000003", "SUP-003", "Apex BioMed Consumables Inc", "Dr. Aris Thorne", "procurement@apexbio.org", "+1 (617) 555-0199", "Boston, MA", "Net 15"},
		{"s0000000-0000-0000-0000-000000000004", "SUP-004", "EcoPack Global Logistics Supply", "Monica Morales", "accounts@ecopackglobal.com", "+1 (404) 555-0130", "Atlanta, GA", "Net 30"},
	}
	for _, s := range suppliers {
		_, err = tx.Exec(`
			INSERT INTO suppliers (id, org_id, code, name, contact_name, email, phone, city, country, payment_terms, status)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'USA', ?, 'ACTIVE')
		`, s.id, orgID, s.code, s.name, s.contact, s.email, s.phone, s.city, s.terms)
		if err != nil {
			return err
		}
	}

	// 6. Products
	products := []struct {
		id, catID, sku, barcode, name, desc, uom string
		cost, sell                              float64
		threshold                               int
	}{
		{"p0000000-0000-0000-0000-000000000001", "c0000000-0000-0000-0000-000000000001", "ELEC-MC-04", "890123450001", "ARM Cortex-M4 Microcontroller Core Module", "Industrial grade 32-bit RISC microcontroller with CAN bus and hardware crypto", "Units", 24.50, 48.00, 50},
		{"p0000000-0000-0000-0000-000000000002", "c0000000-0000-0000-0000-000000000001", "ELEC-MOT-24", "890123450002", "Brushless DC Servo Motor 24V 350W", "Precision motor with optical encoder and integrated thermal shutoff protection", "Units", 115.00, 195.00, 25},
		{"p0000000-0000-0000-0000-000000000003", "c0000000-0000-0000-0000-000000000002", "HARD-BLT-M8", "890123450003", "Grade 316 Stainless Hex Bolts M8x40 (Box 500)", "Marine grade passivated corrosion-resistant structural fasteners", "Boxes", 42.00, 78.50, 30},
		{"p0000000-0000-0000-0000-000000000004", "c0000000-0000-0000-0000-000000000002", "HARD-CAL-IP67", "890123450004", "Digital Vernier Caliper 150mm IP67", "Hardened stainless steel with thumb roller and ISO 17025 calibration cert", "Units", 68.00, 135.00, 15},
		{"p0000000-0000-0000-0000-000000000005", "c0000000-0000-0000-0000-000000000003", "MED-N95-50P", "890123450005", "NIOSH N95 Particulate Respirator (Pack of 50)", "Foldable medical-grade particulate respirator with adjustable aluminum nose clip", "Packs", 18.50, 34.99, 100},
		{"p0000000-0000-0000-0000-000000000006", "c0000000-0000-0000-0000-000000000003", "MED-GLV-NIT-L", "890123450006", "Heavy-Duty Chem-Resistant Nitrile Gloves (Box 100)", "Latex-free 6mil textured grip powder-free examination gloves", "Boxes", 9.20, 17.50, 80},
		{"p0000000-0000-0000-0000-000000000007", "c0000000-0000-0000-0000-000000000004", "PACK-LBL-4X6", "890123450007", "Direct Thermal Shipping Labels 4x6 (Roll 1000)", "Permanent adhesive perforated fanfold rolls for industrial Zebra printers", "Rolls", 11.00, 21.00, 60},
		{"p0000000-0000-0000-0000-000000000008", "c0000000-0000-0000-0000-000000000004", "PACK-BOX-12X", "890123450008", "Heavy Corrugated Shipping Cartons 12x12x12 (Bundle 25)", "200# Mullen test single-wall craft corrugated dispatch boxes", "Bundles", 22.50, 42.00, 40},
	}
	for _, p := range products {
		_, err = tx.Exec(`
			INSERT INTO products (id, org_id, category_id, sku, barcode, name, description, uom, cost_price, selling_price, min_threshold, is_archived)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
		`, p.id, orgID, p.catID, p.sku, p.barcode, p.name, p.desc, p.uom, p.cost, p.sell, p.threshold)
		if err != nil {
			return err
		}
	}

	// 7. Inventory Levels
	// ELEC-MOT-24 at WH-ORD has 12 (threshold is 25) -> triggers low stock alert!
	inventoryItems := []struct {
		id, whID, prodID, aisle, shelf, bin string
		onHand, reserved                    int
	}{
		{"i0000000-0000-0000-0000-000000000001", "w0000000-0000-0000-0000-000000000001", "p0000000-0000-0000-0000-000000000001", "A-01", "S-03", "B-12", 340, 40},
		{"i0000000-0000-0000-0000-000000000002", "w0000000-0000-0000-0000-000000000001", "p0000000-0000-0000-0000-000000000002", "A-02", "S-01", "B-04", 12, 0}, // LOW STOCK ALERT
		{"i0000000-0000-0000-0000-000000000003", "w0000000-0000-0000-0000-000000000001", "p0000000-0000-0000-0000-000000000003", "B-04", "S-02", "B-09", 180, 20},
		{"i0000000-0000-0000-0000-000000000004", "w0000000-0000-0000-0000-000000000001", "p0000000-0000-0000-0000-000000000005", "C-01", "S-04", "B-20", 450, 50},
		{"i0000000-0000-0000-0000-000000000005", "w0000000-0000-0000-0000-000000000001", "p0000000-0000-0000-0000-000000000007", "D-02", "S-01", "B-01", 220, 0},

		{"i0000000-0000-0000-0000-000000000006", "w0000000-0000-0000-0000-000000000002", "p0000000-0000-0000-0000-000000000001", "A-01", "S-02", "B-05", 120, 0},
		{"i0000000-0000-0000-0000-000000000007", "w0000000-0000-0000-0000-000000000002", "p0000000-0000-0000-0000-000000000004", "B-03", "S-01", "B-08", 45, 0},
		{"i0000000-0000-0000-0000-000000000008", "w0000000-0000-0000-0000-000000000002", "p0000000-0000-0000-0000-000000000006", "C-02", "S-05", "B-15", 310, 30},

		{"i0000000-0000-0000-0000-000000000009", "w0000000-0000-0000-0000-000000000003", "p0000000-0000-0000-0000-000000000002", "A-04", "S-01", "B-02", 85, 10},
		{"i0000000-0000-0000-0000-000000000010", "w0000000-0000-0000-0000-000000000003", "p0000000-0000-0000-0000-000000000008", "D-01", "S-02", "B-11", 190, 0},
	}
	for _, inv := range inventoryItems {
		_, err = tx.Exec(`
			INSERT INTO inventory (id, org_id, warehouse_id, product_id, quantity_on_hand, quantity_reserved, aisle, shelf, bin)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, inv.id, orgID, inv.whID, inv.prodID, inv.onHand, inv.reserved, inv.aisle, inv.shelf, inv.bin)
		if err != nil {
			return err
		}
	}

	// 8. Purchase Orders & Items
	_, err = tx.Exec(`
		INSERT INTO purchase_orders (id, org_id, po_number, supplier_id, warehouse_id, status, total_amount, expected_date, notes, created_by, approved_by)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, "po000000-0000-0000-0000-000000000001", orgID, "PO-2026-0891", "s0000000-0000-0000-0000-000000000001", "w0000000-0000-0000-0000-000000000001", "APPROVED", 11500.00, "2026-11-20", "Restock order for high-demand brushless DC servo motors", "u0000000-0000-0000-0000-000000000002", "u0000000-0000-0000-0000-000000000001")
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO purchase_order_items (id, po_id, product_id, quantity_ordered, quantity_received, unit_cost, total_cost)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, "poi00000-0000-0000-0000-000000000001", "po000000-0000-0000-0000-000000000001", "p0000000-0000-0000-0000-000000000002", 100, 0, 115.00, 11500.00)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO purchase_orders (id, org_id, po_number, supplier_id, warehouse_id, status, total_amount, expected_date, notes, created_by, approved_by)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, "po000000-0000-0000-0000-000000000002", orgID, "PO-2026-0892", "s0000000-0000-0000-0000-000000000003", "w0000000-0000-0000-0000-000000000001", "PARTIALLY_RECEIVED", 3700.00, "2026-11-15", "Q4 seasonal medical replenishment", "u0000000-0000-0000-0000-000000000002", "u0000000-0000-0000-0000-000000000001")
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO purchase_order_items (id, po_id, product_id, quantity_ordered, quantity_received, unit_cost, total_cost)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`, "poi00000-0000-0000-0000-000000000002", "po000000-0000-0000-0000-000000000002", "p0000000-0000-0000-0000-000000000005", 200, 100, 18.50, 3700.00)
	if err != nil {
		return err
	}

	// 9. Sales Orders & Items
	_, err = tx.Exec(`
		INSERT INTO sales_orders (id, org_id, so_number, customer_name, customer_email, shipping_address, warehouse_id, status, total_amount, created_by)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?)
	`, "so000000-0000-0000-0000-000000000001", orgID, "SO-2026-4421", "OmniTech Robotics Systems Corp", "procure@omnitech-robotics.com", "720 Innovation Way, Austin, TX 78701", "w0000000-0000-0000-0000-000000000001", 1920.00, "u0000000-0000-0000-0000-000000000004")
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO sales_order_items (id, so_id, product_id, quantity, unit_price, total_price)
		VALUES (?, ?, ?, ?, ?, ?)
	`, "soi00000-0000-0000-0000-000000000001", "so000000-0000-0000-0000-000000000001", "p0000000-0000-0000-0000-000000000001", 40, 48.00, 1920.00)
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO sales_orders (id, org_id, so_number, customer_name, customer_email, shipping_address, warehouse_id, status, total_amount, created_by)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'FULFILLED', ?, ?)
	`, "so000000-0000-0000-0000-000000000002", orgID, "SO-2026-4422", "Midwest Surgical Center", "purchasing@midwestsurgical.org", "120 Medical Plaza, Chicago, IL 60611", "w0000000-0000-0000-0000-000000000001", 1749.50, "u0000000-0000-0000-0000-000000000004")
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO sales_order_items (id, so_id, product_id, quantity, unit_price, total_price)
		VALUES (?, ?, ?, ?, ?, ?)
	`, "soi00000-0000-0000-0000-000000000002", "so000000-0000-0000-0000-000000000002", "p0000000-0000-0000-0000-000000000005", 50, 34.99, 1749.50)
	if err != nil {
		return err
	}

	// 10. Stock Transfers & Items
	_, err = tx.Exec(`
		INSERT INTO stock_transfers (id, org_id, transfer_number, source_warehouse_id, destination_warehouse_id, status, notes, requested_by, approved_by)
		VALUES (?, ?, ?, ?, ?, 'IN_TRANSIT', ?, ?, ?)
	`, "tr000000-0000-0000-0000-000000000001", orgID, "TR-2026-0155", "w0000000-0000-0000-0000-000000000003", "w0000000-0000-0000-0000-000000000001", "Emergency inter-facility stock balance of servo motors to ORD", "u0000000-0000-0000-0000-000000000002", "u0000000-0000-0000-0000-000000000001")
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
		INSERT INTO stock_transfer_items (id, transfer_id, product_id, quantity)
		VALUES (?, ?, ?, ?)
	`, "tri00000-0000-0000-0000-000000000001", "tr000000-0000-0000-0000-000000000001", "p0000000-0000-0000-0000-000000000002", 20)
	if err != nil {
		return err
	}

	// 11. Initial Movements
	_, _ = tx.Exec(`
		INSERT INTO stock_movements (id, org_id, product_id, warehouse_id, movement_type, reference_type, reference_number, quantity_delta, balance_after, unit_cost, notes, created_by)
		VALUES 
		('sm000000-0000-0000-0000-000000000001', ?, 'p0000000-0000-0000-0000-000000000005', 'w0000000-0000-0000-0000-000000000001', 'PURCHASE_RECEIPT', 'PURCHASE_ORDER', 'PO-2026-0892', 100, 450, 18.50, 'Partial dock receipt received by J. Wilson', 'u0000000-0000-0000-0000-000000000004'),
		('sm000000-0000-0000-0000-000000000002', ?, 'p0000000-0000-0000-0000-000000000005', 'w0000000-0000-0000-0000-000000000001', 'SALE_FULFILLMENT', 'SALES_ORDER', 'SO-2026-4422', -50, 400, 18.50, 'Dispatched to Midwest Surgical Center', 'u0000000-0000-0000-0000-000000000004'),
		('sm000000-0000-0000-0000-000000000003', ?, 'p0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000003', 'TRANSFER_OUT', 'STOCK_TRANSFER', 'TR-2026-0155', -20, 85, 115.00, 'Transit dispatched to WH-ORD', 'u0000000-0000-0000-0000-000000000002')
	`, orgID, orgID, orgID)

	// 12. Notifications
	_, _ = tx.Exec(`
		INSERT INTO notifications (id, org_id, user_id, type, title, message, link, is_read)
		VALUES 
		('not00000-0000-0000-0000-000000000001', ?, 'u0000000-0000-0000-0000-000000000001', 'LOW_STOCK', 'Low Stock Alert: Brushless DC Servo Motor 24V', 'Warehouse WH-ORD is at 12 units (threshold is 25). Replenishment recommended immediately.', '/inventory', 0),
		('not00000-0000-0000-0000-000000000002', ?, 'u0000000-0000-0000-0000-000000000001', 'PURCHASE_ORDER', 'Purchase Order PO-2026-0891 Approved', 'PO-2026-0891 has been authorized for supplier Global Microtech ($11,500.00).', '/purchase-orders', 1),
		('not00000-0000-0000-0000-000000000003', ?, 'u0000000-0000-0000-0000-000000000001', 'TRANSFER', 'Stock Transfer TR-2026-0155 In Transit', '20 units of Brushless DC Servo Motor dispatched from WH-LAX to WH-ORD.', '/transfers', 0)
	`, orgID, orgID, orgID)

	// 13. Audit Logs
	_, _ = tx.Exec(`
		INSERT INTO audit_logs (id, org_id, user_id, user_email, action, entity_type, entity_id, previous_state, new_state, ip_address)
		VALUES 
		('aud00000-0000-0000-0000-000000000001', ?, 'u0000000-0000-0000-0000-000000000001', 'admin@apexstock.com', 'PURCHASE_ORDER_APPROVE', 'PURCHASE_ORDER', 'po000000-0000-0000-0000-000000000001', '{"status": "SUBMITTED"}', '{"status": "APPROVED"}', '192.168.1.104'),
		('aud00000-0000-0000-0000-000000000002', ?, 'u0000000-0000-0000-0000-000000000004', 'james.wilson@apexstock.com', 'SALES_ORDER_FULFILL', 'SALES_ORDER', 'so000000-0000-0000-0000-000000000002', '{"status": "CONFIRMED"}', '{"status": "FULFILLED"}', '192.168.1.140')
	`, orgID, orgID)

	log.Println("Seeding completed successfully.")
	return tx.Commit()
}
