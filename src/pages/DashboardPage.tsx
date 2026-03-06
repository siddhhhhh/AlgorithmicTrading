import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  TrendingUp, TrendingDown, Target, BookOpen, Users,
  Award, ArrowRight, PlayCircle, BarChart3, Briefcase, Zap,
  Shield, Flame, Crown, ChevronRight, Sparkles, Activity,
  GitFork, MessageSquare, Trophy, Star, Clock, LineChart, Globe,
  Cpu, Eye, Bell, Calendar
} from 'lucide-react';
import { MatrixRain, NumberTicker, HolographicSheen, PulseWave, SplitText } from '../components/ui/AceternityEffects';

/* ── Fallback data when backend is down ─────────────────── */
const fallbackIndices = [
  { symbol: 'NIFTY50', name: 'Nifty 50', value: 22467, change: 145.30, changePercent: 0.65 },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty', value: 47823, change: -89.50, changePercent: -0.19 },
  { symbol: 'SENSEX', name: 'Sensex', value: 73891, change: 312.70, changePercent: 0.42 },
];
const fallbackGainers = [
  { symbol: 'TATAMOTORS', price: 987.45, change: 42.3, changePercent: 4.47 },
  { symbol: 'RELIANCE', price: 2845.60, change: 67.8, changePercent: 2.44 },
  { symbol: 'INFY', price: 1567.30, change: 28.9, changePercent: 1.88 },
  { symbol: 'HDFCBANK', price: 1654.20, change: 22.1, changePercent: 1.35 },
];
const fallbackLosers = [
  { symbol: 'WIPRO', price: 456.80, change: -18.4, changePercent: -3.87 },
  { symbol: 'TCS', price: 3987.25, change: -52.3, changePercent: -1.29 },
  { symbol: 'SBIN', price: 612.40, change: -7.8, changePercent: -1.26 },
  { symbol: 'LT', price: 3421.10, change: -15.6, changePercent: -0.45 },
];

