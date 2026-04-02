import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useData } from '../contexts/DataContext';
import LiveOptionsChain from '../components/OptionsChain/LiveOptionsChain';
import {
  Eye, RefreshCw, Search, AlertCircle, TrendingUp, TrendingDown,
  Zap, Target, BarChart3, ChevronDown
} from 'lucide-react';
import { ScanLine, BarEqualizer, WaveformLine, HolographicCard } from '../components/ui/AceternityEffects';

const INDEX_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
const EQUITY_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY', 'SBIN', 'BAJFINANCE',
  'TATAMOTORS', 'LT', 'AXISBANK', 'MARUTI', 'SUNPHARMA', 'WIPRO', 'HCLTECH',
  'TATASTEEL', 'HINDALCO', 'ONGC', 'NTPC', 'ITC', 'BHARTIARTL',
  'ADANIENT', 'KOTAKBANK', 'TITAN', 'JSWSTEEL',
];

/* ── Color helpers for profit/loss ── */
const profitColor = (val: number | null | undefined) => {
  if (val == null || val === 0) return '#64748b';
  return val > 0 ? '#10b981' : '#ef4444';
};
const profitBg = (val: number | null | undefined) => {
  if (val == null || val === 0) return 'transparent';
  return val > 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)';
};

const OptionChainPage: React.FC = () => {
  const { apiBase, isMarketOpen } = useData();
  const [symbol, setSymbol] = useState('NIFTY');
  const [expiry, setExpiry] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showAllStrikes, setShowAllStrikes] = useState(false);
  const [liveMode, setLiveMode] = useState(true); // Default to live WebSocket mode
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const atmRowRef = useRef<HTMLTableRowElement>(null);

  // Close dropdown on outside click
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const loadOptions = useCallback(async (sym: string, exp?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = exp ? `${apiBase}/api/options/${sym}?expiry=${encodeURIComponent(exp)}` : `${apiBase}/api/options/${sym}`;
      const res = await fetch(url);
      const d = await res.json();
      setData(d);
      if (d.error) setError(d.error);
      if (!exp && d.selectedExpiry) setExpiry(d.selectedExpiry);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  // Load when symbol changes
  useEffect(() => { setExpiry(''); loadOptions(symbol); }, [symbol]);

  // Load when user picks a different expiry
  const handleExpiryChange = (newExpiry: string) => {
    setExpiry(newExpiry);
    loadOptions(symbol, newExpiry);
  };

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => loadOptions(symbol, expiry || undefined), 30000);
    return () => clearInterval(id);
  }, [autoRefresh, symbol, expiry, loadOptions]);

  const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const fmtNum = (v: number | null | undefined) => {
    if (v == null) return '—';
    if (Math.abs(v) >= 1e7) return `${(v / 1e7).toFixed(2)}Cr`;
    if (Math.abs(v) >= 1e5) return `${(v / 1e5).toFixed(2)}L`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toLocaleString('en-IN');
  };

  const summary = data?.summary || {};
  const spot = data?.underlyingValue || 0;
  const rawCalls: any[] = data?.calls || [];
  const rawPuts: any[] = data?.puts || [];

  // Filter out strikes where BOTH CE and PE have zero OI, volume, and LTP
  const { calls, puts } = useMemo(() => {
    if (showAllStrikes) return { calls: rawCalls, puts: rawPuts };
    const activeStrikes = new Set<number>();
    for (const c of rawCalls) {
      if ((c.oi > 0) || (c.volume > 0) || (c.ltp > 0)) activeStrikes.add(c.strike);
    }
    for (const p of rawPuts) {
      if ((p.oi > 0) || (p.volume > 0) || (p.ltp > 0)) activeStrikes.add(p.strike);
    }
    return {
      calls: rawCalls.filter((c: any) => activeStrikes.has(c.strike)),
      puts: rawPuts.filter((p: any) => activeStrikes.has(p.strike)),
    };
  }, [rawCalls, rawPuts, showAllStrikes]);

  const maxOi = Math.max(...calls.map((c: any) => c.oi || 0), ...puts.map((p: any) => p.oi || 0), 1);

  const pcrColor = summary.pcr > 1.2 ? '#10b981' : summary.pcr < 0.8 ? '#ef4444' : '#f59e0b';
  const pcrLabel = summary.pcr > 1.2 ? 'Bullish' : summary.pcr < 0.8 ? 'Bearish' : 'Neutral';

  // Auto-scroll to ATM strike when data loads
  useEffect(() => {
    if (atmRowRef.current) {
      setTimeout(() => {
        atmRowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, [data, showAllStrikes]);

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
      `}</style>

      <div style={{ maxWidth: 1500, padding: '24px 28px', margin: '0 auto' }}>

        {/* ═══ HERO BANNER ═══ */}
        <ScanLine color="rgba(139,92,246,0.12)" speed={5} style={{
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #312e81 70%, #4c1d95 100%)',
          borderRadius: 20, padding: '24px 28px', marginBottom: 16, color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Eye size={18} color="#a78bfa" />
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>NSE Option Chain</h1>
                  <p style={{ fontSize: 11, opacity: 0.4, margin: 0 }}>Live options data with OI analysis · {fmtTime(now)}</p>
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
              {data?.cachedAt && (
                <span style={{ fontSize: 9, color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: 6 }}>
                  Cached: {data.cachedAt}
                </span>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94a3b8', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)}
                  style={{ accentColor: '#8b5cf6' }} />
                Auto-refresh
              </label>
              <button onClick={() => loadOptions(symbol, expiry || undefined)} disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
                <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>
        </ScanLine>

        <WaveformLine color="#8b5cf6" amplitude={12} frequency={4} speed={3} height={30}
          style={{ borderRadius: 10, marginBottom: 16, background: '#0f172a' }} />

        {/* ═══ MODE TOGGLE ═══ */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <button onClick={() => setLiveMode(true)} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: liveMode ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${liveMode ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
            color: liveMode ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.2s',
          }}>
            <Zap size={12} /> LIVE (WebSocket)
          </button>
          <button onClick={() => setLiveMode(false)} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: !liveMode ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${!liveMode ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
            color: !liveMode ? '#a78bfa' : '#64748b', display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.2s',
          }}>
            <RefreshCw size={12} /> Legacy (REST)
          </button>
        </div>

        {/* ═══ LIVE MODE ═══ */}
        {liveMode ? (
          <LiveOptionsChain />
        ) : (
        <>

        {/* ═══ CONTROLS ═══ */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center', animation: 'fadeUp 0.4s ease both' }}>
          {/* Symbol selector */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button onClick={() => setSearchOpen(!searchOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 12,
              border: '2px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 800,
              color: '#1e293b', minWidth: 160, justifyContent: 'space-between',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: INDEX_SYMBOLS.includes(symbol) ? '#8b5cf6' : '#06b6d4' }} />
                {symbol}
              </span>
              <ChevronDown size={14} color="#94a3b8" style={{ transform: searchOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
            </button>
          </div>

          {/* Dropdown portal - rendered into document.body to escape all stacking contexts */}
          {searchOpen && ReactDOM.createPortal(
            <>
              {/* Backdrop to catch outside clicks */}
              <div onClick={() => setSearchOpen(false)} style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99998,
              }} />
              <div style={{
                position: 'fixed',
                top: (dropdownRef.current?.getBoundingClientRect().bottom ?? 150) + 4,
                left: dropdownRef.current?.getBoundingClientRect().left ?? 300,
                width: 280, maxHeight: 450,
                background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0',
                boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                zIndex: 99999, overflow: 'hidden',
              }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search symbol…"
                      autoFocus style={{
                        width: '100%', padding: '8px 8px 8px 30px', border: '1px solid #e2e8f0', borderRadius: 8,
                        fontSize: 12, outline: 'none', color: '#1e293b',
                      }} />
                  </div>
                </div>
                <div style={{ maxHeight: 370, overflowY: 'auto', overflowX: 'hidden' }}>
                  {INDEX_SYMBOLS.filter(s => !searchQ || s.includes(searchQ.toUpperCase())).length > 0 && (
                    <div style={{ padding: '6px 12px', fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Indices</div>
                  )}
                  {INDEX_SYMBOLS.filter(s => !searchQ || s.includes(searchQ.toUpperCase())).map(s => (
                    <button key={s} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setSymbol(s); setSearchOpen(false); setSearchQ(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none',
                        background: symbol === s ? '#f0f9ff' : 'transparent',
                        fontSize: 13, fontWeight: 700, color: '#1e293b', cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0f9ff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = symbol === s ? '#f0f9ff' : 'transparent' }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6' }} />
                      {s}
                      {symbol === s && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#8b5cf6' }}>✓</span>}
                    </button>
                  ))}
                  {EQUITY_SYMBOLS.filter(s => !searchQ || s.includes(searchQ.toUpperCase())).length > 0 && (
                    <div style={{ padding: '6px 12px', fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, borderTop: '1px solid #f1f5f9' }}>Equities</div>
                  )}
                  {EQUITY_SYMBOLS.filter(s => !searchQ || s.includes(searchQ.toUpperCase())).map(s => (
                    <button key={s} onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setSymbol(s); setSearchOpen(false); setSearchQ(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none',
                        background: symbol === s ? '#f0f9ff' : 'transparent',
                        fontSize: 13, fontWeight: 600, color: '#1e293b', cursor: 'pointer', textAlign: 'left',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0f9ff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = symbol === s ? '#f0f9ff' : 'transparent' }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4' }} />
                      {s}
                      {symbol === s && <span style={{ marginLeft: 'auto', fontSize: 9, color: '#06b6d4' }}>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </>,
            document.body
          )}

          {/* Expiry selector — uses handleExpiryChange to avoid infinite loop */}
          {data?.expiryDates && data.expiryDates.length > 0 && (
            <select
              value={expiry || data.selectedExpiry || ''}
              onChange={e => handleExpiryChange(e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 12, border: '2px solid #e2e8f0', background: '#fff',
                fontSize: 12, fontWeight: 700, color: '#1e293b', cursor: 'pointer', outline: 'none',
                minWidth: 130,
              }}
            >
              {data.expiryDates.map((d: string) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          {/* Spot price */}
          {spot > 0 && (
            <div style={{
              marginLeft: 'auto', padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#fff', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Zap size={14} color="#f59e0b" />
              Spot: ₹{spot.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
          )}

          {/* Show All / Active Only toggle */}
          {data && !loading && (
            <label style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
              color: '#64748b', cursor: 'pointer', padding: '8px 14px', borderRadius: 10,
              border: '1px solid #e2e8f0', background: showAllStrikes ? '#fef3c7' : '#f0fdf4',
            }}>
              <input type="checkbox" checked={showAllStrikes} onChange={e => setShowAllStrikes(e.target.checked)}
                style={{ accentColor: '#8b5cf6' }} />
              {showAllStrikes ? `All (${rawCalls.length})` : `Active (${calls.length})`}
            </label>
          )}
        </div>

        {/* ═══ SUMMARY CARDS ═══ */}
        {data && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16, animation: 'fadeUp 0.4s ease 0.1s both' }}>
            {[
              { label: 'PCR (OI)', value: summary.pcr?.toFixed(4) || '—', sub: pcrLabel, color: pcrColor, icon: Target },
              { label: 'Max Pain', value: summary.maxPain ? `₹${summary.maxPain.toLocaleString('en-IN')}` : '—', sub: 'Strike', color: '#8b5cf6', icon: Target },
              { label: 'Total CE OI', value: fmtNum(summary.totalCeOi), sub: 'Call Side', color: '#10b981', icon: TrendingUp },
              { label: 'Total PE OI', value: fmtNum(summary.totalPeOi), sub: 'Put Side', color: '#ef4444', icon: TrendingDown },
              { label: 'CE/PE Volume', value: `${fmtNum(summary.totalCeVolume)} / ${fmtNum(summary.totalPeVolume)}`, sub: 'Traded', color: '#06b6d4', icon: BarChart3 },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <HolographicCard key={card.label} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', animation: `scaleIn 0.3s ease ${i * 0.05}s both` }}>
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${card.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={13} color={card.color} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{card.label}</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: card.color, marginBottom: 2 }}>{card.value}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{card.sub}</div>
                  </div>
                </HolographicCard>
              );
            })}
          </div>
        )}

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <BarEqualizer bars={7} color="#8b5cf6" height={40} style={{ justifyContent: 'center', marginBottom: 12 }} />
            <p style={{ color: '#94a3b8', fontSize: 12 }}>Loading option chain for {symbol}…</p>
          </div>
        )}

        {/* ═══ OPTION CHAIN TABLE ═══ */}
        {data && !loading && (calls.length > 0 || puts.length > 0) && (
          <div ref={tableContainerRef} style={{ borderRadius: 16, border: '1px solid #e2e8f0', animation: 'fadeUp 0.4s ease 0.2s both', maxHeight: '65vh', overflowY: 'auto', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                <tr>
                  <th colSpan={7} style={{ background: 'linear-gradient(90deg, #dcfce7, #f0fdf4)', color: '#16a34a', textAlign: 'center', padding: '10px 8px', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <TrendingUp size={12} /> CALLS (CE)
                    </div>
                  </th>
                  <th style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', textAlign: 'center', padding: '10px 8px', fontWeight: 900, color: '#f59e0b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>STRIKE</th>
                  <th colSpan={7} style={{ background: 'linear-gradient(90deg, #fef2f2, #fecaca40)', color: '#dc2626', textAlign: 'center', padding: '10px 8px', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      PUTS (PE) <TrendingDown size={12} />
                    </div>
                  </th>
                </tr>
                <tr style={{ background: '#f8fafc' }}>
                  {['OI Chg', 'OI', 'Volume', 'IV%', 'Chg%', 'LTP', 'Bid/Ask'].map(h => (
                    <th key={`ce-${h}`} style={{ padding: '6px 8px', fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                  <th style={{ padding: '6px 8px', background: '#f0f9ff', textAlign: 'center', fontSize: 9, color: '#0891b2', fontWeight: 800 }}>₹</th>
                  {['Bid/Ask', 'LTP', 'Chg%', 'IV%', 'Volume', 'OI', 'OI Chg'].map(h => (
                    <th key={`pe-${h}`} style={{ padding: '6px 8px', fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calls.map((call: any, i: number) => {
                  const put = puts.find((p: any) => p.strike === call.strike) || puts[i];
                  const atm = spot > 0 && Math.abs(call.strike - spot) <= (INDEX_SYMBOLS.includes(symbol) ? 100 : spot * 0.01);
                  const ceItm = spot > 0 && call.strike < spot;
                  const peItm = spot > 0 && put && call.strike > spot;
                  const ceOiPct = call.oi ? (call.oi / maxOi) * 100 : 0;
                  const peOiPct = put?.oi ? (put.oi / maxOi) * 100 : 0;

                  return (
                    <tr key={call.strike}
                      ref={atm ? atmRowRef : undefined}
                      id={atm ? 'atm-strike' : undefined}
                      style={{
                      background: atm ? '#fefce8' : ceItm ? 'rgba(16,185,129,0.03)' : peItm ? 'rgba(239,68,68,0.03)' : i % 2 === 0 ? '#fff' : '#fafbfc',
                      borderBottom: atm ? '2px solid #f59e0b' : '1px solid #f1f5f9', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = atm ? '#fef9c3' : '#f0f9ff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = atm ? '#fefce8' : ceItm ? 'rgba(16,185,129,0.03)' : peItm ? 'rgba(239,68,68,0.03)' : i % 2 === 0 ? '#fff' : '#fafbfc' }}
                    >
                      {/* CE OI Change — green/red */}
                      <td style={{ padding: '7px 8px', fontSize: 10, color: profitColor(call.oiChange), fontWeight: 600, background: profitBg(call.oiChange) }}>
                        {call.oiChange != null ? `${call.oiChange >= 0 ? '+' : ''}${fmtNum(call.oiChange)}` : '—'}
                      </td>
                      {/* CE OI with bar */}
                      <td style={{ padding: '7px 8px', position: 'relative' }}>
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${ceOiPct}%`, background: 'rgba(16,185,129,0.08)', transition: 'width 0.5s' }} />
                        <span style={{ position: 'relative', fontSize: 11, fontWeight: 700, color: '#10b981' }}>{fmtNum(call.oi)}</span>
                      </td>
                      <td style={{ padding: '7px 8px', fontSize: 10, color: '#475569' }}>{fmtNum(call.volume)}</td>
                      <td style={{ padding: '7px 8px', fontSize: 10, color: '#475569' }}>{call.iv?.toFixed(1) ?? '—'}</td>
                      {/* CE Change% — GREEN if profit, RED if loss */}
                      <td style={{ padding: '7px 8px', fontSize: 10, color: profitColor(call.changePct), fontWeight: 700, background: profitBg(call.changePct) }}>
                        {call.changePct != null ? `${call.changePct >= 0 ? '+' : ''}${call.changePct.toFixed(2)}%` : '—'}
                      </td>
                      {/* CE LTP — colored by change direction */}
                      <td style={{ padding: '7px 8px', fontWeight: 800, color: profitColor(call.change), fontSize: 12, background: profitBg(call.change) }}>
                        ₹{call.ltp?.toFixed(2) ?? '—'}
                      </td>
                      <td style={{ padding: '7px 8px', fontSize: 9, color: '#94a3b8' }}>
                        {call.bidPrice?.toFixed(1) ?? '—'}/{call.askPrice?.toFixed(1) ?? '—'}
                      </td>

                      {/* STRIKE */}
                      <td style={{
                        padding: '7px 8px', textAlign: 'center', fontWeight: 900, fontSize: 12,
                        background: atm ? '#f59e0b' : '#f0f9ff',
                        color: atm ? '#fff' : '#0891b2',
                        borderLeft: '2px solid #e2e8f0', borderRight: '2px solid #e2e8f0',
                      }}>
                        {call.strike.toLocaleString('en-IN')}
                        {atm && <span style={{ display: 'block', fontSize: 7, fontWeight: 700, opacity: 0.8 }}>ATM</span>}
                      </td>

                      {/* PE side */}
                      {put ? (
                        <>
                          <td style={{ padding: '7px 8px', fontSize: 9, color: '#94a3b8' }}>
                            {put.bidPrice?.toFixed(1) ?? '—'}/{put.askPrice?.toFixed(1) ?? '—'}
                          </td>
                          {/* PE LTP — colored by change direction */}
                          <td style={{ padding: '7px 8px', fontWeight: 800, color: profitColor(put.change), fontSize: 12, background: profitBg(put.change) }}>
                            ₹{put.ltp?.toFixed(2) ?? '—'}
                          </td>
                          {/* PE Change% — GREEN if profit, RED if loss */}
                          <td style={{ padding: '7px 8px', fontSize: 10, color: profitColor(put.changePct), fontWeight: 700, background: profitBg(put.changePct) }}>
                            {put.changePct != null ? `${put.changePct >= 0 ? '+' : ''}${put.changePct.toFixed(2)}%` : '—'}
                          </td>
                          <td style={{ padding: '7px 8px', fontSize: 10, color: '#475569' }}>{put.iv?.toFixed(1) ?? '—'}</td>
                          <td style={{ padding: '7px 8px', fontSize: 10, color: '#475569' }}>{fmtNum(put.volume)}</td>
                          <td style={{ padding: '7px 8px', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${peOiPct}%`, background: 'rgba(239,68,68,0.08)', transition: 'width 0.5s' }} />
                            <span style={{ position: 'relative', fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{fmtNum(put.oi)}</span>
                          </td>
                          {/* PE OI Change — green/red */}
                          <td style={{ padding: '7px 8px', fontSize: 10, color: profitColor(put.oiChange), fontWeight: 600, background: profitBg(put.oiChange) }}>
                            {put.oiChange != null ? `${put.oiChange >= 0 ? '+' : ''}${fmtNum(put.oiChange)}` : '—'}
                          </td>
                        </>
                      ) : <td colSpan={7} />}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && !loading && calls.length === 0 && puts.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '48px 24px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
            <BarChart3 size={36} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
            <p style={{ fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
              {data?.market_closed ? 'Market is Closed' : 'Options data unavailable'}
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8' }}>
              {data?.market_closed
                ? 'NSE option chain data is available during market hours (9:15 AM - 3:30 PM IST). Please try again when the market is open.'
                : 'NSE data could not be loaded. Please try refreshing in a few seconds.'}
            </p>
          </div>
        )}
        </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OptionChainPage;
