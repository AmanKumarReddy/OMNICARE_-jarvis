import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Warehouse,
  Truck,
  FileText,
  ShoppingCart,
  ArrowLeftRight,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
  Bell,
  Search,
  Menu,
  ChevronRight,
  LogOut,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, NotificationItem } from '../../types';
import { api } from '../../services/api';
import { GlobalSearchModal } from '../common/GlobalSearchModal';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);

  const { user, switchRole } = useAuth();
  const location = useLocation();

  // Load notifications
  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const data = await api.getNotifications();
        setNotifications(data || []);
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    loadNotifs();
  }, []);

  // Global Cmd+K / Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Inventory', path: '/inventory', icon: Layers },
    { label: 'Warehouses', path: '/warehouses', icon: Warehouse },
    { label: 'Suppliers', path: '/suppliers', icon: Truck },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: FileText },
    { label: 'Sales Orders', path: '/sales-orders', icon: ShoppingCart },
    { label: 'Stock Transfers', path: '/transfers', icon: ArrowLeftRight },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { label: 'User Management', path: '/users', icon: Users },
    { label: 'Audit Logs', path: '/audit-logs', icon: ShieldCheck },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  // Dynamic breadcrumb generation
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbTitle = pathParts.length === 0
    ? 'Overview'
    : pathParts[0].replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="min-h-screen bg-[#F7F7F4] flex text-[#202923]">
      {/* ============================================================ */}
      {/* FIXED COLLAPSIBLE SIDEBAR */}
      {/* ============================================================ */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#17241F] text-[#E6E8E2] border-r border-[#24352E] transition-all duration-200 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-[#24352E] justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#527A62] text-white flex items-center justify-center font-bold text-sm tracking-tight shrink-0 shadow-sm">
              OS
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <div className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5">
                  OmniStock
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#24352E] text-[#DCE8DD] font-normal">
                    v2.4
                  </span>
                </div>
                <div className="text-[11px] text-[#A2ABA5] truncate">
                  Enterprise Cloud OS
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Item List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group relative ${
                  isActive
                    ? 'bg-[#527A62] text-white font-semibold'
                    : 'text-[#A2ABA5] hover:text-white hover:bg-[#20312A]'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#A2ABA5] group-hover:text-white'}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#17241F] text-white text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer & Organization Badge */}
        <div className="p-3 border-t border-[#24352E]">
          {!sidebarCollapsed ? (
            <div className="bg-[#20312A] rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white truncate">Apex Global</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="text-[11px] text-[#A2ABA5]">US-Central • ACID Mode</div>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" title="System Online"></span>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* TOP NAVIGATION BAR */}
        <header className="h-16 sticky top-0 z-20 bg-[#FFFFFF] border-b border-[#E6E8E2] px-6 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {/* Left: Collapse Button & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-md hover:bg-[#F7F7F4] text-[#7A827C] hover:text-[#202923] transition-colors"
              title="Toggle sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            <nav className="flex items-center gap-1.5 text-xs text-[#7A827C]">
              <span>OmniStock</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#CCD1CB]" />
              <span className="font-semibold text-[#202923]">{breadcrumbTitle}</span>
            </nav>
          </div>

          {/* Right: Search, Role Switcher, Notifications, Profile */}
          <div className="flex items-center gap-3">
            {/* Global Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E6E8E2] bg-[#FAFBF9] hover:bg-[#F7F7F4] text-xs text-[#7A827C] transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search everything...</span>
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-[#E6E8E2] text-[#7A827C] rounded">
                ⌘K
              </kbd>
            </button>

            {/* Quick Demo Role Switcher */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E6E8E2] bg-[#F7F7F4]">
              <span className="text-[11px] text-[#7A827C] font-medium">Role:</span>
              <select
                value={user.role}
                onChange={(e) => switchRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-semibold text-[#202923] focus:outline-none cursor-pointer"
                title="Switch active role to test RBAC permissions"
              >
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                <option value="STAFF">Staff</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg hover:bg-[#F7F7F4] text-[#7A827C] hover:text-[#202923] relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#B91C1C]"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#E6E8E2] shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E6E8E2] mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-[#202923]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-50 text-[#B91C1C] border border-rose-200">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-[#527A62] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-xs text-[#7A827C]">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-2.5 rounded-lg text-xs border transition-colors ${
                            !n.is_read
                              ? 'bg-[#FAFBF9] border-[#DCE8DD]'
                              : 'bg-white border-transparent hover:border-[#E6E8E2]'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {n.type === 'LOW_STOCK' ? (
                              <AlertTriangle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-[#527A62] shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-[#202923]">{n.title}</div>
                              <div className="text-[11px] text-[#7A827C] mt-0.5 leading-relaxed">{n.message}</div>
                              <div className="text-[10px] text-[#CCD1CB] font-mono mt-1">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F7F7F4] transition-colors"
              >
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                  alt={user.first_name}
                  className="w-7 h-7 rounded-full object-cover border border-[#E6E8E2]"
                />
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-[#202923] leading-none">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-[10px] font-mono text-[#7A827C] uppercase tracking-wider">
                    {user.role.replace('_', ' ')}
                  </div>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#E6E8E2] shadow-xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-[#E6E8E2] mb-1">
                    <div className="text-xs font-semibold text-[#202923]">{user.first_name} {user.last_name}</div>
                    <div className="text-[11px] text-[#7A827C] truncate">{user.email}</div>
                  </div>
                  <NavLink
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#202923] hover:bg-[#F7F7F4] transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#7A827C]" />
                    <span>Company Settings</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      switchRole('VIEWER');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#B91C1C] hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 text-[#B91C1C]" />
                    <span>Reset to Viewer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* BODY PAGE CONTENT */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};
