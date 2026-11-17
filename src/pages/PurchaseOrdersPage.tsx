import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  CheckCircle,
  Clock,
  Truck,
  X,
  AlertCircle,
  Eye,
  Send,
  CheckSquare,
  PackageCheck,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { PurchaseOrder, Supplier, Warehouse, Product } from '../types';
import { useAuth } from '../context/AuthContext';

export const PurchaseOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Create PO Form
  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ product_id: string; quantity_ordered: number; unit_cost: number }[]>([
    { product_id: '', quantity_ordered: 10, unit_cost: 0 },
  ]);

  // Receive Form: map of product_id -> quantity to receive
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const { canApproveOrders, canAdjustStock } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [pos, sups, whs, prods] = await Promise.all([
        api.getPurchaseOrders(statusFilter),
        api.getSuppliers(),
        api.getWarehouses(),
        api.getProducts(),
      ]);
      setOrders(pos || []);
      setSuppliers(sups || []);
      setWarehouses(whs || []);
      setProducts(prods || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleAddItemRow = () => {
    setItems([...items, { product_id: products[0]?.id || '', quantity_ordered: 10, unit_cost: products[0]?.cost_price || 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleProductSelect = (idx: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    const updated = [...items];
    updated[idx] = {
      product_id: prodId,
      quantity_ordered: updated[idx].quantity_ordered,
      unit_cost: prod?.cost_price || 0,
    };
    setItems(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!supplierId || !warehouseId || items.some((it) => !it.product_id || it.quantity_ordered <= 0)) {
      setFormError('Please select a supplier, warehouse, and valid products with quantity > 0');
      return;
    }

    try {
      await api.createPurchaseOrder({
        supplier_id: supplierId,
        warehouse_id: warehouseId,
        expected_date: expectedDate,
        notes,
        items,
      });
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create PO');
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    try {
      await api.submitPO(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.approvePO(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openReceiveModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const initialQty: Record<string, number> = {};
    po.items?.forEach((it) => {
      const remaining = it.quantity_ordered - it.quantity_received;
      initialQty[it.product_id] = remaining > 0 ? remaining : 0;
    });
    setReceiveQuantities(initialQty);
    setFormError(null);
    setIsReceiveOpen(true);
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;
    setFormError(null);

    const receipts = Object.entries(receiveQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([prodId, qty]) => ({
        product_id: prodId,
        quantity_received: Number(qty),
      }));

    if (receipts.length === 0) {
      setFormError('Please enter at least one positive quantity to receive');
      return;
    }

    try {
      await api.receivePO(selectedPO.id, receipts);
      setIsReceiveOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Goods receipt failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923] tracking-tight">Purchase Orders (Procure-to-Pay)</h1>
          <p className="text-xs text-[#7A827C] mt-0.5">
            Procurement workflow: Draft → Submitted → Approved → Partially Received → Received
          </p>
        </div>

        <button
          onClick={() => {
            setSupplierId(suppliers[0]?.id || '');
            setWarehouseId(warehouses[0]?.id || '');
            setExpectedDate(new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10));
            setNotes('');
            setItems([{ product_id: products[0]?.id || '', quantity_ordered: 50, unit_cost: products[0]?.cost_price || 0 }]);
            setFormError(null);
            setIsCreateOpen(true);
          }}
          className="px-3.5 py-2 rounded-lg bg-[#527A62] hover:bg-[#436450] text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-[#E6E8E2] rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-1.5 text-xs">
        {['', 'DRAFT', 'SUBMITTED', 'APPROVED', 'PARTIALLY_RECEIVED', 'RECEIVED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === st
                ? 'bg-[#17241F] text-white font-semibold'
                : 'text-[#7A827C] hover:bg-[#F7F7F4] hover:text-[#202923]'
            }`}
          >
            {st ? st.replace('_', ' ') : 'All Orders'}
          </button>
        ))}
      </div>

      {/* PO List */}
      <div className="bg-white border border-[#E6E8E2] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6E8E2] bg-[#FAFBF9] text-[#7A827C] font-semibold">
                <th className="py-3 px-4">PO Number & Date</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Receiving Hub</th>
                <th className="py-3 px-4 text-right">Items Ordered</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Workflow Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8E2]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A827C]">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A827C]">
                    No purchase orders found matching status.
                  </td>
                </tr>
              ) : (
                orders.map((po) => {
                  const totalOrdered = po.items?.reduce((sum, it) => sum + it.quantity_ordered, 0) || 0;
                  const totalReceived = po.items?.reduce((sum, it) => sum + it.quantity_received, 0) || 0;
                  return (
                    <tr key={po.id} className="hover:bg-[#FAFBF9] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[#202923]">{po.po_number}</div>
                        <div className="text-[11px] text-[#7A827C]">
                          {new Date(po.created_at).toLocaleDateString()} by {po.creator_name || 'Staff'}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-medium text-[#202923]">
                        {po.supplier_name}
                      </td>

                      <td className="py-3 px-4 text-[#7A827C]">
                        {po.warehouse_name}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[#202923]">
                        {totalReceived > 0 ? (
                          <span>
                            <strong className="text-emerald-700">{totalReceived}</strong> / {totalOrdered}
                          </span>
                        ) : (
                          <span>{totalOrdered}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-[#202923]">
                        ${po.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            po.status === 'RECEIVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : po.status === 'PARTIALLY_RECEIVED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : po.status === 'APPROVED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : po.status === 'SUBMITTED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-stone-100 text-stone-600 border-stone-200'
                          }`}
                        >
                          {po.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSubmitForApproval(po.id)}
                              className="px-2.5 py-1 rounded bg-[#FAFBF9] hover:bg-[#F0F2EB] border border-[#E6E8E2] text-[11px] font-medium text-[#202923] flex items-center gap-1"
                              title="Submit for Approval"
                            >
                              <Send className="w-3 h-3 text-[#527A62]" />
                              <span>Submit</span>
                            </button>
                          )}

                          {po.status === 'SUBMITTED' && canApproveOrders && (
                            <button
                              onClick={() => handleApprove(po.id)}
                              className="px-2.5 py-1 rounded bg-[#527A62] hover:bg-[#436450] text-[11px] font-semibold text-white flex items-center gap-1"
                              title="Authorize purchase order"
                            >
                              <CheckSquare className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                          )}

                          {(po.status === 'APPROVED' || po.status === 'PARTIALLY_RECEIVED') && canAdjustStock && (
                            <button
                              onClick={() => openReceiveModal(po)}
                              className="px-2.5 py-1 rounded bg-[#DCE8DD] hover:bg-[#cbe0cc] text-[11px] font-bold text-[#17241F] flex items-center gap-1"
                              title="Receive Goods at Warehouse"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Dock Receipt</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PO MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-[#E6E8E2] shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8E2] mb-4">
              <h2 className="text-base font-bold text-[#202923]">Draft New Purchase Order</h2>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded text-[#7A827C] hover:bg-[#F7F7F4]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B91C1C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202923] mb-1">Select Supplier *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#202923] mb-1">Destination Warehouse *</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Expected Delivery Date</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full sm:w-60 px-3 py-2 font-mono bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              {/* Line Items Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-[#202923] uppercase tracking-wider text-[11px]">
                    Purchase Order Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[11px] text-[#527A62] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 border border-[#E6E8E2] rounded-lg p-3 bg-[#FAFBF9]">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={it.product_id}
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-[#E6E8E2] rounded-md text-[#202923] focus:outline-none"
                      >
                        <option value="">Select SKU...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} — {p.name}
                          </option>
                        ))}
                      </select>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={it.quantity_ordered}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].quantity_ordered = parseInt(e.target.value, 10) || 1;
                            setItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 font-mono text-right bg-white border border-[#E6E8E2] rounded-md text-[#202923] focus:outline-none"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Unit Cost"
                          value={it.unit_cost}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].unit_cost = parseFloat(e.target.value) || 0;
                            setItems(updated);
                          }}
                          className="w-full px-2.5 py-1.5 font-mono text-right bg-white border border-[#E6E8E2] rounded-md text-[#202923] focus:outline-none"
                        />
                      </div>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 text-[#7A827C] hover:text-[#B91C1C]"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="pt-2 border-t border-[#E6E8E2] text-right font-mono font-bold text-xs text-[#202923]">
                    Estimated Subtotal: $
                    {items.reduce((sum, it) => sum + (it.quantity_ordered * it.unit_cost), 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Internal Notes & Special Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Incoterms, dock receiving hours, packing slip requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div className="pt-3 border-t border-[#E6E8E2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E8E2] text-[#7A827C] hover:bg-[#F7F7F4] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#527A62] hover:bg-[#436450] text-white font-semibold shadow-sm"
                >
                  Create Draft Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCK GOODS RECEIPT MODAL (PARTIAL / FULL) */}
      {isReceiveOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-[#E6E8E2] shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8E2] mb-4">
              <div>
                <h2 className="text-base font-bold text-[#202923]">Inbound Dock Goods Receipt</h2>
                <div className="text-xs font-mono text-[#7A827C]">
                  PO: {selectedPO.po_number} • Receiving at {selectedPO.warehouse_name}
                </div>
              </div>
              <button onClick={() => setIsReceiveOpen(false)} className="p-1 rounded text-[#7A827C] hover:bg-[#F7F7F4]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B91C1C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleReceiveSubmit} className="space-y-4 text-xs">
              <div className="border border-[#E6E8E2] rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#FAFBF9] text-[#7A827C] border-b border-[#E6E8E2]">
                    <tr>
                      <th className="py-2.5 px-3">Item Master</th>
                      <th className="py-2.5 px-3 text-right">Ordered</th>
                      <th className="py-2.5 px-3 text-right">Already Received</th>
                      <th className="py-2.5 px-3 text-right">Now Receiving</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E8E2]">
                    {selectedPO.items?.map((it) => {
                      const remaining = it.quantity_ordered - it.quantity_received;
                      return (
                        <tr key={it.product_id} className="hover:bg-[#FAFBF9]">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-[#202923]">{it.product_name}</div>
                            <div className="text-[11px] font-mono text-[#7A827C]">{it.product_sku}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[#7A827C]">{it.quantity_ordered}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-emerald-700">{it.quantity_received}</td>
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max={remaining}
                              value={receiveQuantities[it.product_id] || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                setReceiveQuantities({
                                  ...receiveQuantities,
                                  [it.product_id]: val,
                                });
                              }}
                              className="w-20 px-2 py-1 text-right font-mono bg-white border border-[#CCD1CB] rounded text-[#202923] focus:outline-none focus:border-[#527A62]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-amber-900 leading-relaxed text-[11px]">
                Confirming receipt will automatically execute an atomic transaction to increment on-hand stock for the warehouse and append an immutable movement record to the audit ledger.
              </div>

              <div className="pt-3 border-t border-[#E6E8E2] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiveOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6E8E2] text-[#7A827C] hover:bg-[#F7F7F4] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#527A62] hover:bg-[#436450] text-white font-semibold shadow-sm"
                >
                  Confirm Dock Receipt & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
