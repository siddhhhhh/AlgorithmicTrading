import React, { useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Play, CheckCircle, Star, Trophy, Target, BarChart3, Users, Clock, Flame, BookOpen, Award, Zap, ChevronRight, GraduationCap, Brain, Sparkles } from 'lucide-react';
import { MagneticHover, TypewriterCode, HexGrid, StaggerList, GradientBorder } from '../components/ui/AceternityEffects';

// ── Course Data ───────────────────────────────────────────────────────────
const courses = [
  { id: 1, title: 'Stock Market Fundamentals', instructor: 'Rajesh Kumar', duration: '4 hours', lessons: 20, rating: 4.8, reviews: 1234, difficulty: 1, description: 'Learn the fundamentals of stock market investing', youtubePlaylist: 'https://www.youtube.com/playlist?list=PLxNHpNhDaEFJsuzKNrMbr_SESDCCLmSu4', color: '#3b82f6', icon: BookOpen, tag: 'Beginner' },
  { id: 2, title: 'Technical Analysis for Everyone', instructor: 'Priya Sharma', duration: '6 hours', lessons: 25, rating: 4.9, reviews: 856, difficulty: 2, description: 'Master chart patterns, indicators and technical analysis', youtubePlaylist: 'https://www.youtube.com/playlist?list=PLxNHpNhDaEFKBbevR6wFc-4rMaFmd5tbc', color: '#8b5cf6', icon: BarChart3, tag: 'Intermediate' },
  { id: 3, title: 'Options & Derivatives Made Easy', instructor: 'Arjun Mehta', duration: '8 hours', lessons: 30, rating: 4.7, reviews: 642, difficulty: 3, description: 'Comprehensive guide to options trading strategies', youtubePlaylist: 'https://www.youtube.com/playlist?list=PLxNHpNhDaEFJBMvkFSGxFCUzbKNa6DbGu', color: '#ef4444', icon: Target, tag: 'Advanced' },
  { id: 4, title: 'Backtesting Without Coding', instructor: 'Sneha Patel', duration: '5 hours', lessons: 18, rating: 4.8, reviews: 423, difficulty: 2, description: 'Learn to test and optimize your strategy easily and visually', youtubePlaylist: 'https://www.youtube.com/playlist?list=PLxNHpNhDaEFKve2TjF8jUrQOKdj4tyl0U7', color: '#10b981', icon: Zap, tag: 'Intermediate' },
  { id: 5, title: 'Simple Risk Management', instructor: 'Amit Trivedi', duration: '3 hours', lessons: 12, rating: 4.6, reviews: 201, difficulty: 2, description: 'Essential tools to protect your capital and manage risks', youtubePlaylist: 'https://www.youtube.com/playlist?list=PLLy_2iUCG87CTB2vv9njHaJbmQoa9S5gK', color: '#f59e0b', icon: Award, tag: 'Intermediate' },
  { id: 6, title: 'Algo Trading in Python', instructor: 'Vikram Gupta', duration: '7 hours', lessons: 28, rating: 4.9, reviews: 505, difficulty: 3, description: 'See how algos work under the hood (for reference only)', youtubePlaylist: 'https://www.youtube.com/playlist?list=PLUTKklmYVO37Ik8K1Ftdp4ULk3dMBCKYp', color: '#6366f1', icon: Brain, tag: 'Advanced' },
];

const achievements = [
  { name: 'First Strategy Builder', icon: Target, earned: true, date: '2024-01-15', xp: 200 },
  { name: 'Technical Analysis Pro', icon: BarChart3, earned: true, date: '2024-01-10', xp: 350 },
  { name: 'Quiz Master', icon: Trophy, earned: true, date: '2024-01-05', xp: 500 },
  { name: 'Community Helper', icon: Users, earned: false, date: null, xp: 250 },
  { name: 'Options Expert', icon: Star, earned: false, date: null, xp: 400 },
  { name: 'Risk Management Pro', icon: Target, earned: false, date: null, xp: 300 },
];

const leaderboard = [
  { rank: 1, name: 'Priya_Trader', xp: 2850, courses: 5, avatar: 'PT', streak: 24 },
  { rank: 2, name: 'TechAnalyst', xp: 2640, courses: 4, avatar: 'TA', streak: 18 },
  { rank: 3, name: 'OptionsGuru', xp: 2420, courses: 4, avatar: 'OG', streak: 15 },
  { rank: 4, name: 'You', xp: 1250, courses: 2, avatar: 'Y', streak: 12 },
  { rank: 5, name: 'RiskMaster', xp: 1180, courses: 3, avatar: 'RM', streak: 8 },
];

