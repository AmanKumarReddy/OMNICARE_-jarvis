import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Warehouse, ShoppingCart, Truck, ArrowRight, X } from 'lucide-react';
import { api } from '../../services/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [salesOrders, setSalesOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [prods, whs, pos, sos] = await Promise.all([
          api.getProducts(),
          api.getWarehouses(),
          api.getPurchaseOrders(),
          api.getSalesOrders(),
        ]);
        setProducts(prods || []);
        setWarehouses(whs || []);
        setPurchaseOrders(pos || []);
        setSalesOrders(sos || []);
      } catch (err) {
        console.error('Failed to load search data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedProducts = q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 4) : [];
  const matchedWarehouses = q ? warehouses.filter((w) => w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedPOs = q ? purchaseOrders.filter((po) => po.po_number.toLowerCase().includes(q) || po.supplier_name.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedSOs = q ? salesOrders.filter((so) => so.so_number.toLowerCase().includes(q) || so.customer_name.toLowerCase().includes(q)).slice(0, 3) : [];

  const hasResults = matchedProducts.length > 0 || matchedWarehouses.length > 0 || matchedPOs.length > 0 || matchedSOs.length > 0;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl bg-[#FFFFFF] rounded-xl border border-[#E6E8E2] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#E6E8E2] bg-[#FAFBF9]">
          <Search className="w-5 h-5 text-[#7A827C] mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search products, SKUs, warehouses, POs, sales orders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-[#202923] text-sm focus:outline-none placeholder:text-[#7A827C]"
          />
          <div className="flex items-center gap-1.5 ml-2">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#E6E8E2] text-[#7A827C] rounded">ESC</kbd>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#E6E8E2] text-[#7A827C] rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="text-center py-8 text-xs text-[#7A827C]">
              Searching records...
            </div>
          )}

          {!loading && !q && (
            <div className="py-6 text-center text-xs text-[#7A827C]">
              Type a product name, SKU (e.g. <span className="font-mono font-medium text-[#202923]">ELEC-MC-04</span>), warehouse code, or PO number.
            </div>
          )}

          {!loading && q && !hasResults && (
            <div className="py-8 text-center text-xs text-[#7A827C]">
              No results found for "<span className="text-[#202923] font-medium">{query}</span>".
            </div>
          )}

          {/* Products */}
          {matchedProducts.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#7A827C] uppercase tracking-wider px-2 mb-1.5">
                Products
              </div>
              <div className="space-y-1">
                {matchedProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(`/products?search=${encodeURIComponent(p.sku)}`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F7F7F4] flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-[#DCE8DD] text-[#527A62] flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#202923] group-hover:text-[#527A62]">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[#7A827C] font-mono">
                          SKU: {p.sku} • {p.category_name}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7A827C] group-hover:text-[#527A62] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warehouses */}
          {matchedWarehouses.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#7A827C] uppercase tracking-wider px-2 mb-1.5">
                Warehouses
              </div>
              <div className="space-y-1">
                {matchedWarehouses.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleSelect(`/warehouses`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F7F7F4] flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-[#F0F2EB] text-[#527A62] flex items-center justify-center shrink-0">
                        <Warehouse className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#202923] group-hover:text-[#527A62]">
                          {w.name}
                        </div>
                        <div className="text-[11px] text-[#7A827C]">
                          Code: {w.code} • {w.city}, {w.state}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7A827C] group-hover:text-[#527A62] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Orders */}
          {matchedPOs.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#7A827C] uppercase tracking-wider px-2 mb-1.5">
                Purchase Orders
              </div>
              <div className="space-y-1">
                {matchedPOs.map((po) => (
                  <button
                    key={po.id}
                    onClick={() => handleSelect(`/purchase-orders`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F7F7F4] flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-[#EBF0EC] text-[#527A62] flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#202923] group-hover:text-[#527A62]">
                          {po.po_number} — {po.supplier_name}
                        </div>
                        <div className="text-[11px] text-[#7A827C]">
                          Status: <span className="font-semibold">{po.status}</span> • Total: ${po.total_amount?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7A827C] group-hover:text-[#527A62] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sales Orders */}
          {matchedSOs.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#7A827C] uppercase tracking-wider px-2 mb-1.5">
                Sales Orders
              </div>
              <div className="space-y-1">
                {matchedSOs.map((so) => (
                  <button
                    key={so.id}
                    onClick={() => handleSelect(`/sales-orders`)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F7F7F4] flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-[#EBF0EC] text-[#527A62] flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-[#202923] group-hover:text-[#527A62]">
                          {so.so_number} — {so.customer_name}
                        </div>
                        <div className="text-[11px] text-[#7A827C]">
                          Status: <span className="font-semibold">{so.status}</span> • Total: ${so.total_amount?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#7A827C] group-hover:text-[#527A62] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#E6E8E2] bg-[#FAFBF9] flex items-center justify-between text-[11px] text-[#7A827C]">
          <span>Navigate with mouse or keyboard</span>
          <span className="font-mono">OmniStock Enterprise Search</span>
        </div>
      </div>
    </div>
  );
};
