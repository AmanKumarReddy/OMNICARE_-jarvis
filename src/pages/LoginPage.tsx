import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Package,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Boxes,
  Activity,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface DemoAccount {
  role: UserRole;
  title: string;
  name: string;
  email: string;
  password: string;
  badge: string;
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'SUPER_ADMIN',
    title: 'Super Admin',
    name: 'Alexander Wright',
    email: 'admin@apexstock.com',
    password: 'Admin123!',
    badge: 'Root / Master Access',
    description: 'Full multi-warehouse control, user roles & personnel administration',
  },
  {
    role: 'ADMIN',
    title: 'System Admin',
    name: 'Diana Prince',
    email: 'admin.ops@apexstock.com',
    password: 'Admin123!',
    badge: 'Operations Admin',
    description: 'Personnel access control, facility management & auditing',
  },
  {
    role: 'INVENTORY_MANAGER',
    title: 'Inventory Manager',
    name: 'Marcus Vance',
    email: 'marcus.vance@apexstock.com',
    password: 'Manager123!',
    badge: 'Procurement & Stock',
    description: 'Master catalog, low-stock reorder thresholds & PO approvals',
  },
  {
    role: 'WAREHOUSE_MANAGER',
    title: 'Warehouse Manager',
    name: 'Sarah Chen',
    email: 'sarah.chen@apexstock.com',
    password: 'Warehouse123!',
    badge: 'Chicago Logistics',
    description: 'Cycle counts, dock receipts, inter-facility transfer dispatches',
  },
  {
    role: 'STAFF',
    title: 'Warehouse Staff',
    name: 'James Wilson',
    email: 'james.wilson@apexstock.com',
    password: 'Staff123!',
    badge: 'Dock Fulfillment',
    description: 'Inbound dock goods receipt, picking, packing & sales shipments',
  },
  {
    role: 'VIEWER',
    title: 'Financial Auditor',
    name: 'Elena Rostova',
    email: 'auditor@apexstock.com',
    password: 'Viewer123!',
    badge: 'Audit & FIFO Ledger',
    description: 'Read-only asset valuation, stock movement ledger & compliance inspection',
  },
];

