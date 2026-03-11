import React, { useRef, useState, useEffect, useCallback } from 'react';

/* ───────────────────────── 3D Tilt Card ───────────────────────── */
export const Card3D: React.FC<{
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    intensity?: number;
    glare?: boolean;
    border?: boolean;
}> = ({ children, className = '', style = {}, intensity = 15, glare = true, border = true }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState('perspective(1000px) rotateX(0) rotateY(0) scale(1)');
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
    const [hovering, setHovering] = useState(false);

    const handleMove = useCallback((e: React.MouseEvent) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        const rotY = (x - 0.5) * intensity;
        const rotX = (0.5 - y) * intensity;
        setTransform(`perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`);
        setGlarePos({ x: x * 100, y: y * 100 });
    }, [intensity]);

    return (
        <div
            ref={ref}
            className={`card-3d ${className}`}
            style={{
                position: 'relative', overflow: 'hidden', borderRadius: 16,
                transform, transition: hovering ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
                transformStyle: 'preserve-3d',
                background: 'rgba(255,255,255,0.03)',
                border: border ? '1px solid rgba(255,255,255,0.08)' : 'none',
                ...style
            }}
            onMouseMove={handleMove}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => { setHovering(false); setTransform('perspective(1000px) rotateX(0) rotateY(0) scale(1)'); }}
        >
            {glare && hovering && (
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
                    background: `radial-gradient(600px circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.08), transparent 50%)`,
                    transition: 'opacity 0.2s', opacity: hovering ? 1 : 0
                }} />
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ───────────────────────── Spotlight Card ──────────────────────── */
export const SpotlightCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    color?: string;
}> = ({ children, className = '', style = {}, color = 'rgba(59,130,246,0.15)' }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [hovering, setHovering] = useState(false);

    return (
        <div
            ref={ref}
            className={`spotlight-card ${className}`}
            style={{
                position: 'relative', overflow: 'hidden', borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color 0.3s',
                ...style,
                ...(hovering ? { borderColor: 'rgba(255,255,255,0.15)' } : {})
            }}
            onMouseMove={e => { if (!ref.current) return; const r = ref.current.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {hovering && (
                <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `radial-gradient(400px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 60%)`,
                    zIndex: 0
                }} />
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ───────────────────────── Moving Border Card ─────────────────── */
export const MovingBorderCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    borderColor?: string;
    duration?: number;
}> = ({ children, className = '', style = {}, borderColor = '#3b82f6', duration = 4 }) => {
    return (
        <div className={`moving-border-wrap ${className}`} style={{ position: 'relative', padding: 1, borderRadius: 16, overflow: 'hidden', ...style }}>
            <div style={{
                position: 'absolute', inset: -2, borderRadius: 'inherit',
                background: `conic-gradient(from 0deg, transparent 60%, ${borderColor} 80%, transparent 100%)`,
                animation: `spin ${duration}s linear infinite`,
            }} />
            <div style={{
                position: 'relative', borderRadius: 15, background: '#0f172a',
                zIndex: 1, overflow: 'hidden'
            }}>
                {children}
            </div>
        </div>
    );
};

/* ───────────────────────── Floating Particles ─────────────────── */
export const FloatingParticles: React.FC<{ count?: number; color?: string }> = ({ count = 30, color = 'rgba(59,130,246,0.3)' }) => {
    const particles = useRef(Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * -20,
    }))).current;

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {particles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute', left: `${p.x}%`, top: `${p.y}%`,
                    width: p.size, height: p.size, borderRadius: '50%',
                    background: color, opacity: 0.6,
                    animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
                }} />
            ))}
        </div>
    );
};

/* ───────────────────────── Grid Background ────────────────────── */
export const GridBackground: React.FC<{ color?: string; fade?: boolean }> = ({ color = 'rgba(255,255,255,0.03)', fade = true }) => (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
        }} />
        {fade && <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, #0b1120 80%)',
        }} />}
    </div>
);

/* ───────────────────────── Animated Text ──────────────────────── */
export const GradientText: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    from?: string; via?: string; to?: string;
    animate?: boolean;
}> = ({ children, style = {}, from = '#60a5fa', via = '#a78bfa', to = '#f472b6', animate = true }) => (
    <span style={{
        background: `linear-gradient(135deg, ${from}, ${via}, ${to}, ${from})`,
        backgroundSize: animate ? '200% 200%' : '100% 100%',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        animation: animate ? 'gradient-shift 4s ease infinite' : 'none',
        ...style
    }}>
        {children}
    </span>
);

/* ───────────────────────── Meteor Shower ──────────────────────── */
export const Meteors: React.FC<{ count?: number }> = ({ count = 12 }) => {
    const meteors = useRef(Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100 + '%',
        delay: Math.random() * 5 + 's',
        duration: Math.random() * 2 + 1 + 's',
        size: Math.random() * 1.5 + 0.5,
    }))).current;

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {meteors.map(m => (
                <div key={m.id} style={{
                    position: 'absolute', left: m.left, top: '-5%',
                    width: m.size, height: m.size * 60,
                    borderRadius: '50% 50% 0 0',
                    background: `linear-gradient(to bottom, rgba(99,102,241,0.6), transparent)`,
                    transform: 'rotate(215deg)',
                    animation: `meteor ${m.duration} ease-in ${m.delay} infinite`,
                    opacity: 0,
                }} />
            ))}
        </div>
    );
};

/* ───────────────────────── Glow Effect ─────────────────────────── */
export const GlowOrb: React.FC<{
    color?: string; size?: number; top?: string; left?: string; right?: string; bottom?: string; blur?: number; animate?: boolean;
}> = ({ color = 'rgba(59,130,246,0.15)', size = 400, top, left, right, bottom, blur = 80, animate = true }) => (
    <div style={{
        position: 'absolute', width: size, height: size, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        filter: `blur(${blur}px)`, pointerEvents: 'none', zIndex: 0,
        top, left, right, bottom,
        animation: animate ? 'pulse-glow 6s ease-in-out infinite' : 'none',
    }} />
);

/* ───────────────────────── Counter Animation ──────────────────── */
export const AnimatedCounter: React.FC<{
    target: number; prefix?: string; suffix?: string; duration?: number;
    style?: React.CSSProperties;
}> = ({ target, prefix = '', suffix = '', duration = 2000, style = {} }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true); });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;
        const start = performance.now();
        const step = (now: number) => {
            const pct = Math.min(1, (now - start) / duration);
            setCount(Math.round(target * pct));
            if (pct < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [started, target, duration]);

    return <span ref={ref} style={style}>{prefix}{count.toLocaleString('en-IN')}{suffix}</span>;
};

/* ───────────────────────── Typewriter ──────────────────────────── */
export const Typewriter: React.FC<{
    words: string[]; style?: React.CSSProperties;
}> = ({ words, style = {} }) => {
    const [idx, setIdx] = useState(0);
    const [text, setText] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const word = words[idx];
        const timeout = deleting ? 40 : 80;
        const timer = setTimeout(() => {
            if (!deleting) {
                setText(word.slice(0, text.length + 1));
                if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), 1500);
            } else {
                setText(word.slice(0, text.length - 1));
                if (text.length === 0) { setDeleting(false); setIdx((idx + 1) % words.length); }
            }
        }, timeout);
        return () => clearTimeout(timer);
    }, [text, deleting, idx, words]);

    return (
        <span style={style}>
            {text}<span style={{ borderRight: '2px solid #60a5fa', marginLeft: 2, animation: 'blink 0.8s step-end infinite' }} />
        </span>
    );
};

