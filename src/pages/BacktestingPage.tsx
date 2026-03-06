import React, { useState, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useData } from '../contexts/DataContext';
import { Play, Download, AlertCircle, TrendingUp, TrendingDown, BarChart3, Target, Clock, ArrowUpRight, ArrowDownRight, Zap, Shield, Activity, ChevronRight } from 'lucide-react';
import { PerspectiveGrid, FlipCard, WaveProgress, NeonBorder, SlideReveal } from '../components/ui/AceternityEffects';

const STRATEGIES = ['MA Crossover', 'RSI Mean Reversion', 'Breakout Strategy', 'MACD Crossover'];
const POPULAR_SYMBOLS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS', 'WIPRO', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'MARUTI', 'BAJFINANCE', 'LT', 'NTPC', 'ONGC'];

interface Metric {
  totalReturn: number; annualizedReturn: number; sharpeRatio: number; sortinoRatio: number;
  maxDrawdown: number; winRate: number; totalTrades: number; avgWin: number; avgLoss: number;
  profitFactor: number; finalValue: number; initialCapital: number; calmarRatio: number;
}
interface EquityPoint { date: string; value: number }
interface Trade { date: string; type: string; price: number; shares: number; value: number; pnl?: number }

// ── Equity Curve SVG ──────────────────────────────────────────────────────
const EquityCurve: React.FC<{ data: EquityPoint[]; initialCapital: number }> = ({ data, initialCapital }) => {
  if (!data || data.length < 2) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>No chart data</div>
  );
  const vals = data.map(d => d.value);
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const W = 800, H = 200;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.value - min) / range) * (H - 30) - 15;
    return `${x},${y}`;
  }).join(' ');
  const bull = data[data.length - 1].value >= initialCapital;
  const c = bull ? '#10b981' : '#ef4444';
  const fid = `eq-fill-${Math.random().toString(36).slice(2)}`;
  const lid = `eq-line-${Math.random().toString(36).slice(2)}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 200, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={fid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.25" />
          <stop offset="100%" stopColor={c} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id={lid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={c} stopOpacity="0.3" />
          <stop offset="50%" stopColor={c} />
          <stop offset="100%" stopColor={c} />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(p => (
        <line key={p} x1={0} y1={H * p} x2={W} y2={H * p} stroke="#f1f5f9" strokeWidth={1} />
      ))}
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill={`url(#${fid})`} />
      <polyline points={pts} fill="none" stroke={`url(#${lid})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 2px 4px ${c}40)` }} />
      {/* End dot */}
      {data.length > 0 && (() => {
        const last = pts.split(' ').pop()?.split(',');
        if (!last) return null;
        return <circle cx={parseFloat(last[0])} cy={parseFloat(last[1])} r={4} fill={c} stroke="#fff" strokeWidth={2} />;
      })()}
    </svg>
  );
};

