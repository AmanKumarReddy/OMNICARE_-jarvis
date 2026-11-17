package repository

import (
	"database/sql"
	"errors"
	"time"

	"omnistock/internal/domain"

	"github.com/google/uuid"
)

type SupplierRepository struct {
	db *DB
}

func NewSupplierRepository(db *DB) *SupplierRepository {
	return &SupplierRepository{db: db}
}

func (r *SupplierRepository) List(orgID string) ([]domain.Supplier, error) {
	query := `
		SELECT id, org_id, code, name, contact_name, email, phone, address, city, country, payment_terms, status, created_at, updated_at
		FROM suppliers
		WHERE org_id = ?
		ORDER BY name ASC
	`
	rows, err := r.db.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var suppliers []domain.Supplier
	for rows.Next() {
		var s domain.Supplier
		var contact, email, phone, addr, city, country, terms sql.NullString
		if err := rows.Scan(
			&s.ID, &s.OrgID, &s.Code, &s.Name, &contact, &email, &phone, &addr, &city, &country, &terms, &s.Status, &s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, err
		}
		if contact.Valid {
			s.ContactName = contact.String
		}
		if email.Valid {
			s.Email = email.String
		}
		if phone.Valid {
			s.Phone = phone.String
		}
		if addr.Valid {
			s.Address = addr.String
		}
		if city.Valid {
			s.City = city.String
		}
		if country.Valid {
			s.Country = country.String
		}
		if terms.Valid {
			s.PaymentTerms = terms.String
		}
		suppliers = append(suppliers, s)
	}
	return suppliers, nil
}

func (r *SupplierRepository) GetByID(orgID, id string) (*domain.Supplier, error) {
	query := `
		SELECT id, org_id, code, name, contact_name, email, phone, address, city, country, payment_terms, status, created_at, updated_at
		FROM suppliers
		WHERE org_id = ? AND id = ?
	`
	row := r.db.QueryRow(query, orgID, id)
	var s domain.Supplier
	var contact, email, phone, addr, city, country, terms sql.NullString
	err := row.Scan(
		&s.ID, &s.OrgID, &s.Code, &s.Name, &contact, &email, &phone, &addr, &city, &country, &terms, &s.Status, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if contact.Valid {
		s.ContactName = contact.String
	}
	if email.Valid {
		s.Email = email.String
	}
	if phone.Valid {
		s.Phone = phone.String
	}
	if addr.Valid {
		s.Address = addr.String
	}
	if city.Valid {
		s.City = city.String
	}
	if country.Valid {
		s.Country = country.String
	}
	if terms.Valid {
		s.PaymentTerms = terms.String
	}
	return &s, nil
}

func (r *SupplierRepository) Create(s *domain.Supplier) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	now := time.Now()
	s.CreatedAt = now
	s.UpdatedAt = now
	query := `
		INSERT INTO suppliers (id, org_id, code, name, contact_name, email, phone, address, city, country, payment_terms, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(query, s.ID, s.OrgID, s.Code, s.Name, s.ContactName, s.Email, s.Phone, s.Address, s.City, s.Country, s.PaymentTerms, s.Status, s.CreatedAt, s.UpdatedAt)
	return err
}

func (r *SupplierRepository) Update(s *domain.Supplier) error {
	s.UpdatedAt = time.Now()
	query := `
		UPDATE suppliers
		SET code = ?, name = ?, contact_name = ?, email = ?, phone = ?, address = ?, city = ?, country = ?, payment_terms = ?, status = ?, updated_at = ?
		WHERE org_id = ? AND id = ?
	`
	_, err := r.db.Exec(query, s.Code, s.Name, s.ContactName, s.Email, s.Phone, s.Address, s.City, s.Country, s.PaymentTerms, s.Status, s.UpdatedAt, s.OrgID, s.ID)
	return err
}
