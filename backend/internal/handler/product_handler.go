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

type ProductHandler struct {
	productRepo *repository.ProductRepository
}

func NewProductHandler(productRepo *repository.ProductRepository) *ProductHandler {
	return &ProductHandler{productRepo: productRepo}
}

func (h *ProductHandler) HandleProducts(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	if claims != nil && claims.OrgID != "" {
		orgID = claims.OrgID
	}

	// URL routing check for ID: /api/products/{id}
	path := strings.TrimPrefix(r.URL.Path, "/api/products")
	path = strings.Trim(path, "/")

	if path == "" {
		// List or Create
		switch r.Method {
		case http.MethodGet:
			h.List(w, r, orgID)
		case http.MethodPost:
			h.Create(w, r, orgID)
		default:
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
		return
	}

	// Handling /api/products/{id} or /api/products/{id}/archive
	parts := strings.Split(path, "/")
	id := parts[0]

	if len(parts) == 2 && parts[1] == "archive" && r.Method == http.MethodPatch {
		h.SetArchived(w, r, orgID, id)
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.GetByID(w, r, orgID, id)
	case http.MethodPut:
		h.Update(w, r, orgID, id)
	default:
		JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}

func (h *ProductHandler) List(w http.ResponseWriter, r *http.Request, orgID string) {
	q := r.URL.Query()
	search := q.Get("search")
	catID := q.Get("category_id")
	sortBy := q.Get("sort_by")
	sortOrder := q.Get("sort_order")

	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit <= 0 {
		limit = 50
	}
	page, _ := strconv.Atoi(q.Get("page"))
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	var isArchived *bool
	if archStr := q.Get("archived"); archStr != "" {
		val := archStr == "true" || archStr == "1"
		isArchived = &val
	}

	filter := repository.ProductFilter{
		Search:     search,
		CategoryID: catID,
		IsArchived: isArchived,
		SortBy:     sortBy,
		SortOrder:  sortOrder,
		Limit:      limit,
		Offset:     offset,
	}

	products, total, err := h.productRepo.List(orgID, filter)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "failed to query products: "+err.Error())
		return
	}

	JSONWithMeta(w, http.StatusOK, products, map[string]interface{}{
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *ProductHandler) GetByID(w http.ResponseWriter, r *http.Request, orgID, id string) {
	product, err := h.productRepo.GetByID(orgID, id)
	if err != nil {
		JSONError(w, http.StatusInternalServerError, "database error: "+err.Error())
		return
	}
	if product == nil {
		JSONError(w, http.StatusNotFound, "product not found")
		return
	}

	JSON(w, http.StatusOK, product)
}

func (h *ProductHandler) Create(w http.ResponseWriter, r *http.Request, orgID string) {
	var p domain.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		JSONError(w, http.StatusBadRequest, "invalid JSON payload")
		return
	}

	if p.Name == "" || p.SKU == "" {
		JSONError(w, http.StatusBadRequest, "product name and SKU are required")
		return
	}

	p.OrgID = orgID
	if p.UOM == "" {
		p.UOM = "Units"
	}

	if err := h.productRepo.Create(&p); err != nil {
		JSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	JSON(w, http.StatusCreated, p)
}

func (h *ProductHandler) Update(w http.ResponseWriter, r *http.Request, orgID, id string) {
	var p domain.Product
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		JSONError(w, http.StatusBadRequest, "invalid JSON payload")
		return
	}

	p.OrgID = orgID
	p.ID = id

	if err := h.productRepo.Update(&p); err != nil {
		JSONError(w, http.StatusBadRequest, err.Error())
		return
	}

	updated, _ := h.productRepo.GetByID(orgID, id)
	JSON(w, http.StatusOK, updated)
}

func (h *ProductHandler) SetArchived(w http.ResponseWriter, r *http.Request, orgID, id string) {
	type archiveReq struct {
		Archived bool `json:"archived"`
	}
	var req archiveReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Archived = true
	}

	if err := h.productRepo.SetArchived(orgID, id, req.Archived); err != nil {
		JSONError(w, http.StatusInternalServerError, "failed to update archive status: "+err.Error())
		return
	}

	JSONMessage(w, http.StatusOK, "product archive status updated successfully")
}

func (h *ProductHandler) HandleCategories(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	if claims != nil && claims.OrgID != "" {
		orgID = claims.OrgID
	}

	switch r.Method {
	case http.MethodGet:
		cats, err := h.productRepo.ListCategories(orgID)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		JSON(w, http.StatusOK, cats)
	case http.MethodPost:
		var c domain.Category
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			JSONError(w, http.StatusBadRequest, "invalid payload")
			return
		}
		c.OrgID = orgID
		if err := h.productRepo.CreateCategory(&c); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		JSON(w, http.StatusCreated, c)
	default:
		JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
	}
}
