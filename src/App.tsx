import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Shell } from './components/layout/Shell';

// Enterprise Pages
import { LoginPage } from './pages/LoginPage';
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

// Guarded Layout for Authenticated Dashboard Pages
const ProtectedDashboardLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
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
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Workspace Layout */}
            <Route path="/*" element={<ProtectedDashboardLayout />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
