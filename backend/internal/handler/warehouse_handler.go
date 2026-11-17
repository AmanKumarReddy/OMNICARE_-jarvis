package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"omnistock/internal/domain"
	"omnistock/internal/middleware"
	"omnistock/internal/repository"
)

type WarehouseHandler struct {
	whRepo *repository.WarehouseRepository
}

func NewWarehouseHandler(whRepo *repository.WarehouseRepository) *WarehouseHandler {
	return &WarehouseHandler{whRepo: whRepo}
}

func (h *WarehouseHandler) HandleWarehouses(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	if claims != nil && claims.OrgID != "" {
		orgID = claims.OrgID
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/warehouses")
	path = strings.Trim(path, "/")

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			list, err := h.whRepo.List(orgID)
			if err != nil {
				JSONError(w, http.StatusInternalServerError, err.Error())
				return
			}
			JSON(w, http.StatusOK, list)
		case http.MethodPost:
			var wh domain.Warehouse
			if err := json.NewDecoder(r.Body).Decode(&wh); err != nil {
				JSONError(w, http.StatusBadRequest, "invalid payload")
				return
			}
			wh.OrgID = orgID
			if err := h.whRepo.Create(&wh); err != nil {
				JSONError(w, http.StatusBadRequest, err.Error())
				return
			}
			JSON(w, http.StatusCreated, wh)
		default:
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
		return
	}

	id := path
	switch r.Method {
	case http.MethodGet:
		item, err := h.whRepo.GetByID(orgID, id)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if item == nil {
			JSONError(w, http.StatusNotFound, "warehouse not found")
			return
		}
		JSON(w, http.StatusOK, item)
	case http.MethodPut:
		var wh domain.Warehouse
		if err := json.NewDecoder(r.Body).Decode(&wh); err != nil {
			JSONError(w, http.StatusBadRequest, "invalid payload")
			return
		}
		wh.OrgID = orgID
		wh.ID = id
		if err := h.whRepo.Update(&wh); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		updated, _ := h.whRepo.GetByID(orgID, id)
		JSON(w, http.StatusOK, updated)
	default:
		JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
