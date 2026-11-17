package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"omnistock/internal/domain"
	"omnistock/internal/middleware"
	"omnistock/internal/repository"
)

type InventoryHandler struct {
	invRepo *repository.InventoryRepository
}

func NewInventoryHandler(invRepo *repository.InventoryRepository) *InventoryHandler {
	return &InventoryHandler{invRepo: invRepo}
}

func (h *InventoryHandler) HandleInventory(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	if claims != nil && claims.OrgID != "" {
		orgID = claims.OrgID
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/inventory")
	path = strings.Trim(path, "/")

	switch path {
	case "":
		if r.Method != http.MethodGet {
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		h.List(w, r, orgID)
	case "adjust":
		if r.Method != http.MethodPost {
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		h.AdjustStock(w, r, orgID)
	case "reconcile":
		if r.Method != http.MethodPost {
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		h.ReconcileStock(w, r, orgID)
	case "movements":
		if r.Method != http.MethodGet {
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		h.ListMovements(w, r, orgID)
	default:
		JSONError(w, http.StatusNotFound, "not found")
	}
}

func (h *InventoryHandler) List(w http.ResponseWriter, r *http.Request, orgID string) {
	q := r.URL.Query()
	whID := q.Get("warehouse_id")
	prodID := q.Get("product_id")
	search := q.Get("search")
	lowStock := q.Get("low_stock") == "true" || q.Get("low_stock") == "1"

	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit <= 0 {
		limit = 50
	}
	page, _ := strconv.Atoi(q.Get("page"))
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	filter := repository.InventoryFilter{
		WarehouseID: whID,
		ProductID:   prodID,
		LowStock:    lowStock,
		Search:      search,
		Limit:       limit,
		Offset:      offset,
	}

	items, total, err := h.invRepo.List(orgID, filter)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "failed to query inventory: "+err.Error())
		return
	}

	JSONWithMeta(w, http.StatusOK, items, map[string]interface{}{
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

type StockAdjustmentPayload struct {
	WarehouseID   string `json:"warehouse_id"`
	ProductID     string `json:"product_id"`
	QuantityDelta int    `json:"quantity_delta"`
	MovementType  string `json:"movement_type"` // ADJUSTMENT_INCREASE, ADJUSTMENT_DECREASE
	Notes         string `json:"notes"`
}

func (h *InventoryHandler) AdjustStock(w http.ResponseWriter, r *http.Request, orgID string) {
	claims := middleware.GetUserClaims(r.Context())
	userID := "u0000000-0000-0000-0000-000000000001"
	userEmail := "admin@apexstock.com"
	if claims != nil {
		userID = claims.UserID
		userEmail = claims.Email
	}

	var payload StockAdjustmentPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if payload.WarehouseID == "" || payload.ProductID == "" || payload.QuantityDelta == 0 {
		JSONError(w, http.StatusBadRequest, "warehouse_id, product_id, and non-zero quantity_delta are required")
		return
	}

	movType := domain.MovementAdjustmentInc
	if payload.QuantityDelta < 0 {
		movType = domain.MovementAdjustmentDec
	}
	if payload.MovementType != "" {
		movType = payload.MovementType
	}

	params := repository.StockAdjustmentParams{
		OrgID:         orgID,
		WarehouseID:   payload.WarehouseID,
		ProductID:     payload.ProductID,
		QuantityDelta: payload.QuantityDelta,
		MovementType:  movType,
		Notes:         payload.Notes,
		UserID:        userID,
		UserEmail:     userEmail,
	}

	inv, err := h.invRepo.AdjustStock(params)
	if err != nil {
		JSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	JSON(w, http.StatusOK, inv)
}

type ReconcilePayload struct {
	WarehouseID   string `json:"warehouse_id"`
	ProductID     string `json:"product_id"`
	PhysicalCount int    `json:"physical_count"`
	Notes         string `json:"notes"`
}

func (h *InventoryHandler) ReconcileStock(w http.ResponseWriter, r *http.Request, orgID string) {
	claims := middleware.GetUserClaims(r.Context())
	userID := "u0000000-0000-0000-0000-000000000001"
	userEmail := "admin@apexstock.com"
	if claims != nil {
		userID = claims.UserID
		userEmail = claims.Email
	}

	var payload ReconcilePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		JSONError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if payload.WarehouseID == "" || payload.ProductID == "" || payload.PhysicalCount < 0 {
		JSONError(w, http.StatusBadRequest, "warehouse_id, product_id, and valid non-negative physical_count are required")
		return
	}

	params := repository.StockAdjustmentParams{
		OrgID:       orgID,
		WarehouseID: payload.WarehouseID,
		ProductID:   payload.ProductID,
		Notes:       payload.Notes,
		UserID:      userID,
		UserEmail:   userEmail,
	}

	inv, err := h.invRepo.ReconcileStock(params, payload.PhysicalCount)
	if err != nil {
		JSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	JSON(w, http.StatusOK, inv)
}

func (h *InventoryHandler) ListMovements(w http.ResponseWriter, r *http.Request, orgID string) {
	q := r.URL.Query()
	prodID := q.Get("product_id")
	whID := q.Get("warehouse_id")

	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit <= 0 {
		limit = 50
	}
	page, _ := strconv.Atoi(q.Get("page"))
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	movements, total, err := h.invRepo.ListMovements(orgID, prodID, whID, limit, offset)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "failed to query stock movements: "+err.Error())
		return
	}

	JSONWithMeta(w, http.StatusOK, movements, map[string]interface{}{
		"total": total,
		"page":  page,
		"limit": limit,
	})
}
