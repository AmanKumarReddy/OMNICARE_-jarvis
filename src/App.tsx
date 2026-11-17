import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Shell } from './components/layout/Shell';

// 12 Enterprise Core Pages
import { OverviewPage } from './pages/OverviewPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryPage } from './pages/InventoryPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { StockTransfersPage } from './pages/StockTransfersPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Shell>
            <Routes>
              {/* 1. Overview */}
              <Route path="/" element={<OverviewPage />} />

              {/* 2. Products */}
              <Route path="/products" element={<ProductsPage />} />

              {/* 3. Inventory */}
              <Route path="/inventory" element={<InventoryPage />} />

              {/* 4. Warehouses */}
              <Route path="/warehouses" element={<WarehousesPage />} />

              {/* 5. Suppliers */}
              <Route path="/suppliers" element={<SuppliersPage />} />

              {/* 6. Purchase Orders */}
              <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />

              {/* 7. Sales Orders */}
              <Route path="/sales-orders" element={<SalesOrdersPage />} />

              {/* 8. Stock Transfers */}
              <Route path="/transfers" element={<StockTransfersPage />} />

              {/* 9. Reports & Analytics */}
              <Route path="/reports" element={<ReportsPage />} />

              {/* 10. User Management */}
              <Route path="/users" element={<UserManagementPage />} />

              {/* 11. Audit Logs */}
              <Route path="/audit-logs" element={<AuditLogsPage />} />

              {/* 12. Settings */}
              <Route path="/settings" element={<SettingsPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Shell>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
