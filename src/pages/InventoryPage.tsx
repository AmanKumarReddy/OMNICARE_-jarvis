import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Layers,
  Sliders,
  CheckCircle,
  AlertTriangle,
  History,
  Search,
  Filter,
  Warehouse as WarehouseIcon,
  X,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react';
import { api } from '../services/api';
import { InventoryItem, Warehouse, StockMovement, Product } from '../types';
import { useAuth } from '../context/AuthContext';

export const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'balances' | 'movements'>('balances');
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const [selectedWarehouse, setSelectedWarehouse] = useState(searchParams.get('warehouse_id') || '');
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get('low_stock') === 'true');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isReconcileOpen, setIsReconcileOpen] = useState(false);
  const [targetItem, setTargetItem] = useState<InventoryItem | null>(null);

  // Form states
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjustType, setAdjustType] = useState('ADJUSTMENT_INCREASE');

  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const { canAdjustStock } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, whs, movs] = await Promise.all([
        api.getInventory({
          warehouse_id: selectedWarehouse,
          low_stock: lowStockOnly,
          search: searchQuery,
        }),
        api.getWarehouses(),
        api.getMovements({ warehouse_id: selectedWarehouse }),
      ]);
      setInventoryList(inv || []);
      setWarehouses(whs || []);
      setMovements(movs || []);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWarehouse, lowStockOnly, searchQuery]);

  const openAdjustModal = (item: InventoryItem) => {
    setTargetItem(item);
    setAdjustDelta(10);
    setAdjustType('ADJUSTMENT_INCREASE');
    setAdjustNotes('');
    setModalError(null);
    setIsAdjustOpen(true);
  };

  const openReconcileModal = (item: InventoryItem) => {
    setTargetItem(item);
    setPhysicalCount(item.quantity_on_hand);
    setReconcileNotes('');
    setModalError(null);
    setIsReconcileOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItem) return;
    setModalError(null);

    const delta = adjustType === 'ADJUSTMENT_DECREASE' ? -Math.abs(adjustDelta) : Math.abs(adjustDelta);

    try {
      await api.adjustStock({
        warehouse_id: targetItem.warehouse_id,
        product_id: targetItem.product_id,
        quantity_delta: delta,
        movement_type: adjustType,
        notes: adjustNotes || 'Manual stock level adjustment',
      });
      setIsAdjustOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Stock adjustment failed');
    }
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetItem) return;
    setModalError(null);

    try {
      await api.reconcileStock({
        warehouse_id: targetItem.warehouse_id,
        product_id: targetItem.product_id,
        physical_count: Number(physicalCount),
        notes: reconcileNotes || 'Cycle count physical reconciliation',
      });
      setIsReconcileOpen(false);
      loadData();
    } catch (err: any) {
      setModalError(err.message || 'Reconciliation failed');
    }
  };

  const totalValuation = inventoryList.reduce((sum, i) => sum + (i.valuation || 0), 0);
  const totalUnits = inventoryList.reduce((sum, i) => sum + i.quantity_on_hand, 0);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923] tracking-tight">Inventory Balances & Ledger</h1>
          <p className="text-xs text-[#7A827C] mt-0.5">
            Current on-hand, reservations, available stock, and traceable ledger transactions
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center p-1 bg-[#E6E8E2] rounded-lg text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('balances')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'balances' ? 'bg-white text-[#202923] shadow-sm' : 'text-[#7A827C] hover:text-[#202923]'
            }`}
          >
            Facility Balances
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'movements' ? 'bg-white text-[#202923] shadow-sm' : 'text-[#7A827C] hover:text-[#202923]'
            }`}
          >
            Audit Movement Ledger
          </button>
        </div>
      </div>

      {/* KPI Micro Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-[#E6E8E2] rounded-xl">
          <div className="text-[11px] text-[#7A827C]">Total Monitored Units</div>
          <div className="text-lg font-bold font-mono text-[#202923] mt-0.5">{totalUnits.toLocaleString()}</div>
        </div>
        <div className="p-3 bg-white border border-[#E6E8E2] rounded-xl">
          <div className="text-[11px] text-[#7A827C]">Total Filtered Valuation</div>
          <div className="text-lg font-bold font-mono text-[#202923] mt-0.5">${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="p-3 bg-white border border-[#E6E8E2] rounded-xl">
          <div className="text-[11px] text-[#7A827C]">Active Warehouses</div>
          <div className="text-lg font-bold font-mono text-[#202923] mt-0.5">{warehouses.length} Hubs</div>
        </div>
        <div className="p-3 bg-white border border-[#E6E8E2] rounded-xl">
          <div className="text-[11px] text-[#7A827C]">Low Stock Flags</div>
          <div className="text-lg font-bold font-mono text-[#B91C1C] mt-0.5">
            {inventoryList.filter((i) => i.quantity_on_hand <= i.min_threshold).length} Items
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-[#E6E8E2] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#7A827C] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by product, SKU or facility..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-xs text-[#202923] focus:outline-none focus:border-[#527A62]"
            />
          </div>

          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-xs text-[#202923] focus:outline-none focus:border-[#527A62]"
          >
            <option value="">All Storage Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-[#7A827C] cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-[#CCD1CB] text-[#527A62] focus:ring-[#527A62]"
            />
            <span className={lowStockOnly ? 'text-[#B91C1C] font-semibold' : ''}>Low Stock Alerts Only</span>
          </label>
        </div>
      </div>

      {/* TAB 1: FACILITY STOCK BALANCES */}
      {activeTab === 'balances' && (
        <div className="bg-white border border-[#E6E8E2] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E6E8E2] bg-[#FAFBF9] text-[#7A827C] font-semibold">
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Storage Warehouse</th>
                  <th className="py-3 px-4">Location Bin</th>
                  <th className="py-3 px-4 text-right">On Hand</th>
                  <th className="py-3 px-4 text-right">Reserved</th>
                  <th className="py-3 px-4 text-right">Available</th>
                  <th className="py-3 px-4 text-right">Valuation</th>
                  <th className="py-3 px-4 text-right">Adjustments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8E2]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#7A827C]">
                      Loading inventory records...
                    </td>
                  </tr>
                ) : inventoryList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#7A827C]">
                      No inventory balances found.
                    </td>
                  </tr>
                ) : (
                  inventoryList.map((item) => {
                    const isLow = item.quantity_on_hand <= item.min_threshold;
                    return (
                      <tr key={item.id} className="hover:bg-[#FAFBF9] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-[#202923]">{item.product_name}</div>
                          <div className="text-[11px] font-mono text-[#7A827C]">
                            SKU: {item.product_sku} • Min Threshold: {item.min_threshold}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[#202923] font-medium">
                          {item.warehouse_name}
                        </td>

                        <td className="py-3 px-4 font-mono text-[#7A827C]">
                          {item.aisle ? `${item.aisle} • ${item.shelf} • ${item.bin}` : 'Unassigned'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-[#202923]">
                          <span className={isLow ? 'text-[#B91C1C]' : ''}>
                            {item.quantity_on_hand}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-[#7A827C]">
                          {item.quantity_reserved}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#527A62]">
                          {item.quantity_available}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-[#202923]">
                          ${item.valuation?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {canAdjustStock ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openAdjustModal(item)}
                                className="px-2 py-1 rounded bg-[#FAFBF9] hover:bg-[#F0F2EB] border border-[#E6E8E2] text-[11px] font-medium text-[#202923] transition-colors"
                              >
                                Adjust
                              </button>
                              <button
                                onClick={() => openReconcileModal(item)}
                                className="px-2 py-1 rounded bg-[#DCE8DD] hover:bg-[#c9ddcb] text-[11px] font-semibold text-[#17241F] transition-colors"
                              >
                                Reconcile
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#CCD1CB]">Read only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT MOVEMENT LEDGER */}
      {activeTab === 'movements' && (
        <div className="bg-white border border-[#E6E8E2] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E6E8E2] bg-[#FAFBF9] text-[#7A827C] font-semibold">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Delta</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8E2]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#7A827C]">
                      No movement transactions found.
                    </td>
                  </tr>
                ) : (
                  movements.map((mov) => {
                    const isPositive = mov.quantity_delta > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-[#FAFBF9]">
                        <td className="py-3 px-4 font-mono text-[#7A827C]">
                          {new Date(mov.created_at).toLocaleDateString()} {new Date(mov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-[#202923]">{mov.product_name}</div>
                          <div className="text-[11px] font-mono text-[#7A827C]">{mov.product_sku}</div>
                        </td>

                        <td className="py-3 px-4 text-[#202923]">{mov.warehouse_name}</td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FAFBF9] border border-[#E6E8E2] text-[#202923]">
                            {mov.movement_type}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-[#7A827C]">
                          {mov.reference_number || 'MANUAL'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-700' : 'text-stone-800'}>
                            {isPositive ? `+${mov.quantity_delta}` : mov.quantity_delta}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-medium text-[#202923]">
                          {mov.balance_after}
                        </td>

                        <td className="py-3 px-4 text-[#7A827C]">
                          {mov.created_by_name || 'System Operator'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {isAdjustOpen && targetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-[#E6E8E2] shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8E2] mb-4">
              <h2 className="text-base font-bold text-[#202923]">Adjust Stock Balance</h2>
              <button onClick={() => setIsAdjustOpen(false)} className="p-1 rounded text-[#7A827C] hover:bg-[#F7F7F4]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B91C1C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-3 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg mb-4 text-xs">
              <div className="font-semibold text-[#202923]">{targetItem.product_name}</div>
              <div className="text-[11px] font-mono text-[#7A827C] mt-0.5">
                Facility: {targetItem.warehouse_name} • Current On Hand: <strong className="text-[#202923]">{targetItem.quantity_on_hand}</strong>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#202923] mb-1">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUSTMENT_INCREASE')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      adjustType === 'ADJUSTMENT_INCREASE'
                        ? 'bg-[#527A62] text-white border-[#527A62]'
                        : 'bg-white text-[#7A827C] border-[#E6E8E2]'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Stock Increase</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADJUSTMENT_DECREASE')}
                    className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      adjustType === 'ADJUSTMENT_DECREASE'
                        ? 'bg-[#B91C1C] text-white border-[#B91C1C]'
                        : 'bg-white text-[#7A827C] border-[#E6E8E2]'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Stock Deduction</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Quantity Delta *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(Math.abs(parseInt(e.target.value, 10)) || 1)}
                  className="w-full px-3 py-2 font-mono bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Reason / Audit Notes *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Inbound damaged container recount / scrap disposal..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div className="pt-3 border-t border-[#E6E8E2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E8E2] text-[#7A827C] hover:bg-[#F7F7F4] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#527A62] hover:bg-[#436450] text-white font-semibold shadow-sm"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECONCILE / CYCLE COUNT MODAL */}
      {isReconcileOpen && targetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-[#E6E8E2] shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8E2] mb-4">
              <h2 className="text-base font-bold text-[#202923]">Cycle Count Reconciliation</h2>
              <button onClick={() => setIsReconcileOpen(false)} className="p-1 rounded text-[#7A827C] hover:bg-[#F7F7F4]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B91C1C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="p-3 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg mb-4 text-xs space-y-1">
              <div className="font-semibold text-[#202923]">{targetItem.product_name}</div>
              <div className="text-[#7A827C]">Warehouse: {targetItem.warehouse_name}</div>
              <div className="flex justify-between font-mono pt-1 text-[#7A827C]">
                <span>System Count: <strong className="text-[#202923]">{targetItem.quantity_on_hand}</strong></span>
                <span>Calculated Variance: <strong className={physicalCount - targetItem.quantity_on_hand >= 0 ? 'text-emerald-700' : 'text-[#B91C1C]'}>
                  {physicalCount - targetItem.quantity_on_hand >= 0 ? `+${physicalCount - targetItem.quantity_on_hand}` : physicalCount - targetItem.quantity_on_hand}
                </strong></span>
              </div>
            </div>

            <form onSubmit={handleReconcileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#202923] mb-1">Physical Verified Count *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={physicalCount}
                  onChange={(e) => setPhysicalCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 font-mono bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-base font-bold text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Reconciliation Notes</label>
                <textarea
                  rows={2}
                  placeholder="Monthly audit verified by warehouse manager..."
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div className="pt-3 border-t border-[#E6E8E2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReconcileOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E8E2] text-[#7A827C] hover:bg-[#F7F7F4] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#527A62] hover:bg-[#436450] text-white font-semibold shadow-sm"
                >
                  Reconcile & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
