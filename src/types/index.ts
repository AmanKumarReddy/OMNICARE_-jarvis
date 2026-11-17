export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'INVENTORY_MANAGER'
  | 'WAREHOUSE_MANAGER'
  | 'STAFF'
  | 'VIEWER';

export interface User {
  id: string;
  org_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  status: string;
  assigned_warehouse_id?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  category_id?: string;
  category_name?: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  uom: string;
  cost_price: number;
  selling_price: number;
  min_threshold: number;
  image_url?: string;
  is_archived: boolean;
  total_on_hand?: number;
  total_reserved?: number;
  total_available?: number;
  created_at?: string;
  warehouse_breakdown?: {
    warehouse_id: string;
    warehouse_name: string;
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_available: number;
    aisle?: string;
    shelf?: string;
    bin?: string;
  }[];
}

export interface InventoryItem {
  id: string;
  warehouse_id: string;
  warehouse_name?: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  category_name?: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  min_threshold: number;
  cost_price: number;
  selling_price: number;
  valuation: number;
  aisle?: string;
  shelf?: string;
  bin?: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  manager_id?: string;
  manager_name?: string;
  capacity: number;
  is_active: boolean;
  total_items?: number;
  total_value?: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  payment_terms?: string;
  status: string;
}

export interface PurchaseOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  warehouse_id: string;
  warehouse_name: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  total_amount: number;
  expected_date?: string;
  notes?: string;
  created_by?: string;
  creator_name?: string;
  approved_by?: string;
  created_at: string;
  items: PurchaseOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SalesOrder {
  id: string;
  so_number: string;
  customer_name: string;
  customer_email?: string;
  shipping_address?: string;
  warehouse_id: string;
  warehouse_name: string;
  status: 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';
  total_amount: number;
  notes?: string;
  created_by?: string;
  creator_name?: string;
  fulfilled_at?: string;
  created_at: string;
  items: SalesOrderItem[];
}

export interface StockTransferItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  source_warehouse_id: string;
  source_warehouse_name: string;
  destination_warehouse_id: string;
  destination_warehouse_name: string;
  status: 'REQUESTED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
  requested_by?: string;
  requester_name?: string;
  approved_by?: string;
  dispatched_at?: string;
  received_at?: string;
  created_at: string;
  items: StockTransferItem[];
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  warehouse_id: string;
  warehouse_name: string;
  movement_type: string;
  reference_type?: string;
  reference_number?: string;
  quantity_delta: number;
  balance_after: number;
  unit_cost: number;
  notes?: string;
  created_by_name?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  previous_state?: string;
  new_state?: string;
  ip_address?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface DashboardSummary {
  total_products: number;
  total_stock_units: number;
  total_valuation: number;
  low_stock_count: number;
  pending_pos_count: number;
  pending_sos_count: number;
  warehouse_distribution: {
    warehouse_id: string;
    warehouse_name: string;
    total_units: number;
    total_value: number;
  }[];
  monthly_trends: {
    month: string;
    purchases: number;
    sales: number;
  }[];
  top_selling_products: {
    product_id: string;
    product_name: string;
    product_sku: string;
    units_sold: number;
    total_revenue: number;
  }[];
  recent_movements: StockMovement[];
  recent_audit_logs: AuditLog[];
}
