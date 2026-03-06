import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  CreditCard, Check, Star, Zap, Crown, Download, Calendar,
  Sparkles, Gift, ArrowRight, Shield, Rocket, BadgeCheck, Clock,
  ChevronRight, TrendingUp, Award, Users
} from 'lucide-react';
import { GlassParallax, ShineSwipe, PriceFlip, ConfettiPop, LayerStack } from '../components/ui/AceternityEffects';

const BillingPage: React.FC = () => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 200); return () => clearTimeout(t); }, []);

  const plans = [
    {
      id: 'free', name: 'Starter', icon: Rocket, color: '#64748b', gradient: 'linear-gradient(135deg,#f8fafc,#e2e8f0)',
      description: 'Perfect for learning',
      monthlyPrice: 0, annualPrice: 0,
      features: ['5 backtests/month', 'Basic templates', 'Paper trading', 'Learning hub', 'Community forum', 'Email support'],
      limitations: ['No live trading', 'No AI Copilot', 'No analytics'],
      buttonText: 'Current Plan', isPopular: false,
    },
    {
      id: 'premium', name: 'Professional', icon: Crown, color: '#6366f1', gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed,#a855f7)',
      description: 'For serious traders',
      monthlyPrice: 999, annualPrice: 799,
      features: ['Unlimited backtests', 'All templates', 'Live trading (3 brokers)', 'Advanced analytics', 'AI Copilot', 'Monte Carlo sims', 'Portfolio optimization', 'Priority 24/7 support', 'API access', 'Custom indicators'],
      limitations: [],
      buttonText: 'Start 7-Day Free Trial', isPopular: true,
    },
    {
      id: 'enterprise', name: 'Institution', icon: Shield, color: '#0891b2', gradient: 'linear-gradient(135deg,#0e7490,#0891b2,#06b6d4)',
      description: 'For trading teams',
      monthlyPrice: null, annualPrice: null,
      features: ['Everything in Pro', 'White-label', 'Team accounts', 'Compliance tools', 'Dedicated manager', 'Custom integrations', 'SLA guarantees', 'On-premise deploy'],
      limitations: [],
      buttonText: 'Contact Sales', isPopular: false,
    },
  ];

  const creditPackages = [
    { credits: 100, price: 99, originalPrice: null, label: 'Starter Pack', color: '#f59e0b', isPopular: false },
    { credits: 500, price: 399, originalPrice: 499, label: 'Power Pack', color: '#6366f1', isPopular: true },
    { credits: 1000, price: 699, originalPrice: 999, label: 'Pro Pack', color: '#10b981', isPopular: false },
  ];

  const billingHistory = [
    { date: '15-07-2025', plan: 'Professional', amount: 999, status: 'Paid', invoice: 'INV-2025-001' },
    { date: '15-06-2025', plan: 'Professional', amount: 999, status: 'Paid', invoice: 'INV-2025-002' },
    { date: '15-05-2025', plan: 'Professional', amount: 999, status: 'Paid', invoice: 'INV-2025-003' },
  ];

  const priceDisplay = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === null) return 'Custom';
    const p = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    return `₹${p}`;
  };

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.15)}50%{box-shadow:0 0 40px rgba(99,102,241,0.25)}}
        @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
      `}</style>

      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>

        {/* ═══ HERO — Premium gradient with ShineSwipe ═══ */}
        <ShineSwipe speed={4} color="rgba(255,255,255,0.08)" style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4f46e5 50%, #7c3aed 75%, #a855f7 100%)',
          borderRadius: 20, padding: '28px 32px', marginBottom: 18, color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', animation: 'float 4s ease infinite' }} />
          <div style={{ position: 'absolute', left: '30%', bottom: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.02)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} />
                </div>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Billing & Subscription</h1>
                  <p style={{ fontSize: 11, opacity: 0.5, margin: 0 }}>Manage your plan, credits, and invoices</p>
                </div>
              </div>
            </div>
            {/* Current plan badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BadgeCheck size={14} color="#34d399" />
                <span style={{ fontSize: 12, fontWeight: 700 }}>
                  {user?.subscription === 'premium' ? 'Professional Plan' : user?.subscription === 'enterprise' ? 'Enterprise' : 'Free Plan'}
                </span>
              </div>
            </div>
          </div>
        </ShineSwipe>

        {/* ═══ STATS ROW — GlassParallax cards ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {/* Credits Balance */}
          <GlassParallax intensity={6} style={{ borderRadius: 16, padding: '18px 20px', animation: 'fadeUp 0.5s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={15} color="#fff" />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>Credits Balance</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', letterSpacing: -1, marginBottom: 2 }}>
              <PriceFlip value={String(user?.credits ?? 500)} style={{ fontSize: 28, fontWeight: 800 }} />
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 10 }}>150 credits expire in 30 days</div>
            <div style={{ height: 5, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', width: loaded ? '45%' : '0%', transition: 'width 1.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8' }}>
              <span>450/1000 used</span><span>55% remaining</span>
            </div>
          </GlassParallax>

          {/* Usage */}
          <GlassParallax intensity={6} style={{ borderRadius: 16, padding: '18px 20px', animation: 'fadeUp 0.5s ease 0.06s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={15} color="#fff" />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>This Month Usage</div>
            </div>
            {[
              { name: 'Backtests', value: 320, pct: 71, color: '#6366f1' },
              { name: 'Analytics', value: 85, pct: 19, color: '#ec4899' },
              { name: 'AI Copilot', value: 45, pct: 10, color: '#10b981' },
            ].map(u => (
              <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#64748b', width: 56 }}>{u.name}</div>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: u.color, width: loaded ? `${u.pct}%` : '0%', transition: `width 1.5s ease ${0.2}s` }} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: u.color, width: 20, textAlign: 'right' }}>{u.pct}%</div>
              </div>
            ))}
          </GlassParallax>

          {/* Earning */}
          <GlassParallax intensity={6} style={{ borderRadius: 16, padding: '18px 20px', animation: 'fadeUp 0.5s ease 0.12s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={15} color="#fff" />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>Earn Credits</div>
            </div>
            {[
              { action: 'Complete courses', reward: '+50', icon: Award },
              { action: 'Daily login', reward: '+5', icon: Clock },
              { action: 'Refer friends', reward: '+100', icon: Users },
            ].map((e, i) => {
              const Icon = e.icon;
              return (
                <div key={e.action} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, marginBottom: 3,
                  background: '#f0fdf4', transition: 'all 0.2s', animation: `slideRight 0.3s ease ${0.3 + i * 0.06}s both`,
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '12px'; (e.currentTarget as HTMLElement).style.background = '#dcfce7' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.paddingLeft = '8px'; (e.currentTarget as HTMLElement).style.background = '#f0fdf4' }}>
                  <Icon size={11} color="#10b981" />
                  <span style={{ fontSize: 11, color: '#1e293b', flex: 1 }}>{e.action}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>{e.reward}</span>
                </div>
              );
            })}
          </GlassParallax>
        </div>

        {/* ═══ PRICING TOGGLE ═══ */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 12, padding: 3, gap: 2 }}>
            {(['monthly', 'annual'] as const).map(c => (
              <button key={c} onClick={() => setBillingCycle(c)} style={{
                padding: '8px 20px', borderRadius: 10, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.3s',
                background: billingCycle === c ? '#fff' : 'transparent',
                color: billingCycle === c ? '#1e293b' : '#64748b',
                boxShadow: billingCycle === c ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}>
                {c === 'monthly' ? 'Monthly' : 'Annual'}
                {c === 'annual' && <span style={{ marginLeft: 8, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 700 }}>Save 20%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ═══ PRICING PLANS — LayerStack + GlassParallax ═══ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isPro = plan.isPopular;
            return (
              <LayerStack key={plan.id} layers={isPro ? 3 : 2} color={`${plan.color}08`} style={{ borderRadius: 20, animation: `scaleIn 0.5s ease ${i * 0.08}s both` }}>
                <GlassParallax intensity={isPro ? 8 : 5} style={{
                  borderRadius: 20, padding: '24px 22px',
                  background: isPro ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)',
                  border: isPro ? '2px solid rgba(99,102,241,0.2)' : '1px solid rgba(0,0,0,0.04)',
                  animation: isPro ? 'glow 3s infinite' : undefined,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Popular badge */}
                  {isPro && (
                    <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}>
                      <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', padding: '4px 14px', borderRadius: '0 0 10 10', fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>
                        ✨ MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: 16, marginTop: isPro ? 10 : 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: plan.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', animation: 'float 3s ease infinite' }}>
                      <Icon size={20} color="#fff" />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{plan.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{plan.description}</div>
                  </div>

                  {/* Price — PriceFlip */}
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: '#1e293b', letterSpacing: -1 }}>
                      <PriceFlip value={priceDisplay(plan)} style={{ fontSize: 36, fontWeight: 800, letterSpacing: -1 }} />
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      {plan.monthlyPrice !== null ? `/${billingCycle === 'monthly' ? 'month' : 'mo (billed yearly)'}` : 'Contact our sales team'}
                    </div>
                    {billingCycle === 'annual' && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
                      <div style={{ fontSize: 10, color: '#10b981', fontWeight: 700, marginTop: 2 }}>
                        Save ₹{(plan.monthlyPrice - plan.annualPrice!) * 12}/year
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div style={{ marginBottom: 16 }}>
                    {plan.features.map((f, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', animation: `slideRight 0.3s ease ${0.2 + j * 0.03}s both` }}>
                        <Check size={12} color="#10b981" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: '#475569' }}>{f}</span>
                      </div>
                    ))}
                    {plan.limitations.map((l, j) => (
                      <div key={`l-${j}`} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', opacity: 0.4 }}>
                        <div style={{ width: 12, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ width: 8, height: 1.5, background: '#94a3b8', borderRadius: 1 }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{l}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA — ConfettiPop on premium */}
                  {isPro ? (
                    <ConfettiPop style={{ borderRadius: 12 }}>
                      <button style={{
                        width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', fontSize: 12, fontWeight: 700,
                        background: plan.gradient, color: '#fff', cursor: 'pointer',
                        boxShadow: '0 4px 16px rgba(99,102,241,0.3)', transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(99,102,241,0.3)' }}>
                        {plan.buttonText}
                      </button>
                    </ConfettiPop>
                  ) : (
                    <button style={{
                      width: '100%', padding: '11px 0', borderRadius: 12, border: `1.5px solid ${plan.id === 'free' ? '#e2e8f0' : plan.color + '30'}`,
                      fontSize: 12, fontWeight: 700, cursor: plan.id === 'free' ? 'not-allowed' : 'pointer',
                      background: plan.id === 'free' ? '#f8fafc' : 'transparent',
                      color: plan.id === 'free' ? '#94a3b8' : plan.color, transition: 'all 0.2s',
                    }}
                      disabled={plan.id === 'free'}
                      onMouseEnter={e => { if (plan.id !== 'free') { e.currentTarget.style.background = plan.color; e.currentTarget.style.color = '#fff' } }}
                      onMouseLeave={e => { if (plan.id !== 'free') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = plan.color } }}>
                      {plan.buttonText}
                    </button>
                  )}

                  {isPro && (
                    <div style={{ textAlign: 'center', fontSize: 9, color: '#94a3b8', marginTop: 6 }}>Cancel anytime · ₹0 for first 7 days</div>
                  )}
                </GlassParallax>
              </LayerStack>
            );
          })}
        </div>

        {/* ═══ CREDIT PACKAGES ═══ */}
        <div style={{ marginBottom: 20, animation: 'fadeUp 0.6s ease both' }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Credit Packages</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Buy credits for backtests and AI features</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {creditPackages.map((pkg, i) => (
              <ShineSwipe key={i} speed={4 + i} color={`${pkg.color}15`} style={{
                borderRadius: 16, animation: `scaleIn 0.4s ease ${0.1 + i * 0.08}s both`,
              }}>
                <ConfettiPop colors={[pkg.color, '#fbbf24', '#ec4899']} style={{ borderRadius: 16 }}>
                  <div style={{
                    background: '#fff', borderRadius: 16, padding: '20px 18px', textAlign: 'center',
                    border: pkg.isPopular ? `2px solid ${pkg.color}30` : '1px solid #f1f5f9',
                    transition: 'all 0.2s', position: 'relative', overflow: 'hidden',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${pkg.color}15` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                    {pkg.isPopular && (
                      <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <span style={{ background: `${pkg.color}10`, color: pkg.color, padding: '2px 8px', borderRadius: 6, fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Star size={8} /> BEST VALUE
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 700, color: pkg.color, marginBottom: 2 }}>{pkg.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', letterSpacing: -1 }}>{pkg.credits}</div>
                    <div style={{ fontSize: 9, color: '#94a3b8', marginBottom: 8 }}>credits</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: pkg.color, marginBottom: 2 }}>
                      ₹{pkg.price}
                      {pkg.originalPrice && <span style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'line-through', marginLeft: 6 }}>₹{pkg.originalPrice}</span>}
                    </div>
                    <button style={{
                      width: '100%', padding: '9px 0', borderRadius: 10, border: 'none', fontSize: 11, fontWeight: 700,
                      background: `${pkg.color}10`, color: pkg.color, cursor: 'pointer', transition: 'all 0.2s', marginTop: 8,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = pkg.color; e.currentTarget.style.color = '#fff' }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${pkg.color}10`; e.currentTarget.style.color = pkg.color }}>
                      Buy Now
                    </button>
                  </div>
                </ConfettiPop>
              </ShineSwipe>
            ))}
          </div>
        </div>

        {/* ═══ BILLING HISTORY ═══ */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #f1f5f9', animation: 'fadeUp 0.6s ease 0.1s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} color="#6366f1" /> Billing History
            </div>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Download size={12} /> Download All
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Date', 'Plan', 'Amount', 'Status', 'Invoice'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billingHistory.map((bill, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f8fafc', transition: 'all 0.2s', animation: `slideRight 0.3s ease ${0.3 + i * 0.06}s both` }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{bill.date}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{bill.plan}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1e293b' }}>₹{bill.amount}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: '#dcfce7', color: '#16a34a' }}>{bill.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <button style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                      onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                      onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}>
                      <Download size={10} /> {bill.invoice}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BillingPage;