/* ───────────────────────── Hover Glow Card ─────────────────────── */
/* Neon border glow on hover with swept light beam across edges */
export const HoverGlowCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    glowColor?: string;
}> = ({ children, className = '', style = {}, glowColor = '#6366f1' }) => {
    const [hovering, setHovering] = useState(false);
    return (
        <div className={className}
            style={{
                position: 'relative', borderRadius: 16, overflow: 'hidden',
                background: '#fff', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                boxShadow: hovering
                    ? `0 0 0 1px ${glowColor}40, 0 0 20px ${glowColor}20, 0 4px 30px ${glowColor}10`
                    : '0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
                transform: hovering ? 'translateY(-2px)' : 'none',
                ...style
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {/* Swept beam */}
            <div style={{
                position: 'absolute', top: 0, left: '-100%', width: '100%', height: 2,
                background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
                animation: hovering ? 'shimmer 2s ease-in-out infinite' : 'none',
                opacity: hovering ? 1 : 0, transition: 'opacity 0.3s', zIndex: 2
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ───────────────────────── Text Shimmer ────────────────────────── */
/* Shimmering gradient sweep across text, like a metallic glint */
export const TextShimmer: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    baseColor?: string;
    shimmerColor?: string;
}> = ({ children, style = {}, baseColor = '#1e293b', shimmerColor = '#6366f1' }) => (
    <span style={{
        background: `linear-gradient(110deg, ${baseColor} 35%, ${shimmerColor} 50%, ${baseColor} 65%)`,
        backgroundSize: '300% 100%',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        animation: 'shimmer 3s ease-in-out infinite',
        ...style
    }}>
        {children}
    </span>
);

/* ───────────────────────── Infinite Slider ──────────────────────── */
/* Auto-scrolling horizontal marquee of child items */
export const InfiniteSlider: React.FC<{
    children: React.ReactNode;
    speed?: number;
    direction?: 'left' | 'right';
    style?: React.CSSProperties;
}> = ({ children, speed = 30, direction = 'left', style = {} }) => (
    <div style={{ overflow: 'hidden', position: 'relative', ...style }}>
        <div style={{
            display: 'flex', width: 'max-content',
            animation: `slide-${direction} ${speed}s linear infinite`,
        }}>
            <div style={{ display: 'flex', gap: 24 }}>{children}</div>
            <div style={{ display: 'flex', gap: 24, marginLeft: 24 }}>{children}</div>
        </div>
        <style>{`
            @keyframes slide-left { from{transform:translateX(0)} to{transform:translateX(-50%)} }
            @keyframes slide-right { from{transform:translateX(-50%)} to{transform:translateX(0)} }
        `}</style>
    </div>
);

/* ───────────────────────── Tilt Reveal ──────────────────────────── */
/* Perspective Y-axis tilt that reveals content depth on hover */
export const TiltReveal: React.FC<{
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    tiltDeg?: number;
}> = ({ children, className = '', style = {}, tiltDeg = 6 }) => {
    const [hovering, setHovering] = useState(false);
    return (
        <div className={className}
            style={{
                perspective: 800, transformStyle: 'preserve-3d' as const,
                ...style
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <div style={{
                transform: hovering ? `rotateY(${tiltDeg}deg) scale(1.02)` : 'rotateY(0) scale(1)',
                transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
                transformOrigin: 'left center',
            }}>
                {children}
            </div>
        </div>
    );
};

/* ───────────────────────── Pulse Beacon ─────────────────────────── */
/* Pulsing dot indicator with expanding rings */
export const PulseBeacon: React.FC<{
    color?: string;
    size?: number;
    style?: React.CSSProperties;
}> = ({ color = '#10b981', size = 10, style = {} }) => (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size * 2, height: size * 2, ...style }}>
        <span style={{
            position: 'absolute', width: size * 2, height: size * 2, borderRadius: '50%',
            background: color, opacity: 0.3, animation: 'pulse-glow 2s ease-in-out infinite',
        }} />
        <span style={{
            width: size, height: size, borderRadius: '50%', background: color,
            boxShadow: `0 0 8px ${color}80`,
        }} />
    </span>
);

/* ───────────────────────── Glass Card ──────────────────────────── */
export const GlassCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    tint?: string;
    onClick?: () => void;
}> = ({ children, className = '', style = {}, tint = 'rgba(99,102,241,0.06)', onClick }) => {
    const [pos, setPos] = useState({ x: 50, y: 50 });
    return (
        <div className={className} onClick={onClick}
            style={{
                position: 'relative', borderRadius: 16, overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
                ...style
            }}
            onMouseMove={e => {
                const r = e.currentTarget.getBoundingClientRect();
                setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
        >
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: `radial-gradient(300px circle at ${pos.x}% ${pos.y}%, ${tint}, transparent 60%)`,
                transition: 'background 0.15s',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ───────────────────────── Magnetic Border ─────────────────────── */
export const MagneticBorder: React.FC<{
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    color?: string;
}> = ({ children, className = '', style = {}, color = '#6366f1' }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [angle, setAngle] = useState(0);
    const [hovering, setHovering] = useState(false);
    return (
        <div ref={ref} className={className}
            style={{ position: 'relative', borderRadius: 16, padding: 1, overflow: 'hidden', ...style }}
            onMouseMove={e => {
                if (!ref.current) return;
                const r = ref.current.getBoundingClientRect();
                const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                setAngle(Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI));
            }}
            onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
        >
            <div style={{
                position: 'absolute', inset: -1, borderRadius: 'inherit',
                background: hovering
                    ? `conic-gradient(from ${angle}deg, transparent 50%, ${color} 65%, transparent 80%)`
                    : 'transparent',
                transition: 'opacity 0.3s', opacity: hovering ? 1 : 0,
            }} />
            <div style={{ position: 'relative', borderRadius: 15, background: '#fff', zIndex: 1, overflow: 'hidden' }}>
                {children}
            </div>
        </div>
    );
};

/* ───────────────────────── Staggered List ──────────────────────── */
export const StaggeredList: React.FC<{
    children: React.ReactNode[];
    delay?: number;
    style?: React.CSSProperties;
}> = ({ children, delay = 80, style = {} }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.1 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} style={style}>
            {children.map((child, i) => (
                <div key={i} style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(16px)',
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                    transitionDelay: `${i * delay}ms`,
                }}>
                    {child}
                </div>
            ))}
        </div>
    );
};

/* ═══════════════════════ AURORA GLOW ═══════════════════════════ */
/* Flowing aurora borealis gradient that animates across a section */
export const AuroraGlow: React.FC<{
    children: React.ReactNode;
    colors?: string[];
    style?: React.CSSProperties;
    className?: string;
    speed?: number;
}> = ({ children, colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981'], style = {}, className = '', speed = 8 }) => {
    const id = useRef(`aurora-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <style>{`
                @keyframes ${id} { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
            `}</style>
            <div style={{
                position: 'absolute', inset: -2, opacity: 0.12,
                background: `linear-gradient(135deg, ${colors.join(', ')}, ${colors[0]})`,
                backgroundSize: '400% 400%',
                animation: `${id} ${speed}s ease infinite`, filter: 'blur(20px)',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ SPRING CARD ══════════════════════════ */
/* Card with spring physics — overshoots and bounces on hover */
export const SpringCard: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    scale?: number;
    onClick?: () => void;
}> = ({ children, style = {}, className = '', scale = 1.03, onClick }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div className={className} onClick={onClick}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{
                transform: hovered ? `scale(${scale}) translateY(-4px)` : 'scale(1) translateY(0)',
                transition: hovered
                    ? 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' /* spring overshoot */
                    : 'transform 0.5s cubic-bezier(0.22, 0.68, 0, 1.71)',  /* bounce back */
                cursor: onClick ? 'pointer' : 'default',
                ...style,
            }}>
            {children}
        </div>
    );
};

/* ═══════════════════════ BORDER BEAM ═════════════════════════ */
/* A glowing beam of light that continuously travels around the card border */
export const BorderBeam: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    color?: string;
    speed?: number;
    size?: number;
}> = ({ children, style = {}, className = '', color = '#6366f1', speed = 4, size = 80 }) => {
    const id = useRef(`beam-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', borderRadius: 16, padding: 1, overflow: 'hidden', ...style }}>
            <style>{`
                @keyframes ${id} { 0%{offset-distance:0%} 100%{offset-distance:100%} }
            `}</style>
            {/* Beam element traveling along the border */}
            <div style={{
                position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden', pointerEvents: 'none',
            }}>
                <div style={{
                    position: 'absolute', width: size, height: size,
                    background: `radial-gradient(circle, ${color}, transparent 70%)`,
                    borderRadius: '50%', filter: 'blur(4px)',
                    offsetPath: `path("M 0,0 L 100%,0 L 100%,100% L 0,100% Z")`,
                    animation: `${id} ${speed}s linear infinite`,
                    top: -size / 2, left: -size / 2,
                    /* Fallback for browsers without offset-path: use a rotating approach */
                }} />
                {/* CSS-based fallback: rotating pseudo-border */}
                <div style={{
                    position: 'absolute', inset: -1,
                    background: `conic-gradient(from 0deg, transparent 0%, transparent 70%, ${color}60 85%, transparent 100%)`,
                    animation: `spin ${speed}s linear infinite`,
                    borderRadius: 'inherit',
                }} />
            </div>
            <div style={{ position: 'relative', borderRadius: 15, background: '#fff', zIndex: 1, overflow: 'hidden' }}>
                {children}
            </div>
        </div>
    );
};

/* ═══════════════════════ GLITCH TEXT ═════════════════════════ */
/* Text with digital glitch / scan line effect */
export const GlitchText: React.FC<{
    children: string;
    style?: React.CSSProperties;
    color?: string;
    glitchColor1?: string;
    glitchColor2?: string;
}> = ({ children, style = {}, color = '#1e293b', glitchColor1 = '#6366f1', glitchColor2 = '#06b6d4' }) => {
    const id = useRef(`glitch-${Math.random().toString(36).slice(2)}`).current;
    return (
        <span style={{ position: 'relative', display: 'inline-block', ...style }}>
            <style>{`
                @keyframes ${id}-1 {
                    0%,100%{clip-path:inset(0 0 80% 0);transform:translate(0)} 
                    20%{clip-path:inset(20% 0 50% 0);transform:translate(-2px,1px)} 
                    40%{clip-path:inset(60% 0 10% 0);transform:translate(2px,-1px)} 
                    60%{clip-path:inset(40% 0 30% 0);transform:translate(-1px,2px)}
                    80%{clip-path:inset(10% 0 70% 0);transform:translate(1px,-2px)}
                }
                @keyframes ${id}-2 {
                    0%,100%{clip-path:inset(80% 0 0 0);transform:translate(0)} 
                    20%{clip-path:inset(50% 0 20% 0);transform:translate(2px,-1px)} 
                    40%{clip-path:inset(10% 0 60% 0);transform:translate(-2px,1px)} 
                    60%{clip-path:inset(30% 0 40% 0);transform:translate(1px,-2px)}
                    80%{clip-path:inset(70% 0 10% 0);transform:translate(-1px,2px)}
                }
            `}</style>
            <span style={{ color }}>{children}</span>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, color: glitchColor1, animation: `${id}-1 3s infinite linear`, opacity: 0.6 }}>{children}</span>
            <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, color: glitchColor2, animation: `${id}-2 3s infinite linear 0.1s`, opacity: 0.6 }}>{children}</span>
        </span>
    );
};

/* ═══════════════════════ REVEAL MASK ═════════════════════════ */
/* Element reveals with expanding circle clip-path on scroll into view */
export const RevealMask: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    duration?: number;
    delay?: number;
}> = ({ children, style = {}, className = '', duration = 0.8, delay = 0 }) => {
    const [visible, setVisible] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        /* Use a tiny sentinel div for observation so clip-path:circle(0%) doesn't prevent detection */
        const el = sentinelRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setTimeout(() => setVisible(true), delay * 1000); obs.disconnect(); }
        }, { threshold: 0 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [delay]);
    return (
        <div style={{ position: 'relative', ...style }} className={className}>
            {/* Invisible sentinel that stays full-size for IntersectionObserver */}
            <div ref={sentinelRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 8, pointerEvents: 'none' }} />
            <div style={{
                clipPath: visible ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)',
                transition: `clip-path ${duration}s cubic-bezier(0.4, 0, 0.2, 1)`,
            }}>
                {children}
            </div>
        </div>
    );
};

