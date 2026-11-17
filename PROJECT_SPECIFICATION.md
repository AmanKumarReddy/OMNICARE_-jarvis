# Cloud-Based Inventory Management System
## (OmniStock Enterprise) — Software Engineering Project Specification

---

### 1. Project Overview
A **Cloud-Based Inventory Management System (CBIMS)** is a multi-tenant web application designed to track, orchestrate, and audit inventory, warehouses, procurement, customer fulfillment, and inter-facility stock movements on a centralized cloud infrastructure. 

The system enables Super Admins, Inventory Managers, Warehouse Managers, Inbound/Outbound Staff, and Financial Auditors to collaborate securely according to their authorized roles. It eliminates paper-based manifests, prevents overselling, enforces zero-negative-stock database rules, and provides real-time multi-warehouse inventory valuation.

---

### 2. Problem Statement
Traditional inventory tracking relies on spreadsheets, paper receipts, or disconnected desktop software across disparate storage facilities. This leads to critical operational failures:
* **Stockout Surprises:** Running out of best-selling products without warning due to lack of threshold alerting.
* **Overselling & Double Allocation:** Sales teams selling the same physical stock to multiple clients simultaneously because reserved inventory is not separated from available inventory.
* **Ghost & Lost Inventory:** Inability to pinpoint which warehouse, aisle, shelf, or bin contains specific products.
* **Inbound Dock Discrepancies:** Suppliers delivering partial shipments that go unnoticed or unadjusted in accounting books.
* **Inter-Warehouse Transit Blindspots:** Moving goods between regional hubs without chain-of-custody tracking, causing lost pallets during transit.
* **Financial Valuation Errors:** Inaccurate inventory asset valuation calculations that distort financial reporting and tax filings.
* **Zero Auditability:** Lack of immutable records detailing which staff member adjusted stock quantities, approved orders, or wrote off damaged goods.

---

### 3. Proposed Solution
The proposed system provides a centralized, cloud-hosted SaaS platform that synchronizes procurement, warehouse storage, customer order fulfillment, and financial audits in real time.

#### Core Modules:
1. **Product Master Catalog**
   * Register and edit products with SKU, barcode, category, and Unit of Measurement (UOM).
   * Maintain cost prices (acquisition basis) and selling prices with margin tracking.
   * Configure minimum safety thresholds for automated replenishment alerting.
   * Multi-warehouse catalog breakdown drawer showing aisle, shelf, and bin locations.
2. **Multi-Warehouse Management**
   * Support multiple regional distribution centers and storage hubs.
   * Track capacity volume, percent utilization, and facility manager assignments.
   * Rollup real-time warehouse-specific asset valuation and unit density.
3. **Inventory & Stock Tracking**
   * Track three-dimensional stock balances: **On-Hand** (physical), **Reserved** (promised), and **Available** (`On-Hand - Reserved`).
   * Perform manual stock adjustments with mandatory audit reason logging.
   * Conduct physical cycle counts with automated variance discrepancy calculations.
   * Enforce strict zero-negative-stock database constraints.
4. **Supplier Management**
   * Maintain vendor profiles, contact details, commercial payment terms (Net 30/60).
   * Track supply categories and vendor active/inactive operational status.
5. **Purchase Order Management (Procure-to-Pay)**
   * Complete purchasing workflow: `DRAFT → SUBMITTED → APPROVED → PARTIALLY_RECEIVED → RECEIVED / CANCELLED`.
   * Multi-line item procurement creator with automatic line total calculations.
   * Dock goods receipt modal that increments stock only upon actual physical dock delivery.
6. **Sales Order Management (Order-to-Cash)**
   * Fulfillment workflow: `DRAFT → CONFIRMED → FULFILLED / CANCELLED`.
   * Real-time stock reservation guard: prevents confirming orders unless `Available Stock >= Requested Quantity`.
   * Atomic fulfillment: permanently decrements physical stock and clears reserved holds upon outbound dispatch.
