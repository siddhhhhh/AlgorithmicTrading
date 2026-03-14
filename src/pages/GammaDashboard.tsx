import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, AreaChart, Area } from 'recharts';
import { Activity, Zap, Target, TrendingUp, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { HolographicSheen, NumberTicker, SplitText, PulseWave, NeonBorder, SlideReveal, DataPulse, ScanLine } from '../components/ui/AceternityEffects';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

const GammaDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('NIFTY');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5001/api/options/gex?symbol=${symbol}`);
      if (!res.ok) throw new Error('Failed to fetch GEX data');
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message);
      // Fallback demo data
      const strikes = Array.from({length: 30}, (_, i) => 21500 + i * 50);
      const spot = 22500;
      setData({
        symbol, underlyingValue: spot, contractSize: 25,
        gexData: strikes.map(s => ({ strike: s, callGex: Math.random() * 5 - 1, putGex: -(Math.random() * 5 - 1), netGex: (Math.random() - 0.5) * 8, callOI: Math.floor(Math.random() * 500000), putOI: Math.floor(Math.random() * 500000) })),
        totalPositiveGex: 12.5, totalNegativeGex: -8.3, netGex: 4.2, maxGexStrike: 22500, gammaFlip: 22300,
        gammaWalls: [{strike: 22500, gex: 6.2}, {strike: 22600, gex: 4.1}, {strike: 22400, gex: -5.3}, {strike: 22700, gex: 3.8}, {strike: 22200, gex: -3.1}],
      });
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = data?.gexData?.map((d: any) => ({
    ...d, fill: d.netGex >= 0 ? '#10b981' : '#ef4444',
  })) || [];

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes breathe{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.2)}50%{box-shadow:0 0 20px 4px rgba(99,102,241,0.15)}}
      `}</style>

      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>
        {/* Header */}
        <ScanLine color="rgba(16,185,129,0.1)" speed={5} style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1222 40%, #064e3b 100%)', borderRadius: 20, padding: '24px 32px', marginBottom: 16, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px', letterSpacing: -0.5 }}>
                <SplitText text="⚡ Gamma Exposure (GEX) Dashboard" stagger={0.02} />
              </h1>
              <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>Dealer gamma exposure analysis • Gamma walls • Flip points</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {SYMBOLS.map(s => (
                <button key={s} onClick={() => setSymbol(s)} style={{
                  padding: '7px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  background: symbol === s ? 'linear-gradient(135deg,#10b981,#059669)' : 'rgba(255,255,255,0.06)',
                  color: '#fff', border: symbol === s ? 'none' : '1px solid rgba(255,255,255,0.1)', transition: 'all 0.3s',
                }}>{s}</button>
              ))}
              <button onClick={fetchData} style={{ padding: 7, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
              </button>
            </div>
          </div>
        </ScanLine>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Net GEX', value: data?.netGex || 0, suffix: ' Cr', color: (data?.netGex || 0) >= 0 ? '#10b981' : '#ef4444', icon: Zap },
            { label: 'Positive GEX', value: data?.totalPositiveGex || 0, suffix: ' Cr', color: '#10b981', icon: TrendingUp },
            { label: 'Negative GEX', value: data?.totalNegativeGex || 0, suffix: ' Cr', color: '#ef4444', icon: TrendingDown },
            { label: 'Max GEX Strike', value: data?.maxGexStrike || 0, suffix: '', color: '#6366f1', icon: Target },
            { label: 'Gamma Flip', value: data?.gammaFlip || 0, suffix: '', color: '#f59e0b', icon: AlertTriangle },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <HolographicSheen key={stat.label} intensity={0.3} style={{
                background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f1f5f9',
                animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DataPulse color={stat.color} active>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${stat.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={stat.color} />
                    </div>
                  </DataPulse>
                  <div>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: stat.color, letterSpacing: -0.5 }}>
                      <NumberTicker value={Math.abs(Math.round(stat.value * 100) / 100)} prefix={stat.value < 0 ? '-' : ''} suffix={stat.suffix} duration={1.5} />
                    </div>
                  </div>
                </div>
              </HolographicSheen>
            );
          })}
        </div>

        {/* Main Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 14, marginBottom: 16 }}>
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} color="#10b981" /> Net Gamma Exposure by Strike
            </div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="strike" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval={Math.floor(chartData.length / 15)} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                {data?.underlyingValue && <ReferenceLine x={Math.round(data.underlyingValue / 50) * 50} stroke="#6366f1" strokeDasharray="4 4" label={{ value: 'Spot', position: 'top', fontSize: 10, fill: '#6366f1' }} />}
                {data?.gammaFlip && <ReferenceLine x={data.gammaFlip} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Flip', position: 'top', fontSize: 10, fill: '#f59e0b' }} />}
                <Bar dataKey="netGex" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={entry.netGex >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </HolographicSheen>

          {/* Gamma Walls */}
          <HolographicSheen intensity={0.3} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease 0.1s both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Target size={13} color="#f59e0b" /> Gamma Walls
            </div>
            <SlideReveal direction="up" delay={0.2}>
              {(data?.gammaWalls || []).map((wall: any, i: number) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, marginBottom: 6,
                  background: wall.gex >= 0 ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${wall.gex >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}`,
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>{wall.strike}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{wall.gex >= 0 ? 'Support Wall' : 'Resistance Wall'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: wall.gex >= 0 ? '#10b981' : '#ef4444' }}>
                      {wall.gex >= 0 ? '+' : ''}{typeof wall.gex === 'number' ? wall.gex.toFixed(2) : wall.gex} Cr
                    </div>
                    {wall.gex >= 0 ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
                  </div>
                </div>
              ))}
            </SlideReveal>

            {/* Spot Info */}
            <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 12, background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', marginBottom: 4 }}>Underlying Spot</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>
                <NumberTicker value={data?.underlyingValue || 0} duration={1.5} />
              </div>
            </div>
          </HolographicSheen>
        </div>

        {/* Call/Put GEX Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.7s ease both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>📗 Call GEX by Strike</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={Math.floor(chartData.length / 8)} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 10 }} />
                <Area type="monotone" dataKey="callGex" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </HolographicSheen>

          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.7s ease 0.1s both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>📕 Put GEX by Strike</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#94a3b8' }} interval={Math.floor(chartData.length / 8)} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 10 }} />
                <Area type="monotone" dataKey="putGex" stroke="#ef4444" fill="#ef444420" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </HolographicSheen>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GammaDashboard;
