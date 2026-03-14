import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { RefreshCw, Grid3X3, BarChart3, Activity } from 'lucide-react';
import { HolographicSheen, SplitText, ScanLine, SlideReveal } from '../components/ui/AceternityEffects';

const SYMBOLS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
const METRICS = [
  { id: 'oi', label: 'Open Interest', icon: '📊' },
  { id: 'volume', label: 'Volume', icon: '📈' },
  { id: 'iv', label: 'Implied Volatility', icon: '🌊' },
  { id: 'oi_change', label: 'OI Change', icon: '🔄' },
];

const HeatmapDashboard: React.FC = () => {
  const [symbol, setSymbol] = useState('NIFTY');
  const [metric, setMetric] = useState('oi');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5001/api/options/heatmap?symbol=${symbol}&metric=${metric}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      const strikes = Array.from({length: 30}, (_, i) => 21500 + i * 50);
      setData({
        symbol, underlyingValue: 22500, metric, maxValue: 1000000,
        heatmapData: strikes.map(s => ({
          strike: s, callValue: Math.floor(Math.random() * 1000000), putValue: Math.floor(Math.random() * 1000000),
          totalValue: Math.floor(Math.random() * 2000000), moneyness: ((s - 22500) / 22500 * 100),
          callIntensity: Math.random(), putIntensity: Math.random(),
        })),
      });
    } finally { setLoading(false); }
  }, [symbol, metric]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getColor = (intensity: number, type: 'call' | 'put') => {
    const alpha = Math.min(intensity * 0.9 + 0.1, 1);
    if (type === 'call') return `rgba(239, 68, 68, ${alpha})`;
    return `rgba(16, 185, 129, ${alpha})`;
  };

  const getTextColor = (intensity: number) => intensity > 0.5 ? '#fff' : '#1e293b';
  const formatValue = (v: number) => {
    if (metric === 'iv') return `${v?.toFixed(1)}%`;
    if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return v?.toFixed(0) || '0';
  };

  return (
    <DashboardLayout>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}.heat-cell:hover{transform:scale(1.05);z-index:10;box-shadow:0 4px 12px rgba(0,0,0,0.15)!important}`}</style>
      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>
        <ScanLine color="rgba(239,68,68,0.08)" speed={5} style={{ background: 'linear-gradient(135deg, #020617, #1c1917, #7f1d1d)', borderRadius: 20, padding: '24px 32px', marginBottom: 16, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 4px' }}><SplitText text="🔥 Options Heatmap" stagger={0.02} /></h1>
              <p style={{ fontSize: 12, opacity: 0.5, margin: 0 }}>Visual strike-level analysis • OI, Volume, IV intensity</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SYMBOLS.map(s => (
                <button key={s} onClick={() => setSymbol(s)} style={{ padding: '7px 16px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: symbol === s ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'rgba(255,255,255,0.06)', color: '#fff', border: symbol === s ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>{s}</button>
              ))}
            </div>
          </div>
        </ScanLine>

        {/* Metric Selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {METRICS.map(m => (
            <button key={m.id} onClick={() => setMetric(m.id)} style={{
              padding: '8px 20px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: metric === m.id ? 'linear-gradient(135deg, #1e293b, #334155)' : '#fff', color: metric === m.id ? '#fff' : '#64748b',
              border: metric === m.id ? 'none' : '1px solid #e2e8f0', transition: 'all 0.3s', display: 'flex', gap: 6, alignItems: 'center',
            }}><span>{m.icon}</span> {m.label}</button>
          ))}
        </div>

        {/* Heatmap Grid */}
        <HolographicSheen intensity={0.2} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 1fr', gap: 0, marginBottom: 8, fontSize: 10, fontWeight: 700, color: '#64748b', textAlign: 'center' }}>
            <div></div><div>CALL {METRICS.find(m => m.id === metric)?.label}</div><div>STRIKE</div><div>PUT {METRICS.find(m => m.id === metric)?.label}</div>
          </div>

          <div style={{ maxHeight: 600, overflowY: 'auto' }}>
            {(data?.heatmapData || []).map((row: any, i: number) => {
              const isATM = Math.abs(row.strike - (data?.underlyingValue || 0)) < 30;
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 1fr', gap: 2, marginBottom: 2, animation: `fadeUp 0.3s ease ${i * 0.02}s both` }}>
                  {/* Call value label */}
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>
                    {formatValue(row.callValue)}
                  </div>
                  {/* Call bar */}
                  <div className="heat-cell" style={{
                    height: 28, borderRadius: 4, background: getColor(row.callIntensity, 'call'), display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: getTextColor(row.callIntensity), transition: 'all 0.2s', cursor: 'pointer',
                  }}>
                    {row.callIntensity > 0.3 && formatValue(row.callValue)}
                  </div>
                  {/* Strike */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: isATM ? 900 : 600,
                    color: isATM ? '#6366f1' : '#1e293b', background: isATM ? 'rgba(99,102,241,0.08)' : undefined, borderRadius: 4,
                  }}>{row.strike}</div>
                  {/* Put bar */}
                  <div className="heat-cell" style={{
                    height: 28, borderRadius: 4, background: getColor(row.putIntensity, 'put'), display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: getTextColor(row.putIntensity), transition: 'all 0.2s', cursor: 'pointer',
                  }}>
                    {row.putIntensity > 0.3 && formatValue(row.putValue)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16, fontSize: 10, color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600 }}>Low</span>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => <div key={v} style={{ width: 20, height: 12, borderRadius: 2, background: `rgba(239, 68, 68, ${v})` }} />)}
              <span style={{ fontWeight: 600 }}>High (Calls)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600 }}>Low</span>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => <div key={v} style={{ width: 20, height: 12, borderRadius: 2, background: `rgba(16, 185, 129, ${v})` }} />)}
              <span style={{ fontWeight: 600 }}>High (Puts)</span>
            </div>
          </div>
        </HolographicSheen>
      </div>
    </DashboardLayout>
  );
};

export default HeatmapDashboard;