7. **Stock Transfers (Inter-Facility Reallocation)**
   * Chain-of-custody workflow: `REQUESTED → APPROVED → IN_TRANSIT → RECEIVED / CANCELLED`.
   * Origin stock availability validation prior to request submission.
   * Two-phase commit: decrements source warehouse upon dispatch, credits destination warehouse upon dock receipt.
8. **Reports & Financial Intelligence**
   * **Inventory Valuation Report:** FIFO-weighted acquisition asset calculations by category and facility.
   * **Stock Movement Ledger:** Complete audit trail of all receipts, adjustments, transfers, and deductions.
   * **Low-Stock Replenishment Report:** Automatic deficit calculation and suggested purchase order quantities.
   * **Warehouse Capacity Utilization:** Visual facility volume saturation gauges.
   * **One-Click CSV Export:** Instant spreadsheet generation for financial and ERP ingestion.
9. **Role-Based Access Control (RBAC) & User Management**
   * Granular permission enforcement across 6 role tiers.
   * Interactive role modification and facility assignments.
10. **Immutable Audit Trail & Compliance**
    * Append-only event ledger capturing actor email, timestamp, IP address, and entity type.
    * Side-by-side JSON state diff inspector modal showing before-and-after transaction snapshots.
11. **System Governance & Diagnostics**
    * Multi-currency (USD, EUR, GBP, INR) and operational timezone configurations.
    * Live backend ping diagnostics and health check endpoint monitoring (`/api/health`).

---

### 4. System Architecture

```text
+-----------------------------------------------------------+
|               Client Tier (Web Browser / SPA)             |
|   React 19 + TypeScript + Vite + Tailwind CSS + Recharts  |
+-----------------------------------------------------------+
                             |
                             |  HTTPS / RESTful JSON
                             v
+-----------------------------------------------------------+
|               Application / API Server Tier               |
|      Go 1.22 RESTful Modular Monolith / Node.js Engine    |
|   - Stateless JWT Verification & RBAC Middleware          |
|   - Purchase, Sales, & Transfer State Machines            |
|   - Atomic Inventory Transaction Guards                   |
|   - Structured Request Tracing & Latency Logging          |
+-----------------------------------------------------------+
                             |
                             |  SQL / Transaction Pool
                             v
+-----------------------------------------------------------+
|                 Cloud Database Storage Tier               |
|              PostgreSQL 16 Relational Database            |
|   - Foreign Keys & Cascading Delete Guards                |
|   - CHECK Constraints: quantity_on_hand >= 0              |
|   - CHECK Constraints: quantity_reserved <= on_hand       |
|   - Composite Unique Indexes (warehouse_id, product_id)   |
|   - Append-Only Audit Logs & Stock Movements Ledger       |
+-----------------------------------------------------------+
```

---

### 5. Users and Responsibilities

| User Role | Main Responsibilities & Permissions |
|---|---|
| **Super Admin** | Full root system access, system configuration, organization settings, role assignment, and audit log inspection. |
| **Admin** | Manages facilities, users, suppliers, high-value purchase order approvals, and company-wide policies. |
| **Inventory Manager** | Creates and updates products, reviews and approves Purchase Orders, monitors threshold alerts, and runs valuation reports. |
| **Warehouse Manager** | Performs cycle counts, executes manual stock adjustments, authorizes stock transfers, and oversees dock receipts. |
| **Warehouse Staff** | Receives incoming vendor shipments at the loading dock, picks items, and fulfills outbound customer sales orders. |
| **Viewer / Auditor** | Read-only access to inventory levels, reports, valuation analytics, and immutable audit trails (all mutating actions disabled). |

---

