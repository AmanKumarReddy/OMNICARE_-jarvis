import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Warehouse as WarehouseIcon,
  Plus,
  MapPin,
  User,
  Layers,
  DollarSign,
  ArrowRight,
  X,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { Warehouse, User as UserType } from '../types';
import { useAuth } from '../context/AuthContext';

export const WarehousesPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [capacity, setCapacity] = useState(100000);
  const [managerId, setManagerId] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { canManageUsers } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [whs, u] = await Promise.all([api.getWarehouses(), api.getUsers()]);
      setWarehouses(whs || []);
      setUsers(u || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!code || !name) {
      setErrorMsg('Facility code and name are required');
      return;
    }

    try {
      await api.createWarehouse({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        address,
        city,
        state,
        postal_code: postalCode,
        capacity: Number(capacity),
        manager_id: managerId || undefined,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create warehouse');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923] tracking-tight">Distribution & Fulfillment Warehouses</h1>
          <p className="text-xs text-[#7A827C] mt-0.5">
            Geographic storage facilities, capacity thresholds, and inventory valuation rollups
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() => {
              setCode('');
              setName('');
              setAddress('');
              setCity('');
              setState('');
              setPostalCode('');
              setCapacity(100000);
              setManagerId('');
              setErrorMsg(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#527A62] hover:bg-[#436450] text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Storage Hub</span>
          </button>
        )}
      </div>

      {/* Warehouse Facility Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {warehouses.map((wh) => {
          const capacityUsed = Math.min(100, Math.round(((wh.total_items || 0) / (wh.capacity || 1)) * 100));
          return (
            <div
              key={wh.id}
              className="bg-white border border-[#E6E8E2] rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#CCD1CB] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-mono text-xs font-bold text-[#527A62]">{wh.code}</span>
                  </div>
                  <span className="text-[11px] text-emerald-800 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    Active Hub
                  </span>
                </div>

                <h2 className="text-base font-bold text-[#202923]">{wh.name}</h2>
                <div className="flex items-center gap-1 text-xs text-[#7A827C] mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{wh.address ? `${wh.address}, ` : ''}{wh.city}, {wh.state}</span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-1.5 pt-3 border-t border-[#E6E8E2]">
                <div className="flex items-center justify-between text-xs text-[#7A827C]">
                  <span>Capacity Utilization</span>
                  <span className="font-mono font-semibold text-[#202923]">{capacityUsed}%</span>
                </div>
                <div className="w-full h-2 bg-[#F0F2EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#527A62] rounded-full transition-all duration-300"
                    style={{ width: `${capacityUsed}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-[#7A827C] font-mono">
                  <span>{(wh.total_items || 0).toLocaleString()} stored</span>
                  <span>{wh.capacity.toLocaleString()} max</span>
                </div>
              </div>

              {/* Valuation & Manager */}
              <div className="pt-3 border-t border-[#E6E8E2] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#7A827C]">Facility Valuation</span>
                  <span className="font-mono font-bold text-[#202923]">
                    ${(wh.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#7A827C]">Site Manager</span>
                  <span className="font-medium text-[#202923] flex items-center gap-1">
                    <User className="w-3 h-3 text-[#7A827C]" />
                    {wh.manager_name || 'Unassigned'}
                  </span>
                </div>
              </div>

              <NavLink
                to={`/inventory?warehouse_id=${wh.id}`}
                className="w-full py-2 rounded-lg bg-[#FAFBF9] hover:bg-[#F0F2EB] border border-[#E6E8E2] text-xs font-semibold text-[#202923] flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>View Facility Stock</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#527A62]" />
              </NavLink>
            </div>
          );
        })}
      </div>

      {/* ADD WAREHOUSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-[#E6E8E2] shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8E2] mb-4">
              <h2 className="text-base font-bold text-[#202923]">Register New Storage Facility</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded text-[#7A827C] hover:bg-[#F7F7F4]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B91C1C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202923] mb-1">Facility Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-MIA"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 font-mono uppercase bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#202923] mb-1">Capacity (Units)</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 50000)}
                    className="w-full px-3 py-2 font-mono bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Miami Regional Distribution Center"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="e.g. 500 Airport Logistics Expressway"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#202923] mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Miami"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#202923] mb-1">State</label>
                  <input
                    type="text"
                    placeholder="FL"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#202923] mb-1">Postal Code</label>
                  <input
                    type="text"
                    placeholder="33101"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Assigned Site Manager</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                >
                  <option value="">None / Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#E6E8E2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E8E2] text-[#7A827C] hover:bg-[#F7F7F4] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#527A62] hover:bg-[#436450] text-white font-semibold shadow-sm"
                >
                  Create Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