/* ═══════════════════════ COUNT UP VALUE ══════════════════════ */
/* Animated number that counts up from 0 to target value */
export const CountUpValue: React.FC<{
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    decimals?: number;
    style?: React.CSSProperties;
    locale?: string;
}> = ({ value, prefix = '', suffix = '', duration = 1.5, decimals = 0, style = {}, locale = 'en-IN' }) => {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const started = useRef(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started.current) {
                started.current = true;
                const start = performance.now();
                const step = (now: number) => {
                    const p = Math.min((now - start) / (duration * 1000), 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    setDisplay(eased * value);
                    if (p < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
                obs.disconnect();
            }
        }, { threshold: 0 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [value, duration]);
    const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString(locale);
    return <span ref={ref} style={style}>{prefix}{formatted}{suffix}</span>;
};

/* ═══════════════════════ DONUT CHART ════════════════════════ */
/* Animated SVG donut chart with colored segments */
export const DonutChart: React.FC<{
    segments: { value: number; color: string; label?: string }[];
    size?: number;
    thickness?: number;
    style?: React.CSSProperties;
    centerLabel?: string;
    centerValue?: string;
}> = ({ segments, size = 160, thickness = 18, style = {}, centerLabel, centerValue }) => {
    const [anim, setAnim] = useState(0);
    useEffect(() => { const t = setTimeout(() => setAnim(1), 200); return () => clearTimeout(t); }, []);
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    const r = (size - thickness) / 2;
    const c = 2 * Math.PI * r;
    let offset = 0;
    return (
        <div style={{ position: 'relative', width: size, height: size, ...style }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} stroke="#f1f5f9" strokeWidth={thickness} fill="none" />
                {segments.map((seg, i) => {
                    const pct = seg.value / total;
                    const dash = c * pct * anim;
                    const gap = c - dash;
                    const thisOffset = offset;
                    offset += c * pct;
                    return (
                        <circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={seg.color}
                            strokeWidth={thickness} fill="none"
                            strokeDasharray={`${dash} ${gap}`}
                            strokeDashoffset={-thisOffset}
                            strokeLinecap="butt"
                            style={{ transition: `stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1) ${i * 0.15}s`, filter: `drop-shadow(0 0 3px ${seg.color}40)` }} />
                    );
                })}
            </svg>
            {centerLabel && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {centerValue && <div style={{ fontSize: size * 0.11, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{centerValue}</div>}
                    <div style={{ fontSize: size * 0.065, fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>{centerLabel}</div>
                </div>
            )}
        </div>
    );
};

/* ═══════════════════════ ANIMATED BAR ═══════════════════════ */
/* Horizontal bar that grows from 0 to its value with delay */
export const AnimatedBar: React.FC<{
    value: number;
    max: number;
    color: string;
    height?: number;
    delay?: number;
    label?: string;
    style?: React.CSSProperties;
}> = ({ value, max, color, height = 8, delay = 0, label, style = {} }) => {
    const [w, setW] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setTimeout(() => setW((value / max) * 100), delay * 1000); obs.disconnect(); }
        }, { threshold: 0 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [value, max, delay]);
    return (
        <div ref={ref} style={style}>
            {label && <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>{label}</div>}
            <div style={{ width: '100%', height, borderRadius: height, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{
                    width: `${w}%`, height: '100%', borderRadius: height,
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                    transition: `width 1s cubic-bezier(0.4,0,0.2,1)`,
                    boxShadow: `0 0 8px ${color}30`,
                }} />
            </div>
        </div>
    );
};

/* ═══════════════════════ SHIMMER ROW ════════════════════════ */
/* Table row with a shimmer highlight that sweeps across on hover */
export const ShimmerRow: React.FC<{
    children: React.ReactNode;
    color?: string;
    style?: React.CSSProperties;
    delay?: number;
}> = ({ children, color = 'rgba(99,102,241,0.06)', style = {}, delay = 0 }) => {
    const id = useRef(`srow-${Math.random().toString(36).slice(2)}`).current;
    return (
        <tr style={{
            position: 'relative', transition: 'all 0.3s',
            animation: `${id}-enter 0.5s ease ${delay}s both`,
            ...style,
        }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = color;
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.005)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.transform = 'none';
            }}>
            <style>{`@keyframes ${id}-enter { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }`}</style>
            {children}
        </tr>
    );
};

/* ═══════════════════════ DEPTH CARD ═════════════════════════ */
/* Multi-layer card with parallax depth — inner elements shift on mouse move */
export const DepthCard: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    depth?: number;
}> = ({ children, style = {}, className = '', depth = 8 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const handleMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = (e.clientX - rect.left) / rect.width - 0.5;
        const cy = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(800px) rotateY(${cx * depth}deg) rotateX(${-cy * depth}deg)`;
        /* Shift inner children for parallax */
        const layers = el.querySelectorAll('[data-depth]') as NodeListOf<HTMLElement>;
        layers.forEach(l => {
            const d = parseFloat(l.dataset.depth || '1');
            l.style.transform = `translate(${cx * d * 10}px, ${cy * d * 10}px)`;
        });
    }, [depth]);
    const handleLeave = () => {
        const el = ref.current; if (!el) return;
        el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
        const layers = el.querySelectorAll('[data-depth]') as NodeListOf<HTMLElement>;
        layers.forEach(l => { l.style.transform = 'translate(0,0)'; });
    };
    return (
        <div ref={ref} className={className}
            onMouseMove={handleMove} onMouseLeave={handleLeave}
            style={{ transition: 'transform 0.3s ease', transformStyle: 'preserve-3d', ...style }}>
            {children}
        </div>
    );
};

/* ═══════════════════════ PERSPECTIVE GRID ═════════════════════ */
/* 3D grid background with vanishing-point perspective */
export const PerspectiveGrid: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    color?: string;
    animate?: boolean;
}> = ({ children, style = {}, className = '', color = 'rgba(99,102,241,0.08)', animate = true }) => {
    const id = useRef(`pgrid-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            {animate && <style>{`@keyframes ${id}{0%{background-position:0 0}100%{background-position:0 40px}}`}</style>}
            <div style={{
                position: 'absolute', inset: 0, perspective: 600, transformStyle: 'preserve-3d', pointerEvents: 'none',
            }}>
                <div style={{
                    position: 'absolute', inset: '-50%',
                    backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    transform: 'rotateX(55deg)',
                    transformOrigin: 'center top',
                    animation: animate ? `${id} 3s linear infinite` : undefined,
                    maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 80%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 80%)',
                }} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ FLIP CARD ═══════════════════════════ */
/* Card that flips 180° on hover to reveal back content */
export const FlipCard: React.FC<{
    front: React.ReactNode;
    back: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    height?: number;
}> = ({ front, back, style = {}, className = '', height = 140 }) => {
    const [flipped, setFlipped] = useState(false);
    return (
        <div className={className}
            onMouseEnter={() => setFlipped(true)}
            onMouseLeave={() => setFlipped(false)}
            style={{ perspective: 800, width: '100%', height, cursor: 'pointer', ...style }}>
            <div style={{
                position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d',
                transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
                {/* Front */}
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 14, overflow: 'hidden' }}>
                    {front}
                </div>
                {/* Back */}
                <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 14, overflow: 'hidden', transform: 'rotateY(180deg)' }}>
                    {back}
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════ WAVE PROGRESS ══════════════════════ */
/* A sine-wave shaped animated progress indicator */
export const WaveProgress: React.FC<{
    progress: number;
    color?: string;
    height?: number;
    style?: React.CSSProperties;
}> = ({ progress, color = '#6366f1', height = 6, style = {} }) => {
    const id = useRef(`wave-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div style={{ width: '100%', height, borderRadius: height, background: '#f1f5f9', overflow: 'hidden', position: 'relative', ...style }}>
            <style>{`@keyframes ${id}{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
            <div style={{
                position: 'absolute', top: 0, left: 0, height: '100%',
                width: `${Math.min(progress, 100)}%`,
                borderRadius: height, overflow: 'hidden',
                transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
            }}>
                <svg viewBox="0 0 200 10" style={{ width: 200, minWidth: '200%', height: '100%', animation: `${id} 1.5s linear infinite` }} preserveAspectRatio="none">
                    <path d={`M0,5 Q10,0 20,5 Q30,10 40,5 Q50,0 60,5 Q70,10 80,5 Q90,0 100,5 Q110,10 120,5 Q130,0 140,5 Q150,10 160,5 Q170,0 180,5 Q190,10 200,5 L200,10 L0,10 Z`}
                        fill={color} />
                </svg>
            </div>
        </div>
    );
};

/* ═══════════════════════ NEON BORDER ════════════════════════ */
/* Pulsing neon glow border around a card */
export const NeonBorder: React.FC<{
    children: React.ReactNode;
    color?: string;
    style?: React.CSSProperties;
    className?: string;
    intensity?: number;
}> = ({ children, color = '#6366f1', style = {}, className = '', intensity = 1 }) => {
    const id = useRef(`neon-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{
            borderRadius: 16, position: 'relative', ...style,
        }}>
            <style>{`
                @keyframes ${id}{
                    0%,100%{box-shadow:0 0 ${4 * intensity}px ${color}40, 0 0 ${12 * intensity}px ${color}20, inset 0 0 ${4 * intensity}px ${color}10}
                    50%{box-shadow:0 0 ${8 * intensity}px ${color}60, 0 0 ${24 * intensity}px ${color}30, inset 0 0 ${8 * intensity}px ${color}15}
                }
            `}</style>
            <div style={{
                borderRadius: 'inherit', border: `1px solid ${color}30`,
                animation: `${id} 3s ease-in-out infinite`,
                overflow: 'hidden',
            }}>
                {children}
            </div>
        </div>
    );
};

/* ═══════════════════════ SLIDE REVEAL ═══════════════════════ */
/* Content slides in from left or right when scrolled into view */
export const SlideReveal: React.FC<{
    children: React.ReactNode;
    direction?: 'left' | 'right' | 'up';
    delay?: number;
    duration?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, direction = 'left', delay = 0, duration = 0.6, style = {}, className = '' }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setTimeout(() => setVisible(true), delay * 1000); obs.disconnect(); }
        }, { threshold: 0.05 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [delay]);
    const from = direction === 'left' ? 'translateX(-30px)' : direction === 'right' ? 'translateX(30px)' : 'translateY(20px)';
    return (
        <div ref={ref} className={className} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translate(0)' : from,
            transition: `opacity ${duration}s ease, transform ${duration}s cubic-bezier(0.4,0,0.2,1)`,
            ...style,
        }}>
            {children}
        </div>
    );
};

/* ═══════════════════════ MAGNETIC HOVER ══════════════════════ */
/* Element follows the cursor magnetically within a certain radius */
export const MagneticHover: React.FC<{
    children: React.ReactNode;
    strength?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, strength = 0.3, style = {}, className = '' }) => {
    const ref = useRef<HTMLDivElement>(null);
    const handleMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left - rect.width / 2;
        const cy = e.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${cx * strength}px, ${cy * strength}px)`;
    }, [strength]);
    const handleLeave = () => {
        const el = ref.current; if (!el) return;
        el.style.transform = 'translate(0px, 0px)';
    };
    return (
        <div ref={ref} className={className}
            onMouseMove={handleMove} onMouseLeave={handleLeave}
            style={{ transition: 'transform 0.3s cubic-bezier(0.23,1,0.32,1)', willChange: 'transform', ...style }}>
            {children}
        </div>
    );
};

/* ═══════════════════════ TYPEWRITER CODE ═════════════════════ */
/* Terminal-style text that types out character by character */
export const TypewriterCode: React.FC<{
    text: string;
    speed?: number;
    delay?: number;
    style?: React.CSSProperties;
    className?: string;
    cursor?: boolean;
}> = ({ text, speed = 40, delay = 0, style = {}, className = '', cursor = true }) => {
    const [display, setDisplay] = useState('');
    const [done, setDone] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        let idx = 0, timer: ReturnType<typeof setInterval>;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                setTimeout(() => {
                    timer = setInterval(() => {
                        if (idx < text.length) { setDisplay(text.slice(0, ++idx)); }
                        else { clearInterval(timer); setDone(true); }
                    }, speed);
                }, delay * 1000);
                obs.disconnect();
            }
        }, { threshold: 0 });
        if (ref.current) obs.observe(ref.current);
        return () => { clearInterval(timer); obs.disconnect(); };
    }, [text, speed, delay]);
    return (
        <span ref={ref} className={className} style={{ fontFamily: 'monospace', ...style }}>
            {display}
            {cursor && !done && <span style={{ animation: 'blink-cursor 0.8s step-end infinite', borderRight: '2px solid currentColor', marginLeft: 1 }}>&nbsp;</span>}
            {cursor && <style>{`@keyframes blink-cursor{0%,100%{opacity:1}50%{opacity:0}}`}</style>}
        </span>
    );
};

