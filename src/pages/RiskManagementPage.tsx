import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Download, Info, Sparkles, Shield, TrendingDown, Activity, Zap } from 'lucide-react';
import { MovingBorderCard, AnimatedCounter, HoverGlowCard, TextShimmer, TiltReveal, PulseBeacon } from '../components/ui/AceternityEffects';

// ── Data ──────────────────────────────────────────────────────────────────────
function computeRiskScore({ var95, maxDrawdown, sharpe, beta, sortino, volatility, largestWeight }:
  { var95: number; maxDrawdown: number; sharpe: number; beta: number; sortino: number; volatility: number; largestWeight: number }) {
  let score = 0;
  score += Math.min(var95 / 2000, 25); score += Math.min(Math.abs(maxDrawdown) / 0.25, 15);
  score += Math.min(volatility * 1.2, 10); score += Math.max(0, (beta - 1) * 12);
  score += Math.max(0, (largestWeight - 15) * 1.5); score -= Math.max(0, (sharpe - 1) * 15);
  score -= Math.max(0, (sortino - 1) * 10);
  return Math.round(Math.min(100, Math.max(0, score + 50)));
}

const positions = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', value: 174000, weight: 18.5, var: 4200, beta: 0.87, sharpe: 0.95, sortino: 1.1, alpha: 1.9, vol: 21, riskScore: 72 },
  { symbol: 'TCS', name: 'Tata Consultancy', value: 135000, weight: 14.3, var: 2100, beta: 0.92, sharpe: 0.82, sortino: 0.98, alpha: 1.3, vol: 18, riskScore: 68 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', value: 120000, weight: 12.8, var: 2800, beta: 1.23, sharpe: 0.75, sortino: 0.91, alpha: -0.4, vol: 25, riskScore: 75 },
  { symbol: 'INFOSYS', name: 'Infosys Ltd', value: 98000, weight: 10.4, var: 1500, beta: 1.05, sharpe: 0.79, sortino: 0.99, alpha: 0.5, vol: 19, riskScore: 65 },
];

const defaultPortfolio = { value: 941000, var95: 15450, var99: 23800, beta: 1.08, sharpe: 0.92, alpha: 1.2, sortino: 1.01, volatility: 18.6, maxDrawdown: -7.3, streak: 6 };
const scenarioEffects: Record<string, any> = {
  none: { var95: 15450, sharpe: 0.92, beta: 1.08, alpha: 1.2, sortino: 1.01, volatility: 18.6, maxDrawdown: -7.3 },
  fall: { var95: 21240, sharpe: 0.71, beta: 1.22, alpha: -0.4, sortino: 0.72, volatility: 22.3, maxDrawdown: -13.9 },
  vol: { var95: 19100, sharpe: 0.87, beta: 1.14, alpha: 0.6, sortino: 0.89, volatility: 21.7, maxDrawdown: -11.2 },
};

const monteCarloData = [
  { bucket: '<-10%', count: 7, color: '#ef4444' }, { bucket: '-10/-5%', count: 25, color: '#f97316' },
  { bucket: '-5/0%', count: 152, color: '#eab308' }, { bucket: '0/5%', count: 503, color: '#22c55e' },
  { bucket: '5/10%', count: 234, color: '#3b82f6' }, { bucket: '>10%', count: 59, color: '#8b5cf6' },
];

const metricExplainers: Record<string, string> = {
  var95: "Value at Risk: max expected daily loss in 95% of cases.",
  var99: "VaR 99%: ~1 in 100 chance of losing more than this.",
  sharpe: "Sharpe measures risk-adjusted return (>1 is strong).",
  beta: "Beta = market sensitivity. 1.0 = neutral, >1 = amplified.",
  alpha: "Alpha = excess return over benchmark.",
  sortino: "Sortino only penalizes downside risk (higher = better).",
  volatility: "Annualized fluctuation in returns (lower = safer).",
};

// ── Animated Risk Gauge (light theme) ─────────────────────────────────────────
const RiskGauge = ({ score, size = 180 }: { score: number; size?: number }) => {
  const [animScore, setAnimScore] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimScore(score), 200); return () => clearTimeout(t); }, [score]);
  const r = size * 0.37, cx = size / 2, cy = size / 2, circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - animScore / 100);
  const color = animScore < 40 ? '#10b981' : animScore < 65 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
          <filter id="gaugeShadow"><feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={color} floodOpacity="0.4" /></filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} stroke="#f1f5f9" strokeWidth={size * 0.055} fill="none" />
        <circle cx={cx} cy={cy} r={r} stroke="url(#riskGrad)" strokeWidth={size * 0.055} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" filter="url(#gaugeShadow)"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.25, fontWeight: 800, color, lineHeight: 1 }}>{animScore}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5 }}>
          {animScore < 40 ? 'Low Risk' : animScore < 65 ? 'Medium' : 'High Risk'}
        </span>
      </div>
    </div>
  );
};

