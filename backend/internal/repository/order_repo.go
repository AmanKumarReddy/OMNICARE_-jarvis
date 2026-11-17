package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"omnistock/internal/domain"

	"github.com/google/uuid"
)

type OrderRepository struct {
	db      *DB
	invRepo *InventoryRepository
}

func NewOrderRepository(db *DB, invRepo *InventoryRepository) *OrderRepository {
	return &OrderRepository{db: db, invRepo: invRepo}
}

// ==========================================
// PURCHASE ORDERS
// ==========================================

func (r *OrderRepository) ListPurchaseOrders(orgID, status string) ([]domain.PurchaseOrder, error) {
	query := `
		SELECT 
			po.id, po.org_id, po.po_number, po.supplier_id, s.name as supplier_name,
			po.warehouse_id, w.name as warehouse_name, po.status, po.total_amount,
			COALESCE(po.expected_date, ''), COALESCE(po.notes, ''),
			po.created_by, COALESCE(u.first_name || ' ' || u.last_name, 'System') as creator_name,
			po.approved_by, po.approved_at, po.created_at, po.updated_at
		FROM purchase_orders po
		JOIN suppliers s ON po.supplier_id = s.id
		JOIN warehouses w ON po.warehouse_id = w.id
		LEFT JOIN users u ON po.created_by = u.id
		WHERE po.org_id = ?
	`
	args := []interface{}{orgID}
	if status != "" {
		query += " AND po.status = ?"
		args = append(args, status)
	}
	query += " ORDER BY po.created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.PurchaseOrder
	for rows.Next() {
		var po domain.PurchaseOrder
		var expectedDate, notes, createdBy, approvedBy sql.NullString
		var approvedAt sql.NullTime
		if err := rows.Scan(
			&po.ID, &po.OrgID, &po.PONumber, &po.SupplierID, &po.SupplierName,
			&po.WarehouseID, &po.WarehouseName, &po.Status, &po.TotalAmount,
			&expectedDate, &notes,
			&createdBy, &po.CreatorName,
			&approvedBy, &approvedAt,
			&po.CreatedAt, &po.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if expectedDate.Valid {
			po.ExpectedDate = expectedDate.String
		}
		if notes.Valid {
			po.Notes = notes.String
		}
		if createdBy.Valid {
			po.CreatedBy = &createdBy.String
		}
		if approvedBy.Valid {
			po.ApprovedBy = &approvedBy.String
		}
		if approvedAt.Valid {
			po.ApprovedAt = &approvedAt.Time
		}
		list = append(list, po)
	}
	return list, nil
}

func (r *OrderRepository) GetPurchaseOrderByID(orgID, id string) (*domain.PurchaseOrder, error) {
	query := `
		SELECT 
			po.id, po.org_id, po.po_number, po.supplier_id, s.name as supplier_name,
			po.warehouse_id, w.name as warehouse_name, po.status, po.total_amount,
			COALESCE(po.expected_date, ''), COALESCE(po.notes, ''),
			po.created_by, COALESCE(u.first_name || ' ' || u.last_name, 'System') as creator_name,
			po.approved_by, po.approved_at, po.created_at, po.updated_at
		FROM purchase_orders po
		JOIN suppliers s ON po.supplier_id = s.id
		JOIN warehouses w ON po.warehouse_id = w.id
		LEFT JOIN users u ON po.created_by = u.id
		WHERE po.org_id = ? AND po.id = ?
	`
	row := r.db.QueryRow(query, orgID, id)
	var po domain.PurchaseOrder
	var expectedDate, notes, createdBy, approvedBy sql.NullString
	var approvedAt sql.NullTime
	err := row.Scan(
		&po.ID, &po.OrgID, &po.PONumber, &po.SupplierID, &po.SupplierName,
		&po.WarehouseID, &po.WarehouseName, &po.Status, &po.TotalAmount,
		&expectedDate, &notes,
		&createdBy, &po.CreatorName,
		&approvedBy, &approvedAt,
		&po.CreatedAt, &po.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if expectedDate.Valid {
		po.ExpectedDate = expectedDate.String
	}
	if notes.Valid {
		po.Notes = notes.String
	}
	if createdBy.Valid {
		po.CreatedBy = &createdBy.String
	}
	if approvedBy.Valid {
		po.ApprovedBy = &approvedBy.String
	}
	if approvedAt.Valid {
		po.ApprovedAt = &approvedAt.Time
	}

	// Fetch items
	itemQuery := `
		SELECT poi.id, poi.po_id, poi.product_id, p.name, p.sku, poi.quantity_ordered, poi.quantity_received, poi.unit_cost, poi.total_cost
		FROM purchase_order_items poi
		JOIN products p ON poi.product_id = p.id
		WHERE poi.po_id = ?
	`
	itemRows, err := r.db.Query(itemQuery, po.ID)
	if err != nil {
		return nil, err
	}
	defer itemRows.Close()

	for itemRows.Next() {
		var item domain.PurchaseOrderItem
		if err := itemRows.Scan(&item.ID, &item.POID, &item.ProductID, &item.ProductName, &item.ProductSKU, &item.QuantityOrdered, &item.QuantityReceived, &item.UnitCost, &item.TotalCost); err != nil {
			return nil, err
		}
		po.Items = append(po.Items, item)
	}

	return &po, nil
}

func (r *OrderRepository) CreatePurchaseOrder(po *domain.PurchaseOrder, items []domain.PurchaseOrderItem) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if po.ID == "" {
		po.ID = uuid.New().String()
	}
	if po.PONumber == "" {
		po.PONumber = fmt.Sprintf("PO-%d-%04d", time.Now().Year(), time.Now().Unix()%10000)
	}
	po.Status = domain.POStatusDraft
	now := time.Now()
	po.CreatedAt = now
	po.UpdatedAt = now

	var totalAmount float64
	for i := range items {
		items[i].TotalCost = float64(items[i].QuantityOrdered) * items[i].UnitCost
		totalAmount += items[i].TotalCost
	}
	po.TotalAmount = totalAmount

	query := `
		INSERT INTO purchase_orders (id, org_id, po_number, supplier_id, warehouse_id, status, total_amount, expected_date, notes, created_by, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.Exec(query, po.ID, po.OrgID, po.PONumber, po.SupplierID, po.WarehouseID, po.Status, po.TotalAmount, po.ExpectedDate, po.Notes, po.CreatedBy, po.CreatedAt, po.UpdatedAt)
	if err != nil {
		return err
	}

	for _, item := range items {
		itemID := uuid.New().String()
		_, err = tx.Exec(`
			INSERT INTO purchase_order_items (id, po_id, product_id, quantity_ordered, quantity_received, unit_cost, total_cost)
			VALUES (?, ?, ?, ?, 0, ?, ?)
		`, itemID, po.ID, item.ProductID, item.QuantityOrdered, item.UnitCost, item.TotalCost)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *OrderRepository) UpdatePOStatus(orgID, poID, status, userID string) error {
	var query string
	now := time.Now()
	var err error
	if status == domain.POStatusApproved {
		query = `UPDATE purchase_orders SET status = ?, approved_by = ?, approved_at = ?, updated_at = ? WHERE org_id = ? AND id = ?`
		_, err = r.db.Exec(query, status, userID, now, now, orgID, poID)
	} else {
		query = `UPDATE purchase_orders SET status = ?, updated_at = ? WHERE org_id = ? AND id = ?`
		_, err = r.db.Exec(query, status, now, orgID, poID)
	}
	return err
}

type ItemReceipt struct {
	ProductID        string `json:"product_id"`
	QuantityReceived int    `json:"quantity_received"`
}

func (r *OrderRepository) ReceivePurchaseOrder(orgID, poID string, receipts []ItemReceipt, userID, userEmail string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Get PO
	var warehouseID, currentStatus, poNumber string
	err = tx.QueryRow("SELECT warehouse_id, status, po_number FROM purchase_orders WHERE org_id = ? AND id = ?", orgID, poID).Scan(&warehouseID, &currentStatus, &poNumber)
	if err != nil {
		return fmt.Errorf("purchase order not found: %w", err)
	}

	if currentStatus != domain.POStatusApproved && currentStatus != domain.POStatusPartiallyReceived {
		return fmt.Errorf("cannot receive goods for PO in status '%s' (must be APPROVED or PARTIALLY_RECEIVED)", currentStatus)
	}

	now := time.Now()

	for _, rcv := range receipts {
		if rcv.QuantityReceived <= 0 {
			continue
		}

		// Update purchase_order_items
		var currentReceived, ordered int
		var unitCost float64
		err = tx.QueryRow(`
			SELECT quantity_received, quantity_ordered, unit_cost
			FROM purchase_order_items
			WHERE po_id = ? AND product_id = ?
		`, poID, rcv.ProductID).Scan(&currentReceived, &ordered, &unitCost)
		if err != nil {
			return fmt.Errorf("product %s not found on PO: %w", rcv.ProductID, err)
		}

		newReceived := currentReceived + rcv.QuantityReceived
		if newReceived > ordered {
			return fmt.Errorf("cannot receive %d units: would exceed ordered quantity %d (already received %d)", rcv.QuantityReceived, ordered, currentReceived)
		}

		_, err = tx.Exec(`
			UPDATE purchase_order_items
			SET quantity_received = ?
			WHERE po_id = ? AND product_id = ?
		`, newReceived, poID, rcv.ProductID)
		if err != nil {
			return err
		}

		// Update inventory level atomically
		inv, err := r.invRepo.GetOrCreate(tx, orgID, warehouseID, rcv.ProductID)
		if err != nil {
			return err
		}

		newOnHand := inv.QuantityOnHand + rcv.QuantityReceived
		_, err = tx.Exec(`
			UPDATE inventory
			SET quantity_on_hand = ?, updated_at = ?
			WHERE id = ?
		`, newOnHand, now, inv.ID)
		if err != nil {
			return err
		}

		// Record stock movement
		smID := uuid.New().String()
		_, err = tx.Exec(`
			INSERT INTO stock_movements (id, org_id, product_id, warehouse_id, movement_type, reference_type, reference_id, reference_number, quantity_delta, balance_after, unit_cost, notes, created_by, created_at)
			VALUES (?, ?, ?, ?, 'PURCHASE_RECEIPT', 'PURCHASE_ORDER', ?, ?, ?, ?, ?, 'Goods receipt from purchase order', ?, ?)
		`, smID, orgID, rcv.ProductID, warehouseID, poID, poNumber, rcv.QuantityReceived, newOnHand, unitCost, userID, now)
		if err != nil {
			return err
		}
	}

	// Determine new PO status (check if all items are fully received)
	var remainingCount int
	err = tx.QueryRow(`
		SELECT COUNT(*)
		FROM purchase_order_items
		WHERE po_id = ? AND quantity_received < quantity_ordered
	`, poID).Scan(&remainingCount)
	if err != nil {
		return err
	}

	newStatus := domain.POStatusPartiallyReceived
	if remainingCount == 0 {
		newStatus = domain.POStatusReceived
	}

	_, err = tx.Exec(`
		UPDATE purchase_orders
		SET status = ?, updated_at = ?
		WHERE id = ?
	`, newStatus, now, poID)
	if err != nil {
		return err
	}

	// Audit Log
	auditID := uuid.New().String()
	_, _ = tx.Exec(`
		INSERT INTO audit_logs (id, org_id, user_id, user_email, action, entity_type, entity_id, previous_state, new_state, ip_address, created_at)
		VALUES (?, ?, ?, ?, 'PURCHASE_ORDER_RECEIVE', 'PURCHASE_ORDER', ?, ?, ?, '127.0.0.1', ?)
	`, auditID, orgID, userID, userEmail, poID,
		fmt.Sprintf(`{"status": "%s"}`, currentStatus),
		fmt.Sprintf(`{"status": "%s", "items_received": %d}`, newStatus, len(receipts)),
		now,
	)

	return tx.Commit()
}

// ==========================================
// SALES ORDERS
// ==========================================

func (r *OrderRepository) ListSalesOrders(orgID, status string) ([]domain.SalesOrder, error) {
	query := `
		SELECT 
			so.id, so.org_id, so.so_number, so.customer_name, COALESCE(so.customer_email, ''),
			COALESCE(so.shipping_address, ''), so.warehouse_id, w.name as warehouse_name,
			so.status, so.total_amount, COALESCE(so.notes, ''),
			so.created_by, COALESCE(u.first_name || ' ' || u.last_name, 'System') as creator_name,
			so.fulfilled_at, so.created_at, so.updated_at
		FROM sales_orders so
		JOIN warehouses w ON so.warehouse_id = w.id
		LEFT JOIN users u ON so.created_by = u.id
		WHERE so.org_id = ?
	`
	args := []interface{}{orgID}
	if status != "" {
		query += " AND so.status = ?"
		args = append(args, status)
	}
	query += " ORDER BY so.created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.SalesOrder
	for rows.Next() {
		var so domain.SalesOrder
		var email, address, notes, createdBy sql.NullString
		var fulfilledAt sql.NullTime
		if err := rows.Scan(
			&so.ID, &so.OrgID, &so.SONumber, &so.CustomerName, &email,
			&address, &so.WarehouseID, &so.WarehouseName,
			&so.Status, &so.TotalAmount, &notes,
			&createdBy, &so.CreatorName,
			&fulfilledAt, &so.CreatedAt, &so.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if email.Valid {
			so.CustomerEmail = email.String
		}
		if address.Valid {
			so.ShippingAddress = address.String
		}
		if notes.Valid {
			so.Notes = notes.String
		}
		if createdBy.Valid {
			so.CreatedBy = &createdBy.String
		}
		if fulfilledAt.Valid {
			so.FulfilledAt = &fulfilledAt.Time
		}
		list = append(list, so)
	}
	return list, nil
}

func (r *OrderRepository) GetSalesOrderByID(orgID, id string) (*domain.SalesOrder, error) {
	query := `
		SELECT 
			so.id, so.org_id, so.so_number, so.customer_name, COALESCE(so.customer_email, ''),
			COALESCE(so.shipping_address, ''), so.warehouse_id, w.name as warehouse_name,
			so.status, so.total_amount, COALESCE(so.notes, ''),
			so.created_by, COALESCE(u.first_name || ' ' || u.last_name, 'System') as creator_name,
			so.fulfilled_at, so.created_at, so.updated_at
		FROM sales_orders so
		JOIN warehouses w ON so.warehouse_id = w.id
		LEFT JOIN users u ON so.created_by = u.id
		WHERE so.org_id = ? AND so.id = ?
	`
	row := r.db.QueryRow(query, orgID, id)
	var so domain.SalesOrder
	var email, address, notes, createdBy sql.NullString
	var fulfilledAt sql.NullTime
	err := row.Scan(
		&so.ID, &so.OrgID, &so.SONumber, &so.CustomerName, &email,
		&address, &so.WarehouseID, &so.WarehouseName,
		&so.Status, &so.TotalAmount, &notes,
		&createdBy, &so.CreatorName,
		&fulfilledAt, &so.CreatedAt, &so.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if email.Valid {
		so.CustomerEmail = email.String
	}
	if address.Valid {
		so.ShippingAddress = address.String
	}
	if notes.Valid {
		so.Notes = notes.String
	}
	if createdBy.Valid {
		so.CreatedBy = &createdBy.String
	}
	if fulfilledAt.Valid {
		so.FulfilledAt = &fulfilledAt.Time
	}

	// Fetch items
	itemQuery := `
		SELECT soi.id, soi.so_id, soi.product_id, p.name, p.sku, soi.quantity, soi.unit_price, soi.total_price
		FROM sales_order_items soi
		JOIN products p ON soi.product_id = p.id
		WHERE soi.so_id = ?
	`
	itemRows, err := r.db.Query(itemQuery, so.ID)
	if err != nil {
		return nil, err
	}
	defer itemRows.Close()

	for itemRows.Next() {
		var item domain.SalesOrderItem
		if err := itemRows.Scan(&item.ID, &item.SOID, &item.ProductID, &item.ProductName, &item.ProductSKU, &item.Quantity, &item.UnitPrice, &item.TotalPrice); err != nil {
			return nil, err
		}
		so.Items = append(so.Items, item)
	}

	return &so, nil
}

func (r *OrderRepository) CreateSalesOrder(so *domain.SalesOrder, items []domain.SalesOrderItem) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if so.ID == "" {
		so.ID = uuid.New().String()
	}
	if so.SONumber == "" {
		so.SONumber = fmt.Sprintf("SO-%d-%04d", time.Now().Year(), time.Now().Unix()%10000)
	}
	so.Status = domain.SOStatusDraft
	now := time.Now()
	so.CreatedAt = now
	so.UpdatedAt = now

	var totalAmount float64
	for i := range items {
		items[i].TotalPrice = float64(items[i].Quantity) * items[i].UnitPrice
		totalAmount += items[i].TotalPrice
	}
	so.TotalAmount = totalAmount

	query := `
		INSERT INTO sales_orders (id, org_id, so_number, customer_name, customer_email, shipping_address, warehouse_id, status, total_amount, notes, created_by, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.Exec(query, so.ID, so.OrgID, so.SONumber, so.CustomerName, so.CustomerEmail, so.ShippingAddress, so.WarehouseID, so.Status, so.TotalAmount, so.Notes, so.CreatedBy, so.CreatedAt, so.UpdatedAt)
	if err != nil {
		return err
	}

	for _, item := range items {
		itemID := uuid.New().String()
		_, err = tx.Exec(`
			INSERT INTO sales_order_items (id, so_id, product_id, quantity, unit_price, total_price)
			VALUES (?, ?, ?, ?, ?, ?)
		`, itemID, so.ID, item.ProductID, item.Quantity, item.UnitPrice, item.TotalPrice)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *OrderRepository) ConfirmSalesOrder(orgID, soID string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var warehouseID, currentStatus string
	err = tx.QueryRow("SELECT warehouse_id, status FROM sales_orders WHERE org_id = ? AND id = ?", orgID, soID).Scan(&warehouseID, &currentStatus)
	if err != nil {
		return fmt.Errorf("sales order not found: %w", err)
	}

	if currentStatus != domain.SOStatusDraft {
		return fmt.Errorf("cannot confirm sales order with status '%s'", currentStatus)
	}

	// Fetch items and check available stock
	rows, err := tx.Query("SELECT soi.product_id, soi.quantity, p.name, p.sku FROM sales_order_items soi JOIN products p ON soi.product_id = p.id WHERE soi.so_id = ?", soID)
	if err != nil {
		return err
	}
	defer rows.Close()

	type orderItemReq struct {
		productID string
		quantity  int
		name      string
		sku       string
	}
	var items []orderItemReq
	for rows.Next() {
		var it orderItemReq
		if err := rows.Scan(&it.productID, &it.quantity, &it.name, &it.sku); err != nil {
			return err
		}
		items = append(items, it)
	}
	rows.Close()

	now := time.Now()
	for _, it := range items {
		inv, err := r.invRepo.GetOrCreate(tx, orgID, warehouseID, it.productID)
		if err != nil {
			return err
		}
		available := inv.QuantityOnHand - inv.QuantityReserved
		if available < it.quantity {
			return fmt.Errorf("insufficient stock for '%s' (SKU: %s): requested %d, available %d", it.name, it.sku, it.quantity, available)
		}

		// Reserve stock
		newReserved := inv.QuantityReserved + it.quantity
		_, err = tx.Exec("UPDATE inventory SET quantity_reserved = ?, updated_at = ? WHERE id = ?", newReserved, now, inv.ID)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec("UPDATE sales_orders SET status = ?, updated_at = ? WHERE id = ?", domain.SOStatusConfirmed, now, soID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *OrderRepository) FulfillSalesOrder(orgID, soID, userID, userEmail string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var warehouseID, currentStatus, soNumber string
	err = tx.QueryRow("SELECT warehouse_id, status, so_number FROM sales_orders WHERE org_id = ? AND id = ?", orgID, soID).Scan(&warehouseID, &currentStatus, &soNumber)
	if err != nil {
		return fmt.Errorf("sales order not found: %w", err)
	}

	if currentStatus != domain.SOStatusConfirmed {
		return fmt.Errorf("cannot fulfill sales order with status '%s' (must be CONFIRMED)", currentStatus)
	}

	rows, err := tx.Query("SELECT product_id, quantity, unit_price FROM sales_order_items WHERE so_id = ?", soID)
	if err != nil {
		return err
	}
	defer rows.Close()

	type fulfillItem struct {
		productID string
		quantity  int
		unitPrice float64
	}
	var items []fulfillItem
	for rows.Next() {
		var fi fulfillItem
		if err := rows.Scan(&fi.productID, &fi.quantity, &fi.unitPrice); err != nil {
			return err
		}
		items = append(items, fi)
	}
	rows.Close()

	now := time.Now()
	for _, fi := range items {
		inv, err := r.invRepo.GetOrCreate(tx, orgID, warehouseID, fi.productID)
		if err != nil {
			return err
		}

		newOnHand := inv.QuantityOnHand - fi.quantity
		newReserved := inv.QuantityReserved - fi.quantity
		if newOnHand < 0 || newReserved < 0 {
			return fmt.Errorf("stock balance underflow during fulfillment: on-hand %d, reserved %d, order qty %d", inv.QuantityOnHand, inv.QuantityReserved, fi.quantity)
		}

		_, err = tx.Exec("UPDATE inventory SET quantity_on_hand = ?, quantity_reserved = ?, updated_at = ? WHERE id = ?", newOnHand, newReserved, now, inv.ID)
		if err != nil {
			return err
		}

		// Log stock movement
		smID := uuid.New().String()
		_, err = tx.Exec(`
			INSERT INTO stock_movements (id, org_id, product_id, warehouse_id, movement_type, reference_type, reference_id, reference_number, quantity_delta, balance_after, unit_cost, notes, created_by, created_at)
			VALUES (?, ?, ?, ?, 'SALE_FULFILLMENT', 'SALES_ORDER', ?, ?, ?, ?, ?, 'Customer order dispatched and fulfilled', ?, ?)
		`, smID, orgID, fi.productID, warehouseID, soID, soNumber, -fi.quantity, newOnHand, fi.unitPrice, userID, now)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec("UPDATE sales_orders SET status = ?, fulfilled_at = ?, updated_at = ? WHERE id = ?", domain.SOStatusFulfilled, now, now, soID)
	if err != nil {
		return err
	}

	// Audit Log
	auditID := uuid.New().String()
	_, _ = tx.Exec(`
		INSERT INTO audit_logs (id, org_id, user_id, user_email, action, entity_type, entity_id, previous_state, new_state, ip_address, created_at)
		VALUES (?, ?, ?, ?, 'SALES_ORDER_FULFILL', 'SALES_ORDER', ?, ?, ?, '127.0.0.1', ?)
	`, auditID, orgID, userID, userEmail, soID, `{"status": "CONFIRMED"}`, `{"status": "FULFILLED"}`, now)

	return tx.Commit()
}

func (r *OrderRepository) CancelSalesOrder(orgID, soID, userID string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var warehouseID, currentStatus string
	err = tx.QueryRow("SELECT warehouse_id, status FROM sales_orders WHERE org_id = ? AND id = ?", orgID, soID).Scan(&warehouseID, &currentStatus)
	if err != nil {
		return err
	}

	if currentStatus == domain.SOStatusFulfilled {
		return errors.New("cannot cancel an already fulfilled sales order")
	}

	now := time.Now()
	// If was CONFIRMED, release reservations
	if currentStatus == domain.SOStatusConfirmed {
		rows, err := tx.Query("SELECT product_id, quantity FROM sales_order_items WHERE so_id = ?", soID)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var prodID string
			var qty int
			if err := rows.Scan(&prodID, &qty); err != nil {
				return err
			}
			_, _ = tx.Exec("UPDATE inventory SET quantity_reserved = MAX(0, quantity_reserved - ?), updated_at = ? WHERE warehouse_id = ? AND product_id = ?", qty, now, warehouseID, prodID)
		}
		rows.Close()
	}

	_, err = tx.Exec("UPDATE sales_orders SET status = ?, updated_at = ? WHERE id = ?", domain.SOStatusCancelled, now, soID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// ==========================================
// STOCK TRANSFERS
// ==========================================

func (r *OrderRepository) ListTransfers(orgID, status string) ([]domain.StockTransfer, error) {
	query := `
		SELECT 
			t.id, t.org_id, t.transfer_number,
			t.source_warehouse_id, sw.name as source_name,
			t.destination_warehouse_id, dw.name as dest_name,
			t.status, COALESCE(t.notes, ''),
			t.requested_by, COALESCE(u.first_name || ' ' || u.last_name, 'System') as requester_name,
			t.approved_by, t.dispatched_at, t.received_at, t.created_at, t.updated_at
		FROM stock_transfers t
		JOIN warehouses sw ON t.source_warehouse_id = sw.id
		JOIN warehouses dw ON t.destination_warehouse_id = dw.id
		LEFT JOIN users u ON t.requested_by = u.id
		WHERE t.org_id = ?
	`
	args := []interface{}{orgID}
	if status != "" {
		query += " AND t.status = ?"
		args = append(args, status)
	}
	query += " ORDER BY t.created_at DESC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.StockTransfer
	for rows.Next() {
		var t domain.StockTransfer
		var notes, reqBy, appBy sql.NullString
		var dispAt, rcvAt sql.NullTime
		if err := rows.Scan(
			&t.ID, &t.OrgID, &t.TransferNumber,
			&t.SourceWarehouseID, &t.SourceWarehouseName,
			&t.DestinationWarehouseID, &t.DestWarehouseName,
			&t.Status, &notes,
			&reqBy, &t.RequesterName,
			&appBy, &dispAt, &rcvAt, &t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if notes.Valid {
			t.Notes = notes.String
		}
		if reqBy.Valid {
			t.RequestedBy = &reqBy.String
		}
		if appBy.Valid {
			t.ApprovedBy = &appBy.String
		}
		if dispAt.Valid {
			t.DispatchedAt = &dispAt.Time
		}
		if rcvAt.Valid {
			t.ReceivedAt = &rcvAt.Time
		}
		list = append(list, t)
	}
	return list, nil
}

func (r *OrderRepository) GetTransferByID(orgID, id string) (*domain.StockTransfer, error) {
	query := `
		SELECT 
			t.id, t.org_id, t.transfer_number,
			t.source_warehouse_id, sw.name as source_name,
			t.destination_warehouse_id, dw.name as dest_name,
			t.status, COALESCE(t.notes, ''),
			t.requested_by, COALESCE(u.first_name || ' ' || u.last_name, 'System') as requester_name,
			t.approved_by, t.dispatched_at, t.received_at, t.created_at, t.updated_at
		FROM stock_transfers t
		JOIN warehouses sw ON t.source_warehouse_id = sw.id
		JOIN warehouses dw ON t.destination_warehouse_id = dw.id
		LEFT JOIN users u ON t.requested_by = u.id
		WHERE t.org_id = ? AND t.id = ?
	`
	row := r.db.QueryRow(query, orgID, id)
	var t domain.StockTransfer
	var notes, reqBy, appBy sql.NullString
	var dispAt, rcvAt sql.NullTime
	err := row.Scan(
		&t.ID, &t.OrgID, &t.TransferNumber,
		&t.SourceWarehouseID, &t.SourceWarehouseName,
		&t.DestinationWarehouseID, &t.DestWarehouseName,
		&t.Status, &notes,
		&reqBy, &t.RequesterName,
		&appBy, &dispAt, &rcvAt, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if notes.Valid {
		t.Notes = notes.String
	}
	if reqBy.Valid {
		t.RequestedBy = &reqBy.String
	}
	if appBy.Valid {
		t.ApprovedBy = &appBy.String
	}
	if dispAt.Valid {
		t.DispatchedAt = &dispAt.Time
	}
	if rcvAt.Valid {
		t.ReceivedAt = &rcvAt.Time
	}

	// Fetch items
	itemRows, err := r.db.Query(`
		SELECT ti.id, ti.transfer_id, ti.product_id, p.name, p.sku, ti.quantity
		FROM stock_transfer_items ti
		JOIN products p ON ti.product_id = p.id
		WHERE ti.transfer_id = ?
	`, t.ID)
	if err != nil {
		return nil, err
	}
	defer itemRows.Close()

	for itemRows.Next() {
		var item domain.StockTransferItem
		if err := itemRows.Scan(&item.ID, &item.TransferID, &item.ProductID, &item.ProductName, &item.ProductSKU, &item.Quantity); err != nil {
			return nil, err
		}
		t.Items = append(t.Items, item)
	}

	return &t, nil
}

func (r *OrderRepository) CreateTransfer(t *domain.StockTransfer, items []domain.StockTransferItem) error {
	if t.SourceWarehouseID == t.DestinationWarehouseID {
		return errors.New("source and destination warehouse cannot be the same")
	}

	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if t.ID == "" {
		t.ID = uuid.New().String()
	}
	if t.TransferNumber == "" {
		t.TransferNumber = fmt.Sprintf("TR-%d-%04d", time.Now().Year(), time.Now().Unix()%10000)
	}
	t.Status = domain.TransferStatusRequested
	now := time.Now()
	t.CreatedAt = now
	t.UpdatedAt = now

	query := `
		INSERT INTO stock_transfers (id, org_id, transfer_number, source_warehouse_id, destination_warehouse_id, status, notes, requested_by, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.Exec(query, t.ID, t.OrgID, t.TransferNumber, t.SourceWarehouseID, t.DestinationWarehouseID, t.Status, t.Notes, t.RequestedBy, t.CreatedAt, t.UpdatedAt)
	if err != nil {
		return err
	}

	for _, item := range items {
		itemID := uuid.New().String()
		_, err = tx.Exec(`
			INSERT INTO stock_transfer_items (id, transfer_id, product_id, quantity)
			VALUES (?, ?, ?, ?)
		`, itemID, t.ID, item.ProductID, item.Quantity)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *OrderRepository) ApproveTransfer(orgID, transferID, userID string) error {
	now := time.Now()
	_, err := r.db.Exec(`
		UPDATE stock_transfers
		SET status = ?, approved_by = ?, updated_at = ?
		WHERE org_id = ? AND id = ? AND status = ?
	`, domain.TransferStatusApproved, userID, now, orgID, transferID, domain.TransferStatusRequested)
	return err
}

func (r *OrderRepository) DispatchTransfer(orgID, transferID, userID, userEmail string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var sourceWHID, transferNum, currentStatus string
	err = tx.QueryRow("SELECT source_warehouse_id, transfer_number, status FROM stock_transfers WHERE org_id = ? AND id = ?", orgID, transferID).Scan(&sourceWHID, &transferNum, &currentStatus)
	if err != nil {
		return err
	}

	if currentStatus != domain.TransferStatusApproved {
		return fmt.Errorf("transfer cannot be dispatched from status '%s' (must be APPROVED)", currentStatus)
	}

	rows, err := tx.Query("SELECT ti.product_id, ti.quantity, p.name, p.sku, p.cost_price FROM stock_transfer_items ti JOIN products p ON ti.product_id = p.id WHERE ti.transfer_id = ?", transferID)
	if err != nil {
		return err
	}
	defer rows.Close()

	type xferItem struct {
		prodID    string
		qty       int
		name      string
		sku       string
		costPrice float64
	}
	var items []xferItem
	for rows.Next() {
		var it xferItem
		if err := rows.Scan(&it.prodID, &it.qty, &it.name, &it.sku, &it.costPrice); err != nil {
			return err
		}
		items = append(items, it)
	}
	rows.Close()

	now := time.Now()
	for _, it := range items {
		inv, err := r.invRepo.GetOrCreate(tx, orgID, sourceWHID, it.prodID)
		if err != nil {
			return err
		}

		available := inv.QuantityOnHand - inv.QuantityReserved
		if available < it.qty {
			return fmt.Errorf("insufficient available stock at source warehouse for '%s': requested %d, available %d", it.name, it.qty, available)
		}

		newOnHand := inv.QuantityOnHand - it.qty
		_, err = tx.Exec("UPDATE inventory SET quantity_on_hand = ?, updated_at = ? WHERE id = ?", newOnHand, now, inv.ID)
		if err != nil {
			return err
		}

		smID := uuid.New().String()
		_, err = tx.Exec(`
			INSERT INTO stock_movements (id, org_id, product_id, warehouse_id, movement_type, reference_type, reference_id, reference_number, quantity_delta, balance_after, unit_cost, notes, created_by, created_at)
			VALUES (?, ?, ?, ?, 'TRANSFER_OUT', 'STOCK_TRANSFER', ?, ?, ?, ?, ?, 'Stock dispatched for inter-warehouse transfer', ?, ?)
		`, smID, orgID, it.prodID, sourceWHID, transferID, transferNum, -it.qty, newOnHand, it.costPrice, userID, now)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec("UPDATE stock_transfers SET status = ?, dispatched_at = ?, updated_at = ? WHERE id = ?", domain.TransferStatusInTransit, now, now, transferID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func (r *OrderRepository) ReceiveTransfer(orgID, transferID, userID, userEmail string) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var destWHID, transferNum, currentStatus string
	err = tx.QueryRow("SELECT destination_warehouse_id, transfer_number, status FROM stock_transfers WHERE org_id = ? AND id = ?", orgID, transferID).Scan(&destWHID, &transferNum, &currentStatus)
	if err != nil {
		return err
	}

	if currentStatus != domain.TransferStatusInTransit {
		return fmt.Errorf("transfer cannot be received from status '%s' (must be IN_TRANSIT)", currentStatus)
	}

	rows, err := tx.Query("SELECT ti.product_id, ti.quantity, p.cost_price FROM stock_transfer_items ti JOIN products p ON ti.product_id = p.id WHERE ti.transfer_id = ?", transferID)
	if err != nil {
		return err
	}
	defer rows.Close()

	type rcvItem struct {
		prodID    string
		qty       int
		costPrice float64
	}
	var items []rcvItem
	for rows.Next() {
		var it rcvItem
		if err := rows.Scan(&it.prodID, &it.qty, &it.costPrice); err != nil {
			return err
		}
		items = append(items, it)
	}
	rows.Close()

	now := time.Now()
	for _, it := range items {
		inv, err := r.invRepo.GetOrCreate(tx, orgID, destWHID, it.prodID)
		if err != nil {
			return err
		}

		newOnHand := inv.QuantityOnHand + it.qty
		_, err = tx.Exec("UPDATE inventory SET quantity_on_hand = ?, updated_at = ? WHERE id = ?", newOnHand, now, inv.ID)
		if err != nil {
			return err
		}

		smID := uuid.New().String()
		_, err = tx.Exec(`
			INSERT INTO stock_movements (id, org_id, product_id, warehouse_id, movement_type, reference_type, reference_id, reference_number, quantity_delta, balance_after, unit_cost, notes, created_by, created_at)
			VALUES (?, ?, ?, ?, 'TRANSFER_IN', 'STOCK_TRANSFER', ?, ?, ?, ?, ?, 'Stock received from inter-warehouse transfer', ?, ?)
		`, smID, orgID, it.prodID, destWHID, transferID, transferNum, it.qty, newOnHand, it.costPrice, userID, now)
		if err != nil {
			return err
		}
	}

	_, err = tx.Exec("UPDATE stock_transfers SET status = ?, received_at = ?, updated_at = ? WHERE id = ?", domain.TransferStatusReceived, now, now, transferID)
	if err != nil {
		return err
	}

	// Audit Log
	auditID := uuid.New().String()
	_, _ = tx.Exec(`
		INSERT INTO audit_logs (id, org_id, user_id, user_email, action, entity_type, entity_id, previous_state, new_state, ip_address, created_at)
		VALUES (?, ?, ?, ?, 'STOCK_TRANSFER_RECEIVE', 'STOCK_TRANSFER', ?, '{"status": "IN_TRANSIT"}', '{"status": "RECEIVED"}', '127.0.0.1', ?)
	`, auditID, orgID, userID, userEmail, transferID, now)

	return tx.Commit()
}
