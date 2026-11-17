package domain

import (
	"time"
)

// Roles
const (
	RoleSuperAdmin       = "SUPER_ADMIN"
	RoleAdmin            = "ADMIN"
	RoleInventoryManager = "INVENTORY_MANAGER"
	RoleWarehouseManager = "WAREHOUSE_MANAGER"
	RoleStaff            = "STAFF"
	RoleViewer           = "VIEWER"
)

// Purchase Order Statuses
const (
	POStatusDraft             = "DRAFT"
	POStatusSubmitted         = "SUBMITTED"
	POStatusApproved          = "APPROVED"
	POStatusPartiallyReceived = "PARTIALLY_RECEIVED"
	POStatusReceived          = "RECEIVED"
	POStatusCancelled         = "CANCELLED"
)

// Sales Order Statuses
const (
	SOStatusDraft     = "DRAFT"
	SOStatusConfirmed = "CONFIRMED"
	SOStatusFulfilled = "FULFILLED"
	SOStatusCancelled = "CANCELLED"
)

// Stock Transfer Statuses
const (
	TransferStatusRequested = "REQUESTED"
	TransferStatusApproved  = "APPROVED"
	TransferStatusInTransit = "IN_TRANSIT"
	TransferStatusReceived  = "RECEIVED"
	TransferStatusCancelled = "CANCELLED"
)

// Stock Movement Types
const (
	MovementPurchaseReceipt   = "PURCHASE_RECEIPT"
	MovementSaleFulfillment   = "SALE_FULFILLMENT"
	MovementTransferOut       = "TRANSFER_OUT"
	MovementTransferIn        = "TRANSFER_IN"
	MovementAdjustmentInc     = "ADJUSTMENT_INCREASE"
	MovementAdjustmentDec     = "ADJUSTMENT_DECREASE"
	MovementReconciliation    = "RECONCILIATION"
)

// Organization represents tenant
type Organization struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	Currency  string    `json:"currency"`
	Timezone  string    `json:"timezone"`
	Address   string    `json:"address"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// User represents application user
type User struct {
	ID                  string    `json:"id"`
	OrgID               string    `json:"org_id"`
	Email               string    `json:"email"`
	PasswordHash        string    `json:"-"`
	FirstName           string    `json:"first_name"`
	LastName            string    `json:"last_name"`
	Role                string    `json:"role"`
	Status              string    `json:"status"`
	AssignedWarehouseID *string   `json:"assigned_warehouse_id,omitempty"`
	AvatarURL           string    `json:"avatar_url,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// Category represents product classification