// ── Animated Bar ──────────────────────────────────────────────────────────────
const AnimatedBar = ({ height, color, delay, label, value }: { height: number; color: string; delay: number; label: string; value: number }) => {
  const [h, setH] = useState(0);
  useEffect(() => { const t = setTimeout(() => setH(height), delay); return () => clearTimeout(t); }, [height, delay]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 40 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{value}</span>
      <div style={{ width: '100%', maxWidth: 32, height: 110, display: 'flex', alignItems: 'flex-end', borderRadius: '6px 6px 0 0' }}>
        <div style={{
          width: '100%', height: h, background: `linear-gradient(180deg, ${color}, ${color}88)`, borderRadius: '6px 6px 0 0',
          transition: 'height 0.8s cubic-bezier(0.4,0,0.2,1)', transitionDelay: `${delay}ms`, boxShadow: `0 -2px 12px ${color}25`, minHeight: 4
        }} />
      </div>
      <span style={{ fontSize: 9, color: '#94a3b8', marginTop: 6, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    </div>
  );
};

// ── Drawdown Chart ────────────────────────────────────────────────────────────
const DrawdownChart = () => {
  const points = [0, -1.2, -0.8, -2.5, -3.1, -1.9, -4.2, -7.3, -5.1, -3.8, -2.1, -0.5, -1.8, -3.2, -2.0, -0.3];
  const W = 300, H = 80;
  const minV = Math.min(...points), range = 0 - minV || 1;
  const pathPoints = points.map((v, i) => `${(i / (points.length - 1)) * W},${H - ((v - minV) / range) * H}`).join(' ');
  const areaPath = `M0,${H} L${pathPoints.split(' ').map(p => p).join(' L')} L${W},${H} Z`;
  const worstIdx = points.indexOf(Math.min(...points));
  const wx = (worstIdx / (points.length - 1)) * W;
  const wy = H - ((points[worstIdx] - minV) / range) * H;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 16}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#ddGrad)" />
      <polyline points={pathPoints} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" />
      <circle cx={wx} cy={wy} r="4" fill="#ef4444"><animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" /></circle>
      <text x={wx} y={wy - 8} textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700">{points[worstIdx]}%</text>
    </svg>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const RiskManagementPage = () => {
  const [scenario, setScenario] = useState<'none' | 'fall' | 'vol'>('none');
  const [education, setEducation] = useState<string | null>(null);
  const portfolio = { ...defaultPortfolio, ...(scenario !== 'none' ? scenarioEffects[scenario] : {}) };
  const riskScore = computeRiskScore({
    var95: portfolio.var95, maxDrawdown: portfolio.maxDrawdown ?? -8, sharpe: portfolio.sharpe,
    beta: portfolio.beta, sortino: portfolio.sortino, volatility: portfolio.volatility,
    largestWeight: Math.max(...positions.map((p: any) => p.weight))
  });

  const maxMC = Math.max(...monteCarloData.map(d => d.count));

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">

        {/* ── Hero Banner ──────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #581c87 40%, #7c2d12 100%)',
          borderRadius: 20, padding: '28px 32px', color: '#fff', marginBottom: 28, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -60, top: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', filter: 'blur(40px)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Shield size={20} />
                <TextShimmer baseColor="#fff" shimmerColor="#c084fc" style={{ fontSize: 22, fontWeight: 800 }}>Risk Management</TextShimmer>
              </div>
              <p style={{ fontSize: 13, opacity: 0.6 }}>Real-time portfolio risk analytics with scenario simulations & AI-powered suggestions.</p>
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.25s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}>
              <Download size={14} /> Export Report
            </button>
          </div>
        </div>

        {/* ── Risk Score + Metrics ──────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, marginBottom: 28 }}>
          {/* Risk Gauge — MovingBorderCard (NEW effect!) */}
          <MovingBorderCard borderColor={riskScore < 40 ? '#10b981' : riskScore < 65 ? '#f59e0b' : '#ef4444'} duration={3}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', background: '#fff', borderRadius: 15 }}>
              <RiskGauge score={riskScore} />
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Portfolio Risk Score</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                <AnimatedCounter target={riskScore} suffix="/100" style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }} />
              </div>
            </div>
          </MovingBorderCard>

          {/* Metric Cards — HoverGlowCard (NEW effect!) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 12, alignContent: 'start' }}>
            {[
              { key: 'var95', label: 'VaR 95%', val: `₹${portfolio.var95.toLocaleString()}`, glow: '#ef4444' },
              { key: 'var99', label: 'VaR 99%', val: `₹${portfolio.var99.toLocaleString()}`, glow: '#f97316' },
              { key: 'sharpe', label: 'Sharpe Ratio', val: portfolio.sharpe.toFixed(2), glow: '#3b82f6' },
              { key: 'sortino', label: 'Sortino Ratio', val: portfolio.sortino.toFixed(2), glow: '#8b5cf6' },
              { key: 'beta', label: 'Beta', val: portfolio.beta.toFixed(2), glow: '#eab308' },
              { key: 'alpha', label: 'Alpha', val: portfolio.alpha.toFixed(2), glow: '#10b981' },
              { key: 'volatility', label: 'Volatility', val: `${portfolio.volatility.toFixed(1)}%`, glow: '#06b6d4' },
            ].map(m => (
              <HoverGlowCard key={m.key} glowColor={m.glow} style={{ padding: 16, cursor: 'pointer', position: 'relative' }}
                onClick={() => setEducation(education === m.key ? null : m.key)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <PulseBeacon color={m.glow} size={5} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>{m.label}</span>
                  <Info size={10} style={{ color: '#cbd5e1' }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', transition: 'all 0.5s' }}>{m.val}</div>
                {education === m.key && (
                  <div style={{ position: 'absolute', zIndex: 50, top: 'calc(100% + 4px)', left: 0, right: 0, padding: '10px 12px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 11, color: '#64748b', lineHeight: 1.5, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                    {metricExplainers[m.key]}
                  </div>
                )}
              </HoverGlowCard>
            ))}
          </div>
        </div>

        {/* ── Scenario Simulator — TiltReveal (NEW effect!) ── */}
        <HoverGlowCard glowColor="#8b5cf6" style={{ padding: 28, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <Sparkles size={16} color="#8b5cf6" />
            <TextShimmer baseColor="#1e293b" shimmerColor="#8b5cf6" style={{ fontSize: 16, fontWeight: 700 }}>What-If Scenario Simulator</TextShimmer>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            {([
              { key: 'none' as const, label: '✅ Normal', color: '#3b82f6' },
              { key: 'fall' as const, label: '📉 Market -5%', color: '#ef4444' },
              { key: 'vol' as const, label: '🌊 Vol Spike', color: '#8b5cf6' },
            ]).map(sc => (
              <button key={sc.key} onClick={() => setScenario(sc.key)} style={{
                padding: '10px 22px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
                background: scenario === sc.key ? `${sc.color}12` : '#f8fafc',
                border: `2px solid ${scenario === sc.key ? sc.color : '#e2e8f0'}`,
                color: scenario === sc.key ? sc.color : '#64748b',
                boxShadow: scenario === sc.key ? `0 0 16px ${sc.color}15` : 'none',
              }}>{sc.label}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { title: 'Current State', data: scenarioEffects.none, accent: '#3b82f6' },
              { title: scenario === 'none' ? 'No Change' : scenario === 'fall' ? 'After -5% Drop' : 'After Vol Spike', data: scenarioEffects[scenario], accent: scenario === 'fall' ? '#ef4444' : scenario === 'vol' ? '#8b5cf6' : '#3b82f6' },
            ].map((panel, i) => (
              <TiltReveal key={i} tiltDeg={4}>
                <div style={{ background: '#f8fafc', border: `1px solid ${panel.accent}20`, borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: panel.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>{panel.title}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                    {[
                      { l: 'VaR 95%', v: `₹${panel.data.var95.toLocaleString()}` },
                      { l: 'Sharpe', v: panel.data.sharpe.toFixed(2) },
                      { l: 'Beta', v: panel.data.beta.toFixed(2) },
                      { l: 'Drawdown', v: `${panel.data.maxDrawdown}%` },
                    ].map(r => (
                      <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.l}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </TiltReveal>
            ))}
          </div>
        </HoverGlowCard>

        {/* ── Charts Row ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
          {/* Monte Carlo — HoverGlowCard */}
          <HoverGlowCard glowColor="#8b5cf6" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Zap size={16} color="#8b5cf6" />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Monte Carlo Simulation</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#f5f3ff', color: '#7c3aed' }}>1000 runs</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', padding: '8px 0' }}>
              {monteCarloData.map((d, i) => (
                <AnimatedBar key={d.bucket} height={(d.count / maxMC) * 110} color={d.color} delay={200 + i * 120} label={d.bucket} value={d.count} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: '#94a3b8' }}>
              <span><strong style={{ color: '#ef4444' }}>4%</strong> chance of -10% week</span>
              <span><strong style={{ color: '#22c55e' }}>28%</strong> odds of 5%+ gain</span>
            </div>
          </HoverGlowCard>

          {/* Drawdown — HoverGlowCard */}
          <HoverGlowCard glowColor="#ef4444" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingDown size={16} color="#ef4444" />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Drawdown Analysis</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#fef2f2', color: '#ef4444' }}>16 weeks</span>
            </div>
            <DrawdownChart />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: '#94a3b8' }}>
              <span>Max drawdown: <strong style={{ color: '#ef4444' }}>-7.3%</strong></span>
              <span>Recovery: <strong style={{ color: '#22c55e' }}>~4 weeks</strong></span>
            </div>
          </HoverGlowCard>
        </div>

        {/* ── Position Risk — TiltReveal cards ─────────────── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Activity size={16} color="#3b82f6" />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Position Risk Attribution</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${positions.length}, 1fr)`, gap: 16 }}>
            {positions.map((pos, i) => {
              const colors = ['#8b5cf6', '#3b82f6', '#f59e0b', '#10b981'];
              const c = colors[i % colors.length];
              return (
                <TiltReveal key={pos.symbol} tiltDeg={5}>
                  <HoverGlowCard glowColor={c} style={{ padding: 20, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{pos.symbol}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 14 }}>{pos.name}</div>
                    {/* Progress bar */}
                    <div style={{ width: '100%', height: 6, borderRadius: 3, background: '#f1f5f9', marginBottom: 14, overflow: 'hidden' }}>
                      <div style={{ width: `${pos.riskScore}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${c}, ${c}88)`, boxShadow: `0 0 8px ${c}30`, transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 11 }}>
                      {[
                        { l: 'Risk', v: pos.riskScore, color: pos.riskScore > 70 ? '#ef4444' : pos.riskScore > 60 ? '#f59e0b' : '#10b981' },
                        { l: 'Weight', v: `${pos.weight}%`, color: '#1e293b' },
                        { l: 'Beta', v: pos.beta.toFixed(2), color: '#1e293b' },
                        { l: 'VaR', v: `₹${pos.var.toLocaleString()}`, color: '#1e293b' },
                      ].map(r => (
                        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#94a3b8' }}>{r.l}</span>
                          <span style={{ fontWeight: 700, color: r.color }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </HoverGlowCard>
                </TiltReveal>
              );
            })}
          </div>
        </div>

        {/* ── AI Suggestions — MovingBorderCard ─────────────── */}
        <MovingBorderCard borderColor="#10b981" duration={5}>
          <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #eff6ff)', padding: 28, borderRadius: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Shield size={18} color="#10b981" />
              <TextShimmer baseColor="#0f172a" shimmerColor="#10b981" style={{ fontSize: 17, fontWeight: 700 }}>AI Risk Reduction Suggestions</TextShimmer>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#dcfce7', color: '#16a34a', marginLeft: 'auto' }}>AI POWERED</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { text: 'Trim RELIANCE position by 5% to reduce concentration risk.', urgency: 'high' },
                { text: 'Add NIFTY PUT options for downside protection.', urgency: 'medium' },
                { text: 'Beta is elevated — consider adding defensive stocks (ITC, HUL).', urgency: 'medium' },
                { text: 'Sharpe ratio below 1.0 — optimize entry timing using RSI signals.', urgency: 'low' },
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: '#fff', border: '1px solid #f1f5f9', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                  <PulseBeacon color={tip.urgency === 'high' ? '#ef4444' : tip.urgency === 'medium' ? '#f59e0b' : '#10b981'} size={6} />
                  <span style={{ fontSize: 13, color: '#334155', flex: 1 }}>{tip.text}</span>
                  <button style={{ padding: '6px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6'; }}
                    onClick={() => alert(`Applied: "${tip.text}"`)}>Apply</button>
                </div>
              ))}
            </div>
          </div>
        </MovingBorderCard>

        {/* ── Streak & Leaderboard ──────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 28 }}>
          <HoverGlowCard glowColor="#10b981" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🔥</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                <AnimatedCounter target={portfolio.streak} style={{ color: '#16a34a', fontSize: 28, fontWeight: 800 }} /> day streak!
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Consecutive days below risk threshold.</div>
            </div>
          </HoverGlowCard>

          <HoverGlowCard glowColor="#f59e0b" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 18 }}>🏆</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Sharpe Leaderboard</span>
            </div>
            {[
              { user: 'Priya', sharpe: 1.49, rank: 1 }, { user: 'Ajay', sharpe: 1.21, rank: 2 }, { user: 'You', sharpe: 0.92, rank: 3 },
            ].map(l => (
              <div key={l.user} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: l.rank === 1 ? '#f59e0b' : l.rank === 2 ? '#94a3b8' : '#8b5cf6', width: 22 }}>#{l.rank}</span>
                <span style={{ fontSize: 13, fontWeight: l.user === 'You' ? 700 : 400, color: l.user === 'You' ? '#6366f1' : '#64748b', flex: 1 }}>{l.user} {l.user === 'You' && '(you)'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{l.sharpe.toFixed(2)}</span>
              </div>
            ))}
          </HoverGlowCard>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default RiskManagementPage;
