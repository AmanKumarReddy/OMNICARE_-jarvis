import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  RotateCcw,
  Barcode,
  ExternalLink,
  X,
  AlertCircle,
  Warehouse,
} from 'lucide-react';
import { api } from '../services/api';
import { Product, Category } from '../types';
import { useAuth } from '../context/AuthContext';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');
  const [showArchived, setShowArchived] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<Product | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [uom, setUom] = useState('Units');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [minThreshold, setMinThreshold] = useState<number>(10);
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { canEditProducts } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        api.getProducts({
          search: searchQuery,
          category_id: selectedCategory,
          archived: showArchived,
        }),
        api.getCategories(),
      ]);
      setProducts(prods || []);
      setCategories(cats || []);
    } catch (err: any) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, showArchived]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setBarcode('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setUom('Units');
    setCostPrice(0);
    setSellingPrice(0);
    setMinThreshold(10);
    setImageUrl('https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setBarcode(p.barcode || '');
    setCategoryId(p.category_id || '');
    setDescription(p.description || '');
    setUom(p.uom);
    setCostPrice(p.cost_price);
    setSellingPrice(p.selling_price);
    setMinThreshold(p.min_threshold);
    setImageUrl(p.image_url || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !sku.trim()) {
      setFormError('Product Name and SKU are strictly required.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        barcode: barcode.trim(),
        category_id: categoryId,
        description: description.trim(),
        uom,
        cost_price: Number(costPrice) || 0,
        selling_price: Number(sellingPrice) || 0,
        min_threshold: Number(minThreshold) || 0,
        image_url: imageUrl.trim(),
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
      } else {
        await api.createProduct(payload);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const handleArchive = async (id: string, currentArchived: boolean) => {
    if (!confirm(`Are you sure you want to ${currentArchived ? 'unarchive' : 'archive'} this product?`)) {
      return;
    }
    try {
      await api.archiveProduct(id, !currentArchived);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const full = await api.getProduct(id);
      setSelectedProductDetail(full);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923] tracking-tight">Product Catalog Master</h1>
          <p className="text-xs text-[#7A827C] mt-0.5">
            Manage global inventory SKUs, barcodes, pricing, and reorder thresholds
          </p>
        </div>

        {canEditProducts && (
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 rounded-lg bg-[#527A62] hover:bg-[#436450] text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Product</span>
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-[#E6E8E2] rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#7A827C] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search product name, SKU, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-xs text-[#202923] focus:outline-none focus:border-[#527A62]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-xs text-[#202923] focus:outline-none focus:border-[#527A62]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <label className="flex items-center gap-2 text-xs text-[#7A827C] cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-[#CCD1CB] text-[#527A62] focus:ring-[#527A62]"
            />
            <span>Show Archived</span>
          </label>
        </div>
      </div>

      {/* Products Data Table */}
      <div className="bg-white border border-[#E6E8E2] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6E8E2] bg-[#FAFBF9] text-[#7A827C] font-semibold">
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-right">On Hand</th>
                <th className="py-3 px-4 text-right">Available</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8E2]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#7A827C]">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#7A827C]">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const onHand = p.total_on_hand || 0;
                  const isLowStock = onHand <= p.min_threshold;
                  return (
                    <tr key={p.id} className="hover:bg-[#FAFBF9] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=200&auto=format&fit=crop&q=80'}
                            alt={p.name}
                            className="w-9 h-9 rounded-md object-cover border border-[#E6E8E2] shrink-0"
                          />
                          <div>
                            <button
                              onClick={() => handleViewDetail(p.id)}
                              className="font-medium text-[#202923] hover:text-[#527A62] text-left leading-snug"
                            >
                              {p.name}
                            </button>
                            <div className="text-[11px] font-mono text-[#7A827C] flex items-center gap-2 mt-0.5">
                              <span>SKU: {p.sku}</span>
                              {p.barcode && <span>• Barcode: {p.barcode}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-[#7A827C]">
                        {p.category_name || 'General'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[#202923]">
                        ${p.cost_price.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[#202923]">
                        ${p.selling_price.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-medium text-[#202923]">
                        {onHand}
                      </td>

                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`font-semibold ${isLowStock ? 'text-[#B91C1C]' : 'text-[#202923]'}`}>
                          {p.total_available || 0}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {p.is_archived ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                            Archived
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-[#B91C1C] border border-red-200">
                            Low Stock ({onHand}/{p.min_threshold})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Healthy
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetail(p.id)}
                            className="p-1 rounded hover:bg-[#E6E8E2] text-[#7A827C] hover:text-[#202923]"
                            title="View stock breakdown"
                          >
                            <Warehouse className="w-3.5 h-3.5" />
                          </button>
                          {canEditProducts && (
                            <>
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1 rounded hover:bg-[#E6E8E2] text-[#7A827C] hover:text-[#202923]"
                                title="Edit product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleArchive(p.id, p.is_archived)}
                                className="p-1 rounded hover:bg-[#E6E8E2] text-[#7A827C] hover:text-[#B91C1C]"
                                title={p.is_archived ? 'Restore' : 'Archive'}
                              >
                                {p.is_archived ? (
                                  <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Archive className="w-3.5 h-3.5" />
                                )}
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-[#E6E8E2] shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8E2] mb-4">
              <h2 className="text-base font-bold text-[#202923]">
                {editingProduct ? 'Edit Product Master' : 'Create New Master Product'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded hover:bg-[#F7F7F4] text-[#7A827C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#B91C1C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[#202923] mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Brushless DC Servo Motor 24V 350W"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202923] mb-1">SKU (Unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ELEC-MOT-24"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 font-mono uppercase bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#202923] mb-1">Barcode / UPC</label>
                  <input
                    type="text"
                    placeholder="e.g. 890123450002"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202923] mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#202923] mb-1">Unit of Measure (UOM)</label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  >
                    <option value="Units">Units (Each)</option>
                    <option value="Boxes">Boxes</option>
                    <option value="Packs">Packs</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Bundles">Bundles</option>
                    <option value="Kilograms">Kilograms (kg)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#202923] mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#202923] mb-1">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 font-mono bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#202923] mb-1">Min Threshold</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={minThreshold}
                    onChange={(e) => setMinThreshold(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 font-mono bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Product Description</label>
                <textarea
                  rows={2}
                  placeholder="Technical specifications, tolerance, packaging..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Product Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL & WAREHOUSE BREAKDOWN DRAWER */}
      {selectedProductDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-[#E6E8E2] shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-[#E6E8E2] mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedProductDetail.image_url}
                  alt={selectedProductDetail.name}
                  className="w-12 h-12 rounded-lg object-cover border border-[#E6E8E2]"
                />
                <div>
                  <h2 className="text-base font-bold text-[#202923]">{selectedProductDetail.name}</h2>
                  <div className="text-xs font-mono text-[#7A827C]">
                    SKU: {selectedProductDetail.sku} • Category: {selectedProductDetail.category_name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="p-1 rounded hover:bg-[#F7F7F4] text-[#7A827C]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs">
              <div className="p-3 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg">
                <span className="text-[#7A827C] block mb-0.5">Unit Cost</span>
                <span className="font-mono font-bold text-[#202923] text-sm">${selectedProductDetail.cost_price.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg">
                <span className="text-[#7A827C] block mb-0.5">Selling Price</span>
                <span className="font-mono font-bold text-[#202923] text-sm">${selectedProductDetail.selling_price.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg">
                <span className="text-[#7A827C] block mb-0.5">Total On Hand</span>
                <span className="font-mono font-bold text-[#202923] text-sm">{selectedProductDetail.total_on_hand}</span>
              </div>
              <div className="p-3 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg">
                <span className="text-[#7A827C] block mb-0.5">Min Threshold</span>
                <span className="font-mono font-bold text-[#202923] text-sm">{selectedProductDetail.min_threshold}</span>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-xs font-semibold text-[#202923] mb-2 uppercase tracking-wider">
                Multi-Warehouse Stock Distribution
              </h3>
              <div className="border border-[#E6E8E2] rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAFBF9] text-[#7A827C] border-b border-[#E6E8E2]">
                    <tr>
                      <th className="py-2.5 px-3">Warehouse Hub</th>
                      <th className="py-2.5 px-3 text-right">On Hand</th>
                      <th className="py-2.5 px-3 text-right">Reserved</th>
                      <th className="py-2.5 px-3 text-right">Available</th>
                      <th className="py-2.5 px-3">Location Bin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6E8E2]">
                    {selectedProductDetail.warehouse_breakdown?.map((wb) => (
                      <tr key={wb.warehouse_id} className="hover:bg-[#FAFBF9]">
                        <td className="py-2.5 px-3 font-medium text-[#202923]">{wb.warehouse_name}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{wb.quantity_on_hand}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-[#7A827C]">{wb.quantity_reserved}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#527A62]">
                          {wb.quantity_available}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#7A827C]">
                          {wb.aisle ? `${wb.aisle} / ${wb.shelf} / ${wb.bin}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedProductDetail(null)}
                className="px-4 py-1.5 rounded-lg border border-[#E6E8E2] text-xs font-medium text-[#202923] hover:bg-[#F7F7F4]"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
