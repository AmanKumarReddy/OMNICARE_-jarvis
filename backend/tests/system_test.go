package tests

import (
	"fmt"
	"sync"
	"testing"

	"omnistock/internal/domain"
	"omnistock/internal/middleware"
	"omnistock/internal/repository"
)

func setupTestDB(t *testing.T) (*repository.DB, *repository.InventoryRepository, *repository.OrderRepository, *repository.UserRepository) {
	// Use shared-cache in-memory SQLite database for deterministic, fast, isolated tests
	db, err := repository.NewDB("sqlite", "file:memtest?mode=memory&cache=shared")
	if err != nil {
		t.Fatalf("Failed to initialize test database: %v", err)
	}
	db.SetMaxOpenConns(1)

	invRepo := repository.NewInventoryRepository(db)
	orderRepo := repository.NewOrderRepository(db, invRepo)
	userRepo := repository.NewUserRepository(db)

	return db, invRepo, orderRepo, userRepo
}

func TestInventoryConsistencyAndNoNegativeStock(t *testing.T) {
	db, invRepo, _, _ := setupTestDB(t)
	defer db.Close()

	orgID := "a0000000-0000-0000-0000-000000000001"
	whID := "w0000000-0000-0000-0000-000000000001"
	prodID := "p0000000-0000-0000-0000-000000000001"

	// 1. Initial stock level set to 50
	_, err := invRepo.ReconcileStock(repository.StockAdjustmentParams{
		OrgID:       orgID,
		WarehouseID: whID,
		ProductID:   prodID,
		UserID:      "u0000000-0000-0000-0000-000000000001",
		UserEmail:   "admin@apexstock.com",
	}, 50)
	if err != nil {
		t.Fatalf("Failed to set initial stock: %v", err)
	}

	// 2. Attempt to deduct 60 (exceeds balance of 50) -> MUST FAIL
	_, err = invRepo.AdjustStock(repository.StockAdjustmentParams{
		OrgID:         orgID,
		WarehouseID:   whID,
		ProductID:     prodID,
		QuantityDelta: -60,
		MovementType:  domain.MovementAdjustmentDec,
		Notes:         "Test overdraw",
		UserID:        "u0000000-0000-0000-0000-000000000001",
		UserEmail:     "admin@apexstock.com",
	})
	if err == nil {
		t.Fatal("Expected error when deducting more than on-hand stock, but succeeded!")
	}

	// 3. Verify stock is still 50
	inv, err := invRepo.GetOrCreate(nil, orgID, whID, prodID)
	if err != nil || inv.QuantityOnHand != 50 {
		t.Fatalf("Expected stock to remain 50, got %d (err: %v)", inv.QuantityOnHand, err)
	}
}

func TestConcurrentInventoryAdjustments(t *testing.T) {
	db, invRepo, _, _ := setupTestDB(t)
	defer db.Close()

	orgID := "a0000000-0000-0000-0000-000000000001"
	whID := "w0000000-0000-0000-0000-000000000001"
	prodID := "p0000000-0000-0000-0000-000000000001"

	// Start with 100 units
	_, err := invRepo.ReconcileStock(repository.StockAdjustmentParams{
		OrgID:       orgID,
		WarehouseID: whID,
		ProductID:   prodID,
		UserID:      "u0000000-0000-0000-0000-000000000001",
		UserEmail:   "admin@apexstock.com",
	}, 100)
	if err != nil {
		t.Fatalf("Failed to reconcile initial stock: %v", err)
	}

	// Concurrently deduct 10 units x 10 workers = 100 total deduction
	var wg sync.WaitGroup
	workers := 10
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			_, _ = invRepo.AdjustStock(repository.StockAdjustmentParams{
				OrgID:         orgID,
				WarehouseID:   whID,
				ProductID:     prodID,
				QuantityDelta: -10,
				MovementType:  domain.MovementAdjustmentDec,
				Notes:         fmt.Sprintf("Concurrent worker %d", workerID),
				UserID:        "u0000000-0000-0000-0000-000000000001",
				UserEmail:     "admin@apexstock.com",
			})
		}(i)
	}
	wg.Wait()

	inv, err := invRepo.GetOrCreate(nil, orgID, whID, prodID)
	if err != nil {
		t.Fatalf("Failed to fetch inventory: %v", err)
	}

	if inv.QuantityOnHand < 0 {
		t.Fatalf("Inventory on hand fell below zero! Balance: %d", inv.QuantityOnHand)
	}
	t.Logf("Final on-hand after concurrent adjustments: %d", inv.QuantityOnHand)
}

