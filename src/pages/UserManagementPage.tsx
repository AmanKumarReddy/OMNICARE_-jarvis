import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Search,
  Check,
  X,
  AlertCircle,
  Building2,
  Mail,
  Calendar,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { User, UserRole, Warehouse } from '../types';
import { useAuth } from '../context/AuthContext';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('STAFF');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canManageUsers = hasRole(['SUPER_ADMIN', 'ADMIN']);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userData, whData] = await Promise.all([
        api.getUsers(),
        api.getWarehouses(),
      ]);
      setUsers(userData || []);
      setWarehouses(whData || []);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenEdit = (targetUser: User) => {
    setEditingUser(targetUser);
    setSelectedRole(targetUser.role);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.updateUserRole(editingUser.id, selectedRole);
      setSuccessMsg(`Role for ${editingUser.first_name} updated to ${selectedRole}`);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-900 text-white">
            Super Admin
          </span>
        );
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-forest/20 text-forest border border-forest/30">
            Admin
          </span>
        );
      case 'INVENTORY_MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Inventory Manager
          </span>
        );
      case 'WAREHOUSE_MANAGER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Warehouse Manager
          </span>
        );
      case 'STAFF':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
            Staff
          </span>
        );
      case 'VIEWER':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-50 text-stone-500 border border-stone-200">
            Viewer
          </span>
        );
      default:
        return null;
    }
  };

  // RBAC Matrix Definitions
  const permissionsList = [
    { capability: 'View Inventory & Catalog', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'STAFF', 'VIEWER'] },
    { capability: 'Create & Edit Products', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'] },
    { capability: 'Perform Stock Adjustments & Counts', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER'] },
    { capability: 'Create Purchase Orders (Draft)', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'STAFF'] },
    { capability: 'Approve Purchase Orders', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER'] },
    { capability: 'Receive Goods Dock (PO & Transfers)', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'STAFF'] },
    { capability: 'Confirm & Fulfil Sales Orders', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER'] },
    { capability: 'Approve & Dispatch Inter-Warehouse Transfers', roles: ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER'] },
    { capability: 'Manage Users & Assign Roles', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { capability: 'View Immutable Audit Logs & System Health', roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const allRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'STAFF', 'VIEWER'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            User Management & Access Control
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Enforce role-based access control (RBAC), warehouse assignments, and organization security.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Directory Filter / Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'STAFF', 'VIEWER'].map((tab) => (
            <button
              key={tab}
              onClick={() => setRoleFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                roleFilter === tab
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-stone-600 hover:text-charcoal'
              }`}
            >
              {tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-forest" />
            <h3 className="text-sm font-semibold text-charcoal">Authorized Organization Personnel</h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            {filteredUsers.length} active member(s)
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-stone-400">Loading directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-medium text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Assigned Role</th>
                  <th className="px-5 py-3">Assigned Facility</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  {canManageUsers && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredUsers.map((u) => {
                  const assignedWh = warehouses.find((w) => w.id === u.assigned_warehouse_id);
                  const isCurrent = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-stone-200 text-charcoal flex items-center justify-center font-bold text-xs uppercase">
                            {u.first_name[0]}{u.last_name[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-charcoal">
                              {u.first_name} {u.last_name} {isCurrent && <span className="text-xs font-normal text-forest">(You)</span>}
                            </p>
                            <p className="text-xs text-stone-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">{getRoleBadge(u.role)}</td>
                      <td className="px-5 py-4 text-xs text-stone-600">
                        {assignedWh ? (
                          <span className="flex items-center gap-1 font-medium text-stone-700">
                            <Building2 className="w-3.5 h-3.5 text-stone-400" />
                            {assignedWh.name}
                          </span>
                        ) : (
                          <span className="text-stone-400">All Facilities</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      {canManageUsers && (
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="px-3 py-1 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-100 text-charcoal"
                          >
                            Edit Role
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RBAC Permission Matrix */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-forest" />
            <h3 className="text-sm font-semibold text-charcoal">Role-Based Access Control (RBAC) Permission Matrix</h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Strict capability enforcement across backend APIs and frontend action guards.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 uppercase font-medium">
              <tr>
                <th className="px-5 py-3">Permission / Capability</th>
                <th className="px-3 py-3 text-center">Super Admin</th>
                <th className="px-3 py-3 text-center">Admin</th>
                <th className="px-3 py-3 text-center">Inventory Mgr</th>
                <th className="px-3 py-3 text-center">Warehouse Mgr</th>
                <th className="px-3 py-3 text-center">Staff</th>
                <th className="px-3 py-3 text-center">Viewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {permissionsList.map((perm, idx) => (
                <tr key={idx} className="hover:bg-stone-50">
                  <td className="px-5 py-3 font-medium text-stone-800">{perm.capability}</td>
                  {allRoles.map((r) => {
                    const hasAccess = perm.roles.includes(r);
                    return (
                      <td key={r} className="px-3 py-3 text-center">
                        {hasAccess ? (
                          <Check className="w-4 h-4 mx-auto text-forest font-bold" />
                        ) : (
                          <X className="w-4 h-4 mx-auto text-stone-300" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-semibold text-charcoal">
                Change Role: {editingUser.first_name} {editingUser.last_name}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Select New RBAC Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full text-sm border border-stone-300 rounded-lg p-2 focus:ring-1 focus:ring-forest"
                >
                  <option value="SUPER_ADMIN">Super Admin (Full Root Permissions)</option>
                  <option value="ADMIN">Admin (Organization Administrator)</option>
                  <option value="INVENTORY_MANAGER">Inventory Manager (Purchasing, Products, Counts)</option>
                  <option value="WAREHOUSE_MANAGER">Warehouse Manager (Transfers, Receipts, Fulfillment)</option>
                  <option value="STAFF">Staff (Inbound/Outbound Dock Operations)</option>
                  <option value="VIEWER">Viewer (Read-Only Access)</option>
                </select>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs text-stone-600">
                <p className="font-medium text-charcoal mb-1">Security Notice:</p>
                Role updates take effect immediately on backend token verification.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-forest text-white rounded-lg text-sm font-medium hover:bg-forest/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
