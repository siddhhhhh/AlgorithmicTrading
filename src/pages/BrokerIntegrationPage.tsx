import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
    Link2, ExternalLink, CheckCircle, XCircle, Clock, Wifi,
    Shield, Zap, BarChart3, Briefcase, X, Eye, EyeOff,
    AlertTriangle, Star, ArrowRight, Settings, Search
} from 'lucide-react';
import {
    CircuitBoard, RadarSweep, ShieldGuard, DataStream3D,
    MorphingBlob3D, GradientText
} from '../components/ui/AceternityEffects';

const API = 'http://localhost:5001';

/* ── Types ──────────────────────────────────────────────── */
interface Broker {
    id: string; name: string; subtitle: string; description: string;
    logo: string; color: string; apiType: string[]; features: string[];
    docsUrl: string; pricing: string; status: string;
    connected?: boolean; connectionStatus?: string; connectedAt?: string;
}
interface ConnectForm { apiKey: string; apiSecret: string; clientId: string; showSecret: boolean; }

/* ── Palette ────────────────────────────────────────────── */
const P = {
    emerald: '#059669', blue: '#2563eb', amber: '#d97706', rose: '#e11d48',
    bg1: '#f8fafc', bg2: '#f1f5f9', bg3: '#e2e8f0', card: '#ffffff',
    border: '#e2e8f0', text: '#0f172a', muted: '#64748b', dim: '#94a3b8',
};