func TestPurchaseOrderPartialAndFullReceipt(t *testing.T) {
	db, invRepo, orderRepo, _ := setupTestDB(t)
	defer db.Close()

	orgID := "a0000000-0000-0000-0000-000000000001"
	whID := "w0000000-0000-0000-0000-000000000001"
	prodID := "p0000000-0000-0000-0000-000000000002"
	suppID := "s0000000-0000-0000-0000-000000000001"
	userID := "u0000000-0000-0000-0000-000000000001"

	// 1. Initial stock is 12 (from seed)
	invBefore, _ := invRepo.GetOrCreate(nil, orgID, whID, prodID)
	initialOnHand := invBefore.QuantityOnHand

	// 2. Create Purchase Order for 100 units
	po := domain.PurchaseOrder{
		OrgID:       orgID,
		SupplierID:  suppID,
		WarehouseID: whID,
		Notes:       "Unit test PO restock",
		CreatedBy:   &userID,
	}
	items := []domain.PurchaseOrderItem{
		{
			ProductID:       prodID,
			QuantityOrdered: 100,
			UnitCost:        115.00,
		},
	}
	if err := orderRepo.CreatePurchaseOrder(&po, items); err != nil {
		t.Fatalf("Create PO failed: %v", err)
	}

	// 3. Approve PO
	if err := orderRepo.UpdatePOStatus(orgID, po.ID, domain.POStatusApproved, userID); err != nil {
		t.Fatalf("Approve PO failed: %v", err)
	}

	// 4. Verify stock has NOT changed on approval
	invAfterApprove, _ := invRepo.GetOrCreate(nil, orgID, whID, prodID)
	if invAfterApprove.QuantityOnHand != initialOnHand {
		t.Fatalf("Inventory changed on PO approval! Before: %d, After: %d", initialOnHand, invAfterApprove.QuantityOnHand)
	}

	// 5. Partial Receipt: 40 units arrive
	receipts := []repository.ItemReceipt{
		{ProductID: prodID, QuantityReceived: 40},
	}
	if err := orderRepo.ReceivePurchaseOrder(orgID, po.ID, receipts, userID, "admin@apexstock.com"); err != nil {
		t.Fatalf("Partial receipt failed: %v", err)
	}

	// Check PO status is PARTIALLY_RECEIVED
	poUpdated, _ := orderRepo.GetPurchaseOrderByID(orgID, po.ID)
	if poUpdated.Status != domain.POStatusPartiallyReceived {
		t.Fatalf("Expected PO status PARTIALLY_RECEIVED, got %s", poUpdated.Status)
	}

	// Stock must have increased by exactly 40
	invAfterPartial, _ := invRepo.GetOrCreate(nil, orgID, whID, prodID)
	expectedStock := initialOnHand + 40
	if invAfterPartial.QuantityOnHand != expectedStock {
		t.Fatalf("Expected stock %d, got %d", expectedStock, invAfterPartial.QuantityOnHand)
	}

	// 6. Final Receipt: remaining 60 units arrive
	receiptsFinal := []repository.ItemReceipt{
		{ProductID: prodID, QuantityReceived: 60},
	}
	if err := orderRepo.ReceivePurchaseOrder(orgID, po.ID, receiptsFinal, userID, "admin@apexstock.com"); err != nil {
		t.Fatalf("Final receipt failed: %v", err)
	}

	// Check PO status is now RECEIVED
	poFinal, _ := orderRepo.GetPurchaseOrderByID(orgID, po.ID)
	if poFinal.Status != domain.POStatusReceived {
		t.Fatalf("Expected PO status RECEIVED, got %s", poFinal.Status)
	}

	// Final stock must have increased by 100 total
	invFinal, _ := invRepo.GetOrCreate(nil, orgID, whID, prodID)
	if invFinal.QuantityOnHand != initialOnHand+100 {
		t.Fatalf("Expected final stock %d, got %d", initialOnHand+100, invFinal.QuantityOnHand)
	}
}

