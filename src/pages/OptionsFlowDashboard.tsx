import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { RefreshCw, Zap, TrendingUp, TrendingDown, AlertTriangle, Filter, Eye } from 'lucide-react';
import { HolographicSheen, NumberTicker, SplitText, ScanLine, DataPulse, SlideReveal } from '../components/ui/AceternityEffects';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
const FLAG_COLORS: Record<string, string> = { 'High Vol/OI': '#ef4444', 'Large Block': '#f59e0b', 'OI Surge': '#8b5cf6', 'High IV': '#06b6d4' };

const OptionsFlowDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('NIFTY');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/options/flow?symbol=${symbol}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      const types = ['CE', 'PE'];
      const flags = ['High Vol/OI', 'Large Block', 'OI Surge', 'High IV'];
      const strikes = Array.from({length: 20}, (_, i) => 22000 + i * 50);
      const unusual = strikes.flatMap(s => types.map(t => ({
        strike: s, type: t, volume: Math.floor(Math.random() * 200000), oi: Math.floor(Math.random() * 500000),
        oiChange: Math.floor((Math.random() - 0.3) * 80000), ltp: Math.random() * 400, iv: 10 + Math.random() * 30, change: (Math.random() - 0.4) * 50,
        volOIRatio: Math.random() * 5, flags: [flags[Math.floor(Math.random() * flags.length)]],
        isUnusual: true, sentiment: Math.random() > 0.5 ? 'Bullish' : 'Bearish', score: Math.floor(Math.random() * 100),
      }))).sort((a, b) => b.score - a.score).slice(0, 15);

      setData({
        symbol, underlyingValue: 22500, unusualActivity: unusual,
        summary: { totalCallVolume: 8500000, totalPutVolume: 7200000, volRatio: 1.18, unusualCount: unusual.length, bullishFlows: 8, bearishFlows: 7, flowSentiment: 'Neutral' },
      });
    } finally { setLoading(false); }
  }, [symbol]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = (data?.unusualActivity || []).filter((u: any) => filterType === 'ALL' || u.type === filterType);

  return (
    <DashboardLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes pulseGlow{0%,100%{box-shadow:0 0 8px rgba(239,68,68,0.3)}50%{box-shadow:0 0 20px rgba(239,68,68,0.5)}}`}</style>
      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>
        <ScanLine color="rgba(239,68,68,0.08)" speed={4} style={{ background: 'linear-gradient(135deg, #020617, #1c1917, #7f1d1d)', borderRadius: 20, padding: '24px 32px', marginBottom: 16, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}><SplitText text="🔥 Unusual Options Activity" stagger={0.02} /></h1>
              <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>Block trades • Volume spikes • OI surges • Smart money flow</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SYMBOLS.map(s => (
                <button key={s} onClick={() => setSymbol(s)} style={{ padding: '7px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: symbol === s ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(255,255,255,0.06)', color: '#fff', border: symbol === s ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>{s}</button>
              ))}
            </div>
          </div>
        </ScanLine>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Unusual Alerts', value: data?.summary?.unusualCount || 0, color: '#ef4444', icon: AlertTriangle },
            { label: 'Bullish Flows', value: data?.summary?.bullishFlows || 0, color: '#10b981', icon: TrendingUp },
            { label: 'Bearish Flows', value: data?.summary?.bearishFlows || 0, color: '#ef4444', icon: TrendingDown },
            { label: 'CE/PE Vol Ratio', value: data?.summary?.volRatio || 0, color: '#6366f1', icon: Zap },
            { label: 'Flow Sentiment', value: data?.summary?.flowSentiment || 'N/A', color: data?.summary?.flowSentiment === 'Bullish' ? '#10b981' : data?.summary?.flowSentiment === 'Bearish' ? '#ef4444' : '#f59e0b', icon: Eye, isText: true },
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
                      <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}><NumberTicker value={typeof s.value === 'number' ? s.value : 0} duration={1.5} /></div>
                    )}
                  </div>
                </div>
              </HolographicSheen>
            );
          })}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['ALL', 'CE', 'PE'].map(f => (
            <button key={f} onClick={() => setFilterType(f)} style={{
              padding: '6px 18px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              background: filterType === f ? '#1e293b' : '#fff', color: filterType === f ? '#fff' : '#64748b',
              border: filterType === f ? 'none' : '1px solid #e2e8f0', transition: 'all 0.2s',
            }}>{f === 'ALL' ? '🔍 All' : f === 'CE' ? '📗 Calls' : '📕 Puts'}</button>
          ))}
        </div>

        {/* Activity Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {filtered.map((u: any, i: number) => (
            <HolographicSheen key={i} intensity={0.3} style={{
              background: '#fff', borderRadius: 14, padding: 16, border: `1px solid ${u.sentiment === 'Bullish' ? '#dcfce7' : '#fef2f2'}`,
              animation: `fadeUp 0.5s ease ${i * 0.05}s both`, transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <DataPulse color={u.type === 'CE' ? '#10b981' : '#ef4444'} active>
                    <div style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: u.type === 'CE' ? '#dcfce7' : '#fef2f2', color: u.type === 'CE' ? '#166534' : '#991b1b' }}>{u.type}</div>
                  </DataPulse>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{u.strike}</div>
                </div>
                <div style={{ padding: '3px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: u.sentiment === 'Bullish' ? '#dcfce7' : '#fef2f2', color: u.sentiment === 'Bullish' ? '#166534' : '#991b1b' }}>
                  {u.sentiment === 'Bullish' ? '🟢' : '🔴'} {u.sentiment}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 10, marginBottom: 10 }}>
                <div><span style={{ color: '#94a3b8', fontWeight: 600 }}>Volume</span><br /><span style={{ fontWeight: 700, color: '#1e293b' }}>{(u.volume / 1000).toFixed(0)}K</span></div>
                <div><span style={{ color: '#94a3b8', fontWeight: 600 }}>OI</span><br /><span style={{ fontWeight: 700, color: '#1e293b' }}>{(u.oi / 1000).toFixed(0)}K</span></div>
                <div><span style={{ color: '#94a3b8', fontWeight: 600 }}>Vol/OI</span><br /><span style={{ fontWeight: 700, color: u.volOIRatio > 2 ? '#ef4444' : '#1e293b' }}>{u.volOIRatio?.toFixed(1)}x</span></div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(u.flags || []).map((f: string, fi: number) => (
                  <span key={fi} style={{ padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: `${FLAG_COLORS[f] || '#94a3b8'}15`, color: FLAG_COLORS[f] || '#94a3b8' }}>{f}</span>
                ))}
              </div>
            </HolographicSheen>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OptionsFlowDashboard;