### 6. Technology Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend UI** | React 19, TypeScript, Vite | High performance component architecture, strict type safety, sub-second HMR. |
| **Styling** | Tailwind CSS | Utility-first styling implementing enterprise warm off-white (`#F7F7F4`) and charcoal-green palette without neon gradients. |
| **Visual Analytics** | Recharts | Declarative SVG financial charts, warehouse bar distributions, and category breakdown pies. |
| **State Management** | TanStack Query | Client-side query caching, automated deduplication, and optimistic updates. |
| **Backend API** | Go 1.22 / Node.js TSX Engine | High-throughput RESTful architecture, native concurrency safety, robust standard library. |
| **Database** | PostgreSQL 16 / Dual SQLite Engine | Strict relational ACID transactions, check constraints, composite unique indexing, and multi-tenant isolation. |
| **Authentication** | Stateless JWT (HMAC-SHA256) | Role-Based Access Control (RBAC) validated on all protected endpoints. |
| **Containerization** | Docker & Docker Compose | Multi-stage production container builds (Go Alpine / Nginx static runner). |
| **Cloud Hosting** | Vercel / Render / AWS ECS Fargate | Automated zero-downtime CI/CD deployment, global CDN asset delivery. |
| **Version Control** | Git & GitHub Actions | Automated CI test suites, linter verification, and pull-request gating. |

---

### 7. Important Database Tables

```text
ORGANIZATION
--------------------
id (UUID, PK)
name (VARCHAR)
slug (VARCHAR, UNIQUE)
currency (VARCHAR)
timezone (VARCHAR)
created_at (TIMESTAMP)

USER
--------------------
id (UUID, PK)
org_id (UUID, FK)
email (VARCHAR, UNIQUE)
password_hash (VARCHAR)
first_name (VARCHAR)
last_name (VARCHAR)
role (ENUM: SUPER_ADMIN, ADMIN, INVENTORY_MGR, WAREHOUSE_MGR, STAFF, VIEWER)
assigned_warehouse_id (UUID, FK, NULLABLE)
status (VARCHAR)

WAREHOUSE
--------------------
id (UUID, PK)
org_id (UUID, FK)
code (VARCHAR, UNIQUE)
name (VARCHAR)
address (VARCHAR)
city (VARCHAR)
capacity (INT)
is_active (BOOLEAN)

PRODUCT
--------------------
id (UUID, PK)
org_id (UUID, FK)
category_id (UUID, FK)
sku (VARCHAR, UNIQUE)
barcode (VARCHAR)
name (VARCHAR)
uom (VARCHAR)
cost_price (NUMERIC)
selling_price (NUMERIC)
min_threshold (INT)
is_archived (BOOLEAN)

INVENTORY
--------------------
id (UUID, PK)
warehouse_id (UUID, FK)
product_id (UUID, FK)
quantity_on_hand (INT, CHECK >= 0)
quantity_reserved (INT, CHECK >= 0)
aisle (VARCHAR)
shelf (VARCHAR)
bin (VARCHAR)
CONSTRAINT: UNIQUE(warehouse_id, product_id)
CONSTRAINT: quantity_reserved <= quantity_on_hand

SUPPLIER
--------------------
id (UUID, PK)
org_id (UUID, FK)
code (VARCHAR, UNIQUE)
name (VARCHAR)
contact_name (VARCHAR)
email (VARCHAR)
payment_terms (VARCHAR)
status (VARCHAR)

PURCHASE_ORDER
--------------------
id (UUID, PK)
po_number (VARCHAR, UNIQUE)
supplier_id (UUID, FK)
warehouse_id (UUID, FK)
status (ENUM: DRAFT, SUBMITTED, APPROVED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED)
total_amount (NUMERIC)
expected_date (DATE)
created_by (UUID, FK)

SALES_ORDER
--------------------
id (UUID, PK)
so_number (VARCHAR, UNIQUE)
customer_name (VARCHAR)
customer_email (VARCHAR)
warehouse_id (UUID, FK)
status (ENUM: DRAFT, CONFIRMED, FULFILLED, CANCELLED)
total_amount (NUMERIC)

STOCK_TRANSFER
--------------------
id (UUID, PK)
transfer_number (VARCHAR, UNIQUE)
source_warehouse_id (UUID, FK)
destination_warehouse_id (UUID, FK)
status (ENUM: REQUESTED, APPROVED, IN_TRANSIT, RECEIVED, CANCELLED)
dispatched_at (TIMESTAMP)
received_at (TIMESTAMP)

STOCK_MOVEMENT
--------------------
id (UUID, PK)
product_id (UUID, FK)
warehouse_id (UUID, FK)
movement_type (ENUM: PO_RECEIPT, SO_FULFILLMENT, TRANSFER_OUT, TRANSFER_IN, ADJUSTMENT, COUNT_RECONCILE)
quantity_delta (INT)
balance_after (INT)
unit_cost (NUMERIC)
created_at (TIMESTAMP)

AUDIT_LOG
--------------------
id (UUID, PK)
user_email (VARCHAR)
action (VARCHAR)
entity_type (VARCHAR)
entity_id (VARCHAR)
previous_state (JSONB)
new_state (JSONB)
ip_address (VARCHAR)
created_at (TIMESTAMP)
```

