package repository

import (
	"database/sql"
	"errors"
	"time"

	"omnistock/internal/domain"

	"github.com/google/uuid"
)

type UserRepository struct {
	db *DB
}

func NewUserRepository(db *DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByEmail(email string) (*domain.User, error) {
	query := `
		SELECT id, org_id, email, password_hash, first_name, last_name, role, status, assigned_warehouse_id, avatar_url, created_at, updated_at
		FROM users
		WHERE email = ?
	`
	row := r.db.QueryRow(query, email)
	var u domain.User
	var whID sql.NullString
	var avatar sql.NullString

	err := row.Scan(&u.ID, &u.OrgID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.Status, &whID, &avatar, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if whID.Valid {
		u.AssignedWarehouseID = &whID.String
	}
	if avatar.Valid {
		u.AvatarURL = avatar.String
	}
	return &u, nil
}

func (r *UserRepository) FindByID(id string) (*domain.User, error) {
	query := `
		SELECT id, org_id, email, password_hash, first_name, last_name, role, status, assigned_warehouse_id, avatar_url, created_at, updated_at
		FROM users
		WHERE id = ?
	`
	row := r.db.QueryRow(query, id)
	var u domain.User
	var whID sql.NullString
	var avatar sql.NullString

	err := row.Scan(&u.ID, &u.OrgID, &u.Email, &u.PasswordHash, &u.FirstName, &u.LastName, &u.Role, &u.Status, &whID, &avatar, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	if whID.Valid {
		u.AssignedWarehouseID = &whID.String
	}
	if avatar.Valid {
		u.AvatarURL = avatar.String
	}
	return &u, nil
}

func (r *UserRepository) ListByOrg(orgID string) ([]domain.User, error) {
	query := `
		SELECT id, org_id, email, first_name, last_name, role, status, assigned_warehouse_id, avatar_url, created_at, updated_at
		FROM users
		WHERE org_id = ?
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(query, orgID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []domain.User
	for rows.Next() {
		var u domain.User
		var whID sql.NullString
		var avatar sql.NullString
		if err := rows.Scan(&u.ID, &u.OrgID, &u.Email, &u.FirstName, &u.LastName, &u.Role, &u.Status, &whID, &avatar, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		if whID.Valid {
			u.AssignedWarehouseID = &whID.String
		}
		if avatar.Valid {
			u.AvatarURL = avatar.String
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *UserRepository) Create(u *domain.User) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	now := time.Now()
	u.CreatedAt = now
	u.UpdatedAt = now

	query := `
		INSERT INTO users (id, org_id, email, password_hash, first_name, last_name, role, status, assigned_warehouse_id, avatar_url, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(query, u.ID, u.OrgID, u.Email, u.PasswordHash, u.FirstName, u.LastName, u.Role, u.Status, u.AssignedWarehouseID, u.AvatarURL, u.CreatedAt, u.UpdatedAt)
	return err
}

func (r *UserRepository) UpdateRole(id, role string) error {
	query := `UPDATE users SET role = ?, updated_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, role, time.Now(), id)
	return err
}

func (r *UserRepository) UpdateStatus(id, status string) error {
	query := `UPDATE users SET status = ?, updated_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, status, time.Now(), id)
	return err
}
