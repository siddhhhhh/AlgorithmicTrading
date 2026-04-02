import React, { useMemo, useRef, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ReferenceLine, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Gauge } from 'lucide-react';

// ── Chart card wrapper ──────────────────────────────────────────────────────

const ChartCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; height?: number }> = ({ title, icon, children, height = 250 }) => (
  <div style={{
    background: 'rgba(15,23,42,0.6)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)',
    overflow: 'hidden',
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
      background: 'rgba(30,41,59,0.3)',
    }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 700, color: '#e2e8f0', letterSpacing: 0.5 }}>{title}</span>
    </div>
    <div style={{ padding: '12px 8px', height }}>{children}</div>
  </div>
);

// ── OI Chart ────────────────────────────────────────────────────────────────

export const OIChart: React.FC = React.memo(() => {
  const { optionsData } = useSocket();

  const chartData = useMemo(() => {
    if (!optionsData?.data) return [];
    const S = optionsData.underlyingValue || 0;
    return optionsData.data
      .filter(r => S > 0 && Math.abs(r.strike - S) / S < 0.06)
      .map(r => ({
        strike: r.strike,
        callOI: r.CE.oi / 1000,
        putOI: r.PE.oi / 1000,
        isATM: r.moneyness === 'ATM',
      }));
  }, [optionsData]);

  const maxCallOI = optionsData?.summary?.maxCallOI?.strike || 0;
  const maxPutOI = optionsData?.summary?.maxPutOI?.strike || 0;

  return (
    <ChartCard title="Open Interest Distribution" icon={<Activity size={13} color="#6366f1" />}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barCategoryGap="15%">
          <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
          <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}K`} />
          <Tooltip
            contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
            labelStyle={{ color: '#e2e8f0', fontWeight: 700 }}
            formatter={(val: any, name: any) => [`${Number(val).toFixed(0)}K`, name === 'callOI' ? 'Call OI' : 'Put OI']}
          />
          <Bar dataKey="callOI" fill="#ef444480" radius={[3, 3, 0, 0]} animationDuration={500} />
          <Bar dataKey="putOI" fill="#10b98180" radius={[3, 3, 0, 0]} animationDuration={500} />
          {maxCallOI > 0 && <ReferenceLine x={maxCallOI} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Max CE', fill: '#ef4444', fontSize: 8 }} />}
          {maxPutOI > 0 && <ReferenceLine x={maxPutOI} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Max PE', fill: '#10b981', fontSize: 8 }} />}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
});
OIChart.displayName = 'OIChart';

// ── GEX Chart ───────────────────────────────────────────────────────────────

export const GEXChart: React.FC = React.memo(() => {
  const { optionsData } = useSocket();

  const chartData = useMemo(() => {
    if (!optionsData?.data) return [];
    const S = optionsData.underlyingValue || 0;
    return optionsData.data
      .filter(r => S > 0 && Math.abs(r.strike - S) / S < 0.06)
      .map(r => {
        // Net GEX approximation: Call OI - Put OI (proportional)
        const netGEX = (r.CE.oi - r.PE.oi) / 1000;
        return { strike: r.strike, netGEX, isPositive: netGEX >= 0 };
      });
  }, [optionsData]);

  // Gamma flip point
  const flipIdx = useMemo(() => {
    for (let i = 1; i < chartData.length; i++) {
      if ((chartData[i - 1].netGEX < 0 && chartData[i].netGEX >= 0) ||
          (chartData[i - 1].netGEX >= 0 && chartData[i].netGEX < 0)) {
        return chartData[i].strike;
      }
    }
    return 0;
  }, [chartData]);

  return (
    <ChartCard title="Gamma Exposure (GEX)" icon={<Gauge size={13} color="#c084fc" />}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
          <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}K`} />
          <Tooltip
            contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
            formatter={(val: any) => [`${Number(val).toFixed(0)}K`, 'Net GEX']}
          />
          <Bar dataKey="netGEX" animationDuration={500} radius={[3, 3, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.isPositive ? '#10b98180' : '#ef444480'} />
            ))}
          </Bar>
          {flipIdx > 0 && <ReferenceLine x={flipIdx} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '⚡ Flip', fill: '#f59e0b', fontSize: 9 }} />}
          <ReferenceLine y={0} stroke="#334155" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
});
GEXChart.displayName = 'GEXChart';

// ── IV Smile Chart ──────────────────────────────────────────────────────────

