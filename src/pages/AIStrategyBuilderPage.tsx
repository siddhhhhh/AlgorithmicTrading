import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import {
    Brain, Sparkles, Send, Zap, RefreshCw, BarChart3, Save,
    Lightbulb, ChevronRight, AlertTriangle, CheckCircle, Target,
    TrendingUp, Shield, Settings, ArrowRight, Copy, BookOpen, Cpu
} from 'lucide-react';
import {
    WarpTunnel, NeuralNetwork3D, Hologram3D, CrystalPrism,
    FloatingIsland3D, GradientText, SplitText
} from '../components/ui/AceternityEffects';

const API = 'http://localhost:5001';

/* ── Types ──────────────────────────────────────────────── */
interface Template {
    id: string; name: string; icon: string; color: string; prompt: string; category: string;
}
interface Indicator { name: string; params?: Record<string, unknown>; purpose?: string; }
interface Rule { condition: string; action: string; description: string; }
interface RiskMgmt {
    stopLoss?: { type: string; value: number };
    takeProfit?: { type: string; value: number };
    positionSize?: string;
    maxDrawdown?: string;
    trailingStop?: { enabled: boolean; value: number };
}
interface Strategy {
    strategyName: string; description: string; marketType: string; timeframe: string;
    instruments: string[]; indicators: Indicator[]; entryRules: Rule[]; exitRules: Rule[];
    riskManagement: RiskMgmt; parameters: Record<string, { value: unknown; min?: unknown; max?: unknown; description?: string }>;
    backtestConfig: { suggestedPeriod: string; suggestedCapital: number; suggestedSymbol: string };
    confidence: number; warnings: string[];
}
interface Explanation {
    summary: string; howItWorks: string; indicators: { name: string; explanation: string }[];
    entryLogic: string; exitLogic: string; bestConditions: string; risks: string[];
    difficulty: string;
}
interface ChatMsg {
    role: 'user' | 'ai'; content: string; strategy?: Strategy;
    explanation?: Explanation; timestamp: Date;
}

/* ── Color palette ─────────────────────────────────────── */
const C = {
    teal: '#059669', purple: '#7c3aed', pink: '#e11d48',
    bg1: '#f8fafc', bg2: '#f1f5f9', bg3: '#e2e8f0', card: '#ffffff',
    border: '#e2e8f0', text: '#0f172a', muted: '#64748b',
};

