import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, TrendingUp, Shield, Brain, Star,
  CheckCircle, Zap, Target, BarChart3, Play
} from 'lucide-react';
import {
  Card3D, SpotlightCard, GridBackground, GradientText, FloatingParticles,
  Meteors, GlowOrb, AnimatedCounter, Typewriter, MovingBorderCard
} from '../components/ui/AceternityEffects';

const LandingPage: React.FC = () => {
  return (
    <div style={{ background: '#030712', minHeight: '100vh', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>

      {/* ── Navbar ──────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(3,7,18,0.7)', backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '0 40px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59,130,246,0.3)'
          }}>
            <TrendingUp size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, color: '#fff' }}>AlgoForge</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {['Features', 'Pricing', 'Learn', 'Community'].map(t => (
            <a key={t} href={`#${t.toLowerCase()}`} style={{
              fontSize: 14, fontWeight: 500, color: '#64748b', textDecoration: 'none', transition: 'color .2s'
            }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
              {t}
            </a>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/login" style={{ fontSize: 14, fontWeight: 500, color: '#94a3b8', textDecoration: 'none' }}>Login</Link>
          <Link to="/register" style={{
            fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none',
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)', padding: '8px 20px',
            borderRadius: 8, boxShadow: '0 0 20px rgba(99,102,241,0.4), 0 4px 12px rgba(59,130,246,0.3)',
            transition: 'all .2s'
          }}>Get Started</Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────── */}
      <section style={{ padding: '120px 40px 80px', textAlign: 'center', position: 'relative' }}>
        <GridBackground color="rgba(99,102,241,0.04)" />
        <FloatingParticles count={40} color="rgba(99,102,241,0.4)" />
        <Meteors count={8} />
        <GlowOrb color="rgba(59,130,246,0.12)" size={600} top="-200px" left="20%" />
        <GlowOrb color="rgba(139,92,246,0.1)" size={500} top="-100px" right="15%" blur={100} />
        <GlowOrb color="rgba(236,72,153,0.06)" size={400} top="200px" left="50%" />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
          {/* Pill badge */}
          <div className="animate-in" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
            border: '1px solid rgba(99,102,241,0.2)', borderRadius: 24,
            padding: '6px 18px', marginBottom: 32, fontSize: 13, fontWeight: 500, color: '#818cf8'
          }}>
            <Zap size={13} /> Built for Indian Markets · NSE / BSE
          </div>

          <h1 className="animate-in delay-1" style={{
            fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginBottom: 10, color: '#fff'
          }}>
            Build & Backtest
          </h1>
          <h1 className="animate-in delay-2" style={{
            fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginBottom: 10
          }}>
            <GradientText from="#60a5fa" via="#a78bfa" to="#f472b6">
              <Typewriter words={['Trading Strategies', 'Algo Systems', 'Options Plays', 'Market Signals']} />
            </GradientText>
          </h1>
          <h1 className="animate-in delay-3" style={{
            fontSize: 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginBottom: 32, color: '#fff'
          }}>
            Without Code
          </h1>

          <p className="animate-in delay-4" style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.65, maxWidth: 580, margin: '0 auto 40px' }}>
            Test strategies on real Nifty 50 data. Get Sharpe ratios, equity curves, and trade logs — all for free.
          </p>

          <div className="animate-in delay-5" style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Link to="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
              padding: '14px 36px', borderRadius: 12, fontSize: 15, fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 0 30px rgba(99,102,241,0.4), 0 8px 20px rgba(59,130,246,0.3)',
              transition: 'all .25s'
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 0 50px rgba(99,102,241,0.5), 0 12px 30px rgba(59,130,246,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 30px rgba(99,102,241,0.4), 0 8px 20px rgba(59,130,246,0.3)'; }}
            >
              Start Free <ArrowRight size={16} />
            </Link>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0', padding: '14px 36px', borderRadius: 12, fontSize: 15, fontWeight: 500,
              textDecoration: 'none', transition: 'all .2s', backdropFilter: 'blur(8px)'
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <Play size={15} /> Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview (3D) ──────────────── */}
      <section className="animate-in delay-6" style={{ padding: '0 40px 100px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <Card3D intensity={8} style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
          padding: 4, boxShadow: '0 20px 80px rgba(0,0,0,0.5), 0 0 60px rgba(99,102,241,0.1)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 16,
            height: 380, display: 'flex', padding: 24, gap: 16, overflow: 'hidden'
          }}>
            {/* sidebar mock */}
            <div style={{ width: 160, background: '#080f1e', borderRadius: 12, padding: 16 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  height: 8, borderRadius: 4, marginBottom: 10,
                  background: i === 1 ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                  width: `${50 + i * 8}%`, transition: 'all 0.3s',
                  boxShadow: i === 1 ? '0 0 12px rgba(59,130,246,0.3)' : 'none'
                }} />
              ))}
            </div>
            {/* main area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { c: '#3b82f6', v: '₹82,249', l: 'SENSEX' },
                  { c: '#059669', v: '₹25,497', l: 'NIFTY' },
                  { c: '#f59e0b', v: '+2.4%', l: 'Returns' },
                  { c: '#8b5cf6', v: '1.8', l: 'Sharpe' },
                ].map((d, i) => (
                  <div key={i} style={{
                    flex: 1, padding: '12px 14px', borderRadius: 10,
                    background: `linear-gradient(135deg, ${d.c}15, ${d.c}05)`,
                    border: `1px solid ${d.c}25`,
                    boxShadow: `inset 0 1px 0 ${d.c}15`
                  }}>
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{d.l}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{d.v}</div>
                  </div>
                ))}
              </div>
              <div style={{
                flex: 1, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12, padding: 16, display: 'flex', alignItems: 'flex-end'
              }}>
                <svg viewBox="0 0 500 120" style={{ width: '100%', height: '100%' }}>
                  <defs>
                    <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points="0,100 20,95 50,88 80,90 120,70 160,72 200,55 240,60 280,40 320,45 360,25 400,30 440,15 480,20 500,10 500,120 0,120"
                    fill="url(#lg)" />
                  <polyline points="0,100 20,95 50,88 80,90 120,70 160,72 200,55 240,60 280,40 320,45 360,25 400,30 440,15 480,20 500,10"
                    fill="none" stroke="#6366f1" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 6px rgba(99,102,241,0.5))' }} />
                </svg>
              </div>
            </div>
          </div>
        </Card3D>
      </section>

      {/* ── Features (3D Spotlight Cards) ──────── */}
      <section id="features" style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        <GlowOrb color="rgba(59,130,246,0.06)" size={500} top="0" left="-10%" animate />

        <div style={{ textAlign: 'center', marginBottom: 56, position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: -1 }}>
            Everything You Need to <GradientText>Trade Smarter</GradientText>
          </h2>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 520, margin: '0 auto' }}>
            From strategy building to backtesting to live market data — all in one platform.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, position: 'relative', zIndex: 1 }}>
          {[
            { icon: Zap, title: 'Strategy Builder', desc: 'Build entry/exit rules with dropdowns. RSI, SMA, EMA, MACD — no code needed.', color: '#3b82f6' },
            { icon: BarChart3, title: 'Backtesting Lab', desc: 'Test on real Nifty 50 history. See equity curves, Sharpe, drawdown, trade logs.', color: '#059669' },
            { icon: TrendingUp, title: 'Live Market Data', desc: '50 NSE stocks updated every 30s. Indices, breadth, top movers — all live.', color: '#f59e0b' },
            { icon: Target, title: 'Options Chain', desc: 'Real NIFTY & BANKNIFTY options data with OI, IV, volume, and ATM strike.', color: '#8b5cf6' },
            { icon: Shield, title: 'Risk Management', desc: 'Position sizing, stop-loss, take-profit controls built into every strategy.', color: '#ef4444' },
            { icon: Brain, title: 'Smart Analytics', desc: 'Sharpe, Sortino, Calmar ratios. Profit factor, win rate, max drawdown.', color: '#06b6d4' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <SpotlightCard key={i} color={f.color + '20'} style={{ padding: 28 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `linear-gradient(135deg, ${f.color}20, ${f.color}08)`,
                  border: `1px solid ${f.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                  boxShadow: `0 0 20px ${f.color}15`
                }}>
                  <Icon size={22} color={f.color} />
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.55 }}>{f.desc}</p>
              </SpotlightCard>
            );
          })}
        </div>
      </section>

      {/* ── Stats (Animated Counters) ──────────── */}
      <section style={{
        padding: '72px 40px', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, textAlign: 'center'
      }}>
        {[
          { n: 50, s: '+', l: 'NSE Stocks' },
          { n: 4, s: '', l: 'Built-in Strategies' },
          { n: 10, s: '+', l: 'Risk Metrics' },
          { n: 0, s: '', l: 'Forever Free', prefix: '₹' },
        ].map(s => (
          <div key={s.l} style={{ position: 'relative' }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 4 }}>
              <AnimatedCounter target={s.n} prefix={s.prefix || ''} suffix={s.s} />
            </div>
            <div style={{ fontSize: 14, color: '#475569' }}>{s.l}</div>
          </div>
        ))}
      </section>

      {/* ── Testimonials (3D Cards) ──────────── */}
      <section style={{ padding: '80px 40px', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        <GlowOrb color="rgba(139,92,246,0.06)" size={400} bottom="0" right="10%" animate />

        <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 48, letterSpacing: -0.5, position: 'relative', zIndex: 1 }}>
          Trusted by <GradientText from="#059669" via="#3b82f6" to="#8b5cf6">Indian Traders</GradientText>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, position: 'relative', zIndex: 1 }}>
          {[
            { name: 'Rajesh Kumar', role: 'Professional Trader', quote: 'AlgoForge backtesting is incredibly fast. I tested 3 strategies in 10 minutes with real NIFTY data.', color: '#3b82f6' },
            { name: 'Priya Sharma', role: 'Options Specialist', quote: 'The options chain viewer with real NSE data is exactly what I needed. No more scraping manually.', color: '#059669' },
            { name: 'Arjun Mehta', role: 'Algo Enthusiast', quote: 'Started as a beginner. The no-code strategy builder made it easy to test my first MA crossover.', color: '#8b5cf6' },
          ].map((t, i) => (
            <Card3D key={i} intensity={10} style={{ padding: 28 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} color="#fbbf24" fill="#fbbf24" />)}
              </div>
              <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.65, marginBottom: 24, fontStyle: 'italic' }}>
                "{t.quote}"
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${t.color}, ${t.color}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  boxShadow: `0 0 15px ${t.color}40`
                }}>
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{t.role}</div>
                </div>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* ── Trust ──────────────────────────────── */}
      <section style={{
        padding: '64px 40px', maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, textAlign: 'center'
      }}>
        {[
          { icon: CheckCircle, title: 'SEBI Compliant', desc: 'Follows Indian market regulations', color: '#059669' },
          { icon: Shield, title: 'Secure Platform', desc: 'Data encrypted & private', color: '#3b82f6' },
          { icon: BarChart3, title: 'Real Market Data', desc: 'Yahoo Finance + NSE APIs', color: '#8b5cf6' },
        ].map((b, i) => {
          const Icon = b.icon;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: `linear-gradient(135deg, ${b.color}15, ${b.color}08)`,
                border: `1px solid ${b.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
                boxShadow: `0 0 20px ${b.color}15`
              }}>
                <Icon size={22} color={b.color} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{b.title}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{b.desc}</div>
            </div>
          );
        })}
      </section>

      {/* ── CTA (Moving Border) ──────────────── */}
      <section style={{ padding: '80px 40px', position: 'relative' }}>
        <GridBackground color="rgba(99,102,241,0.03)" fade />
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <MovingBorderCard borderColor="#6366f1" duration={3}>
            <div style={{ padding: '56px 48px', textAlign: 'center', position: 'relative' }}>
              <GlowOrb color="rgba(99,102,241,0.08)" size={200} top="-60px" right="-60px" animate={false} />
              <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: -0.5, position: 'relative', zIndex: 1 }}>
                Start Trading <GradientText>Smarter</GradientText> Today
              </h2>
              <p style={{ fontSize: 16, color: '#94a3b8', marginBottom: 32, position: 'relative', zIndex: 1 }}>
                Join thousands of Indian traders who test before they trade.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                <Link to="/register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
                  padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 0 30px rgba(99,102,241,0.5), 0 8px 20px rgba(59,130,246,0.3)'
                }}>
                  Create Free Account <ArrowRight size={16} />
                </Link>
                <Link to="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0', padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 500,
                  textDecoration: 'none'
                }}>
                  Sign In
                </Link>
              </div>
            </div>
          </MovingBorderCard>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)', padding: '48px 40px 32px',
        maxWidth: 1100, margin: '0 auto'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <TrendingUp size={14} color="#fff" />
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>AlgoForge</span>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, maxWidth: 260 }}>
              Algorithmic trading platform for Indian markets. Build, test, and analyze strategies.
            </p>
          </div>
          {[
            { title: 'Platform', links: ['Strategy Builder', 'Backtesting', 'Live Market', 'Options Chain'] },
            { title: 'Learn', links: ['Trading Basics', 'Strategy Guide', 'Risk Mgmt', 'Blog'] },
            { title: 'Support', links: ['Help Center', 'Contact', 'API Docs', 'Status'] },
          ].map(col => (
            <div key={col.title}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {col.title}
              </div>
              {col.links.map(l => (
                <a key={l} href="#" style={{
                  display: 'block', fontSize: 13, color: '#475569', textDecoration: 'none',
                  marginBottom: 8, transition: 'color .15s'
                }} onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')} onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: 12, color: '#334155' }}>© 2025 AlgoForge. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Cookies'].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: '#334155', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;