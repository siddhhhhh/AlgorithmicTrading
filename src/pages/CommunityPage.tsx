import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Users, MessageSquare, Star, TrendingUp, Trophy, Search, ThumbsUp, Eye, Clock, Award, GitFork, Zap, Crown, Shield, Send, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { LiquidBlob, Tilt3D, RippleButton, ElasticReveal, OrbitRing } from '../components/ui/AceternityEffects';

// ── Data ──────────────────────────────────────────────────────────────────
const strategies = [
  { id: 1, title: 'BankNifty Options Income Engine', author: 'Amitesh Shetty', verified: true, price: 1699, rating: 4.9, reviews: 135, downloads: 3120, returns: '+120%', winRate: '80%', tags: ['Options', 'Weekly', 'Safe'], badge: 'Well Tested', desc: 'Sell premium in range-bound markets using delta-neutral iron condors.', color: '#3b82f6' },
  { id: 2, title: 'Momentum Breakout AI System', author: 'Ritika Verma', verified: false, price: 1299, rating: 4.7, reviews: 89, downloads: 1898, returns: '+94%', winRate: '65%', tags: ['AI', 'Momentum', 'Intraday'], badge: 'Experimental', desc: 'AI-powered signal generator for intraday momentum bursts.', color: '#10b981' },
  { id: 3, title: 'Nifty Pair Arbitragear', author: 'Devansh Rathod', verified: true, price: 2399, rating: 4.8, reviews: 111, downloads: 1723, returns: '+137%', winRate: '73%', tags: ['Pairs', 'Market Neutral'], badge: 'Well Tested', desc: 'Arbitrage Nifty twins using mean reversion and spread targeting.', color: '#8b5cf6' },
  { id: 4, title: 'BTC Volatility Catcher', author: 'Ishaan Shah', verified: true, price: 1999, rating: 4.6, reviews: 75, downloads: 1497, returns: '+106%', winRate: '68%', tags: ['Crypto', 'Volatility'], badge: 'Tested', desc: 'Options swing trading system for BTC with risk-managed straddles.', color: '#f59e0b' },
  { id: 5, title: 'Intraday Gap Fader', author: 'Lalitha Mohanty', verified: false, price: 1249, rating: 4.5, reviews: 40, downloads: 971, returns: '+81%', winRate: '64%', tags: ['Intraday', 'Gap Fading'], badge: 'Experimental', desc: 'Fade opening gaps in high liquidity stocks.', color: '#ef4444' },
  { id: 6, title: 'AI News Sentiment Trader', author: 'Varsha Pillai', verified: true, price: 2299, rating: 4.9, reviews: 138, downloads: 1874, returns: '+145%', winRate: '80%', tags: ['AI', 'News', 'Sentiment'], badge: 'Well Tested', desc: 'Scans news/sentiment for trade triggers, auto-hedges via options.', color: '#ec4899' },
];
const collabs = [
  { id: 1, title: 'Weekly Options Community Bot', author: 'Priya Singh', forks: 12, views: 314, votes: 31, update: '1 hr ago', desc: 'Refine a robust weekly options seller, help optimize risk blocks.', tags: ['Options', 'Risk'] },
  { id: 2, title: 'AI Intraday Momentum Pool', author: 'Sonal Reddy', forks: 15, views: 474, votes: 38, update: '3 hr ago', desc: 'Improve this collaborative AI momentum engine. Add new filters!', tags: ['AI', 'Intraday'] },
  { id: 3, title: 'Market Neutral Pairs Picker', author: 'Devansh Rathod', forks: 9, views: 207, votes: 19, update: '2 hr ago', desc: 'Help add pairs and smarter mean reversion rules.', tags: ['Pairs', 'Neutral'] },
  { id: 4, title: 'ETF Sector Rotary', author: 'Sarvesh Nair', forks: 7, views: 196, votes: 15, update: '6 hr ago', desc: 'Perfect the sector switch logic, test alternate cycles.', tags: ['ETF', 'Sector'] },
];
const discussions = [
  { id: 1, title: 'Hedging with Futures?', author: 'Sneha Kothari', replies: 15, views: 350, time: '1 hour ago', cat: 'Strategy', hot: true },
  { id: 2, title: 'Dealing with Drawdowns?', author: 'Devansh Rathod', replies: 8, views: 267, time: '2 hours ago', cat: 'Risk', hot: false },
  { id: 3, title: 'Machine Learning in Live Trading', author: 'Sonal Reddy', replies: 23, views: 540, time: '40 min ago', cat: 'Tech', hot: true },
];
const mentors = [
  { id: 1, name: 'Priya Singh', expertise: ['Risk Mgmt', 'Options'], rating: 4.9, badge: 'Risk Pro', avatar: 'PS', bio: 'Author of "Options 101", mentor for 250+ students.', color: '#ef4444' },
  { id: 2, name: 'Karan Malhotra', expertise: ['Strategy', 'Bonds'], rating: 4.7, badge: 'Strategy Guru', avatar: 'KM', bio: 'NSE contest winner; logic optimizer.', color: '#3b82f6' },
  { id: 3, name: 'Sonal Reddy', expertise: ['AI & ML', 'Review'], rating: 4.8, badge: 'AI Wizard', avatar: 'SR', bio: 'Built "Momentum Breakout AI System".', color: '#8b5cf6' },
  { id: 4, name: 'Nikhil Mehta', expertise: ['FX/Currency', 'Backtesting'], rating: 4.6, badge: 'FX Coach', avatar: 'NM', bio: 'Curates USD-INR Carry Advantage.', color: '#10b981' },
  { id: 5, name: 'Lalitha Mohanty', expertise: ['Intraday', 'Execution'], rating: 4.7, badge: 'Daytrader Star', avatar: 'LM', bio: 'Created Intraday Gap Fader.', color: '#f59e0b' },
  { id: 6, name: 'Ajay Sethi', expertise: ['Swing', 'Grid Systems'], rating: 4.7, badge: 'Swing Master', avatar: 'AS', bio: 'Built Positional Swing Grid.', color: '#ec4899' },
];
const competitions = [
  { id: 1, title: 'Trading Bot Grand Prix', desc: 'Top ROI in 10 days wins ₹1L', participants: 322, prize: '₹1,00,000', timeLeft: '6 days', active: true },
  { id: 2, title: 'Options Champion', desc: 'Best options win-rate gets ₹50K', participants: 156, prize: '₹50,000', timeLeft: '14 days', active: true },
  { id: 3, title: 'AI Quant Hunt', desc: 'Most creative AI-powered algo', participants: 88, prize: '₹25,000', timeLeft: 'Ended', active: false },
];

