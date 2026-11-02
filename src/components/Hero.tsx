import React, { useState, useEffect } from 'react';
import {
  ArrowDown,
  Sparkles,
  Linkedin,
  Github,
  Mail,
  MessageCircle,
  Instagram,
  Send,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, ProductOrProject } from '../types';
import { ConstellationBackground } from './ConstellationBackground';

interface HeroProps {
  profile: UserProfile;
  totalProductsCount?: number;
  products?: ProductOrProject[];
  isDark?: boolean;
  onExploreClick?: () => void;
  onContactClick?: () => void;
  onSelectProduct?: (product: ProductOrProject) => void;
}

export const Hero: React.FC<HeroProps> = ({
  profile,
  isDark = false,
  onExploreClick,
}) => {
  const phrases = [
    'Desarrollo Web & Apps',
    'Soporte Técnico TI L1 / L2 / L3',
    'Infraestructura de Redes & Servidores',
    'Sistemas ERP, POS & Control de Stock',
    'Mantenimiento & Continuidad Operativa',
  ];

  const [phraseIndex, setPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(90);

  useEffect(() => {
    const fullText = phrases[phraseIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setCurrentText(fullText.substring(0, currentText.length + 1));
        setTypingSpeed(80);

        if (currentText === fullText) {
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        setCurrentText(fullText.substring(0, currentText.length - 1));
        setTypingSpeed(45);

        if (currentText === '') {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex, typingSpeed]);

  const getSocialIcon = (name: string, url: string) => {
    const lower = (name + url).toLowerCase();
    if (lower.includes('linkedin')) return <Linkedin className="w-4 h-4" />;
    if (lower.includes('github')) return <Github className="w-4 h-4" />;
    if (lower.includes('whatsapp') || lower.includes('wa.me')) return <MessageCircle className="w-4 h-4" />;
    if (lower.includes('instagram')) return <Instagram className="w-4 h-4" />;
    if (lower.includes('telegram') || lower.includes('t.me')) return <Send className="w-4 h-4" />;
    if (lower.includes('mail') || lower.includes('@')) return <Mail className="w-4 h-4" />;
    return <ExternalLink className="w-4 h-4" />;
  };

  const scrollTo = (id: string) => {
    if (id === 'showcase' && onExploreClick) {
      onExploreClick();
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-[88vh] sm:min-h-[92vh] flex items-center justify-center pt-24 sm:pt-28 pb-12 sm:pb-16 overflow-hidden bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors duration-300"
    >
      {/* Interactive Constellation / Particle Network Background */}
      <ConstellationBackground isDark={isDark} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-14 items-center">
          {/* Left Column: Greeting, Name with orange accent, typewriter & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 sm:space-y-6">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="truncate max-w-[260px] sm:max-w-none">{profile.availability}</span>
            </div>

            {/* Big Friendly Greeting */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-sans">
                Hola, bienvenido
              </h2>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight font-sans">
                Soy Raúl <span className="text-[#ff7a00] dark:text-[#ff8a1e] drop-shadow-xs">Rodríguez</span>
              </h1>
            </div>

            {/* Dynamic Typewriter text */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2 text-sm sm:text-xl font-semibold text-slate-700 dark:text-slate-200 min-h-[40px] sm:min-h-[36px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Especialista en</span>
              <span className="text-[#2563eb] dark:text-[#38bdf8] font-bold border-r-2 border-slate-800 dark:border-slate-200 pr-1 animate-pulse">
                {currentText}
              </span>
            </div>

            {/* Short value statement */}
            <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed px-1 sm:px-0">
              Bajo la firma <strong>Educom-Tec</strong>, brindo soporte técnico TI empresarial, desarrollo de sistemas de gestión (ERP/POS), diseño web moderno y despliegue de redes corporativas seguras.
            </p>

            {/* Primary Action Buttons (Full width on mobile phones, inline on tablet/desktop) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 w-full sm:w-auto pt-1 sm:pt-2">
              <button
                type="button"
                onClick={() => scrollTo('showcase')}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ver Catálogo de Sistemas TI</span>
              </button>

              <button
                type="button"
                onClick={() => scrollTo('about')}
                className="min-h-[48px] inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm border border-slate-200 dark:border-slate-700 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
              >
                <span>Sobre Mí & Trayectoria</span>
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* Social Icons Row (44x44px touch hitboxes) */}
            <div className="pt-2 sm:pt-4 flex flex-col items-center lg:items-start gap-2 w-full">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Contacto & Redes Directas
              </span>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
                {profile.socials.map((soc, idx) => (
                  <a
                    key={idx}
                    href={soc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={soc.name}
                    aria-label={soc.name}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-[#ff7a00] hover:text-white dark:bg-slate-800 dark:hover:bg-[#ff7a00] transition-all duration-200 shadow-sm active:scale-95 focus:outline-hidden"
                  >
                    {getSocialIcon(soc.name, soc.url)}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Golden Sun Circle with Avatar & Metrics */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center w-full">
            <div className="relative group mx-auto">
              {/* Outer soft ambient glow */}
              <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-tr from-amber-400/30 to-yellow-300/40 rounded-full blur-2xl -z-10 pointer-events-none" />

              {/* Golden Yellow Sun Circle */}
              <div className="w-56 h-56 sm:w-76 sm:h-76 lg:w-92 lg:h-92 rounded-full bg-[#fbbf24] dark:bg-[#f59e0b] p-2.5 sm:p-4 shadow-2xl flex items-center justify-center relative overflow-hidden border-4 border-white dark:border-slate-800">
                <div className="absolute inset-0 bg-radial from-yellow-200/40 via-transparent to-amber-500/20 rounded-full pointer-events-none" />

                <img
                  src={
                    profile.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
                  }
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-full shadow-inner filter contrast-105"
                />
              </div>

              {/* Floating verified badge */}
              <div className="absolute -bottom-2 left-0 sm:left-2 bg-white dark:bg-slate-900 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#2563eb] shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    Educom-Tec
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Soporte Certificado TI
                  </p>
                </div>
              </div>

              {/* Floating experience badge */}
              <div className="absolute top-1 right-0 sm:top-2 sm:right-0 bg-white dark:bg-slate-900 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-[#ff7a00] shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    6+ Años
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    Experiencia TI
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Strip below portrait */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full mt-7 sm:mt-10">
              {profile.stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center hover:border-blue-500/50 transition-colors"
                >
                  <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white block font-sans tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

