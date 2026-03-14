import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { Layers, Plus, Minus, RefreshCw, DollarSign, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { HolographicSheen, NumberTicker, SplitText, ScanLine, SlideReveal } from '../components/ui/AceternityEffects';

const STRATEGIES = [
  { id: 'bull_call_spread', name: 'Bull Call Spread', icon: '📈', category: 'Bullish' },
  { id: 'bear_put_spread', name: 'Bear Put Spread', icon: '📉', category: 'Bearish' },
  { id: 'long_straddle', name: 'Long Straddle', icon: '↕️', category: 'Volatile' },
  { id: 'short_straddle', name: 'Short Straddle', icon: '⬌', category: 'Neutral' },
  { id: 'long_strangle', name: 'Long Strangle', icon: '🔀', category: 'Volatile' },
  { id: 'iron_condor', name: 'Iron Condor', icon: '🦅', category: 'Neutral' },
  { id: 'iron_butterfly', name: 'Iron Butterfly', icon: '🦋', category: 'Neutral' },
  { id: 'covered_call', name: 'Covered Call', icon: '🛡️', category: 'Bullish' },
  { id: 'protective_put', name: 'Protective Put', icon: '🔒', category: 'Bullish' },
  { id: 'ratio_call_spread', name: 'Ratio Call Spread', icon: '⚖️', category: 'Bullish' },
];

const CATEGORY_COLORS: Record<string, string> = { 'Bullish': '#10b981', 'Bearish': '#ef4444', 'Neutral': '#f59e0b', 'Volatile': '#8b5cf6' };

const StrategyBuilderDashboard: React.FC = () => {
  const [selectedStrategy, setSelectedStrategy] = useState('iron_condor');
  const [spot, setSpot] = useState(22500);
  const [step, setStep] = useState(100);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/options/strategy/payoff?strategy=${selectedStrategy}&spot=${spot}&step=${step}&lot=25`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      const priceRange = Array.from({length: 200}, (_, i) => spot * 0.9 + (spot * 0.2 / 200) * i);
      const payoffs = priceRange.map(p => {
        const dist = p - spot;
        if (selectedStrategy.includes('straddle')) return -Math.abs(dist) * 0.8 + spot * 0.015;
        if (selectedStrategy.includes('condor')) return Math.max(-spot * 0.01, Math.min(spot * 0.005, spot * 0.005 - Math.pow(Math.abs(dist) / (spot * 0.05), 2) * spot * 0.01));
        return dist * 0.5;
      });
      setData({
        strategy: selectedStrategy, name: STRATEGIES.find(s => s.id === selectedStrategy)?.name || '', spot, lotSize: 25,
        legs: [{ type: 'call', action: 'buy', strike: spot, premium: spot * 0.008 }, { type: 'put', action: 'sell', strike: spot + step, premium: spot * 0.005 }],
        priceRange, payoffs, breakevens: [spot - spot * 0.02, spot + spot * 0.03], maxProfit: Math.max(...payoffs), maxLoss: Math.min(...payoffs),
      });
    } finally { setLoading(false); }
  }, [selectedStrategy, spot, step]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = (data?.priceRange || []).map((p: number, i: number) => ({
    price: Math.round(p), payoff: Math.round((data?.payoffs?.[i] || 0) * 100) / 100,
    fill: (data?.payoffs?.[i] || 0) >= 0 ? '#10b981' : '#ef4444',
  }));

  return (
    <DashboardLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>
        <ScanLine color="rgba(99,102,241,0.1)" speed={5} style={{ background: 'linear-gradient(135deg, #020617, #1e1b4b, #312e81)', borderRadius: 20, padding: '24px 32px', marginBottom: 16, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}><SplitText text="🏗️ Strategy Payoff Builder" stagger={0.02} /></h1>
              <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>Multi-leg strategy visualization • P&L at expiry</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 10, color: '#94a3b8' }}>Spot:</label>
              <input type="number" value={spot} onChange={e => setSpot(Number(e.target.value))} style={{ width: 85, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 12, fontWeight: 700 }} />
              <label style={{ fontSize: 10, color: '#94a3b8' }}>Step:</label>
              <input type="number" value={step} onChange={e => setStep(Number(e.target.value))} style={{ width: 65, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 12, fontWeight: 700 }} />
            </div>
          </div>
        </ScanLine>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14 }}>
          {/* Strategy List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {STRATEGIES.map(s => (
              <HolographicSheen key={s.id} intensity={selectedStrategy === s.id ? 0.5 : 0.2} style={{
                background: selectedStrategy === s.id ? 'linear-gradient(135deg, #f5f3ff, #ede9fe)' : '#fff', borderRadius: 12, padding: '10px 14px',
                border: selectedStrategy === s.id ? '2px solid #8b5cf6' : '1px solid #f1f5f9', cursor: 'pointer', transition: 'all 0.2s',
              }} onClick={() => setSelectedStrategy(s.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: selectedStrategy === s.id ? '#4f46e5' : '#1e293b' }}>{s.name}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: CATEGORY_COLORS[s.category], textTransform: 'uppercase' }}>{s.category}</div>
                  </div>
                </div>
              </HolographicSheen>
            ))}
          </div>

          {/* Chart + Details */}
          <div>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Max Profit', value: data?.maxProfit || 0, color: '#10b981', prefix: '₹' },
                { label: 'Max Loss', value: Math.abs(data?.maxLoss || 0), color: '#ef4444', prefix: '-₹' },
                { label: 'Breakeven(s)', value: (data?.breakevens || []).map((b: number) => Math.round(b)).join(' / '), isText: true, color: '#6366f1' },
                { label: 'Strategy', value: data?.name || '', isText: true, color: '#8b5cf6' },
              ].map((s, i) => (
                <HolographicSheen key={s.label} intensity={0.25} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px', border: '1px solid #f1f5f9', animation: `fadeUp 0.5s ease ${i * 0.08}s both` }}>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                  {(s as any).isText ? (
                    <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                  ) : (
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.prefix}{Math.round(s.value as number).toLocaleString()}</div>
                  )}
                </HolographicSheen>
              ))}
            </div>

            {/* Payoff Chart */}
            <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease both' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarSign size={14} color="#6366f1" /> Payoff at Expiry
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="price" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={Math.floor(chartData.length / 12)} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v: number) => `₹${v}`} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} formatter={(v: number) => `₹${v}`} />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
                  <ReferenceLine x={spot} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'Spot', position: 'top', fontSize: 10, fill: '#6366f1' }} />
                  {(data?.breakevens || []).map((be: number, i: number) => (
                    <ReferenceLine key={i} x={Math.round(be)} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `BE: ${Math.round(be)}`, position: 'insideTopRight', fontSize: 9, fill: '#f59e0b' }} />
                  ))}
                  <defs>
                    <linearGradient id="payoffGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="50%" stopColor="#10b981" stopOpacity={0} />
                      <stop offset="50%" stopColor="#ef4444" stopOpacity={0} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="payoff" stroke="#6366f1" fill="url(#payoffGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </HolographicSheen>

            {/* Legs Table */}
            {data?.legs && (
              <HolographicSheen intensity={0.2} style={{ background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #f1f5f9', marginTop: 14, animation: 'fadeUp 0.7s ease both' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>📋 Strategy Legs</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {data.legs.map((leg: any, i: number) => (
                    <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: leg.action === 'buy' ? '#dcfce710' : '#fef2f210', border: `1px solid ${leg.action === 'buy' ? '#bbf7d020' : '#fecaca20'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        {leg.action === 'buy' ? <Plus size={10} color="#10b981" /> : <Minus size={10} color="#ef4444" />}
                        <span style={{ fontSize: 10, fontWeight: 700, color: leg.action === 'buy' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>{leg.action} {leg.type}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>₹{Math.round(leg.strike)}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>Premium: ₹{leg.premium?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </HolographicSheen>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StrategyBuilderDashboard;
