import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  impersonateUser: (targetUser: User) => void;
  switchRole: (role: UserRole) => void;
  canEditProducts: boolean;
  canAdjustStock: boolean;
  canApproveOrders: boolean;
  canFulfillOrders: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const DEFAULT_USERS: Record<UserRole, User> = {
  SUPER_ADMIN: {
    id: 'u0000000-0000-0000-0000-000000000001',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin@apexstock.com',
    first_name: 'Alexander',
    last_name: 'Wright',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-01-15T08:00:00Z',
  },
  ADMIN: {
    id: 'u0000000-0000-0000-0000-000000000001-adm',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'admin.ops@apexstock.com',
    first_name: 'Diana',
    last_name: 'Prince',
    role: 'ADMIN',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-01-20T08:00:00Z',
  },
  INVENTORY_MANAGER: {
    id: 'u0000000-0000-0000-0000-000000000002',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'marcus.vance@apexstock.com',
    first_name: 'Marcus',
    last_name: 'Vance',
    role: 'INVENTORY_MANAGER',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-02-01T08:00:00Z',
  },
  WAREHOUSE_MANAGER: {
    id: 'u0000000-0000-0000-0000-000000000003',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'sarah.chen@apexstock.com',
    first_name: 'Sarah',
    last_name: 'Chen',
    role: 'WAREHOUSE_MANAGER',
    assigned_warehouse_id: 'w0000000-0000-0000-0000-000000000001',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-02-15T08:00:00Z',
  },
  STAFF: {
    id: 'u0000000-0000-0000-0000-000000000004',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'james.wilson@apexstock.com',
    first_name: 'James',
    last_name: 'Wilson',
    role: 'STAFF',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-03-01T08:00:00Z',
  },
  VIEWER: {
    id: 'u0000000-0000-0000-0000-000000000005',
    org_id: 'a0000000-0000-0000-0000-000000000001',
    email: 'auditor@apexstock.com',
    first_name: 'Elena',
    last_name: 'Rostova',
    role: 'VIEWER',
    status: 'ACTIVE',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    created_at: '2026-03-10T08:00:00Z',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session is ONLY active if explicitly logged in with valid token & user
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const isAuth = localStorage.getItem('omnistock_authenticated') === 'true';
    const hasToken = !!localStorage.getItem('omnistock_token');
    const hasUser = !!localStorage.getItem('omnistock_current_user');
    return isAuth && hasToken && hasUser;
  });

  const [user, setUser] = useState<User>(() => {
    try {
      const stored = localStorage.getItem('omnistock_current_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return DEFAULT_USERS.SUPER_ADMIN;
  });

  const login = async (email: string, password?: string): Promise<boolean> => {
    // Strict authentication against stored credentials & Super Admin master key
    const res = await api.login(email, password);
    const loggedInUser: User = res.user;

    setUser(loggedInUser);
    setIsAuthenticated(true);

    localStorage.setItem('omnistock_token', res.token);
    localStorage.setItem('omnistock_current_user', JSON.stringify(loggedInUser));
    localStorage.setItem('omnistock_authenticated', 'true');
    return true;
  };

  const impersonateUser = (targetUser: User) => {
    if (user?.role !== 'SUPER_ADMIN') {
      throw new Error('Only Super Admin is authorized to impersonate personnel accounts.');
    }
    setUser(targetUser);
    localStorage.setItem('omnistock_current_user', JSON.stringify(targetUser));
    localStorage.setItem('omnistock_token', `jwt_token_${targetUser.role}_${targetUser.id}`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(DEFAULT_USERS.SUPER_ADMIN);
    localStorage.removeItem('omnistock_token');
    localStorage.removeItem('omnistock_authenticated');
    localStorage.removeItem('omnistock_current_user');
  };

  const switchRole = (role: UserRole) => {
    // Only SUPER_ADMIN has authority to test or switch roles
    if (user.role !== 'SUPER_ADMIN') {
      console.warn('RBAC Notice: Non-superadmin accounts cannot arbitrarily change roles.');
      return;
    }
    const updatedUser: User = { ...user, role };
    setUser(updatedUser);
    localStorage.setItem('omnistock_current_user', JSON.stringify(updatedUser));
  };

  const isSuper = user.role === 'SUPER_ADMIN';
  const isAdmin = isSuper || user.role === 'ADMIN';
  const isInvMgr = isAdmin || user.role === 'INVENTORY_MANAGER';
  const isWhMgr = isInvMgr || user.role === 'WAREHOUSE_MANAGER';
  const isStaff = isWhMgr || user.role === 'STAFF';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        impersonateUser,
        switchRole,
        canEditProducts: isInvMgr,
        canAdjustStock: isWhMgr,
        canApproveOrders: isInvMgr,
        canFulfillOrders: isStaff,
        canManageUsers: isAdmin,
        canViewAuditLogs: isInvMgr,
        hasRole: (roles: UserRole[]) => (user ? roles.includes(user.role) : false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
