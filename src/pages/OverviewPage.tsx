import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Package,
  Layers,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  TrendingUp,
  Warehouse as WarehouseIcon,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../services/api';
import { DashboardSummary } from '../types';

export const OverviewPage: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#E6E8E2] rounded"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-[#E6E8E2] rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const d = data || {
    total_products: 8,
    total_stock_units: 1964,
    total_valuation: 82450.00,
    low_stock_count: 1,
    pending_pos_count: 2,
    pending_sos_count: 1,
    warehouse_distribution: [],
    monthly_trends: [],
    top_selling_products: [],
    recent_movements: [],
    recent_audit_logs: [],
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923] tracking-tight">Operations Overview</h1>
          <p className="text-xs text-[#7A827C] mt-0.5">
            Real-time multi-facility inventory tracking, valuation, and workflow telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/purchase-orders"
            className="px-3 py-1.5 rounded-lg border border-[#E6E8E2] bg-white hover:bg-[#F7F7F4] text-xs font-medium text-[#202923] flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#527A62]" />
            <span>New PO</span>
          </NavLink>
          <NavLink
            to="/sales-orders"
            className="px-3 py-1.5 rounded-lg bg-[#527A62] hover:bg-[#436450] text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sales Order</span>
          </NavLink>
        </div>
      </div>

      {/* 4 Core Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="bg-white border border-[#E6E8E2] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#7A827C] text-xs font-medium mb-2">
            <span>Total Catalog Products</span>
            <div className="w-7 h-7 rounded-lg bg-[#FAFBF9] border border-[#E6E8E2] flex items-center justify-center text-[#527A62]">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#202923] tracking-tight">
            {d.total_products}
          </div>
          <div className="text-[11px] text-[#7A827C] mt-1 flex items-center gap-1">
            <span className="text-emerald-700 font-medium font-mono">4 active categories</span>
          </div>
        </div>

        {/* Total Units On Hand */}
        <div className="bg-white border border-[#E6E8E2] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#7A827C] text-xs font-medium mb-2">
            <span>Units On Hand</span>
            <div className="w-7 h-7 rounded-lg bg-[#FAFBF9] border border-[#E6E8E2] flex items-center justify-center text-[#527A62]">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#202923] tracking-tight">
            {d.total_stock_units.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#7A827C] mt-1 flex items-center gap-1">
            <span>Across 3 operational hubs</span>
          </div>
        </div>

        {/* Inventory Valuation */}
        <div className="bg-white border border-[#E6E8E2] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-[#7A827C] text-xs font-medium mb-2">
            <span>Inventory Valuation</span>
            <div className="w-7 h-7 rounded-lg bg-[#FAFBF9] border border-[#E6E8E2] flex items-center justify-center text-[#527A62]">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#202923] tracking-tight">
            ${d.total_valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#7A827C] mt-1 flex items-center gap-1">
            <span className="text-emerald-700 font-medium font-mono">+8.4%</span>
            <span>vs previous quarter</span>
          </div>
        </div>

        {/* Low-Stock Alerts */}
        <div className={`border rounded-xl p-4 shadow-sm ${
          d.low_stock_count > 0 ? 'bg-[#FFFBFB] border-red-200' : 'bg-white border-[#E6E8E2]'
        }`}>
          <div className="flex items-center justify-between text-[#7A827C] text-xs font-medium mb-2">
            <span>Low-Stock Warnings</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              d.low_stock_count > 0 ? 'bg-red-50 text-[#B91C1C]' : 'bg-[#FAFBF9] text-[#7A827C]'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${d.low_stock_count > 0 ? 'text-[#B91C1C]' : 'text-[#202923]'}`}>
            {d.low_stock_count}
          </div>
          <div className="text-[11px] text-[#7A827C] mt-1 flex items-center gap-1">
            <NavLink to="/inventory?low_stock=true" className="text-[#B91C1C] hover:underline font-medium">
              View flagged SKUs →
            </NavLink>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Procurement vs Sales 5-Month Trajectory */}
        <div className="lg:col-span-7 bg-white border border-[#E6E8E2] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#202923]">Purchasing vs Sales Revenue Trajectory</h2>
              <p className="text-[11px] text-[#7A827C]">Monthly order-to-cash vs procurement volume ($)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-[11px] text-[#7A827C]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#527A62]"></span>
                <span>Sales</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#7A827C]">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#CCD1CB]"></span>
                <span>Purchases</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F2EB" vertical={false} />
                <XAxis dataKey="month" stroke="#7A827C" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#7A827C"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E6E8E2', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#527A62" strokeWidth={2.5} dot={{ r: 3, fill: '#527A62' }} />
                <Line type="monotone" dataKey="purchases" stroke="#A9B0A8" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#A9B0A8' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 cols: Warehouse Stock Distribution */}
        <div className="lg:col-span-5 bg-white border border-[#E6E8E2] rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#202923]">Facility Inventory Breakdown</h2>
                <p className="text-[11px] text-[#7A827C]">Units distributed across active hubs</p>
              </div>
              <NavLink to="/warehouses" className="text-[11px] text-[#527A62] hover:underline flex items-center gap-1">
                <span>Hubs</span>
                <ArrowRight className="w-3 h-3" />
              </NavLink>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.warehouse_distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2EB" vertical={false} />
                  <XAxis dataKey="warehouse_name" stroke="#7A827C" fontSize={10} tickLine={false} tickFormatter={(name) => name.split(' ')[0]} />
                  <YAxis stroke="#7A827C" fontSize={10} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} units`, 'Units']}
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E6E8E2', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="total_units" fill="#527A62" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E6E8E2] space-y-1.5 text-xs">
            {d.warehouse_distribution.map((wh) => (
              <div key={wh.warehouse_id} className="flex items-center justify-between text-[#7A827C]">
                <span className="truncate">{wh.warehouse_name}</span>
                <span className="font-mono text-[#202923] font-medium">${wh.total_value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Lower Section: Top Products & Recent Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Selling Products (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-[#E6E8E2] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#202923]">Top Performing SKUs</h2>
              <p className="text-[11px] text-[#7A827C]">Highest volume items by total sales value</p>
            </div>
            <NavLink to="/products" className="text-[11px] text-[#527A62] hover:underline flex items-center gap-1">
              <span>Master Catalog</span>
              <ArrowRight className="w-3 h-3" />
            </NavLink>
          </div>

          <div className="divide-y divide-[#E6E8E2]">
            {d.top_selling_products.map((prod) => (
              <div key={prod.product_id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-medium text-[#202923]">{prod.product_name}</div>
                  <div className="text-[11px] text-[#7A827C] font-mono">
                    SKU: {prod.product_sku} • {prod.units_sold} units sold
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-[#202923]">
                    ${prod.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Stock Movement Ledger (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-[#E6E8E2] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#202923]">Recent Stock Movements</h2>
              <p className="text-[11px] text-[#7A827C]">Live ledger of transactions & receipts</p>
            </div>
            <NavLink to="/inventory" className="text-[11px] text-[#527A62] hover:underline flex items-center gap-1">
              <span>All Ledger Records</span>
              <ArrowRight className="w-3 h-3" />
            </NavLink>
          </div>

          <div className="divide-y divide-[#E6E8E2]">
            {d.recent_movements.slice(0, 5).map((mov) => {
              const isPositive = mov.quantity_delta > 0;
              return (
                <div key={mov.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                      isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-700'
                    }`}>
                      {isPositive ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="font-medium text-[#202923] truncate max-w-[200px] sm:max-w-xs">
                        {mov.product_name}
                      </div>
                      <div className="text-[11px] text-[#7A827C]">
                        {mov.movement_type.replace('_', ' ')} • {mov.warehouse_name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-mono font-semibold ${isPositive ? 'text-emerald-700' : 'text-stone-800'}`}>
                      {isPositive ? `+${mov.quantity_delta}` : mov.quantity_delta}
                    </div>
                    <div className="text-[10px] text-[#7A827C] font-mono">
                      Bal: {mov.balance_after}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