/* ═══════════════════════ HEX GRID ═══════════════════════════ */
/* Animated honeycomb hexagonal grid background pattern */
export const HexGrid: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    color?: string;
}> = ({ children, style = {}, className = '', color = 'rgba(99,102,241,0.06)' }) => {
    const id = useRef(`hex-${Math.random().toString(36).slice(2)}`).current;
    const hexSvg = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='56' height='100'><path d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100' fill='none' stroke='${color}' stroke-width='1'/><path d='M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34' fill='none' stroke='${color}' stroke-width='1'/></svg>`)}`;
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <style>{`@keyframes ${id}{0%{transform:translateY(0)}100%{transform:translateY(-100px)}}`}</style>
            <div style={{
                position: 'absolute', inset: '-100px -10px', backgroundImage: `url("${hexSvg}")`,
                backgroundSize: '56px 100px', opacity: 0.8,
                animation: `${id} 8s linear infinite`,
                pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ STAGGER LIST ═══════════════════════ */
/* Children cascade in with staggered delays */
export const StaggerList: React.FC<{
    children: React.ReactNode;
    stagger?: number;
    direction?: 'up' | 'left' | 'right' | 'scale';
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, stagger = 0.08, direction = 'up', style = {}, className = '' }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
        }, { threshold: 0.05 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    const from = direction === 'up' ? 'translateY(20px)' : direction === 'left' ? 'translateX(-20px)' : direction === 'right' ? 'translateX(20px)' : 'scale(0.9)';
    return (
        <div ref={ref} className={className} style={style}>
            {React.Children.map(children, (child, i) => (
                <div style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'none' : from,
                    transition: `opacity 0.5s ease ${i * stagger}s, transform 0.5s cubic-bezier(0.4,0,0.2,1) ${i * stagger}s`,
                }}>
                    {child}
                </div>
            ))}
        </div>
    );
};

/* ═══════════════════════ GRADIENT BORDER ════════════════════ */
/* Animated gradient that flows along the border of an element */
export const GradientBorder: React.FC<{
    children: React.ReactNode;
    colors?: string[];
    borderWidth?: number;
    speed?: number;
    style?: React.CSSProperties;
    className?: string;
    borderRadius?: number;
}> = ({ children, colors = ['#6366f1', '#8b5cf6', '#ec4899', '#6366f1'], borderWidth = 2, speed = 4, style = {}, className = '', borderRadius = 16 }) => {
    const id = useRef(`gbrd-${Math.random().toString(36).slice(2)}`).current;
    const grad = colors.join(', ');
    return (
        <div className={className} style={{ position: 'relative', borderRadius, padding: borderWidth, ...style }}>
            <style>{`@keyframes ${id}{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}`}</style>
            <div style={{
                position: 'absolute', inset: 0, borderRadius,
                background: `linear-gradient(90deg, ${grad})`,
                backgroundSize: '300% 300%',
                animation: `${id} ${speed}s ease infinite`,
            }} />
            <div style={{ position: 'relative', borderRadius: borderRadius - borderWidth, overflow: 'hidden', background: '#fff' }}>
                {children}
            </div>
        </div>
    );
};

/* ═══════════════════════ ORBIT RING ═════════════════════════ */
/* 3D rotating ring that orbits children around a center */
export const OrbitRing: React.FC<{
    items: React.ReactNode[];
    radius?: number;
    speed?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ items, radius = 100, speed = 20, style = {}, className = '' }) => {
    const id = useRef(`orbit-${Math.random().toString(36).slice(2)}`).current;
    const size = radius * 2 + 60;
    return (
        <div className={className} style={{ width: size, height: size, position: 'relative', ...style }}>
            <style>{`@keyframes ${id}{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}`}</style>
            <div style={{
                width: '100%', height: '100%', position: 'absolute',
                transformStyle: 'preserve-3d', animation: `${id} ${speed}s linear infinite`,
            }}>
                {items.map((item, i) => {
                    const angle = (360 / items.length) * i;
                    return (
                        <div key={i} style={{
                            position: 'absolute', left: '50%', top: '50%',
                            transform: `rotateY(${angle}deg) translateZ(${radius}px) translateX(-50%) translateY(-50%)`,
                        }}>
                            {item}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ═══════════════════════ LIQUID BLOB ════════════════════════ */
/* Morphing SVG liquid blob background animation */
export const LiquidBlob: React.FC<{
    children: React.ReactNode;
    color1?: string;
    color2?: string;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, color1 = '#6366f1', color2 = '#8b5cf6', style = {}, className = '' }) => {
    const id = useRef(`blob-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <style>{`
                @keyframes ${id}{
                    0%,100%{d:path("M440,320Q430,390,370,430Q310,470,240,460Q170,450,120,400Q70,350,60,280Q50,210,100,160Q150,110,210,80Q270,50,340,70Q410,90,440,160Q470,230,440,320Z")}
                    25%{d:path("M420,310Q400,370,350,420Q300,470,230,470Q160,470,110,420Q60,370,50,300Q40,230,80,170Q120,110,190,80Q260,50,330,60Q400,70,430,140Q460,210,420,310Z")}
                    50%{d:path("M430,300Q380,350,340,400Q300,450,240,450Q180,450,130,410Q80,370,70,300Q60,230,100,170Q140,110,200,90Q260,70,320,80Q380,90,420,150Q460,210,430,300Z")}
                    75%{d:path("M450,330Q440,400,380,440Q320,480,250,470Q180,460,120,410Q60,360,50,290Q40,220,90,170Q140,120,200,80Q260,40,330,60Q400,80,440,150Q480,220,450,330Z")}
                }
            `}</style>
            <svg viewBox="0 0 500 500" style={{ position: 'absolute', width: '120%', height: '120%', top: '-10%', left: '-10%', opacity: 0.15, pointerEvents: 'none' }}>
                <defs>
                    <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={color1} />
                        <stop offset="100%" stopColor={color2} />
                    </linearGradient>
                </defs>
                <path fill={`url(#${id}-g)`}
                    d="M440,320Q430,390,370,430Q310,470,240,460Q170,450,120,400Q70,350,60,280Q50,210,100,160Q150,110,210,80Q270,50,340,70Q410,90,440,160Q470,230,440,320Z"
                    style={{ animation: `${id} 12s ease-in-out infinite` }} />
            </svg>
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ TILT 3D ═══════════════════════════ */
/* Card with 3D perspective tilt + specular highlight following cursor */
export const Tilt3D: React.FC<{
    children: React.ReactNode;
    maxTilt?: number;
    style?: React.CSSProperties;
    className?: string;
    glare?: boolean;
}> = ({ children, maxTilt = 8, style = {}, className = '', glare = true }) => {
    const ref = useRef<HTMLDivElement>(null);
    const glareRef = useRef<HTMLDivElement>(null);
    const handleMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(600px) rotateX(${-y * maxTilt}deg) rotateY(${x * maxTilt}deg) scale3d(1.02,1.02,1.02)`;
        if (glareRef.current) {
            glareRef.current.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.15), transparent 60%)`;
        }
    }, [maxTilt]);
    const handleLeave = () => {
        const el = ref.current; if (!el) return;
        el.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
        if (glareRef.current) glareRef.current.style.background = 'transparent';
    };
    return (
        <div ref={ref} className={className}
            onMouseMove={handleMove} onMouseLeave={handleLeave}
            style={{ transition: 'transform 0.3s ease', transformStyle: 'preserve-3d', position: 'relative', ...style }}>
            {glare && <div ref={glareRef} style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 10, transition: 'background 0.3s ease' }} />}
            {children}
        </div>
    );
};

/* ═══════════════════════ RIPPLE BUTTON ══════════════════════ */
/* Click creates expanding ripple wave effect */
export const RippleButton: React.FC<{
    children: React.ReactNode;
    color?: string;
    style?: React.CSSProperties;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
}> = ({ children, color = 'rgba(255,255,255,0.4)', style = {}, className = '', onClick }) => {
    const ref = useRef<HTMLButtonElement>(null);
    const handleClick = (e: React.MouseEvent) => {
        const el = ref.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height) * 2;
        Object.assign(ripple.style, {
            position: 'absolute', borderRadius: '50%', background: color,
            width: `${size}px`, height: `${size}px`,
            left: `${x - size / 2}px`, top: `${y - size / 2}px`,
            transform: 'scale(0)', opacity: '1',
            animation: 'ripple-expand 0.6s ease-out forwards',
            pointerEvents: 'none',
        });
        el.appendChild(ripple);
        setTimeout(() => ripple.remove(), 700);
        onClick?.(e);
    };
    return (
        <button ref={ref} className={className} onClick={handleClick}
            style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <style>{`@keyframes ripple-expand{to{transform:scale(1);opacity:0}}`}</style>
            {children}
        </button>
    );
};

/* ═══════════════════════ ELASTIC REVEAL ═════════════════════ */
/* Elements bounce in with elastic spring overshoot on scroll */
export const ElasticReveal: React.FC<{
    children: React.ReactNode;
    delay?: number;
    intensity?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, delay = 0, intensity = 1.1, style = {}, className = '' }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const id = useRef(`elastic-${Math.random().toString(36).slice(2)}`).current;
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setTimeout(() => setVisible(true), delay * 1000); obs.disconnect(); }
        }, { threshold: 0.05 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [delay]);
    return (
        <div ref={ref} className={className} style={style}>
            <style>{`
                @keyframes ${id}{
                    0%{opacity:0;transform:scale(0.6) translateY(20px)}
                    50%{opacity:1;transform:scale(${intensity}) translateY(-4px)}
                    70%{transform:scale(${1 - (intensity - 1) * 0.3}) translateY(2px)}
                    100%{opacity:1;transform:scale(1) translateY(0)}
                }
            `}</style>
            <div style={{
                animation: visible ? `${id} 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards` : undefined,
                opacity: visible ? undefined : 0,
            }}>
                {children}
            </div>
        </div>
    );
};

/* ═══════════════════════ MATRIX RAIN ════════════════════════ */
/* Falling digital characters like The Matrix — trading-tech background */
export const MatrixRain: React.FC<{
    children: React.ReactNode;
    color?: string;
    density?: number;
    speed?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, color = '#22d3ee', density = 14, speed = 1, style = {}, className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        let raf: number;
        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize(); window.addEventListener('resize', resize);
        const chars = '01アイウエオカキクケコ₹◆▲▼●■◇△▽○□%$¥€₿ΘΦΨΩ∞∑∆∏';
        const cols = Math.floor(canvas.width / density);
        const drops = Array(cols).fill(0).map(() => Math.random() * -50);
        const draw = () => {
            ctx.fillStyle = 'rgba(0,0,0,0.06)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = color;
            ctx.font = `${density - 2}px monospace`;
            for (let i = 0; i < cols; i++) {
                const c = chars[Math.floor(Math.random() * chars.length)];
                ctx.globalAlpha = 0.4 + Math.random() * 0.4;
                ctx.fillText(c, i * density, drops[i] * density);
                if (drops[i] * density > canvas.height && Math.random() > 0.98) drops[i] = 0;
                drops[i] += speed * (0.5 + Math.random() * 0.5);
            }
            ctx.globalAlpha = 1;
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, [color, density, speed]);
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ NUMBER TICKER ══════════════════════ */
/* Digits scramble through random values before settling on the real number */
export const NumberTicker: React.FC<{
    value: number;
    prefix?: string;
    suffix?: string;
    duration?: number;
    style?: React.CSSProperties;
    className?: string;
    locale?: string;
}> = ({ value, prefix = '', suffix = '', duration = 1.5, style = {}, className = '', locale = 'en-IN' }) => {
    const [display, setDisplay] = useState('0');
    const prevValue = useRef(0);
    useEffect(() => {
        const start = prevValue.current;
        const end = value;
        const startTime = performance.now();
        const dur = duration * 1000;
        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / dur, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * eased);
            if (progress < 0.7) {
                // Scramble phase: show random digits mixed with real
                const str = current.toLocaleString(locale);
                const scrambled = str.split('').map((ch, i) =>
                    /\d/.test(ch) && Math.random() > progress ? String(Math.floor(Math.random() * 10)) : ch
                ).join('');
                setDisplay(scrambled);
            } else {
                setDisplay(current.toLocaleString(locale));
            }
            if (progress < 1) requestAnimationFrame(tick);
            else { setDisplay(end.toLocaleString(locale)); prevValue.current = end; }
        };
        requestAnimationFrame(tick);
    }, [value, duration, locale]);
    return <span className={className} style={style}>{prefix}{display}{suffix}</span>;
};

