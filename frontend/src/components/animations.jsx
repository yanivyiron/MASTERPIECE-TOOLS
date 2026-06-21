import React, { useEffect, useRef, useState } from 'react';
import { useInView } from '../hooks/useInView';

// Smoothly animates a number from 0 to `value` when in viewport
export const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0, duration = 1600, className = '' }) => {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;
    let raf;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration);
      setDisplay(value * ease(p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => raf && cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  const formatted = decimals > 0 ? display.toFixed(decimals) : Math.round(display).toLocaleString();
  return (
    <span ref={ref} className={className}>{prefix}{formatted}{suffix}</span>
  );
};

// Top scroll progress bar (orange)
export const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = (h.scrollHeight - h.clientHeight) || 1;
      setProgress(Math.min(100, (h.scrollTop / max) * 100));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[100] pointer-events-none">
      <div className="h-full bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
    </div>
  );
};

// 3D Tilt wrapper — rotates child on mouse move (perspective hover effect)
export const Tilt3D = ({ children, max = 8, className = '' }) => {
  const ref = useRef(null);
  const [transform, setTransform] = useState('');

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - y) * max;
    const ry = (x - 0.5) * max;
    setTransform(`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`);
  };
  const onLeave = () => setTransform('perspective(900px) rotateX(0) rotateY(0)');

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transform, transition: 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1)', transformStyle: 'preserve-3d', willChange: 'transform' }}
      className={className}
    >
      {children}
    </div>
  );
};

// Marquee strip (infinite horizontal scroll) — used for client logos
export const Marquee = ({ children, speed = 30, className = '' }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <div className="flex gap-12 animate-[marquee_var(--ms)_linear_infinite] whitespace-nowrap" style={{ '--ms': `${speed}s` }}>
      {children}{children}
    </div>
    <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
  </div>
);

// Reveal on scroll
export const Reveal = ({ children, delay = 0, y = 24, className = '' }) => {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms`, transform: inView ? 'translateY(0)' : `translateY(${y}px)`, opacity: inView ? 1 : 0 }}
      className={`transition-all duration-700 ease-out ${className}`}
    >
      {children}
    </div>
  );
};

// Spotlight that follows the cursor inside the wrapper (subtle radial glow)
export const SpotlightCard = ({ children, className = '', size = 380, color = 'rgba(255,107,26,0.18)' }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onMouseMove={onMove} className={`relative overflow-hidden group ${className}`}
      style={{ background: `radial-gradient(${size}px circle at var(--mx,50%) var(--my,50%), ${color}, transparent 60%)` }}>
      {children}
    </div>
  );
};
