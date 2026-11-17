package repository

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
	"time"

	_ "github.com/lib/pq"
	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
	Driver string
}

func NewDB(dbType, dsn string) (*DB, error) {
	var driverName string
	if dbType == "postgres" {
		driverName = "postgres"
	} else {
		driverName = "sqlite"
	}

	db, err := sql.Open(driverName, dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if driverName == "sqlite" {
		// Enable foreign keys and WAL mode in SQLite for concurrency
		if _, err := db.Exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;"); err != nil {
			log.Printf("Warning: failed to enable sqlite pragma: %v", err)
		}
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	wrapped := &DB{DB: db, Driver: driverName}
	if err := wrapped.Migrate(); err != nil {
		return nil, fmt.Errorf("failed to run database migration: %w", err)
	}

	return wrapped, nil
}

func (db *DB) Migrate() error {
	var schema string
	if db.Driver == "postgres" {
		schema = `
		CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

		CREATE TABLE IF NOT EXISTS organizations (
			id VARCHAR(64) PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			slug VARCHAR(100) NOT NULL UNIQUE,
			currency VARCHAR(10) NOT NULL DEFAULT 'USD',
			timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
			address TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS users (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			email VARCHAR(255) NOT NULL UNIQUE,
			password_hash VARCHAR(255) NOT NULL,
			first_name VARCHAR(100) NOT NULL,
			last_name VARCHAR(100) NOT NULL,
			role VARCHAR(50) NOT NULL DEFAULT 'STAFF',
			status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
			assigned_warehouse_id VARCHAR(64),
			avatar_url TEXT,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS categories (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			code VARCHAR(50) NOT NULL,
			name VARCHAR(100) NOT NULL,
			description TEXT,
			parent_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT uq_categories_org_code UNIQUE(org_id, code)
		);

		CREATE TABLE IF NOT EXISTS warehouses (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			code VARCHAR(50) NOT NULL,
			name VARCHAR(255) NOT NULL,
			address VARCHAR(255),
			city VARCHAR(100),
			state VARCHAR(100),
			postal_code VARCHAR(20),
			country VARCHAR(100) DEFAULT 'USA',
			manager_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
			capacity INT DEFAULT 10000,
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT uq_warehouses_org_code UNIQUE(org_id, code)
		);

		CREATE TABLE IF NOT EXISTS products (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			category_id VARCHAR(64) REFERENCES categories(id) ON DELETE SET NULL,
			sku VARCHAR(100) NOT NULL,
			barcode VARCHAR(100),
			name VARCHAR(255) NOT NULL,
			description TEXT,
			uom VARCHAR(50) NOT NULL DEFAULT 'Units',
			cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
			selling_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
			min_threshold INT NOT NULL DEFAULT 10,
			image_url TEXT,
			is_archived BOOLEAN NOT NULL DEFAULT FALSE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT uq_products_org_sku UNIQUE(org_id, sku)
		);

		CREATE TABLE IF NOT EXISTS inventory (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
			product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
			quantity_on_hand INT NOT NULL DEFAULT 0,
			quantity_reserved INT NOT NULL DEFAULT 0,
			aisle VARCHAR(50),
			shelf VARCHAR(50),
			bin VARCHAR(50),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT uq_inventory_wh_prod UNIQUE(warehouse_id, product_id)
		);

		CREATE TABLE IF NOT EXISTS suppliers (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			code VARCHAR(50) NOT NULL,
			name VARCHAR(255) NOT NULL,
			contact_name VARCHAR(150),
			email VARCHAR(255),
			phone VARCHAR(50),
			address TEXT,
			city VARCHAR(100),
			country VARCHAR(100) DEFAULT 'USA',
			payment_terms VARCHAR(50) DEFAULT 'Net 30',
			status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT uq_suppliers_org_code UNIQUE(org_id, code)
		);

		CREATE TABLE IF NOT EXISTS purchase_orders (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			po_number VARCHAR(100) NOT NULL,
			supplier_id VARCHAR(64) NOT NULL REFERENCES suppliers(id),
			warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
			status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
			total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
			expected_date VARCHAR(50),
			notes TEXT,
			created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
			approved_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
			approved_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT uq_po_org_number UNIQUE(org_id, po_number)
		);

		CREATE TABLE IF NOT EXISTS purchase_order_items (
			id VARCHAR(64) PRIMARY KEY,
			po_id VARCHAR(64) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
			product_id VARCHAR(64) NOT NULL REFERENCES products(id),
			quantity_ordered INT NOT NULL,
			quantity_received INT NOT NULL DEFAULT 0,
			unit_cost NUMERIC(15, 2) NOT NULL,
			total_cost NUMERIC(15, 2) NOT NULL
		);

		CREATE TABLE IF NOT EXISTS sales_orders (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			so_number VARCHAR(100) NOT NULL,
			customer_name VARCHAR(255) NOT NULL,
			customer_email VARCHAR(255),
			shipping_address TEXT,
			warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
			status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
			total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
			notes TEXT,
			created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
			fulfilled_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT uq_so_org_number UNIQUE(org_id, so_number)
		);

		CREATE TABLE IF NOT EXISTS sales_order_items (
			id VARCHAR(64) PRIMARY KEY,
			so_id VARCHAR(64) NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
			product_id VARCHAR(64) NOT NULL REFERENCES products(id),
			quantity INT NOT NULL,
			unit_price NUMERIC(15, 2) NOT NULL,
			total_price NUMERIC(15, 2) NOT NULL
		);

		CREATE TABLE IF NOT EXISTS stock_transfers (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			transfer_number VARCHAR(100) NOT NULL,
			source_warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
			destination_warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
			status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
			notes TEXT,
			requested_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
			approved_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
			dispatched_at TIMESTAMP WITH TIME ZONE,
			received_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT uq_transfers_org_num UNIQUE(org_id, transfer_number)
		);

		CREATE TABLE IF NOT EXISTS stock_transfer_items (
			id VARCHAR(64) PRIMARY KEY,
			transfer_id VARCHAR(64) NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
			product_id VARCHAR(64) NOT NULL REFERENCES products(id),
			quantity INT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS stock_movements (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			product_id VARCHAR(64) NOT NULL REFERENCES products(id),
			warehouse_id VARCHAR(64) NOT NULL REFERENCES warehouses(id),
			movement_type VARCHAR(50) NOT NULL,
			reference_type VARCHAR(50),
			reference_id VARCHAR(64),
			reference_number VARCHAR(100),
			quantity_delta INT NOT NULL,
			balance_after INT NOT NULL,
			unit_cost NUMERIC(15, 2) DEFAULT 0.00,
			notes TEXT,
			created_by VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS notifications (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
			type VARCHAR(50) NOT NULL,
			title VARCHAR(255) NOT NULL,
			message TEXT NOT NULL,
			link VARCHAR(255),
			is_read BOOLEAN NOT NULL DEFAULT FALSE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS audit_logs (
			id VARCHAR(64) PRIMARY KEY,
			org_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
			user_email VARCHAR(255),
			action VARCHAR(100) NOT NULL,
			entity_type VARCHAR(100) NOT NULL,
			entity_id VARCHAR(100) NOT NULL,
			previous_state TEXT,
			new_state TEXT,
			ip_address VARCHAR(50),
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
		);
		`
	} else {
		// SQLite compatible schema
		schema = `
		CREATE TABLE IF NOT EXISTS organizations (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			currency TEXT NOT NULL DEFAULT 'USD',
			timezone TEXT NOT NULL DEFAULT 'UTC',
			address TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			first_name TEXT NOT NULL,
			last_name TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'STAFF',
			status TEXT NOT NULL DEFAULT 'ACTIVE',
			assigned_warehouse_id TEXT,
			avatar_url TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS categories (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			code TEXT NOT NULL,
			name TEXT NOT NULL,
			description TEXT,
			parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(org_id, code)
		);

		CREATE TABLE IF NOT EXISTS warehouses (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			code TEXT NOT NULL,
			name TEXT NOT NULL,
			address TEXT,
			city TEXT,
			state TEXT,
			postal_code TEXT,
			country TEXT DEFAULT 'USA',
			manager_id TEXT REFERENCES users(id) ON DELETE SET NULL,
			capacity INTEGER DEFAULT 10000,
			is_active INTEGER NOT NULL DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(org_id, code)
		);

		CREATE TABLE IF NOT EXISTS products (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
			sku TEXT NOT NULL,
			barcode TEXT,
			name TEXT NOT NULL,
			description TEXT,
			uom TEXT NOT NULL DEFAULT 'Units',
			cost_price REAL NOT NULL DEFAULT 0.0,
			selling_price REAL NOT NULL DEFAULT 0.0,
			min_threshold INTEGER NOT NULL DEFAULT 10,
			image_url TEXT,
			is_archived INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(org_id, sku)
		);

		CREATE TABLE IF NOT EXISTS inventory (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			warehouse_id TEXT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
			product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
			quantity_on_hand INTEGER NOT NULL DEFAULT 0,
			quantity_reserved INTEGER NOT NULL DEFAULT 0,
			aisle TEXT,
			shelf TEXT,
			bin TEXT,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(warehouse_id, product_id)
		);

		CREATE TABLE IF NOT EXISTS suppliers (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			code TEXT NOT NULL,
			name TEXT NOT NULL,
			contact_name TEXT,
			email TEXT,
			phone TEXT,
			address TEXT,
			city TEXT,
			country TEXT DEFAULT 'USA',
			payment_terms TEXT DEFAULT 'Net 30',
			status TEXT NOT NULL DEFAULT 'ACTIVE',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(org_id, code)
		);

		CREATE TABLE IF NOT EXISTS purchase_orders (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			po_number TEXT NOT NULL,
			supplier_id TEXT NOT NULL REFERENCES suppliers(id),
			warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
			status TEXT NOT NULL DEFAULT 'DRAFT',
			total_amount REAL NOT NULL DEFAULT 0.0,
			expected_date TEXT,
			notes TEXT,
			created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
			approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
			approved_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(org_id, po_number)
		);

		CREATE TABLE IF NOT EXISTS purchase_order_items (
			id TEXT PRIMARY KEY,
			po_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
			product_id TEXT NOT NULL REFERENCES products(id),
			quantity_ordered INTEGER NOT NULL,
			quantity_received INTEGER NOT NULL DEFAULT 0,
			unit_cost REAL NOT NULL,
			total_cost REAL NOT NULL
		);

		CREATE TABLE IF NOT EXISTS sales_orders (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			so_number TEXT NOT NULL,
			customer_name TEXT NOT NULL,
			customer_email TEXT,
			shipping_address TEXT,
			warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
			status TEXT NOT NULL DEFAULT 'DRAFT',
			total_amount REAL NOT NULL DEFAULT 0.0,
			notes TEXT,
			created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
			fulfilled_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(org_id, so_number)
		);

		CREATE TABLE IF NOT EXISTS sales_order_items (
			id TEXT PRIMARY KEY,
			so_id TEXT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
			product_id TEXT NOT NULL REFERENCES products(id),
			quantity INTEGER NOT NULL,
			unit_price REAL NOT NULL,
			total_price REAL NOT NULL
		);

		CREATE TABLE IF NOT EXISTS stock_transfers (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			transfer_number TEXT NOT NULL,
			source_warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
			destination_warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
			status TEXT NOT NULL DEFAULT 'REQUESTED',
			notes TEXT,
			requested_by TEXT REFERENCES users(id) ON DELETE SET NULL,
			approved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
			dispatched_at DATETIME,
			received_at DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(org_id, transfer_number)
		);

		CREATE TABLE IF NOT EXISTS stock_transfer_items (
			id TEXT PRIMARY KEY,
			transfer_id TEXT NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
			product_id TEXT NOT NULL REFERENCES products(id),
			quantity INTEGER NOT NULL
		);

		CREATE TABLE IF NOT EXISTS stock_movements (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			product_id TEXT NOT NULL REFERENCES products(id),
			warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
			movement_type TEXT NOT NULL,
			reference_type TEXT,
			reference_id TEXT,
			reference_number TEXT,
			quantity_delta INTEGER NOT NULL,
			balance_after INTEGER NOT NULL,
			unit_cost REAL DEFAULT 0.0,
			notes TEXT,
			created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS notifications (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
			type TEXT NOT NULL,
			title TEXT NOT NULL,
			message TEXT NOT NULL,
			link TEXT,
			is_read INTEGER NOT NULL DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS audit_logs (
			id TEXT PRIMARY KEY,
			org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
			user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
			user_email TEXT,
			action TEXT NOT NULL,
			entity_type TEXT NOT NULL,
			entity_id TEXT NOT NULL,
			previous_state TEXT,
			new_state TEXT,
			ip_address TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);
		`
	}

	for _, stmt := range strings.Split(schema, ";") {
		trimmed := strings.TrimSpace(stmt)
		if trimmed == "" {
			continue
		}
		if _, err := db.Exec(trimmed); err != nil {
			return fmt.Errorf("error executing migration statement (%s): %w", trimmed[:min(len(trimmed), 50)], err)
		}
	}

	// Check if seed data exists
	var userCount int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if err == nil && userCount == 0 {
		log.Println("Database is empty, inserting initial enterprise seed data...")
		if err := db.SeedInitialData(); err != nil {
			log.Printf("Warning: failed to seed initial data: %v", err)
		} else {
			log.Println("Enterprise seed data successfully populated.")
		}
	}

	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