---

### 8. Main Workflows

#### A. Procure-to-Pay Lifecycle (Inbound Replenishment)
```text
Identify Low Stock Alert
        ↓
Create Purchase Order (Draft)
        ↓
Submit for Managerial Review
        ↓
Purchase Order Approved (Transmitted to Supplier)
        ↓
Vendor Delivery Arrives at Warehouse Dock
        ↓
Staff Conducts Physical Inspection & Enters Received Quantities
        ↓
Inventory Automatically Incremented & Stock Movement Logged
```

#### B. Order-to-Cash Lifecycle (Outbound Fulfillment)
```text
Customer Places Sales Order (Draft)
        ↓
System Checks: Is Available Stock >= Requested Quantity?
   ├── If NO: Alert Sales Team (Insufficient Stock)
   └── If YES: Order Status Transitions to CONFIRMED
        ↓
System Automatically Increments `quantity_reserved` (Prevents Overselling)
        ↓
Warehouse Staff Picks & Packs Shipment
        ↓
Staff Confirms Outbound Fulfillment
        ↓
Physical Stock Decremented, Reserved Hold Released, Audit Log Generated
```

#### C. Inter-Warehouse Transfer Lifecycle
```text
Destination Facility Requests Stock Relocation
        ↓
Source Warehouse Availability Verified
        ↓
Operations Manager Approves Transfer
        ↓
Shipment Dispatched on Transit Truck (Source On-Hand Decremented)
        ↓
Status Marked as IN_TRANSIT
        ↓
Truck Arrives at Destination Dock
        ↓
Destination Staff Acknowledges Receipt (Destination On-Hand Credited)
```

#### Major Use Cases by Actor:
| Actor | Use Cases |
|---|---|
| **Inventory Manager** | Manage Product Catalog, Configure Thresholds, Create Purchase Order, Submit PO, View Valuation Reports, Analyze Moving Averages |
| **Warehouse Manager** | Approve Stock Transfers, Conduct Cycle Count Reconciliations, Execute Manual Stock Adjustments, Assign Bins/Shelves |
| **Warehouse Staff** | Receive Goods at Inbound Dock, Inspect Purchase Orders, Pick & Pack Sales Orders, Fulfill Outbound Shipments, Receive Transferred Stock |
| **Super Admin / Admin** | Create Warehouses, Onboard Suppliers, Assign User Roles, Audit System Logs, View Health Diagnostics, Configure Global Currency/Timezones |
| **Viewer / Auditor** | View Live Inventory Balances, Inspect State Diffs in Audit Logs, Export Valuation CSV Reports |

---

