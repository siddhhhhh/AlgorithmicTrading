import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, TrendingUp, AlertCircle, CheckCircle, Loader2, GraduationCap, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Card3D, GridBackground, GlowOrb, FloatingParticles, GradientText } from '../components/ui/AceternityEffects';

const RegisterPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'beginner' | 'pro'>('beginner');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = (p: string) => { let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return s; };
  const getStrengthColor = (s: number) => s < 2 ? '#ef4444' : s < 3 ? '#f59e0b' : '#059669';
  const getStrengthText = (s: number) => s < 2 ? 'Weak' : s < 3 ? 'Fair' : 'Strong';

  const handleNext = () => {
    if (step === 1) setStep(2);
    else if (step === 2) {
      if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
      if (passwordStrength(formData.password) < 2) { setError('Please choose a stronger password'); return; }
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try { await register({ name: formData.name, email: formData.email, password: formData.password, userType, phone: formData.phone }); navigate('/dashboard'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Registration failed'); }
    finally { setIsLoading(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', fontSize: 14, fontFamily: 'Inter, sans-serif',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', outline: 'none', transition: 'all .25s'
  };
  const focusIn = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15), 0 0 20px rgba(99,102,241,0.1)'; };
  const focusOut = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif", background: '#030712' }}>
      {/* Left branding */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 56px', position: 'relative', overflow: 'hidden' }}>
        <GridBackground color="rgba(99,102,241,0.03)" fade />
        <FloatingParticles count={25} color="rgba(139,92,246,0.3)" />
        <GlowOrb color="rgba(59,130,246,0.1)" size={400} top="10%" left="20%" />
        <GlowOrb color="rgba(139,92,246,0.08)" size={300} bottom="20%" right="10%" />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}>
              <TrendingUp size={20} color="#fff" />
            </div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: -0.5 }}>AlgoForge</span>
          </Link>

          <h1 className="animate-in" style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: -1, marginBottom: 16 }}>
            Join the future of<br /><GradientText from="#60a5fa" via="#a78bfa" to="#f472b6">smart trading</GradientText>
          </h1>
          <p className="animate-in delay-1" style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, marginBottom: 48 }}>
            Build strategies, run backtests, and trade smarter — all without writing a single line of code.
          </p>

          <div className="animate-in delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { dot: '#059669', title: '100 Free Backtest Credits', desc: 'Start testing strategies immediately' },
              { dot: '#3b82f6', title: '7-Day Premium Trial', desc: 'Access all advanced features' },
              { dot: '#8b5cf6', title: 'Community Access', desc: 'Join 10,000+ Indian traders' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.dot, marginTop: 6, flexShrink: 0, boxShadow: `0 0 10px ${f.dot}50` }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: '#475569' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ width: 520, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px', position: 'relative', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
        <GlowOrb color="rgba(99,102,241,0.06)" size={300} top="30%" left="-20%" animate={false} />

        <Card3D intensity={5} glare={true} style={{ width: '100%', maxWidth: 420, padding: 32 }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600,
                  background: step >= s ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : 'rgba(255,255,255,0.05)',
                  color: step >= s ? '#fff' : '#475569', border: `1px solid ${step >= s ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: step >= s ? '0 0 12px rgba(99,102,241,0.3)' : 'none', transition: 'all .3s'
                }}>{s}</div>
                {s < 3 && <div style={{ width: 48, height: 2, borderRadius: 1, background: step > s ? '#6366f1' : 'rgba(255,255,255,0.06)', transition: 'background .3s' }} />}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#f87171' }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Step 1: User Type */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Tell us about yourself</h2>
                <p style={{ fontSize: 14, color: '#475569' }}>Choose the path that fits your experience</p>
              </div>
              {[
                { key: 'beginner' as const, icon: GraduationCap, title: "I'm New to Trading", desc: 'Guided tutorials, templates, paper trading', color: '#059669' },
                { key: 'pro' as const, icon: BarChart3, title: "I'm Experienced", desc: 'Advanced analytics, custom strategies, risk tools', color: '#8b5cf6' },
              ].map(opt => {
                const Icon = opt.icon;
                return (
                  <div key={opt.key} onClick={() => setUserType(opt.key)} style={{
                    padding: '18px 16px', borderRadius: 12, marginBottom: 12, cursor: 'pointer',
                    background: userType === opt.key ? `${opt.color}10` : 'rgba(255,255,255,0.02)',
                    border: `2px solid ${userType === opt.key ? opt.color : 'rgba(255,255,255,0.06)'}`,
                    display: 'flex', alignItems: 'center', gap: 14, transition: 'all .25s',
                    boxShadow: userType === opt.key ? `0 0 20px ${opt.color}15` : 'none'
                  }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg, ${opt.color}30, ${opt.color}10)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={opt.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{opt.title}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{opt.desc}</div>
                    </div>
                  </div>
                );
              })}
              <button onClick={handleNext} style={{
                width: '100%', padding: '12px 0', fontSize: 15, fontWeight: 600, color: '#fff', border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: 10, cursor: 'pointer',
                marginTop: 16, boxShadow: '0 0 25px rgba(99,102,241,0.4)', transition: 'all .25s'
              }}>Continue</button>
            </div>
          )}

          {/* Step 2: Form */}
          {step === 2 && (
            <form onSubmit={e => { e.preventDefault(); handleNext(); }}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Create your account</h2>
                <p style={{ fontSize: 14, color: '#475569' }}>We need some basic info to get started</p>
              </div>
              {[
                { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your name', field: 'name' },
                { id: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', field: 'email' },
              ].map(f => (
                <div key={f.id} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={(formData as any)[f.field]} onChange={e => setFormData({ ...formData, [f.field]: e.target.value })}
                    placeholder={f.placeholder} required style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Mobile Number</label>
                <div style={{ display: 'flex' }}>
                  <div style={{ padding: '12px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px 0 0 10px', borderRight: 'none', color: '#64748b', fontSize: 14, display: 'flex', alignItems: 'center' }}>+91</div>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter your mobile" style={{ ...inputStyle, borderRadius: '0 10px 10px 0' }} onFocus={focusIn} onBlur={focusOut} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Create password" required
                    style={{ ...inputStyle, paddingRight: 44 }} onFocus={focusIn} onBlur={focusOut} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formData.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: '#64748b' }}>Password strength</span>
                      <span style={{ color: getStrengthColor(passwordStrength(formData.password)) }}>{getStrengthText(passwordStrength(formData.password))}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ height: 4, borderRadius: 2, background: getStrengthColor(passwordStrength(formData.password)), width: `${(passwordStrength(formData.password) / 4) * 100}%`, transition: 'all .3s' }} />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Confirm password" required
                    style={{ ...inputStyle, paddingRight: 44 }} onFocus={focusIn} onBlur={focusOut} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    {formData.password === formData.confirmPassword ? <CheckCircle size={14} color="#059669" /> : <AlertCircle size={14} color="#ef4444" />}
                    <span style={{ fontSize: 12, color: formData.password === formData.confirmPassword ? '#059669' : '#ef4444' }}>
                      {formData.password === formData.confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 500, color: '#94a3b8', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, cursor: 'pointer' }}>Back</button>
                <button type="submit" style={{ flex: 1, padding: '12px 0', fontSize: 15, fontWeight: 600, color: '#fff', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: 10, cursor: 'pointer', boxShadow: '0 0 25px rgba(99,102,241,0.4)' }}>Continue</button>
              </div>
            </form>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>You're all set!</h2>
                <p style={{ fontSize: 14, color: '#475569' }}>Review and create your account</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                {[{ l: 'Name', v: formData.name }, { l: 'Email', v: formData.email }, { l: 'Phone', v: `+91 ${formData.phone}` }, { l: 'Type', v: userType }].map(r => (
                  <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: 13, color: '#64748b' }}>{r.l}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', textTransform: 'capitalize' }}>{r.v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#60a5fa', marginBottom: 8 }}>Welcome Benefits</div>
                {['100 free backtest credits', '7-day premium trial', 'Access to courses', 'Community access'].map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <CheckCircle size={13} color="#059669" />
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{b}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(2)} disabled={isLoading} style={{ flex: 1, padding: '12px 0', fontSize: 14, fontWeight: 500, color: '#94a3b8', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, cursor: isLoading ? 'not-allowed' : 'pointer' }}>Back</button>
                <button type="submit" disabled={isLoading} style={{ flex: 1, padding: '12px 0', fontSize: 15, fontWeight: 600, color: '#fff', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', borderRadius: 10, cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 0 25px rgba(99,102,241,0.4)' }}>
                  {isLoading && <Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} />}
                  {isLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          {step < 3 && (
            <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#475569' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 500 }}>Sign in here</Link>
            </p>
          )}
        </Card3D>
      </div>
    </div>
  );
};

export default RegisterPage;