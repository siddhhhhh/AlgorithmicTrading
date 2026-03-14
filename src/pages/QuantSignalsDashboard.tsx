import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Brain, TrendingUp, TrendingDown, Activity, Eye, Zap, RefreshCw, Target, Shield } from 'lucide-react';
import { HolographicSheen, NumberTicker, SplitText, ScanLine, DataPulse, PulseWave, NeonBorder, SlideReveal, GlassParallax } from '../components/ui/AceternityEffects';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

const QuantSignalsDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('NIFTY');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/signals?symbol=${symbol}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setData({
        symbol, underlyingValue: 22500,
        signals: [
          { name: 'Put-Call Ratio (OI)', value: 1.08, score: 40, direction: 'Bullish', description: 'PCR of 1.08 — Put writers dominating (bullish)', category: 'OI Analysis' },
          { name: 'OI Concentration', value: 'Res: 22600, Sup: 22300', score: 30, direction: 'Bullish', description: 'Max Call OI at 22600, Max Put OI at 22300', category: 'OI Analysis' },
          { name: 'IV Level', value: 16.2, score: -20, direction: 'Neutral', description: 'Avg IV: 16.2% — Normal IV environment', category: 'Volatility' },
          { name: 'Call/Put Volume Ratio', value: 1.18, score: -30, direction: 'Bearish', description: 'CE/PE Volume: 1.18 — Slightly elevated call buying', category: 'Volume' },
          { name: 'IV Skew (Put - Call)', value: 2.4, score: 10, direction: 'Neutral', description: 'Put IV premium: 2.4% — Normal skew', category: 'Volatility' },
        ],
        compositeScore: 18.5, overallSignal: 'Neutral',
        metrics: { pcrOI: 1.08, pcrVolume: 0.95, avgCallIV: 15.8, avgPutIV: 18.2, maxCallOIStrike: 22600, maxPutOIStrike: 22300 },
      });
    } finally { setLoading(false); }
  }, [symbol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getSignalColor = (signal: string) => {
    if (signal === 'Strong Buy' || signal === 'Buy' || signal === 'Bullish') return '#10b981';
    if (signal === 'Strong Sell' || signal === 'Sell' || signal === 'Bearish') return '#ef4444';
    return '#f59e0b';
  };

  const getScoreColor = (score: number) => score > 30 ? '#10b981' : score < -30 ? '#ef4444' : '#f59e0b';

  const radarData = (data?.signals || []).map((s: any) => ({
    subject: s.name.split(' ')[0],
    value: Math.abs(s.score),
    fullName: s.name,
  }));

  return (
    <DashboardLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes breathe{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.04)}}@keyframes gaugeGlow{0%,100%{filter:drop-shadow(0 0 6px rgba(99,102,241,0.3))}50%{filter:drop-shadow(0 0 16px rgba(99,102,241,0.5))}}`}</style>
      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>
        {/* Header */}
        <ScanLine color="rgba(99,102,241,0.1)" speed={4} style={{ background: 'linear-gradient(135deg, #020617 0%, #0c1222 40%, #1e1b4b 100%)', borderRadius: 20, padding: '24px 32px', marginBottom: 16, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}><SplitText text="🧠 Quant Signal Engine" stagger={0.02} /></h1>
              <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>Multi-factor composite signals • OI • IV • Volume • Gamma</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SYMBOLS.map(s => (
                <button key={s} onClick={() => setSymbol(s)} style={{ padding: '7px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: symbol === s ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)', color: '#fff', border: symbol === s ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>{s}</button>
              ))}
              <button onClick={fetchData} style={{ padding: 7, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}><RefreshCw size={14} /></button>
            </div>
          </div>
        </ScanLine>

        {/* Overall Signal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 14, marginBottom: 16 }}>
          {/* Composite Gauge */}
          <HolographicSheen intensity={0.4} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #f1f5f9', textAlign: 'center', animation: 'fadeUp 0.5s ease both' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Composite Score</div>
            <div style={{ animation: 'gaugeGlow 3s ease infinite' }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `conic-gradient(${getScoreColor(data?.compositeScore || 0)} ${Math.abs(data?.compositeScore || 0)}%, #f1f5f9 0)`,
                position: 'relative',
              }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: getScoreColor(data?.compositeScore || 0) }}>
                    {(data?.compositeScore || 0) > 0 ? '+' : ''}{data?.compositeScore?.toFixed(1) || '0'}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '6px 16px', borderRadius: 20, background: `${getSignalColor(data?.overallSignal || 'Neutral')}15`, display: 'inline-block' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: getSignalColor(data?.overallSignal || 'Neutral') }}>{data?.overallSignal || 'N/A'}</span>
            </div>
          </HolographicSheen>

          {/* Signal Bars */}
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>📊 Signal Strength</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.signals || []} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} domain={[-100, 100]} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} width={80} />
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                  {(data?.signals || []).map((s: any, i: number) => (
                    <Cell key={i} fill={getScoreColor(s.score)} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </HolographicSheen>

          {/* Radar */}
          <HolographicSheen intensity={0.25} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease 0.1s both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>🎯 Signal Radar</div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#64748b' }} />
                <PolarRadiusAxis tick={false} domain={[0, 100]} />
                <Radar name="Signal" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </HolographicSheen>
        </div>

        {/* Signal Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
          {(data?.signals || []).map((signal: any, i: number) => (
            <HolographicSheen key={i} intensity={0.25} style={{
              background: '#fff', borderRadius: 14, padding: 16, border: '1px solid #f1f5f9', animation: `fadeUp 0.5s ease ${i * 0.08}s both`,
              borderLeft: `4px solid ${getScoreColor(signal.score)}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{signal.name}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>{signal.category}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DataPulse color={getScoreColor(signal.score)} active>
                    <div style={{ padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800, background: `${getSignalColor(signal.direction)}15`, color: getSignalColor(signal.direction) }}>
                      {signal.direction}
                    </div>
                  </DataPulse>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, marginBottom: 10 }}>{signal.description}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Value: <span style={{ fontWeight: 700, color: '#1e293b' }}>{typeof signal.value === 'number' ? signal.value.toFixed(2) : signal.value}</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 60, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.abs(signal.score)}%`, height: '100%', background: getScoreColor(signal.score), borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: getScoreColor(signal.score) }}>{signal.score > 0 ? '+' : ''}{signal.score}</span>
                </div>
              </div>
            </HolographicSheen>
          ))}
        </div>

        {/* Key Metrics */}
        {data?.metrics && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginTop: 16 }}>
            {[
              { label: 'PCR (OI)', value: data.metrics.pcrOI?.toFixed(2) },
              { label: 'PCR (Vol)', value: data.metrics.pcrVolume?.toFixed(2) },
              { label: 'Avg Call IV', value: `${data.metrics.avgCallIV?.toFixed(1)}%` },
              { label: 'Avg Put IV', value: `${data.metrics.avgPutIV?.toFixed(1)}%` },
              { label: 'Max Call OI @', value: data.metrics.maxCallOIStrike },
              { label: 'Max Put OI @', value: data.metrics.maxPutOIStrike },
            ].map(m => (
              <HolographicSheen key={m.label} intensity={0.2} style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', border: '1px solid #f1f5f9', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{m.value}</div>
              </HolographicSheen>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default QuantSignalsDashboard;