### 9. Functional Requirements
1. **Authentication & Session:** Secure user authentication with stateless JWT, role-based route guards, and live role switching for operational testing.
2. **Catalog Management:** Create, update, search, filter, and archive products with barcode and SKU duplicate prevention.
3. **Multi-Warehouse Isolation:** Manage distinct inventory balances per warehouse facility without cross-facility data corruption.
4. **Non-Negative Stock Guard:** Atomic verification ensuring no operation can reduce available stock below zero.
5. **Two-Phase Reservation System:** Automatic reservation of stock upon sales order confirmation; deduction only upon physical fulfillment.
6. **Receiving Dock Verification:** Support partial and full goods receipts against purchase orders, recalculating balances and order completion.
7. **Inter-Warehouse Chain of Custody:** Multi-step transfer tracking preventing duplicate deductions or ghost inventory during transit.
8. **Cycle Count Reconciliation:** Physical count variance tracking with automatic stock movement adjustments and audit logs.
9. **Automated Replenishment Alerts:** Dynamic low-stock warnings triggered whenever on-hand units fall below minimum thresholds.
10. **Financial Valuation Reporting:** Multi-facility asset valuation computed via FIFO cost basis, downloadable as Excel-compatible CSV.
11. **Immutable Audit Logging:** Append-only recording of all transactional state modifications with before-and-after JSON snapshots.
12. **Global Search (`Cmd+K` / `Ctrl+K`):** Global modal shortcut querying products, warehouses, purchase orders, and sales orders instantly.

---

### 10. Non-Functional Requirements
* **Data Integrity & Consistency:** Database-enforced CHECK constraints and transaction isolation prevent inventory corruption and race conditions under concurrent operations.
* **Security & Access Control:** Password hashing via bcrypt, stateless JWT token authorization, and backend role-based access control (RBAC) enforcement on every endpoint.
* **High Availability & Uptime:** Cloud-native architecture deployed across distributed serverless/container infrastructure ensuring 24/7/365 availability.
* **Performance & Low Latency:** Sub-100ms API response times for inventory lookups; production bundle optimized via Vite with code splitting.
* **Auditability & Non-Repudiation:** Tamper-proof append-only audit trail capturing user email, timestamp, IP address, and JSON diffs for SOC2/ISO compliance.
* **Usability & Enterprise Design:** Restrained human-centric interface avoiding neon gradients, glowing buttons, and emojis; utilizing an understated warm off-white and forest green enterprise visual identity.
* **Scalability:** Normalized relational schema with composite indexing capable of supporting hundreds of warehouse nodes and millions of SKU balances.

---

### 11. Software Engineering Student Project Deliverables
For academic software engineering project evaluation, this system includes:
1. **Problem Definition & Scope Analysis** (Addressed in Sections 1 & 2)
2. **Software Requirements Specification (SRS)** (Addressed in Sections 9 & 10)
3. **System Architecture & Cloud Topology** (Section 4 & `system_architecture_design.md`)
4. **Role & Use Case Specification** (Sections 5 & 8)
5. **Relational Database Design & Schema Migrations** (`backend/migrations/000001_init_schema.up.sql`)
6. **Entity-Relationship (ER) Architecture** (Section 7)
7. **Full-Stack Implementation** (React 19 Frontend + Go REST API + Dual-Runtime Engine)
8. **Automated Unit & Concurrency Test Suites** (`backend/tests/system_test.go`)
9. **Containerization & CI/CD Pipelines** (`backend/Dockerfile`, `Dockerfile.frontend`, `docker-compose.yml`, `.github/workflows/ci-cd.yml`)
10. **Cloud Deployment Documentation** (`DEPLOYMENT.md` & `render.yaml` & `vercel.json`)
11. **Live Production Deployment URL** (Accessible globally 24/7)

---

### 12. Expected Outcome
The completed **OmniStock Enterprise** platform provides a commercial-grade, cloud-based operational hub through which modern enterprises can manage products, multi-city warehouses, suppliers, purchase orders, sales fulfillments, and inter-facility stock transfers. 

Warehouse personnel can verify physical dock deliveries and shipments in real time, while inventory managers and financial executives can monitor stock velocity, prevent stockouts, and audit asset valuations from a unified, secure dashboard.