/* ═══════════════════════ HOLOGRAPHIC SHEEN ══════════════════ */
/* Rainbow holographic shine with auto-animated sweep + cursor-tracking glow */
export const HolographicSheen: React.FC<{
    children: React.ReactNode;
    intensity?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, intensity = 0.18, style = {}, className = '' }) => {
    const ref = useRef<HTMLDivElement>(null);
    const sheenRef = useRef<HTMLDivElement>(null);
    const id = useRef(`holo-${Math.random().toString(36).slice(2)}`).current;
    const handleMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current; const sheen = sheenRef.current;
        if (!el || !sheen) return;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        sheen.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,0,180,${intensity * 1.6}), rgba(0,220,255,${intensity * 1.3}), rgba(255,220,0,${intensity}), transparent 65%)`;
        sheen.style.opacity = '1';
    }, [intensity]);
    const handleLeave = () => { if (sheenRef.current) sheenRef.current.style.opacity = '0'; };
    return (
        <div ref={ref} className={className} onMouseMove={handleMove} onMouseLeave={handleLeave}
            style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <style>{`
                @keyframes ${id}-sweep{0%{transform:translateX(-100%) skewX(-15deg)}100%{transform:translateX(200%) skewX(-15deg)}}
                @keyframes ${id}-border{0%,100%{border-color:rgba(99,102,241,${intensity * 0.6})}25%{border-color:rgba(236,72,153,${intensity * 0.6})}50%{border-color:rgba(6,182,212,${intensity * 0.6})}75%{border-color:rgba(250,204,21,${intensity * 0.6})}}
            `}</style>
            {/* Auto-animated sweep — visible without hover */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 9,
                borderRadius: 'inherit', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '40%', height: '100%',
                    background: `linear-gradient(90deg, transparent, rgba(255,255,255,${intensity * 0.7}), rgba(200,180,255,${intensity * 0.5}), transparent)`,
                    animation: `${id}-sweep 4s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                }} />
            </div>
            {/* Cursor-tracking overlay */}
            <div ref={sheenRef} style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
                borderRadius: 'inherit', transition: 'opacity 0.3s ease', opacity: 0,
                mixBlendMode: 'overlay',
            }} />
            {/* Animated border glow */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8,
                borderRadius: 'inherit',
                border: `1.5px solid rgba(99,102,241,${intensity * 0.5})`,
                animation: `${id}-border 6s linear infinite`,
                transition: 'border-color 0.5s ease',
            }} />
            {children}
        </div>
    );
};

/* ═══════════════════════ PULSE WAVE ════════════════════════ */
/* Concentric circles pulsing outward from center — for status indicators */
export const PulseWave: React.FC<{
    color?: string;
    size?: number;
    rings?: number;
    style?: React.CSSProperties;
    className?: string;
    children?: React.ReactNode;
}> = ({ color = '#22d3ee', size = 48, rings = 3, style = {}, className = '', children }) => {
    const id = useRef(`pw-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', width: size, height: size, ...style }}>
            <style>{`@keyframes ${id}{0%{transform:scale(0.8);opacity:0.6}100%{transform:scale(2.2);opacity:0}}`}</style>
            {Array.from({ length: rings }).map((_, i) => (
                <div key={i} style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    border: `2px solid ${color}`,
                    animation: `${id} ${1.5 + rings * 0.2}s ease-out ${i * 0.4}s infinite`,
                    opacity: 0,
                }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </div>
        </div>
    );
};

/* ═══════════════════════ SPLIT TEXT ═════════════════════════ */
/* Text letters animate from scattered to assembled — spring physics on scroll */
export const SplitText: React.FC<{
    text: string;
    style?: React.CSSProperties;
    className?: string;
    delay?: number;
    stagger?: number;
}> = ({ text, style = {}, className = '', delay = 0, stagger = 0.03 }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);
    const id = useRef(`split-${Math.random().toString(36).slice(2)}`).current;
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setTimeout(() => setVisible(true), delay * 1000); obs.disconnect(); }
        }, { threshold: 0.1 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [delay]);
    return (
        <span ref={ref} className={className} style={{ display: 'inline-block', ...style }}>
            <style>{`
                @keyframes ${id}{
                    0%{opacity:0;transform:translateY(12px) translateX(${Math.random() > 0.5 ? '' : '-'}8px) rotate(${Math.random() > 0.5 ? '' : '-'}8deg) scale(0.7);filter:blur(4px)}
                    60%{opacity:1;transform:translateY(-2px) translateX(0) rotate(0) scale(1.05);filter:blur(0)}
                    100%{opacity:1;transform:translateY(0) translateX(0) rotate(0) scale(1);filter:blur(0)}
                }
            `}</style>
            {text.split('').map((ch, i) => (
                <span key={i} style={{
                    display: 'inline-block',
                    animation: visible ? `${id} 0.6s cubic-bezier(0.34,1.56,0.64,1) ${i * stagger}s both` : undefined,
                    opacity: visible ? undefined : 0,
                    whiteSpace: ch === ' ' ? 'pre' : undefined,
                }}>
                    {ch}
                </span>
            ))}
        </span>
    );
};

/* ═══════════════════════ TICKER TAPE ═══════════════════════ */
/* Continuous horizontal scrolling stock ticker ribbon */
export const TickerTape: React.FC<{
    items: React.ReactNode[];
    speed?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ items, speed = 30, style = {}, className = '' }) => {
    const id = useRef(`tape-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ overflow: 'hidden', whiteSpace: 'nowrap', ...style }}>
            <style>{`@keyframes ${id}{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
            <div style={{ display: 'inline-flex', animation: `${id} ${speed}s linear infinite` }}>
                {[...items, ...items].map((item, i) => (
                    <div key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
};

/* ═══════════════════════ SCAN LINE ═════════════════════════ */
/* Green scanning line sweeps across the container — radar/terminal feel */
export const ScanLine: React.FC<{
    children: React.ReactNode;
    color?: string;
    speed?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, color = 'rgba(16,185,129,0.15)', speed = 4, style = {}, className = '' }) => {
    const id = useRef(`scan-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <style>{`@keyframes ${id}{0%{top:-20%}100%{top:120%}}`}</style>
            <div style={{
                position: 'absolute', left: 0, width: '100%', height: '20%',
                background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
                animation: `${id} ${speed}s linear infinite`, pointerEvents: 'none', zIndex: 2,
            }} />
            {children}
        </div>
    );
};

/* ═══════════════════════ GLOW TRAIL ═══════════════════════ */
/* Glowing light that traces around the border of an element */
export const GlowTrail: React.FC<{
    children: React.ReactNode;
    color?: string;
    speed?: number;
    style?: React.CSSProperties;
    className?: string;
    thickness?: number;
}> = ({ children, color = '#22d3ee', speed = 3, style = {}, className = '', thickness = 2 }) => {
    const id = useRef(`glow-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', ...style }}>
            <style>{`
                @keyframes ${id}{
                    0%{background-position:0% 0%}
                    25%{background-position:100% 0%}
                    50%{background-position:100% 100%}
                    75%{background-position:0% 100%}
                    100%{background-position:0% 0%}
                }
            `}</style>
            <div style={{
                position: 'absolute', inset: -thickness, borderRadius: 'inherit', zIndex: 0,
                background: `conic-gradient(from 0deg, transparent 70%, ${color} 78%, ${color} 82%, transparent 90%)`,
                backgroundSize: '200% 200%',
                animation: `${id} ${speed}s linear infinite`,
                filter: `blur(${thickness}px)`, opacity: 0.7,
            }} />
            <div style={{ position: 'relative', zIndex: 1, borderRadius: 'inherit' }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ BAR EQUALIZER ═════════════════════ */
/* Audio-equalizer style animated vertical bars — market activity */
export const BarEqualizer: React.FC<{
    bars?: number;
    color?: string;
    height?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ bars = 5, color = '#22d3ee', height = 24, style = {}, className = '' }) => {
    const id = useRef(`eq-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height, ...style }}>
            <style>{`@keyframes ${id}{0%,100%{height:20%}25%{height:80%}50%{height:40%}75%{height:90%}}`}</style>
            {Array.from({ length: bars }).map((_, i) => (
                <div key={i} style={{
                    width: 3, borderRadius: 2, background: color,
                    animation: `${id} ${0.8 + Math.random() * 0.6}s ease-in-out ${i * 0.1}s infinite`,
                    opacity: 0.7 + Math.random() * 0.3,
                }} />
            ))}
        </div>
    );
};

