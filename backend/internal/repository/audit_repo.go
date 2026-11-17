package repository

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"omnistock/internal/domain"

	"github.com/google/uuid"
)

type AuditRepository struct {
	db *DB
}

func NewAuditRepository(db *DB) *AuditRepository {
	return &AuditRepository{db: db}
}

func (r *AuditRepository) ListAuditLogs(orgID, entityType string, limit, offset int) ([]domain.AuditLog, int, error) {
	where := []string{"org_id = ?"}
	args := []interface{}{orgID}

	if entityType != "" {
		where = append(where, "entity_type = ?")
		args = append(args, entityType)
	}

	whereClause := strings.Join(where, " AND ")

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM audit_logs WHERE %s", whereClause)
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
		SELECT id, org_id, user_id, COALESCE(user_email, ''), action, entity_type, entity_id, COALESCE(previous_state, ''), COALESCE(new_state, ''), COALESCE(ip_address, ''), created_at
		FROM audit_logs
		WHERE %s
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	argsWithPaging := append(args, limit, offset)
	rows, err := r.db.Query(query, argsWithPaging...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var logs []domain.AuditLog
	for rows.Next() {
		var a domain.AuditLog
		var userID, email, prev, next, ip sql.NullString
		if err := rows.Scan(&a.ID, &a.OrgID, &userID, &email, &a.Action, &a.EntityType, &a.EntityID, &prev, &next, &ip, &a.CreatedAt); err != nil {
			return nil, 0, err
		}
		if userID.Valid {
			a.UserID = &userID.String
		}
		if email.Valid {
			a.UserEmail = email.String
		}
		if prev.Valid {
			a.PreviousState = prev.String
		}
		if next.Valid {
			a.NewState = next.String
		}
		if ip.Valid {
			a.IPAddress = ip.String
		}
		logs = append(logs, a)
	}
	return logs, total, nil
}

func (r *AuditRepository) ListNotifications(orgID, userID string) ([]domain.Notification, error) {
	query := `
		SELECT id, org_id, user_id, type, title, message, COALESCE(link, ''), is_read, created_at
		FROM notifications
		WHERE org_id = ? AND (user_id = ? OR user_id IS NULL)
		ORDER BY created_at DESC
		LIMIT 30
	`
	rows, err := r.db.Query(query, orgID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.Notification
	for rows.Next() {
		var n domain.Notification
		var uid, link sql.NullString
		var isReadInt int
		if err := rows.Scan(&n.ID, &n.OrgID, &uid, &n.Type, &n.Title, &n.Message, &link, &isReadInt, &n.CreatedAt); err != nil {
			return nil, err
		}
		if uid.Valid {
			n.UserID = &uid.String
		}
		if link.Valid {
			n.Link = link.String
		}
		n.IsRead = isReadInt == 1
		list = append(list, n)
	}
	return list, nil
}

func (r *AuditRepository) MarkNotificationRead(id string) error {
	_, err := r.db.Exec("UPDATE notifications SET is_read = 1 WHERE id = ?", id)
	return err
}

func (r *AuditRepository) MarkAllNotificationsRead(userID string) error {
	_, err := r.db.Exec("UPDATE notifications SET is_read = 1 WHERE user_id = ?", userID)
	return err
}

func (r *AuditRepository) CreateNotification(n *domain.Notification) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	n.CreatedAt = time.Now()
	query := `
		INSERT INTO notifications (id, org_id, user_id, type, title, message, link, is_read, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
	`
	_, err := r.db.Exec(query, n.ID, n.OrgID, n.UserID, n.Type, n.Title, n.Message, n.Link, n.CreatedAt)
	return err
}
