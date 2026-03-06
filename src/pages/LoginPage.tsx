import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card3D, GridBackground, GlowOrb, FloatingParticles, GradientText } from '../components/ui/AceternityEffects';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try { await login(email, password); navigate('/dashboard'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Login failed'); }
    finally { setIsLoading(false); }
  };

  const demo = async (type: 'beginner' | 'pro') => {
    setIsLoading(true);
    try { await login(type === 'beginner' ? 'demo@beginner.com' : 'demo@pro.com', 'demo123'); navigate('/dashboard'); }
    catch { setError('Demo login failed'); }
    finally { setIsLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 14, fontFamily: 'Inter, sans-serif',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', outline: 'none', transition: 'all .25s'
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif",
      background: '#030712'
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 56px', position: 'relative', overflow: 'hidden'
      }}>
        <GridBackground color="rgba(99,102,241,0.03)" fade />
        <FloatingParticles count={25} color="rgba(99,102,241,0.3)" />
        <GlowOrb color="rgba(59,130,246,0.1)" size={400} top="10%" left="20%" />
        <GlowOrb color="rgba(139,92,246,0.08)" size={300} bottom="20%" right="10%" />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(59,130,246,0.4)'
            }}>
              <TrendingUp size={20} color="#fff" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>AlgoForge</span>
          </Link>

          <h1 className="animate-in" style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: -1, marginBottom: 16 }}>
            Welcome back to<br /><GradientText>intelligent trading</GradientText>
          </h1>
          <p className="animate-in delay-1" style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, marginBottom: 48 }}>
            Access your strategies, run backtests on Nifty 50 data, and monitor the Indian market in real-time.
          </p>

          <div className="animate-in delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { dot: '#3b82f6', title: 'Real-time NSE/BSE Data', desc: 'Live indices and Nifty 50 stocks' },
              { dot: '#059669', title: 'Advanced Backtesting', desc: 'Test strategies with real historical data' },
              { dot: '#8b5cf6', title: 'No-Code Builder', desc: 'Build strategies without programming' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: f.dot, marginTop: 6, flexShrink: 0,
                  boxShadow: `0 0 10px ${f.dot}50`
                }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: '#475569' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form (3D card) */}
      <div style={{
        width: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px', position: 'relative',
        borderLeft: '1px solid rgba(255,255,255,0.05)'
      }}>
        <GlowOrb color="rgba(99,102,241,0.06)" size={300} top="30%" left="-20%" animate={false} />

        <Card3D intensity={6} glare={true} style={{ width: '100%', maxWidth: 400, padding: 32 }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Sign in</h2>
            <p style={{ fontSize: 14, color: '#475569' }}>Enter your credentials to continue</p>
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#f87171'
            }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15), 0 0 20px rgba(99,102,241,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Enter password" required
                  style={{ ...inputStyle, paddingRight: 44 }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15), 0 0 20px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2
                }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', cursor: 'pointer' }}>
                <input type="checkbox" style={{ accentColor: '#6366f1' }} /> Remember me
              </label>
              <a href="#" style={{ fontSize: 13, color: '#818cf8', textDecoration: 'none' }}>Forgot password?</a>
            </div>

            <button type="submit" disabled={isLoading} style={{
              width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 600, color: '#fff',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none',
              borderRadius: 10, cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 0 25px rgba(99,102,241,0.4), 0 4px 12px rgba(59,130,246,0.25)',
              transition: 'all .25s'
            }}
              onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(99,102,241,0.5), 0 8px 20px rgba(59,130,246,0.3)'; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 25px rgba(99,102,241,0.4), 0 4px 12px rgba(59,130,246,0.25)'; }}
            >
              {isLoading ? <Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> : null}
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 12, color: '#334155' }}>or try demo</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['beginner', 'pro'] as const).map(t => (
              <button key={t} onClick={() => demo(t)} disabled={isLoading} style={{
                padding: '10px 0', fontSize: 13, fontWeight: 500, color: '#94a3b8',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all .2s'
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; e.currentTarget.style.color = '#c7d2fe'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
              >{t === 'beginner' ? 'Beginner' : 'Pro'} Demo</button>
            ))}
          </div>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#475569' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>Sign up free</Link>
          </p>
        </Card3D>
      </div>
    </div>
  );
};

export default LoginPage;