/* ═══════════════════════ DATA PULSE ════════════════════════ */
/* Element emits a pulse ring on appearance — live data indicator */
export const DataPulse: React.FC<{
    children: React.ReactNode;
    color?: string;
    active?: boolean;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, color = '#22d3ee', active = true, style = {}, className = '' }) => {
    const id = useRef(`dp-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', ...style }}>
            {active && (
                <>
                    <style>{`@keyframes ${id}{0%{transform:scale(1);opacity:0.5}100%{transform:scale(1.08);opacity:0}}`}</style>
                    <div style={{
                        position: 'absolute', inset: -2, borderRadius: 'inherit',
                        border: `2px solid ${color}`,
                        animation: `${id} 2s ease-out infinite`, pointerEvents: 'none', zIndex: 0,
                    }} />
                </>
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ NEURAL NETWORK 3D ══════════════════ */
/* Animated neural-network graph with pulsing nodes and traveling signals */
export const NeuralNetwork3D: React.FC<{
    width?: number;
    height?: number;
    nodes?: number;
    color?: string;
    signalColor?: string;
    style?: React.CSSProperties;
    className?: string;
}> = ({ width = 300, height = 200, nodes = 12, color = '#00d4aa', signalColor = '#7b61ff', style = {}, className = '' }) => {
    const id = useRef(`nn3d-${Math.random().toString(36).slice(2)}`).current;
    const nodeData = useRef(
        Array.from({ length: nodes }, (_, i) => ({
            x: 15 + (i % 4) * 25 + (Math.random() * 10 - 5),
            y: 15 + Math.floor(i / 4) * 30 + (Math.random() * 10 - 5),
            r: 2 + Math.random() * 2,
            delay: Math.random() * 3,
        }))
    ).current;
    const edges = useRef(
        nodeData.flatMap((a, i) =>
            nodeData.slice(i + 1).filter(() => Math.random() > 0.55).map((b, j) => ({
                x1: a.x, y1: a.y, x2: b.x, y2: b.y, delay: (i + j) * 0.3,
            }))
        )
    ).current;
    return (
        <div className={className} style={{ perspective: 600, ...style }}>
            <style>{`
                @keyframes ${id}-pulse{0%,100%{opacity:.4;r:2}50%{opacity:1;r:3.5}}
                @keyframes ${id}-signal{0%{stroke-dashoffset:20;opacity:0}20%{opacity:1}80%{opacity:1}100%{stroke-dashoffset:0;opacity:0}}
                @keyframes ${id}-tilt{0%{transform:rotateY(-6deg) rotateX(4deg)}50%{transform:rotateY(6deg) rotateX(-4deg)}100%{transform:rotateY(-6deg) rotateX(4deg)}}
            `}</style>
            <svg viewBox="0 0 100 100" width={width} height={height}
                style={{ animation: `${id}-tilt 8s ease-in-out infinite`, transformStyle: 'preserve-3d' }}>
                {edges.map((e, i) => (
                    <line key={`e${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                        stroke={color} strokeWidth="0.3" opacity="0.2" />
                ))}
                {edges.map((e, i) => (
                    <line key={`s${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                        stroke={signalColor} strokeWidth="0.6"
                        strokeDasharray="4 16" opacity="0"
                        style={{ animation: `${id}-signal 2.5s ease ${e.delay}s infinite` }} />
                ))}
                {nodeData.map((n, i) => (
                    <g key={`n${i}`}>
                        <circle cx={n.x} cy={n.y} r={n.r * 2} fill={color} opacity="0.08" />
                        <circle cx={n.x} cy={n.y} r={n.r} fill={color}
                            style={{ animation: `${id}-pulse 3s ease ${n.delay}s infinite` }} />
                    </g>
                ))}
            </svg>
        </div>
    );
};

/* ═══════════════════════ HOLOGRAM 3D ════════════════════════ */
/* Holographic scanline + RGB chromatic shift with 3D rotation on hover */
export const Hologram3D: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    color?: string;
}> = ({ children, style = {}, className = '', color = '#00d4aa' }) => {
    const ref = useRef<HTMLDivElement>(null);
    const id = useRef(`holo3d-${Math.random().toString(36).slice(2)}`).current;
    const handleMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
    }, []);
    const handleLeave = useCallback(() => {
        if (ref.current) ref.current.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg)';
    }, []);
    return (
        <div ref={ref} className={className}
            onMouseMove={handleMove} onMouseLeave={handleLeave}
            style={{ position: 'relative', overflow: 'hidden', transition: 'transform 0.3s ease', transformStyle: 'preserve-3d', ...style }}>
            <style>{`
                @keyframes ${id}-scan{0%{top:-30%}100%{top:130%}}
                @keyframes ${id}-chroma{0%,100%{text-shadow:2px 0 ${color}40, -2px 0 #ff6b9d40}50%{text-shadow:-2px 0 ${color}60, 2px 0 #7b61ff60}}
                @keyframes ${id}-flicker{0%,97%,100%{opacity:1}98%{opacity:0.85}99%{opacity:0.95}}
            `}</style>
            <div style={{
                position: 'absolute', left: 0, width: '100%', height: '30%',
                background: `linear-gradient(180deg, transparent, ${color}10, transparent)`,
                animation: `${id}-scan 3s linear infinite`, pointerEvents: 'none', zIndex: 3,
            }} />
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${color}06 2px, ${color}06 4px)`,
                animation: `${id}-flicker 4s step-end infinite`,
            }} />
            <div style={{ position: 'relative', zIndex: 1, animation: `${id}-chroma 4s ease-in-out infinite` }}>
                {children}
            </div>
        </div>
    );
};

/* ═══════════════════════ WARP TUNNEL ════════════════════════ */
/* Radial warp-speed star field background effect */
export const WarpTunnel: React.FC<{
    children?: React.ReactNode;
    starCount?: number;
    color?: string;
    speed?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, starCount = 60, color = '#7b61ff', speed = 3, style = {}, className = '' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        let raf: number;
        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize(); window.addEventListener('resize', resize);
        type Star = { x: number; y: number; z: number; pz: number };
        const stars: Star[] = Array.from({ length: starCount }, () => ({
            x: Math.random() * canvas.width - canvas.width / 2,
            y: Math.random() * canvas.height - canvas.height / 2,
            z: Math.random() * canvas.width,
            pz: 0,
        }));
        const draw = () => {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const cx = canvas.width / 2, cy = canvas.height / 2;
            for (const star of stars) {
                star.pz = star.z;
                star.z -= speed * 2;
                if (star.z <= 0) {
                    star.x = Math.random() * canvas.width - cx;
                    star.y = Math.random() * canvas.height - cy;
                    star.z = canvas.width;
                    star.pz = star.z;
                }
                const sx = (star.x / star.z) * cx + cx;
                const sy = (star.y / star.z) * cy + cy;
                const px = (star.x / star.pz) * cx + cx;
                const py = (star.y / star.pz) * cy + cy;
                const size = (1 - star.z / canvas.width) * 3;
                const alpha = (1 - star.z / canvas.width);
                ctx.strokeStyle = color;
                ctx.globalAlpha = alpha * 0.8;
                ctx.lineWidth = size;
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(sx, sy);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
            raf = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
    }, [starCount, color, speed]);
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5, pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ CRYSTAL PRISM ══════════════════════ */
/* Card with rainbow caustic refraction at edges, rotates on 3 axes with mouse */
export const CrystalPrism: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    intensity?: number;
}> = ({ children, style = {}, className = '', intensity = 1 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const id = useRef(`prism-${Math.random().toString(36).slice(2)}`).current;
    const handleMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(800px) rotateX(${-y * 15}deg) rotateY(${x * 15}deg) rotateZ(${x * y * 5}deg) scale3d(1.02,1.02,1.02)`;
    }, []);
    const handleLeave = useCallback(() => {
        if (ref.current) ref.current.style.transform = 'perspective(800px) rotateX(0) rotateY(0) rotateZ(0) scale3d(1,1,1)';
    }, []);
    return (
        <div ref={ref} className={className}
            onMouseMove={handleMove} onMouseLeave={handleLeave}
            style={{ position: 'relative', overflow: 'hidden', transition: 'transform 0.35s ease', transformStyle: 'preserve-3d', ...style }}>
            <style>{`
                @keyframes ${id}-caustic{
                    0%{background-position:0% 50%;filter:hue-rotate(0deg)}
                    50%{background-position:100% 50%;filter:hue-rotate(180deg)}
                    100%{background-position:0% 50%;filter:hue-rotate(360deg)}
                }
            `}</style>
            <div style={{
                position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 2,
                background: `linear-gradient(135deg, 
                    rgba(255,0,128,${0.08 * intensity}), 
                    rgba(0,212,170,${0.08 * intensity}), 
                    rgba(123,97,255,${0.08 * intensity}), 
                    rgba(255,107,157,${0.08 * intensity}), 
                    rgba(0,212,170,${0.08 * intensity}))`,
                backgroundSize: '300% 300%',
                animation: `${id}-caustic 6s ease infinite`,
                mixBlendMode: 'overlay',
            }} />
            <div style={{
                position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none', zIndex: 3,
                border: `1px solid rgba(255,255,255,${0.15 * intensity})`,
                boxShadow: `inset 0 0 30px rgba(255,255,255,${0.03 * intensity}), 
                            0 0 15px rgba(123,97,255,${0.08 * intensity}),
                            0 0 30px rgba(0,212,170,${0.05 * intensity})`,
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ FLOATING ISLAND 3D ═════════════════ */
/* Element floats above a shadow with parallax layers and Y-axis bobbing */
export const FloatingIsland3D: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    floatHeight?: number;
    bobSpeed?: number;
}> = ({ children, style = {}, className = '', floatHeight = 12, bobSpeed = 4 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const id = useRef(`float3d-${Math.random().toString(36).slice(2)}`).current;
    const handleMove = useCallback((e: React.MouseEvent) => {
        const el = contentRef.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `translateY(${-floatHeight}px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    }, [floatHeight]);
    const handleLeave = useCallback(() => {
        if (contentRef.current) contentRef.current.style.transform = '';
    }, []);
    return (
        <div ref={ref} className={className}
            onMouseMove={handleMove} onMouseLeave={handleLeave}
            style={{ position: 'relative', ...style }}>
            <style>{`
                @keyframes ${id}-bob{
                    0%,100%{transform:translateY(0px)}
                    50%{transform:translateY(${-floatHeight}px)}
                }
                @keyframes ${id}-shadow{
                    0%,100%{transform:scale(1);opacity:0.15}
                    50%{transform:scale(0.92);opacity:0.1}
                }
            `}</style>
            <div ref={contentRef} style={{
                position: 'relative', zIndex: 1,
                animation: `${id}-bob ${bobSpeed}s ease-in-out infinite`,
                transition: 'transform 0.3s ease',
                transformStyle: 'preserve-3d',
            }}>
                {children}
            </div>
            <div style={{
                position: 'absolute', bottom: -6, left: '10%', right: '10%', height: 12,
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.2), transparent 70%)',
                animation: `${id}-shadow ${bobSpeed}s ease-in-out infinite`,
                pointerEvents: 'none',
            }} />
        </div>
    );
};

