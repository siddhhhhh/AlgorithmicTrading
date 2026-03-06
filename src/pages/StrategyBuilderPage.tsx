import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useData } from '../contexts/DataContext';
import { Plus, Play, Save, Trash2, AlertCircle, TrendingUp, BarChart3, Zap, Target, ArrowRight, Shield, CheckCircle } from 'lucide-react';
import { AuroraGlow, SpringCard, BorderBeam, GlitchText, RevealMask } from '../components/ui/AceternityEffects';

// ── Types ──────────────────────────────────────────────────────────────────
type Op = '>' | '<' | '>=' | '<=' | 'crosses_above' | 'crosses_below';
type IndicatorType = 'rsi' | 'sma' | 'ema' | 'macd' | 'price' | 'volume';

interface Condition {
  id: string; indicator: IndicatorType; period: number; op: Op; value: number;
  compareWith: 'number' | 'indicator'; compareIndicator?: IndicatorType; comparePeriod?: number;
}
interface StrategyConfig {
  name: string; symbol: string; timeframe: string;
  entryConditions: Condition[]; exitConditions: Condition[];
  positionSize: number; stopLoss: number; takeProfit: number;
}

const IND: Record<IndicatorType, string> = { rsi: 'RSI', sma: 'SMA', ema: 'EMA', macd: 'MACD', price: 'Price', volume: 'Volume' };
const OPS: { val: Op; label: string }[] = [
  { val: '>', label: '>' }, { val: '<', label: '<' }, { val: '>=', label: '>=' }, { val: '<=', label: '<=' },
  { val: 'crosses_above', label: 'Crosses ↑' }, { val: 'crosses_below', label: 'Crosses ↓' },
];

const TEMPLATES = [
  {
    id: 'ma-crossover', name: 'MA Crossover', desc: 'EMA20 crosses above EMA50', icon: TrendingUp, color: '#3b82f6', bg: 'linear-gradient(135deg,#1e3a8a,#2563eb)', emoji: '📈', chartType: 'ma',
    config: {
      entryConditions: [{ id: '1', indicator: 'ema' as IndicatorType, period: 20, op: 'crosses_above' as Op, value: 0, compareWith: 'indicator' as const, compareIndicator: 'ema' as IndicatorType, comparePeriod: 50 }],
      exitConditions: [{ id: '2', indicator: 'ema' as IndicatorType, period: 20, op: 'crosses_below' as Op, value: 0, compareWith: 'indicator' as const, compareIndicator: 'ema' as IndicatorType, comparePeriod: 50 }]
    }
  },
  {
    id: 'rsi-reversion', name: 'RSI Reversion', desc: 'Buy RSI<30, sell RSI>70', icon: BarChart3, color: '#10b981', bg: 'linear-gradient(135deg,#064e3b,#059669)', emoji: '🔄', chartType: 'rsi',
    config: {
      entryConditions: [{ id: '1', indicator: 'rsi' as IndicatorType, period: 14, op: '<' as Op, value: 30, compareWith: 'number' as const }],
      exitConditions: [{ id: '2', indicator: 'rsi' as IndicatorType, period: 14, op: '>' as Op, value: 70, compareWith: 'number' as const }]
    }
  },
  {
    id: 'breakout', name: 'Breakout', desc: '20-day high breakout', icon: Zap, color: '#8b5cf6', bg: 'linear-gradient(135deg,#4c1d95,#7c3aed)', emoji: '⚡', chartType: 'ma',
    config: {
      entryConditions: [{ id: '1', indicator: 'price' as IndicatorType, period: 20, op: 'crosses_above' as Op, value: 0, compareWith: 'indicator' as const, compareIndicator: 'sma' as IndicatorType, comparePeriod: 20 }],
      exitConditions: [{ id: '2', indicator: 'price' as IndicatorType, period: 1, op: '<' as Op, value: 0, compareWith: 'indicator' as const, compareIndicator: 'sma' as IndicatorType, comparePeriod: 20 }]
    }
  },
  {
    id: 'macd', name: 'MACD Cross', desc: 'MACD crosses signal line', icon: Target, color: '#f59e0b', bg: 'linear-gradient(135deg,#78350f,#d97706)', emoji: '🎯', chartType: 'macd',
    config: {
      entryConditions: [{ id: '1', indicator: 'macd' as IndicatorType, period: 12, op: 'crosses_above' as Op, value: 0, compareWith: 'number' as const }],
      exitConditions: [{ id: '2', indicator: 'macd' as IndicatorType, period: 12, op: 'crosses_below' as Op, value: 0, compareWith: 'number' as const }]
    }
  },
];

