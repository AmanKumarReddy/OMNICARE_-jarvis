package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"omnistock/internal/domain"
	"omnistock/internal/middleware"
	"omnistock/internal/repository"
)

type SupplierHandler struct {
	suppRepo *repository.SupplierRepository
}

func NewSupplierHandler(suppRepo *repository.SupplierRepository) *SupplierHandler {
	return &SupplierHandler{suppRepo: suppRepo}
}

func (h *SupplierHandler) HandleSuppliers(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	if claims != nil && claims.OrgID != "" {
		orgID = claims.OrgID
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/suppliers")
	path = strings.Trim(path, "/")

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			list, err := h.suppRepo.List(orgID)
			if err != nil {
				JSONError(w, http.StatusInternalServerError, err.Error())
				return
			}
			JSON(w, http.StatusOK, list)
		case http.MethodPost:
			var s domain.Supplier
			if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
				JSONError(w, http.StatusBadRequest, "invalid payload")
				return
			}
			s.OrgID = orgID
			if err := h.suppRepo.Create(&s); err != nil {
				JSONError(w, http.StatusBadRequest, err.Error())
				return
			}
			JSON(w, http.StatusCreated, s)
		default:
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
		return
	}

	id := path
	switch r.Method {
	case http.MethodGet:
		item, err := h.suppRepo.GetByID(orgID, id)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if item == nil {
			JSONError(w, http.StatusNotFound, "supplier not found")
			return
		}
		JSON(w, http.StatusOK, item)
	case http.MethodPut:
		var s domain.Supplier
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
			JSONError(w, http.StatusBadRequest, "invalid payload")
			return
		}
		s.OrgID = orgID
		s.ID = id
		if err := h.suppRepo.Update(&s); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		updated, _ := h.suppRepo.GetByID(orgID, id)
		JSON(w, http.StatusOK, updated)
	default:
		JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