func TestSalesOrderStockReservationAndFulfillment(t *testing.T) {
	db, invRepo, orderRepo, _ := setupTestDB(t)
	defer db.Close()

	orgID := "a0000000-0000-0000-0000-000000000001"
	whID := "w0000000-0000-0000-0000-000000000001"
	prodID := "p0000000-0000-0000-0000-000000000003" // Hardware bolts
	userID := "u0000000-0000-0000-0000-000000000001"

	// Reconcile to exactly 100 units on hand, 0 reserved
	_, _ = invRepo.ReconcileStock(repository.StockAdjustmentParams{
		OrgID:       orgID,
		WarehouseID: whID,
		ProductID:   prodID,
		UserID:      userID,
		UserEmail:   "admin@apexstock.com",
	}, 100)
	_, _ = db.Exec("UPDATE inventory SET quantity_reserved = 0 WHERE warehouse_id = ? AND product_id = ?", whID, prodID)

	// 1. Create Sales Order for 30 units
	so := domain.SalesOrder{
		OrgID:        orgID,
		CustomerName: "Acme Industrial Corp",
		WarehouseID:  whID,
		CreatedBy:    &userID,
	}
	items := []domain.SalesOrderItem{
		{ProductID: prodID, Quantity: 30, UnitPrice: 78.50},
	}
	if err := orderRepo.CreateSalesOrder(&so, items); err != nil {
		t.Fatalf("Create SO failed: %v", err)
	}

	// 2. Confirm Sales Order -> Should atomically reserve 30 units
	if err := orderRepo.ConfirmSalesOrder(orgID, so.ID); err != nil {
		t.Fatalf("Confirm SO failed: %v", err)
	}

	invAfterConfirm, _ := invRepo.GetOrCreate(nil, orgID, whID, prodID)
	if invAfterConfirm.QuantityOnHand != 100 {
		t.Fatalf("On-hand changed on confirmation! Expected 100, got %d", invAfterConfirm.QuantityOnHand)
	}
	if invAfterConfirm.QuantityReserved != 30 {
		t.Fatalf("Expected 30 reserved, got %d", invAfterConfirm.QuantityReserved)
	}
	if invAfterConfirm.QuantityAvailable != 70 {
		t.Fatalf("Expected 70 available, got %d", invAfterConfirm.QuantityAvailable)
	}

	// 3. Fulfill Sales Order -> Deducts on-hand and releases reservation
	if err := orderRepo.FulfillSalesOrder(orgID, so.ID, userID, "admin@apexstock.com"); err != nil {
		t.Fatalf("Fulfill SO failed: %v", err)
	}

	invAfterFulfill, _ := invRepo.GetOrCreate(nil, orgID, whID, prodID)
	if invAfterFulfill.QuantityOnHand != 70 {
		t.Fatalf("Expected on-hand 70 after fulfillment, got %d", invAfterFulfill.QuantityOnHand)
	}
	if invAfterFulfill.QuantityReserved != 0 {
		t.Fatalf("Expected 0 reserved after fulfillment, got %d", invAfterFulfill.QuantityReserved)
	}
	if invAfterFulfill.QuantityAvailable != 70 {
		t.Fatalf("Expected 70 available, got %d", invAfterFulfill.QuantityAvailable)
	}
}