const quizzes: Record<number, { title: string; questions: { question: string; options: string[]; answer: number }[] }> = {
  1: {
    title: 'Stock Market Fundamentals Quiz', questions: [
      { question: 'What is a stock?', options: ['A type of bond', 'An ownership share in a company', 'A money market instrument', 'A form of bank account'], answer: 1 },
      { question: 'Stock represents ____ in a company.', options: ['Debt', 'Ownership', 'A contract', 'A product'], answer: 1 },
      { question: 'Who regulates India\'s stock markets?', options: ['RBI', 'SEBI', 'NSE', 'Sensex'], answer: 1 },
      { question: 'What is the BSE?', options: ['Banking Stock Exchange', 'Bombay Stock Exchange', 'Bond Stock Exchange', 'British Stock Exchange'], answer: 1 },
      { question: 'Order to buy/sell at a specific price is called?', options: ['Stop Order', 'Limit Order', 'Market Order', 'Future Order'], answer: 1 },
      { question: 'The Sensex stands for:', options: ['Sensitive Index', 'Sensible Exchange', 'Sense Exchange', 'Senior Index'], answer: 0 },
      { question: 'Which one is NOT a stock exchange?', options: ['NYSE', 'NSE', 'BSE', 'IMF'], answer: 3 },
      { question: 'Dividends are paid to:', options: ['Bondholders', 'Shareholders', 'Employees', 'Bankers'], answer: 1 },
      { question: 'Highest price a buyer is willing to pay is:', options: ['Bid', 'Ask', 'Spread', 'Quote'], answer: 0 },
      { question: 'Mutual funds invest in:', options: ['Gold only', 'Single stocks only', 'Baskets of securities', 'Bank deposits'], answer: 2 },
      { question: 'Demat account holds:', options: ['Physical shares', 'Electronic shares', 'Gold', 'Cash'], answer: 1 },
      { question: 'Stock price mainly depends on:', options: ['Company age', 'Supply & demand', 'Book value', 'Marketing'], answer: 1 },
      { question: 'Short selling means:', options: ['Buying at low', 'Selling borrowed shares hoping to buy back lower', 'Keeping stocks for long term', 'First buying then selling'], answer: 1 },
      { question: 'Nifty 50 is:', options: ['Index of top 50 NSE stocks', '50 new IPOs', '50 mutual funds', '50 biggest US stocks'], answer: 0 },
      { question: 'The opening price is:', options: ['First traded price of the day', 'Best price in pre-market', 'Price at previous close', 'Highest price of the week'], answer: 0 },
    ]
  },
  2: { title: 'Technical Analysis Quiz', questions: [{ question: 'What does RSI measure?', options: ['Price Momentum', 'Trading Volume', 'Market Cap', 'Volatility'], answer: 0 }] },
  3: { title: 'Options & Derivatives Quiz', questions: [] },
  4: { title: 'Backtesting Quiz', questions: [] },
  5: { title: 'Risk Management Quiz', questions: [] },
  6: { title: 'Algo Trading Quiz', questions: [] },
};

const difficultyLabel = (d: number) => d === 1 ? 'Beginner' : d === 2 ? 'Intermediate' : 'Advanced';
const difficultyColor = (d: number) => d === 1 ? '#10b981' : d === 2 ? '#f59e0b' : '#ef4444';

const LearningHubPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'courses' | 'achievements' | 'leaderboard' | 'quiz'>('courses');
  const [selectedQuiz, setSelectedQuiz] = useState<number | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);

  React.useEffect(() => { setSelectedQuiz(null); setQuizStep(0); setQuizAnswers([]); }, [activeTab]);
  const handleStartQuiz = (id: number) => { setSelectedQuiz(id); setQuizStep(0); setQuizAnswers([]); };
  const handleAnswer = (idx: number) => { setQuizAnswers([...quizAnswers, idx]); setQuizStep(quizStep + 1); };

  const xp = user?.xp || 1250;
  const level = user?.level || 3;
  const maxXp = 3000;
  const pct = (xp / maxXp) * 100;

  const tabDef = [
    { id: 'courses' as const, label: 'Courses', icon: BookOpen, count: courses.length },
    { id: 'achievements' as const, label: 'Achievements', icon: Award, count: achievements.filter(a => a.earned).length },
    { id: 'leaderboard' as const, label: 'Leaderboard', icon: Trophy, count: 0 },
    { id: 'quiz' as const, label: 'Quiz', icon: Brain, count: 0 },
  ];

  return (
    <DashboardLayout>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseGlow{0%,100%{opacity:0.5}50%{opacity:1}}
        @keyframes floatSoft{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
      `}</style>

      <div style={{ maxWidth: 1400, padding: '24px 28px', margin: '0 auto' }}>

        {/* ═════════ HERO — HexGrid background ═════════ */}
        <HexGrid color="rgba(139,92,246,0.08)" style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #3730a3 60%, #4338ca 100%)',
          borderRadius: 20, padding: '28px 32px', marginBottom: 24, color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Learning Hub</h1>
                  <TypewriterCode text="Enhance your trading skills with curated courses" speed={25} delay={0.5}
                    style={{ fontSize: 12, opacity: 0.6, display: 'block', marginTop: 2 }} cursor={true} />
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { label: 'Level', value: level, icon: Sparkles, color: '#f59e0b' },
                  { label: 'Streak', value: '12d', icon: Flame, color: '#ef4444' },
                  { label: 'Credits', value: user?.credits || 150, icon: Zap, color: '#10b981' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(4px)', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* XP Ring */}
              <div style={{ position: 'relative', width: 68, height: 68 }}>
                <svg width={68} height={68} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={34} cy={34} r={28} stroke="rgba(255,255,255,0.1)" strokeWidth={5} fill="none" />
                  <circle cx={34} cy={34} r={28} stroke="#a78bfa" strokeWidth={5} fill="none"
                    strokeDasharray={`${2 * Math.PI * 28 * pct / 100} ${2 * Math.PI * 28}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1.5s cubic-bezier(0.4,0,0.2,1)', filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.4))' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1 }}>{Math.round(pct)}%</div>
                  <div style={{ fontSize: 7, opacity: 0.4, fontWeight: 600 }}>TO LVL {level + 1}</div>
                </div>
              </div>
            </div>
          </div>
        </HexGrid>

        {/* ═════════ TABS — MagneticHover on each tab ═════════ */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {tabDef.map(tab => {
            const active = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <MagneticHover key={tab.id} strength={active ? 0 : 0.15}>
                <button onClick={() => setActiveTab(tab.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: 'none', background: active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f8fafc',
                  color: active ? '#fff' : '#64748b', transition: 'all 0.3s',
                  boxShadow: active ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                  transform: active ? 'translateY(-1px)' : 'none',
                }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155' } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b' } }}>
                  <Icon size={14} />
                  {tab.label}
                  {tab.count > 0 && <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: active ? 'rgba(255,255,255,0.2)' : '#e2e8f0', color: active ? '#fff' : '#94a3b8' }}>{tab.count}</span>}
                </button>
              </MagneticHover>
            );
          })}
        </div>

        {/* ═════════ COURSES TAB ═════════ */}
        {activeTab === 'courses' && (
          <StaggerList stagger={0.08} direction="up" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {courses.map(course => {
              const Icon = course.icon;
              return (
                <GradientBorder key={course.id} colors={[course.color, `${course.color}88`, '#8b5cf6', course.color]} speed={5} borderWidth={2} borderRadius={18}>
                  <div style={{ padding: '22px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                        <MagneticHover strength={0.25}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${course.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={20} color={course.color} />
                          </div>
                        </MagneticHover>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{course.title}</h3>
                          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>{course.description}</p>
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: `${difficultyColor(course.difficulty)}10`, color: difficultyColor(course.difficulty), textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0 }}>
                        {course.tag}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}><Users size={11} /> {course.instructor}</span>
                      <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {course.duration}</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>{course.lessons} lessons</span>
                      <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Star size={11} fill="#f59e0b" /> {course.rating}
                        <span style={{ color: '#94a3b8', fontWeight: 400 }}>({course.reviews})</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Difficulty dots */}
                      <div style={{ display: 'flex', gap: 3 }}>
                        {[1, 2, 3].map(d => (
                          <div key={d} style={{ width: 6, height: 6, borderRadius: 3, background: d <= course.difficulty ? difficultyColor(course.difficulty) : '#e2e8f0' }} />
                        ))}
                      </div>
                      <MagneticHover strength={0.2}>
                        <a href={course.youtubePlaylist} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5, padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                            background: `linear-gradient(135deg,${course.color},${course.color}cc)`, color: '#fff', textDecoration: 'none',
                            boxShadow: `0 3px 12px ${course.color}30`, transition: 'all 0.3s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${course.color}40` }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 3px 12px ${course.color}30` }}>
                          <Play size={12} fill="currentColor" /> Start Learning
                        </a>
                      </MagneticHover>
                    </div>
                  </div>
                </GradientBorder>
              );
            })}
          </StaggerList>
        )}

        {/* ═════════ ACHIEVEMENTS TAB ═════════ */}
        {activeTab === 'achievements' && (
          <StaggerList stagger={0.1} direction="scale" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {achievements.map((a, i) => {
              const Icon = a.icon;
              return (
                <MagneticHover key={i} strength={a.earned ? 0.2 : 0}>
                  <GradientBorder
                    colors={a.earned ? ['#f59e0b', '#f97316', '#ef4444', '#f59e0b'] : ['#e2e8f0', '#f1f5f9', '#e2e8f0', '#f1f5f9']}
                    borderWidth={a.earned ? 2 : 1} speed={a.earned ? 3 : 10} borderRadius={16}>
                    <div style={{ padding: '24px 20px', textAlign: 'center', opacity: a.earned ? 1 : 0.5, minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                        background: a.earned ? 'linear-gradient(135deg,#f59e0b,#f97316)' : '#f1f5f9',
                        boxShadow: a.earned ? '0 4px 16px rgba(245,158,11,0.3)' : 'none',
                      }}>
                        <Icon size={24} color={a.earned ? '#fff' : '#94a3b8'} />
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{a.name}</h3>
                      {a.earned ? (
                        <div>
                          <div style={{ fontSize: 11, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                            <CheckCircle size={11} /> Earned {new Date(a.date!).toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: 10, color: '#f59e0b', fontWeight: 700, marginTop: 4 }}>+{a.xp} XP</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>Keep learning to unlock!</div>
                      )}
                    </div>
                  </GradientBorder>
                </MagneticHover>
              );
            })}
          </StaggerList>
        )}

        {/* ═════════ LEADERBOARD TAB ═════════ */}
        {activeTab === 'leaderboard' && (
          <GradientBorder colors={['#8b5cf6', '#6366f1', '#3b82f6', '#8b5cf6']} borderWidth={2} speed={5} borderRadius={18}>
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={16} color="#f59e0b" /> Learning Champions — This Week
              </div>
              <StaggerList stagger={0.1} direction="left" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {leaderboard.map(u => {
                  const isYou = u.name === 'You';
                  const medalColor = u.rank === 1 ? '#f59e0b' : u.rank === 2 ? '#94a3b8' : u.rank === 3 ? '#d97706' : 'transparent';
                  return (
                    <MagneticHover key={u.rank} strength={isYou ? 0.15 : 0.08}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 14,
                        background: isYou ? 'linear-gradient(135deg,#eff6ff,#f5f3ff)' : '#fafbfc',
                        border: isYou ? '2px solid #c7d2fe' : '1px solid #f1f5f9',
                        transition: 'all 0.3s',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.05)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 28, fontSize: 16, fontWeight: 800, color: u.rank <= 3 ? medalColor : '#cbd5e1', textAlign: 'center' }}>
                            {u.rank <= 3 ? ['🥇', '🥈', '🥉'][u.rank - 1] : `#${u.rank}`}
                          </div>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                            {u.avatar}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: isYou ? 800 : 600, color: isYou ? '#4f46e5' : '#1e293b' }}>{u.name}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{u.courses} courses · {u.streak}d streak</div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{u.xp.toLocaleString()}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8' }}>XP</div>
                        </div>
                      </div>
                    </MagneticHover>
                  );
                })}
              </StaggerList>
            </div>
          </GradientBorder>
        )}

        {/* ═════════ QUIZ TAB ═════════ */}
        {activeTab === 'quiz' && (
          <div>
            {!selectedQuiz ? (
              <StaggerList stagger={0.08} direction="up" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {courses.map(course => {
                  const quiz = quizzes[course.id];
                  const hasQ = quiz && quiz.questions.length > 0;
                  return (
                    <MagneticHover key={course.id} strength={0.15}>
                      <GradientBorder colors={hasQ ? [course.color, `${course.color}88`, '#8b5cf6', course.color] : ['#e2e8f0', '#f1f5f9', '#e2e8f0', '#f1f5f9']} borderWidth={2} speed={5} borderRadius={16}>
                        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 140 }}>
                          <div>
                            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 6px' }}>{course.title}</h3>
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>{hasQ ? `${quiz.questions.length} questions` : 'Coming soon'}</div>
                          </div>
                          <button onClick={() => hasQ && handleStartQuiz(course.id)} disabled={!hasQ}
                            style={{
                              marginTop: 14, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: hasQ ? 'pointer' : 'not-allowed',
                              background: hasQ ? `linear-gradient(135deg,${course.color},${course.color}cc)` : '#f1f5f9',
                              color: hasQ ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 700, transition: 'all 0.3s',
                              boxShadow: hasQ ? `0 3px 12px ${course.color}30` : 'none', opacity: hasQ ? 1 : 0.5,
                            }}
                            onMouseEnter={e => { if (hasQ) { e.currentTarget.style.transform = 'translateY(-1px)' } }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}>
                            {hasQ ? 'Take Quiz' : 'Unavailable'}
                          </button>
                        </div>
                      </GradientBorder>
                    </MagneticHover>
                  );
                })}
              </StaggerList>
            ) : (() => {
              const quiz = quizzes[selectedQuiz];
              if (!quiz || quiz.questions.length === 0) return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No quiz available for this course.</div>;

              // Quiz finished
              if (quizStep >= quiz.questions.length) {
                const correct = quiz.questions.filter((q, i) => q.answer === quizAnswers[i]).length;
                const pctScore = Math.round((correct / quiz.questions.length) * 100);
                return (
                  <GradientBorder colors={pctScore >= 70 ? ['#10b981', '#34d399', '#6ee7b7', '#10b981'] : ['#ef4444', '#f87171', '#fca5a5', '#ef4444']} borderWidth={2} speed={3} borderRadius={18} style={{ maxWidth: 500, margin: '0 auto' }}>
                    <div style={{ padding: '32px 28px', textAlign: 'center' }}>
                      <div style={{ fontSize: 48, marginBottom: 8 }}>{pctScore >= 70 ? '🎉' : '💪'}</div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: '0 0 8px' }}>{quiz.title}</h2>
                      <div style={{ fontSize: 32, fontWeight: 800, color: pctScore >= 70 ? '#10b981' : '#ef4444', margin: '8px 0' }}>{correct}/{quiz.questions.length}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Score: {pctScore}% · {pctScore >= 70 ? 'Excellent!' : 'Keep practicing!'}</div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button onClick={() => { setQuizStep(0); setQuizAnswers([]) }} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Retake</button>
                        <button onClick={() => setSelectedQuiz(null)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Back</button>
                      </div>
                    </div>
                  </GradientBorder>
                );
              }

              // Active question
              const q = quiz.questions[quizStep];
              return (
                <GradientBorder colors={['#6366f1', '#8b5cf6', '#a78bfa', '#6366f1']} borderWidth={2} speed={4} borderRadius={18} style={{ maxWidth: 580, margin: '0 auto' }}>
                  <div style={{ padding: '28px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>{quiz.title}</h2>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Q{quizStep + 1}/{quiz.questions.length}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: '100%', height: 4, borderRadius: 4, background: '#f1f5f9', marginBottom: 20, overflow: 'hidden' }}>
                      <div style={{ width: `${((quizStep) / quiz.questions.length) * 100}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 16, lineHeight: 1.5 }}>{q.question}</div>
                    <StaggerList stagger={0.06} direction="left" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((op, i) => (
                        <MagneticHover key={i} strength={0.1}>
                          <button onClick={() => handleAnswer(i)} style={{
                            width: '100%', textAlign: 'left', padding: '12px 16px', borderRadius: 12, border: '2px solid #f1f5f9',
                            background: '#fafbfc', color: '#334155', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.transform = 'translateX(4px)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#f1f5f9'; e.currentTarget.style.background = '#fafbfc'; e.currentTarget.style.transform = 'none' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: '#e2e8f0', fontSize: 10, fontWeight: 700, marginRight: 10, color: '#64748b' }}>{String.fromCharCode(65 + i)}</span>
                            {op}
                          </button>
                        </MagneticHover>
                      ))}
                    </StaggerList>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                      <button onClick={() => setSelectedQuiz(null)} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>← Back to courses</button>
                    </div>
                  </div>
                </GradientBorder>
              );
            })()}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default LearningHubPage;
