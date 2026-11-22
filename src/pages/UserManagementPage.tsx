import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  UserPlus,
  Key,
  LogIn,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '../services/api';
import { User, UserRole, Warehouse } from '../types';
import { useAuth } from '../context/AuthContext';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser, hasRole, impersonateUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Role Edit Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('STAFF');

  // Create User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('STAFF');
  const [newWarehouseId, setNewWarehouseId] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Reset Password Modal
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

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
      setSuccessMsg(`Role for ${editingUser.first_name} ${editingUser.last_name} updated to ${selectedRole}`);
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName.trim() || !newLastName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setAddError('Please complete all required fields.');
      return;
    }
    if (newPassword.length < 6) {
      setAddError('Password must contain at least 6 characters.');
      return;
    }

    try {
      setActionLoading(true);
      setAddError(null);
      await api.createUser({
        first_name: newFirstName.trim(),
        last_name: newLastName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword.trim(),
        role: newRole,
        assigned_warehouse_id: newWarehouseId || undefined,
      });

      setSuccessMsg(`New user account "${newFirstName} ${newLastName}" (${newEmail}) was provisioned successfully.`);
      setIsAddModalOpen(false);
      setNewFirstName('');
      setNewLastName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('STAFF');
      setNewWarehouseId('');
      await loadData();
    } catch (err: any) {
      setAddError(err?.message || 'Failed to provision new account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (!window.confirm(`Are you sure you want to delete user "${targetUser.first_name} ${targetUser.last_name}" (${targetUser.email})? This action is permanent.`)) {
      return;
    }
    try {
      setActionLoading(true);
      setErrorMsg(null);
      await api.deleteUser(targetUser.id);
      setSuccessMsg(`Account for "${targetUser.email}" has been removed.`);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReset = (targetUser: User) => {
    setResetUser(targetUser);
    setResetPasswordVal('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    if (resetPasswordVal.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      setActionLoading(true);
      await api.resetUserPassword(resetUser.id, resetPasswordVal.trim());
      setSuccessMsg(`Password for ${resetUser.email} has been updated.`);
      setResetUser(null);
      setResetPasswordVal('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update user password.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleImpersonate = (targetUser: User) => {
    try {
      impersonateUser(targetUser);
      setSuccessMsg(`Active session switched to ${targetUser.first_name} ${targetUser.last_name} (${targetUser.role}).`);
      setTimeout(() => {
        navigate('/');
      }, 400);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to switch user.');
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
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EAF1EC] text-[#2E5A44] border border-[#C6D8CB]">
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
    { capability: 'Provision New Users & Reset Passwords', roles: ['SUPER_ADMIN', 'ADMIN'] },
    { capability: 'Universal Account Impersonation', roles: ['SUPER_ADMIN'] },
    { capability: 'View Immutable Audit Logs & System Health', roles: ['SUPER_ADMIN', 'ADMIN'] },
  ];

  const allRoles: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'STAFF', 'VIEWER'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#202923]">
            User Management & Access Control
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Enforce role-based access control (RBAC), provision new accounts, and configure facility assignments.
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() => {
              setIsAddModalOpen(true);
              setAddError(null);
            }}
            className="px-4 py-2 bg-[#2E5A44] hover:bg-[#244736] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New User</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-3.5 h-3.5" />
          </button>
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
            {filteredUsers.length} member(s) listed
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
                  <th className="px-5 py-3">Credentials</th>
                  <th className="px-5 py-3">Created</th>
                  {canManageUsers && <th className="px-5 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredUsers.map((u) => {
                  const assignedWh = warehouses.find((w) => w.id === u.assigned_warehouse_id);
                  const isCurrent = currentUser?.id === u.id;
                  const isRootSuperAdmin = u.email === 'admin@apexstock.com';

                  return (
                    <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-stone-200 text-charcoal flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{u.first_name[0]}{u.last_name[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-charcoal flex items-center gap-1.5">
                              <span>{u.first_name} {u.last_name}</span>
                              {isCurrent && <span className="text-[11px] font-normal text-forest font-mono">(Current User)</span>}
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
                        <div className="flex items-center gap-1.5 text-xs">
                          <Lock className="w-3 h-3 text-stone-400" />
                          <span className="font-mono text-[11px] text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">
                            {u.password ? u.password : '••••••••'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-stone-500">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      {canManageUsers && (
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {currentUser?.role === 'SUPER_ADMIN' && !isCurrent && (
                              <button
                                onClick={() => handleImpersonate(u)}
                                title="Log in as this user (Universal Super Admin Access)"
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
                              >
                                <LogIn className="w-3 h-3" /> Log in as
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenReset(u)}
                              title="Reset Password"
                              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-100 text-charcoal flex items-center gap-1 cursor-pointer"
                            >
                              <Key className="w-3 h-3" /> Password
                            </button>
                            <button
                              onClick={() => handleOpenEdit(u)}
                              title="Change Role"
                              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-100 text-charcoal cursor-pointer"
                            >
                              Role
                            </button>
                            {!isRootSuperAdmin && !isCurrent && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="Delete User Account"
                                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* Create User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-[#E6E8E2]">
            <div className="flex items-center justify-between border-b border-[#E6E8E2] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#527A62]/15 text-[#2E5A44] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#202923] text-sm">Provision New Personnel Account</h3>
                  <p className="text-[11px] text-[#7A827C]">Set unique credentials, enterprise role, and facility assignment.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202923] mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    placeholder="e.g. Rachel"
                    className="w-full text-xs border border-stone-300 rounded-xl p-2.5 focus:ring-1 focus:ring-forest focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202923] mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    placeholder="e.g. Vance"
                    className="w-full text-xs border border-stone-300 rounded-xl p-2.5 focus:ring-1 focus:ring-forest focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202923] mb-1">Login Work Email *</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="rachel.vance@apexstock.com"
                  className="w-full text-xs border border-stone-300 rounded-xl p-2.5 focus:ring-1 focus:ring-forest focus:outline-none"
                />
                <p className="text-[10px] text-stone-500 mt-1">This email will be the primary login key for this user.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202923] mb-1">Account Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 characters (e.g. Vance2026!)"
                    className="w-full text-xs border border-stone-300 rounded-xl p-2.5 pr-10 focus:ring-1 focus:ring-forest focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  The person can only log in with this specific password. Super Admin can also use the master password (Admin123!).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#202923] mb-1">Assigned RBAC Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-xs border border-stone-300 rounded-xl p-2.5 focus:ring-1 focus:ring-forest focus:outline-none"
                  >
                    <option value="SUPER_ADMIN">Super Admin (Full Root Permissions)</option>
                    <option value="ADMIN">Admin (Organization Administrator)</option>
                    <option value="INVENTORY_MANAGER">Inventory Manager (Purchasing & Catalog)</option>
                    <option value="WAREHOUSE_MANAGER">Warehouse Manager (Transfers & Stock)</option>
                    <option value="STAFF">Warehouse Staff (Dock Ops & Orders)</option>
                    <option value="VIEWER">Financial Auditor / Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#202923] mb-1">Facility Assignment</label>
                  <select
                    value={newWarehouseId}
                    onChange={(e) => setNewWarehouseId(e.target.value)}
                    className="w-full text-xs border border-stone-300 rounded-xl p-2.5 focus:ring-1 focus:ring-forest focus:outline-none"
                  >
                    <option value="">All Facilities</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>{wh.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6E8E2]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-stone-200 text-stone-700 rounded-xl text-xs font-medium hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-[#2E5A44] hover:bg-[#244736] text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Reset Password Modal */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-semibold text-charcoal">Reset Password</h3>
                <p className="text-xs text-stone-500 mt-0.5">{resetUser.first_name} {resetUser.last_name} ({resetUser.email})</p>
              </div>
              <button
                onClick={() => setResetUser(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    placeholder="Enter new account password"
                    className="w-full text-sm border border-stone-300 rounded-lg p-2.5 pr-10 focus:ring-1 focus:ring-forest font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-forest text-white rounded-lg text-sm font-medium hover:bg-forest/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
