package handler

import (
	"net/http"
	"strconv"
	"strings"

	"omnistock/internal/middleware"
	"omnistock/internal/repository"
)

type AuditHandler struct {
	auditRepo *repository.AuditRepository
}

func NewAuditHandler(auditRepo *repository.AuditRepository) *AuditHandler {
	return &AuditHandler{auditRepo: auditRepo}
}

func (h *AuditHandler) HandleAuditLogs(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	if claims != nil && claims.OrgID != "" {
		orgID = claims.OrgID
	}

	if r.Method != http.MethodGet {
		JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	q := r.URL.Query()
	entityType := q.Get("entity_type")
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit <= 0 {
		limit = 50
	}
	page, _ := strconv.Atoi(q.Get("page"))
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	logs, total, err := h.auditRepo.ListAuditLogs(orgID, entityType, limit, offset)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONWithMeta(w, http.StatusOK, logs, map[string]interface{}{
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *AuditHandler) HandleNotifications(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	userID := "u0000000-0000-0000-0000-000000000001"
	if claims != nil {
		if claims.OrgID != "" {
			orgID = claims.OrgID
		}
		userID = claims.UserID
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/notifications")
	path = strings.Trim(path, "/")

	if path == "" {
		if r.Method != http.MethodGet {
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		list, err := h.auditRepo.ListNotifications(orgID, userID)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, list)
		return
	}

	if path == "read-all" && r.Method == http.MethodPost {
		if err := h.auditRepo.MarkAllNotificationsRead(userID); err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSONMessage(w, http.StatusOK, "all notifications marked as read")
		return
	}

	parts := strings.Split(path, "/")
	if len(parts) == 2 && parts[1] == "read" && r.Method == http.MethodPost {
		if err := h.auditRepo.MarkNotificationRead(parts[0]); err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSONMessage(w, http.StatusOK, "notification marked as read")
		return
	}

	JSONError(w, http.StatusNotFound, "not found")
}
