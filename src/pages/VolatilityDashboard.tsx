import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ComposedChart, Bar } from 'recharts';
import { Activity, TrendingUp, TrendingDown, RefreshCw, BarChart3 } from 'lucide-react';
import { HolographicSheen, NumberTicker, SplitText, ScanLine, DataPulse, NeonBorder } from '../components/ui/AceternityEffects';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

const VolatilityDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('NIFTY');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/options/volatility?symbol=${symbol}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      const strikes = Array.from({length: 30}, (_, i) => 21500 + i * 50);
      const spot = 22500;
      setData({
        symbol, underlyingValue: spot, atmStrike: 22500, atmIV: 16.2, skew25Delta: 3.4,
        smileData: strikes.map(s => ({ strike: s, moneyness: ((s / spot) - 1) * 100, callIV: 12 + Math.abs(s - spot) / 200 + Math.random() * 3, putIV: 13 + Math.abs(s - spot) / 180 + Math.random() * 3, avgIV: 12.5 + Math.abs(s - spot) / 190 + Math.random() * 2.5 })),
        termStructure: [
          { expiry: '27-Mar-2025', daysToExpiry: 14, atmIV: 16.2 }, { expiry: '03-Apr-2025', daysToExpiry: 21, atmIV: 17.1 },
          { expiry: '17-Apr-2025', daysToExpiry: 35, atmIV: 18.5 }, { expiry: '24-Apr-2025', daysToExpiry: 42, atmIV: 19.2 },
          { expiry: '29-May-2025', daysToExpiry: 77, atmIV: 20.8 }, { expiry: '26-Jun-2025', daysToExpiry: 105, atmIV: 21.5 },
        ],
        ivStats: { mean: 17.8, median: 17.2, min: 11.5, max: 28.4, std: 4.2 },
      });
    } finally { setLoading(false); }
  }, [symbol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <DashboardLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmerCard{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>
        <ScanLine color="rgba(6,182,212,0.1)" speed={5} style={{ background: 'linear-gradient(135deg, #020617, #0c4a6e, #164e63)', borderRadius: 20, padding: '24px 32px', marginBottom: 16, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}><SplitText text="🌊 Volatility Analytics" stagger={0.02} /></h1>
              <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>IV Smile • Skew • Term Structure • Surface</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SYMBOLS.map(s => (
                <button key={s} onClick={() => setSymbol(s)} style={{ padding: '7px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: symbol === s ? 'linear-gradient(135deg,#06b6d4,#0891b2)' : 'rgba(255,255,255,0.06)', color: '#fff', border: symbol === s ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>{s}</button>
              ))}
              <button onClick={fetchData} style={{ padding: 7, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}><RefreshCw size={14} /></button>
            </div>
          </div>
        </ScanLine>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'ATM IV', value: data?.atmIV || 0, suffix: '%', color: '#06b6d4' },
            { label: '25Δ Skew', value: data?.skew25Delta || 0, suffix: '%', color: '#8b5cf6' },
            { label: 'IV Mean', value: data?.ivStats?.mean || 0, suffix: '%', color: '#6366f1' },
            { label: 'IV Min', value: data?.ivStats?.min || 0, suffix: '%', color: '#10b981' },
            { label: 'IV Max', value: data?.ivStats?.max || 0, suffix: '%', color: '#ef4444' },
          ].map((s, i) => (
            <HolographicSheen key={s.label} intensity={0.3} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f1f5f9', animation: `fadeUp 0.5s ease ${i * 0.08}s both` }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: -0.5, marginTop: 4 }}><NumberTicker value={s.value} suffix={s.suffix} duration={1.5} /></div>
            </HolographicSheen>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          {/* IV Smile */}
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>😊 IV Smile / Skew</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={data?.smileData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={Math.floor((data?.smileData?.length || 10) / 10)} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} domain={['auto', 'auto']} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} formatter={(v: number) => `${v?.toFixed(2)}%`} />
                <Line type="monotone" dataKey="callIV" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Call IV" />
                <Line type="monotone" dataKey="putIV" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} name="Put IV" />
                <Line type="monotone" dataKey="avgIV" stroke="#6366f1" strokeWidth={2.5} dot={false} strokeDasharray="5 5" name="Avg IV" />
              </ComposedChart>
            </ResponsiveContainer>
          </HolographicSheen>

          {/* Term Structure */}
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease 0.1s both' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>📅 IV Term Structure</div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data?.termStructure || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="daysToExpiry" tick={{ fontSize: 9, fill: '#94a3b8' }} unit="d" />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} domain={['auto', 'auto']} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} formatter={(v: number) => `${v?.toFixed(2)}%`} labelFormatter={(l: any) => `${l} days`} />
                <Area type="monotone" dataKey="atmIV" stroke="#06b6d4" fill="#06b6d420" strokeWidth={2.5} name="ATM IV" />
              </AreaChart>
            </ResponsiveContainer>
          </HolographicSheen>
        </div>

        {/* IV by Moneyness */}
        <HolographicSheen intensity={0.2} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.7s ease both' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>📊 IV by Moneyness</div>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={data?.smileData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="moneyness" tick={{ fontSize: 9, fill: '#94a3b8' }} unit="%" label={{ value: 'Moneyness %', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} formatter={(v: number) => `${v?.toFixed(2)}%`} />
              <Bar dataKey="avgIV" fill="#6366f120" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="avgIV" stroke="#6366f1" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </HolographicSheen>
      </div>
    </DashboardLayout>
  );
};

export default VolatilityDashboard;
