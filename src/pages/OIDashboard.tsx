import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Eye, TrendingUp, TrendingDown, RefreshCw, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { HolographicSheen, NumberTicker, SplitText, DataPulse, HexGrid, SlideReveal } from '../components/ui/AceternityEffects';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
const BUILDUP_COLORS: Record<string, string> = { 'Long Buildup': '#10b981', 'Short Buildup': '#ef4444', 'Short Covering': '#f59e0b', 'Long Unwinding': '#8b5cf6', 'Neutral': '#94a3b8' };

const OIDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('NIFTY');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/options/oi-analysis?symbol=${symbol}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      const strikes = Array.from({length: 25}, (_, i) => 22000 + i * 50);
      const types = ['Long Buildup', 'Short Buildup', 'Short Covering', 'Long Unwinding', 'Neutral'];
      setData({
        symbol, underlyingValue: 22500,
        analysis: strikes.map(s => ({ strike: s, callOI: Math.floor(Math.random() * 500000), putOI: Math.floor(Math.random() * 500000), callOIChange: Math.floor((Math.random() - 0.4) * 50000), putOIChange: Math.floor((Math.random() - 0.4) * 50000), callBuildup: types[Math.floor(Math.random() * 5)], putBuildup: types[Math.floor(Math.random() * 5)] })),
        buildupSummary: { 'Long Buildup': 12, 'Short Buildup': 8, 'Short Covering': 6, 'Long Unwinding': 4, 'Neutral': 10 },
        sentiment: 'Bullish',
        concentration: { maxCallOI: 980000, maxCallOIStrike: 22600, maxPutOI: 1120000, maxPutOIStrike: 22300, totalCallOI: 8500000, totalPutOI: 9200000, pcr: 1.08 },
      });
    } finally { setLoading(false); }
  }, [symbol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const buildupPie = data ? Object.entries(data.buildupSummary || {}).map(([name, value]) => ({ name, value: value as number, color: BUILDUP_COLORS[name] || '#94a3b8' })) : [];

  return (
    <DashboardLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}`}</style>
      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>
        {/* Header */}
        <HexGrid color="rgba(139,92,246,0.06)" style={{ background: 'linear-gradient(135deg, #020617, #1e1b4b, #312e81)', borderRadius: 20, padding: '24px 32px', marginBottom: 16, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}><SplitText text="📊 Open Interest Analysis" stagger={0.02} /></h1>
              <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>OI Buildup Classification • Concentration • Sentiment</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SYMBOLS.map(s => (
                <button key={s} onClick={() => setSymbol(s)} style={{ padding: '7px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: symbol === s ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,0.06)', color: '#fff', border: symbol === s ? 'none' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s' }}>{s}</button>
              ))}
              <button onClick={fetchData} style={{ padding: 7, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}><RefreshCw size={14} /></button>
            </div>
          </div>
        </HexGrid>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'PCR (OI)', value: data?.concentration?.pcr || 0, color: '#6366f1', icon: Activity },
            { label: 'Resistance', value: data?.concentration?.maxCallOIStrike || 0, color: '#ef4444', icon: ArrowUpRight },
            { label: 'Support', value: data?.concentration?.maxPutOIStrike || 0, color: '#10b981', icon: ArrowDownRight },
            { label: 'Total Call OI', value: Math.round((data?.concentration?.totalCallOI || 0) / 100000) / 10, color: '#f59e0b', icon: Layers, suffix: 'L' },
            { label: 'Sentiment', value: data?.sentiment || 'N/A', color: data?.sentiment === 'Bullish' ? '#10b981' : data?.sentiment === 'Bearish' ? '#ef4444' : '#f59e0b', icon: Eye, isText: true },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <HolographicSheen key={s.label} intensity={0.3} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f1f5f9', animation: `fadeUp 0.5s ease ${i * 0.08}s both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color={s.color} /></div>
                  <div>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                    {(s as any).isText ? (
                      <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}><NumberTicker value={typeof s.value === 'number' ? s.value : 0} suffix={(s as any).suffix || ''} duration={1.5} /></div>
                    )}
                  </div>
                </div>
              </HolographicSheen>
            );
          })}
        </div>

        {/* Main Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 14, marginBottom: 16 }}>
          {/* OI Chart */}
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>📊 Call vs Put Open Interest</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data?.analysis || []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={Math.floor((data?.analysis?.length || 10) / 12)} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} formatter={(v: number) => `${(v / 1000).toFixed(1)}K`} />
                <Bar dataKey="callOI" fill="#ef4444" fillOpacity={0.7} radius={[3, 3, 0, 0]} name="Call OI" />
                <Bar dataKey="putOI" fill="#10b981" fillOpacity={0.7} radius={[3, 3, 0, 0]} name="Put OI" />
              </BarChart>
            </ResponsiveContainer>
          </HolographicSheen>

          {/* Buildup Pie */}
          <HolographicSheen intensity={0.3} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease 0.1s both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>🔄 OI Buildup</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={buildupPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {buildupPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {buildupPie.map(b => (
                <div key={b.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} />
                    <span style={{ fontWeight: 600, color: '#475569' }}>{b.name}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{b.value}</span>
                </div>
              ))}
            </div>
          </HolographicSheen>
        </div>

        {/* OI Change Table */}
        <HolographicSheen intensity={0.2} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.7s ease both' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>📋 Strike-wise OI Change & Buildup</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                  {['Call Buildup', 'Call OI Chg', 'Call OI', 'Strike', 'Put OI', 'Put OI Chg', 'Put Buildup'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', fontWeight: 700, color: '#64748b', fontSize: 10, textTransform: 'uppercase', textAlign: 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.analysis || []).slice(0, 20).map((row: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: 'all 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fafbfc' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: `${BUILDUP_COLORS[row.callBuildup] || '#94a3b8'}15`, color: BUILDUP_COLORS[row.callBuildup] || '#94a3b8' }}>{row.callBuildup}</span>
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: (row.callOIChange || 0) >= 0 ? '#10b981' : '#ef4444' }}>{((row.callOIChange || 0) / 1000).toFixed(1)}K</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', color: '#475569' }}>{((row.callOI || 0) / 1000).toFixed(0)}K</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 800, color: '#1e293b', background: row.strike === data?.concentration?.maxCallOIStrike ? '#fef2f2' : row.strike === data?.concentration?.maxPutOIStrike ? '#dcfce7' : undefined }}>{row.strike}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', color: '#475569' }}>{((row.putOI || 0) / 1000).toFixed(0)}K</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: (row.putOIChange || 0) >= 0 ? '#10b981' : '#ef4444' }}>{((row.putOIChange || 0) / 1000).toFixed(1)}K</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: `${BUILDUP_COLORS[row.putBuildup] || '#94a3b8'}15`, color: BUILDUP_COLORS[row.putBuildup] || '#94a3b8' }}>{row.putBuildup}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </HolographicSheen>
      </div>
    </DashboardLayout>
  );
};

export default OIDashboard;