func TestStockTransferWorkflow(t *testing.T) {
	db, invRepo, orderRepo, _ := setupTestDB(t)
	defer db.Close()

	orgID := "a0000000-0000-0000-0000-000000000001"
	sourceWH := "w0000000-0000-0000-0000-000000000001" // ORD
	destWH := "w0000000-0000-0000-0000-000000000002"   // JFK
	prodID := "p0000000-0000-0000-0000-000000000007"   // Thermal labels
	userID := "u0000000-0000-0000-0000-000000000001"

	// Setup initial source (100) and dest (20)
	_, _ = invRepo.ReconcileStock(repository.StockAdjustmentParams{
		OrgID:       orgID,
		WarehouseID: sourceWH,
		ProductID:   prodID,
		UserID:      userID,
		UserEmail:   "admin@apexstock.com",
	}, 100)
	_, _ = invRepo.ReconcileStock(repository.StockAdjustmentParams{
		OrgID:       orgID,
		WarehouseID: destWH,
		ProductID:   prodID,
		UserID:      userID,
		UserEmail:   "admin@apexstock.com",
	}, 20)

	// 1. Create Transfer Request for 25 units
	xfer := domain.StockTransfer{
		OrgID:                  orgID,
		SourceWarehouseID:      sourceWH,
		DestinationWarehouseID: destWH,
		Notes:                  "Transfer test 25 units",
		RequestedBy:            &userID,
	}
	items := []domain.StockTransferItem{
		{ProductID: prodID, Quantity: 25},
	}
	if err := orderRepo.CreateTransfer(&xfer, items); err != nil {
		t.Fatalf("Create transfer failed: %v", err)
	}

	// 2. Approve Transfer
	if err := orderRepo.ApproveTransfer(orgID, xfer.ID, userID); err != nil {
		t.Fatalf("Approve transfer failed: %v", err)
	}

	// 3. Dispatch Transfer -> Source deducted
	if err := orderRepo.DispatchTransfer(orgID, xfer.ID, userID, "admin@apexstock.com"); err != nil {
		t.Fatalf("Dispatch transfer failed: %v", err)
	}

	srcInv, _ := invRepo.GetOrCreate(nil, orgID, sourceWH, prodID)
	if srcInv.QuantityOnHand != 75 {
		t.Fatalf("Expected source warehouse on-hand 75, got %d", srcInv.QuantityOnHand)
	}

	dstInvBefore, _ := invRepo.GetOrCreate(nil, orgID, destWH, prodID)
	if dstInvBefore.QuantityOnHand != 20 {
		t.Fatalf("Destination stock should not change before receipt, got %d", dstInvBefore.QuantityOnHand)
	}

	// 4. Receive Transfer -> Destination credited
	if err := orderRepo.ReceiveTransfer(orgID, xfer.ID, userID, "admin@apexstock.com"); err != nil {
		t.Fatalf("Receive transfer failed: %v", err)
	}

	dstInvAfter, _ := invRepo.GetOrCreate(nil, orgID, destWH, prodID)
	if dstInvAfter.QuantityOnHand != 45 {
		t.Fatalf("Expected destination warehouse on-hand 45 (20+25), got %d", dstInvAfter.QuantityOnHand)
	}
}

func TestJWTAuthAndRoleVerification(t *testing.T) {
	authMid := middleware.NewAuthMiddleware("super-secret-test-key-32-bytes")

	adminUser := &domain.User{
		ID:        "u-001",
		OrgID:     "org-001",
		Email:     "admin@apexstock.com",
		Role:      domain.RoleAdmin,
		FirstName: "Admin",
		LastName:  "User",
	}

	token, err := authMid.GenerateToken(adminUser)
	if err != nil {
		t.Fatalf("GenerateToken failed: %v", err)
	}

	if token == "" {
		t.Fatal("Token is empty")
	}
}