/* ═══════════════════════════ COMPONENT ═══════════════════ */
const BrokerIntegrationPage: React.FC = () => {
    const [brokers, setBrokers] = useState<Broker[]>([]);
    const [connectModal, setConnectModal] = useState<Broker | null>(null);
    const [form, setForm] = useState<ConnectForm>({ apiKey: '', apiSecret: '', clientId: '', showSecret: false });
    const [connecting, setConnecting] = useState(false);
    const [disconnecting, setDisconnecting] = useState<string | null>(null);
    const [searchFilter, setSearchFilter] = useState('');

    // Fetch brokers
    const fetchBrokers = () => {
        fetch(`${API}/api/brokers`)
            .then(r => r.json()).then(setBrokers)
            .catch(() => setBrokers(FALLBACK_BROKERS));
    };
    useEffect(fetchBrokers, []);

    const activeBrokers = brokers.filter(b => b.status === 'active');
    const comingSoon = brokers.filter(b => b.status === 'coming_soon');
    const connectedCount = brokers.filter(b => b.connected).length;
    const filtered = (list: Broker[]) =>
        searchFilter ? list.filter(b => b.name.toLowerCase().includes(searchFilter.toLowerCase())) : list;

    /* ── Actions ─────────────────────────────────────────── */
    const connect = async () => {
        if (!connectModal || !form.apiKey.trim() || connecting) return;
        setConnecting(true);
        try {
            const res = await fetch(`${API}/api/brokers/connect`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brokerId: connectModal.id, apiKey: form.apiKey, apiSecret: form.apiSecret, clientId: form.clientId }),
            });
            const data = await res.json();
            if (data.success) { setConnectModal(null); setForm({ apiKey: '', apiSecret: '', clientId: '', showSecret: false }); fetchBrokers(); }
        } catch { /* silently fail */ }
        setConnecting(false);
    };

    const disconnect = async (brokerId: string) => {
        setDisconnecting(brokerId);
        try {
            await fetch(`${API}/api/brokers/disconnect`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ brokerId }),
            });
            fetchBrokers();
        } catch { /* silently fail */ }
        setDisconnecting(null);
    };

    return (
        <DashboardLayout>
            <style>{`
        @keyframes brkFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes brkSlideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes brkPulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes brkSpin{to{transform:rotate(360deg)}}
        @keyframes brkGlow{0%,100%{box-shadow:0 0 0 0 ${P.emerald}15}50%{box-shadow:0 0 12px 2px ${P.emerald}10}}
        @keyframes brkModalIn{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .brk-page{background:${P.bg1};min-height:100vh;color:${P.text}}
        .brk-card{background:${P.card};border:1px solid ${P.border};border-radius:16px;transition:all 0.3s;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
        .brk-card:hover{border-color:${P.dim};transform:translateY(-2px);box-shadow:0 8px 25px rgba(0,0,0,0.08)}
        .brk-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:all 0.25s;font-family:inherit}
        .brk-btn:hover{transform:translateY(-1px)}
        .brk-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
        .brk-btn-primary{background:linear-gradient(135deg,${P.emerald},${P.blue});color:#fff;box-shadow:0 4px 15px ${P.emerald}20}
        .brk-btn-primary:hover{box-shadow:0 6px 20px ${P.emerald}25}
        .brk-btn-danger{background:${P.rose}10;color:${P.rose};border:1px solid ${P.rose}25}
        .brk-btn-danger:hover{background:${P.rose}18}
        .brk-btn-ghost{background:transparent;color:${P.text};border:1px solid ${P.border}}
        .brk-btn-ghost:hover{border-color:${P.emerald};color:${P.emerald}}
        .brk-input{background:${P.bg1};border:1px solid ${P.border};border-radius:10px;color:${P.text};padding:11px 14px;font-size:13px;width:100%;font-family:inherit;outline:none;transition:border-color 0.2s}
        .brk-input:focus{border-color:${P.emerald}}
        .brk-input::placeholder{color:${P.muted}}
        .brk-tag{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:16px;font-size:10px;font-weight:600}
        .brk-scroll::-webkit-scrollbar{width:4px}
        .brk-scroll::-webkit-scrollbar-thumb{background:${P.border};border-radius:4px}
        .brk-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.3);backdrop-filter:blur(6px);z-index:100;display:flex;align-items:center;justify-content:center}
        .brk-modal{background:${P.card};border:1px solid ${P.border};border-radius:20px;width:480px;max-height:90vh;overflow-y:auto;animation:brkModalIn 0.3s ease;box-shadow:0 20px 60px rgba(0,0,0,0.12)}
      `}</style>

            <div className="brk-page">
                <div style={{ maxWidth: 1400, padding: '0 28px 28px', margin: '0 auto' }}>

                    {/* ═══════ HERO ═══════ */}
                    <DataStream3D color={P.emerald} columns={12} speed={3} style={{
                        borderRadius: 20, padding: '26px 32px', marginBottom: 20,
                        background: `linear-gradient(135deg, #ecfdf5 0%, #e0e7ff 50%, #dbeafe 100%)`,
                        border: `1px solid ${P.border}`,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                    <ShieldGuard color={P.emerald} size={46}>
                                        <Link2 size={18} color={P.emerald} />
                                    </ShieldGuard>
                                    <div>
                                        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
                                            <GradientText from={P.emerald} via={P.blue} to={P.amber} animate>
                                                Broker Integration
                                            </GradientText>
                                        </h1>
                                        <p style={{ fontSize: 12, color: P.muted, margin: 0 }}>
                                            Connect your stockbroker account to deploy strategies & sync portfolio
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <RadarSweep size={60} color={P.emerald} blips={3} />
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: P.emerald }}>{connectedCount}</div>
                                    <div style={{ fontSize: 10, color: P.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Connected</div>
                                </div>
                                <div style={{ width: 1, height: 36, background: P.border, margin: '0 4px' }} />
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: P.blue }}>{activeBrokers.length}</div>
                                    <div style={{ fontSize: 10, color: P.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Available</div>
                                </div>
                            </div>
                        </div>
                    </DataStream3D>

                    {/* ═══════ SEARCH BAR ═══════ */}
                    <div style={{ marginBottom: 16, animation: 'brkFadeUp 0.5s ease 0.1s both' }}>
                        <div style={{ position: 'relative', maxWidth: 360 }}>
                            <Search size={14} color={P.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                            <input className="brk-input" placeholder="Search brokers..."
                                value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
                                style={{ paddingLeft: 36 }} />
                        </div>
                    </div>

                    {/* ═══════ FEATURES ROW ═══════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                        {[
                            { icon: <Zap size={16} />, label: 'Live Orders', desc: 'Place orders directly from AlgoForge', c: P.emerald },
                            { icon: <Briefcase size={16} />, label: 'Portfolio Sync', desc: 'Auto-sync holdings & positions', c: P.blue },
                            { icon: <Shield size={16} />, label: 'Paper Trading', desc: 'Simulate without real money', c: P.amber },
                            { icon: <BarChart3 size={16} />, label: 'Strategy Deploy', desc: 'Deploy AI strategies to live market', c: P.rose },
                        ].map((f, i) => (
                            <MorphingBlob3D key={i} color1={f.c} color2={P.bg1} size={120}>
                                <div className="brk-card" style={{
                                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
                                    animation: `brkFadeUp 0.5s ease ${0.1 + i * 0.06}s both`, cursor: 'default',
                                }}>
                                    <div style={{
                                        width: 34, height: 34, borderRadius: 10,
                                        background: `${f.c}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: f.c, flexShrink: 0,
                                    }}>{f.icon}</div>
                                    <div>
                                        <div style={{ fontSize: 12, fontWeight: 700 }}>{f.label}</div>
                                        <div style={{ fontSize: 10, color: P.muted }}>{f.desc}</div>
                                    </div>
                                </div>
                            </MorphingBlob3D>
                        ))}
                    </div>

                    {/* ═══════ ACTIVE BROKERS ═══════ */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Wifi size={12} color={P.emerald} /> Available Brokers
                        </div>
                        <CircuitBoard color={P.emerald} style={{ borderRadius: 16, padding: 2 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                {filtered(activeBrokers).map((broker, i) => (
                                    <div key={broker.id} className="brk-card" style={{
                                        padding: '18px 20px', position: 'relative', overflow: 'hidden',
                                        animation: `brkFadeUp 0.5s ease ${0.1 + i * 0.06}s both`,
                                    }}>
                                        {/* Connected indicator */}
                                        {broker.connected && (
                                            <div style={{
                                                position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4,
                                                padding: '3px 8px', borderRadius: 20, background: `${P.emerald}15`, border: `1px solid ${P.emerald}30`,
                                                animation: 'brkGlow 3s ease infinite',
                                            }}>
                                                <div style={{ width: 5, height: 5, borderRadius: '50%', background: P.emerald }} />
                                                <span style={{ fontSize: 9, fontWeight: 700, color: P.emerald, textTransform: 'uppercase' }}>Connected</span>
                                            </div>
                                        )}

                                        {/* Logo + Name */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                            <div style={{
                                                width: 42, height: 42, borderRadius: 12, fontSize: 20,
                                                background: `${broker.color}15`, border: `1px solid ${broker.color}25`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>{broker.logo}</div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 800 }}>{broker.name}</div>
                                                <div style={{ fontSize: 10, color: P.muted }}>{broker.subtitle}</div>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div style={{ fontSize: 11, color: P.muted, lineHeight: 1.6, marginBottom: 10, minHeight: 36 }}>
                                            {broker.description}
                                        </div>

                                        {/* API type tags */}
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                                            {broker.apiType.map(t => (
                                                <span key={t} className="brk-tag" style={{ background: `${P.blue}12`, color: P.blue }}>{t}</span>
                                            ))}
                                        </div>

                                        {/* Features */}
                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                                            {broker.features.map(f => (
                                                <span key={f} className="brk-tag" style={{ background: `${P.emerald}10`, color: P.emerald }}>
                                                    <CheckCircle size={8} /> {f}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Pricing + Docs */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Star size={10} color={P.amber} fill={P.amber} />
                                                <span style={{ fontSize: 11, fontWeight: 700, color: broker.pricing === 'Free' ? P.emerald : P.amber }}>
                                                    {broker.pricing}
                                                </span>
                                            </div>
                                            {broker.docsUrl && (
                                                <a href={broker.docsUrl} target="_blank" rel="noopener noreferrer"
                                                    style={{ fontSize: 10, color: P.blue, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                                                    <ExternalLink size={10} /> API Docs
                                                </a>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            {broker.connected ? (
                                                <>
                                                    <button className="brk-btn brk-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                                                        <Settings size={12} /> Manage
                                                    </button>
                                                    <button className="brk-btn brk-btn-danger"
                                                        disabled={disconnecting === broker.id}
                                                        onClick={() => disconnect(broker.id)}
                                                        style={{ fontSize: 11 }}>
                                                        {disconnecting === broker.id
                                                            ? <span style={{ animation: 'brkSpin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                                                            : <XCircle size={12} />
                                                        }
                                                        Disconnect
                                                    </button>
                                                </>
                                            ) : (
                                                <button className="brk-btn brk-btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                                                    onClick={() => { setConnectModal(broker); setForm({ apiKey: '', apiSecret: '', clientId: '', showSecret: false }); }}>
                                                    <Link2 size={13} /> Connect
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CircuitBoard>
                    </div>

                    {/* ═══════ COMING SOON ═══════ */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Clock size={12} color={P.amber} /> Coming Soon
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                            {filtered(comingSoon).map((broker, i) => (
                                <div key={broker.id} className="brk-card" style={{
                                    padding: '18px 20px', opacity: 0.65, position: 'relative',
                                    animation: `brkFadeUp 0.5s ease ${0.3 + i * 0.06}s both`,
                                }}>
                                    {/* Coming Soon badge */}
                                    <div style={{
                                        position: 'absolute', top: 12, right: 12,
                                        padding: '3px 8px', borderRadius: 20, background: `${P.amber}15`, border: `1px solid ${P.amber}30`,
                                    }}>
                                        <span style={{ fontSize: 9, fontWeight: 700, color: P.amber, textTransform: 'uppercase' }}>Coming Soon</span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                        <div style={{
                                            width: 42, height: 42, borderRadius: 12, fontSize: 20,
                                            background: `${broker.color}15`, border: `1px solid ${broker.color}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>{broker.logo}</div>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 800 }}>{broker.name}</div>
                                            <div style={{ fontSize: 10, color: P.muted }}>{broker.subtitle}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: P.muted, lineHeight: 1.6, marginBottom: 10 }}>
                                        {broker.description}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                                        {broker.features.map(f => (
                                            <span key={f} className="brk-tag" style={{ background: `${P.dim}30`, color: P.muted }}>{f}</span>
                                        ))}
                                    </div>
                                    <button className="brk-btn brk-btn-ghost" style={{ width: '100%', justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }} disabled>
                                        <AlertTriangle size={12} /> Notify Me
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ═══════ SECURITY NOTE ═══════ */}
                    <MorphingBlob3D color1={P.blue} color2={P.emerald} size={300}>
                        <div className="brk-card" style={{
                            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                            animation: 'brkFadeUp 0.5s ease 0.5s both',
                        }}>
                            <ShieldGuard color={P.blue} size={44}>
                                <Shield size={16} color={P.blue} />
                            </ShieldGuard>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Your credentials are secure</div>
                                <div style={{ fontSize: 11, color: P.muted, lineHeight: 1.5 }}>
                                    API keys are stored locally and never transmitted to our servers. All broker communication happens directly between your machine and the broker's API.
                                </div>
                            </div>
                        </div>
                    </MorphingBlob3D>
                </div>
            </div>

            {/* ═══════ CONNECT MODAL ═══════ */}
            {connectModal && (
                <div className="brk-overlay" onClick={e => { if (e.target === e.currentTarget) setConnectModal(null); }}>
                    <div className="brk-modal">
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${P.border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: 10, fontSize: 18,
                                        background: `${connectModal.color}15`, border: `1px solid ${connectModal.color}25`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>{connectModal.logo}</div>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 800 }}>Connect {connectModal.name}</div>
                                        <div style={{ fontSize: 11, color: P.muted }}>{connectModal.subtitle}</div>
                                    </div>
                                </div>
                                <button onClick={() => setConnectModal(null)} style={{
                                    background: 'none', border: 'none', cursor: 'pointer', color: P.muted,
                                    padding: 6, borderRadius: 8, transition: 'color 0.2s',
                                }}><X size={18} /></button>
                            </div>
                        </div>

                        <div style={{ padding: '20px 24px' }}>
                            {/* Steps info */}
                            <div style={{
                                padding: '12px 14px', borderRadius: 12, marginBottom: 16,
                                background: `${P.blue}08`, border: `1px solid ${P.blue}15`,
                            }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: P.blue, marginBottom: 6 }}>How to get API credentials:</div>
                                {[
                                    `Visit ${connectModal.name}'s developer portal`,
                                    'Create a new app / register for API access',
                                    'Copy your API Key and API Secret here',
                                ].map((s, i) => (
                                    <div key={i} style={{ fontSize: 11, color: P.muted, display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0' }}>
                                        <span style={{ width: 16, height: 16, borderRadius: '50%', background: `${P.blue}15`, color: P.blue, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                                        {s}
                                    </div>
                                ))}
                                {connectModal.docsUrl && (
                                    <a href={connectModal.docsUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: 11, color: P.blue, display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, textDecoration: 'none' }}>
                                        <ExternalLink size={10} /> Open Developer Portal <ArrowRight size={10} />
                                    </a>
                                )}
                            </div>

                            {/* Form fields */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, marginBottom: 4, display: 'block' }}>API Key *</label>
                                    <input className="brk-input" placeholder="Enter your API key"
                                        value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, marginBottom: 4, display: 'block' }}>API Secret</label>
                                    <div style={{ position: 'relative' }}>
                                        <input className="brk-input" type={form.showSecret ? 'text' : 'password'}
                                            placeholder="Enter your API secret"
                                            value={form.apiSecret} onChange={e => setForm(f => ({ ...f, apiSecret: e.target.value }))}
                                            style={{ paddingRight: 40 }} />
                                        <button onClick={() => setForm(f => ({ ...f, showSecret: !f.showSecret }))}
                                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: P.muted, padding: 4 }}>
                                            {form.showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: P.muted, marginBottom: 4, display: 'block' }}>
                                        Client ID {connectModal.id === 'angelone' && <span style={{ color: P.amber }}>(Required for SmartAPI)</span>}
                                    </label>
                                    <input className="brk-input" placeholder="Enter your client ID"
                                        value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} />
                                </div>
                            </div>

                            {/* Security note */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '8px 12px',
                                borderRadius: 10, background: `${P.emerald}08`, border: `1px solid ${P.emerald}15`,
                            }}>
                                <Shield size={12} color={P.emerald} />
                                <span style={{ fontSize: 10, color: P.muted }}>Credentials stored locally only — never sent to our servers.</span>
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                                <button className="brk-btn brk-btn-ghost" onClick={() => setConnectModal(null)} style={{ flex: 1, justifyContent: 'center' }}>
                                    Cancel
                                </button>
                                <button className="brk-btn brk-btn-primary" onClick={connect}
                                    disabled={!form.apiKey.trim() || connecting}
                                    style={{ flex: 1, justifyContent: 'center' }}>
                                    {connecting ? <span style={{ animation: 'brkSpin 1s linear infinite', display: 'inline-block' }}>⟳</span> : <Link2 size={13} />}
                                    {connecting ? 'Connecting...' : 'Connect Broker'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

/* ── Fallback broker data (in case API is unreachable) ───── */
const FALLBACK_BROKERS: Broker[] = [
    { id: 'zerodha', name: 'Zerodha', subtitle: 'Kite Connect API', description: "India's largest discount broker with excellent API docs.", logo: '🟢', color: '#387ed1', apiType: ['REST', 'WebSocket', 'OAuth2'], features: ['Live Orders', 'Portfolio Sync', 'Market Data', 'GTT Orders'], docsUrl: 'https://kite.trade/docs/connect/v3/', pricing: '₹2,000/month', status: 'active' },
    { id: 'upstox', name: 'Upstox', subtitle: 'Upstox Developer API v2', description: 'Free API access for algo trading beginners.', logo: '🟣', color: '#7b2dff', apiType: ['REST', 'WebSocket', 'OAuth2'], features: ['Live Orders', 'Portfolio Sync', 'Market Data', 'Historical Data'], docsUrl: 'https://upstox.com/developer/api-documentation/', pricing: 'Free', status: 'active' },
    { id: 'angelone', name: 'Angel One', subtitle: 'SmartAPI', description: 'Free SmartAPI with TOTP authentication.', logo: '🔶', color: '#ff6b00', apiType: ['REST', 'WebSocket', 'API Key + TOTP'], features: ['Live Orders', 'Portfolio Sync', 'Market Data', 'Basket Orders'], docsUrl: 'https://smartapi.angelone.in/docs', pricing: 'Free', status: 'active' },
    { id: 'fivepaisa', name: '5paisa', subtitle: '5paisa Connect API', description: 'Budget broker with free API access.', logo: '🔵', color: '#00bcd4', apiType: ['REST', 'OAuth2'], features: ['Live Orders', 'Portfolio Sync', 'Margin Data'], docsUrl: 'https://www.5paisa.com/developerapi', pricing: 'Free', status: 'active' },
    { id: 'fyers', name: 'Fyers', subtitle: 'Fyers API v3', description: 'Developer-friendly API with WebSocket support.', logo: '🟡', color: '#2dc44d', apiType: ['REST', 'WebSocket', 'OAuth2'], features: ['Live Orders', 'Portfolio Sync', 'Market Data', 'Options Chain'], docsUrl: 'https://myapi.fyers.in/docsv3', pricing: 'Free', status: 'active' },
    { id: 'aliceblue', name: 'Alice Blue', subtitle: 'Ant API', description: 'Feature-rich API with basket orders.', logo: '🔷', color: '#004aad', apiType: ['REST', 'API Key'], features: ['Live Orders', 'Portfolio Sync', 'Basket Orders'], docsUrl: 'https://v2api.aliceblueonline.com/introduction', pricing: 'Free', status: 'active' },
    { id: 'motilal', name: 'Motilal Oswal', subtitle: 'MO Developer API', description: 'Full-service broker. API coming soon for retail.', logo: '🟠', color: '#e85d04', apiType: ['REST'], features: ['Research Reports', 'Advisory'], docsUrl: '', pricing: 'TBD', status: 'coming_soon' },
    { id: 'icici', name: 'ICICI Direct', subtitle: 'Breeze API', description: 'Breeze API with limited but expanding capabilities.', logo: '🏦', color: '#f58220', apiType: ['REST'], features: ['Portfolio View', 'Research'], docsUrl: 'https://api.icicidirect.com', pricing: 'TBD', status: 'coming_soon' },
    { id: 'groww', name: 'Groww', subtitle: 'Consumer Platform', description: 'No public API available yet.', logo: '💚', color: '#5eb963', apiType: [], features: ['Mutual Funds', 'Stocks'], docsUrl: '', pricing: 'N/A', status: 'coming_soon' },
];

export default BrokerIntegrationPage;
