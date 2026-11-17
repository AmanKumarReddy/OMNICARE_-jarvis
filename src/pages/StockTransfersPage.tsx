import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Plus,
  Search,
  CheckCircle2,
  Truck,
  Clock,
  Warehouse as WarehouseIcon,
  Package,
  AlertCircle,
  ArrowRight,
  X,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { api } from '../services/api';
import { StockTransfer, Warehouse, Product, InventoryItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const StockTransfersPage: React.FC = () => {
  const { hasRole, user } = useAuth();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(null);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destWarehouseId, setDestWarehouseId] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferItems, setTransferItems] = useState<
    { product_id: string; quantity: number }[]
  >([{ product_id: '', quantity: 1 }]);

  const canManage = hasRole(['SUPER_ADMIN', 'ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER']);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transfersData, whData, prodData, invData] = await Promise.all([
        api.getTransfers(),
        api.getWarehouses(),
        api.getProducts(),
        api.getInventory(),
      ]);
      setTransfers(transfersData || []);
      setWarehouses(whData || []);
      setProducts(prodData || []);
      setInventory(invData || []);
    } catch (err: any) {
      console.error('Failed to load transfers data:', err);
      setErrorMsg(err.message || 'Error loading stock transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItemRow = () => {
    setTransferItems([...transferItems, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setTransferItems(transferItems.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: 'product_id' | 'quantity', value: any) => {
    const updated = [...transferItems];
    updated[index] = { ...updated[index], [field]: value };
    setTransferItems(updated);
  };

  // Get available quantity of product at source warehouse
  const getAvailableAtSource = (productId: string, whId: string) => {
    if (!productId || !whId) return null;
    const item = inventory.find(
      (inv) => inv.product_id === productId && inv.warehouse_id === whId
    );
    return item ? item.quantity_available : 0;
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!sourceWarehouseId || !destWarehouseId) {
      setErrorMsg('Please select both source and destination warehouses.');
      return;
    }
    if (sourceWarehouseId === destWarehouseId) {
      setErrorMsg('Source and destination warehouses cannot be the same facility.');
      return;
    }

    const validItems = transferItems.filter((it) => it.product_id && it.quantity > 0);
    if (validItems.length === 0) {
      setErrorMsg('Please add at least one product with a quantity greater than zero.');
      return;
    }

    // Check stock availability
    for (const item of validItems) {
      const avail = getAvailableAtSource(item.product_id, sourceWarehouseId);
      if (avail !== null && item.quantity > avail) {
        const prod = products.find((p) => p.id === item.product_id);
        setErrorMsg(
          `Insufficient available stock for ${prod?.name || 'item'}. Available: ${avail}, Requested: ${item.quantity}`
        );
        return;
      }
    }

    try {
      setActionLoading(true);
      await api.createTransfer({
        source_warehouse_id: sourceWarehouseId,
        destination_warehouse_id: destWarehouseId,
        notes: transferNotes,
        items: validItems,
      });
      setIsCreateModalOpen(false);
      setTransferItems([{ product_id: '', quantity: 1 }]);
      setTransferNotes('');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create transfer request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setActionLoading(true);
      await api.approveTransfer(id);
      await loadData();
      if (selectedTransfer?.id === id) {
        setSelectedTransfer((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async (id: string) => {
    try {
      setActionLoading(true);
      await api.dispatchTransfer(id);
      await loadData();
      if (selectedTransfer?.id === id) {
        setSelectedTransfer((prev) => (prev ? { ...prev, status: 'IN_TRANSIT' } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = async (id: string) => {
    try {
      setActionLoading(true);
      await api.receiveTransfer(id);
      await loadData();
      if (selectedTransfer?.id === id) {
        setSelectedTransfer((prev) => (prev ? { ...prev, status: 'RECEIVED' } : null));
      }
    } catch (err: any) {
      alert(err.message || 'Receipt failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter transfers
  const filteredTransfers = transfers.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch =
      t.transfer_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.source_warehouse_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.destination_warehouse_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.notes && t.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: StockTransfer['status']) => {
    switch (status) {
      case 'REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Requested
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-800 border border-purple-200">
            <Truck className="w-3.5 h-3.5" /> In Transit
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-forest/10 text-forest border border-forest/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Received
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600 border border-stone-200">
            <X className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            Stock Transfers
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage multi-facility inventory reallocation and track in-transit stock movement.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => {
              setTransferItems([{ product_id: '', quantity: 1 }]);
              setErrorMsg(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-forest hover:bg-forest/90 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Transfer Request
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Total Transfers
          </span>
          <p className="text-2xl font-bold text-charcoal mt-1">{transfers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">
            Pending Approval
          </span>
          <p className="text-2xl font-bold text-charcoal mt-1">
            {transfers.filter((t) => t.status === 'REQUESTED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-medium text-purple-600 uppercase tracking-wider">
            Currently In Transit
          </span>
          <p className="text-2xl font-bold text-charcoal mt-1">
            {transfers.filter((t) => t.status === 'IN_TRANSIT').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-medium text-forest uppercase tracking-wider">
            Completed Receipts
          </span>
          <p className="text-2xl font-bold text-charcoal mt-1">
            {transfers.filter((t) => t.status === 'RECEIVED').length}
          </p>
        </div>
      </div>

      {/* Workflow Explainer */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
        <div className="flex items-center justify-between text-xs font-medium text-stone-600 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold">1</span>
            <span>Requested</span>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400" />
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold">2</span>
            <span>Approved</span>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400" />
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold">3</span>
            <span>Dispatched (Deducted)</span>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400" />
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-forest/20 text-forest flex items-center justify-center font-bold">4</span>
            <span>Received (Credited)</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'REQUESTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                statusFilter === tab
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-stone-600 hover:text-charcoal'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search transfer # or warehouse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-stone-400">Loading transfers...</div>
        ) : filteredTransfers.length === 0 ? (
          <div className="py-20 text-center text-stone-400">
            <ArrowLeftRight className="w-10 h-10 mx-auto mb-2 text-stone-300" />
            <p className="font-medium text-stone-600">No stock transfers found</p>
            <p className="text-xs text-stone-400 mt-1">Create a new transfer request to begin reallocation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-medium text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Transfer ID</th>
                  <th className="px-5 py-3">Origin & Destination</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Requested By</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredTransfers.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-stone-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedTransfer(t)}
                  >
                    <td className="px-5 py-4 font-mono font-medium text-charcoal">
                      {t.transfer_number}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-800">{t.source_warehouse_name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-medium text-stone-800">{t.destination_warehouse_name}</span>
                      </div>
                      {t.notes && <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{t.notes}</p>}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(t.status)}</td>
                    <td className="px-5 py-4 text-stone-600">
                      {t.items?.length || 0} product(s)
                    </td>
                    <td className="px-5 py-4 text-stone-600 text-xs">
                      {t.requester_name || 'System Staff'}
                    </td>
                    <td className="px-5 py-4 text-stone-500 text-xs">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      {canManage && t.status === 'REQUESTED' && (
                        <button
                          onClick={() => handleApprove(t.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                        >
                          Approve
                        </button>
                      )}
                      {canManage && t.status === 'APPROVED' && (
                        <button
                          onClick={() => handleDispatch(t.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                        >
                          Dispatch
                        </button>
                      )}
                      {canManage && t.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleReceive(t.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-forest/10 text-forest hover:bg-forest/20 border border-forest/30"
                        >
                          Receive Dock
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedTransfer(t)}
                        className="px-2 py-1 text-xs text-stone-600 hover:text-charcoal"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Transfer Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-forest" />
                <h3 className="font-semibold text-charcoal">Create Stock Transfer Request</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-5 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Origin Warehouse (Deduct From) *
                  </label>
                  <select
                    value={sourceWarehouseId}
                    onChange={(e) => setSourceWarehouseId(e.target.value)}
                    required
                    className="w-full text-sm border border-stone-300 rounded-lg p-2 focus:ring-1 focus:ring-forest"
                  >
                    <option value="">Select origin facility...</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Destination Warehouse (Credit To) *
                  </label>
                  <select
                    value={destWarehouseId}
                    onChange={(e) => setDestWarehouseId(e.target.value)}
                    required
                    className="w-full text-sm border border-stone-300 rounded-lg p-2 focus:ring-1 focus:ring-forest"
                  >
                    <option value="">Select destination facility...</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id} disabled={wh.id === sourceWarehouseId}>
                        {wh.name} ({wh.code}) {wh.id === sourceWarehouseId ? '(Source)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Transfer Justification / Notes
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="e.g. Balancing regional inventory for Q4 surge"
                  className="w-full text-sm border border-stone-300 rounded-lg p-2 focus:ring-1 focus:ring-forest"
                />
              </div>

              {/* Items Section */}
              <div className="border-t border-stone-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-stone-700">
                    Products to Relocate *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-forest hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Item
                  </button>
                </div>

                <div className="space-y-3">
                  {transferItems.map((item, index) => {
                    const available = getAvailableAtSource(item.product_id, sourceWarehouseId);
                    return (
                      <div key={index} className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                        <div className="flex-1">
                          <select
                            value={item.product_id}
                            onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                            required
                            className="w-full text-sm border border-stone-300 rounded-md p-1.5 bg-white"
                          >
                            <option value="">Select product...</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                          {sourceWarehouseId && item.product_id && (
                            <span className="text-[11px] text-stone-500 mt-1 block">
                              Available at source: <strong className="text-charcoal">{available ?? 0}</strong> units
                            </span>
                          )}
                        </div>

                        <div className="w-28">
                          <input
                            type="number"
                            min="1"
                            max={available ?? 9999}
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full text-sm border border-stone-300 rounded-md p-1.5 bg-white"
                          />
                        </div>

                        {transferItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            className="text-stone-400 hover:text-red-500 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-forest text-white rounded-lg text-sm font-medium hover:bg-forest/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Submit Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Detail Drawer */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <div>
                <span className="text-xs font-mono text-stone-500">TRANSFER ORDER</span>
                <h2 className="text-xl font-bold text-charcoal">{selectedTransfer.transfer_number}</h2>
              </div>
              <button
                onClick={() => setSelectedTransfer(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-500">Current Status:</span>
                <div>{getStatusBadge(selectedTransfer.status)}</div>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">Origin Facility:</span>
                  <span className="font-semibold text-charcoal">{selectedTransfer.source_warehouse_name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">Destination Facility:</span>
                  <span className="font-semibold text-charcoal">{selectedTransfer.destination_warehouse_name}</span>
                </div>
                {selectedTransfer.notes && (
                  <div className="text-xs text-stone-600 pt-2 border-t border-stone-200">
                    <span className="font-medium text-stone-700">Notes:</span> {selectedTransfer.notes}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                  Transfer Manifest Items
                </h4>
                <div className="border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-200">
                  {selectedTransfer.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between bg-white">
                      <div>
                        <p className="text-sm font-medium text-charcoal">{item.product_name}</p>
                        <p className="text-xs font-mono text-stone-400">{item.product_sku}</p>
                      </div>
                      <span className="text-sm font-bold text-forest">{item.quantity} units</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons in Drawer */}
              {canManage && (
                <div className="pt-4 border-t border-stone-200 space-y-2">
                  {selectedTransfer.status === 'REQUESTED' && (
                    <button
                      onClick={() => handleApprove(selectedTransfer.id)}
                      disabled={actionLoading}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Approve Transfer Request
                    </button>
                  )}
                  {selectedTransfer.status === 'APPROVED' && (
                    <button
                      onClick={() => handleDispatch(selectedTransfer.id)}
                      disabled={actionLoading}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Dispatch & Deduct Source Inventory
                    </button>
                  )}
                  {selectedTransfer.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleReceive(selectedTransfer.id)}
                      disabled={actionLoading}
                      className="w-full py-2 bg-forest hover:bg-forest/90 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Acknowledge Dock Receipt & Credit Destination
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
