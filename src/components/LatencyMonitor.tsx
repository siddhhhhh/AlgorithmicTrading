import React, { useMemo } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { Activity, Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react';

const LatencyMonitor: React.FC = () => {
  const { isConnected, connectionLatency, latencyHistory, lastUpdateAge, marketData } = useSocket();

  const nseFetchMs = marketData?.latency?.nse_fetch_ms ?? 0;
  const isStale = lastUpdateAge > 10000;

  const latencyColor = (ms: number) => {
    if (ms <= 0) return '#64748b';
    if (ms < 100) return '#10b981';
    if (ms < 500) return '#f59e0b';
    return '#ef4444';
  };

  const formatAge = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m`;
  };

  // Mini sparkline from latency history
  const sparklinePath = useMemo(() => {
    if (latencyHistory.length < 2) return '';
    const max = Math.max(...latencyHistory, 1);
    const w = 80, h = 20;
    return latencyHistory.map((v, i) => {
      const x = (i / (latencyHistory.length - 1)) * w;
      const y = h - (v / max) * h;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [latencyHistory]);

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
      borderRadius: 14, padding: '12px 16px', minWidth: 220,
      border: `1px solid ${isConnected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.3)'}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: '#e2e8f0', fontSize: 10,
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isConnected ? <Wifi size={11} color="#10b981" /> : <WifiOff size={11} color="#ef4444" />}
          <span style={{ fontWeight: 700, fontSize: 9, color: isConnected ? '#10b981' : '#ef4444', textTransform: 'uppercase', letterSpacing: 1 }}>
            {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isConnected ? '#10b981' : '#ef4444',
          animation: isConnected ? 'pulse 2s infinite' : 'none',
          boxShadow: isConnected ? '0 0 8px rgba(16,185,129,0.5)' : '0 0 8px rgba(239,68,68,0.5)',
        }} />
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
        <div>
          <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>WS RTT</div>
          <div style={{ fontWeight: 700, color: latencyColor(connectionLatency), fontSize: 12 }}>
            {connectionLatency > 0 ? `${connectionLatency}ms` : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>NSE FETCH</div>
          <div style={{ fontWeight: 700, color: latencyColor(nseFetchMs), fontSize: 12 }}>
            {nseFetchMs > 0 ? `${nseFetchMs.toFixed(0)}ms` : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>LAST TICK</div>
          <div style={{ fontWeight: 700, color: isStale ? '#ef4444' : latencyColor(lastUpdateAge), fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={9} />
            {formatAge(lastUpdateAge)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>DATA</div>
          <div style={{ fontWeight: 700, color: isStale ? '#ef4444' : '#10b981', fontSize: 10 }}>
            {isStale ? 'STALE' : 'FRESH'}
          </div>
        </div>
      </div>

      {/* Sparkline */}
      {latencyHistory.length > 1 && (
        <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 6 }}>
          <div style={{ fontSize: 8, color: '#64748b', fontWeight: 600, marginBottom: 3 }}>LATENCY TREND</div>
          <svg width="80" height="20" viewBox="0 0 80 20" style={{ width: '100%', height: 20, display: 'block' }}>
            <path d={sparklinePath} fill="none" stroke={latencyColor(connectionLatency)} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Staleness warning */}
      {isStale && (
        <div style={{
          marginTop: 6, padding: '4px 8px', borderRadius: 6,
          background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
          fontSize: 9, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
          animation: 'pulse 1.5s infinite',
        }}>
          <AlertTriangle size={10} />
          Data delayed &gt;{Math.floor(lastUpdateAge / 1000)}s
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default React.memo(LatencyMonitor);
