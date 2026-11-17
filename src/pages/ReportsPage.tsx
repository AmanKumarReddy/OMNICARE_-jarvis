import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Warehouse as WarehouseIcon,
  Layers,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../services/api';
import { Warehouse, Product, InventoryItem, StockMovement } from '../types';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'valuation' | 'movements' | 'reorder' | 'capacity'>('valuation');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [whData, invData, movData] = await Promise.all([
          api.getWarehouses(),
          api.getInventory(),
          api.getMovements(),
        ]);
        setWarehouses(whData || []);
        setInventory(invData || []);
        setMovements(movData || []);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter inventory by warehouse
  const filteredInventory = inventory.filter((item) =>
    selectedWarehouseId === 'ALL' ? true : item.warehouse_id === selectedWarehouseId
  );

  // Valuation computations
  const totalValuation = filteredInventory.reduce((acc, it) => acc + (it.valuation || it.quantity_on_hand * it.cost_price), 0);
  const totalUnits = filteredInventory.reduce((acc, it) => acc + it.quantity_on_hand, 0);
  const lowStockItems = filteredInventory.filter((it) => it.quantity_on_hand <= it.min_threshold);

  // Category breakdown for Valuation chart
  const categoryMap: Record<string, number> = {};
  filteredInventory.forEach((it) => {
    const cat = it.category_name || 'General';
    categoryMap[cat] = (categoryMap[cat] || 0) + (it.valuation || it.quantity_on_hand * it.cost_price);
  });
  const categoryChartData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  // Warehouse breakdown data
  const warehouseValuationData = warehouses.map((wh) => {
    const whItems = inventory.filter((i) => i.warehouse_id === wh.id);
    const value = whItems.reduce((acc, it) => acc + (it.valuation || it.quantity_on_hand * it.cost_price), 0);
    const units = whItems.reduce((acc, it) => acc + it.quantity_on_hand, 0);
    return {
      name: wh.code,
      fullName: wh.name,
      valuation: Math.round(value),
      units,
      capacity: wh.capacity || 50000,
      utilizationPct: Math.min(100, Math.round((units / (wh.capacity || 50000)) * 100)),
    };
  });

  const COLORS = ['#527A62', '#202923', '#8FA89B', '#DCE8DD', '#B45309', '#6B7280'];

  const handleDownloadCSV = () => {
    if (activeTab === 'valuation') {
      api.downloadValuationCSV(selectedWarehouseId === 'ALL' ? undefined : selectedWarehouseId);
    } else {
      // Client-side CSV generation for filtered view
      const headers = ['SKU', 'Product Name', 'Warehouse', 'On Hand', 'Reserved', 'Available', 'Cost Price', 'Valuation'];
      const rows = filteredInventory.map((i) => [
        i.product_sku,
        `"${i.product_name.replace(/"/g, '""')}"`,
        `"${(i.warehouse_name || '').replace(/"/g, '""')}"`,
        i.quantity_on_hand,
        i.quantity_reserved,
        i.quantity_available,
        i.cost_price.toFixed(2),
        (i.valuation || i.quantity_on_hand * i.cost_price).toFixed(2),
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `omnistock_report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            Reports & Intelligence
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Enterprise analytics, valuation audits, stock velocity, and replenishment forecasting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="text-sm bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-700 focus:outline-none focus:ring-1 focus:ring-forest"
          >
            <option value="ALL">All Warehouses & Distribution Centers</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>

          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-charcoal text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 text-stone-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <div className="flex space-x-8">
          {[
            { id: 'valuation', label: 'Inventory Valuation', icon: DollarSign },
            { id: 'movements', label: 'Stock Movement Ledger', icon: TrendingUp },
            { id: 'reorder', label: 'Low-Stock & Reorder Audit', icon: AlertTriangle },
            { id: 'capacity', label: 'Warehouse Capacity Utilization', icon: WarehouseIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-forest text-forest'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-stone-400">Loading analytics...</div>
      ) : (
        <>
          {/* TAB 1: INVENTORY VALUATION */}
          {activeTab === 'valuation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Total Asset Valuation
                  </span>
                  <p className="text-3xl font-bold text-charcoal mt-1">
                    ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">Based on FIFO weighted acquisition cost</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Total Units Managed
                  </span>
                  <p className="text-3xl font-bold text-charcoal mt-1">
                    {totalUnits.toLocaleString()} units
                  </p>
                  <p className="text-xs text-stone-400 mt-1">Across {filteredInventory.length} unique catalog balances</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                    Average Unit Valuation
                  </span>
                  <p className="text-3xl font-bold text-charcoal mt-1">
                    ${totalUnits > 0 ? (totalValuation / totalUnits).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">Blended portfolio cost basis</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-charcoal mb-4">
                    Valuation by Warehouse Location
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={warehouseValuationData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                        <Tooltip
                          formatter={(val: any) => [`$${Number(val).toLocaleString()}`, 'Valuation']}
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E6E8E2', borderRadius: '8px' }}
                        />
                        <Bar dataKey="valuation" fill="#527A62" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                  <h3 className="text-sm font-semibold text-charcoal mb-4">
                    Valuation by Product Category
                  </h3>
                  <div className="h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {categoryChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => `$${Number(val).toLocaleString()}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Valuation Table */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-200 bg-stone-50">
                  <h3 className="text-sm font-semibold text-charcoal">Catalog Valuation Detail</h3>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs font-medium text-stone-500 uppercase tracking-wider sticky top-0 border-b border-stone-200">
                      <tr>
                        <th className="px-5 py-3">SKU</th>
                        <th className="px-5 py-3">Product Name</th>
                        <th className="px-5 py-3">Warehouse</th>
                        <th className="px-5 py-3 text-right">On Hand</th>
                        <th className="px-5 py-3 text-right">Cost Price</th>
                        <th className="px-5 py-3 text-right">Selling Price</th>
                        <th className="px-5 py-3 text-right">Total Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {filteredInventory.map((item) => (
                        <tr key={item.id} className="hover:bg-stone-50">
                          <td className="px-5 py-3 font-mono text-xs font-medium text-stone-700">
                            {item.product_sku}
                          </td>
                          <td className="px-5 py-3 font-medium text-charcoal">
                            {item.product_name}
                          </td>
                          <td className="px-5 py-3 text-stone-600 text-xs">
                            {item.warehouse_name}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-charcoal">
                            {item.quantity_on_hand}
                          </td>
                          <td className="px-5 py-3 text-right text-stone-600">
                            ${item.cost_price.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-right text-stone-600">
                            ${item.selling_price.toFixed(2)}
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-forest">
                            ${(item.valuation || item.quantity_on_hand * item.cost_price).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STOCK MOVEMENT LEDGER */}
          {activeTab === 'movements' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-charcoal">Traceable Stock Movement Audit</h3>
                    <p className="text-xs text-stone-500 mt-0.5">Immutable historical ledger of all stock transactions.</p>
                  </div>
                  <span className="text-xs bg-stone-200 text-stone-700 px-2.5 py-1 rounded-full font-mono">
                    {movements.length} logged entries
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs font-medium text-stone-500 uppercase tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="px-5 py-3">Timestamp</th>
                        <th className="px-5 py-3">Movement Type</th>
                        <th className="px-5 py-3">Reference</th>
                        <th className="px-5 py-3">Product</th>
                        <th className="px-5 py-3">Facility</th>
                        <th className="px-5 py-3 text-right">Quantity Delta</th>
                        <th className="px-5 py-3 text-right">Balance After</th>
                        <th className="px-5 py-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {movements.map((mov) => {
                        const isPositive = mov.quantity_delta > 0;
                        return (
                          <tr key={mov.id} className="hover:bg-stone-50">
                            <td className="px-5 py-3 text-xs text-stone-500 font-mono">
                              {new Date(mov.created_at).toLocaleString()}
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-stone-100 text-stone-800">
                                {mov.movement_type}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-xs font-mono text-stone-600">
                              {mov.reference_number || '—'}
                            </td>
                            <td className="px-5 py-3">
                              <div className="font-medium text-charcoal">{mov.product_name}</div>
                              <div className="text-xs font-mono text-stone-400">{mov.product_sku}</div>
                            </td>
                            <td className="px-5 py-3 text-xs text-stone-600">
                              {mov.warehouse_name}
                            </td>
                            <td className={`px-5 py-3 text-right font-bold ${isPositive ? 'text-forest' : 'text-red-700'}`}>
                              {isPositive ? `+${mov.quantity_delta}` : mov.quantity_delta}
                            </td>
                            <td className="px-5 py-3 text-right font-medium text-charcoal">
                              {mov.balance_after}
                            </td>
                            <td className="px-5 py-3 text-xs text-stone-500 max-w-xs truncate">
                              {mov.notes || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOW-STOCK & REORDER AUDIT */}
          {activeTab === 'reorder' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Replenishment Alert Triggered</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {lowStockItems.length} products have fallen below configured safety thresholds. Immediate purchase orders recommended.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-xs font-medium text-stone-500 uppercase tracking-wider border-b border-stone-200">
                      <tr>
                        <th className="px-5 py-3">SKU</th>
                        <th className="px-5 py-3">Product Name</th>
                        <th className="px-5 py-3">Warehouse</th>
                        <th className="px-5 py-3 text-right">Current On Hand</th>
                        <th className="px-5 py-3 text-right">Min Threshold</th>
                        <th className="px-5 py-3 text-right">Deficit</th>
                        <th className="px-5 py-3 text-right">Suggested Reorder</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {lowStockItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-5 py-12 text-center text-stone-400">
                            All products currently meet or exceed safety threshold levels.
                          </td>
                        </tr>
                      ) : (
                        lowStockItems.map((item) => {
                          const deficit = Math.max(0, item.min_threshold - item.quantity_on_hand);
                          const suggested = deficit + item.min_threshold;
                          return (
                            <tr key={item.id} className="hover:bg-stone-50">
                              <td className="px-5 py-3 font-mono text-xs font-medium text-stone-700">
                                {item.product_sku}
                              </td>
                              <td className="px-5 py-3 font-medium text-charcoal">
                                {item.product_name}
                              </td>
                              <td className="px-5 py-3 text-stone-600 text-xs">
                                {item.warehouse_name}
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-red-600">
                                {item.quantity_on_hand}
                              </td>
                              <td className="px-5 py-3 text-right text-stone-600">
                                {item.min_threshold}
                              </td>
                              <td className="px-5 py-3 text-right font-semibold text-amber-700">
                                -{deficit}
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-forest">
                                +{suggested} units
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WAREHOUSE CAPACITY UTILIZATION */}
          {activeTab === 'capacity' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {warehouseValuationData.map((wh) => (
                  <div key={wh.name} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-charcoal">{wh.fullName}</h4>
                        <span className="text-xs font-mono text-stone-400">{wh.name}</span>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-stone-100 text-stone-700">
                        {wh.utilizationPct}% Occupied
                      </span>
                    </div>

                    <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          wh.utilizationPct > 85
                            ? 'bg-red-600'
                            : wh.utilizationPct > 65
                            ? 'bg-amber-600'
                            : 'bg-forest'
                        }`}
                        style={{ width: `${wh.utilizationPct}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-100">
                      <div>
                        <span className="text-stone-500">Occupied Units:</span>
                        <p className="font-bold text-charcoal">{wh.units.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-stone-500">Total Capacity:</span>
                        <p className="font-bold text-charcoal">{wh.capacity.toLocaleString()}</p>
                      </div>
                      <div className="col-span-2 pt-1">
                        <span className="text-stone-500">Asset Valuation:</span>
                        <p className="font-bold text-forest text-sm">
                          ${wh.valuation.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