const emptyCondition = (): Condition => ({
  id: Math.random().toString(36).slice(2), indicator: 'rsi', period: 14, op: '<', value: 30, compareWith: 'number',
});

// ── Mini Chart (Canvas) ───────────────────────────────────────────────────
const MiniChart: React.FC<{ type: string; color: string }> = ({ type, color }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const w = c.width, h = c.height; ctx.clearRect(0, 0, w, h);
    if (type === 'rsi') {
      ctx.strokeStyle = '#ffffff15'; ctx.lineWidth = 1;
      [0.3, 0.7].forEach(l => { ctx.beginPath(); ctx.moveTo(0, h * l); ctx.lineTo(w, h * l); ctx.stroke() });
      ctx.beginPath();
      for (let i = 0; i < w; i++) { const y = h * 0.5 + Math.sin(i * 0.06 + 2) * h * 0.35; i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y) }
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    } else if (type === 'macd') {
      for (let i = 0; i < w; i += 3) { const v = Math.sin(i * 0.05) * h * 0.3; ctx.fillStyle = v > 0 ? color + 'aa' : '#ef4444aa'; ctx.fillRect(i, h / 2, 2, -v) }
    } else {
      ctx.beginPath();
      for (let i = 0; i < w; i++) { const y = h / 2 + Math.sin(i * 0.04) * h * 0.25 + Math.sin(i * 0.01) * h * 0.1; i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y) }
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < w; i++) { const y = h / 2 + Math.sin(i * 0.04 + 1) * h * 0.2 + Math.sin(i * 0.01) * h * 0.1; i === 0 ? ctx.moveTo(i, y) : ctx.lineTo(i, y) }
      ctx.strokeStyle = color + '60'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }, [type, color]);
  return <canvas ref={ref} width={160} height={60} style={{ width: '100%', height: 60, borderRadius: 8 }} />;
};