const badgeStyle = (b: string): React.CSSProperties => ({
  fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 8, textTransform: 'uppercase' as const, letterSpacing: 0.5,
  background: b === 'Well Tested' ? '#dcfce7' : b === 'Tested' ? '#dbeafe' : '#fef3c7',
  color: b === 'Well Tested' ? '#16a34a' : b === 'Tested' ? '#2563eb' : '#d97706',
});

const CommunityPage: React.FC = () => {
  const [tab, setTab] = useState<'marketplace' | 'collab' | 'discussions' | 'livefeed' | 'competitions' | 'mentors'>('marketplace');
  const [search, setSearch] = useState('');
  const [boughtId, setBoughtId] = useState<number | null>(null);
  const [feedInput, setFeedInput] = useState('');
  const [feed, setFeed] = useState([
    { id: 1, author: 'Amitesh Shetty', msg: 'Just deployed BankNifty Options Income Engine—fingers crossed for expiry!', time: '3m', avatar: 'AS' },
    { id: 2, author: 'Lalitha Mohanty', msg: 'Fade gap strategy worked wonders on Reliance today 🎉', time: '10m', avatar: 'LM' },
    { id: 3, author: 'Nikhil Mehta', msg: 'Please suggest tweaks to Carry Advantage logic (looking for more pairs).', time: '13m', avatar: 'NM' },
  ]);
  const [discInput, setDiscInput] = useState('');
  const [discList, setDiscList] = useState(discussions);

  const handlePostFeed = () => { if (feedInput.trim()) { setFeed([{ id: feed.length + 1, author: 'You', msg: feedInput, time: 'now', avatar: 'Y' }, ...feed]); setFeedInput('') } };
  const handlePostDisc = () => { if (discInput.trim()) { setDiscList([{ id: discList.length + 1, title: discInput, author: 'You', replies: 0, views: 1, time: 'just now', cat: 'General', hot: false }, ...discList]); setDiscInput('') } };

  const filtered = strategies.filter(s => s.title.toLowerCase().includes(search.toLowerCase()));

  const tabs = [
    { id: 'marketplace' as const, label: 'Marketplace', icon: Sparkles },
    { id: 'collab' as const, label: 'Collab Board', icon: GitFork },
    { id: 'discussions' as const, label: 'Discussions', icon: MessageSquare },
    { id: 'livefeed' as const, label: 'Live Feed', icon: Zap },
    { id: 'competitions' as const, label: 'Competitions', icon: Trophy },
    { id: 'mentors' as const, label: 'Mentors', icon: Crown },
  ];

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '2px solid #f1f5f9', fontSize: 13, fontWeight: 500, color: '#1e293b', background: '#fafbfc', outline: 'none', transition: 'all 0.2s' };
  const focusIn = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#14b8a6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(20,184,166,0.08)'; };
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.boxShadow = 'none'; };

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes floatSoft{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(20,184,166,0.4)}70%{box-shadow:0 0 0 10px rgba(20,184,166,0)}100%{box-shadow:0 0 0 0 rgba(20,184,166,0)}}
      `}</style>

      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>

        {/* ═════════ HERO — LiquidBlob background ═════════ */}
        <LiquidBlob color1="#0d9488" color2="#6366f1" style={{
          background: 'linear-gradient(135deg, #042f2e 0%, #134e4a 30%, #115e59 50%, #0f766e 80%, #0d4f4f 100%)',
          borderRadius: 20, padding: '28px 32px', marginBottom: 20, color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                  <Users size={20} />
                </div>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Community</h1>
                  <p style={{ fontSize: 11, opacity: 0.5, margin: 0 }}>Connect, share, and learn with 10,234 active traders</p>
                </div>
              </div>
            </div>
            {/* 3D Orbit Ring of stats */}
            <div style={{ perspective: 600, height: 90, display: 'flex', alignItems: 'center' }}>
              <OrbitRing radius={60} speed={15} items={[
                <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 8, opacity: 0.4, fontWeight: 600 }}>TRADERS</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>10.2K</div>
                </div>,
                <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 8, opacity: 0.4, fontWeight: 600 }}>STRATEGIES</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>1.5K</div>
                </div>,
                <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 8, opacity: 0.4, fontWeight: 600 }}>POSTS</div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>8.9K</div>
                </div>,
                <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: 8, opacity: 0.4, fontWeight: 600 }}>PRIZES</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>₹2.5L</div>
                </div>,
              ]} style={{ margin: '0 auto' }} />
            </div>
          </div>
        </LiquidBlob>

        {/* ═════════ TABS ═════════ */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(t => {
            const active = tab === t.id; const Icon = t.icon;
            return (
              <RippleButton key={t.id} color="rgba(20,184,166,0.3)" onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: 'none', background: active ? 'linear-gradient(135deg,#0d9488,#14b8a6)' : '#f8fafc',
                color: active ? '#fff' : '#64748b', transition: 'all 0.3s',
                boxShadow: active ? '0 4px 16px rgba(13,148,136,0.3)' : 'none',
              }}>
                <Icon size={14} /> {t.label}
              </RippleButton>
            );
          })}
        </div>

        {/* ═════════ MARKETPLACE ═════════ */}
        {tab === 'marketplace' && (
          <div>
            <div style={{ marginBottom: 16, position: 'relative', maxWidth: 360 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search strategies…" onFocus={focusIn} onBlur={focusOut}
                style={{ ...inputStyle, paddingLeft: 34 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {filtered.map((s, i) => (
                <ElasticReveal key={s.id} delay={i * 0.06}>
                  <Tilt3D maxTilt={6} glare style={{ borderRadius: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                      {/* Gradient Banner */}
                      <div style={{ height: 48, background: `linear-gradient(135deg,${s.color},${s.color}88)`, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', opacity: 0.9 }}>{s.returns}</span>
                        <span style={{ marginLeft: 'auto', ...badgeStyle(s.badge) }}>{s.badge}</span>
                      </div>
                      <div style={{ padding: '16px 18px' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px', lineHeight: 1.3 }}>{s.title}</h3>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 8px', lineHeight: 1.4 }}>{s.desc}</p>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
                          by <strong>{s.author}</strong> {s.verified && <span style={{ color: '#3b82f6', fontWeight: 700 }}>✓</span>}
                          <span style={{ float: 'right' }}><Star size={10} fill="#f59e0b" color="#f59e0b" /> {s.rating} ({s.reviews})</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                          {s.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 6, background: '#f0fdfa', color: '#0d9488', fontWeight: 600 }}>#{t}</span>)}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <RippleButton onClick={() => boughtId === s.id ? null : setBoughtId(s.id)} color="rgba(255,255,255,0.3)" style={{
                            flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', cursor: boughtId === s.id ? 'default' : 'pointer',
                            background: boughtId === s.id ? '#94a3b8' : `linear-gradient(135deg,${s.color},${s.color}bb)`,
                            color: '#fff', fontSize: 11, fontWeight: 700,
                          }}>
                            {boughtId === s.id ? '✓ Purchased' : `Buy ₹${s.price}`}
                          </RippleButton>
                          <RippleButton color="rgba(20,184,166,0.3)" style={{
                            flex: 1, padding: '9px 0', borderRadius: 10, border: '2px solid #14b8a6', background: 'transparent',
                            color: '#0d9488', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          }}>
                            Deploy <ArrowRight size={10} style={{ marginLeft: 2 }} />
                          </RippleButton>
                        </div>
                      </div>
                    </div>
                  </Tilt3D>
                </ElasticReveal>
              ))}
            </div>
          </div>
        )}

        {/* ═════════ COLLAB BOARD ═════════ */}
        {tab === 'collab' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <GitFork size={16} color="#0d9488" /> Collaboration Board
              </div>
              <RippleButton color="rgba(255,255,255,0.3)" style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0d9488,#14b8a6)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                + Create Collab
              </RippleButton>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
              {collabs.map((c, i) => (
                <ElasticReveal key={c.id} delay={i * 0.08}>
                  <Tilt3D maxTilt={5} glare style={{ borderRadius: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '2px solid #ccfbf1' }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{c.title}</h3>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px', lineHeight: 1.4 }}>{c.desc}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                        {c.tags.map(t => <span key={t} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 6, background: '#f0fdfa', color: '#0d9488', fontWeight: 600 }}>#{t}</span>)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                        <span>by <strong>{c.author}</strong></span>
                        <span><GitFork size={10} /> {c.forks} · <Eye size={10} /> {c.views} · <ThumbsUp size={10} /> {c.votes}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <RippleButton color="rgba(20,184,166,0.3)" style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10b981,#14b8a6)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Fork & Improve
                        </RippleButton>
                        <RippleButton color="rgba(148,163,184,0.2)" style={{ flex: 1, padding: '8px 0', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          Discuss
                        </RippleButton>
                      </div>
                    </div>
                  </Tilt3D>
                </ElasticReveal>
              ))}
            </div>
          </div>
        )}

        {/* ═════════ DISCUSSIONS ═════════ */}
        {tab === 'discussions' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={discInput} onChange={e => setDiscInput(e.target.value)} placeholder="Start a discussion…" onFocus={focusIn} onBlur={focusOut} style={{ ...inputStyle, flex: 1 }} />
              <RippleButton onClick={handlePostDisc} color="rgba(255,255,255,0.3)" style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0d9488,#14b8a6)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Send size={12} /> Post
              </RippleButton>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {discList.map((d, i) => (
                <ElasticReveal key={d.id} delay={i * 0.06}>
                  <Tilt3D maxTilt={3} glare style={{ borderRadius: 14 }}>
                    <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>{d.title}</h3>
                          {d.hot && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#fef2f2', color: '#ef4444' }}>🔥 Hot</span>}
                          <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: '#f1f5f9', color: '#64748b' }}>{d.cat}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 12 }}>
                          <span>by <strong style={{ color: '#64748b' }}>{d.author}</strong></span>
                          <span><MessageSquare size={10} /> {d.replies}</span>
                          <span><Eye size={10} /> {d.views}</span>
                          <span><Clock size={10} /> {d.time}</span>
                        </div>
                      </div>
                      <ThumbsUp size={16} color="#94a3b8" style={{ cursor: 'pointer' }} />
                    </div>
                  </Tilt3D>
                </ElasticReveal>
              ))}
            </div>
          </div>
        )}

        {/* ═════════ LIVE FEED ═════════ */}
        {tab === 'livefeed' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={feedInput} onChange={e => setFeedInput(e.target.value)} placeholder="Share something with the community…" onFocus={focusIn} onBlur={focusOut} style={{ ...inputStyle, flex: 1 }} />
              <RippleButton onClick={handlePostFeed} color="rgba(255,255,255,0.3)" style={{
                padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0d9488,#14b8a6)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Send size={12} /> Post
              </RippleButton>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {feed.map((f, i) => (
                <ElasticReveal key={f.id} delay={i * 0.06}>
                  <div style={{ background: '#fff', borderRadius: 14, padding: '14px 18px', border: '1px solid #f1f5f9', display: 'flex', gap: 12, alignItems: 'flex-start', transition: 'all 0.3s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#99f6e4'; (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f1f5f9'; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#0d9488,#14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {f.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, marginBottom: 2 }}>
                        <strong style={{ color: '#1e293b' }}>{f.author}</strong>
                        <span style={{ color: '#94a3b8', marginLeft: 8, fontSize: 10 }}>{f.time}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>{f.msg}</div>
                    </div>
                  </div>
                </ElasticReveal>
              ))}
            </div>
          </div>
        )}

        {/* ═════════ COMPETITIONS ═════════ */}
        {tab === 'competitions' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {competitions.map((c, i) => (
              <ElasticReveal key={c.id} delay={i * 0.1}>
                <Tilt3D maxTilt={5} glare style={{ borderRadius: 16 }}>
                  <div style={{ background: c.active ? 'linear-gradient(135deg,#042f2e,#134e4a)' : '#f8fafc', borderRadius: 16, padding: '22px 24px', color: c.active ? '#fff' : '#1e293b', border: c.active ? 'none' : '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px' }}>{c.title}</h3>
                        <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>{c.desc}</p>
                      </div>
                      {c.active && <span style={{ fontSize: 9, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: 'rgba(16,185,129,0.2)', color: '#34d399', animation: 'pulseRing 2s infinite' }}>LIVE</span>}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
                      {[
                        { label: 'Participants', value: c.participants, color: c.active ? '#5eead4' : '#1e293b' },
                        { label: 'Prize Pool', value: c.prize, color: c.active ? '#fbbf24' : '#16a34a' },
                        { label: c.active ? 'Time Left' : 'Status', value: c.timeLeft, color: c.active ? '#fb923c' : '#94a3b8' },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 600 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <RippleButton color={c.active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'} style={{
                      width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
                      background: c.active ? 'linear-gradient(135deg,#14b8a6,#0d9488)' : '#e2e8f0',
                      color: c.active ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: c.active ? 'pointer' : 'default',
                    }}>
                      {c.active ? 'Join Competition' : 'Competition Ended'}
                    </RippleButton>
                  </div>
                </Tilt3D>
              </ElasticReveal>
            ))}
          </div>
        )}

        {/* ═════════ MENTORS ═════════ */}
        {tab === 'mentors' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {mentors.map((m, i) => (
              <ElasticReveal key={m.id} delay={i * 0.08}>
                <Tilt3D maxTilt={7} glare style={{ borderRadius: 16 }}>
                  <div style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', border: '2px solid #f1f5f9', display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg,${m.color},${m.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16, flexShrink: 0, boxShadow: `0 4px 12px ${m.color}30` }}>
                      {m.avatar}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <strong style={{ fontSize: 14, color: '#1e293b' }}>{m.name}</strong>
                        <span style={{ fontSize: 8, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: '#fef9c3', color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.badge}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, lineHeight: 1.3 }}>{m.bio}</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                        {m.expertise.map(e => <span key={e} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, background: '#f0fdfa', color: '#0d9488', fontWeight: 600 }}>{e}</span>)}
                      </div>
                      <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700 }}>★ {m.rating}</div>
                    </div>
                  </div>
                </Tilt3D>
              </ElasticReveal>
            ))}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default CommunityPage;