export const IVSmileChart: React.FC = React.memo(() => {
  const { optionsData } = useSocket();

  const chartData = useMemo(() => {
    if (!optionsData?.data) return [];
    const S = optionsData.underlyingValue || 0;
    return optionsData.data
      .filter(r => S > 0 && Math.abs(r.strike - S) / S < 0.08 && (r.CE.iv > 0 || r.PE.iv > 0))
      .map(r => ({ strike: r.strike, callIV: r.CE.iv, putIV: r.PE.iv, isATM: r.moneyness === 'ATM' }));
  }, [optionsData]);

  return (
    <ChartCard title="IV Smile" icon={<TrendingUp size={13} color="#60a5fa" />}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="strike" tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#1e293b' }} />
          <YAxis tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
          <Tooltip
            contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }}
            formatter={(val: any, name: any) => [`${Number(val).toFixed(2)}%`, name === 'callIV' ? 'Call IV' : 'Put IV']}
          />
          <Line type="monotone" dataKey="callIV" stroke="#ef4444" strokeWidth={2} dot={false} animationDuration={500} />
          <Line type="monotone" dataKey="putIV" stroke="#10b981" strokeWidth={2} dot={false} animationDuration={500} />
          {optionsData?.underlyingValue && <ReferenceLine x={optionsData.underlyingValue} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'ATM', fill: '#f59e0b', fontSize: 9 }} />}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
});
IVSmileChart.displayName = 'IVSmileChart';

// ── PCR History ─────────────────────────────────────────────────────────────

export const PCRHistoryChart: React.FC = React.memo(() => {
  const { optionsData } = useSocket();
  const historyRef = useRef<{ time: string; pcr: number }[]>([]);

  useEffect(() => {
    if (optionsData?.summary?.pcr) {
      historyRef.current = [
        ...historyRef.current.slice(-59),
        { time: new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }), pcr: optionsData.summary.pcr },
      ];
    }
  }, [optionsData?.summary?.pcr]);

  const data = historyRef.current;

  return (
    <ChartCard title="PCR History" icon={<TrendingDown size={13} color="#f59e0b" />} height={200}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="time" tick={{ fontSize: 8, fill: '#475569' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis domain={[0.5, 2]} tick={{ fontSize: 9, fill: '#64748b' }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10 }} />
          <ReferenceLine y={1} stroke="#334155" strokeDasharray="3 3" />
          <ReferenceLine y={0.8} stroke="rgba(239,68,68,0.3)" strokeDasharray="3 3" label={{ value: 'Bearish', fill: '#ef4444', fontSize: 8 }} />
          <ReferenceLine y={1.2} stroke="rgba(16,185,129,0.3)" strokeDasharray="3 3" label={{ value: 'Bullish', fill: '#10b981', fontSize: 8 }} />
          <Area type="monotone" dataKey="pcr" stroke="#f59e0b" fill="rgba(245,158,11,0.1)" strokeWidth={2} animationDuration={300} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
});
PCRHistoryChart.displayName = 'PCRHistoryChart';

// ── VIX Widget ──────────────────────────────────────────────────────────────

export const VIXWidget: React.FC = React.memo(() => {
  const { marketData } = useSocket();
  const vix = marketData?.vix ?? 0;
  const vixChange = marketData?.vix_change ?? 0;

  const regime = vix < 12 ? { label: 'LOW VOL', color: '#10b981', bg: 'rgba(16,185,129,0.08)', desc: 'Complacent market' }
    : vix < 18 ? { label: 'NORMAL', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', desc: 'Normal conditions' }
    : vix < 25 ? { label: 'ELEVATED', color: '#f97316', bg: 'rgba(249,115,22,0.08)', desc: 'Increased fear' }
    : { label: 'HIGH FEAR', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', desc: 'Panic / opportunity' };

  return (
    <div style={{
      background: regime.bg, borderRadius: 14, border: `1px solid ${regime.color}33`,
      padding: 16, textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, color: '#64748b', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>INDIA VIX</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: regime.color, fontFamily: "'JetBrains Mono', monospace" }}>
        {vix > 0 ? vix.toFixed(2) : '—'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
        {vixChange >= 0 ? <TrendingUp size={11} color="#ef4444" /> : <TrendingDown size={11} color="#10b981" />}
        <span style={{ fontSize: 11, fontWeight: 700, color: vixChange >= 0 ? '#ef4444' : '#10b981' }}>
          {vixChange >= 0 ? '+' : ''}{vixChange.toFixed(2)}
        </span>
      </div>
      <div style={{
        marginTop: 8, padding: '3px 8px', borderRadius: 6, display: 'inline-block',
        background: `${regime.color}22`, color: regime.color, fontSize: 9, fontWeight: 700, letterSpacing: 1,
      }}>
        {regime.label}
      </div>
      <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{regime.desc}</div>
    </div>
  );
});
VIXWidget.displayName = 'VIXWidget';