// ── Animated Gauge ────────────────────────────────────────────────────────
const Gauge: React.FC<{ value: number; max: number; label: string; color: string; suffix?: string }> = ({ value, max, label, color, suffix = '' }) => {
  const pct = Math.min(Math.abs(value) / max, 1);
  const r = 36, c = Math.PI * r; // semicircle
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={84} height={50} viewBox="0 0 84 50">
        <path d="M 6,44 A 36,36 0 0,1 78,44" fill="none" stroke="#f1f5f9" strokeWidth={6} strokeLinecap="round" />
        <path d="M 6,44 A 36,36 0 0,1 78,44" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 4px ${color}40)` }} />
      </svg>
      <div style={{ fontSize: 16, fontWeight: 800, color, marginTop: -4 }}>{typeof value === 'number' ? value.toFixed(value % 1 ? 2 : 0) : value}{suffix}</div>
      <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{label}</div>
    </div>
  );
};

const BacktestingPage: React.FC = () => {
  const { apiBase } = useData();
  const [symbol, setSymbol] = useState('RELIANCE');
  const [strategy, setStrategy] = useState('MA Crossover');
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [capital, setCapital] = useState('100000');
  const [brokerage, setBrokerage] = useState('0.05');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metric | null>(null);
  const [equityCurve, setEquityCurve] = useState<EquityPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [resultSymbol, setResultSymbol] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  const setQuick = (y: number) => { const e = new Date(), s = new Date(); s.setFullYear(s.getFullYear() - y); setStartDate(s.toISOString().slice(0, 10)); setEndDate(e.toISOString().slice(0, 10)); };

  const handleRun = async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true); setError(null); setMetrics(null); setEquityCurve([]); setTrades([]);
    try {
      const r = await fetch(`${apiBase}/api/backtest`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, strategy, startDate, endDate, capital: parseFloat(capital), brokerage: parseFloat(brokerage) }),
        signal: abortRef.current.signal
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || 'Backtest failed');
      setMetrics(d.metrics); setEquityCurve(d.equityCurve || []); setTrades(d.trades || []); setResultSymbol(d.symbol);
    } catch (e: any) { if (e.name !== 'AbortError') setError(e.message); }
    finally { setLoading(false); }
  };

  const handleDownload = () => {
    if (!trades.length) return;
    const csv = ['Date,Type,Price,Shares,Value,PnL', ...trades.map(t => `${t.date},${t.type},${t.price},${t.shares},${t.value},${t.pnl ?? ''}`)].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = `backtest_${symbol}.csv`; a.click();
  };

  const fmt = (n?: number, d = 2) => n != null ? n.toFixed(d) : '—';
  const fmtINR = (n?: number) => n != null ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #f1f5f9', fontSize: 13, fontWeight: 500, color: '#1e293b', background: '#fafbfc', outline: 'none', transition: 'all 0.2s' };
  const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.08)'; };
  const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none'; };

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes pulseGlow{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes floatSoft{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
      `}</style>

      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>

        {/* ═════════ HERO — PerspectiveGrid background ═════════ */}
        <PerspectiveGrid color="rgba(99,102,241,0.06)" style={{
          background: 'linear-gradient(135deg, #0c1222 0%, #1a1145 35%, #1e3a5f 65%, #0d4040 100%)',
          borderRadius: 20, padding: '28px 32px', marginBottom: 24, color: '#fff', position: 'relative',
        }}>
          {/* Floating decorative orbs */}
          <div style={{ position: 'absolute', right: 80, top: -20, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.2),transparent)', filter: 'blur(40px)', animation: 'floatSoft 7s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', left: '30%', bottom: -30, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(16,185,129,0.15),transparent)', filter: 'blur(50px)', animation: 'floatSoft 9s ease-in-out infinite 2s' }} />

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Backtesting Lab</h1>
                  <p style={{ fontSize: 11, opacity: 0.4, margin: 0 }}>Test strategies on Indian market historical data</p>
                </div>
              </div>
            </div>
            {metrics && (
              <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none' }}>
                <Download size={13} /> Export CSV
              </button>
            )}
          </div>
        </PerspectiveGrid>

        {/* ═════════ MAIN LAYOUT ═════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>

          {/* LEFT — Config Panel with NeonBorder */}
          <SlideReveal direction="left" duration={0.5}>
            <NeonBorder color="#6366f1" intensity={0.8}>
              <div style={{ background: '#fff', padding: 22, borderRadius: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={13} color="#6366f1" />
                  </div>
                  Configuration
                </div>

                {/* Strategy */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Strategy</label>
                  <select value={strategy} onChange={e => setStrategy(e.target.value)} onFocus={focusIn as any} onBlur={focusOut as any}
                    style={{ ...inputStyle, cursor: 'pointer' }}>
                    {STRATEGIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>

                {/* Symbol */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Symbol (NSE)</label>
                  <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="RELIANCE, TCS..."
                    onFocus={focusIn} onBlur={focusOut} style={inputStyle} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {POPULAR_SYMBOLS.slice(0, 8).map(s => (
                      <button key={s} onClick={() => setSymbol(s)} style={{
                        padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: symbol === s ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f8fafc',
                        color: symbol === s ? '#fff' : '#64748b', transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => { if (symbol !== s) { e.currentTarget.style.background = '#f1f5f9' } }}
                        onMouseLeave={e => { if (symbol !== s) { e.currentTarget.style.background = '#f8fafc' } }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Date Range</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} onFocus={focusIn} onBlur={focusOut} style={inputStyle} />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} onFocus={focusIn} onBlur={focusOut} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    {[1, 2, 3, 5].map(y => (
                      <button key={y} onClick={() => setQuick(y)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: '1px solid #f1f5f9', background: '#fafbfc', color: '#64748b', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.borderColor = '#e9d5ff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#f1f5f9' }}>
                        {y}Y
                      </button>
                    ))}
                  </div>
                </div>

                {/* Capital & Brokerage */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Capital (₹)</label>
                    <input type="number" value={capital} onChange={e => setCapital(e.target.value)} onFocus={focusIn} onBlur={focusOut} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Brokerage (%)</label>
                    <input type="number" step="0.01" value={brokerage} onChange={e => setBrokerage(e.target.value)} onFocus={focusIn} onBlur={focusOut} style={inputStyle} />
                  </div>
                </div>

                {/* Run Button */}
                <button onClick={handleRun} disabled={loading} style={{
                  width: '100%', padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 20px rgba(99,102,241,0.35)', transition: 'all 0.3s',
                  opacity: loading ? 0.7 : 1,
                }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.45)' } }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.35)' }}>
                  {loading ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />Running…</>
                    : <><Play size={15} fill="currentColor" /> Run Backtest</>}
                </button>

                {loading && <WaveProgress progress={70} color="#6366f1" height={4} style={{ marginTop: 10, borderRadius: 4 }} />}

                {error && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertCircle size={13} /> {error}
                  </div>
                )}
              </div>
            </NeonBorder>
          </SlideReveal>

          {/* RIGHT — Results */}
          <div>
            {!metrics && !loading ? (
              <SlideReveal direction="right" duration={0.5}>
                <NeonBorder color="#10b981" intensity={0.5}>
                  <div style={{ background: '#fff', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
                    <div style={{ animation: 'floatSoft 4s ease-in-out infinite', marginBottom: 16 }}>
                      <BarChart3 size={48} color="#cbd5e1" style={{ margin: '0 auto' }} />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>Ready to Backtest</h3>
                    <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                      Configure a strategy on the left and click <strong>Run Backtest</strong> to see performance metrics, equity curves, and trade logs.
                    </p>
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 28 }}>
                      {[
                        { icon: Activity, label: 'Performance', color: '#3b82f6' },
                        { icon: Shield, label: 'Risk Analysis', color: '#10b981' },
                        { icon: Clock, label: 'Trade History', color: '#f59e0b' },
                      ].map((f, i) => (
                        <div key={f.label} style={{ textAlign: 'center', animation: `fadeUp 0.5s ease ${i * 0.1}s both` }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' }}>
                            <f.icon size={18} color={f.color} />
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{f.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </NeonBorder>
              </SlideReveal>
            ) : (
              metrics && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Result Header */}
                  <SlideReveal direction="right" duration={0.4}>
                    <PerspectiveGrid color="rgba(255,255,255,0.04)" style={{
                      background: metrics.totalReturn >= 0
                        ? 'linear-gradient(135deg,#064e3b,#065f46,#047857)'
                        : 'linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c)',
                      borderRadius: 16, padding: '22px 26px', color: '#fff',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, position: 'relative', zIndex: 2 }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>Total Return</div>
                          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1 }}>
                            {metrics.totalReturn >= 0 ? '+' : ''}{fmt(metrics.totalReturn)}%
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{fmt(metrics.annualizedReturn)}% CAGR · {resultSymbol} · {strategy}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 24 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Final Value</div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{fmtINR(metrics.finalValue)}</div>
                            <div style={{ fontSize: 11, opacity: 0.5 }}>from {fmtINR(metrics.initialCapital)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Trades</div>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{metrics.totalTrades}</div>
                            <div style={{ fontSize: 11, opacity: 0.5 }}>Win rate {fmt(metrics.winRate, 1)}%</div>
                          </div>
                        </div>
                      </div>
                    </PerspectiveGrid>
                  </SlideReveal>

                  {/* FlipCards — hover to see details */}
                  <SlideReveal direction="up" delay={0.1}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                      {[
                        {
                          label: 'Sharpe', value: fmt(metrics.sharpeRatio), ok: metrics.sharpeRatio >= 1, color: '#3b82f6',
                          back: `Risk-adjusted return measure. ${metrics.sharpeRatio >= 1 ? 'Good' : 'Needs improvement'} (>1 is ideal)`, backIcon: Activity
                        },
                        {
                          label: 'Max DD', value: `${fmt(metrics.maxDrawdown)}%`, ok: metrics.maxDrawdown > -20, color: '#ef4444',
                          back: `Max peak-to-trough loss: ${fmt(metrics.maxDrawdown)}%. ${metrics.maxDrawdown > -20 ? 'Acceptable' : 'High risk'}`, backIcon: TrendingDown
                        },
                        {
                          label: 'Win Rate', value: `${fmt(metrics.winRate, 1)}%`, ok: metrics.winRate >= 50, color: '#10b981',
                          back: `${metrics.totalTrades} total trades. Avg win: ${fmtINR(metrics.avgWin)}, Avg loss: ${fmtINR(metrics.avgLoss)}`, backIcon: Target
                        },
                        {
                          label: 'Profit Factor', value: fmt(metrics.profitFactor), ok: metrics.profitFactor >= 1, color: '#8b5cf6',
                          back: `Gross profit / gross loss ratio. ${metrics.profitFactor >= 1.5 ? 'Excellent' : metrics.profitFactor >= 1 ? 'Positive' : 'Losing'}`, backIcon: Zap
                        },
                      ].map((s, i) => (
                        <FlipCard key={s.label} height={110}
                          front={
                            <div style={{ height: '100%', background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', animation: `fadeUp 0.4s ease ${i * 0.08}s both` }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                              <div style={{ fontSize: 26, fontWeight: 800, color: s.ok ? s.color : '#ef4444' }}>{s.value}</div>
                              <div style={{ fontSize: 10, color: s.ok ? '#10b981' : '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                                {s.ok ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {s.ok ? 'Good' : 'Needs work'}
                              </div>
                            </div>
                          }
                          back={
                            <div style={{ height: '100%', background: `linear-gradient(135deg,${s.color}10,${s.color}05)`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6, border: `1px solid ${s.color}20` }}>
                              <s.backIcon size={16} color={s.color} />
                              <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{s.back}</div>
                            </div>
                          }
                        />
                      ))}
                    </div>
                  </SlideReveal>

                  {/* Equity Curve */}
                  <SlideReveal direction="up" delay={0.2}>
                    <NeonBorder color={metrics.totalReturn >= 0 ? '#10b981' : '#ef4444'} intensity={0.6}>
                      <div style={{ background: '#fff', borderRadius: 16, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TrendingUp size={15} color="#6366f1" /> Portfolio Equity Curve
                          </div>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{equityCurve.length} data points</span>
                        </div>
                        <EquityCurve data={equityCurve} initialCapital={metrics.initialCapital} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                          <span>{equityCurve[0]?.date}</span>
                          <span>{equityCurve[equityCurve.length - 1]?.date}</span>
                        </div>
                      </div>
                    </NeonBorder>
                  </SlideReveal>

                  {/* Gauges Row */}
                  <SlideReveal direction="up" delay={0.3}>
                    <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 16, padding: '20px 24px', display: 'flex', justifyContent: 'space-around' }}>
                      <Gauge value={metrics.sharpeRatio} max={3} label="Sharpe" color="#3b82f6" />
                      <Gauge value={metrics.sortinoRatio} max={3} label="Sortino" color="#8b5cf6" />
                      <Gauge value={Math.abs(metrics.maxDrawdown)} max={50} label="Max DD" color="#ef4444" suffix="%" />
                      <Gauge value={metrics.calmarRatio} max={3} label="Calmar" color="#f59e0b" />
                      <Gauge value={metrics.winRate} max={100} label="Win Rate" color="#10b981" suffix="%" />
                    </div>
                  </SlideReveal>

                  {/* Trade Stats + Risk — 2 cols */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <SlideReveal direction="left" delay={0.35}>
                      <NeonBorder color="#3b82f6" intensity={0.5}>
                        <div style={{ background: '#fff', borderRadius: 16, padding: 18 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <BarChart3 size={14} color="#3b82f6" /> Trade Statistics
                          </div>
                          {[
                            ['Total Trades', metrics.totalTrades],
                            ['Win Rate', `${fmt(metrics.winRate, 1)}%`],
                            ['Avg Win', `₹${fmt(metrics.avgWin, 0)}`],
                            ['Avg Loss', `₹${fmt(metrics.avgLoss, 0)}`],
                            ['Profit Factor', fmt(metrics.profitFactor)],
                          ].map(([k, v], i) => (
                            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none', fontSize: 13 }}>
                              <span style={{ color: '#64748b' }}>{k}</span>
                              <span style={{ fontWeight: 700, color: '#1e293b' }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </NeonBorder>
                    </SlideReveal>

                    <SlideReveal direction="right" delay={0.35}>
                      <NeonBorder color="#10b981" intensity={0.5}>
                        <div style={{ background: '#fff', borderRadius: 16, padding: 18 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Shield size={14} color="#10b981" /> Risk Metrics
                          </div>
                          {[
                            ['Sharpe Ratio', fmt(metrics.sharpeRatio)],
                            ['Sortino Ratio', fmt(metrics.sortinoRatio)],
                            ['Max Drawdown', `${fmt(metrics.maxDrawdown)}%`],
                            ['Calmar Ratio', fmt(metrics.calmarRatio)],
                            ['Annualised Return', `${fmt(metrics.annualizedReturn)}%`],
                          ].map(([k, v], i) => (
                            <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid #f8fafc' : 'none', fontSize: 13 }}>
                              <span style={{ color: '#64748b' }}>{k}</span>
                              <span style={{ fontWeight: 700, color: '#1e293b' }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </NeonBorder>
                    </SlideReveal>
                  </div>

                  {/* Trade Log */}
                  {trades.length > 0 && (
                    <SlideReveal direction="up" delay={0.4}>
                      <NeonBorder color="#f59e0b" intensity={0.4}>
                        <div style={{ background: '#fff', borderRadius: 16, padding: 18 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Clock size={14} color="#f59e0b" /> Trade Log
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fffbeb', color: '#d97706' }}>{trades.length} trades</span>
                            </div>
                          </div>
                          <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #f8fafc' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  {['Date', 'Type', 'Price (₹)', 'Shares', 'Value (₹)', 'P&L (₹)'].map(h => (
                                    <th key={h} style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#94a3b8', textAlign: 'left', borderBottom: '2px solid #f1f5f9', background: '#fafbfc' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {trades.slice().reverse().slice(0, 20).map((t, i) => (
                                  <tr key={i} style={{ transition: 'background 0.2s', cursor: 'default' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = t.type === 'BUY' ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)' }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#475569', borderBottom: '1px solid #fafbfc' }}>{t.date}</td>
                                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #fafbfc' }}>
                                      <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                        background: t.type === 'BUY' ? '#dcfce7' : '#fef2f2', color: t.type === 'BUY' ? '#16a34a' : '#dc2626'
                                      }}>
                                        {t.type === 'BUY' ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {t.type}
                                      </span>
                                    </td>
                                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#475569', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #fafbfc' }}>₹{t.price.toLocaleString('en-IN')}</td>
                                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#475569', borderBottom: '1px solid #fafbfc' }}>{t.shares.toFixed(2)}</td>
                                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#475569', fontVariantNumeric: 'tabular-nums', borderBottom: '1px solid #fafbfc' }}>₹{t.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                                    <td style={{
                                      padding: '10px 12px', fontSize: 12, fontWeight: 700, borderBottom: '1px solid #fafbfc',
                                      color: t.pnl != null ? (t.pnl >= 0 ? '#10b981' : '#ef4444') : '#94a3b8'
                                    }}>
                                      {t.pnl != null ? `${t.pnl >= 0 ? '+' : ''}₹${t.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {trades.length > 20 && <div style={{ textAlign: 'center', padding: '10px 0 4px', fontSize: 11, color: '#94a3b8' }}>Showing 20 of {trades.length} trades · Export CSV for full log</div>}
                        </div>
                      </NeonBorder>
                    </SlideReveal>
                  )}
                </div>
              )
            )}

            {loading && (
              <SlideReveal direction="right" duration={0.3}>
                <div style={{ background: '#fff', borderRadius: 16, padding: '60px 24px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                  <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: '0 0 4px' }}>Running backtest on {symbol}…</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Fetching historical data & computing metrics</p>
                  <WaveProgress progress={60} color="#6366f1" height={6} style={{ marginTop: 20, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }} />
                </div>
              </SlideReveal>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BacktestingPage;