import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { CountUpValue, DonutChart, AnimatedBar, ShimmerRow, DepthCard } from '../components/ui/AceternityEffects';
import { Briefcase, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, PieChart, DollarSign, BarChart3, Activity, Layers, Shield } from 'lucide-react';

// ── Mock Data ─────────────────────────────────────────────────────────────
const equityPositions = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', qty: 10, avgPrice: 1378, currentPrice: 1395, pnl: 170, exposure: 13950, sector: 'Energy' },
  { symbol: 'TCS', name: 'Tata Consultancy', qty: 6, avgPrice: 3120, currentPrice: 3133, pnl: 78, exposure: 18798, sector: 'IT' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', qty: 8, avgPrice: 1400, currentPrice: 1417.5, pnl: 140, exposure: 11340, sector: 'Banking' },
  { symbol: 'LT', name: 'Larsen & Toubro', qty: 4, avgPrice: 3550, currentPrice: 3579, pnl: 116, exposure: 14316, sector: 'Infra' },
  { symbol: 'INFY', name: 'Infosys', qty: 10, avgPrice: 1525, currentPrice: 1524.1, pnl: -9, exposure: 15241, sector: 'IT' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', qty: 3, avgPrice: 980, currentPrice: 1002.7, pnl: 68.1, exposure: 3008, sector: 'Finance' },
  { symbol: 'AXISBANK', name: 'Axis Bank', qty: 6, avgPrice: 1100, currentPrice: 1105.5, pnl: 33, exposure: 6633, sector: 'Banking' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki', qty: 1, avgPrice: 15000, currentPrice: 15307, pnl: 307, exposure: 15307, sector: 'Auto' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors', qty: 14, avgPrice: 705, currentPrice: 714.15, pnl: 128.1, exposure: 9998, sector: 'Auto' },
  { symbol: 'HINDALCO', name: 'Hindalco Industries', qty: 22, avgPrice: 743, currentPrice: 757.9, pnl: 327.8, exposure: 16674, sector: 'Metals' },
];

const derivativePositions = [
  { symbol: 'NIFTY23SEP25100CE', type: 'Option', side: 'Sell', qty: 75, strike: 25100, expiry: '2025-09-25', price: 112, pnl: -900, margin: 12800 },
  { symbol: 'NIFTY23SEP25100PE', type: 'Option', side: 'Sell', qty: 75, strike: 25100, expiry: '2025-09-25', price: 98, pnl: 620, margin: 12700 },
  { symbol: 'BANKNIFTY54800FUT', type: 'Futures', side: 'Sell', qty: 15, strike: 0, expiry: '2025-09-25', price: 54809, pnl: -4300, margin: 22100 },
  { symbol: 'BANKNIFTY54700FUT', type: 'Futures', side: 'Sell', qty: 10, strike: 0, expiry: '2025-09-25', price: 54809, pnl: 1870, margin: 14700 },
];

const fundPositions = [
  { symbol: 'NIPBEES', name: 'Nippon India ETF', units: 25, nav: 205, value: 5125, pnl: 325 },
];
const cashBalance = 8250;

const allocation = [
  { type: 'Equity', value: 119265, color: '#3b82f6', icon: TrendingUp },
  { type: 'Derivatives', value: 5230, color: '#8b5cf6', icon: Activity },
  { type: 'Funds', value: 5125, color: '#f59e0b', icon: Layers },
  { type: 'Cash', value: 8250, color: '#10b981', icon: Wallet },
];

const totalValue = allocation.reduce((s, a) => s + a.value, cashBalance);
const totalPnl = equityPositions.reduce((s, p) => s + p.pnl, 0) + derivativePositions.reduce((s, p) => s + p.pnl, 0) + fundPositions.reduce((s, p) => s + p.pnl, 0);

// ── Sector data for breakdown bars ────────────────────────────────────────
const sectorMap: Record<string, number> = {};
equityPositions.forEach(p => { sectorMap[p.sector] = (sectorMap[p.sector] || 0) + p.exposure; });
const sectors = Object.entries(sectorMap).map(([name, val]) => ({ name, val })).sort((a, b) => b.val - a.val);
const sectorColors: Record<string, string> = { IT: '#3b82f6', Banking: '#8b5cf6', Energy: '#f59e0b', Auto: '#ef4444', Infra: '#10b981', Finance: '#06b6d4', Metals: '#f97316' };

const tabs = ['Equity', 'Derivatives', 'Funds', 'Cash'] as const;

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Equity');

  const thStyle: React.CSSProperties = { padding: '10px 14px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8', textAlign: 'left', borderBottom: '2px solid #f1f5f9' };
  const tdStyle: React.CSSProperties = { padding: '12px 14px', fontSize: 13, color: '#334155', borderBottom: '1px solid #f8fafc' };
  const tdRight: React.CSSProperties = { ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmerBg{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes floatSoft{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes pulseRing{0%{box-shadow:0 0 0 0 currentColor}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}
      `}</style>

      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>

        {/* ═════════ HERO BANNER — DepthCard with parallax inner layers ═════════ */}
        <DepthCard depth={5} style={{
          background: 'linear-gradient(135deg, #0c1222 0%, #1e1b4b 35%, #312e81 65%, #4338ca 100%)',
          borderRadius: 20, padding: '28px 32px', marginBottom: 24, color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          {/* Floating parallax orbs */}
          <div data-depth="3" style={{ position: 'absolute', right: 40, top: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.25),transparent)', filter: 'blur(40px)', transition: 'transform 0.3s', animation: 'floatSoft 8s ease-in-out infinite' }} />
          <div data-depth="2" style={{ position: 'absolute', left: '35%', bottom: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.15),transparent)', filter: 'blur(50px)', transition: 'transform 0.3s', animation: 'floatSoft 10s ease-in-out infinite 3s' }} />
          <div data-depth="1" style={{ position: 'absolute', left: 60, top: 10, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.2),transparent)', filter: 'blur(20px)', transition: 'transform 0.3s' }} />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                  <Briefcase size={18} />
                </div>
                <div data-depth="1" style={{ transition: 'transform 0.3s' }}>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>My Portfolio</h1>
                  <p style={{ fontSize: 11, opacity: 0.45, margin: 0 }}>Total holdings across asset classes · Demo Preview</p>
                </div>
              </div>
            </div>
            <div data-depth="2" style={{ display: 'flex', alignItems: 'baseline', gap: 12, transition: 'transform 0.3s' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.4, textTransform: 'uppercase', letterSpacing: 1 }}>Portfolio Value</div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
                  <CountUpValue value={totalValue} prefix="₹" duration={2} style={{ color: '#fff' }} />
                </div>
              </div>
              <div style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                background: totalPnl >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: totalPnl >= 0 ? '#34d399' : '#f87171',
              }}>
                {totalPnl >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </DepthCard>

        {/* ═════════ METRICS ROW — CountUpValue + AnimatedBar ═════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {allocation.map((a, i) => {
            const Icon = a.icon;
            return (
              <DepthCard key={a.type} depth={4} style={{
                background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #f1f5f9',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)', animation: `fadeUp 0.5s ease ${i * 0.1}s both`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{a.type}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
                      <CountUpValue value={a.value} prefix="₹" duration={1.5 + i * 0.2} />
                    </div>
                  </div>
                  <div data-depth="2" style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.3s' }}>
                    <Icon size={16} color={a.color} />
                  </div>
                </div>
                <AnimatedBar value={a.value} max={totalValue} color={a.color} height={6} delay={0.3 + i * 0.15} />
                <div style={{ fontSize: 11, fontWeight: 600, color: a.color, marginTop: 6 }}>
                  {((a.value / totalValue) * 100).toFixed(1)}% of portfolio
                </div>
              </DepthCard>
            );
          })}
        </div>

        {/* ═════════ DONUT + SECTOR BREAKDOWN ═════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 24 }}>
          {/* Donut */}
          <DepthCard depth={5} style={{
            background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 16, padding: 24,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <PieChart size={13} /> Asset Allocation
            </div>
            <DonutChart
              size={150} thickness={16}
              segments={allocation.map(a => ({ value: a.value, color: a.color, label: a.type }))}
              centerLabel="TOTAL"
              centerValue={`₹${(totalValue / 1000).toFixed(0)}K`}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', marginTop: 4 }}>
              {allocation.map(a => (
                <div key={a.type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 3, background: a.color }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{a.type}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginLeft: 'auto' }}>{((a.value / totalValue) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </DepthCard>

          {/* Sector Breakdown */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 22, border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={15} color="#6366f1" /> Sector Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sectors.map((s, i) => (
                <div key={s.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{s.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>₹{s.val.toLocaleString('en-IN')}</span>
                  </div>
                  <AnimatedBar value={s.val} max={sectors[0].val} color={sectorColors[s.name] || '#94a3b8'} height={10} delay={0.2 + i * 0.1} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═════════ TABS ═════════ */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 2, padding: '0 4px' }}>
          {tabs.map(tab => {
            const active = activeTab === tab;
            const colors: Record<string, string> = { Equity: '#3b82f6', Derivatives: '#8b5cf6', Funds: '#f59e0b', Cash: '#10b981' };
            const c = colors[tab];
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 24px', borderRadius: '12px 12px 0 0', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: 'none', borderBottom: active ? `3px solid ${c}` : '3px solid transparent',
                  background: active ? '#fff' : '#f8fafc', color: active ? c : '#94a3b8',
                  transition: 'all 0.3s', transform: active ? 'translateY(-2px)' : 'none',
                  boxShadow: active ? `0 -2px 12px ${c}15` : 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b' } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#94a3b8' } }}>
                {tab}
              </button>
            );
          })}
        </div>

        {/* ═════════ TABLE AREA ═════════ */}
        <div style={{ background: '#fff', borderRadius: '0 16px 16px 16px', padding: 0, border: '1px solid #f1f5f9', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {activeTab === 'Equity' && (
            <div>
              <div style={{ padding: '18px 22px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={16} color="#3b82f6" /> Equity Holdings
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: '#eff6ff', color: '#3b82f6' }}>{equityPositions.length} stocks</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: totalPnl >= 0 ? '#10b981' : '#ef4444' }}>
                  Day P&L: {totalPnl >= 0 ? '+' : ''}₹<CountUpValue value={Math.abs(equityPositions.reduce((s, p) => s + p.pnl, 0))} duration={1.2} />
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Symbol</th><th style={thStyle}>Name</th><th style={thStyle}>Sector</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th><th style={{ ...thStyle, textAlign: 'right' }}>Avg Price</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>LTP</th><th style={{ ...thStyle, textAlign: 'right' }}>P&L</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Exposure</th><th style={{ ...thStyle, textAlign: 'right', width: 120 }}>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equityPositions.map((p, i) => {
                      const pct = (p.exposure / allocation[0].value) * 100;
                      const pnlPct = (p.pnl / (p.avgPrice * p.qty)) * 100;
                      return (
                        <ShimmerRow key={p.symbol} delay={i * 0.06} color={p.pnl >= 0 ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)'}>
                          <td style={{ ...tdStyle, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace', letterSpacing: 0.5 }}>{p.symbol}</td>
                          <td style={{ ...tdStyle, color: '#64748b' }}>{p.name}</td>
                          <td style={tdStyle}>
                            <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: `${sectorColors[p.sector] || '#94a3b8'}10`, color: sectorColors[p.sector] || '#94a3b8' }}>{p.sector}</span>
                          </td>
                          <td style={tdRight}>{p.qty}</td>
                          <td style={tdRight}>₹{p.avgPrice.toLocaleString('en-IN')}</td>
                          <td style={{ ...tdRight, fontWeight: 600 }}>₹{p.currentPrice.toLocaleString('en-IN')}</td>
                          <td style={{ ...tdRight, fontWeight: 700, color: p.pnl >= 0 ? '#10b981' : '#ef4444' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                              {p.pnl >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              <span>{p.pnl >= 0 ? '+' : ''}₹{Math.abs(p.pnl).toLocaleString('en-IN')}</span>
                              <span style={{ fontSize: 10, opacity: 0.7 }}>({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%)</span>
                            </div>
                          </td>
                          <td style={tdRight}>₹{p.exposure.toLocaleString('en-IN')}</td>
                          <td style={{ ...tdStyle, width: 120 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 6, background: '#f1f5f9', overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 6, background: `linear-gradient(90deg, #3b82f6, #6366f1)`, transition: 'width 0.8s ease' }} />
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', minWidth: 30 }}>{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </ShimmerRow>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Derivatives' && (
            <div>
              <div style={{ padding: '18px 22px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={16} color="#8b5cf6" /> Derivative Positions
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: '#f5f3ff', color: '#8b5cf6' }}>{derivativePositions.length} open</span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Symbol</th><th style={thStyle}>Type</th><th style={thStyle}>Side</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Qty</th><th style={{ ...thStyle, textAlign: 'right' }}>Strike/Price</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Expiry</th><th style={{ ...thStyle, textAlign: 'right' }}>P&L</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {derivativePositions.map((p, i) => (
                      <ShimmerRow key={p.symbol} delay={i * 0.08} color={p.pnl >= 0 ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)'}>
                        <td style={{ ...tdStyle, fontWeight: 700, fontFamily: 'monospace', fontSize: 11, color: '#1e293b' }}>{p.symbol}</td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: p.type === 'Option' ? '#fef3c7' : '#e0e7ff', color: p.type === 'Option' ? '#d97706' : '#4f46e5' }}>{p.type}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: p.side === 'Sell' ? '#ef4444' : '#10b981' }}>{p.side}</span>
                        </td>
                        <td style={tdRight}>{p.qty}</td>
                        <td style={tdRight}>{p.strike || `₹${p.price.toLocaleString('en-IN')}`}</td>
                        <td style={{ ...tdRight, fontSize: 11, color: '#94a3b8' }}>{p.expiry}</td>
                        <td style={{ ...tdRight, fontWeight: 700, color: p.pnl >= 0 ? '#10b981' : '#ef4444' }}>
                          {p.pnl >= 0 ? '+' : ''}₹{p.pnl.toLocaleString('en-IN')}
                        </td>
                        <td style={tdRight}>₹{p.margin.toLocaleString('en-IN')}</td>
                      </ShimmerRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Funds' && (
            <div>
              <div style={{ padding: '18px 22px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} color="#f59e0b" />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>ETFs / Mutual Funds</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Symbol</th><th style={thStyle}>Name</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Units</th><th style={{ ...thStyle, textAlign: 'right' }}>NAV</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Value</th><th style={{ ...thStyle, textAlign: 'right' }}>P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fundPositions.map((p, i) => (
                      <ShimmerRow key={p.symbol} delay={i * 0.08} color="rgba(245,158,11,0.05)">
                        <td style={{ ...tdStyle, fontWeight: 700, fontFamily: 'monospace', color: '#1e293b' }}>{p.symbol}</td>
                        <td style={{ ...tdStyle, color: '#64748b' }}>{p.name}</td>
                        <td style={tdRight}>{p.units}</td>
                        <td style={tdRight}>₹{p.nav}</td>
                        <td style={{ ...tdRight, fontWeight: 600 }}>₹{p.value.toLocaleString('en-IN')}</td>
                        <td style={{ ...tdRight, fontWeight: 700, color: p.pnl >= 0 ? '#10b981' : '#ef4444' }}>
                          {p.pnl >= 0 ? '+' : ''}₹{p.pnl}
                        </td>
                      </ShimmerRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'Cash' && (
            <div style={{ padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ display: 'inline-block', animation: 'floatSoft 4s ease-in-out infinite' }}>
                <DepthCard depth={6} style={{
                  background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', borderRadius: 20, padding: '32px 48px', display: 'inline-block',
                  border: '1px solid #a7f3d0', boxShadow: '0 8px 32px rgba(16,185,129,0.12)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Shield size={13} /> Available Cash
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: '#047857' }}>
                    <CountUpValue value={cashBalance} prefix="₹" duration={2} />
                  </div>
                  <div style={{ fontSize: 12, color: '#6ee7b7', marginTop: 4 }}>Ready to deploy</div>
                </DepthCard>
              </div>
            </div>
          )}
        </div>

        {/* Footer summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 20 }}>
          {[
            { label: 'Total Invested', value: equityPositions.reduce((s, p) => s + p.avgPrice * p.qty, 0), color: '#3b82f6', icon: DollarSign },
            { label: 'Current Value', value: equityPositions.reduce((s, p) => s + p.exposure, 0), color: '#8b5cf6', icon: TrendingUp },
            { label: 'Unrealized P&L', value: equityPositions.reduce((s, p) => s + p.pnl, 0), color: totalPnl >= 0 ? '#10b981' : '#ef4444', icon: totalPnl >= 0 ? TrendingUp : TrendingDown },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={m.label} style={{
                background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #f1f5f9',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 14,
                animation: `fadeUp 0.4s ease ${0.6 + i * 0.1}s both`,
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${m.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} color={m.color} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>
                    <CountUpValue value={Math.abs(m.value)} prefix={m.label === 'Unrealized P&L' ? (m.value >= 0 ? '+₹' : '-₹') : '₹'} duration={1.6 + i * 0.2} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}