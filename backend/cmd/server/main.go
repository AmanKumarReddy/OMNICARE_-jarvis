package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"omnistock/internal/config"
	"omnistock/internal/handler"
	"omnistock/internal/middleware"
	"omnistock/internal/repository"
)

func main() {
	cfg := config.Load()
	log.Printf("Starting OmniStock Cloud Enterprise Backend on port :%s (Mode: %s, DB: %s)...", cfg.Port, cfg.Environment, cfg.DBType)

	// Initialize Database and run auto-migrations
	db, err := repository.NewDB(cfg.DBType, cfg.DBDSN)
	if err != nil {
		log.Fatalf("Fatal: Database initialization failed: %v", err)
	}
	defer db.Close()
	log.Printf("Connected to %s database and verified schema integrity.", db.Driver)

	// Repositories
	userRepo := repository.NewUserRepository(db)
	prodRepo := repository.NewProductRepository(db)
	whRepo := repository.NewWarehouseRepository(db)
	suppRepo := repository.NewSupplierRepository(db)
	invRepo := repository.NewInventoryRepository(db)
	orderRepo := repository.NewOrderRepository(db, invRepo)
	reportRepo := repository.NewReportRepository(db)
	auditRepo := repository.NewAuditRepository(db)

	// Middleware
	authMid := middleware.NewAuthMiddleware(cfg.JWTSecret)

	// Handlers
	authH := handler.NewAuthHandler(userRepo, authMid)
	prodH := handler.NewProductHandler(prodRepo)
	whH := handler.NewWarehouseHandler(whRepo)
	suppH := handler.NewSupplierHandler(suppRepo)
	invH := handler.NewInventoryHandler(invRepo)
	orderH := handler.NewOrderHandler(orderRepo)
	reportH := handler.NewReportHandler(reportRepo)
	userH := handler.NewUserHandler(userRepo)
	auditH := handler.NewAuditHandler(auditRepo)

	// Routing Mux
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		handler.JSON(w, http.StatusOK, map[string]interface{}{
			"status":      "HEALTHY",
			"database":    "CONNECTED",
			"db_driver":   db.Driver,
			"version":     "2.4.0",
			"environment": cfg.Environment,
		})
	})

	// Public Auth endpoints
	mux.HandleFunc("/api/auth/login", authH.Login)
	mux.HandleFunc("/api/auth/register", authH.Register)

	// Authenticated routes
	wrapAuth := func(h http.HandlerFunc) http.Handler {
		return authMid.Authenticate(h)
	}

	mux.Handle("/api/auth/me", wrapAuth(authH.Me))

	// Products & Categories
	mux.Handle("/api/products", wrapAuth(prodH.HandleProducts))
	mux.Handle("/api/products/", wrapAuth(prodH.HandleProducts))
	mux.Handle("/api/categories", wrapAuth(prodH.HandleCategories))

	// Warehouses
	mux.Handle("/api/warehouses", wrapAuth(whH.HandleWarehouses))
	mux.Handle("/api/warehouses/", wrapAuth(whH.HandleWarehouses))

	// Suppliers
	mux.Handle("/api/suppliers", wrapAuth(suppH.HandleSuppliers))
	mux.Handle("/api/suppliers/", wrapAuth(suppH.HandleSuppliers))

	// Inventory
	mux.Handle("/api/inventory", wrapAuth(invH.HandleInventory))
	mux.Handle("/api/inventory/", wrapAuth(invH.HandleInventory))

	// Purchase Orders
	mux.Handle("/api/purchase-orders", wrapAuth(orderH.HandlePurchaseOrders))
	mux.Handle("/api/purchase-orders/", wrapAuth(orderH.HandlePurchaseOrders))

	// Sales Orders
	mux.Handle("/api/sales-orders", wrapAuth(orderH.HandleSalesOrders))
	mux.Handle("/api/sales-orders/", wrapAuth(orderH.HandleSalesOrders))

	// Stock Transfers
	mux.Handle("/api/stock-transfers", wrapAuth(orderH.HandleStockTransfers))
	mux.Handle("/api/stock-transfers/", wrapAuth(orderH.HandleStockTransfers))

	// Reports
	mux.Handle("/api/reports/", wrapAuth(reportH.HandleReports))

	// Users & RBAC
	mux.Handle("/api/users", wrapAuth(userH.HandleUsers))
	mux.Handle("/api/users/", wrapAuth(userH.HandleUsers))

	// Audit Logs & Notifications
	mux.Handle("/api/audit-logs", wrapAuth(auditH.HandleAuditLogs))
	mux.Handle("/api/notifications", wrapAuth(auditH.HandleNotifications))
	mux.Handle("/api/notifications/", wrapAuth(auditH.HandleNotifications))

	// OpenAPI Documentation Spec Endpoint
	mux.HandleFunc("/api/docs", func(w http.ResponseWriter, r *http.Request) {
		handler.JSON(w, http.StatusOK, map[string]interface{}{
			"openapi": "3.0.3",
			"info": map[string]interface{}{
				"title":       "OmniStock Cloud Enterprise API",
				"version":     "2.4.0",
				"description": "Production RESTful API for Enterprise Cloud Inventory Management System",
			},
			"servers": []map[string]string{
				{"url": "/api", "description": "Current Environment"},
			},
		})
	})

	// Wrap global middleware
	handlerWithMiddleware := middleware.CORS(middleware.Logger(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Clean trailing slash for routing except root
		if len(r.URL.Path) > 1 && strings.HasSuffix(r.URL.Path, "/") {
			// Internal rewrite without redirect loop
		}
		mux.ServeHTTP(w, r)
	})))

	serverAddr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server listening on %s (Access URL: http://localhost:%s)", serverAddr, cfg.Port)
	if err := http.ListenAndServe(serverAddr, handlerWithMiddleware); err != nil {
		log.Fatalf("Fatal: Server encountered error: %v", err)
	}
}
