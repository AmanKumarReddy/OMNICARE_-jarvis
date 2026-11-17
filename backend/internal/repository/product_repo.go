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

type ProductRepository struct {
	db *DB
}

func NewProductRepository(db *DB) *ProductRepository {
	return &ProductRepository{db: db}
}

type ProductFilter struct {
	Search     string
	CategoryID string
	IsArchived *bool
	SortBy     string
	SortOrder  string
	Limit      int
	Offset     int
}

func (r *ProductRepository) List(orgID string, filter ProductFilter) ([]domain.Product, int, error) {
	where := []string{"p.org_id = ?"}
	args := []interface{}{orgID}

	if filter.Search != "" {
		where = append(where, "(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.description LIKE ?)")
		pattern := "%" + filter.Search + "%"
		args = append(args, pattern, pattern, pattern, pattern)
	}

	if filter.CategoryID != "" {
		where = append(where, "p.category_id = ?")
		args = append(args, filter.CategoryID)
	}

	if filter.IsArchived != nil {
		if *filter.IsArchived {
			where = append(where, "p.is_archived = 1")
		} else {
			where = append(where, "p.is_archived = 0")
		}
	}

	whereClause := strings.Join(where, " AND ")

	// Count query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM products p WHERE %s", whereClause)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Order by
	sortField := "p.name"
	switch filter.SortBy {
	case "sku":
		sortField = "p.sku"
	case "cost_price":
		sortField = "p.cost_price"
	case "selling_price":
		sortField = "p.selling_price"
	case "created_at":
		sortField = "p.created_at"
	}

	sortOrder := "ASC"
	if strings.ToUpper(filter.SortOrder) == "DESC" {
		sortOrder = "DESC"
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
			p.id, p.org_id, p.category_id, c.name, p.sku, p.barcode, p.name, p.description, 
			p.uom, p.cost_price, p.selling_price, p.min_threshold, p.image_url, p.is_archived,
			COALESCE(SUM(i.quantity_on_hand), 0) as total_on_hand,
			COALESCE(SUM(i.quantity_reserved), 0) as total_reserved,
			COALESCE(SUM(i.quantity_on_hand - i.quantity_reserved), 0) as total_available,
			p.created_at, p.updated_at
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN inventory i ON p.id = i.product_id
		WHERE %s
		GROUP BY p.id, p.org_id, p.category_id, c.name, p.sku, p.barcode, p.name, p.description, p.uom, p.cost_price, p.selling_price, p.min_threshold, p.image_url, p.is_archived, p.created_at, p.updated_at
		ORDER BY %s %s
		LIMIT ? OFFSET ?
	`, whereClause, sortField, sortOrder)

	argsWithPaging := append(args, limit, offset)
	rows, err := r.db.Query(query, argsWithPaging...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var products []domain.Product
	for rows.Next() {
		var p domain.Product
		var catID, catName, barcode, desc, img sql.NullString
		var isArchivedInt int
		if err := rows.Scan(
			&p.ID, &p.OrgID, &catID, &catName, &p.SKU, &barcode, &p.Name, &desc,
			&p.UOM, &p.CostPrice, &p.SellingPrice, &p.MinThreshold, &img, &isArchivedInt,
			&p.TotalOnHand, &p.TotalReserved, &p.TotalAvailable,
			&p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		if catID.Valid {
			p.CategoryID = &catID.String
		}
		if catName.Valid {
			p.CategoryName = catName.String
		}
		if barcode.Valid {
			p.Barcode = barcode.String
		}
		if desc.Valid {
			p.Description = desc.String
		}
		if img.Valid {
			p.ImageURL = img.String
		}
		p.IsArchived = isArchivedInt == 1
		products = append(products, p)
	}

	return products, total, nil
}

func (r *ProductRepository) GetByID(orgID, id string) (*domain.Product, error) {
	query := `
		SELECT 
			p.id, p.org_id, p.category_id, c.name, p.sku, p.barcode, p.name, p.description, 
			p.uom, p.cost_price, p.selling_price, p.min_threshold, p.image_url, p.is_archived,
			COALESCE(SUM(i.quantity_on_hand), 0) as total_on_hand,
			COALESCE(SUM(i.quantity_reserved), 0) as total_reserved,
			COALESCE(SUM(i.quantity_on_hand - i.quantity_reserved), 0) as total_available,
			p.created_at, p.updated_at
		FROM products p
		LEFT JOIN categories c ON p.category_id = c.id
		LEFT JOIN inventory i ON p.id = i.product_id
		WHERE p.org_id = ? AND p.id = ?
		GROUP BY p.id, p.org_id, p.category_id, c.name, p.sku, p.barcode, p.name, p.description, p.uom, p.cost_price, p.selling_price, p.min_threshold, p.image_url, p.is_archived, p.created_at, p.updated_at
	`
	row := r.db.QueryRow(query, orgID, id)
	var p domain.Product
	var catID, catName, barcode, desc, img sql.NullString
	var isArchivedInt int
	err := row.Scan(
		&p.ID, &p.OrgID, &catID, &catName, &p.SKU, &barcode, &p.Name, &desc,
		&p.UOM, &p.CostPrice, &p.SellingPrice, &p.MinThreshold, &img, &isArchivedInt,
		&p.TotalOnHand, &p.TotalReserved, &p.TotalAvailable,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if catID.Valid {
		p.CategoryID = &catID.String
	}
	if catName.Valid {
		p.CategoryName = catName.String
	}
	if barcode.Valid {
		p.Barcode = barcode.String
	}
	if desc.Valid {
		p.Description = desc.String
	}
	if img.Valid {
		p.ImageURL = img.String
	}
	p.IsArchived = isArchivedInt == 1
	return &p, nil
}

func (r *ProductRepository) Create(p *domain.Product) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	now := time.Now()
	p.CreatedAt = now
	p.UpdatedAt = now

	// Check duplicate SKU
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM products WHERE org_id = ? AND sku = ?", p.OrgID, p.SKU).Scan(&count)
	if err == nil && count > 0 {
		return fmt.Errorf("a product with SKU '%s' already exists", p.SKU)
	}

	query := `
		INSERT INTO products (id, org_id, category_id, sku, barcode, name, description, uom, cost_price, selling_price, min_threshold, image_url, is_archived, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
	`
	_, err = r.db.Exec(query, p.ID, p.OrgID, p.CategoryID, p.SKU, p.Barcode, p.Name, p.Description, p.UOM, p.CostPrice, p.SellingPrice, p.MinThreshold, p.ImageURL, p.CreatedAt, p.UpdatedAt)
	return err
}

func (r *ProductRepository) Update(p *domain.Product) error {
	p.UpdatedAt = time.Now()

	// Check duplicate SKU on other products
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM products WHERE org_id = ? AND sku = ? AND id != ?", p.OrgID, p.SKU, p.ID).Scan(&count)
	if err == nil && count > 0 {
		return fmt.Errorf("a product with SKU '%s' already exists", p.SKU)
	}

	query := `
		UPDATE products
		SET category_id = ?, sku = ?, barcode = ?, name = ?, description = ?, uom = ?, 
		    cost_price = ?, selling_price = ?, min_threshold = ?, image_url = ?, updated_at = ?
		WHERE org_id = ? AND id = ?
	`
	_, err = r.db.Exec(query, p.CategoryID, p.SKU, p.Barcode, p.Name, p.Description, p.UOM, p.CostPrice, p.SellingPrice, p.MinThreshold, p.ImageURL, p.UpdatedAt, p.OrgID, p.ID)
	return err
}

func (r *ProductRepository) SetArchived(orgID, id string, archived bool) error {
	val := 0
	if archived {
		val = 1
	}
	query := `UPDATE products SET is_archived = ?, updated_at = ? WHERE org_id = ? AND id = ?`
	_, err := r.db.Exec(query, val, time.Now(), orgID, id)
	return err
}

func (r *ProductRepository) ListCategories(orgID string) ([]domain.Category, error) {
	query := `SELECT id, org_id, code, name, description, parent_id, created_at, updated_at FROM categories WHERE org_id = ? ORDER BY name ASC`
	rows, err := r.db.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []domain.Category
	for rows.Next() {
		var c domain.Category
		var parentID, desc sql.NullString
		if err := rows.Scan(&c.ID, &c.OrgID, &c.Code, &c.Name, &desc, &parentID, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		if desc.Valid {
			c.Description = desc.String
		}
		if parentID.Valid {
			c.ParentID = &parentID.String
		}
		categories = append(categories, c)
	}
	return categories, nil
}

func (r *ProductRepository) CreateCategory(c *domain.Category) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	now := time.Now()
	c.CreatedAt = now
	c.UpdatedAt = now
	query := `INSERT INTO categories (id, org_id, code, name, description, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := r.db.Exec(query, c.ID, c.OrgID, c.Code, c.Name, c.Description, c.ParentID, c.CreatedAt, c.UpdatedAt)
	return err
}
