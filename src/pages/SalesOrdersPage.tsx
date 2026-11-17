import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle,
  X,
  AlertCircle,
  PackageCheck,
  Send,
  Ban,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { SalesOrder, Warehouse, Product } from '../types';
import { useAuth } from '../context/AuthContext';

export const SalesOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<{ product_id: string; quantity: number; unit_price: number }[]>([
    { product_id: '', quantity: 1, unit_price: 0 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const { canFulfillOrders } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [sos, whs, prods] = await Promise.all([
        api.getSalesOrders(statusFilter),
        api.getWarehouses(),
        api.getProducts(),
      ]);
      setOrders(sos || []);
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
    setItems([...items, { product_id: products[0]?.id || '', quantity: 1, unit_price: products[0]?.selling_price || 0 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleProductSelect = (idx: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    const updated = [...items];
    updated[idx] = {
      product_id: prodId,
      quantity: updated[idx].quantity,
      unit_price: prod?.selling_price || 0,
    };
    setItems(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!customerName || !warehouseId || items.some((it) => !it.product_id || it.quantity <= 0)) {
      setFormError('Please complete customer name, warehouse, and valid line items');
      return;
    }

    try {
      await api.createSalesOrder({
        customer_name: customerName,
        customer_email: customerEmail,
        shipping_address: shippingAddress,
        warehouse_id: warehouseId,
        notes,
        items,
      });
      setIsCreateOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create sales order');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await api.confirmSO(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFulfill = async (id: string) => {
    if (!confirm('Are you ready to pick, pack, and fulfill this order? On-hand stock will be deducted.')) {
      return;
    }
    try {
      await api.fulfillSO(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this sales order? Any reserved inventory will be released back to available.')) {
      return;
    }
    try {
      await api.cancelSO(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923] tracking-tight">Sales Orders (Order-to-Cash)</h1>
          <p className="text-xs text-[#7A827C] mt-0.5">
            Order workflow: Draft → Confirmed (Atomic Reservation) → Fulfilled (Stock Deducted)
          </p>
        </div>

        <button
          onClick={() => {
            setCustomerName('');
            setCustomerEmail('');
            setShippingAddress('');
            setWarehouseId(warehouses[0]?.id || '');
            setNotes('');
            setItems([{ product_id: products[0]?.id || '', quantity: 2, unit_price: products[0]?.selling_price || 0 }]);
            setFormError(null);
            setIsCreateOpen(true);
          }}
          className="px-3.5 py-2 rounded-lg bg-[#527A62] hover:bg-[#436450] text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Order</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-[#E6E8E2] rounded-xl p-3 shadow-sm flex flex-wrap items-center gap-1.5 text-xs">
        {['', 'DRAFT', 'CONFIRMED', 'FULFILLED', 'CANCELLED'].map((st) => (
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

      {/* Orders Table */}
      <div className="bg-white border border-[#E6E8E2] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6E8E2] bg-[#FAFBF9] text-[#7A827C] font-semibold">
                <th className="py-3 px-4">SO Number & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Fulfillment Hub</th>
                <th className="py-3 px-4 text-right">Items</th>
                <th className="py-3 px-4 text-right">Total Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8E2]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A827C]">
                    Loading sales orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A827C]">
                    No sales orders found matching criteria.
                  </td>
                </tr>
              ) : (
                orders.map((so) => {
                  const totalQty = so.items?.reduce((sum, it) => sum + it.quantity, 0) || 0;
                  return (
                    <tr key={so.id} className="hover:bg-[#FAFBF9] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[#202923]">{so.so_number}</div>
                        <div className="text-[11px] text-[#7A827C]">
                          {new Date(so.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#202923]">{so.customer_name}</div>
                        {so.customer_email && (
                          <div className="text-[11px] text-[#7A827C]">{so.customer_email}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#7A827C]">
                        {so.warehouse_name}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[#202923]">
                        {totalQty} units
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-[#202923]">
                        ${so.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            so.status === 'FULFILLED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : so.status === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : so.status === 'DRAFT'
                              ? 'bg-stone-100 text-stone-600 border-stone-200'
                              : 'bg-red-50 text-red-600 border-red-200'
                          }`}
                        >
                          {so.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {so.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => handleConfirm(so.id)}
                                className="px-2.5 py-1 rounded bg-[#527A62] hover:bg-[#436450] text-[11px] font-semibold text-white flex items-center gap-1 shadow-sm"
                                title="Verify stock and reserve inventory"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Confirm & Reserve</span>
                              </button>
                              <button
                                onClick={() => handleCancel(so.id)}
                                className="p-1 text-[#7A827C] hover:text-[#B91C1C]"
                                title="Cancel order"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {so.status === 'CONFIRMED' && canFulfillOrders && (
                            <>
                              <button
                                onClick={() => handleFulfill(so.id)}
                                className="px-2.5 py-1 rounded bg-[#DCE8DD] hover:bg-[#cbe0cc] text-[11px] font-bold text-[#17241F] flex items-center gap-1"
                                title="Pick, pack and deduct inventory"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>Fulfill & Deduct</span>
                              </button>
                              <button
                                onClick={() => handleCancel(so.id)}
                                className="p-1 text-[#7A827C] hover:text-[#B91C1C]"
                                title="Cancel order and release reserved stock"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            </>
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

      {/* CREATE SALES ORDER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-[#E6E8E2] shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8E2] mb-4">
              <h2 className="text-base font-bold text-[#202923]">Draft New Customer Sales Order</h2>
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
                  <label className="block font-medium text-[#202923] mb-1">Customer / Account Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Robotics Corp"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#202923] mb-1">Customer Email</label>
                  <input
                    type="email"
                    placeholder="purchasing@customer.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202923] mb-1">Fulfillment Warehouse *</label>
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

                <div>
                  <label className="block font-medium text-[#202923] mb-1">Destination Shipping Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 100 Industrial Pkwy, Austin, TX"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
              </div>

              {/* Order Items */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-[#202923] uppercase tracking-wider text-[11px]">
                    Sales Order Line Items
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
                        <option value="">Select Product...</option>
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
                          value={it.quantity}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].quantity = parseInt(e.target.value, 10) || 1;
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
                          placeholder="Unit Price"
                          value={it.unit_price}
                          onChange={(e) => {
                            const updated = [...items];
                            updated[idx].unit_price = parseFloat(e.target.value) || 0;
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
                    Order Total: $
                    {items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Order Notes</label>
                <textarea
                  rows={2}
                  placeholder="Carrier instructions, bill of lading requirements..."
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
    </div>
  );
};
