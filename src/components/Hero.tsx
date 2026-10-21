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
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { UserProfile } from '../types';
import { ConstellationBackground } from './ConstellationBackground';

interface HeroProps {
  profile: UserProfile;
  totalProductsCount: number;
  isDark?: boolean;
}

export const Hero: React.FC<HeroProps> = ({ profile, totalProductsCount, isDark = false }) => {
  // Dynamic typewriter effect matching the reference image's "I Am Into Web Development"
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
        // Typing forward
        setCurrentText(fullText.substring(0, currentText.length + 1));
        setTypingSpeed(80);

        if (currentText === fullText) {
          // Pause at end of phrase
          setTimeout(() => setIsDeleting(true), 1800);
        }
      } else {
        // Deleting backward
        setCurrentText(fullText.substring(0, currentText.length - 1));
        setTypingSpeed(45);

        if (currentText === '') {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex, typingSpeed, phrases]);

  // Map social links to appropriate icons
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
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden bg-white dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors duration-300"
    >
      {/* Interactive Constellation / Particle Network Background */}
      <ConstellationBackground isDark={isDark} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {/* Split Grid Layout directly matching the reference screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: Greeting, Name with orange accent, typewriter & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5 sm:space-y-6">
            
            {/* Status Pill / Availability Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{profile.availability}</span>
            </div>

            {/* Big Friendly Greeting */}
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-800 dark:text-slate-100 font-sans">
                Hola, bienvenido
              </h2>
              
              {/* "Soy Raúl Rodríguez" with vibrant orange accent like "Sable" in the screenshot */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-tight font-sans">
                Soy Raúl <span className="text-[#ff7a00] dark:text-[#ff8a1e] drop-shadow-xs">Rodríguez</span>
              </h1>
            </div>

            {/* Dynamic Typewriter text */}
            <div className="flex items-center gap-2 text-base sm:text-xl font-semibold text-slate-700 dark:text-slate-200 min-h-[36px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Especialista en</span>
              <span className="text-[#2563eb] dark:text-[#38bdf8] font-bold border-r-2 border-slate-800 dark:border-slate-200 pr-1 animate-pulse">
                {currentText}
              </span>
            </div>

            {/* Short value statement */}
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Bajo la firma <strong>Educom-Tec</strong>, brindo soporte técnico TI empresarial, desarrollo de sistemas de gestión (ERP/POS), diseño web moderno y despliegue de redes corporativas seguras.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              {/* Royal Blue / Indigo Pill Button matching the screenshot "About Me ▾" */}
              <button
                type="button"
                onClick={() => scrollTo('about')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold text-sm shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              >
                <span>Sobre Mí</span>
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </button>

              {/* Secondary CTA: Ver Catálogo */}
              <button
                type="button"
                onClick={() => scrollTo('showcase')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-sm border border-slate-200 dark:border-slate-700 transition-all hover:-translate-y-0.5 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#ff7a00]" />
                <span>Ver Catálogo TI</span>
              </button>
            </div>

            {/* Social Icons Row (Dark circular buttons matching the screenshot) */}
            <div className="pt-4 flex flex-col items-center lg:items-start gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
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
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-[#ff7a00] hover:text-white dark:bg-slate-800 dark:hover:bg-[#ff7a00] transition-all duration-200 shadow-sm hover:scale-110 focus:outline-hidden"
                  >
                    {getSocialIcon(soc.name, soc.url)}
                  </a>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Warm Golden Sun Circle with Friendly Avatar matching the screenshot */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative group">
              
              {/* Outer soft ambient glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-amber-400/30 to-yellow-300/40 rounded-full blur-2xl -z-10 group-hover:scale-105 transition-transform duration-500 pointer-events-none" />

              {/* Big Golden Yellow Sun Circle matching the screenshot's `#ffc107` / yellow circle */}
              <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full bg-[#fbbf24] dark:bg-[#f59e0b] p-3 sm:p-4 shadow-2xl flex items-center justify-center relative overflow-hidden border-4 border-white dark:border-slate-800">
                {/* Subtle radial inner glow */}
                <div className="absolute inset-0 bg-radial from-yellow-200/40 via-transparent to-amber-500/20 rounded-full pointer-events-none" />
                
                {/* Profile Photo / Avatar */}
                <img
                  src={profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-full shadow-inner filter contrast-105 transform group-hover:scale-102 transition-transform duration-500"
                />
              </div>

              {/* Floating verified badge */}
              <div className="absolute -bottom-2 sm:bottom-2 -left-2 sm:left-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#2563eb]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Educom-Tec</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Soporte Certificado TI</p>
                </div>
              </div>

              {/* Floating experience badge */}
              <div className="absolute top-2 -right-2 sm:right-0 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-[#ff7a00]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">6+ Años</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Experiencia Práctica</p>
                </div>
              </div>

            </div>

            {/* Quick Metrics Strip below portrait on mobile/desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full mt-8 sm:mt-10">
              {profile.stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-center hover:border-blue-500/50 transition-colors"
                >
                  <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white block font-sans">
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
