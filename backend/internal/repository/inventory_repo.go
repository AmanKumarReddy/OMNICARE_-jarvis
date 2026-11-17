package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"omnistock/internal/domain"

	"github.com/google/uuid"
)

type InventoryRepository struct {
	db *DB
}

func NewInventoryRepository(db *DB) *InventoryRepository {
	return &InventoryRepository{db: db}
}

type InventoryFilter struct {
	WarehouseID string
	ProductID   string
	LowStock    bool
	Search      string
	Limit       int
	Offset      int
}

func (r *InventoryRepository) List(orgID string, filter InventoryFilter) ([]domain.Inventory, int, error) {
	where := []string{"i.org_id = ?"}
	args := []interface{}{orgID}

	if filter.WarehouseID != "" {
		where = append(where, "i.warehouse_id = ?")
		args = append(args, filter.WarehouseID)
	}

	if filter.ProductID != "" {
		where = append(where, "i.product_id = ?")
		args = append(args, filter.ProductID)
	}

	if filter.Search != "" {
		where = append(where, "(p.name LIKE ? OR p.sku LIKE ? OR w.name LIKE ?)")
		pattern := "%" + filter.Search + "%"
		args = append(args, pattern, pattern, pattern)
	}

	if filter.LowStock {
		where = append(where, "i.quantity_on_hand <= p.min_threshold")
	}

	whereClause := strings.Join(where, " AND ")

	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM inventory i
		JOIN products p ON i.product_id = p.id
		JOIN warehouses w ON i.warehouse_id = w.id
		WHERE %s
	`, whereClause)
	var total int
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := 50
	if filter.Limit > 0 {
		limit = filter.Limit
	}
	offset := 0
	if filter.Offset > 0 {
		offset = filter.Offset
	}

	query := fmt.Sprintf(`
		SELECT 
			i.id, i.org_id, i.warehouse_id, w.name as warehouse_name,
			i.product_id, p.name as product_name, p.sku as product_sku,
			COALESCE(c.name, '') as category_name,
			i.quantity_on_hand, i.quantity_reserved,
			(i.quantity_on_hand - i.quantity_reserved) as quantity_available,
			p.min_threshold, p.cost_price, p.selling_price,
			(i.quantity_on_hand * p.cost_price) as valuation,
			COALESCE(i.aisle, ''), COALESCE(i.shelf, ''), COALESCE(i.bin, ''),
			i.updated_at
		FROM inventory i
		JOIN products p ON i.product_id = p.id
		JOIN warehouses w ON i.warehouse_id = w.id
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE %s
		ORDER BY p.name ASC, w.name ASC
		LIMIT ? OFFSET ?
	`, whereClause)

	argsWithPaging := append(args, limit, offset)
	rows, err := r.db.Query(query, argsWithPaging...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []domain.Inventory
	for rows.Next() {
		var item domain.Inventory
		if err := rows.Scan(
			&item.ID, &item.OrgID, &item.WarehouseID, &item.WarehouseName,
			&item.ProductID, &item.ProductName, &item.ProductSKU,
			&item.CategoryName,
			&item.QuantityOnHand, &item.QuantityReserved, &item.QuantityAvailable,
			&item.MinThreshold, &item.CostPrice, &item.SellingPrice, &item.Valuation,
			&item.Aisle, &item.Shelf, &item.Bin,
			&item.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		list = append(list, item)
	}

	return list, total, nil
}

func (r *InventoryRepository) GetOrCreate(tx *sql.Tx, orgID, warehouseID, productID string) (*domain.Inventory, error) {
	query := `
		SELECT id, org_id, warehouse_id, product_id, quantity_on_hand, quantity_reserved, aisle, shelf, bin, updated_at
		FROM inventory
		WHERE warehouse_id = ? AND product_id = ?
	`
	var row *sql.Row
	if tx != nil {
		row = tx.QueryRow(query, warehouseID, productID)
	} else {
		row = r.db.QueryRow(query, warehouseID, productID)
	}

	var item domain.Inventory
	var aisle, shelf, bin sql.NullString
	err := row.Scan(&item.ID, &item.OrgID, &item.WarehouseID, &item.ProductID, &item.QuantityOnHand, &item.QuantityReserved, &aisle, &shelf, &bin, &item.UpdatedAt)
	if err == nil {
		if aisle.Valid {
			item.Aisle = aisle.String
		}
		if shelf.Valid {
			item.Shelf = shelf.String
		}
		if bin.Valid {
			item.Bin = bin.String
		}
		item.QuantityAvailable = item.QuantityOnHand - item.QuantityReserved
		return &item, nil
	}

	if errors.Is(err, sql.ErrNoRows) {
		// Insert new record
		newID := uuid.New().String()
		now := time.Now()
		insertQuery := `
			INSERT INTO inventory (id, org_id, warehouse_id, product_id, quantity_on_hand, quantity_reserved, aisle, shelf, bin, updated_at)
			VALUES (?, ?, ?, ?, 0, 0, '', '', '', ?)
		`
		var insertErr error
		if tx != nil {
			_, insertErr = tx.Exec(insertQuery, newID, orgID, warehouseID, productID, now)
		} else {
			_, insertErr = r.db.Exec(insertQuery, newID, orgID, warehouseID, productID, now)
		}
		if insertErr != nil {
			return nil, insertErr
		}
		return &domain.Inventory{
			ID:                newID,
			OrgID:             orgID,
			WarehouseID:       warehouseID,
			ProductID:         productID,
			QuantityOnHand:    0,
			QuantityReserved:  0,
			QuantityAvailable: 0,
			UpdatedAt:         now,
		}, nil
	}

	return nil, err
}

type StockAdjustmentParams struct {
	OrgID         string
	WarehouseID   string
	ProductID     string
	QuantityDelta int
	MovementType  string // ADJUSTMENT_INCREASE, ADJUSTMENT_DECREASE, RECONCILIATION
	Notes         string
	UserID        string
	UserEmail     string
}

func (r *InventoryRepository) AdjustStock(params StockAdjustmentParams) (*domain.Inventory, error) {
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	inv, err := r.GetOrCreate(tx, params.OrgID, params.WarehouseID, params.ProductID)
	if err != nil {
		return nil, err
	}

	newOnHand := inv.QuantityOnHand + params.QuantityDelta
	if newOnHand < 0 {
		return nil, fmt.Errorf("insufficient stock: current on hand is %d, adjustment delta is %d (negative stock prohibited)", inv.QuantityOnHand, params.QuantityDelta)
	}

	if newOnHand < inv.QuantityReserved {
		return nil, fmt.Errorf("adjustment would cause on-hand stock (%d) to fall below reserved stock (%d)", newOnHand, inv.QuantityReserved)
	}

	now := time.Now()
	_, err = tx.Exec(`
		UPDATE inventory
		SET quantity_on_hand = ?, updated_at = ?
		WHERE id = ?
	`, newOnHand, now, inv.ID)
	if err != nil {
		return nil, err
	}

	// Fetch product cost price for movement record
	var costPrice float64
	_ = tx.QueryRow("SELECT cost_price FROM products WHERE id = ?", params.ProductID).Scan(&costPrice)

	// Create Stock Movement ledger record
	smID := uuid.New().String()
	_, err = tx.Exec(`
		INSERT INTO stock_movements (id, org_id, product_id, warehouse_id, movement_type, reference_type, reference_id, reference_number, quantity_delta, balance_after, unit_cost, notes, created_by, created_at)
		VALUES (?, ?, ?, ?, ?, 'MANUAL_ADJUSTMENT', NULL, 'ADJ-MANUAL', ?, ?, ?, ?, ?, ?)
	`, smID, params.OrgID, params.ProductID, params.WarehouseID, params.MovementType, params.QuantityDelta, newOnHand, costPrice, params.Notes, params.UserID, now)
	if err != nil {
		return nil, err
	}

	// Create Audit Log
	auditID := uuid.New().String()
	_, _ = tx.Exec(`
		INSERT INTO audit_logs (id, org_id, user_id, user_email, action, entity_type, entity_id, previous_state, new_state, ip_address, created_at)
		VALUES (?, ?, ?, ?, 'STOCK_ADJUSTMENT', 'INVENTORY', ?, ?, ?, '127.0.0.1', ?)
	`, auditID, params.OrgID, params.UserID, params.UserEmail, inv.ID,
		fmt.Sprintf(`{"quantity_on_hand": %d}`, inv.QuantityOnHand),
		fmt.Sprintf(`{"quantity_on_hand": %d, "delta": %d}`, newOnHand, params.QuantityDelta),
		now,
	)

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	inv.QuantityOnHand = newOnHand
	inv.QuantityAvailable = newOnHand - inv.QuantityReserved
	inv.UpdatedAt = now
	return inv, nil
}

func (r *InventoryRepository) ReconcileStock(params StockAdjustmentParams, physicalCount int) (*domain.Inventory, error) {
	if physicalCount < 0 {
		return nil, errors.New("physical count cannot be negative")
	}

	inv, err := r.GetOrCreate(nil, params.OrgID, params.WarehouseID, params.ProductID)
	if err != nil {
		return nil, err
	}

	delta := physicalCount - inv.QuantityOnHand
	params.QuantityDelta = delta
	params.MovementType = domain.MovementReconciliation
	if params.Notes == "" {
		params.Notes = fmt.Sprintf("Physical stock count reconciliation. Adjusted from %d to %d (delta: %+d)", inv.QuantityOnHand, physicalCount, delta)
	}

	return r.AdjustStock(params)
}

func (r *InventoryRepository) ListMovements(orgID string, productID, warehouseID string, limit, offset int) ([]domain.StockMovement, int, error) {
	where := []string{"sm.org_id = ?"}
	args := []interface{}{orgID}

	if productID != "" {
		where = append(where, "sm.product_id = ?")
		args = append(args, productID)
	}
	if warehouseID != "" {
		where = append(where, "sm.warehouse_id = ?")
		args = append(args, warehouseID)
	}

	whereClause := strings.Join(where, " AND ")

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM stock_movements sm WHERE %s", whereClause)
	var total int
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 50
	}
	if offset < 0 {
		offset = 0
	}

	query := fmt.Sprintf(`
		SELECT 
			sm.id, sm.org_id, sm.product_id, p.name as product_name, p.sku as product_sku,
			sm.warehouse_id, w.name as warehouse_name,
			sm.movement_type, COALESCE(sm.reference_type, ''), COALESCE(sm.reference_id, ''), COALESCE(sm.reference_number, ''),
			sm.quantity_delta, sm.balance_after, sm.unit_cost, COALESCE(sm.notes, ''),
			sm.created_by, COALESCE(u.first_name || ' ' || u.last_name, 'System') as created_by_name,
			sm.created_at
		FROM stock_movements sm
		JOIN products p ON sm.product_id = p.id
		JOIN warehouses w ON sm.warehouse_id = w.id
		LEFT JOIN users u ON sm.created_by = u.id
		WHERE %s
		ORDER BY sm.created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	argsWithPaging := append(args, limit, offset)
	rows, err := r.db.Query(query, argsWithPaging...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var movements []domain.StockMovement
	for rows.Next() {
		var m domain.StockMovement
		var refType, refID, refNum, notes, createdBy sql.NullString
		if err := rows.Scan(
			&m.ID, &m.OrgID, &m.ProductID, &m.ProductName, &m.ProductSKU,
			&m.WarehouseID, &m.WarehouseName,
			&m.MovementType, &refType, &refID, &refNum,
			&m.QuantityDelta, &m.BalanceAfter, &m.UnitCost, &notes,
			&createdBy, &m.CreatedByName,
			&m.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		if refType.Valid {
			m.ReferenceType = refType.String
		}
		if refID.Valid {
			m.ReferenceID = &refID.String
		}
		if refNum.Valid {
			m.ReferenceNumber = refNum.String
		}
		if notes.Valid {
			m.Notes = notes.String
		}
		if createdBy.Valid {
			m.CreatedBy = &createdBy.String
		}
		movements = append(movements, m)
	}

	return movements, total, nil
}
