import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useData } from '../contexts/DataContext';
import {
  Newspaper, RefreshCw, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Lightbulb, Globe, ExternalLink, Clock, Shield, Zap, ChevronRight, BarChart3
} from 'lucide-react';
import { HolographicCard, NeonPulse, HeatMap, SonarPing, WaveformLine } from '../components/ui/AceternityEffects';

const SECTOR_ICONS: Record<string, string> = {
  Banking: '🏦', IT: '💻', Metals: '⚙️', Energy: '⚡', Pharma: '💊',
  Auto: '🚗', FMCG: '🛒', 'Infra & Realty': '🏗️', Infrastructure: '🏗️', Realty: '🏠',
};

const SECTOR_COLORS: Record<string, string> = {
  Banking: '#3b82f6', IT: '#8b5cf6', Metals: '#64748b', Energy: '#f59e0b',
  Pharma: '#10b981', Auto: '#ec4899', FMCG: '#06b6d4', 'Infra & Realty': '#f97316',
  Infrastructure: '#f97316', Realty: '#d946ef',
};

const NewsInsightsPage: React.FC = () => {
  const { apiBase } = useData();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [selectedSector, setSelectedSector] = useState<string | null>(null);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/news/market-insights`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsights(); }, []);

  const fmtTime = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const analysis = data?.analysis || {};
  const news = data?.news || [];
  const sectors = analysis.sectors || [];
  const companies = analysis.companyMentions || [];
  const risks = analysis.keyRisks || [];
  const opportunities = analysis.keyOpportunities || [];
  const globalFactors = analysis.globalFactors || [];
  const sentimentScore = analysis.overallSentimentScore || 5;
  const sentiment = analysis.overallSentiment || 'neutral';

  const sentimentColor = sentiment === 'bullish' ? '#10b981' : sentiment === 'bearish' ? '#ef4444' : '#f59e0b';
  const SentimentIcon = sentiment === 'bullish' ? TrendingUp : sentiment === 'bearish' ? TrendingDown : Minus;

  const selectedSectorData = selectedSector ? sectors.find((s: any) => s.name === selectedSector) : null;

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
        @keyframes slideRight{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
        @keyframes pulseGlow{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
      `}</style>

      <div style={{ maxWidth: 1500, padding: '24px 28px', margin: '0 auto' }}>

        {/* ═══ HERO BANNER ═══ */}
        <HeatMap hotColor="rgba(16,185,129,0.2)" coldColor="rgba(6,182,212,0.04)" cellSize={50} style={{
          background: 'linear-gradient(135deg, #020617 0%, #0f172a 40%, #064e3b 70%, #065f46 100%)',
          borderRadius: 20, padding: '28px 32px', marginBottom: 16, color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Newspaper size={20} color="#34d399" />
                </div>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Market Intelligence</h1>
                  <p style={{ fontSize: 11, opacity: 0.5, margin: 0 }}>AI-Powered News Analysis · Sector-wise Insights · {fmtTime(now)}</p>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {data && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 10, background: `${sentimentColor}20`, border: `1px solid ${sentimentColor}40` }}>
                  <SentimentIcon size={14} color={sentimentColor} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: sentimentColor, textTransform: 'uppercase' }}>{sentiment}</span>
                </div>
              )}
              <button onClick={fetchInsights} disabled={loading} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '8px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
              }}>
                <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                {loading ? 'Analyzing…' : 'Refresh Analysis'}
              </button>
            </div>
          </div>
        </HeatMap>

        <WaveformLine color="#10b981" amplitude={10} frequency={5} speed={4} height={24}
          style={{ borderRadius: 8, marginBottom: 16, background: '#0f172a' }} />

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <SonarPing color="rgba(16,185,129,0.3)" speed={2} size={250} style={{ display: 'inline-block', width: 200, height: 200, borderRadius: '50%', marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <Newspaper size={32} color="#34d399" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0 }}>Analyzing News…</p>
              </div>
            </SonarPing>
            <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 12 }}>Fetching live news from Google News & running AI sector analysis</p>
          </div>
        )}

        {error && !loading && (
          <div style={{ padding: '20px 24px', borderRadius: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={16} /> {error}
            <button onClick={fetchInsights} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {data && !loading && (
          <div style={{ animation: 'fadeUp 0.5s ease both' }}>

            {/* ═══ OVERALL SENTIMENT + OUTLOOK ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginBottom: 20 }}>
              {/* Sentiment meter */}
              <NeonPulse color={sentimentColor} intensity={1.5} speed={3} style={{ borderRadius: 20 }}>
                <div style={{ background: '#fff', borderRadius: 20, padding: '24px 20px', textAlign: 'center', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Market Sentiment</div>
                  <div style={{
                    width: 100, height: 100, borderRadius: '50%', margin: '0 auto 12px',
                    background: `conic-gradient(${sentimentColor} ${sentimentScore * 10}%, #f1f5f9 0%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ fontSize: 28, fontWeight: 900, color: sentimentColor }}>{sentimentScore}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8' }}>/10</span>
                    </div>
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 16px', borderRadius: 10,
                    background: `${sentimentColor}15`, fontSize: 13, fontWeight: 800, color: sentimentColor, textTransform: 'uppercase',
                  }}>
                    <SentimentIcon size={14} /> {sentiment}
                  </div>
                  {analysis.confidence && (
                    <div style={{ marginTop: 12, fontSize: 10, color: '#94a3b8' }}>
                      AI Confidence: <strong style={{ color: '#1e293b' }}>{analysis.confidence}/10</strong>
                    </div>
                  )}
                </div>
              </NeonPulse>

              {/* Market outlook */}
              <div style={{ background: '#fff', borderRadius: 20, padding: '24px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={14} color="#0891b2" /> Market Outlook
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#475569', flex: 1 }}>
                  {analysis.marketOutlook || 'Analysis pending…'}
                </p>

                {/* Global factors */}
                {globalFactors.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>🌍 Global Factors</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {globalFactors.map((f: string, i: number) => (
                        <span key={i} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 8, background: '#f0f9ff', color: '#0891b2', fontWeight: 600 }}>{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ SECTOR CARDS ═══ */}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={16} color="#8b5cf6" /> Sector-wise Analysis
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              {sectors.map((sector: any, i: number) => {
                const sColor = SECTOR_COLORS[sector.name] || '#6366f1';
                const icon = SECTOR_ICONS[sector.name] || '📊';
                const sIcon = sector.sentiment === 'bullish' ? TrendingUp : sector.sentiment === 'bearish' ? TrendingDown : Minus;
                const SIcon = sIcon;
                const sSentColor = sector.sentiment === 'bullish' ? '#10b981' : sector.sentiment === 'bearish' ? '#ef4444' : '#f59e0b';
                const selected = selectedSector === sector.name;

                return (
                  <HolographicCard key={sector.name} intensity={0.12}
                    style={{
                      background: selected ? `${sColor}08` : '#fff', borderRadius: 16,
                      border: `2px solid ${selected ? sColor : '#f1f5f9'}`,
                      cursor: 'pointer', animation: `scaleIn 0.3s ease ${i * 0.05}s both`,
                      transition: 'all 0.25s',
                    }}>
                    <div onClick={() => setSelectedSector(selected ? null : sector.name)} style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 22 }}>{icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{sector.name}</span>
                        </div>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 8,
                          background: `${sSentColor}15`, fontSize: 10, fontWeight: 800, color: sSentColor, textTransform: 'uppercase',
                        }}>
                          <SIcon size={10} /> {sector.sentiment}
                        </div>
                      </div>

                      {/* Impact bar */}
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8', fontWeight: 700, marginBottom: 4 }}>
                          <span>Impact Score</span>
                          <span style={{ color: sColor, fontWeight: 800 }}>{sector.impactScore}/10</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden' }}>
                          <div style={{
                            width: `${sector.impactScore * 10}%`, height: '100%', borderRadius: 3,
                            background: `linear-gradient(90deg, ${sColor}80, ${sColor})`,
                            transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
                            boxShadow: `0 0 8px ${sColor}30`,
                          }} />
                        </div>
                      </div>

                      <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, margin: '8px 0 0 0' }}>
                        {sector.outlook}
                      </p>

                      {selected && <ChevronRight size={12} color={sColor} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
                    </div>
                  </HolographicCard>
                );
              })}
            </div>

            {/* ═══ SELECTED SECTOR DETAIL ═══ */}
            {selectedSectorData && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', marginBottom: 20, border: '1px solid #e2e8f0', animation: 'fadeUp 0.3s ease both' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>
                  {SECTOR_ICONS[selectedSectorData.name] || '📊'} {selectedSectorData.name} — Detailed Analysis
                </div>
                {selectedSectorData.drivers && selectedSectorData.drivers.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Key Drivers</div>
                    {selectedSectorData.drivers.map((d: string, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4, fontSize: 12, color: '#475569' }}>
                        <Zap size={10} color={SECTOR_COLORS[selectedSectorData.name] || '#6366f1'} style={{ marginTop: 3, flexShrink: 0 }} />
                        {d}
                      </div>
                    ))}
                  </div>
                )}
                {selectedSectorData.relatedHeadlines && selectedSectorData.relatedHeadlines.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Related Headlines</div>
                    {selectedSectorData.relatedHeadlines.map((h: string, i: number) => (
                      <div key={i} style={{ padding: '6px 10px', borderRadius: 8, background: '#f8fafc', marginBottom: 4, fontSize: 11, color: '#475569' }}>
                        📰 {h}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══ BOTTOM GRID: Companies + Risks + News ═══ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

              {/* Company Mentions */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #f1f5f9', animation: 'slideRight 0.4s ease 0.1s both' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Zap size={13} color="#f59e0b" /> Company Impact
                </div>
                {companies.length > 0 ? companies.slice(0, 8).map((c: any, i: number) => {
                  const impColor = c.impact === 'positive' ? '#10b981' : c.impact === 'negative' ? '#ef4444' : '#94a3b8';
                  const ImpIcon = c.impact === 'positive' ? TrendingUp : c.impact === 'negative' ? TrendingDown : Minus;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
                      marginBottom: 4, transition: 'all 0.2s', animation: `slideRight 0.3s ease ${i * 0.05}s both`,
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: `${impColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImpIcon size={12} color={impColor} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{c.name}</div>
                        <div style={{ fontSize: 9, color: '#94a3b8' }}>{c.ticker} · {c.sector}</div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: `${impColor}15`, color: impColor, textTransform: 'uppercase' }}>
                        {c.impact}
                      </span>
                    </div>
                  );
                }) : <p style={{ fontSize: 11, color: '#94a3b8' }}>No company mentions available</p>}
              </div>

              {/* Risks & Opportunities */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'slideRight 0.4s ease 0.2s both' }}>
                {/* Risks */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #f1f5f9', flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Shield size={13} /> Key Risks
                  </div>
                  {risks.map((r: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6, fontSize: 11, color: '#64748b' }}>
                      <AlertTriangle size={10} color="#ef4444" style={{ marginTop: 3, flexShrink: 0 }} /> {r}
                    </div>
                  ))}
                </div>
                {/* Opportunities */}
                <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: '1px solid #f1f5f9', flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Lightbulb size={13} /> Opportunities
                  </div>
                  {opportunities.map((o: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6, fontSize: 11, color: '#64748b' }}>
                      <TrendingUp size={10} color="#10b981" style={{ marginTop: 3, flexShrink: 0 }} /> {o}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live News Feed */}
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #f1f5f9', maxHeight: 500, overflow: 'auto', animation: 'slideRight 0.4s ease 0.3s both' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, position: 'sticky', top: 0, background: '#fff', paddingBottom: 8, zIndex: 2 }}>
                  <Newspaper size={13} color="#0891b2" /> Live News Feed
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{news.length} articles</span>
                </div>
                {news.slice(0, 25).map((n: any, i: number) => (
                  <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', padding: '8px 10px', borderRadius: 10, marginBottom: 4,
                    textDecoration: 'none', transition: 'all 0.2s', border: '1px solid transparent',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', marginBottom: 3, lineHeight: 1.4 }}>
                      {n.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9, color: '#94a3b8' }}>
                      {n.source && <span style={{ fontWeight: 700, color: '#64748b' }}>{n.source}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={8} /> {n.published?.split(',')[0]}</span>
                      <span style={{ padding: '1px 6px', borderRadius: 4, background: '#f0f9ff', color: '#0891b2', fontWeight: 700, fontSize: 8 }}>{n.category}</span>
                      <ExternalLink size={8} color="#94a3b8" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Footer */}
            {data?.fetchedAt && (
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 10, color: '#94a3b8' }}>
                Last analyzed: {new Date(data.fetchedAt).toLocaleString('en-IN')} · Powered by {data.model || 'Groq AI'} · Source: Google News RSS
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewsInsightsPage;