type Category struct {
	ID          string    `json:"id"`
	OrgID       string    `json:"org_id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	ParentID    *string   `json:"parent_id,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Warehouse represents physical storage location
type Warehouse struct {
	ID          string    `json:"id"`
	OrgID       string    `json:"org_id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Address     string    `json:"address"`
	City        string    `json:"city"`
	State       string    `json:"state"`
	PostalCode  string    `json:"postal_code"`
	Country     string    `json:"country"`
	ManagerID   *string   `json:"manager_id,omitempty"`
	ManagerName string    `json:"manager_name,omitempty"`
	Capacity    int       `json:"capacity"`
	IsActive    bool      `json:"is_active"`
	TotalItems  int       `json:"total_items,omitempty"`
	TotalValue  float64   `json:"total_value,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Product represents item master
type Product struct {
	ID           string    `json:"id"`
	OrgID        string    `json:"org_id"`
	CategoryID   *string   `json:"category_id,omitempty"`
	CategoryName string    `json:"category_name,omitempty"`
	SKU          string    `json:"sku"`
	Barcode      string    `json:"barcode"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	UOM          string    `json:"uom"`
	CostPrice    float64   `json:"cost_price"`
	SellingPrice float64   `json:"selling_price"`
	MinThreshold int       `json:"min_threshold"`
	ImageURL     string    `json:"image_url,omitempty"`
	IsArchived   bool      `json:"is_archived"`
	TotalOnHand  int       `json:"total_on_hand,omitempty"`
	TotalReserved int      `json:"total_reserved,omitempty"`
	TotalAvailable int     `json:"total_available,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Inventory represents balance in a specific warehouse
type Inventory struct {
	ID                string    `json:"id"`
	OrgID             string    `json:"org_id"`
	WarehouseID       string    `json:"warehouse_id"`
	WarehouseName     string    `json:"warehouse_name,omitempty"`
	ProductID         string    `json:"product_id"`
	ProductName       string    `json:"product_name,omitempty"`
	ProductSKU        string    `json:"product_sku,omitempty"`
	CategoryName      string    `json:"category_name,omitempty"`
	QuantityOnHand    int       `json:"quantity_on_hand"`
	QuantityReserved  int       `json:"quantity_reserved"`
	QuantityAvailable int       `json:"quantity_available"`
	MinThreshold      int       `json:"min_threshold,omitempty"`
	CostPrice         float64   `json:"cost_price,omitempty"`
	SellingPrice      float64   `json:"selling_price,omitempty"`
	Valuation         float64   `json:"valuation,omitempty"`
	Aisle             string    `json:"aisle,omitempty"`
	Shelf             string    `json:"shelf,omitempty"`
	Bin               string    `json:"bin,omitempty"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// Supplier represents vendor profile
type Supplier struct {
	ID           string    `json:"id"`
	OrgID        string    `json:"org_id"`
	Code         string    `json:"code"`
	Name         string    `json:"name"`
	ContactName  string    `json:"contact_name"`
	Email        string    `json:"email"`
	Phone        string    `json:"phone"`
	Address      string    `json:"address"`
	City         string    `json:"city"`
	Country      string    `json:"country"`
	PaymentTerms string    `json:"payment_terms"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// PurchaseOrder represents procure-to-pay order
type PurchaseOrder struct {
	ID            string              `json:"id"`
	OrgID         string              `json:"org_id"`
	PONumber      string              `json:"po_number"`
	SupplierID    string              `json:"supplier_id"`
	SupplierName  string              `json:"supplier_name,omitempty"`
	WarehouseID   string              `json:"warehouse_id"`
	WarehouseName string              `json:"warehouse_name,omitempty"`
	Status        string              `json:"status"`
	TotalAmount   float64             `json:"total_amount"`
	ExpectedDate  string              `json:"expected_date,omitempty"`
	Notes         string              `json:"notes,omitempty"`
	CreatedBy     *string             `json:"created_by,omitempty"`
	CreatorName   string              `json:"creator_name,omitempty"`
	ApprovedBy    *string             `json:"approved_by,omitempty"`
	ApprovedAt    *time.Time          `json:"approved_at,omitempty"`
	Items         []PurchaseOrderItem `json:"items,omitempty"`
	CreatedAt     time.Time           `json:"created_at"`
	UpdatedAt     time.Time           `json:"updated_at"`
}

// PurchaseOrderItem represents line item
type PurchaseOrderItem struct {
	ID               string  `json:"id"`
	POID             string  `json:"po_id"`
	ProductID        string  `json:"product_id"`
	ProductName      string  `json:"product_name,omitempty"`
	ProductSKU       string  `json:"product_sku,omitempty"`
	QuantityOrdered  int     `json:"quantity_ordered"`
	QuantityReceived int     `json:"quantity_received"`
	UnitCost         float64 `json:"unit_cost"`
	TotalCost        float64 `json:"total_cost"`
}

// SalesOrder represents order-to-cash order
type SalesOrder struct {
	ID              string           `json:"id"`
	OrgID           string           `json:"org_id"`
	SONumber        string           `json:"so_number"`
	CustomerName    string           `json:"customer_name"`
	CustomerEmail   string           `json:"customer_email,omitempty"`
	ShippingAddress string           `json:"shipping_address,omitempty"`
	WarehouseID     string           `json:"warehouse_id"`
	WarehouseName   string           `json:"warehouse_name,omitempty"`
	Status          string           `json:"status"`
	TotalAmount     float64          `json:"total_amount"`
	Notes           string           `json:"notes,omitempty"`
	CreatedBy       *string          `json:"created_by,omitempty"`
	CreatorName     string           `json:"creator_name,omitempty"`
	FulfilledAt     *time.Time       `json:"fulfilled_at,omitempty"`
	Items           []SalesOrderItem `json:"items,omitempty"`
	CreatedAt       time.Time        `json:"created_at"`
	UpdatedAt       time.Time        `json:"updated_at"`
}

// SalesOrderItem represents line item
type SalesOrderItem struct {
	ID          string  `json:"id"`
	SOID        string  `json:"so_id"`
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name,omitempty"`
	ProductSKU  string  `json:"product_sku,omitempty"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	TotalPrice  float64 `json:"total_price"`
}

// StockTransfer represents warehouse-to-warehouse transfer
type StockTransfer struct {
	ID                     string              `json:"id"`
	OrgID                  string              `json:"org_id"`
	TransferNumber         string              `json:"transfer_number"`
	SourceWarehouseID      string              `json:"source_warehouse_id"`
	SourceWarehouseName    string              `json:"source_warehouse_name,omitempty"`
	DestinationWarehouseID string              `json:"destination_warehouse_id"`
	DestWarehouseName      string              `json:"destination_warehouse_name,omitempty"`
	Status                 string              `json:"status"`
	Notes                  string              `json:"notes,omitempty"`
	RequestedBy            *string             `json:"requested_by,omitempty"`
	RequesterName          string              `json:"requester_name,omitempty"`
	ApprovedBy             *string             `json:"approved_by,omitempty"`
	DispatchedAt           *time.Time          `json:"dispatched_at,omitempty"`
	ReceivedAt             *time.Time          `json:"received_at,omitempty"`
	Items                  []StockTransferItem `json:"items,omitempty"`
	CreatedAt              time.Time           `json:"created_at"`
	UpdatedAt              time.Time           `json:"updated_at"`
}

// StockTransferItem represents line item in transfer
type StockTransferItem struct {
	ID          string `json:"id"`
	TransferID  string `json:"transfer_id"`
	ProductID   string `json:"product_id"`
	ProductName string `json:"product_name,omitempty"`
	ProductSKU  string `json:"product_sku,omitempty"`
	Quantity    int    `json:"quantity"`
}

// StockMovement represents immutable audit record of stock level change
type StockMovement struct {
	ID              string    `json:"id"`
	OrgID           string    `json:"org_id"`
	ProductID       string    `json:"product_id"`
	ProductName     string    `json:"product_name,omitempty"`
	ProductSKU      string    `json:"product_sku,omitempty"`
	WarehouseID     string    `json:"warehouse_id"`
	WarehouseName   string    `json:"warehouse_name,omitempty"`
	MovementType    string    `json:"movement_type"`
	ReferenceType   string    `json:"reference_type,omitempty"`
	ReferenceID     *string   `json:"reference_id,omitempty"`
	ReferenceNumber string    `json:"reference_number,omitempty"`
	QuantityDelta   int       `json:"quantity_delta"`
	BalanceAfter    int       `json:"balance_after"`
	UnitCost        float64   `json:"unit_cost"`
	Notes           string    `json:"notes,omitempty"`
	CreatedBy       *string   `json:"created_by,omitempty"`
	CreatedByName   string    `json:"created_by_name,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
}

// Notification represents user alert
type Notification struct {
	ID        string    `json:"id"`
	OrgID     string    `json:"org_id"`
	UserID    *string   `json:"user_id,omitempty"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Link      string    `json:"link,omitempty"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// AuditLog represents immutable system action record
type AuditLog struct {
	ID            string    `json:"id"`
	OrgID         string    `json:"org_id"`
	UserID        *string   `json:"user_id,omitempty"`
	UserEmail     string    `json:"user_email,omitempty"`
	Action        string    `json:"action"`
	EntityType    string    `json:"entity_type"`
	EntityID      string    `json:"entity_id"`
	PreviousState string    `json:"previous_state,omitempty"`
	NewState      string    `json:"new_state,omitempty"`
	IPAddress     string    `json:"ip_address,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// DashboardSummary represents analytics KPI payload
type DashboardSummary struct {
	TotalProducts          int                    `json:"total_products"`
	TotalStockUnits        int                    `json:"total_stock_units"`
	TotalValuation         float64                `json:"total_valuation"`
	LowStockCount          int                    `json:"low_stock_count"`
	PendingPOsCount        int                    `json:"pending_pos_count"`
	PendingSOsCount        int                    `json:"pending_sos_count"`
	WarehouseDistribution []WarehouseStockMetric `json:"warehouse_distribution"`
	MonthlyTrends          []MonthlyMetric        `json:"monthly_trends"`
	TopSellingProducts     []TopProductMetric     `json:"top_selling_products"`
	RecentMovements        []StockMovement        `json:"recent_movements"`
	RecentAuditLogs        []AuditLog             `json:"recent_audit_logs"`
}

type WarehouseStockMetric struct {
	WarehouseID   string  `json:"warehouse_id"`
	WarehouseName string  `json:"warehouse_name"`
	TotalUnits    int     `json:"total_units"`
	TotalValue    float64 `json:"total_value"`
}

type MonthlyMetric struct {
	Month     string  `json:"month"`
	Purchases float64 `json:"purchases"`
	Sales     float64 `json:"sales"`
}

type TopProductMetric struct {
	ProductID    string  `json:"product_id"`
	ProductName  string  `json:"product_name"`
	ProductSKU   string  `json:"product_sku"`
	UnitsSold    int     `json:"units_sold"`
	TotalRevenue float64 `json:"total_revenue"`
}
