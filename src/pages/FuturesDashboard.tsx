import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity, Layers } from 'lucide-react';
import { HolographicSheen, NumberTicker, SplitText, ScanLine, DataPulse } from '../components/ui/AceternityEffects';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

const FuturesDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('NIFTY');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/futures/analytics?symbol=${symbol}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setData({
        symbol, spotPrice: 22500, futuresEstimate: 22612, basis: 112, basisPercent: 0.498,
        premiumDiscount: 'Premium', pcrOI: 1.08, pcrVolume: 0.95,
        totalCallOI: 8500000, totalPutOI: 9200000, totalCallVolume: 12000000, totalPutVolume: 11400000,
        expiryDates: ['27-Mar-2025', '03-Apr-2025', '17-Apr-2025', '24-Apr-2025'],
      });
    } finally { setLoading(false); }
  }, [symbol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const oiPie = [
    { name: 'Call OI', value: data?.totalCallOI || 0, color: '#ef4444' },
    { name: 'Put OI', value: data?.totalPutOI || 0, color: '#10b981' },
  ];
  const volPie = [
    { name: 'Call Vol', value: data?.totalCallVolume || 0, color: '#f59e0b' },
    { name: 'Put Vol', value: data?.totalPutVolume || 0, color: '#6366f1' },
  ];

  return (
    <DashboardLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>
        <ScanLine color="rgba(99,102,241,0.1)" speed={5} style={{ background: 'linear-gradient(135deg, #020617, #1e1b4b, #3730a3)', borderRadius: 20, padding: '24px 32px', marginBottom: 16, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}><SplitText text="📈 Futures Analytics" stagger={0.02} /></h1>
              <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>Basis • Premium/Discount • PCR • OI Distribution</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SYMBOLS.map(s => (
                <button key={s} onClick={() => setSymbol(s)} style={{ padding: '7px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: symbol === s ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)', color: '#fff', border: symbol === s ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>{s}</button>
              ))}
              <button onClick={fetchData} style={{ padding: 7, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}><RefreshCw size={14} /></button>
            </div>
          </div>
        </ScanLine>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Spot Price', value: data?.spotPrice || 0, color: '#6366f1', icon: DollarSign },
            { label: 'Futures Est.', value: data?.futuresEstimate || 0, color: '#8b5cf6', icon: TrendingUp },
            { label: 'Basis', value: data?.basis || 0, suffix: ` (${data?.basisPercent || 0}%)`, color: (data?.basis || 0) >= 0 ? '#10b981' : '#ef4444', icon: Activity },
            { label: 'Premium/Discount', value: data?.premiumDiscount || 'N/A', color: data?.premiumDiscount === 'Premium' ? '#10b981' : '#ef4444', icon: data?.premiumDiscount === 'Premium' ? TrendingUp : TrendingDown, isText: true },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <HolographicSheen key={s.label} intensity={0.3} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f1f5f9', animation: `fadeUp 0.5s ease ${i * 0.08}s both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DataPulse color={s.color} active><div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color={s.color} /></div></DataPulse>
                  <div>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                    {(s as any).isText ? (
                      <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                    ) : (
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}><NumberTicker value={typeof s.value === 'number' ? s.value : 0} duration={1.5} /></div>
                    )}
                  </div>
                </div>
              </HolographicSheen>
            );
          })}
        </div>

        {/* PCR + Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 16 }}>
          {/* PCR */}
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', textAlign: 'center', animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>📊 Put-Call Ratio</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: data?.pcrOI > 1 ? '#10b981' : '#ef4444' }}>{data?.pcrOI?.toFixed(2) || '0.00'}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>OI Based</div>
              </div>
              <div style={{ width: 1, background: '#e2e8f0' }} />
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: data?.pcrVolume > 1 ? '#10b981' : '#ef4444' }}>{data?.pcrVolume?.toFixed(2) || '0.00'}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>Volume Based</div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: '8px 14px', borderRadius: 10, background: '#f8fafc', fontSize: 10, color: '#64748b' }}>
              PCR {'>'} 1 = Put writers dominating (Bullish bias)<br />
              PCR {'<'} 1 = Call writers dominating (Bearish bias)
            </div>
          </HolographicSheen>

          {/* OI Pie */}
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease 0.1s both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>🔵 OI Distribution</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={oiPie} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={5} strokeWidth={0}>
                  {oiPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 10 }} formatter={(v: number) => `${(v / 100000).toFixed(1)}L`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 10 }}>
              {oiPie.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                  <span style={{ fontWeight: 600, color: '#475569' }}>{p.name}: {(p.value / 100000).toFixed(1)}L</span>
                </div>
              ))}
            </div>
          </HolographicSheen>

          {/* Volume Pie */}
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease 0.2s both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>📊 Volume Distribution</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={volPie} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={5} strokeWidth={0}>
                  {volPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 10 }} formatter={(v: number) => `${(v / 100000).toFixed(1)}L`} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 10 }}>
              {volPie.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                  <span style={{ fontWeight: 600, color: '#475569' }}>{p.name}: {(p.value / 100000).toFixed(1)}L</span>
                </div>
              ))}
            </div>
          </HolographicSheen>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FuturesDashboard;