/* ═══════════════════════════ COMPONENT ═══════════════════ */
const AIStrategyBuilderPage: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [prompt, setPrompt] = useState('');
    const [chat, setChat] = useState<ChatMsg[]>([]);
    const [loading, setLoading] = useState(false);
    const [explaining, setExplaining] = useState(false);
    const [optimizing, setOptimizing] = useState(false);
    const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null);
    const [explanation, setExplanation] = useState<Explanation | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Fetch templates
    useEffect(() => {
        fetch(`${API}/api/ai-strategy/templates`)
            .then(r => r.json()).then(setTemplates)
            .catch(() => setTemplates([
                { id: 'momentum', name: 'Momentum Breakout', icon: '🚀', color: '#6366f1', prompt: 'Create a momentum breakout strategy for Nifty 50 stocks using 20-day high breakout with volume confirmation.', category: 'Trend Following' },
                { id: 'mean-reversion', name: 'Mean Reversion', icon: '🔄', color: '#10b981', prompt: 'Design a mean reversion strategy for Bank Nifty using Bollinger Bands and RSI.', category: 'Mean Reversion' },
                { id: 'macd', name: 'MACD Crossover', icon: '📊', color: '#f59e0b', prompt: 'Build a MACD crossover strategy for large-cap Indian stocks.', category: 'Trend Following' },
                { id: 'scalp', name: 'Intraday Scalper', icon: '⚡', color: '#ec4899', prompt: 'Create an intraday scalping strategy for Nifty futures on 5-minute candles.', category: 'Scalping' },
                { id: 'swing', name: 'Swing Trading', icon: '🌊', color: '#8b5cf6', prompt: 'Design a swing trading strategy using SuperTrend + ADX.', category: 'Swing Trading' },
                { id: 'condor', name: 'Iron Condor', icon: '🦅', color: '#06b6d4', prompt: 'Create an options iron condor strategy for Bank Nifty.', category: 'Options' },
            ]));
    }, []);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

    /* ── API calls ───────────────────────────────────────── */
    const generateStrategy = async (text: string) => {
        if (!text.trim() || loading) return;
        const userMsg: ChatMsg = { role: 'user', content: text, timestamp: new Date() };
        setChat(prev => [...prev, userMsg]);
        setPrompt('');
        setLoading(true);
        setExplanation(null);
        try {
            const res = await fetch(`${API}/api/ai-strategy/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: text }),
            });
            const data = await res.json();
            if (data.success && data.strategy) {
                const s = data.strategy as Strategy;
                setActiveStrategy(s);
                setChat(prev => [...prev, { role: 'ai', content: `Generated **${s.strategyName}** — ${s.description}`, strategy: s, timestamp: new Date() }]);
            } else {
                setChat(prev => [...prev, { role: 'ai', content: `⚠️ ${data.error || 'Failed to generate. Please try again.'}`, timestamp: new Date() }]);
            }
        } catch {
            setChat(prev => [...prev, { role: 'ai', content: '⚠️ Cannot reach AI backend. Make sure the Flask server is running on port 5001 and GROQ_API_KEY is set.', timestamp: new Date() }]);
        }
        setLoading(false);
    };

    const explainStrategy = async () => {
        if (!activeStrategy || explaining) return;
        setExplaining(true);
        try {
            const res = await fetch(`${API}/api/ai-strategy/explain`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy: activeStrategy }),
            });
            const data = await res.json();
            if (data.success) {
                setExplanation(data.explanation);
                setChat(prev => [...prev, { role: 'ai', content: '📚 Strategy explanation generated!', explanation: data.explanation, timestamp: new Date() }]);
            }
        } catch { /* silently fail */ }
        setExplaining(false);
    };

    const optimizeStrategy = async () => {
        if (!activeStrategy || optimizing) return;
        setOptimizing(true);
        try {
            const res = await fetch(`${API}/api/ai-strategy/optimize`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy: activeStrategy }),
            });
            const data = await res.json();
            if (data.success && data.optimization?.optimizedStrategy) {
                const s = data.optimization.optimizedStrategy as Strategy;
                setActiveStrategy(s);
                setChat(prev => [...prev, {
                    role: 'ai', content: `🚀 Strategy optimized! Score: ${data.optimization.improvementScore}/10 — ${data.optimization.rationale}`,
                    strategy: s, timestamp: new Date(),
                }]);
            }
        } catch { /* silently fail */ }
        setOptimizing(false);
    };

    const copyStrategy = () => {
        if (activeStrategy) navigator.clipboard.writeText(JSON.stringify(activeStrategy, null, 2));
    };

    /* ── Confidence bar helper ───────────────────────────── */
    const confColor = (c: number) => c >= 7 ? C.teal : c >= 4 ? '#f59e0b' : C.pink;

    return (
        <DashboardLayout>
            <style>{`
        @keyframes aiFadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes aiPulse{0%,100%{box-shadow:0 0 0 0 ${C.teal}30}50%{box-shadow:0 0 20px 4px ${C.teal}15}}
        @keyframes aiSpin{to{transform:rotate(360deg)}}
        @keyframes aiGlow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
        @keyframes aiSlideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
        .ai-page{background:${C.bg1};min-height:100vh;color:${C.text}}
        .ai-card{background:${C.card};border:1px solid ${C.border};border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06)}
        .ai-input{background:${C.bg1};border:1px solid ${C.border};border-radius:12px;color:${C.text};padding:14px 16px;font-size:14px;resize:none;width:100%;font-family:inherit;outline:none;transition:border-color 0.2s}
        .ai-input:focus{border-color:${C.teal}}
        .ai-input::placeholder{color:${C.muted}}
        .ai-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all 0.25s;font-family:inherit}
        .ai-btn:hover{transform:translateY(-1px)}
        .ai-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
        .ai-btn-primary{background:linear-gradient(135deg,${C.teal},${C.purple});color:#fff;box-shadow:0 4px 15px ${C.teal}25}
        .ai-btn-primary:hover{box-shadow:0 6px 20px ${C.teal}35}
        .ai-btn-secondary{background:${C.bg2};color:${C.text};border:1px solid ${C.border}}
        .ai-btn-secondary:hover{border-color:${C.teal};color:${C.teal}}
        .ai-tag{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600}
        .ai-scroll::-webkit-scrollbar{width:4px}
        .ai-scroll::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}
        .ai-scroll::-webkit-scrollbar-track{background:transparent}
      `}</style>

            <div className="ai-page">
                <div style={{ maxWidth: 1400, padding: '0 28px 28px', margin: '0 auto' }}>

                    {/* ═══════ HERO ═══════ */}
                    <WarpTunnel color={C.purple} speed={1.5} starCount={40} style={{
                        borderRadius: 20, padding: '28px 32px', marginBottom: 20,
                        background: `linear-gradient(135deg, #ede9fe 0%, #e0e7ff 50%, #dbeafe 100%)`,
                        border: `1px solid ${C.border}`,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12,
                                        background: `linear-gradient(135deg, ${C.teal}, ${C.purple})`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: `0 4px 12px ${C.teal}30`,
                                    }}>
                                        <Brain size={22} color="#fff" />
                                    </div>
                                    <div>
                                        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
                                            <GradientText from={C.teal} via={C.purple} to={C.pink} animate>
                                                AI Strategy Builder
                                            </GradientText>
                                        </h1>
                                        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>
                                            Describe your trading idea in plain English → get a complete strategy
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <NeuralNetwork3D width={200} height={80} nodes={8} color={C.teal} signalColor={C.purple} />
                        </div>
                    </WarpTunnel>

                    {/* ═══════ TEMPLATE CARDS ═══════ */}
                    <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Sparkles size={12} color={C.teal} /> Quick Templates
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
                            {templates.map((t, i) => (
                                <FloatingIsland3D key={t.id} floatHeight={6} bobSpeed={5 + i * 0.5}>
                                    <button
                                        onClick={() => { setPrompt(t.prompt); inputRef.current?.focus(); }}
                                        style={{
                                            width: '100%', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                                            background: C.card, borderRadius: 14, padding: '14px 12px',
                                            textAlign: 'center', transition: 'all 0.3s',
                                            outline: `1px solid ${C.border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                            animation: `aiFadeUp 0.5s ease ${i * 0.06}s both`,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.outline = `1px solid ${t.color}`; e.currentTarget.style.boxShadow = `0 4px 20px ${t.color}18`; }}
                                        onMouseLeave={e => { e.currentTarget.style.outline = `1px solid ${C.border}`; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                                    >
                                        <div style={{ fontSize: 22, marginBottom: 6 }}>{t.icon}</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 2 }}>{t.name}</div>
                                        <div style={{ fontSize: 9, color: C.muted }}>{t.category}</div>
                                    </button>
                                </FloatingIsland3D>
                            ))}
                        </div>
                    </div>

                    {/* ═══════ MAIN LAYOUT: Chat + Strategy Panel ═══════ */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

                        {/* ── LEFT: Chat Interface ── */}
                        <div className="ai-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 340px)', animation: 'aiFadeUp 0.6s ease 0.2s both' }}>
                            <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Cpu size={14} color={C.teal} />
                                <span style={{ fontSize: 13, fontWeight: 700 }}>AI Conversation</span>
                                <span style={{ fontSize: 10, color: C.muted, marginLeft: 'auto' }}>Powered by Groq LLM</span>
                            </div>

                            {/* Messages */}
                            <div className="ai-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                                {chat.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                        <Hologram3D color={C.teal} style={{ display: 'inline-block', marginBottom: 16 }}>
                                            <div style={{
                                                width: 70, height: 70, borderRadius: '50%',
                                                background: `linear-gradient(135deg, ${C.teal}20, ${C.purple}20)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Brain size={32} color={C.teal} />
                                            </div>
                                        </Hologram3D>
                                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                                            <SplitText text="Describe your trading strategy" stagger={0.02} />
                                        </div>
                                        <div style={{ fontSize: 12, color: C.muted, maxWidth: 320, margin: '0 auto' }}>
                                            Tell the AI what kind of strategy you want — it'll generate entry/exit rules, indicators, risk management, and more.
                                        </div>
                                    </div>
                                )}

                                {chat.map((msg, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        marginBottom: 12, animation: `aiSlideIn 0.3s ease ${i * 0.05}s both`,
                                    }}>
                                        <div style={{
                                            maxWidth: '85%', padding: '10px 14px', borderRadius: 14,
                                            background: msg.role === 'user'
                                                ? `linear-gradient(135deg, ${C.purple}10, ${C.teal}08)`
                                                : C.bg2,
                                            border: `1px solid ${msg.role === 'user' ? C.purple + '18' : C.border}`,
                                        }}>
                                            <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>{msg.content}</div>
                                            {msg.strategy && (
                                                <div style={{
                                                    marginTop: 8, padding: '8px 10px', borderRadius: 8,
                                                    background: `${C.teal}08`, border: `1px solid ${C.teal}20`,
                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                }}>
                                                    <CheckCircle size={12} color={C.teal} />
                                                    <span style={{ fontSize: 11, fontWeight: 600, color: C.teal }}>Strategy Generated</span>
                                                </div>
                                            )}
                                            <div style={{ fontSize: 9, color: C.muted, marginTop: 4 }}>
                                                {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div style={{ display: 'flex', gap: 8, padding: '10px 14px', animation: 'aiFadeUp 0.3s ease' }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${C.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Brain size={14} color={C.teal} style={{ animation: 'aiGlow 1.5s ease infinite' }} />
                                        </div>
                                        <div style={{ background: C.bg1, borderRadius: 14, padding: '10px 14px', border: `1px solid ${C.border}` }}>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                {[0, 1, 2].map(j => (
                                                    <div key={j} style={{
                                                        width: 6, height: 6, borderRadius: '50%', background: C.teal,
                                                        animation: `aiPulse 1.2s ease ${j * 0.15}s infinite`,
                                                    }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <div style={{ padding: 14, borderTop: `1px solid ${C.border}` }}>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                                    <textarea
                                        ref={inputRef}
                                        className="ai-input"
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateStrategy(prompt); } }}
                                        placeholder="Describe your trading strategy idea..."
                                        rows={2}
                                        style={{ flex: 1 }}
                                    />
                                    <button className="ai-btn ai-btn-primary" onClick={() => generateStrategy(prompt)} disabled={loading || !prompt.trim()}
                                        style={{ height: 52, minWidth: 52, justifyContent: 'center', padding: '0 14px' }}>
                                        {loading ? <RefreshCw size={16} style={{ animation: 'aiSpin 1s linear infinite' }} /> : <Send size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Strategy Display ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'aiFadeUp 0.6s ease 0.3s both' }}>
                            {!activeStrategy ? (
                                <CrystalPrism intensity={0.8} style={{ borderRadius: 16 }}>
                                    <div className="ai-card" style={{
                                        padding: '50px 30px', textAlign: 'center',
                                        background: `linear-gradient(135deg, ${C.card}, ${C.bg2})`,
                                    }}>
                                        <div style={{
                                            width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
                                            background: `linear-gradient(135deg, ${C.teal}15, ${C.purple}15)`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Target size={26} color={C.purple} />
                                        </div>
                                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>No Strategy Yet</div>
                                        <div style={{ fontSize: 12, color: C.muted }}>Describe your idea or pick a template to get started</div>
                                    </div>
                                </CrystalPrism>
                            ) : (
                                <>
                                    {/* Strategy Header */}
                                    <CrystalPrism intensity={0.6} style={{ borderRadius: 16 }}>
                                        <div className="ai-card" style={{ padding: '18px 20px', background: `linear-gradient(135deg, ${C.card}, ${C.bg2})` }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                                <div>
                                                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 2 }}>{activeStrategy.strategyName}</div>
                                                    <div style={{ fontSize: 11, color: C.muted }}>{activeStrategy.description}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <span className="ai-tag" style={{ background: `${C.teal}15`, color: C.teal }}>{activeStrategy.marketType}</span>
                                                    <span className="ai-tag" style={{ background: `${C.purple}15`, color: C.purple }}>{activeStrategy.timeframe}</span>
                                                </div>
                                            </div>

                                            {/* Confidence bar */}
                                            <div style={{ marginBottom: 12 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 600, color: C.muted }}>AI Confidence</span>
                                                    <span style={{ fontSize: 12, fontWeight: 800, color: confColor(activeStrategy.confidence) }}>{activeStrategy.confidence}/10</span>
                                                </div>
                                                <div style={{ height: 4, borderRadius: 2, background: C.bg3, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${activeStrategy.confidence * 10}%`, borderRadius: 2, background: `linear-gradient(90deg, ${confColor(activeStrategy.confidence)}, ${C.purple})`, transition: 'width 1s ease' }} />
                                                </div>
                                            </div>

                                            {/* Instruments */}
                                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                                                {activeStrategy.instruments.map(inst => (
                                                    <span key={inst} className="ai-tag" style={{ background: `${C.pink}12`, color: C.pink, fontSize: 10 }}>{inst}</span>
                                                ))}
                                            </div>

                                            {/* Action buttons */}
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                <button className="ai-btn ai-btn-secondary" onClick={explainStrategy} disabled={explaining} style={{ fontSize: 11 }}>
                                                    {explaining ? <RefreshCw size={12} style={{ animation: 'aiSpin 1s linear infinite' }} /> : <BookOpen size={12} />} Explain
                                                </button>
                                                <button className="ai-btn ai-btn-secondary" onClick={optimizeStrategy} disabled={optimizing} style={{ fontSize: 11 }}>
                                                    {optimizing ? <RefreshCw size={12} style={{ animation: 'aiSpin 1s linear infinite' }} /> : <Zap size={12} />} Optimize
                                                </button>
                                                <button className="ai-btn ai-btn-secondary" onClick={copyStrategy} style={{ fontSize: 11 }}>
                                                    <Copy size={12} /> Copy JSON
                                                </button>
                                                <button className="ai-btn ai-btn-secondary" style={{ fontSize: 11, marginLeft: 'auto' }}>
                                                    <Save size={12} /> Save
                                                </button>
                                            </div>
                                        </div>
                                    </CrystalPrism>

                                    {/* Strategy Details — scrollable */}
                                    <div className="ai-scroll" style={{ maxHeight: 'calc(100vh - 560px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>

                                        {/* Indicators */}
                                        <Hologram3D color={C.teal} style={{ borderRadius: 16 }}>
                                            <div className="ai-card" style={{ padding: '14px 16px', background: C.card }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Settings size={12} color={C.teal} /> Indicators
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {activeStrategy.indicators.map((ind, i) => (
                                                        <div key={i} style={{
                                                            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
                                                            background: C.bg2, border: `1px solid ${C.border}`,
                                                            animation: `aiSlideIn 0.3s ease ${i * 0.05}s both`,
                                                        }}>
                                                            <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.teal}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <BarChart3 size={12} color={C.teal} />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontSize: 12, fontWeight: 700 }}>{ind.name}</div>
                                                                <div style={{ fontSize: 10, color: C.muted }}>{ind.purpose || JSON.stringify(ind.params)}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </Hologram3D>

                                        {/* Entry Rules */}
                                        <div className="ai-card" style={{ padding: '14px 16px' }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <TrendingUp size={12} color={C.teal} /> Entry Rules
                                            </div>
                                            {activeStrategy.entryRules.map((rule, i) => (
                                                <div key={i} style={{
                                                    padding: '8px 10px', borderRadius: 10, marginBottom: 4,
                                                    background: `${C.teal}06`, border: `1px solid ${C.teal}15`,
                                                    animation: `aiSlideIn 0.3s ease ${i * 0.05}s both`,
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                        <ChevronRight size={10} color={C.teal} />
                                                        <span style={{ fontSize: 11, fontWeight: 700, color: C.teal }}>{rule.action}</span>
                                                    </div>
                                                    <div style={{ fontSize: 11, color: C.text, paddingLeft: 16 }}>{rule.description}</div>
                                                    <div style={{ fontSize: 10, color: C.muted, paddingLeft: 16, fontFamily: 'monospace' }}>{rule.condition}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Exit Rules */}
                                        <div className="ai-card" style={{ padding: '14px 16px' }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <ArrowRight size={12} color={C.pink} /> Exit Rules
                                            </div>
                                            {activeStrategy.exitRules.map((rule, i) => (
                                                <div key={i} style={{
                                                    padding: '8px 10px', borderRadius: 10, marginBottom: 4,
                                                    background: `${C.pink}06`, border: `1px solid ${C.pink}15`,
                                                    animation: `aiSlideIn 0.3s ease ${i * 0.05}s both`,
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                        <ChevronRight size={10} color={C.pink} />
                                                        <span style={{ fontSize: 11, fontWeight: 700, color: C.pink }}>{rule.action}</span>
                                                    </div>
                                                    <div style={{ fontSize: 11, color: C.text, paddingLeft: 16 }}>{rule.description}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Risk Management */}
                                        <div className="ai-card" style={{ padding: '14px 16px' }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Shield size={12} color="#f59e0b" /> Risk Management
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                {activeStrategy.riskManagement.stopLoss && (
                                                    <div style={{ padding: '8px 10px', borderRadius: 10, background: C.bg2, border: `1px solid ${C.border}` }}>
                                                        <div style={{ fontSize: 9, fontWeight: 600, color: C.muted, textTransform: 'uppercase' }}>Stop Loss</div>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: C.pink }}>{activeStrategy.riskManagement.stopLoss.value}{activeStrategy.riskManagement.stopLoss.type === 'percentage' ? '%' : ` ${activeStrategy.riskManagement.stopLoss.type}`}</div>
                                                    </div>
                                                )}
                                                {activeStrategy.riskManagement.takeProfit && (
                                                    <div style={{ padding: '8px 10px', borderRadius: 10, background: C.bg2, border: `1px solid ${C.border}` }}>
                                                        <div style={{ fontSize: 9, fontWeight: 600, color: C.muted, textTransform: 'uppercase' }}>Take Profit</div>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: C.teal }}>{activeStrategy.riskManagement.takeProfit.value}{activeStrategy.riskManagement.takeProfit.type === 'percentage' ? '%' : ` ${activeStrategy.riskManagement.takeProfit.type}`}</div>
                                                    </div>
                                                )}
                                                {activeStrategy.riskManagement.positionSize && (
                                                    <div style={{ padding: '8px 10px', borderRadius: 10, background: C.bg2, border: `1px solid ${C.border}` }}>
                                                        <div style={{ fontSize: 9, fontWeight: 600, color: C.muted, textTransform: 'uppercase' }}>Position Size</div>
                                                        <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{activeStrategy.riskManagement.positionSize}</div>
                                                    </div>
                                                )}
                                                {activeStrategy.riskManagement.trailingStop?.enabled && (
                                                    <div style={{ padding: '8px 10px', borderRadius: 10, background: C.bg2, border: `1px solid ${C.border}` }}>
                                                        <div style={{ fontSize: 9, fontWeight: 600, color: C.muted, textTransform: 'uppercase' }}>Trailing Stop</div>
                                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b' }}>{activeStrategy.riskManagement.trailingStop.value}%</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Warnings */}
                                        {activeStrategy.warnings?.length > 0 && (
                                            <div className="ai-card" style={{ padding: '14px 16px' }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b' }}>
                                                    <AlertTriangle size={12} /> Warnings
                                                </div>
                                                {activeStrategy.warnings.map((w, i) => (
                                                    <div key={i} style={{ fontSize: 11, color: C.muted, padding: '4px 0', display: 'flex', alignItems: 'start', gap: 6 }}>
                                                        <span style={{ color: '#f59e0b', flexShrink: 0 }}>•</span> {w}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Explanation (if fetched) */}
                                        {explanation && (
                                            <CrystalPrism intensity={0.5} style={{ borderRadius: 16 }}>
                                                <div className="ai-card" style={{ padding: '14px 16px', background: `linear-gradient(135deg, ${C.card}, ${C.bg2})` }}>
                                                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Lightbulb size={12} color="#f59e0b" /> AI Explanation
                                                        <span className="ai-tag" style={{ background: `${C.purple}15`, color: C.purple, marginLeft: 'auto' }}>{explanation.difficulty}</span>
                                                    </div>
                                                    <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, marginBottom: 10 }}>{explanation.summary}</div>
                                                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>{explanation.howItWorks}</div>
                                                    {explanation.risks?.length > 0 && (
                                                        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: `${C.pink}08`, border: `1px solid ${C.pink}15` }}>
                                                            <div style={{ fontSize: 10, fontWeight: 700, color: C.pink, marginBottom: 4 }}>⚠ Risks</div>
                                                            {explanation.risks.map((r, i) => (
                                                                <div key={i} style={{ fontSize: 10, color: C.muted, padding: '2px 0' }}>• {r}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </CrystalPrism>
                                        )}

                                        {/* Parameters */}
                                        {activeStrategy.parameters && Object.keys(activeStrategy.parameters).length > 0 && (
                                            <div className="ai-card" style={{ padding: '14px 16px' }}>
                                                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <Settings size={12} color={C.purple} /> Parameters
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                    {Object.entries(activeStrategy.parameters).map(([key, param]) => (
                                                        <div key={key} style={{ padding: '8px 10px', borderRadius: 10, background: C.bg2, border: `1px solid ${C.border}` }}>
                                                            <div style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', marginBottom: 2 }}>{key}</div>
                                                            <div style={{ fontSize: 13, fontWeight: 700, color: C.purple }}>{String(param.value)}</div>
                                                            {param.description && <div style={{ fontSize: 9, color: C.muted }}>{param.description}</div>}
                                                            {param.min !== undefined && <div style={{ fontSize: 9, color: C.muted }}>Range: {String(param.min)} — {String(param.max)}</div>}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AIStrategyBuilderPage;
