const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('omnistock_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with HTTP ${response.status}`);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  login: (email: string, password?: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: password || 'Admin123!' }),
    }),
  getMe: () => request<any>('/auth/me'),

  // Dashboard & Analytics
  getDashboard: () => request<any>('/reports/dashboard'),
  getValuationReport: (warehouseId?: string) =>
    request<any[]>(`/reports/valuation${warehouseId ? `?warehouse_id=${warehouseId}` : ''}`),
  downloadValuationCSV: (warehouseId?: string) => {
    const url = `${BASE_URL}/reports/valuation/csv${warehouseId ? `?warehouse_id=${warehouseId}` : ''}`;
    window.open(url, '_blank');
  },

  // Products
  getProducts: (params?: { search?: string; category_id?: string; archived?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.category_id) q.set('category_id', params.category_id);
    if (params?.archived !== undefined) q.set('archived', String(params.archived));
    return request<any[]>(`/products?${q.toString()}`);
  },
  getProduct: (id: string) => request<any>(`/products/${id}`),
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  archiveProduct: (id: string, archived: boolean) =>
    request<any>(`/products/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ archived }) }),
  getCategories: () => request<any[]>('/categories'),
  createCategory: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Inventory
  getInventory: (params?: { warehouse_id?: string; product_id?: string; low_stock?: boolean; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.warehouse_id) q.set('warehouse_id', params.warehouse_id);
    if (params?.product_id) q.set('product_id', params.product_id);
    if (params?.low_stock) q.set('low_stock', 'true');
    if (params?.search) q.set('search', params.search);
    return request<any[]>(`/inventory?${q.toString()}`);
  },
  adjustStock: (data: { warehouse_id: string; product_id: string; quantity_delta: number; notes: string; movement_type?: string }) =>
    request<any>('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  reconcileStock: (data: { warehouse_id: string; product_id: string; physical_count: number; notes: string }) =>
    request<any>('/inventory/reconcile', { method: 'POST', body: JSON.stringify(data) }),
  getMovements: (params?: { product_id?: string; warehouse_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.product_id) q.set('product_id', params.product_id);
    if (params?.warehouse_id) q.set('warehouse_id', params.warehouse_id);
    return request<any[]>(`/inventory/movements?${q.toString()}`);
  },

  // Warehouses
  getWarehouses: () => request<any[]>('/warehouses'),
  createWarehouse: (data: any) => request<any>('/warehouses', { method: 'POST', body: JSON.stringify(data) }),

  // Suppliers
  getSuppliers: () => request<any[]>('/suppliers'),
  createSupplier: (data: any) => request<any>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),

  // Purchase Orders
  getPurchaseOrders: (status?: string) =>
    request<any[]>(`/purchase-orders${status ? `?status=${status}` : ''}`),
  getPurchaseOrder: (id: string) => request<any>(`/purchase-orders/${id}`),
  createPurchaseOrder: (data: any) => request<any>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  submitPO: (id: string) => request<any>(`/purchase-orders/${id}/submit`, { method: 'POST' }),
  approvePO: (id: string) => request<any>(`/purchase-orders/${id}/approve`, { method: 'POST' }),
  receivePO: (id: string, receipts: { product_id: string; quantity_received: number }[]) =>
    request<any>(`/purchase-orders/${id}/receive`, { method: 'POST', body: JSON.stringify({ receipts }) }),

  // Sales Orders
  getSalesOrders: (status?: string) =>
    request<any[]>(`/sales-orders${status ? `?status=${status}` : ''}`),
  getSalesOrder: (id: string) => request<any>(`/sales-orders/${id}`),
  createSalesOrder: (data: any) => request<any>('/sales-orders', { method: 'POST', body: JSON.stringify(data) }),
  confirmSO: (id: string) => request<any>(`/sales-orders/${id}/confirm`, { method: 'POST' }),
  fulfillSO: (id: string) => request<any>(`/sales-orders/${id}/fulfill`, { method: 'POST' }),
  cancelSO: (id: string) => request<any>(`/sales-orders/${id}/cancel`, { method: 'POST' }),

  // Stock Transfers
  getTransfers: (status?: string) =>
    request<any[]>(`/stock-transfers${status ? `?status=${status}` : ''}`),
  createTransfer: (data: any) => request<any>('/stock-transfers', { method: 'POST', body: JSON.stringify(data) }),
  approveTransfer: (id: string) => request<any>(`/stock-transfers/${id}/approve`, { method: 'POST' }),
  dispatchTransfer: (id: string) => request<any>(`/stock-transfers/${id}/dispatch`, { method: 'POST' }),
  receiveTransfer: (id: string) => request<any>(`/stock-transfers/${id}/receive`, { method: 'POST' }),

  // Users & RBAC
  getUsers: () => request<any[]>('/users'),
  updateUserRole: (id: string, role: string) =>
    request<any>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  // Audit Logs & Notifications
  getAuditLogs: () => request<any[]>('/audit-logs'),
  getNotifications: () => request<any[]>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'POST' }),
};
