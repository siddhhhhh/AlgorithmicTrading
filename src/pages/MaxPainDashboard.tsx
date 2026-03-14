import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area, Cell, ComposedChart, Line } from 'recharts';
import { Target, RefreshCw, TrendingUp, TrendingDown, Circle } from 'lucide-react';
import { HolographicSheen, NumberTicker, SplitText, ScanLine, DataPulse } from '../components/ui/AceternityEffects';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

const MaxPainDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('NIFTY');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/options/maxpain?symbol=${symbol}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      const strikes = Array.from({length: 25}, (_, i) => 22000 + i * 50);
      setData({
        symbol, underlyingValue: 22500, maxPain: 22350, maxPainDistance: -0.67,
        painData: strikes.map(s => {
          const callPain = strikes.reduce((sum, k) => sum + (s > k ? (Math.random() * 500000) * (s - k) : 0), 0);
          const putPain = strikes.reduce((sum, k) => sum + (s < k ? (Math.random() * 500000) * (k - s) : 0), 0);
          return { strike: s, callPain: Math.round(callPain / 1e6), putPain: Math.round(putPain / 1e6), totalPain: Math.round((callPain + putPain) / 1e6) };
        }),
      });
    } finally { setLoading(false); }
  }, [symbol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = data?.painData || [];
  const maxTotalPain = Math.max(...chartData.map((d: any) => d.totalPain || 0), 1);

  return (
    <DashboardLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>
        {/* Header */}
        <ScanLine color="rgba(245,158,11,0.1)" speed={5} style={{ background: 'linear-gradient(135deg, #020617, #1c1917, #451a03)', borderRadius: 20, padding: '24px 32px', marginBottom: 16, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}><SplitText text="🎯 Max Pain Dashboard" stagger={0.02} /></h1>
              <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>Option writer loss analysis • Pain point convergence</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SYMBOLS.map(s => (
                <button key={s} onClick={() => setSymbol(s)} style={{ padding: '7px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: symbol === s ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'rgba(255,255,255,0.06)', color: '#fff', border: symbol === s ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>{s}</button>
              ))}
              <button onClick={fetchData} style={{ padding: 7, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}><RefreshCw size={14} /></button>
            </div>
          </div>
        </ScanLine>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Max Pain Strike', value: data?.maxPain || 0, color: '#f59e0b', icon: Target },
            { label: 'Spot Price', value: data?.underlyingValue || 0, color: '#6366f1', icon: Circle },
            { label: 'Distance to Max Pain', value: data?.maxPainDistance || 0, color: (data?.maxPainDistance || 0) >= 0 ? '#10b981' : '#ef4444', icon: (data?.maxPainDistance || 0) >= 0 ? TrendingUp : TrendingDown, suffix: '%' },
            { label: 'Spot - MaxPain', value: Math.round((data?.underlyingValue || 0) - (data?.maxPain || 0)), color: '#8b5cf6', icon: Target, suffix: ' pts' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <HolographicSheen key={s.label} intensity={0.3} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f1f5f9', animation: `fadeUp 0.5s ease ${i * 0.08}s both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DataPulse color={s.color} active><div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color={s.color} /></div></DataPulse>
                  <div>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}><NumberTicker value={Math.abs(s.value)} prefix={s.value < 0 ? '-' : ''} suffix={s.suffix || ''} duration={1.5} /></div>
                  </div>
                </div>
              </HolographicSheen>
            );
          })}
        </div>

        {/* Main Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {/* Total Pain */}
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>📊 Total Pain by Strike</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={Math.floor(chartData.length / 10)} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v: number) => `${v}M`} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} formatter={(v: number) => `${v}M`} />
                {data?.maxPain && <ReferenceLine x={data.maxPain} stroke="#f59e0b" strokeWidth={2} label={{ value: `Max Pain: ${data.maxPain}`, position: 'top', fontSize: 11, fill: '#f59e0b', fontWeight: 700 }} />}
                {data?.underlyingValue && <ReferenceLine x={Math.round(data.underlyingValue / 50) * 50} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'Spot', position: 'top', fontSize: 10, fill: '#6366f1' }} />}
                <Bar dataKey="totalPain" radius={[4, 4, 0, 0]}>
                  {chartData.map((d: any, i: number) => (
                    <Cell key={i} fill={d.strike === data?.maxPain ? '#f59e0b' : '#94a3b8'} fillOpacity={d.strike === data?.maxPain ? 1 : 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </HolographicSheen>

          {/* Call/Put Pain Breakdown */}
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease 0.1s both' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>📈 Call vs Put Pain</div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={Math.floor(chartData.length / 10)} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(v: number) => `${v}M`} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} formatter={(v: number) => `${v}M`} />
                {data?.maxPain && <ReferenceLine x={data.maxPain} stroke="#f59e0b" strokeDasharray="4 4" />}
                <Area type="monotone" dataKey="callPain" stroke="#ef4444" fill="#ef444415" strokeWidth={2} name="Call Pain" />
                <Area type="monotone" dataKey="putPain" stroke="#10b981" fill="#10b98115" strokeWidth={2} name="Put Pain" />
              </AreaChart>
            </ResponsiveContainer>
          </HolographicSheen>
        </div>

        {/* Theory Box */}
        <HolographicSheen intensity={0.2} style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderRadius: 16, padding: 20, border: '1px solid #fde68a', animation: 'fadeUp 0.7s ease both' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>💡 Max Pain Theory</div>
          <p style={{ fontSize: 11, color: '#78350f', lineHeight: 1.6, margin: 0 }}>
            Max Pain is the strike price at which option writers (sellers) face the <strong>minimum total loss</strong>. Theory suggests that stock prices tend to gravitate toward the max pain level near expiry, as option writers have financial incentive to move prices there.
            Currently, {symbol} spot is <strong>{data?.underlyingValue?.toLocaleString()}</strong> and max pain is <strong>{data?.maxPain?.toLocaleString()}</strong> ({data?.maxPainDistance}% away).
            {Math.abs(data?.maxPainDistance || 0) < 1 ? ' Price is very close to max pain — convergence likely.' : Math.abs(data?.maxPainDistance || 0) < 2 ? ' Moderate distance — gravitational pull possible.' : ' Significant distance — may not converge this expiry.'}
          </p>
        </HolographicSheen>
      </div>
    </DashboardLayout>
  );
};

export default MaxPainDashboard;
