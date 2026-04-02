import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, Clock, Radio } from 'lucide-react';

const LiveStatusBar: React.FC = () => {
  const { isConnected, connectionLatency, marketData, lastUpdateAge } = useSocket();
  const [countdown, setCountdown] = useState('');

  const session = marketData?.marketSession;
  const nseFetchMs = marketData?.latency?.nse_fetch_ms ?? 0;

  // Countdown to next session
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
      const mins = h * 60 + m;
      let target = '';
      let remainSecs = 0;

      if (mins < 9 * 60) {
        remainSecs = (9 * 60 - mins) * 60 - s;
        target = 'Pre-Market';
      } else if (mins < 9 * 60 + 15) {
        remainSecs = (9 * 60 + 15 - mins) * 60 - s;
        target = 'Market Open';
      } else if (mins < 15 * 60 + 30) {
        remainSecs = (15 * 60 + 30 - mins) * 60 - s;
        target = 'Market Close';
      } else if (mins < 16 * 60) {
        remainSecs = (16 * 60 - mins) * 60 - s;
        target = 'Session End';
      }

      if (remainSecs > 0 && now.getDay() >= 1 && now.getDay() <= 5) {
        const hrs = Math.floor(remainSecs / 3600);
        const mns = Math.floor((remainSecs % 3600) / 60);
        const scs = remainSecs % 60;
        setCountdown(`${target} in ${hrs > 0 ? `${hrs}h ` : ''}${mns}m ${scs}s`);
      } else {
        setCountdown('');
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcuts
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try { navigate = useNavigate(); } catch { /* Not in Router context */ }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!e.altKey || !navigate) return;
    const routes: Record<string, string> = { '1': '/dashboard', '2': '/option-chain', '3': '/gamma-exposure', '4': '/backtesting' };
    if (routes[e.key]) {
      e.preventDefault();
      navigate(routes[e.key]);
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const latencyColor = (ms: number) => ms < 100 ? '#10b981' : ms < 500 ? '#f59e0b' : '#ef4444';

  const formatAge = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
      height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
      background: 'linear-gradient(90deg, rgba(15,23,42,0.97), rgba(30,41,59,0.97))',
      backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(255,255,255,0.05)',
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 10, color: '#94a3b8', padding: '0 20px',
    }}>
      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: isConnected ? '#10b981' : '#ef4444',
          boxShadow: isConnected ? '0 0 8px rgba(16,185,129,0.6)' : '0 0 8px rgba(239,68,68,0.6)',
          animation: isConnected ? 'statusPulse 2s infinite' : 'none',
        }} />
        <span style={{ fontWeight: 700, color: isConnected ? '#10b981' : '#ef4444', letterSpacing: 1 }}>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />

      {/* NSE latency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Zap size={9} color={latencyColor(nseFetchMs)} />
        <span style={{ color: '#64748b' }}>NSE:</span>
        <span style={{ fontWeight: 700, color: latencyColor(nseFetchMs) }}>{nseFetchMs > 0 ? `${nseFetchMs.toFixed(0)}ms` : '—'}</span>
      </div>

      {/* WS latency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Radio size={9} color={latencyColor(connectionLatency)} />
        <span style={{ color: '#64748b' }}>WS:</span>
        <span style={{ fontWeight: 700, color: latencyColor(connectionLatency) }}>{connectionLatency > 0 ? `${connectionLatency}ms` : '—'}</span>
      </div>

      {/* Last tick */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Clock size={9} color={lastUpdateAge > 10000 ? '#ef4444' : '#64748b'} />
        <span style={{ color: '#64748b' }}>Tick:</span>
        <span style={{ fontWeight: 700, color: lastUpdateAge > 10000 ? '#ef4444' : lastUpdateAge > 5000 ? '#f59e0b' : '#10b981' }}>
          {formatAge(lastUpdateAge)} ago
        </span>
      </div>

      <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.08)' }} />

      {/* Market session */}
      {session && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Activity size={9} color={session.color} />
          <span style={{ fontWeight: 700, color: session.color }}>{session.label}</span>
          {countdown && <span style={{ color: '#475569', fontSize: 9 }}>• {countdown}</span>}
        </div>
      )}

      {/* Keyboard hints (far right) */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, fontSize: 8, color: '#475569' }}>
        {['Alt+1 Dash', 'Alt+2 Options', 'Alt+3 GEX', 'Alt+4 Backtest'].map(s => (
          <span key={s} style={{ padding: '1px 4px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>{s}</span>
        ))}
      </div>

      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(16,185,129,0.6); }
          50% { opacity: 0.6; box-shadow: 0 0 4px rgba(16,185,129,0.3); }
        }
      `}</style>
    </div>
  );
};

export default React.memo(LiveStatusBar);
