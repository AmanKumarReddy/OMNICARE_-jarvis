package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"omnistock/internal/domain"
	"omnistock/internal/middleware"
	"omnistock/internal/repository"
)

type OrderHandler struct {
	orderRepo *repository.OrderRepository
}

func NewOrderHandler(orderRepo *repository.OrderRepository) *OrderHandler {
	return &OrderHandler{orderRepo: orderRepo}
}

// ==========================================
// PURCHASE ORDERS HANDLER
// ==========================================

func (h *OrderHandler) HandlePurchaseOrders(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	userID := "u0000000-0000-0000-0000-000000000001"
	userEmail := "admin@apexstock.com"
	if claims != nil {
		if claims.OrgID != "" {
			orgID = claims.OrgID
		}
		userID = claims.UserID
		userEmail = claims.Email
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/purchase-orders")
	path = strings.Trim(path, "/")

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			status := r.URL.Query().Get("status")
			list, err := h.orderRepo.ListPurchaseOrders(orgID, status)
			if err != nil {
				JSONError(w, http.StatusInternalServerError, err.Error())
				return
			}
			JSON(w, http.StatusOK, list)
		case http.MethodPost:
			type createPOReq struct {
				domain.PurchaseOrder
				Items []domain.PurchaseOrderItem `json:"items"`
			}
			var req createPOReq
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				JSONError(w, http.StatusBadRequest, "invalid payload: "+err.Error())
				return
			}
			if req.SupplierID == "" || req.WarehouseID == "" || len(req.Items) == 0 {
				JSONError(w, http.StatusBadRequest, "supplier_id, warehouse_id, and at least one item are required")
				return
			}
			req.OrgID = orgID
			req.CreatedBy = &userID
			if err := h.orderRepo.CreatePurchaseOrder(&req.PurchaseOrder, req.Items); err != nil {
				JSONError(w, http.StatusBadRequest, err.Error())
				return
			}
			JSON(w, http.StatusCreated, req.PurchaseOrder)
		default:
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
		return
	}

	parts := strings.Split(path, "/")
	id := parts[0]

	if len(parts) == 1 {
		if r.Method != http.MethodGet {
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		po, err := h.orderRepo.GetPurchaseOrderByID(orgID, id)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if po == nil {
			JSONError(w, http.StatusNotFound, "purchase order not found")
			return
		}
		JSON(w, http.StatusOK, po)
		return
	}

	action := parts[1]
	if r.Method != http.MethodPost {
		JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	switch action {
	case "submit":
		if err := h.orderRepo.UpdatePOStatus(orgID, id, domain.POStatusSubmitted, userID); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		JSONMessage(w, http.StatusOK, "purchase order submitted for approval")
	case "approve":
		if err := h.orderRepo.UpdatePOStatus(orgID, id, domain.POStatusApproved, userID); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		JSONMessage(w, http.StatusOK, "purchase order approved successfully")
	case "cancel":
		if err := h.orderRepo.UpdatePOStatus(orgID, id, domain.POStatusCancelled, userID); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		JSONMessage(w, http.StatusOK, "purchase order cancelled")
	case "receive":
		type receiveReq struct {
			Receipts []repository.ItemReceipt `json:"receipts"`
		}
		var req receiveReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			JSONError(w, http.StatusBadRequest, "invalid payload")
			return
		}
		if len(req.Receipts) == 0 {
			JSONError(w, http.StatusBadRequest, "no items specified for receipt")
			return
		}
		if err := h.orderRepo.ReceivePurchaseOrder(orgID, id, req.Receipts, userID, userEmail); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		po, _ := h.orderRepo.GetPurchaseOrderByID(orgID, id)
		JSON(w, http.StatusOK, po)
	default:
		JSONError(w, http.StatusNotFound, "unknown action")
	}
}

// ==========================================
// SALES ORDERS HANDLER
// ==========================================