export const LoginPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@apexstock.com');
  const [password, setPassword] = useState('ApexStock2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard overview
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide a valid work email address.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = async (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
    setIsLoading(true);

    try {
      await login(account.email, account.password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with account credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F4] text-[#202923] flex flex-col justify-between font-sans selection:bg-[#2E5A44] selection:text-white">
      {/* Top Header Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-[#E6E8E2] bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2E5A44] flex items-center justify-center text-white shadow-sm">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-[#202923]">OmniStock</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#EAF1EC] text-[#2E5A44] font-semibold tracking-wider">
                Enterprise
              </span>
            </div>
            <p className="text-[11px] text-[#7A827C]">Autonomous Multi-Warehouse & Inventory Engine</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-[#2E5A44] bg-[#EAF1EC] px-2.5 py-1 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-[#2E5A44] animate-pulse"></span>
            <span>Cloud API v2.4 • Operational</span>
          </div>
        </div>
      </header>

      {/* Main Login Workspace */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Context & Feature Highlights */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#202923] via-[#253229] to-[#17241F] text-white shadow-xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-mono mb-6 backdrop-blur-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero-Negative Inventory Engine</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                Centralized multi-facility supply chain control.
              </h1>
              <p className="text-sm text-[#B4BCB6] leading-relaxed mb-8">
                Eliminate paper manifests, spreadsheets, and overselling. Track real-time stock balances across regional distribution centers with full compliance audit trails.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Three-Dimensional Stock Tracking</h3>
                    <p className="text-[11px] text-[#9EA7A0]">
                      Real-time visibility into On-Hand, Reserved, and Available stock units with atomic allocation locks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Multi-Warehouse Coordination</h3>
                    <p className="text-[11px] text-[#9EA7A0]">
                      Automate inter-facility stock transfers with two-phase transit tracking and capacity utilization rollups.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">Immutable Audit Compliance</h3>
                    <p className="text-[11px] text-[#9EA7A0]">
                      Append-only ledger recording actor email, IP address, timestamp, and before/after JSON state diffs.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/10 mt-8 flex items-center justify-between text-xs text-[#8A948C]">
              <span>Apex Global Logistics &copy; 2026</span>
              <span className="font-mono">ISO 27001 Ready</span>
            </div>
          </div>

          {/* Right Column: Interactive Login Form & One-Click Demo Access */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div className="bg-white rounded-2xl border border-[#E6E8E2] p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#202923] tracking-tight">Sign in to your account</h2>
                <p className="text-xs text-[#7A827C] mt-1">
                  Enter your credentials or choose a pre-configured role below to inspect the workspace.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div className="flex-1 leading-relaxed">{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-semibold text-[#202923] mb-1.5" htmlFor="email">
                    Work Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A827C]">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@apexstock.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FDFDFD] border border-[#D5D8D0] rounded-xl text-xs text-[#202923] placeholder-[#A0A6A1] focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/20 focus:border-[#2E5A44] transition-all"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#202923]" htmlFor="password">
                      Password
                    </label>
                    <span className="text-[11px] text-[#2E5A44] hover:underline cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A827C]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FDFDFD] border border-[#D5D8D0] rounded-xl text-xs text-[#202923] placeholder-[#A0A6A1] focus:outline-none focus:ring-2 focus:ring-[#2E5A44]/20 focus:border-[#2E5A44] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A827C] hover:text-[#202923]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#D5D8D0] text-[#2E5A44] focus:ring-[#2E5A44] focus:ring-offset-0"
                    />
                    <span className="text-xs text-[#525A54]">Remember this device for 30 days</span>
                  </label>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-4 bg-[#2E5A44] hover:bg-[#244736] text-white font-medium text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E6E8E2]"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-[#7A827C] font-mono uppercase text-[10px] tracking-wider">
                    Or select pre-configured role
                  </span>
                </div>
              </div>

              {/* One-Click Demo Role Cards */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#7A827C] font-medium">
                    Pre-configured Personnel Accounts (Click to test credentials):
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.role + acc.email}
                      type="button"
                      onClick={() => handleSelectDemo(acc)}
                      disabled={isLoading}
                      className="flex flex-col text-left p-2.5 rounded-xl border border-[#E6E8E2] hover:border-[#2E5A44] hover:bg-[#F9FAF8] transition-all group disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-semibold text-[#202923] group-hover:text-[#2E5A44] transition-colors">
                          {acc.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#EAF1EC] text-[#2E5A44] font-medium">
                          {acc.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#7A827C] truncate mt-0.5">{acc.email}</div>
                      <div className="text-[10px] text-[#527A62] font-mono mt-1 flex items-center justify-between">
                        <span>Key: {acc.password}</span>
                        <span className="text-[#8A948C]">{acc.name.split(' ')[0]}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Master Password Notice */}
                <div className="mt-3 p-2.5 rounded-xl bg-[#FAFBF9] border border-[#E6E8E2] text-[11px] text-[#525A54] leading-relaxed">
                  <span className="font-semibold text-[#202923]">Universal Master Key:</span> Super Admin (Alexander Wright) can log in to <em>any</em> registered user account by entering their email address and using the master key (<code className="font-mono bg-[#EAECE6] px-1 py-0.5 rounded text-[#2E5A44] font-bold">Admin123!</code>).
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[#E6E8E2] bg-white text-center text-xs text-[#7A827C]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#202923]">OmniStock Enterprise</span>
            <span>•</span>
            <span>Cloud-Native Inventory & Logistics Monolith</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Security: SHA-256 JWT</span>
            <span>•</span>
            <span>Database: PostgreSQL 16</span>
            <span>•</span>
            <span>Status: Healthy</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
