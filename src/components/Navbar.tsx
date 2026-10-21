import React, { useState, useEffect } from 'react';
import { Moon, Sun, Menu, X, ArrowUpRight, ShieldCheck, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { DigitalSignature } from './DigitalSignature';

interface NavbarProps {
  profile: UserProfile;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAddModal: () => void;
  isAdminLoggedIn?: boolean;
  onOpenAdminAuthOrPanel: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  isDark,
  onToggleTheme,
  onOpenAddModal: _onOpenAddModal,
  isAdminLoggedIn = false,
  onOpenAdminAuthOrPanel,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);

      const sections = ['hero', 'about', 'showcase', 'workflow', 'contact'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160 && rect.bottom >= 160) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', href: '#hero', id: 'hero' },
    { name: 'Sobre Mí', href: '#about', id: 'about' },
    { name: 'Catálogo TI', href: '#showcase', id: 'showcase' },
    { name: 'Proceso', href: '#workflow', id: 'workflow' },
    { name: 'Contacto', href: '#contact', id: 'contact' },
  ];

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 py-3 shadow-xs'
          : 'bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-xs py-4 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        
        {/* Brand with Digital Signature & Logo */}
        <a
          id="brand-logo"
          href="#hero"
          onClick={(e) => scrollToSection(e, '#hero')}
          className="group flex items-center gap-3 focus:outline-hidden"
        >
          <DigitalSignature variant="compact" color={isDark ? '#38bdf8' : '#2563eb'} showSubtitle={true} />
        </a>

        {/* Desktop Nav Links - Clean minimalist underline tab style matching reference screenshot */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                id={`nav-link-${link.id}`}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className={`relative py-1.5 text-sm transition-all duration-200 font-medium ${
                  isActive
                    ? 'text-[#2563eb] dark:text-[#38bdf8] font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <span>{link.name}</span>
                {/* Active Underline matching the reference screenshot */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] dark:bg-[#38bdf8] rounded-full animate-fade-in" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Admin Shield Button */}
          <button
            id="nav-admin-shield-btn"
            type="button"
            onClick={onOpenAdminAuthOrPanel}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
              isAdminLoggedIn
                ? 'bg-blue-50 text-[#2563eb] border-blue-300 dark:bg-blue-950/60 dark:text-[#38bdf8] dark:border-blue-700 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
            }`}
            title={
              isAdminLoggedIn
                ? 'Panel Administrativo Educom-Tec (Sesión activa)'
                : 'Iniciar Sesión Administrativa (Educom-Tec)'
            }
          >
            <ShieldCheck className={`w-4 h-4 ${isAdminLoggedIn ? 'text-[#2563eb] dark:text-[#38bdf8]' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="hidden sm:inline">
              {isAdminLoggedIn ? 'Panel Admin' : 'Admin'}
            </span>
            {isAdminLoggedIn && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            aria-label="Cambiar tema claro / oscuro"
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#ff7a00]" />
            ) : (
              <Moon className="w-4 h-4 text-[#2563eb]" />
            )}
          </button>

          {/* Contact CTA Button */}
          <a
            id="nav-contact-cta"
            href="#contact"
            onClick={(e) => scrollToSection(e, '#contact')}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1d4ed8] hover:bg-[#1e40af] rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <span>Contacto</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          {/* Mobile menu toggle */}
          <button
            id="mobile-menu-toggle"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú de navegación"
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="lg:hidden bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-6 py-5 shadow-2xl animate-fade-in"
        >
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href)}
                className={`text-sm py-2.5 px-3 rounded-xl transition-colors flex items-center justify-between font-medium ${
                  activeSection === link.id
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-[#2563eb] dark:text-[#38bdf8] font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{link.name}</span>
                <ArrowUpRight className="w-4 h-4 opacity-70" />
              </a>
            ))}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdminAuthOrPanel();
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
                  isAdminLoggedIn
                    ? 'bg-blue-50 text-[#2563eb] border-blue-300 dark:bg-blue-950/60 dark:text-[#38bdf8]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#2563eb] dark:text-[#38bdf8]" />
                <span>
                  {isAdminLoggedIn ? 'Panel de Administración (Activo)' : 'Iniciar Sesión Admin'}
                </span>
              </button>

              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, '#contact')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-white bg-[#1d4ed8] rounded-xl"
              >
                <span>Contacto / Cotizar Solución</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