const recentTrades = [
  { id: 1, symbol: 'NIFTY CE 22500', action: 'BUY', qty: 50, pnl: '+₹2,340', time: '2m ago', color: '#10b981' },
  { id: 2, symbol: 'RELIANCE', action: 'SELL', qty: 25, pnl: '+₹1,120', time: '15m ago', color: '#10b981' },
  { id: 3, symbol: 'BANKNIFTY PE 47800', action: 'BUY', qty: 75, pnl: '-₹870', time: '32m ago', color: '#ef4444' },
  { id: 4, symbol: 'TATAMOTORS', action: 'BUY', qty: 100, pnl: '+₹4,470', time: '1h ago', color: '#10b981' },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { indices: rawIndices, isMarketOpen, topGainers: rawGainers, topLosers: rawLosers, marketBreadth } = useData();

  // Use fallbacks when data is empty
  const indices = rawIndices.length > 0 ? rawIndices : fallbackIndices;
  const topGainers = rawGainers.length > 0 ? rawGainers : fallbackGainers;
  const topLosers = rawLosers.length > 0 ? rawLosers : fallbackLosers;

  const portfolio = useMemo(() => {
    const ss = [...topGainers.slice(0, 3), ...topLosers.slice(0, 2)];
    if (!ss.length) return { value: 105450, change: 1250, pct: 1.2, ret: 5.45 };
    const v = Math.round(ss.reduce((s, x) => s + (x.price ?? 0) * 10, 0));
    const c = Math.round(ss.reduce((s, x) => s + (x.change ?? 0) * 10, 0));
    return { value: v || 105450, change: c || 1250, pct: +((c / Math.max(1, v - c)) * 100).toFixed(2), ret: 5.45 };
  }, [topGainers, topLosers]);

  const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const up = portfolio.change >= 0;

  // Animated time
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  // Animated progress bars
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 300); return () => clearTimeout(t); }, []);

  const xp = user?.xp || 1250;
  const maxXp = 3000;
  const pctXp = (xp / maxXp) * 100;

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
        @keyframes shimmerCard{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}
        @keyframes breathe{0%,100%{opacity:0.5;transform:scale(1)}50%{opacity:1;transform:scale(1.06)}}
        @keyframes glowPulse{0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,0.2)}50%{box-shadow:0 0 20px 4px rgba(99,102,241,0.15)}}
        @keyframes barGrow{from{width:0}to{width:var(--target-w)}}
        @keyframes rotateGlow{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes ticker{0%{transform:translateY(0)}100%{transform:translateY(-50%)}}
      `}</style>

      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>

        {/* ═══════ HERO BANNER — MatrixRain + SplitText ═══════ */}
        <MatrixRain color="#67e8f9" density={16} speed={0.8} style={{
          background: 'linear-gradient(135deg, #020617 0%, #0c1222 25%, #0f172a 50%, #1e1b4b 80%, #312e81 100%)',
          borderRadius: 20, padding: '28px 32px', marginBottom: 16, color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 4px', letterSpacing: -0.5 }}>
                <SplitText text={`${greeting()}, ${user?.name || 'Trader'}! 👋`} stagger={0.02} />
              </h1>
              <div style={{ fontSize: 12, opacity: 0.4, marginBottom: 14 }}>
                Level {user?.level ?? 2} · {user?.credits ?? 500} credits · {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/strategy-builder" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', color: '#fff',
                  border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', transition: 'all 0.3s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'none' }}>
                  <Target size={13} /> Build Strategy
                </Link>
                <Link to="/backtesting" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.3)', transition: 'all 0.3s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)' }}>
                  <BarChart3 size={13} /> Run Backtest
                </Link>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* XP Progress Ring */}
              <div style={{ position: 'relative', width: 60, height: 60 }}>
                <svg width={60} height={60} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={30} cy={30} r={24} stroke="rgba(255,255,255,0.08)" strokeWidth={4} fill="none" />
                  <circle cx={30} cy={30} r={24} stroke="#a78bfa" strokeWidth={4} fill="none"
                    strokeDasharray={`${2 * Math.PI * 24 * pctXp / 100} ${2 * Math.PI * 24}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1.5s ease', filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.4))' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>Lv{user?.level ?? 2}</div>
                  <div style={{ fontSize: 7, opacity: 0.4 }}>{xp} XP</div>
                </div>
              </div>

              {/* Stat badges */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Streak', value: '12d', color: '#f87171' },
                  { label: 'Credits', value: String(user?.credits ?? 500), color: '#34d399' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(4px)', textAlign: 'center' }}>
                    <div style={{ fontSize: 8, fontWeight: 600, opacity: 0.3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <PulseWave color={isMarketOpen ? '#34d399' : '#f87171'} size={50} rings={3}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: isMarketOpen ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={13} />
                </div>
              </PulseWave>
            </div>
          </div>
        </MatrixRain>

        {/* ═══════ QUICK ACTIONS — animated cards ═══════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { title: 'Build Strategy', desc: 'No-code rule builder', icon: Target, color: '#6366f1', href: '/strategy-builder' },
            { title: 'Run Backtest', desc: 'Test on Nifty data', icon: BarChart3, color: '#10b981', href: '/backtesting' },
            { title: 'Live Market', desc: 'Real-time NSE data', icon: TrendingUp, color: '#f59e0b', href: '/market' },
            { title: 'Learn Trading', desc: 'Courses & quizzes', icon: PlayCircle, color: '#ec4899', href: '/learning' },
          ].map((a, i) => {
            const Icon = a.icon;
            return (
              <Link key={a.title} to={a.href} style={{ textDecoration: 'none' }}>
                <HolographicSheen intensity={0.35} style={{
                  borderRadius: 14, background: '#fff', border: '1px solid #f1f5f9',
                  animation: `fadeUp 0.5s ease ${i * 0.08}s both`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s', cursor: 'pointer',
                }}>
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
                    onMouseEnter={e => { const card = e.currentTarget.parentElement as HTMLElement; card.style.transform = 'translateY(-3px)'; card.style.boxShadow = `0 8px 24px ${a.color}18` }}
                    onMouseLeave={e => { const card = e.currentTarget.parentElement as HTMLElement; card.style.transform = 'none'; card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${a.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'float 3s ease-in-out infinite', animationDelay: `${i * 0.3}s` }}>
                      <Icon size={17} color={a.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{a.title}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{a.desc}</div>
                    </div>
                    <ChevronRight size={14} color="#cbd5e1" />
                  </div>
                </HolographicSheen>
              </Link>
            );
          })}
        </div>

        {/* ═══════ MAIN ROW: Market + Portfolio + Activity ═══════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '5fr 3fr 3fr', gap: 14, marginBottom: 16 }}>
          {/* ── Market Overview ── */}
          <HolographicSheen intensity={0.3} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={14} color="#6366f1" />
                <SplitText text="Market Overview" stagger={0.025} delay={0.2} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: isMarketOpen ? '#10b981' : '#ef4444' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: isMarketOpen ? '#10b981' : '#ef4444', animation: 'breathe 2s infinite' }} />
                {isMarketOpen ? 'LIVE' : 'CLOSED'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
              {indices.map((idx, i) => {
                const idxUp = (idx.change ?? 0) >= 0;
                return (
                  <div key={idx.symbol} style={{
                    background: idxUp ? 'linear-gradient(135deg,rgba(16,185,129,0.04),rgba(16,185,129,0.01))' : 'linear-gradient(135deg,rgba(239,68,68,0.04),rgba(239,68,68,0.01))',
                    border: `1.5px solid ${idxUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}`,
                    borderRadius: 12, padding: '12px 14px', textAlign: 'center', transition: 'all 0.25s',
                    animation: `scaleIn 0.5s ease ${0.1 + i * 0.1}s both`,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = `0 8px 20px ${idxUp ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                    <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{idx.name}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', letterSpacing: -0.5 }}>
                      <NumberTicker value={idx.value ?? 0} duration={2} locale="en-IN" />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: idxUp ? '#10b981' : '#ef4444', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      {idxUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {idxUp ? '+' : ''}{(idx.changePercent ?? 0).toFixed(2)}%
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gainers/Losers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { title: 'Top Gainers', list: topGainers.slice(0, 4), isUp: true },
                { title: 'Top Losers', list: topLosers.slice(0, 4), isUp: false },
              ].map(g => (
                <div key={g.title}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: g.isUp ? '#10b981' : '#ef4444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 3 }}>
                    {g.isUp ? <TrendingUp size={9} /> : <TrendingDown size={9} />} {g.title}
                  </div>
                  {g.list.map((s, j) => (
                    <div key={s.symbol} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 9px', borderRadius: 8,
                      background: g.isUp ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)', marginBottom: 2, fontSize: 11, transition: 'all 0.2s',
                      animation: `slideRight 0.4s ease ${0.3 + j * 0.08}s both`,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = g.isUp ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)'; e.currentTarget.style.paddingLeft = '14px' }}
                      onMouseLeave={e => { e.currentTarget.style.background = g.isUp ? 'rgba(16,185,129,0.03)' : 'rgba(239,68,68,0.03)'; e.currentTarget.style.paddingLeft = '9px' }}>
                      <div><span style={{ fontWeight: 700, fontSize: 11 }}>{s.symbol}</span><span style={{ color: '#94a3b8', marginLeft: 5, fontSize: 10 }}>₹{s.price?.toFixed(0)}</span></div>
                      <span style={{ fontWeight: 700, color: g.isUp ? '#10b981' : '#ef4444', fontSize: 11 }}>{g.isUp ? '+' : ''}{s.changePercent?.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <Link to="/market" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12, padding: '8px 0', borderRadius: 10,
              background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', color: '#6366f1', fontSize: 11, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#f5f3ff,#ede9fe)'; e.currentTarget.style.color = '#6366f1' }}>
              View Full Market <ArrowRight size={11} />
            </Link>
          </HolographicSheen>

          {/* ── Portfolio Card ── */}
          <HolographicSheen intensity={0.3} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden', animation: 'fadeUp 0.6s ease 0.1s both' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '35%', height: '100%', background: 'linear-gradient(90deg,transparent,rgba(99,102,241,0.02),transparent)', animation: 'shimmerCard 5s infinite', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Briefcase size={13} color="#6366f1" /> Portfolio
              </div>
              <div style={{ fontSize: 8, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: up ? '#dcfce7' : '#fef2f2', color: up ? '#16a34a' : '#dc2626', animation: 'breathe 3s infinite' }}>
                {up ? '↑ PROFIT' : '↓ LOSS'}
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', letterSpacing: -1, marginBottom: 2, animation: 'glowPulse 3s infinite' }}>
              <NumberTicker value={portfolio.value} prefix="₹" duration={2} />
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontSize: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>Today</div>
                <div style={{ fontWeight: 700, color: up ? '#10b981' : '#ef4444' }}>{up ? '+' : ''}₹<NumberTicker value={Math.abs(portfolio.change)} duration={1.5} /></div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>Return</div>
                <div style={{ fontWeight: 700, color: '#10b981' }}>+{portfolio.ret}%</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>Win Rate</div>
                <div style={{ fontWeight: 700, color: '#6366f1' }}>72%</div>
              </div>
            </div>

            {/* Equity curve */}
            <svg viewBox="0 0 200 40" style={{ width: '100%', height: 40, display: 'block', marginBottom: 8 }}>
              <defs>
                <linearGradient id="dp-g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={up ? '#10b981' : '#ef4444'} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={up ? '#10b981' : '#ef4444'} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points="0,32 15,30 30,28 45,29 60,24 75,26 90,20 105,22 120,17 135,19 150,14 165,16 180,10 200,7 200,40 0,40" fill="url(#dp-g)" />
              <polyline points="0,32 15,30 30,28 45,29 60,24 75,26 90,20 105,22 120,17 135,19 150,14 165,16 180,10 200,7"
                fill="none" stroke={up ? '#10b981' : '#ef4444'} strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 0 4px ${up ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'})` }} />
              {/* Animated dot */}
              <circle cx="200" cy="7" r="3" fill={up ? '#10b981' : '#ef4444'} style={{ animation: 'breathe 2s infinite' }} />
            </svg>

            {/* Asset allocation mini bars */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: '#94a3b8', marginBottom: 5 }}>ALLOCATION</div>
              {[
                { name: 'Equity', pct: 48, color: '#6366f1' },
                { name: 'Options', pct: 32, color: '#ec4899' },
                { name: 'Cash', pct: 20, color: '#10b981' },
              ].map(a => (
                <div key={a.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: '#64748b', width: 44 }}>{a.name}</div>
                  <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: a.color, width: loaded ? `${a.pct}%` : '0%', transition: 'width 1.5s cubic-bezier(0.4,0,0.2,1)' }} />
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', width: 24, textAlign: 'right' }}>{a.pct}%</div>
                </div>
              ))}
            </div>

            <Link to="/portfolio" style={{
              display: 'block', textAlign: 'center', padding: '7px 0', borderRadius: 10,
              background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', color: '#6366f1',
              fontSize: 11, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#f5f3ff,#ede9fe)'; e.currentTarget.style.color = '#6366f1' }}>
              View Portfolio
            </Link>
          </HolographicSheen>

          {/* ── Recent Activity ── */}
          <HolographicSheen intensity={0.3} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease 0.2s both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Activity size={13} color="#f59e0b" /> Recent Trades
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentTrades.map((t, i) => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
                  background: '#fafbfc', border: '1px solid #f8fafc', transition: 'all 0.2s',
                  animation: `slideRight 0.4s ease ${0.2 + i * 0.1}s both`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateX(3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.transform = 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: t.action === 'BUY' ? '#dcfce7' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {t.action === 'BUY' ? <TrendingUp size={12} color="#10b981" /> : <TrendingDown size={12} color="#ef4444" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.symbol}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{t.action} · {t.qty} qty · {t.time}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.color, flexShrink: 0 }}>{t.pnl}</div>
                </div>
              ))}
            </div>

            {/* Achievements row */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Award size={10} /> ACHIEVEMENTS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {[
                  { icon: Target, name: 'First Strategy', earned: true, color: '#6366f1' },
                  { icon: Shield, name: 'Risk Pro', earned: (user?.level ?? 0) >= 3, color: '#10b981' },
                  { icon: Users, name: 'Community', earned: (user?.level ?? 0) >= 5, color: '#8b5cf6' },
                  { icon: TrendingUp, name: 'Profit Maker', earned: (user?.level ?? 0) >= 7, color: '#f59e0b' },
                ].map(a => {
                  const Icon = a.icon;
                  return (
                    <div key={a.name} style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', borderRadius: 8,
                      background: a.earned ? `${a.color}08` : '#fafbfc', opacity: a.earned ? 1 : 0.35,
                      border: `1px solid ${a.earned ? `${a.color}18` : '#f1f5f9'}`, transition: 'all 0.2s',
                    }}>
                      <Icon size={10} color={a.earned ? a.color : '#cbd5e1'} />
                      <span style={{ fontSize: 9, fontWeight: 600, color: a.earned ? '#1e293b' : '#94a3b8' }}>{a.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </HolographicSheen>
        </div>

        {/* ═══════ BOTTOM ROW: Recommendation + Community + Market Breadth ═══════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {/* Recommended Course */}
          <HolographicSheen intensity={0.3} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', animation: 'fadeUp 0.7s ease 0.1s both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <BookOpen size={13} color="#ec4899" /> Recommended
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)', borderRadius: 14,
              padding: '16px 18px', color: '#fff', marginBottom: 12, position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', right: -10, top: -10, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', animation: 'float 4s ease infinite' }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>Options Trading Basics</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>Master fundamentals of options</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, opacity: 0.5 }}>
                <span>2 hrs · 12 lessons</span><span>⭐ 4.8</span>
              </div>
            </div>
            <Link to="/learning" style={{
              display: 'block', textAlign: 'center', padding: '8px 0', borderRadius: 10,
              background: 'linear-gradient(135deg,#fdf2f8,#fce7f3)', color: '#ec4899',
              fontSize: 11, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#ec4899,#db2777)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#fdf2f8,#fce7f3)'; e.currentTarget.style.color = '#ec4899' }}>
              Start Course →
            </Link>
          </HolographicSheen>

          {/* Community Highlights */}
          <HolographicSheen intensity={0.3} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', animation: 'fadeUp 0.7s ease 0.2s both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Users size={13} color="#8b5cf6" /> Community
            </div>
            {[
              { color: '#6366f1', title: 'Strategy of the Week', desc: 'Bank Nifty Iron Condor by @OptionsExpert', icon: Star },
              { color: '#10b981', title: 'Top Discussion', desc: 'Risk Management Best Practices (45 comments)', icon: MessageSquare },
              { color: '#8b5cf6', title: 'New Members', desc: `Welcome ${marketBreadth?.advances ?? 127} new traders!`, icon: Users },
            ].map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={c.title} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
                  marginBottom: 4, transition: 'all 0.2s', animation: `slideRight 0.4s ease ${0.3 + i * 0.1}s both`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${c.color}06`; e.currentTarget.style.paddingLeft = '14px' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '10px' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={12} color={c.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{c.title}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>{c.desc}</div>
                  </div>
                </div>
              );
            })}
            <Link to="/community" style={{
              display: 'block', textAlign: 'center', padding: '8px 0', borderRadius: 10, marginTop: 6,
              background: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', color: '#6366f1',
              fontSize: 11, fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#6366f1,#8b5cf6)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg,#f5f3ff,#ede9fe)'; e.currentTarget.style.color = '#6366f1' }}>
              Join Discussion →
            </Link>
          </HolographicSheen>

          {/* Market Breadth / Sentiment */}
          <HolographicSheen intensity={0.3} style={{ background: '#fff', borderRadius: 16, padding: 18, border: '1px solid #f1f5f9', animation: 'fadeUp 0.7s ease 0.3s both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Cpu size={13} color="#f59e0b" /> Market Breadth
            </div>

            {/* Sentiment gauge */}
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ position: 'relative', width: 100, height: 50, margin: '0 auto', overflow: 'hidden' }}>
                <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%' }}>
                  <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
                  <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="url(#sg)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${125 * 0.62} 125`}
                    style={{ transition: 'stroke-dasharray 2s ease' }} />
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981', marginTop: -4 }}>Bullish</div>
              <div style={{ fontSize: 9, color: '#94a3b8' }}>62% Sentiment Score</div>
            </div>

            {/* Breadth bars */}
            {[
              { label: 'Advances', value: marketBreadth?.advances ?? 1247, total: 2000, color: '#10b981' },
              { label: 'Declines', value: marketBreadth?.declines ?? 612, total: 2000, color: '#ef4444' },
              { label: 'Unchanged', value: marketBreadth?.unchanged ?? 141, total: 2000, color: '#f59e0b' },
            ].map(b => (
              <div key={b.label} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b' }}>{b.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: b.color }}>{b.value}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: b.color,
                    width: loaded ? `${(b.value / b.total) * 100}%` : '0%',
                    transition: 'width 1.8s cubic-bezier(0.4,0,0.2,1)',
                  }} />
                </div>
              </div>
            ))}

            <div style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
              <Calendar size={8} style={{ marginRight: 3, verticalAlign: 'middle' }} />
              Last updated: {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </HolographicSheen>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;