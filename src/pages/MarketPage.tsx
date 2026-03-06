import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useData } from '../contexts/DataContext';
import {
  TrendingUp, TrendingDown, RefreshCw, Search, Clock, BarChart3, AlertCircle,
  Activity, Globe, ArrowUpRight, ArrowDownRight, Zap, Eye, Layers, ChevronRight
} from 'lucide-react';
import { TickerTape, ScanLine, GlowTrail, BarEqualizer, DataPulse } from '../components/ui/AceternityEffects';

type Tab = 'indices' | 'stocks' | 'options';
const OPTIONS_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY'];

/* ── Fallback data ────────────────────────────────────────────── */
const fallbackIndices = [
  { symbol: 'NIFTY50', name: 'Nifty 50', value: 22467, change: 145.30, changePercent: 0.65, high: 22582, low: 22318 },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty', value: 47823, change: -89.50, changePercent: -0.19, high: 48112, low: 47689 },
  { symbol: 'SENSEX', name: 'Sensex', value: 73891, change: 312.70, changePercent: 0.42, high: 74201, low: 73540 },
  { symbol: 'NIFTYIT', name: 'Nifty IT', value: 33456, change: 234.10, changePercent: 0.70, high: 33612, low: 33210 },
  { symbol: 'NIFTYFIN', name: 'Nifty Fin Services', value: 21345, change: -54.20, changePercent: -0.25, high: 21498, low: 21290 },
  { symbol: 'NIFTYMID', name: 'Nifty Midcap 50', value: 14567, change: 67.80, changePercent: 0.47, high: 14623, low: 14489 },
];
const fallbackGainers = [
  { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 987.45, change: 42.3, changePercent: 4.47, volume: 12400000, high: 991, low: 945, pe: 8.2, sector: 'Auto' },
  { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2845.60, change: 67.8, changePercent: 2.44, volume: 8900000, high: 2858, low: 2778, pe: 28.5, sector: 'Energy' },
  { symbol: 'INFY', name: 'Infosys Ltd', price: 1567.30, change: 28.9, changePercent: 1.88, volume: 6230000, high: 1574, low: 1538, pe: 26.3, sector: 'IT' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1654.20, change: 22.1, changePercent: 1.35, volume: 7810000, high: 1662, low: 1632, pe: 19.4, sector: 'Banking' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 6789.00, change: 78.5, changePercent: 1.17, volume: 3120000, high: 6812, low: 6710, pe: 32.1, sector: 'Finance' },
];
const fallbackLosers = [
  { symbol: 'WIPRO', name: 'Wipro Ltd', price: 456.80, change: -18.4, changePercent: -3.87, volume: 9100000, high: 475, low: 454, pe: 22.1, sector: 'IT' },
  { symbol: 'TCS', name: 'TCS Ltd', price: 3987.25, change: -52.3, changePercent: -1.29, volume: 4560000, high: 4039, low: 3981, pe: 30.5, sector: 'IT' },
  { symbol: 'SBIN', name: 'State Bank', price: 612.40, change: -7.8, changePercent: -1.26, volume: 14200000, high: 620, low: 610, pe: 9.8, sector: 'Banking' },
  { symbol: 'LT', name: 'L&T Ltd', price: 3421.10, change: -15.6, changePercent: -0.45, volume: 2340000, high: 3441, low: 3412, pe: 34.2, sector: 'Infra' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever', price: 2312.50, change: -28.9, changePercent: -1.23, volume: 1890000, high: 2341, low: 2305, pe: 58.7, sector: 'FMCG' },
];
const fallbackStocks = [...fallbackGainers, ...fallbackLosers];

const MarketPage: React.FC = () => {
  const { indices: rawIndices, topStocks: rawStocks, topGainers: rawGainers, topLosers: rawLosers, marketBreadth, isMarketOpen, lastUpdated, loading, refreshData, apiBase } = useData();
  const [tab, setTab] = useState<Tab>('indices');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'changePercent' | 'price' | 'volume'>('changePercent');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const indices = rawIndices.length > 0 ? rawIndices : fallbackIndices;
  const topGainers = rawGainers.length > 0 ? rawGainers : fallbackGainers;
  const topLosers = rawLosers.length > 0 ? rawLosers : fallbackLosers;
  const topStocks = rawStocks.length > 0 ? rawStocks : fallbackStocks;

  const [optSym, setOptSym] = useState('NIFTY');
  const [optData, setOptData] = useState<any>(null);
  const [optLoading, setOptLoading] = useState(false);
  const [optError, setOptError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const loadOptions = async (sym: string) => {
    setOptLoading(true); setOptError(null); setOptData(null);
    try {
      const res = await fetch(`${apiBase}/api/options/${sym}`);
      const data = await res.json();
      setOptData(data);
      if (data.error) setOptError(data.error);
    } catch (e: any) { setOptError(e.message); }
    finally { setOptLoading(false); }
  };
  useEffect(() => { if (tab === 'options') loadOptions(optSym); }, [tab, optSym]);

  const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const filtered = (topStocks || [])
    .filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()) || (s.name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => { const av = (a as any)[sortBy] ?? 0; const bv = (b as any)[sortBy] ?? 0; return (bv - av) * sortDir; });

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => (d === -1 ? 1 : -1));
    else { setSortBy(col); setSortDir(-1); }
  };

  const adv = marketBreadth?.advances ?? 1247;
  const dec = marketBreadth?.declines ?? 612;
  const unch = marketBreadth?.unchanged ?? 141;
  const total = adv + dec + unch || 1;

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', paddingLeft: 34, borderRadius: 10, border: '2px solid #1e293b', fontSize: 12, fontWeight: 500, color: '#e2e8f0', background: '#0f172a', outline: 'none', transition: 'all 0.2s' };

  const tickerItems = [...topGainers.slice(0, 4), ...topLosers.slice(0, 3)].map(s => {
    const up = (s.changePercent ?? 0) >= 0;
    return (
      <div key={s.symbol} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
        <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{s.symbol}</span>
        <span style={{ color: '#94a3b8' }}>₹{s.price?.toFixed(0)}</span>
        <span style={{ fontWeight: 700, color: up ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 2 }}>
          {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {up ? '+' : ''}{s.changePercent?.toFixed(2)}%
        </span>
      </div>
    );
  });

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        @keyframes breathe{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
        @keyframes flash{0%,100%{background:rgba(34,211,238,0.03)}50%{background:rgba(34,211,238,0.08)}}
      `}</style>

      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>

        {/* ═══ HERO BANNER — Dark terminal theme with ScanLine ═══ */}
        <ScanLine color="rgba(34,211,238,0.12)" speed={5} style={{
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #0c4a6e 70%, #164e63 100%)',
          borderRadius: 20, padding: '24px 28px', marginBottom: 4, color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Globe size={18} color="#22d3ee" />
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Live Market</h1>
                  <p style={{ fontSize: 11, opacity: 0.4, margin: 0 }}>Real-time NSE/BSE data · {fmtTime(now)}</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BarEqualizer bars={5} color={isMarketOpen ? '#34d399' : '#f87171'} height={20} />
                <span style={{ fontSize: 11, fontWeight: 700, color: isMarketOpen ? '#34d399' : '#f87171' }}>
                  {isMarketOpen ? 'LIVE' : 'CLOSED'}
                </span>
              </div>
              <button onClick={refreshData} disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
        </ScanLine>

        {/* ═══ TICKER TAPE — scrolling stock ribbon ═══ */}
        <TickerTape items={tickerItems} speed={25} style={{
          background: '#0f172a', borderRadius: '0 0 14 14', padding: '8px 0', marginBottom: 16,
          borderTop: '1px solid rgba(34,211,238,0.1)',
        }} />

        {/* ═══ TABS ═══ */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {([
            { id: 'indices' as Tab, label: `Indices (${indices.length})`, icon: Layers },
            { id: 'stocks' as Tab, label: `Stocks (${topStocks.length})`, icon: BarChart3 },
            { id: 'options' as Tab, label: 'Options Chain', icon: Eye },
          ]).map(t => {
            const active = tab === t.id; const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.3s',
                background: active ? 'linear-gradient(135deg,#0891b2,#06b6d4)' : '#f8fafc',
                color: active ? '#fff' : '#64748b',
                boxShadow: active ? '0 4px 16px rgba(8,145,178,0.3)' : 'none',
              }}>
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* ═══ INDICES TAB ═══ */}
        {tab === 'indices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Index cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {indices.map((idx, i) => {
                const up = (idx.change ?? 0) >= 0;
                return (
                  <DataPulse key={idx.symbol} color={up ? '#34d399' : '#f87171'} active={i < 2} style={{ borderRadius: 16, animation: `scaleIn 0.4s ease ${i * 0.06}s both` }}>
                    <GlowTrail color={up ? '#34d399' : '#f87171'} speed={4} thickness={1} style={{ borderRadius: 16 }}>
                      <div style={{
                        background: '#fff', borderRadius: 16, padding: '18px 20px',
                        transition: 'all 0.25s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}` }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{idx.name}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{idx.symbol}</div>
                          </div>
                          <div style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: up ? '#dcfce7' : '#fef2f2', color: up ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 3 }}>
                            {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                            {up ? '+' : ''}{(idx.changePercent ?? 0).toFixed(2)}%
                          </div>
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', letterSpacing: -0.5, marginBottom: 6 }}>
                          {idx.value != null ? idx.value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '—'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                          <span style={{ color: up ? '#10b981' : '#ef4444', fontWeight: 600 }}>{up ? '+' : ''}{(idx.change ?? 0).toFixed(2)} pts</span>
                          <span>H: {(idx.high ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} · L: {(idx.low ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                        </div>
                      </div>
                    </GlowTrail>
                  </DataPulse>
                );
              })}
            </div>

            {/* Market Breadth */}
            <ScanLine color="rgba(34,211,238,0.06)" speed={6} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.5s ease 0.2s both' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={14} color="#0891b2" /> Market Breadth — Nifty 50
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
                {[
                  { label: 'Advances', value: adv, color: '#10b981' },
                  { label: 'Declines', value: dec, color: '#ef4444' },
                  { label: 'Unchanged', value: unch, color: '#f59e0b' },
                  { label: 'A/D Ratio', value: dec > 0 ? (adv / dec).toFixed(2) : String(adv), color: '#0891b2' },
                ].map(b => (
                  <div key={b.label} style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: b.color }}>{b.value}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{b.label}</div>
                  </div>
                ))}
              </div>
              {/* Stacked bar */}
              <div style={{ height: 8, borderRadius: 4, display: 'flex', overflow: 'hidden', marginBottom: 6 }}>
                <div style={{ width: `${(adv / total) * 100}%`, background: '#10b981', transition: 'width 1s ease' }} />
                <div style={{ width: `${(unch / total) * 100}%`, background: '#f59e0b', transition: 'width 1s ease' }} />
                <div style={{ width: `${(dec / total) * 100}%`, background: '#ef4444', transition: 'width 1s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                <span>{Math.round((adv / total) * 100)}% advances</span>
                <span>{Math.round((dec / total) * 100)}% declines</span>
              </div>
            </ScanLine>

            {/* Top Movers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'fadeUp 0.5s ease 0.3s both' }}>
              {[
                { title: 'Top Gainers', stocks: topGainers.slice(0, 5), isUp: true },
                { title: 'Top Losers', stocks: topLosers.slice(0, 5), isUp: false },
              ].map(g => (
                <div key={g.title} style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: g.isUp ? '#10b981' : '#ef4444', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {g.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {g.title}
                  </div>
                  {g.stocks.map((s, j) => (
                    <div key={s.symbol} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px',
                      borderRadius: 10, marginBottom: 3, fontSize: 12, transition: 'all 0.2s',
                      background: g.isUp ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)',
                      animation: `slideRight 0.3s ease ${0.3 + j * 0.06}s both`,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = g.isUp ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'; e.currentTarget.style.paddingLeft = '14px' }}
                      onMouseLeave={e => { e.currentTarget.style.background = g.isUp ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)'; e.currentTarget.style.paddingLeft = '10px' }}>
                      <div>
                        <span style={{ fontWeight: 700 }}>{s.symbol}</span>
                        <span style={{ color: '#94a3b8', marginLeft: 6, fontSize: 10 }}>₹{s.price?.toFixed(0)}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: g.isUp ? '#10b981' : '#ef4444', fontSize: 11 }}>
                        {g.isUp ? '+' : ''}{s.changePercent?.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ STOCKS TAB ═══ */}
        {tab === 'stocks' && (
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
                <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search symbol or name…"
                  style={{ ...inputStyle, background: '#fff', border: '2px solid #f1f5f9', color: '#1e293b' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#0891b2'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(8,145,178,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{filtered.length} stocks</span>
            </div>

            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Symbol</th>
                    <th style={{ padding: '10px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }} onClick={() => toggleSort('price')}>Price {sortBy === 'price' ? (sortDir === -1 ? '↓' : '↑') : ''}</th>
                    <th style={{ padding: '10px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }} onClick={() => toggleSort('changePercent')}>Change {sortBy === 'changePercent' ? (sortDir === -1 ? '↓' : '↑') : ''}</th>
                    <th style={{ padding: '10px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }} onClick={() => toggleSort('volume')}>Volume {sortBy === 'volume' ? (sortDir === -1 ? '↓' : '↑') : ''}</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>High / Low</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>P/E</th>
                    <th style={{ padding: '10px 14px', fontWeight: 700, fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sector</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const up = (s.changePercent ?? 0) >= 0;
                    return (
                      <tr key={s.symbol} style={{
                        borderBottom: '1px solid #f8fafc', transition: 'all 0.2s',
                        animation: `slideRight 0.3s ease ${i * 0.03}s both`,
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(8,145,178,0.03)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: up ? '#dcfce7' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: up ? '#16a34a' : '#dc2626' }}>
                              {s.symbol.slice(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 12 }}>{s.symbol}</div>
                              <div style={{ fontSize: 9, color: '#94a3b8' }}>{(s.name || '').slice(0, 18)}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 13 }}>₹{s.price?.toFixed(2)}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            {up ? <ArrowUpRight size={11} color="#10b981" /> : <ArrowDownRight size={11} color="#ef4444" />}
                            <span style={{ fontWeight: 700, color: up ? '#10b981' : '#ef4444' }}>{up ? '+' : ''}{s.changePercent?.toFixed(2)}%</span>
                          </div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>{up ? '+' : ''}₹{s.change?.toFixed(2)}</div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b' }}>
                          {s.volume != null ? (s.volume >= 1e6 ? `${(s.volume / 1e6).toFixed(1)}M` : `${(s.volume / 1e3).toFixed(0)}K`) : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 10, color: '#94a3b8' }}>
                          <div>H: ₹{s.high?.toFixed(0)}</div>
                          <div>L: ₹{s.low?.toFixed(0)}</div>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b' }}>{s.pe?.toFixed(1) ?? '—'}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#f0f9ff', color: '#0891b2' }}>{s.sector || '—'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ OPTIONS TAB ═══ */}
        {tab === 'options' && (
          <div style={{ animation: 'fadeUp 0.4s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {OPTIONS_SYMBOLS.map(s => (
                  <button key={s} onClick={() => setOptSym(s)} style={{
                    padding: '8px 16px', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    background: optSym === s ? 'linear-gradient(135deg,#0891b2,#06b6d4)' : '#f1f5f9',
                    color: optSym === s ? '#fff' : '#64748b',
                    boxShadow: optSym === s ? '0 3px 12px rgba(8,145,178,0.3)' : 'none',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
              {optData && (
                <div style={{ marginLeft: 'auto', fontSize: 12, color: '#64748b' }}>
                  Spot: <strong style={{ color: '#1e293b' }}>₹{optData.underlyingValue?.toLocaleString('en-IN')}</strong>
                  {optData.selectedExpiry && <span style={{ marginLeft: 10 }}>Expiry: <strong style={{ color: '#1e293b' }}>{optData.selectedExpiry}</strong></span>}
                </div>
              )}
            </div>

            {optError && (
              <div style={{ padding: '14px 18px', borderRadius: 12, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={14} /> {optError}
              </div>
            )}

            {optLoading && (
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <BarEqualizer bars={7} color="#0891b2" height={40} style={{ justifyContent: 'center', marginBottom: 12 }} />
                <p style={{ color: '#94a3b8', fontSize: 12 }}>Loading options chain for {optSym}…</p>
              </div>
            )}

            {optData && !optLoading && (
              optData.calls?.length > 0 || optData.puts?.length > 0 ? (
                <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th colSpan={4} style={{ background: '#f0fdf4', color: '#16a34a', textAlign: 'center', padding: 8, fontSize: 10, fontWeight: 700 }}>CALLS</th>
                        <th style={{ background: '#f0f9ff', textAlign: 'center', padding: 8, fontWeight: 800, color: '#0891b2' }}>STRIKE</th>
                        <th colSpan={4} style={{ background: '#fef2f2', color: '#dc2626', textAlign: 'center', padding: 8, fontSize: 10, fontWeight: 700 }}>PUTS</th>
                      </tr>
                      <tr style={{ background: '#f8fafc' }}>
                        <th style={{ padding: '6px 10px', fontSize: 9, color: '#94a3b8' }}>OI</th>
                        <th style={{ padding: '6px 10px', fontSize: 9, color: '#94a3b8' }}>Volume</th>
                        <th style={{ padding: '6px 10px', fontSize: 9, color: '#94a3b8' }}>IV%</th>
                        <th style={{ padding: '6px 10px', fontSize: 9, color: '#94a3b8' }}>LTP</th>
                        <th style={{ padding: '6px 10px', background: '#f0f9ff', textAlign: 'center', fontSize: 9, color: '#94a3b8' }}>₹</th>
                        <th style={{ padding: '6px 10px', fontSize: 9, color: '#94a3b8' }}>LTP</th>
                        <th style={{ padding: '6px 10px', fontSize: 9, color: '#94a3b8' }}>IV%</th>
                        <th style={{ padding: '6px 10px', fontSize: 9, color: '#94a3b8' }}>Volume</th>
                        <th style={{ padding: '6px 10px', fontSize: 9, color: '#94a3b8' }}>OI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {optData.calls?.map((call: any, i: number) => {
                        const put = optData.puts?.[i];
                        const atm = optData.underlyingValue && Math.abs(call.strike - optData.underlyingValue) < 200;
                        return (
                          <tr key={call.strike} style={{ background: atm ? '#fefce8' : i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f8fafc' }}>
                            <td style={{ padding: '7px 10px', color: '#10b981', fontSize: 11 }}>{call.oi != null ? (call.oi >= 1e6 ? `${(call.oi / 1e6).toFixed(1)}M` : `${(call.oi / 1e3).toFixed(0)}K`) : '—'}</td>
                            <td style={{ padding: '7px 10px', fontSize: 11 }}>{call.volume != null ? (call.volume / 1e3).toFixed(0) + 'K' : '—'}</td>
                            <td style={{ padding: '7px 10px', fontSize: 11 }}>{call.iv?.toFixed(1) ?? '—'}%</td>
                            <td style={{ padding: '7px 10px', fontWeight: 700, color: '#10b981' }}>₹{call.ltp?.toFixed(2) ?? '—'}</td>
                            <td style={{ padding: '7px 10px', background: atm ? '#fef9c3' : '#f0f9ff', textAlign: 'center', fontWeight: 800, fontSize: 12, color: '#0891b2' }}>{call.strike.toLocaleString('en-IN')}</td>
                            {put ? (
                              <>
                                <td style={{ padding: '7px 10px', fontWeight: 700, color: '#ef4444' }}>₹{put.ltp?.toFixed(2) ?? '—'}</td>
                                <td style={{ padding: '7px 10px', fontSize: 11 }}>{put.iv?.toFixed(1) ?? '—'}%</td>
                                <td style={{ padding: '7px 10px', fontSize: 11 }}>{put.volume != null ? (put.volume / 1e3).toFixed(0) + 'K' : '—'}</td>
                                <td style={{ padding: '7px 10px', color: '#ef4444', fontSize: 11 }}>{put.oi != null ? (put.oi >= 1e6 ? `${(put.oi / 1e6).toFixed(1)}M` : `${(put.oi / 1e3).toFixed(0)}K`) : '—'}</td>
                              </>
                            ) : <td colSpan={4} />}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                  <BarChart3 size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Options data unavailable</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>NSE API may be rate-limited. Try again in a few seconds.</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MarketPage;