/* ═══════════════════════ CIRCUIT BOARD ══════════════════════ */
/* Animated SVG circuit-board traces with data flowing through paths */
export const CircuitBoard: React.FC<{
    children?: React.ReactNode;
    color?: string;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, color = '#10b981', style = {}, className = '' }) => {
    const id = useRef(`circuit-${Math.random().toString(36).slice(2)}`).current;
    const paths = useRef(
        Array.from({ length: 8 }, () => {
            const sx = Math.random() * 100, sy = Math.random() * 100;
            const mx = sx + (Math.random() * 40 - 20), my = sy;
            const ex = mx, ey = sy + (Math.random() * 40 - 20);
            return { d: `M${sx},${sy} L${mx},${my} L${ex},${ey}`, delay: Math.random() * 3 };
        })
    ).current;
    const nodes = useRef(
        Array.from({ length: 12 }, () => ({
            cx: Math.random() * 100, cy: Math.random() * 100,
            r: 1 + Math.random(), delay: Math.random() * 4,
        }))
    ).current;
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <style>{`
                @keyframes ${id}-flow{0%{stroke-dashoffset:40;opacity:0}20%{opacity:1}80%{opacity:1}100%{stroke-dashoffset:0;opacity:0}}
                @keyframes ${id}-pulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.8;transform:scale(1.5)}}
            `}</style>
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3, pointerEvents: 'none' }} preserveAspectRatio="none">
                {paths.map((p, i) => (
                    <g key={i}>
                        <path d={p.d} fill="none" stroke={color} strokeWidth="0.3" opacity="0.3" />
                        <path d={p.d} fill="none" stroke={color} strokeWidth="0.5"
                            strokeDasharray="6 34" opacity="0"
                            style={{ animation: `${id}-flow 3s ease ${p.delay}s infinite` }} />
                    </g>
                ))}
                {nodes.map((n, i) => (
                    <circle key={i} cx={n.cx} cy={n.cy} r={n.r} fill={color}
                        style={{ animation: `${id}-pulse 4s ease ${n.delay}s infinite`, transformOrigin: `${n.cx}px ${n.cy}px` }} />
                ))}
            </svg>
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ RADAR SWEEP ═══════════════════════ */
/* Rotating radar sweep with blips */
export const RadarSweep: React.FC<{
    size?: number;
    color?: string;
    blips?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ size = 120, color = '#10b981', blips = 4, style = {}, className = '' }) => {
    const id = useRef(`radar-${Math.random().toString(36).slice(2)}`).current;
    const blipData = useRef(
        Array.from({ length: blips }, () => ({
            angle: Math.random() * 360, dist: 20 + Math.random() * 30,
            delay: Math.random() * 3,
        }))
    ).current;
    return (
        <div className={className} style={{ width: size, height: size, position: 'relative', ...style }}>
            <style>{`
                @keyframes ${id}-sweep{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
                @keyframes ${id}-blip{0%,70%,100%{opacity:0;transform:scale(0.5)}75%{opacity:1;transform:scale(1.2)}85%{opacity:0.6;transform:scale(1)}}
            `}</style>
            <svg viewBox="0 0 100 100" width={size} height={size}>
                <circle cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
                <circle cx="50" cy="50" r="30" fill="none" stroke={color} strokeWidth="0.3" opacity="0.15" />
                <circle cx="50" cy="50" r="15" fill="none" stroke={color} strokeWidth="0.3" opacity="0.1" />
                <line x1="50" y1="5" x2="50" y2="95" stroke={color} strokeWidth="0.2" opacity="0.1" />
                <line x1="5" y1="50" x2="95" y2="50" stroke={color} strokeWidth="0.2" opacity="0.1" />
                <g style={{ transformOrigin: '50px 50px', animation: `${id}-sweep 4s linear infinite` }}>
                    <line x1="50" y1="50" x2="50" y2="5" stroke={color} strokeWidth="0.8" opacity="0.6" />
                    <path d="M50,50 L47,8 A45,45 0 0,1 50,5 Z" fill={`${color}15`} />
                </g>
                {blipData.map((b, i) => {
                    const rad = (b.angle * Math.PI) / 180;
                    const bx = 50 + Math.cos(rad) * b.dist, by = 50 + Math.sin(rad) * b.dist;
                    return <circle key={i} cx={bx} cy={by} r="2" fill={color}
                        style={{ animation: `${id}-blip 4s ease ${b.delay}s infinite`, transformOrigin: `${bx}px ${by}px` }} />;
                })}
                <circle cx="50" cy="50" r="2" fill={color} opacity="0.8" />
            </svg>
        </div>
    );
};

