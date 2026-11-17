package repository

import (
	"database/sql"
	"errors"
	"time"

	"omnistock/internal/domain"

	"github.com/google/uuid"
)

type WarehouseRepository struct {
	db *DB
}

func NewWarehouseRepository(db *DB) *WarehouseRepository {
	return &WarehouseRepository{db: db}
}

func (r *WarehouseRepository) List(orgID string) ([]domain.Warehouse, error) {
	query := `
		SELECT 
			w.id, w.org_id, w.code, w.name, w.address, w.city, w.state, w.postal_code, w.country, 
			w.manager_id, COALESCE(u.first_name || ' ' || u.last_name, '') as manager_name,
			w.capacity, w.is_active,
			COALESCE(SUM(i.quantity_on_hand), 0) as total_items,
			COALESCE(SUM(i.quantity_on_hand * p.cost_price), 0.0) as total_value,
			w.created_at, w.updated_at
		FROM warehouses w
		LEFT JOIN users u ON w.manager_id = u.id
		LEFT JOIN inventory i ON w.id = i.warehouse_id
		LEFT JOIN products p ON i.product_id = p.id
		WHERE w.org_id = ?
		GROUP BY w.id, w.org_id, w.code, w.name, w.address, w.city, w.state, w.postal_code, w.country, w.manager_id, manager_name, w.capacity, w.is_active, w.created_at, w.updated_at
		ORDER BY w.name ASC
	`
	rows, err := r.db.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var warehouses []domain.Warehouse
	for rows.Next() {
		var w domain.Warehouse
		var addr, city, state, postal, country, mgrID, mgrName sql.NullString
		var isActiveInt int
		if err := rows.Scan(
			&w.ID, &w.OrgID, &w.Code, &w.Name, &addr, &city, &state, &postal, &country,
			&mgrID, &mgrName, &w.Capacity, &isActiveInt,
			&w.TotalItems, &w.TotalValue,
			&w.CreatedAt, &w.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if addr.Valid {
			w.Address = addr.String
		}
		if city.Valid {
			w.City = city.String
		}
		if state.Valid {
			w.State = state.String
		}
		if postal.Valid {
			w.PostalCode = postal.String
		}
		if country.Valid {
			w.Country = country.String
		}
		if mgrID.Valid {
			w.ManagerID = &mgrID.String
		}
		if mgrName.Valid {
			w.ManagerName = mgrName.String
		}
		w.IsActive = isActiveInt == 1
		warehouses = append(warehouses, w)
	}
	return warehouses, nil
}

func (r *WarehouseRepository) GetByID(orgID, id string) (*domain.Warehouse, error) {
	query := `
		SELECT 
			w.id, w.org_id, w.code, w.name, w.address, w.city, w.state, w.postal_code, w.country, 
			w.manager_id, COALESCE(u.first_name || ' ' || u.last_name, '') as manager_name,
			w.capacity, w.is_active,
			COALESCE(SUM(i.quantity_on_hand), 0) as total_items,
			COALESCE(SUM(i.quantity_on_hand * p.cost_price), 0.0) as total_value,
			w.created_at, w.updated_at
		FROM warehouses w
		LEFT JOIN users u ON w.manager_id = u.id
		LEFT JOIN inventory i ON w.id = i.warehouse_id
		LEFT JOIN products p ON i.product_id = p.id
		WHERE w.org_id = ? AND w.id = ?
		GROUP BY w.id, w.org_id, w.code, w.name, w.address, w.city, w.state, w.postal_code, w.country, w.manager_id, manager_name, w.capacity, w.is_active, w.created_at, w.updated_at
	`
	row := r.db.QueryRow(query, orgID, id)
	var w domain.Warehouse
	var addr, city, state, postal, country, mgrID, mgrName sql.NullString
	var isActiveInt int
	err := row.Scan(
		&w.ID, &w.OrgID, &w.Code, &w.Name, &addr, &city, &state, &postal, &country,
		&mgrID, &mgrName, &w.Capacity, &isActiveInt,
		&w.TotalItems, &w.TotalValue,
		&w.CreatedAt, &w.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if addr.Valid {
		w.Address = addr.String
	}
	if city.Valid {
		w.City = city.String
	}
	if state.Valid {
		w.State = state.String
	}
	if postal.Valid {
		w.PostalCode = postal.String
	}
	if country.Valid {
		w.Country = country.String
	}
	if mgrID.Valid {
		w.ManagerID = &mgrID.String
	}
	if mgrName.Valid {
		w.ManagerName = mgrName.String
	}
	w.IsActive = isActiveInt == 1
	return &w, nil
}

func (r *WarehouseRepository) Create(w *domain.Warehouse) error {
	if w.ID == "" {
		w.ID = uuid.New().String()
	}
	now := time.Now()
	w.CreatedAt = now
	w.UpdatedAt = now
	isActive := 1
	if !w.IsActive {
		isActive = 0
	}
	query := `
		INSERT INTO warehouses (id, org_id, code, name, address, city, state, postal_code, country, manager_id, capacity, is_active, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(query, w.ID, w.OrgID, w.Code, w.Name, w.Address, w.City, w.State, w.PostalCode, w.Country, w.ManagerID, w.Capacity, isActive, w.CreatedAt, w.UpdatedAt)
	return err
}

func (r *WarehouseRepository) Update(w *domain.Warehouse) error {
	w.UpdatedAt = time.Now()
	isActive := 1
	if !w.IsActive {
		isActive = 0
	}
	query := `
		UPDATE warehouses
		SET code = ?, name = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, manager_id = ?, capacity = ?, is_active = ?, updated_at = ?
		WHERE org_id = ? AND id = ?
	`
	_, err := r.db.Exec(query, w.Code, w.Name, w.Address, w.City, w.State, w.PostalCode, w.Country, w.ManagerID, w.Capacity, isActive, w.UpdatedAt, w.OrgID, w.ID)
	return err
}