func (h *OrderHandler) HandleSalesOrders(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	userID := "u0000000-0000-0000-0000-000000000001"
	userEmail := "admin@apexstock.com"
	if claims != nil {
		if claims.OrgID != "" {
			orgID = claims.OrgID
		}
		userID = claims.UserID
		userEmail = claims.Email
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/sales-orders")
	path = strings.Trim(path, "/")

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			status := r.URL.Query().Get("status")
			list, err := h.orderRepo.ListSalesOrders(orgID, status)
			if err != nil {
				JSONError(w, http.StatusInternalServerError, err.Error())
				return
			}
			JSON(w, http.StatusOK, list)
		case http.MethodPost:
			type createSOReq struct {
				domain.SalesOrder
				Items []domain.SalesOrderItem `json:"items"`
			}
			var req createSOReq
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				JSONError(w, http.StatusBadRequest, "invalid payload: "+err.Error())
				return
			}
			if req.CustomerName == "" || req.WarehouseID == "" || len(req.Items) == 0 {
				JSONError(w, http.StatusBadRequest, "customer_name, warehouse_id, and at least one item are required")
				return
			}
			req.OrgID = orgID
			req.CreatedBy = &userID
			if err := h.orderRepo.CreateSalesOrder(&req.SalesOrder, req.Items); err != nil {
				JSONError(w, http.StatusBadRequest, err.Error())
				return
			}
			JSON(w, http.StatusCreated, req.SalesOrder)
		default:
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
		return
	}

	parts := strings.Split(path, "/")
	id := parts[0]

	if len(parts) == 1 {
		if r.Method != http.MethodGet {
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		so, err := h.orderRepo.GetSalesOrderByID(orgID, id)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if so == nil {
			JSONError(w, http.StatusNotFound, "sales order not found")
			return
		}
		JSON(w, http.StatusOK, so)
		return
	}

	action := parts[1]
	if r.Method != http.MethodPost {
		JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	switch action {
	case "confirm":
		if err := h.orderRepo.ConfirmSalesOrder(orgID, id); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		so, _ := h.orderRepo.GetSalesOrderByID(orgID, id)
		JSON(w, http.StatusOK, so)
	case "fulfill":
		if err := h.orderRepo.FulfillSalesOrder(orgID, id, userID, userEmail); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		so, _ := h.orderRepo.GetSalesOrderByID(orgID, id)
		JSON(w, http.StatusOK, so)
	case "cancel":
		if err := h.orderRepo.CancelSalesOrder(orgID, id, userID); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		JSONMessage(w, http.StatusOK, "sales order cancelled")
	default:
		JSONError(w, http.StatusNotFound, "unknown action")
	}
}

// ==========================================
// STOCK TRANSFERS HANDLER
// ==========================================

func (h *OrderHandler) HandleStockTransfers(w http.ResponseWriter, r *http.Request) {
	claims := middleware.GetUserClaims(r.Context())
	orgID := "a0000000-0000-0000-0000-000000000001"
	userID := "u0000000-0000-0000-0000-000000000001"
	userEmail := "admin@apexstock.com"
	if claims != nil {
		if claims.OrgID != "" {
			orgID = claims.OrgID
		}
		userID = claims.UserID
		userEmail = claims.Email
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/stock-transfers")
	path = strings.Trim(path, "/")

	if path == "" {
		switch r.Method {
		case http.MethodGet:
			status := r.URL.Query().Get("status")
			list, err := h.orderRepo.ListTransfers(orgID, status)
			if err != nil {
				JSONError(w, http.StatusInternalServerError, err.Error())
				return
			}
			JSON(w, http.StatusOK, list)
		case http.MethodPost:
			type createTransferReq struct {
				domain.StockTransfer
				Items []domain.StockTransferItem `json:"items"`
			}
			var req createTransferReq
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				JSONError(w, http.StatusBadRequest, "invalid payload: "+err.Error())
				return
			}
			if req.SourceWarehouseID == "" || req.DestinationWarehouseID == "" || len(req.Items) == 0 {
				JSONError(w, http.StatusBadRequest, "source warehouse, destination warehouse, and at least one item are required")
				return
			}
			req.OrgID = orgID
			req.RequestedBy = &userID
			if err := h.orderRepo.CreateTransfer(&req.StockTransfer, req.Items); err != nil {
				JSONError(w, http.StatusBadRequest, err.Error())
				return
			}
			JSON(w, http.StatusCreated, req.StockTransfer)
		default:
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		}
		return
	}

	parts := strings.Split(path, "/")
	id := parts[0]

	if len(parts) == 1 {
		if r.Method != http.MethodGet {
			JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
			return
		}
		transfer, err := h.orderRepo.GetTransferByID(orgID, id)
		if err != nil {
			JSONError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if transfer == nil {
			JSONError(w, http.StatusNotFound, "stock transfer not found")
			return
		}
		JSON(w, http.StatusOK, transfer)
		return
	}

	action := parts[1]
	if r.Method != http.MethodPost {
		JSONError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	switch action {
	case "approve":
		if err := h.orderRepo.ApproveTransfer(orgID, id, userID); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		JSONMessage(w, http.StatusOK, "transfer approved successfully")
	case "dispatch":
		if err := h.orderRepo.DispatchTransfer(orgID, id, userID, userEmail); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		transfer, _ := h.orderRepo.GetTransferByID(orgID, id)
		JSON(w, http.StatusOK, transfer)
	case "receive":
		if err := h.orderRepo.ReceiveTransfer(orgID, id, userID, userEmail); err != nil {
			JSONError(w, http.StatusBadRequest, err.Error())
			return
		}
		transfer, _ := h.orderRepo.GetTransferByID(orgID, id)
		JSON(w, http.StatusOK, transfer)
	default:
		JSONError(w, http.StatusNotFound, "unknown action")
	}
}
