import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { Target, Shield } from 'lucide-react';

// ── Flash animation hook ────────────────────────────────────────────────────

function useFlash(value: number): 'up' | 'down' | null {
  const prevRef = useRef<number>(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlash(value > prevRef.current ? 'up' : 'down');
      prevRef.current = value;
      const timer = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return flash;
}

// ── Cell component with flash ────────────────────────────────────────────────

const FlashCell: React.FC<{ value: number; format?: string; align?: string }> = React.memo(({ value, format = 'number', align = 'right' }) => {
  const flash = useFlash(value);
  const formatted = format === 'oi' ? (value >= 100000 ? `${(value / 100000).toFixed(2)}L` : value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString())
    : format === 'pct' ? `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    : format === 'vol' ? (value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value.toString())
    : value.toFixed(2);

  return (
    <td style={{
      textAlign: align as 'left' | 'right' | 'center',
      padding: '4px 6px',
      fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace",
      transition: 'background 0.3s',
      background: flash === 'up' ? 'rgba(16,185,129,0.15)' : flash === 'down' ? 'rgba(239,68,68,0.15)' : 'transparent',
      color: format === 'pct' ? (value > 0 ? '#10b981' : value < 0 ? '#ef4444' : '#94a3b8') : '#e2e8f0',
    }}>
      {formatted}
    </td>
  );
});
FlashCell.displayName = 'FlashCell';

// ── OI bar visualization ────────────────────────────────────────────────────

const OIBar: React.FC<{ value: number; max: number; color: string; side: 'left' | 'right' }> = React.memo(({ value, max, color, side }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{
      position: 'relative', width: '100%', height: 18,
      background: 'rgba(255,255,255,0.02)', borderRadius: 3,
    }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, borderRadius: 3,
        [side === 'left' ? 'right' : 'left']: 0,
        width: `${Math.min(pct, 100)}%`,
        background: `${color}22`,
        border: `1px solid ${color}44`,
        transition: 'width 0.5s ease',
      }} />
      <span style={{
        position: 'absolute', top: 2, [side === 'left' ? 'left' : 'right']: 4,
        fontSize: 9, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace",
      }}>
        {value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
      </span>
    </div>
  );
});
OIBar.displayName = 'OIBar';

// ── Main Component ──────────────────────────────────────────────────────────

const LiveOptionsChain: React.FC = () => {
  const { optionsData, changeSymbol, isConnected } = useSocket();
  const [selectedSymbol, setSelectedSymbol] = useState('NIFTY');
  const [strikeRange, setStrikeRange] = useState(10); // ATM ± N

  const symbols = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

  const handleSymbolChange = useCallback((sym: string) => {
    setSelectedSymbol(sym);
    changeSymbol(sym);
  }, [changeSymbol]);

  // Filter strikes around ATM
  const filteredData = useMemo(() => {
    if (!optionsData?.data || !optionsData.underlyingValue) return [];
    const S = optionsData.underlyingValue;
    const sorted = [...optionsData.data].sort((a, b) => a.strike - b.strike);

    // Find ATM index
    const atmIdx = sorted.reduce((bestIdx, curr, idx) =>
      Math.abs(curr.strike - S) < Math.abs(sorted[bestIdx].strike - S) ? idx : bestIdx, 0);

    const start = Math.max(0, atmIdx - strikeRange);
    const end = Math.min(sorted.length, atmIdx + strikeRange + 1);
    return sorted.slice(start, end);
  }, [optionsData, strikeRange]);

  // Max OI for bar scaling
  const maxOI = useMemo(() => {
    if (!filteredData.length) return 1;
    return Math.max(...filteredData.map(r => Math.max(r.CE.oi, r.PE.oi)), 1);
  }, [filteredData]);

  const summary = optionsData?.summary;

  const pcrColor = (pcr: number) => pcr > 1.2 ? '#10b981' : pcr < 0.8 ? '#ef4444' : '#f59e0b';

  return (
    <div style={{
      background: 'rgba(15,23,42,0.6)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)',
      overflow: 'hidden', fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(30,41,59,0.4)',
      }}>
        {/* Symbol selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {symbols.map(sym => (
            <button key={sym} onClick={() => handleSymbolChange(sym)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 1,
              cursor: 'pointer', transition: 'all 0.2s',
              background: selectedSymbol === sym ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedSymbol === sym ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.06)'}`,
              color: selectedSymbol === sym ? '#a5b4fc' : '#64748b',
            }}>
              {sym}
            </button>
          ))}
        </div>

        {/* Strike range slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>ATM ±</span>
          <input type="range" min={5} max={25} value={strikeRange} onChange={e => setStrikeRange(Number(e.target.value))}
            style={{ width: 80, accentColor: '#6366f1' }} />
          <span style={{ fontSize: 10, color: '#e2e8f0', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{strikeRange}</span>
        </div>

        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: isConnected ? '#10b981' : '#ef4444',
            animation: isConnected ? 'pulse 2s infinite' : 'none',
          }} />
          <span style={{ fontSize: 9, color: isConnected ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Summary Bar */}
      {summary && (
        <div style={{
          display: 'flex', gap: 16, padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(15,23,42,0.4)', flexWrap: 'wrap',
        }}>
          {/* Underlying */}
          <div>
            <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>SPOT</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{optionsData?.underlyingValue?.toFixed(2)}</div>
          </div>
          {/* PCR */}
          <div>
            <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>PCR</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: pcrColor(summary.pcr) }}>
              {summary.pcr.toFixed(3)} <span style={{ fontSize: 9, fontWeight: 500 }}>({summary.pcrSentiment})</span>
            </div>
          </div>
          {/* Max Pain */}
          <div>
            <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>MAX PAIN</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Target size={11} /> {summary.maxPain}
            </div>
          </div>
          {/* Expected Move */}
          <div>
            <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>EXPECTED MOVE</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa' }}>±{summary.expectedMove.toFixed(1)}</div>
          </div>
          {/* Resistance */}
          <div>
            <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>RESISTANCE</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Shield size={11} /> {summary.maxCallOI.strike}
            </div>
          </div>
          {/* Support */}
          <div>
            <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>SUPPORT</span>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Shield size={11} /> {summary.maxPutOI.strike}
            </div>
          </div>
          {/* Total OI */}
          <div style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: 8, color: '#64748b', fontWeight: 600 }}>CE OI / PE OI</span>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
              <span style={{ color: '#ef4444' }}>{(summary.totalCeOI / 100000).toFixed(1)}L</span>
              {' / '}
              <span style={{ color: '#10b981' }}>{(summary.totalPeOI / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </div>
      )}

      {/* Options Chain Table */}
      <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(30,41,59,0.98)' }}>
              <th colSpan={7} style={{ padding: '6px 8px', textAlign: 'center', color: '#fca5a5', fontSize: 10, fontWeight: 700, borderBottom: '2px solid rgba(239,68,68,0.2)', letterSpacing: 1 }}>
                CALLS (CE)
              </th>
              <th style={{ padding: '6px 8px', textAlign: 'center', color: '#f59e0b', borderBottom: '2px solid rgba(245,158,11,0.3)', fontWeight: 800, fontSize: 11 }}>
                STRIKE
              </th>
              <th colSpan={7} style={{ padding: '6px 8px', textAlign: 'center', color: '#86efac', fontSize: 10, fontWeight: 700, borderBottom: '2px solid rgba(16,185,129,0.2)', letterSpacing: 1 }}>
                PUTS (PE)
              </th>
            </tr>
            <tr style={{ position: 'sticky', top: 28, zIndex: 10, background: 'rgba(30,41,59,0.95)' }}>
              {['OI', 'OI Chg', 'Vol', 'IV', 'LTP', 'Chg%', 'Bid/Ask'].map(h => (
                <th key={`ce-${h}`} style={{ padding: '4px 6px', fontSize: 8, color: '#64748b', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
              ))}
              <th style={{ padding: '4px 6px', fontSize: 8, color: '#64748b', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>STRIKE</th>
              {['Bid/Ask', 'Chg%', 'LTP', 'IV', 'Vol', 'OI Chg', 'OI'].map(h => (
                <th key={`pe-${h}`} style={{ padding: '4px 6px', fontSize: 8, color: '#64748b', fontWeight: 600, textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map(row => {
              const isATM = row.moneyness === 'ATM';
              const isCeITM = optionsData?.underlyingValue ? row.strike < optionsData.underlyingValue : false;
              const isPeITM = optionsData?.underlyingValue ? row.strike > optionsData.underlyingValue : false;

              return (
                <tr key={row.strike} style={{
                  background: isATM ? 'rgba(245,158,11,0.08)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.02)',
                  transition: 'background 0.2s',
                }} onMouseEnter={(e) => e.currentTarget.style.background = isATM ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)'}
                   onMouseLeave={(e) => e.currentTarget.style.background = isATM ? 'rgba(245,158,11,0.08)' : 'transparent'}>
                  {/* CE side */}
                  <td style={{ padding: '4px 6px', background: isCeITM ? 'rgba(239,68,68,0.04)' : undefined }}>
                    <OIBar value={row.CE.oi} max={maxOI} color="#ef4444" side="right" />
                  </td>
                  <FlashCell value={row.CE.oiChange} format="oi" />
                  <FlashCell value={row.CE.volume} format="vol" />
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{row.CE.iv.toFixed(1)}</td>
                  <FlashCell value={row.CE.ltp} />
                  <FlashCell value={row.CE.pChange} format="pct" />
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                    {row.CE.bidPrice.toFixed(1)}/{row.CE.askPrice.toFixed(1)}
                  </td>

                  {/* Strike */}
                  <td style={{
                    textAlign: 'center', fontWeight: 800, fontSize: 12, padding: '4px 8px',
                    color: isATM ? '#fbbf24' : '#e2e8f0',
                    background: isATM ? 'rgba(245,158,11,0.12)' : 'rgba(30,41,59,0.3)',
                    borderLeft: '2px solid rgba(255,255,255,0.05)',
                    borderRight: '2px solid rgba(255,255,255,0.05)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {row.strike}
                    {isATM && <div style={{ fontSize: 7, color: '#f59e0b', fontWeight: 600, marginTop: 1 }}>ATM</div>}
                  </td>

                  {/* PE side */}
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
                    {row.PE.bidPrice.toFixed(1)}/{row.PE.askPrice.toFixed(1)}
                  </td>
                  <FlashCell value={row.PE.pChange} format="pct" />
                  <FlashCell value={row.PE.ltp} />
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontSize: 11, color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>{row.PE.iv.toFixed(1)}</td>
                  <FlashCell value={row.PE.volume} format="vol" />
                  <FlashCell value={row.PE.oiChange} format="oi" />
                  <td style={{ padding: '4px 6px', background: isPeITM ? 'rgba(16,185,129,0.04)' : undefined }}>
                    <OIBar value={row.PE.oi} max={maxOI} color="#10b981" side="left" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Timestamp */}
      {optionsData?.timestamp && (
        <div style={{
          padding: '6px 20px', borderTop: '1px solid rgba(255,255,255,0.04)',
          fontSize: 9, color: '#475569', textAlign: 'right',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          Last update: {new Date(optionsData.timestamp).toLocaleTimeString('en-IN')}
          {optionsData.latency && ` • Fetch: ${optionsData.latency.fetch_ms.toFixed(0)}ms • Process: ${optionsData.latency.process_ms.toFixed(0)}ms`}
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

export default React.memo(LiveOptionsChain);
