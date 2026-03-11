import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, TrendingUp, Target, BarChart3, Shield,
  BookOpen, Users, CreditCard, Bell, LogOut, ChevronDown,
  Menu, X, Briefcase, Brain, Link2, Eye, Newspaper
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const nav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Market', href: '/market', icon: TrendingUp },
  { name: 'Strategy Builder', href: '/strategy-builder', icon: Target },
  { name: 'AI Strategy', href: '/ai-strategy', icon: Brain },
  { name: 'Brokers', href: '/broker-integration', icon: Link2 },
  { name: 'Backtesting', href: '/backtesting', icon: BarChart3 },
  { name: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { name: 'Option Chain', href: '/option-chain', icon: Eye },
  { name: 'News Insights', href: '/news-insights', icon: Newspaper },
  { name: 'Risk Management', href: '/risk-management', icon: Shield },
  { name: 'Learning Hub', href: '/learning', icon: BookOpen },
  { name: 'Community', href: '/community', icon: Users },
  { name: 'Billing', href: '/billing', icon: CreditCard },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { indices, isMarketOpen } = useData();

  const isActive = (href: string) => location.pathname === href;

  const initials = (name?: string) =>
    name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AF';

  return (
    <div className="app-shell">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <TrendingUp size={18} color="#fff" />
          </div>
          <span className="sidebar-logo-text">AlgoForge</span>
          <span className="sidebar-logo-badge">BETA</span>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Platform</p>
          {nav.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials(user?.name)}</div>
            <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
              <p style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Trader'}
              </p>
              <span>{user?.subscription || 'free'} plan</span>
            </div>
            <button
              onClick={logout}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 49, display: 'block'
          }}
        />
      )}

      {/* ── Main Area ─────────────────────────────────────────── */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <button
            className="btn btn-secondary btn-sm"
            style={{ padding: '6px', display: 'none' }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            id="mobile-menu-btn"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          {/* Live Index Ticker */}
          <div className="topbar-ticker">
            <div className="flex items-center gap-2">
              <div className={`market-status-dot ${isMarketOpen ? 'open' : 'closed'}`} />
              <span style={{ fontSize: 12, fontWeight: 600, color: isMarketOpen ? 'var(--success)' : 'var(--danger)' }}>
                {isMarketOpen ? 'MARKET OPEN' : 'MARKET CLOSED'}
              </span>
            </div>
            {indices.slice(0, 3).map(idx => (
              <div className="ticker-item" key={idx.symbol}>
                <span className="ticker-name">{idx.name}</span>
                <span className="ticker-value">
                  {idx.value != null ? idx.value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
                </span>
                {idx.change != null && (
                  <span className={`ticker-change ${idx.change >= 0 ? 'up' : 'down'}`}>
                    {idx.change >= 0 ? '▲' : '▼'} {Math.abs(idx.changePercent ?? 0).toFixed(2)}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
            <button className="btn btn-secondary btn-sm" style={{ position: 'relative' }}>
              <Bell size={15} />
              <span style={{
                position: 'absolute', top: 4, right: 4, width: 6, height: 6,
                background: 'var(--danger)', borderRadius: '50%'
              }} />
            </button>

            <div style={{ position: 'relative' }}>
              <button
                className="flex items-center gap-2"
                onClick={() => setProfileOpen(!profileOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
              >
                <div className="sidebar-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                  {initials(user?.name)}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={13} color="var(--text-muted)" />
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '100%', marginTop: 8,
                  background: '#fff', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-lg)', width: 200, zIndex: 100, padding: '8px 0'
                }}>
                  <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <span className="badge badge-primary">Level {user?.level}</span>
                      <span className="badge badge-warning">{user?.credits} credits</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); setProfileOpen(false); }}
                    className="flex items-center gap-2"
                    style={{
                      width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                      padding: '8px 14px', fontSize: 13, color: 'var(--danger)',
                      textAlign: 'left'
                    }}
                  >
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;