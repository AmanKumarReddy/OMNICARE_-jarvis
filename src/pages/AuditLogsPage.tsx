import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Eye,
  X,
  FileCode,
  User,
  Globe,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';
import { AuditLog } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await api.getAuditLogs();
        setLogs(data || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesEntity = entityFilter === 'ALL' || log.entity_type === entityFilter;
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.user_email.toLowerCase().includes(q) ||
      log.entity_id.toLowerCase().includes(q) ||
      (log.ip_address && log.ip_address.includes(q)) ||
      log.action.toLowerCase().includes(q);
    return matchesEntity && matchesAction && matchesSearch;
  });

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('RECEIVE')) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          {action}
        </span>
      );
    }
    if (act.includes('APPROVE') || act.includes('CONFIRM')) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          {action}
        </span>
      );
    }
    if (act.includes('DISPATCH') || act.includes('FULFILL')) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
          {action}
        </span>
      );
    }
    if (act.includes('CANCEL') || act.includes('DELETE')) {
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
          {action}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
        {action}
      </span>
    );
  };

  const formatJSON = (raw?: string) => {
    if (!raw) return 'null';
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal">
            Audit Trail & System Compliance
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Immutable, append-only record of all stock adjustments, order state changes, and administrative actions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium bg-stone-100 text-stone-700 px-3 py-2 rounded-lg border border-stone-200">
          <ShieldCheck className="w-4 h-4 text-forest" />
          <span>SOC2 & ISO 27001 Audit Ready</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-700 focus:outline-none focus:ring-1 focus:ring-forest"
          >
            <option value="ALL">All Entity Types</option>
            <option value="INVENTORY">Inventory</option>
            <option value="PURCHASE_ORDER">Purchase Orders</option>
            <option value="SALES_ORDER">Sales Orders</option>
            <option value="STOCK_TRANSFER">Stock Transfers</option>
            <option value="PRODUCT">Products</option>
            <option value="USER">Users</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-white border border-stone-200 rounded-lg px-3 py-2 text-stone-700 focus:outline-none focus:ring-1 focus:ring-forest"
          >
            <option value="ALL">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="RECEIVE">RECEIVE</option>
            <option value="DISPATCH">DISPATCH</option>
            <option value="FULFILL">FULFILL</option>
            <option value="ADJUST">ADJUST</option>
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search email, entity ID, or action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Showing {filteredLogs.length} audit event(s)</span>
          <span className="font-mono">RETENTION POLICY: 7 YEARS</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-stone-400">Loading audit records...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-stone-400">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-stone-300" />
            <p className="font-medium text-stone-600">No matching audit events</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-xs font-medium text-stone-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Timestamp (UTC)</th>
                  <th className="px-5 py-3">Actor / Email</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity Type</th>
                  <th className="px-5 py-3">Entity Identifier</th>
                  <th className="px-5 py-3">Client IP</th>
                  <th className="px-5 py-3 text-right">Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3 text-xs font-mono text-stone-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-charcoal flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      {log.user_email}
                    </td>
                    <td className="px-5 py-3">{getActionBadge(log.action)}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-stone-700">
                      {log.entity_type}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-stone-500 max-w-xs truncate">
                      {log.entity_id}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-stone-400">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-forest hover:underline font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-200">
              <div>
                <span className="text-xs font-mono text-stone-500">AUDIT EVENT INSPECTOR</span>
                <h3 className="font-semibold text-charcoal">
                  {selectedLog.action} on {selectedLog.entity_type}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Event Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>
                  <span className="text-stone-500">Actor:</span>
                  <p className="font-semibold text-charcoal truncate">{selectedLog.user_email}</p>
                </div>
                <div>
                  <span className="text-stone-500">IP Address:</span>
                  <p className="font-mono text-charcoal">{selectedLog.ip_address || '127.0.0.1'}</p>
                </div>
                <div>
                  <span className="text-stone-500">Target Entity:</span>
                  <p className="font-semibold text-charcoal">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <span className="text-stone-500">Timestamp:</span>
                  <p className="font-mono text-charcoal">{new Date(selectedLog.created_at).toLocaleTimeString()}</p>
                </div>
              </div>

              {/* State Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>Previous State</span>
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded">BEFORE</span>
                  </div>
                  <pre className="p-3 bg-stone-900 text-stone-200 rounded-lg text-xs font-mono overflow-x-auto max-h-72">
                    {formatJSON(selectedLog.previous_state)}
                  </pre>
                </div>

                <div>
                  <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <span>New State</span>
                    <span className="text-[10px] bg-forest/20 text-forest px-1.5 py-0.2 rounded font-bold">AFTER</span>
                  </div>
                  <pre className="p-3 bg-stone-900 text-emerald-300 rounded-lg text-xs font-mono overflow-x-auto max-h-72">
                    {formatJSON(selectedLog.new_state)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-charcoal rounded-lg text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