/* ═══════════════════════ SHIELD GUARD ══════════════════════ */
/* Pulsing security shield with hexagonal energy field */
export const ShieldGuard: React.FC<{
    children?: React.ReactNode;
    color?: string;
    size?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, color = '#3b82f6', size = 80, style = {}, className = '' }) => {
    const id = useRef(`shield-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ width: size, height: size, position: 'relative', ...style }}>
            <style>{`
                @keyframes ${id}-pulse{0%,100%{filter:drop-shadow(0 0 3px ${color}40);transform:scale(1)}50%{filter:drop-shadow(0 0 10px ${color}60);transform:scale(1.04)}}
                @keyframes ${id}-rotate{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
                @keyframes ${id}-hex{0%,100%{opacity:0.15;stroke-dashoffset:0}50%{opacity:0.4;stroke-dashoffset:10}}
            `}</style>
            <svg viewBox="0 0 100 100" width={size} height={size}
                style={{ animation: `${id}-pulse 3s ease-in-out infinite` }}>
                <defs>
                    <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </linearGradient>
                </defs>
                <path d="M50,8 L85,25 L85,60 Q85,80 50,95 Q15,80 15,60 L15,25 Z"
                    fill={`url(#${id}-g)`} stroke={color} strokeWidth="1.5" opacity="0.8" />
                <g style={{ transformOrigin: '50px 50px', animation: `${id}-rotate 20s linear infinite` }}>
                    <polygon points="50,20 65,30 65,50 50,60 35,50 35,30" fill="none"
                        stroke={color} strokeWidth="0.5" strokeDasharray="4 4"
                        style={{ animation: `${id}-hex 4s ease infinite` }} />
                </g>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
};

/* ═══════════════════════ DATA STREAM 3D ════════════════════ */
/* Vertical streaming data columns with 3D depth perspective */
export const DataStream3D: React.FC<{
    children?: React.ReactNode;
    columns?: number;
    color?: string;
    speed?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, columns = 8, color = '#3b82f6', speed = 2, style = {}, className = '' }) => {
    const id = useRef(`ds3d-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', perspective: 400, ...style }}>
            <style>{`
                @keyframes ${id}-stream{0%{transform:translateY(-100%) translateZ(0)}100%{transform:translateY(100vh) translateZ(0)}}
                @keyframes ${id}-glow{0%,100%{opacity:0.2}50%{opacity:0.5}}
            `}</style>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', justifyContent: 'space-around', transformStyle: 'preserve-3d', transform: 'rotateX(5deg)' }}>
                {Array.from({ length: columns }).map((_, i) => {
                    const h = 20 + Math.random() * 60;
                    const delay = Math.random() * speed;
                    const z = -20 + Math.random() * 40;
                    return (
                        <div key={i} style={{
                            width: 2, height: `${h}%`,
                            background: `linear-gradient(180deg, transparent, ${color}40, ${color}, ${color}40, transparent)`,
                            borderRadius: 2,
                            animation: `${id}-stream ${speed + Math.random()}s linear ${delay}s infinite`,
                            transform: `translateZ(${z}px)`,
                            opacity: 0.3 + (z + 20) / 60 * 0.4,
                        }} />
                    );
                })}
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ MORPHING BLOB 3D ══════════════════ */
/* Smooth morphing gradient blob with mouse-reactive parallax */
export const MorphingBlob3D: React.FC<{
    children?: React.ReactNode;
    color1?: string;
    color2?: string;
    size?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, color1 = '#10b981', color2 = '#3b82f6', size = 200, style = {}, className = '' }) => {
    const id = useRef(`blob3d-${Math.random().toString(36).slice(2)}`).current;
    const ref = useRef<HTMLDivElement>(null);
    const blobRef = useRef<HTMLDivElement>(null);
    const handleMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current; const blob = blobRef.current;
        if (!el || !blob) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        blob.style.transform = `translate(${x * 20}px, ${y * 20}px) scale(1.05)`;
    }, []);
    const handleLeave = useCallback(() => {
        if (blobRef.current) blobRef.current.style.transform = 'translate(0,0) scale(1)';
    }, []);
    return (
        <div ref={ref} className={className} onMouseMove={handleMove} onMouseLeave={handleLeave}
            style={{ position: 'relative', ...style }}>
            <style>{`
                @keyframes ${id}-morph{
                    0%,100%{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}
                    25%{border-radius:30% 60% 70% 40%/50% 60% 30% 60%}
                    50%{border-radius:50% 60% 30% 60%/30% 60% 70% 40%}
                    75%{border-radius:60% 40% 60% 40%/70% 30% 50% 60%}
                }
            `}</style>
            <div ref={blobRef} style={{
                position: 'absolute', width: size, height: size,
                top: '50%', left: '50%', marginTop: -size / 2, marginLeft: -size / 2,
                background: `linear-gradient(135deg, ${color1}, ${color2})`,
                animation: `${id}-morph 8s ease-in-out infinite`,
                opacity: 0.12, filter: 'blur(30px)',
                transition: 'transform 0.3s ease',
                pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ GLASS PARALLAX ════════════════════ */
/* Frosted glass card with 3D parallax — mouse tracking tilt + depth layers */
export const GlassParallax: React.FC<{
    children: React.ReactNode;
    intensity?: number;
    blur?: number;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, intensity = 8, blur = 16, style = {}, className = '' }) => {
    const ref = useRef<HTMLDivElement>(null);
    const handleMove = useCallback((e: React.MouseEvent) => {
        const el = ref.current; if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(600px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale(1.02)`;
    }, [intensity]);
    const handleLeave = () => { if (ref.current) ref.current.style.transform = 'perspective(600px) rotateY(0) rotateX(0) scale(1)'; };
    return (
        <div ref={ref} className={className} onMouseMove={handleMove} onMouseLeave={handleLeave}
            style={{
                background: `rgba(255,255,255,0.65)`,
                backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`,
                borderRadius: 'inherit', transition: 'transform 0.15s ease-out',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)',
                ...style,
            }}>
            {children}
        </div>
    );
};

/* ═══════════════════════ SHINE SWIPE ══════════════════════ */
/* Diagonal holographic shine sweeping across the element */
export const ShineSwipe: React.FC<{
    children: React.ReactNode;
    speed?: number;
    color?: string;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, speed = 3, color = 'rgba(255,255,255,0.15)', style = {}, className = '' }) => {
    const id = useRef(`shine-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <style>{`@keyframes ${id}{0%{left:-60%}100%{left:160%}}`}</style>
            <div style={{
                position: 'absolute', top: '-20%', width: '35%', height: '140%',
                background: `linear-gradient(105deg, transparent 30%, ${color} 50%, transparent 70%)`,
                animation: `${id} ${speed}s ease-in-out infinite`,
                pointerEvents: 'none', zIndex: 2, transform: 'skewX(-15deg)',
            }} />
            {children}
        </div>
    );
};

/* ═══════════════════════ PRICE FLIP ═══════════════════════ */
/* Split-flap digit animation — airport departure board style */
export const PriceFlip: React.FC<{
    value: string;
    style?: React.CSSProperties;
    className?: string;
}> = ({ value, style = {}, className = '' }) => {
    const [displayed, setDisplayed] = useState(value);
    const [flipping, setFlipping] = useState(false);
    const id = useRef(`pf-${Math.random().toString(36).slice(2)}`).current;
    useEffect(() => {
        if (value !== displayed) {
            setFlipping(true);
            const t = setTimeout(() => { setDisplayed(value); setFlipping(false); }, 400);
            return () => clearTimeout(t);
        }
    }, [value, displayed]);
    return (
        <span className={className} style={{ display: 'inline-flex', gap: 2, ...style }}>
            <style>{`
                @keyframes ${id}-flip{
                    0%{transform:rotateX(0);opacity:1}
                    50%{transform:rotateX(-90deg);opacity:0}
                    51%{transform:rotateX(90deg);opacity:0}
                    100%{transform:rotateX(0);opacity:1}
                }
            `}</style>
            {(flipping ? value : displayed).split('').map((ch, i) => (
                <span key={`${i}-${ch}`} style={{
                    display: 'inline-block', minWidth: /\d/.test(ch) ? '0.6em' : undefined,
                    textAlign: 'center', perspective: 200,
                    animation: flipping ? `${id}-flip 0.4s ease ${i * 0.04}s both` : undefined,
                }}>
                    {ch}
                </span>
            ))}
        </span>
    );
};

/* ═══════════════════════ CONFETTI POP ═════════════════════ */
/* Burst of confetti particles on click */
export const ConfettiPop: React.FC<{
    children: React.ReactNode;
    colors?: string[];
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'], style = {}, className = '' }) => {
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; angle: number; speed: number }[]>([]);
    const id = useRef(`conf-${Math.random().toString(36).slice(2)}`).current;
    const handleClick = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const cx = e.clientX - rect.left; const cy = e.clientY - rect.top;
        const ps = Array.from({ length: 16 }, (_, i) => ({
            id: Date.now() + i, x: cx, y: cy,
            color: colors[Math.floor(Math.random() * colors.length)],
            angle: (Math.PI * 2 * i) / 16 + (Math.random() - 0.5) * 0.5,
            speed: 40 + Math.random() * 50,
        }));
        setParticles(ps);
        setTimeout(() => setParticles([]), 800);
    };
    return (
        <div className={className} onClick={handleClick} style={{ position: 'relative', cursor: 'pointer', ...style }}>
            <style>{`@keyframes ${id}{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)}}`}</style>
            {particles.map(p => (
                <div key={p.id} style={{
                    position: 'absolute', left: p.x, top: p.y, width: 6, height: 6,
                    borderRadius: Math.random() > 0.5 ? '50%' : '1px',
                    background: p.color, pointerEvents: 'none', zIndex: 50,
                    ['--tx' as any]: `${Math.cos(p.angle) * p.speed}px`,
                    ['--ty' as any]: `${Math.sin(p.angle) * p.speed - 20}px`,
                    animation: `${id} 0.7s ease-out forwards`,
                }} />
            ))}
            {children}
        </div>
    );
};

/* ═══════════════════════ LAYER STACK ══════════════════════ */
/* Cards stacked with 3D depth that fan out on hover */
export const LayerStack: React.FC<{
    children: React.ReactNode;
    layers?: number;
    color?: string;
    style?: React.CSSProperties;
    className?: string;
}> = ({ children, layers = 3, color = 'rgba(99,102,241,0.06)', style = {}, className = '' }) => {
    const [hovered, setHovered] = useState(false);
    return (
        <div className={className} style={{ position: 'relative', ...style }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            {Array.from({ length: layers }).map((_, i) => (
                <div key={i} style={{
                    position: 'absolute', inset: 0, borderRadius: 'inherit',
                    background: color, border: '1px solid rgba(99,102,241,0.08)',
                    transform: hovered
                        ? `translateY(${(i + 1) * 6}px) translateX(${(i + 1) * 2}px) scale(${1 - (i + 1) * 0.02})`
                        : `translateY(${(i + 1) * 2}px) scale(${1 - (i + 1) * 0.01})`,
                    transition: `transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.05}s`,
                    zIndex: -1 - i,
                }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ HEAT MAP ══════════════════════════ */
/* Color-shifting grid overlay that maps mouse position to heatmap */
export const HeatMap: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    hotColor?: string;
    coldColor?: string;
    cellSize?: number;
}> = ({ children, style = {}, className = '', hotColor = 'rgba(239,68,68,0.25)', coldColor = 'rgba(59,130,246,0.05)', cellSize = 40 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
    const [dims, setDims] = useState({ w: 0, h: 0 });
    useEffect(() => {
        if (ref.current) {
            const r = ref.current.getBoundingClientRect();
            setDims({ w: r.width, h: r.height });
        }
    }, []);
    const cols = Math.ceil(dims.w / cellSize) || 1;
    const rows = Math.ceil(dims.h / cellSize) || 1;
    return (
        <div ref={ref} className={className}
            style={{ position: 'relative', overflow: 'hidden', ...style }}
            onMouseMove={e => {
                if (!ref.current) return;
                const r = ref.current.getBoundingClientRect();
                setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
            }}
            onMouseLeave={() => setMousePos({ x: -1000, y: -1000 })}
        >
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
                {Array.from({ length: cols * rows }).map((_, i) => {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    const cx = (col + 0.5) * cellSize;
                    const cy = (row + 0.5) * cellSize;
                    const dist = Math.sqrt((mousePos.x - cx) ** 2 + (mousePos.y - cy) ** 2);
                    const maxDist = 200;
                    const intensity = Math.max(0, 1 - dist / maxDist);
                    return (
                        <div key={i} style={{
                            background: intensity > 0.1 ? hotColor : coldColor,
                            opacity: 0.15 + intensity * 0.6,
                            transition: 'all 0.15s ease',
                            borderRadius: 2,
                        }} />
                    );
                })}
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ SONAR PING ══════════════════════ */
/* Rotating sonar/ping sweep animation overlay */
export const SonarPing: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    color?: string;
    speed?: number;
    size?: number;
}> = ({ children, style = {}, className = '', color = 'rgba(16,185,129,0.4)', speed = 3, size = 300 }) => {
    const id = useRef(`radar-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}>
            <style>{`@keyframes ${id}{0%{transform:translate(-50%,-50%) rotate(0deg)}100%{transform:translate(-50%,-50%) rotate(360deg)}}`}</style>
            <div style={{
                position: 'absolute', top: '50%', left: '50%', width: size, height: size,
                background: `conic-gradient(from 0deg, transparent 0%, transparent 70%, ${color} 85%, transparent 100%)`,
                borderRadius: '50%', animation: `${id} ${speed}s linear infinite`,
                transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 0,
                filter: 'blur(2px)',
            }} />
            {/* Cross-hairs */}
            <div style={{
                position: 'absolute', top: '50%', left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, transparent 10%, ${color.replace(/[\d.]+\)$/, '0.15)')} 50%, transparent 90%)`,
                pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1,
                background: `linear-gradient(180deg, transparent 10%, ${color.replace(/[\d.]+\)$/, '0.15)')} 50%, transparent 90%)`,
                pointerEvents: 'none', zIndex: 0,
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

/* ═══════════════════════ NEON PULSE ══════════════════════ */
/* Container with pulsing neon border glow effect */
export const NeonPulse: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    color?: string;
    intensity?: number;
    speed?: number;
}> = ({ children, style = {}, className = '', color = '#06b6d4', intensity = 1, speed = 2 }) => {
    const id = useRef(`neon-${Math.random().toString(36).slice(2)}`).current;
    return (
        <div className={className} style={{ position: 'relative', ...style }}>
            <style>{`
                @keyframes ${id}{
                    0%,100%{box-shadow:0 0 ${5*intensity}px ${color}40, 0 0 ${15*intensity}px ${color}20, inset 0 0 ${5*intensity}px ${color}10}
                    50%{box-shadow:0 0 ${15*intensity}px ${color}60, 0 0 ${40*intensity}px ${color}30, inset 0 0 ${10*intensity}px ${color}15}
                }
            `}</style>
            <div style={{
                borderRadius: 'inherit', border: `1px solid ${color}40`,
                animation: `${id} ${speed}s ease-in-out infinite`,
                padding: 'inherit',
            }}>
                {children}
            </div>
        </div>
    );
};

/* ═══════════════════════ WAVEFORM LINE ══════════════════════ */
/* Animated sine wave SVG line background */
export const WaveformLine: React.FC<{
    style?: React.CSSProperties;
    className?: string;
    color?: string;
    amplitude?: number;
    frequency?: number;
    speed?: number;
    height?: number;
}> = ({ style = {}, className = '', color = '#6366f1', amplitude = 20, frequency = 3, speed = 2, height = 60 }) => {
    const id = useRef(`wave-${Math.random().toString(36).slice(2)}`).current;
    const points = Array.from({ length: 100 }, (_, i) => {
        const x = (i / 99) * 100;
        const y = 50 + Math.sin((i / 99) * Math.PI * 2 * frequency) * amplitude;
        return `${x},${y}`;
    }).join(' ');
    return (
        <div className={className} style={{ position: 'relative', height, overflow: 'hidden', ...style }}>
            <style>{`@keyframes ${id}{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
            <svg viewBox={`0 0 200 100`} preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, width: '200%', height: '100%', animation: `${id} ${speed}s linear infinite` }}>
                <polyline points={points} fill="none" stroke={color} strokeWidth="2" opacity="0.4" />
                <polyline points={points.split(' ').map(p => { const [x, y] = p.split(','); return `${parseFloat(x) + 100},${y}`; }).join(' ')}
                    fill="none" stroke={color} strokeWidth="2" opacity="0.4" />
            </svg>
            <svg viewBox={`0 0 200 100`} preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, width: '200%', height: '100%', animation: `${id} ${speed * 1.5}s linear infinite`, opacity: 0.2 }}>
                <polyline points={Array.from({ length: 100 }, (_, i) => {
                    const x = (i / 99) * 100;
                    const y = 50 + Math.cos((i / 99) * Math.PI * 2 * frequency * 1.3) * amplitude * 0.6;
                    return `${x},${y}`;
                }).join(' ')} fill="none" stroke={color} strokeWidth="1.5" />
            </svg>
        </div>
    );
};

/* ═══════════════════════ HOLOGRAPHIC CARD ══════════════════════ */
/* Card with rainbow holographic shimmer effect on mouse move */
export const HolographicCard: React.FC<{
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    intensity?: number;
}> = ({ children, style = {}, className = '', intensity = 0.15 }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ x: 50, y: 50 });
    const [hovering, setHovering] = useState(false);
    return (
        <div ref={ref} className={className}
            style={{
                position: 'relative', overflow: 'hidden', borderRadius: 16,
                transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: hovering ? 'translateY(-2px) scale(1.005)' : 'none',
                ...style,
            }}
            onMouseMove={e => {
                if (!ref.current) return;
                const r = ref.current.getBoundingClientRect();
                setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => { setHovering(false); setPos({ x: 50, y: 50 }); }}
        >
            {/* Holographic rainbow overlay */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
                background: `
                    radial-gradient(600px circle at ${pos.x}% ${pos.y}%, 
                        rgba(255,0,128,${intensity}) 0%, 
                        rgba(0,255,255,${intensity * 0.8}) 25%, 
                        rgba(128,0,255,${intensity * 0.6}) 50%, 
                        rgba(255,255,0,${intensity * 0.4}) 75%,
                        transparent 100%
                    )`,
                opacity: hovering ? 1 : 0,
                transition: 'opacity 0.3s ease',
                mixBlendMode: 'overlay',
            }} />
            {/* Specular highlight */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3,
                background: `radial-gradient(250px circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.15), transparent 60%)`,
                opacity: hovering ? 1 : 0,
                transition: 'opacity 0.2s',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
        </div>
    );
};