// ── Strategy Flow (animated steps) ────────────────────────────────────────
const StrategyFlow: React.FC = () => {
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep(s => (s + 1) % 4), 1200); return () => clearInterval(t); }, []);
  const steps = ['SCAN', 'ENTRY', 'HOLD', 'EXIT'];
  const emojis = ['🔍', '📈', '⏳', '💰'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '12px 0' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{
            padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700,
            background: step === i ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.04)',
            color: step === i ? '#fff' : 'rgba(255,255,255,0.35)',
            transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
            transform: step === i ? 'scale(1.12)' : 'scale(1)',
            boxShadow: step === i ? '0 4px 20px rgba(255,255,255,0.1)' : 'none',
            backdropFilter: 'blur(4px)',
          }}>{emojis[i]} {s}</div>
          {i < 3 && <ArrowRight size={12} style={{ color: step > i ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)', margin: '0 4px', transition: 'color 0.3s' }} />}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Animated Ring ──────────────────────────────────────────────────────────
const Ring: React.FC<{ value: number; max: number; label: string; color: string; size?: number }> = ({ value, max, label, color, size = 64 }) => {
  const [a, setA] = useState(0);
  useEffect(() => { const t = setTimeout(() => setA(value), 300); return () => clearTimeout(t) }, [value]);
  const r = (size - 8) / 2, c = 2 * Math.PI * r, off = c * (1 - a / max);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={4} fill="none" />
          <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={4} fill="none"
            strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}60)` }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{Math.round(a)}</div>
      </div>
      <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
    </div>
  );
};

// ── Condition Row ──────────────────────────────────────────────────────────
const ConditionRow: React.FC<{
  cond: Condition; action: 'buy' | 'sell';
  onChange: (c: Condition) => void; onRemove: () => void; index: number;
}> = ({ cond, action, onChange, onRemove, index }) => {
  const u = (p: Partial<Condition>) => onChange({ ...cond, ...p });
  const buy = action === 'buy';
  const accent = buy ? '#10b981' : '#ef4444';
  const sel: React.CSSProperties = { padding: '6px 10px', fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#1e293b', outline: 'none', cursor: 'pointer' };

  return (
    <SpringCard scale={1.01} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
      background: `linear-gradient(135deg, ${accent}08, ${accent}03)`,
      borderRadius: 12, border: `1px solid ${accent}20`, flexWrap: 'wrap',
      animation: `fadeSlideIn 0.4s ease ${index * 0.1}s both`,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}`, animation: 'pulseGlow 2s ease-in-out infinite' }} />
      <span style={{ fontSize: 11, fontWeight: 800, color: accent, letterSpacing: 0.5 }}>{buy ? 'BUY' : 'SELL'}</span>
      <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>WHEN</span>
      <select style={{ ...sel, width: 72 }} value={cond.indicator} onChange={e => u({ indicator: e.target.value as IndicatorType })}>
        {Object.entries(IND).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {cond.indicator !== 'price' && <input type="number" style={{ ...sel, width: 48, textAlign: 'center' }} value={cond.period} onChange={e => u({ period: parseInt(e.target.value) || 14 })} />}
      <select style={{ ...sel, width: 100 }} value={cond.op} onChange={e => u({ op: e.target.value as Op })}>
        {OPS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
      </select>
      <select style={{ ...sel, width: 85 }} value={cond.compareWith} onChange={e => u({ compareWith: e.target.value as any })}>
        <option value="number">Value</option><option value="indicator">Indicator</option>
      </select>
      {cond.compareWith === 'number' ? (
        <input type="number" style={{ ...sel, width: 56, textAlign: 'center' }} value={cond.value} onChange={e => u({ value: parseFloat(e.target.value) || 0 })} />
      ) : (<>
        <select style={{ ...sel, width: 72 }} value={cond.compareIndicator || 'sma'} onChange={e => u({ compareIndicator: e.target.value as IndicatorType })}>
          {Object.entries(IND).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input type="number" style={{ ...sel, width: 48, textAlign: 'center' }} value={cond.comparePeriod || 50} onChange={e => u({ comparePeriod: parseInt(e.target.value) || 50 })} />
      </>)}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', marginLeft: 'auto', padding: 4, borderRadius: 6, transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1'; e.currentTarget.style.background = 'none' }}>
        <Trash2 size={13} />
      </button>
    </SpringCard>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
const StrategyBuilderPage: React.FC = () => {
  const { apiBase } = useData();
  const [config, setConfig] = useState<StrategyConfig>({
    name: 'My Strategy', symbol: 'RELIANCE', timeframe: '1d',
    entryConditions: [emptyCondition()], exitConditions: [emptyCondition()],
    positionSize: 10000, stopLoss: 5, takeProfit: 10,
  });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [quickResult, setQuickResult] = useState<any>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<any[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [activeTpl, setActiveTpl] = useState<string | null>(null);

  const u = (p: Partial<StrategyConfig>) => setConfig(c => ({ ...c, ...p }));
  const addC = (t: 'entry' | 'exit') => t === 'entry' ? u({ entryConditions: [...config.entryConditions, emptyCondition()] }) : u({ exitConditions: [...config.exitConditions, emptyCondition()] });
  const rmC = (t: 'entry' | 'exit', id: string) => t === 'entry' ? u({ entryConditions: config.entryConditions.filter(c => c.id !== id) }) : u({ exitConditions: config.exitConditions.filter(c => c.id !== id) });
  const upC = (t: 'entry' | 'exit', c: Condition) => t === 'entry' ? u({ entryConditions: config.entryConditions.map(x => x.id === c.id ? c : x) }) : u({ exitConditions: config.exitConditions.map(x => x.id === c.id ? c : x) });
  const applyTpl = (t: typeof TEMPLATES[number]) => { u({ ...t.config, name: t.name }); setActiveTpl(t.id) };

  const handleSave = async () => {
    setSaving(true); setSaveMsg(null);
    try { const r = await fetch(`${apiBase}/api/strategy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: config.name, config }) }); const d = await r.json(); setSaveMsg(`Strategy "${config.name}" saved! ID: ${d.id}`); }
    catch { setSaveMsg('Failed to save') } finally { setSaving(false) }
  };
  const handleQuickTest = async () => {
    setQuickLoading(true); setQuickError(null); setQuickResult(null);
    const e = config.entryConditions[0]; let sn = 'MA Crossover';
    if (e?.indicator === 'rsi') sn = 'RSI Mean Reversion'; else if (e?.indicator === 'price') sn = 'Breakout Strategy'; else if (e?.indicator === 'macd') sn = 'MACD Crossover';
    const end = new Date(), start = new Date(); start.setFullYear(start.getFullYear() - 2);
    try {
      const r = await fetch(`${apiBase}/api/backtest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ symbol: config.symbol, strategy: sn, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), capital: config.positionSize * 10, brokerage: 0.05 }) });
      const d = await r.json(); if (!d.success) throw new Error(d.error || 'Failed'); setQuickResult(d.metrics)
    }
    catch (x: any) { setQuickError(x.message) } finally { setQuickLoading(false) }
  };
  const loadSaved = async () => { const r = await fetch(`${apiBase}/api/strategy`); setSavedStrategies(await r.json()); setShowSaved(true) };
  const selTpl = TEMPLATES.find(t => t.id === activeTpl);

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatOrb{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-12px) scale(1.05)}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 4px currentColor}50%{box-shadow:0 0 14px currentColor}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes scanline{0%{top:-100%}100%{top:200%}}
      `}</style>

      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>

        {/* ═════════ HERO — AuroraGlow background ═════════ */}
        <AuroraGlow
          colors={['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981']}
          speed={10}
          style={{ borderRadius: 20, padding: '28px 32px', marginBottom: 24, background: 'linear-gradient(135deg,#0f0a2e 0%,#1e1b4b 30%,#312e81 60%,#4338ca 100%)', color: '#fff', position: 'relative' }}>

          {/* Floating orbs */}
          <div style={{ position: 'absolute', right: 60, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.3),transparent)', filter: 'blur(30px)', animation: 'floatOrb 6s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', left: '40%', bottom: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,0.2),transparent)', filter: 'blur(40px)', animation: 'floatOrb 8s ease-in-out infinite 2s' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                  <Target size={18} />
                </div>
                {/* GlitchText — digital glitch effect on title */}
                <GlitchText color="#fff" glitchColor1="#818cf8" glitchColor2="#06b6d4" style={{ fontSize: 24, fontWeight: 800 }}>
                  Strategy Builder
                </GlitchText>
              </div>
              <p style={{ fontSize: 12, opacity: 0.5, marginTop: 2, marginLeft: 46 }}>Design & backtest rule-based trading strategies</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: '📁 Saved', onClick: loadSaved, bg: 'rgba(255,255,255,0.06)' },
                { label: `💾 ${saving ? 'Saving…' : 'Save'}`, onClick: handleSave, bg: 'rgba(255,255,255,0.06)' },
              ].map(b => (
                <button key={b.label} onClick={b.onClick} style={{ padding: '9px 18px', borderRadius: 10, background: b.bg, border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.3s', backdropFilter: 'blur(8px)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = b.bg; e.currentTarget.style.transform = 'none' }}>{b.label}</button>
              ))}
              <button onClick={handleQuickTest} disabled={quickLoading} style={{ padding: '9px 22px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 20px rgba(99,102,241,0.4)', transition: 'all 0.3s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.4)' }}>
                <Play size={13} /> {quickLoading ? 'Running…' : 'Quick Test'}
              </button>
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 2, marginTop: 12 }}><StrategyFlow /></div>
        </AuroraGlow>

        {saveMsg && (
          <div style={{
            padding: '12px 18px', borderRadius: 12, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
            background: saveMsg.includes('saved') ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
            border: `1px solid ${saveMsg.includes('saved') ? '#bbf7d0' : '#fecaca'}`,
            color: saveMsg.includes('saved') ? '#16a34a' : '#dc2626', animation: 'fadeSlideIn 0.4s ease'
          }}>
            {saveMsg.includes('saved') ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {saveMsg}
          </div>
        )}

        {/* ═════════ TEMPLATES — SpringCard with bounce ═════════ */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Choose a Strategy Template</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {TEMPLATES.map((tpl, i) => {
              const active = activeTpl === tpl.id;
              return (
                <SpringCard key={tpl.id} scale={1.05} onClick={() => applyTpl(tpl)} style={{
                  borderRadius: 16, overflow: 'hidden',
                  border: active ? `2px solid ${tpl.color}` : '2px solid transparent',
                  boxShadow: active ? `0 8px 32px ${tpl.color}25` : '0 2px 12px rgba(0,0,0,0.06)',
                  animation: `fadeSlideIn 0.5s ease ${i * 0.12}s both`,
                }}>
                  <div style={{ background: tpl.bg, padding: '16px 16px 12px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: -10, top: -10, fontSize: 40, opacity: 0.15 }}>{tpl.emoji}</div>
                    {/* Scan line effect */}
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                      <div style={{ position: 'absolute', width: '100%', height: 1, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`, animation: `scanline 3s linear infinite ${i * 0.5}s` }} />
                    </div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{tpl.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{tpl.desc}</div>
                    </div>
                  </div>
                  <div style={{ padding: '10px 16px 14px', background: '#fff' }}>
                    <MiniChart type={tpl.chartType} color={tpl.color} />
                    {active && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 10, fontWeight: 600, color: tpl.color }}>
                      <CheckCircle size={10} /> Active Template
                    </div>}
                  </div>
                </SpringCard>
              );
            })}
          </div>
        </div>

        {/* ═════════ MAIN CONTENT ═════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* LEFT — Rule Builder with BorderBeam panels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Strategy Settings — BorderBeam */}
            <RevealMask duration={0.6}>
              <BorderBeam color="#6366f1" speed={6}>
                <div style={{ padding: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Target size={12} color="#6366f1" />
                    </div>
                    Strategy Configuration
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Strategy Name', value: config.name, onChange: (e: any) => u({ name: e.target.value }), ph: '' },
                      { label: 'Symbol', value: config.symbol, onChange: (e: any) => u({ symbol: e.target.value.toUpperCase() }), ph: 'RELIANCE' },
                    ].map(f => (
                      <div key={f.label}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>{f.label}</label>
                        <input value={f.value} onChange={f.onChange} placeholder={f.ph}
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #f1f5f9', fontSize: 13, fontWeight: 500, color: '#1e293b', background: '#fafbfc', outline: 'none', transition: 'all 0.2s' }}
                          onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                          onBlur={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none' }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>Timeframe</label>
                      <select value={config.timeframe} onChange={e => u({ timeframe: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #f1f5f9', fontSize: 13, fontWeight: 500, color: '#1e293b', background: '#fafbfc', outline: 'none', cursor: 'pointer' }}>
                        <option value="1m">1 min</option><option value="5m">5 min</option><option value="15m">15 min</option>
                        <option value="1h">1 Hour</option><option value="1d">Daily</option>
                      </select>
                    </div>
                  </div>
                </div>
              </BorderBeam>
            </RevealMask>

            {/* Entry Conditions — BorderBeam green */}
            <RevealMask duration={0.7}>
              <BorderBeam color="#10b981" speed={5}>
                <div style={{ padding: 20, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'linear-gradient(180deg,#10b981,#059669)', borderRadius: '4px 0 0 4px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingLeft: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 8 }}>
                      📈 Entry Conditions
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#dcfce7', color: '#16a34a' }}>{config.entryConditions.length} rules</span>
                    </div>
                    <button onClick={() => addC('entry')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(16,185,129,0.4)' }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16,185,129,0.3)' }}>
                      <Plus size={12} /> Add Rule
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12 }}>
                    {config.entryConditions.length === 0 && <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No entry conditions.</p>}
                    {config.entryConditions.map((c, i) => <ConditionRow key={c.id} cond={c} action="buy" index={i} onChange={v => upC('entry', v)} onRemove={() => rmC('entry', c.id)} />)}
                  </div>
                </div>
              </BorderBeam>
            </RevealMask>

            {/* Exit Conditions — BorderBeam red */}
            <RevealMask duration={0.8}>
              <BorderBeam color="#ef4444" speed={5}>
                <div style={{ padding: 20, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'linear-gradient(180deg,#ef4444,#dc2626)', borderRadius: '4px 0 0 4px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingLeft: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
                      📉 Exit Conditions
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fef2f2', color: '#dc2626' }}>{config.exitConditions.length} rules</span>
                    </div>
                    <button onClick={() => addC('exit')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 8, background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(239,68,68,0.3)', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}>
                      <Plus size={12} /> Add Rule
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12 }}>
                    {config.exitConditions.length === 0 && <p style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No exit conditions.</p>}
                    {config.exitConditions.map((c, i) => <ConditionRow key={c.id} cond={c} action="sell" index={i} onChange={v => upC('exit', v)} onRemove={() => rmC('exit', c.id)} />)}
                  </div>
                </div>
              </BorderBeam>
            </RevealMask>

            {/* Risk Management — BorderBeam amber */}
            <RevealMask duration={0.9}>
              <BorderBeam color="#f59e0b" speed={5}>
                <div style={{ padding: 20, position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'linear-gradient(180deg,#f59e0b,#d97706)', borderRadius: '4px 0 0 4px' }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#d97706', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 12 }}>
                    <Shield size={14} /> Risk Management
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, paddingLeft: 12 }}>
                    {[
                      { label: 'Position Size (₹)', value: config.positionSize, key: 'positionSize' as const, color: '#6366f1' },
                      { label: 'Stop Loss (%)', value: config.stopLoss, key: 'stopLoss' as const, color: '#ef4444' },
                      { label: 'Take Profit (%)', value: config.takeProfit, key: 'takeProfit' as const, color: '#10b981' },
                    ].map(f => (
                      <AuroraGlow key={f.key} colors={[f.color, f.color + '80', '#f1f5f9']} speed={6} style={{ borderRadius: 12, padding: 14, border: '1px solid #f1f5f9', background: '#fafbfc' }}>
                        <label style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block' }}>{f.label}</label>
                        <input type="number" value={f.value} onChange={e => u({ [f.key]: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '8px 0', border: 'none', fontSize: 18, fontWeight: 700, color: '#1e293b', background: 'transparent', outline: 'none' }} />
                      </AuroraGlow>
                    ))}
                  </div>
                </div>
              </BorderBeam>
            </RevealMask>
          </div>

          {/* RIGHT — Strategy DNA + Results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Strategy DNA — RevealMask + AuroraGlow */}
            <RevealMask duration={0.6}>
              <AuroraGlow colors={['#6366f1', '#8b5cf6', '#10b981', '#f59e0b']} speed={12}
                style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', borderRadius: 16, padding: 20, color: '#fff' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={12} color="#fbbf24" /> Strategy DNA
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <Ring value={config.entryConditions.length * 33} max={100} label="Entry" color="#10b981" />
                  <Ring value={config.exitConditions.length * 33} max={100} label="Exit" color="#ef4444" />
                  <Ring value={Math.min(config.stopLoss * 10, 100)} max={100} label="Risk" color="#f59e0b" />
                </div>
                <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                  {activeTpl ? `Using ${selTpl?.name} on ${config.symbol} with ${config.entryConditions.length}+${config.exitConditions.length} rules.` : 'Select a template or build custom rules.'}
                </div>
              </AuroraGlow>
            </RevealMask>

            {/* Quick Test Results — BorderBeam */}
            <RevealMask duration={0.7}>
              <BorderBeam color="#6366f1" speed={6}>
                <div style={{ padding: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <Play size={12} color="#6366f1" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>Quick Test Results</span>
                  </div>
                  {!quickResult && !quickLoading && !quickError && (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <div style={{ fontSize: 32, marginBottom: 8, animation: 'floatOrb 4s ease-in-out infinite' }}>📊</div>
                      <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>Click "Quick Test" to backtest<br />for the last 2 years</p>
                    </div>
                  )}
                  {quickLoading && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>Running backtest…</p>
                    </div>
                  )}
                  {quickError && <div style={{ padding: '12px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={13} /> {quickError}</div>}
                  {quickResult && !quickLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { label: 'Total Return', val: `${quickResult.totalReturn >= 0 ? '+' : ''}${quickResult.totalReturn?.toFixed(2)}%`, ok: quickResult.totalReturn >= 0, color: '#10b981' },
                        { label: 'CAGR', val: `${quickResult.annualizedReturn?.toFixed(2)}%`, ok: quickResult.annualizedReturn >= 0, color: '#3b82f6' },
                        { label: 'Sharpe', val: quickResult.sharpeRatio?.toFixed(2), ok: quickResult.sharpeRatio >= 1, color: '#8b5cf6' },
                        { label: 'Max DD', val: `${quickResult.maxDrawdown?.toFixed(2)}%`, ok: quickResult.maxDrawdown > -20, color: '#ef4444' },
                        { label: 'Win Rate', val: `${quickResult.winRate?.toFixed(1)}%`, ok: quickResult.winRate >= 50, color: '#f59e0b' },
                        { label: 'Trades', val: String(quickResult.totalTrades), ok: true, color: '#06b6d4' },
                      ].map((r, i) => (
                        <SpringCard key={r.label} scale={1.02} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px',
                          borderRadius: 10, background: r.ok ? `${r.color}06` : '#fef2f206',
                          border: `1px solid ${r.ok ? r.color + '15' : '#fecaca20'}`,
                          animation: `fadeSlideIn 0.4s ease ${i * 0.06}s both`,
                        }}>
                          <span style={{ fontSize: 12, color: '#64748b' }}>{r.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: r.ok ? r.color : '#ef4444' }}>{r.val}</span>
                        </SpringCard>
                      ))}
                      <a href="/backtesting" style={{
                        display: 'block', marginTop: 8, textAlign: 'center', padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', transition: 'all 0.2s'
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}>
                        Run Full Backtest →
                      </a>
                    </div>
                  )}
                </div>
              </BorderBeam>
            </RevealMask>

            {showSaved && (
              <RevealMask duration={0.5}>
                <BorderBeam color="#8b5cf6" speed={6}>
                  <div style={{ padding: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>📁 Saved Strategies</span>
                      <button onClick={() => setShowSaved(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>✕</button>
                    </div>
                    {savedStrategies.length === 0 ? <p style={{ color: '#94a3b8', fontSize: 12 }}>No saved strategies.</p> :
                      savedStrategies.map(s => (
                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <div><span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{s.name}</span><span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 6 }}>{s.created_at?.slice(0, 10)}</span></div>
                          <button onClick={() => { try { u(JSON.parse(s.config)) } catch { } }} style={{ padding: '5px 12px', borderRadius: 6, background: '#f5f3ff', border: '1px solid #e9d5ff', color: '#6366f1', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Load</button>
                        </div>
                      ))}
                  </div>
                </BorderBeam>
              </RevealMask>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StrategyBuilderPage;