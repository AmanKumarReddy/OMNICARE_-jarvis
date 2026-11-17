import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Mail,
  Phone,
  MapPin,
  Clock,
  Search,
  X,
  AlertCircle,
  Building,
} from 'lucide-react';
import { api } from '../services/api';
import { Supplier } from '../types';
import { useAuth } from '../context/AuthContext';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { canEditProducts } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getSuppliers();
      setSuppliers(data || []);
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
      setErrorMsg('Supplier code and company name are required');
      return;
    }

    try {
      await api.createSupplier({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        contact_name: contactName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        payment_terms: paymentTerms,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create supplier');
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923] tracking-tight">Supplier & Vendor Directory</h1>
          <p className="text-xs text-[#7A827C] mt-0.5">
            Verified vendor profiles, commercial terms, and procurement points of contact
          </p>
        </div>

        {canEditProducts && (
          <button
            onClick={() => {
              setCode('');
              setName('');
              setContactName('');
              setEmail('');
              setPhone('');
              setAddress('');
              setCity('');
              setPaymentTerms('Net 30');
              setErrorMsg(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-[#527A62] hover:bg-[#436450] text-xs font-semibold text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier Profile</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#E6E8E2] rounded-xl p-4 shadow-sm flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-[#7A827C] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search suppliers by name, code, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-xs text-[#202923] focus:outline-none focus:border-[#527A62]"
          />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white border border-[#E6E8E2] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E6E8E2] bg-[#FAFBF9] text-[#7A827C] font-semibold">
                <th className="py-3 px-4">Vendor & Code</th>
                <th className="py-3 px-4">Primary Contact</th>
                <th className="py-3 px-4">Direct Contact</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8E2]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#7A827C]">
                    Loading supplier directory...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#7A827C]">
                    No suppliers found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAFBF9] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#202923]">{s.name}</div>
                      <div className="text-[11px] font-mono text-[#527A62]">{s.code}</div>
                    </td>

                    <td className="py-3 px-4 text-[#202923] font-medium">
                      {s.contact_name || 'Accounts Representative'}
                    </td>

                    <td className="py-3 px-4 space-y-0.5 text-[11px] text-[#7A827C]">
                      {s.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span>{s.email}</span>
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[#7A827C]">
                      {s.city || 'United States'}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-[#202923]">
                      <span className="px-2 py-0.5 rounded bg-[#FAFBF9] border border-[#E6E8E2]">
                        {s.payment_terms || 'Net 30'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD SUPPLIER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white rounded-xl border border-[#E6E8E2] shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E8E2] mb-4">
              <h2 className="text-base font-bold text-[#202923]">New Vendor Profile</h2>
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
                  <label className="block font-medium text-[#202923] mb-1">Vendor Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUP-005"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 font-mono uppercase bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#202923] mb-1">Commercial Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="Immediate">Due on Receipt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Company / Entity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Continental Precision Motors Inc"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#202923] mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Jonathan Lee"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#202923] mb-1">Direct Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="orders@continentalmotors.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAFBF9] border border-[#E6E8E2] rounded-lg text-[#202923] focus:outline-none focus:border-[#527A62]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#202923] mb-1">City & State</label>
                <input
                  type="text"
                  placeholder="Detroit, MI"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
