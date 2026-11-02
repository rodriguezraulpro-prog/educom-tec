import React, { useState, useEffect } from 'react';
import { Moon, Sun, Menu, X, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { DigitalSignature } from './DigitalSignature';

interface NavbarProps {
  profile?: UserProfile;
  isDark: boolean;
  onToggleTheme: () => void;
  onSetTheme?: (dark: boolean) => void;
  onOpenAddModal?: () => void;
  isAdminLoggedIn?: boolean;
  onOpenAdminAuthOrPanel?: () => void;
  onOpenAdminLogin?: () => void;
  onOpenAdminPanel?: () => void;
  onNavigate?: (sectionId: string) => void;
  avatarUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDark,
  onToggleTheme,
  onSetTheme,
  isAdminLoggedIn = false,
  onOpenAdminAuthOrPanel,
  onOpenAdminLogin,
  onOpenAdminPanel,
  onNavigate,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);

      const sections = ['hero', 'showcase', 'about', 'workflow', 'contact'];
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180 && rect.bottom >= 160) {
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
    { name: 'Catálogo TI', href: '#showcase', id: 'showcase' },
    { name: 'Sobre Mí', href: '#about', id: 'about' },
    { name: 'Proceso', href: '#workflow', id: 'workflow' },
    { name: 'Contacto', href: '#contact', id: 'contact' },
  ];

  const handleOpenAdmin = () => {
    if (onOpenAdminAuthOrPanel) {
      onOpenAdminAuthOrPanel();
    } else if (isAdminLoggedIn && onOpenAdminPanel) {
      onOpenAdminPanel();
    } else if (onOpenAdminLogin) {
      onOpenAdminLogin();
    } else if (onOpenAdminPanel) {
      onOpenAdminPanel();
    }
  };

  const handleSelectTheme = (darkValue: boolean) => {
    if (onSetTheme) {
      onSetTheme(darkValue);
    } else if (isDark !== darkValue) {
      onToggleTheme();
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveSection(id);
    if (onNavigate) {
      onNavigate(id);
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? 'bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 py-2.5 sm:py-3 shadow-xs'
          : 'bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-xs py-3 sm:py-4 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 flex items-center justify-between gap-2">
        {/* Brand with Digital Signature & Logo */}
        <a
          id="brand-logo"
          href="#hero"
          onClick={(e) => scrollToSection(e, '#hero', 'hero')}
          className="group flex items-center gap-2 sm:gap-3 focus:outline-hidden min-w-0 shrink-0"
        >
          <DigitalSignature variant="compact" color={isDark ? '#38bdf8' : '#2563eb'} showSubtitle={true} />
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <a
                key={link.id}
                id={`nav-link-${link.id}`}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href, link.id)}
                className={`relative py-1.5 text-sm transition-all duration-200 font-medium whitespace-nowrap ${
                  isActive
                    ? 'text-[#2563eb] dark:text-[#38bdf8] font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <span>{link.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] dark:bg-[#38bdf8] rounded-full animate-fade-in" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Desktop Segmented Theme Switcher (Claro / Oscuro) */}
          <div
            className="hidden sm:inline-flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700"
            role="group"
            aria-label="Selector de tema claro u oscuro"
          >
            <button
              type="button"
              onClick={() => handleSelectTheme(false)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                !isDark
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Activar Tema Claro"
            >
              <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-[#ff7a00]' : ''}`} />
              <span>Claro</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectTheme(true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#1d4ed8] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Activar Tema Oscuro"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Oscuro</span>
            </button>
          </div>

          {/* Mobile Quick Theme Toggle Button (44x44px touch target) */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            className="sm:hidden min-w-[42px] min-h-[42px] px-2.5 flex items-center justify-center gap-1 rounded-full text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all cursor-pointer"
            title={isDark ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-[#ff7a00]" />
                <span className="text-[11px] font-bold">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#2563eb]" />
                <span className="text-[11px] font-bold">Oscuro</span>
              </>
            )}
          </button>

          {/* Admin Shield Button */}
          <button
            id="nav-admin-shield-btn"
            type="button"
            onClick={handleOpenAdmin}
            className={`min-h-[42px] sm:min-h-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
              isAdminLoggedIn
                ? 'bg-blue-50 text-[#2563eb] border-blue-300 dark:bg-blue-950/60 dark:text-[#38bdf8] dark:border-blue-700 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
            }`}
            title={
              isAdminLoggedIn
                ? 'Abrir Panel Administrativo (admin.html)'
                : 'Acceso al Panel Administrativo (admin.html)'
            }
          >
            <ShieldCheck
              className={`w-4 h-4 ${
                isAdminLoggedIn ? 'text-[#2563eb] dark:text-[#38bdf8]' : 'text-slate-500 dark:text-slate-400'
              }`}
            />
            <span className="hidden md:inline">{isAdminLoggedIn ? 'Panel Admin' : 'Admin'}</span>
            {isAdminLoggedIn && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
          </button>

          {/* Contact CTA Button */}
          <a
            id="nav-contact-cta"
            href="#contact"
            onClick={(e) => scrollToSection(e, '#contact', 'contact')}
            className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1d4ed8] hover:bg-[#1e40af] rounded-full transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <span>Contacto</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>

          {/* Mobile Hamburger Menu Button (44x44px hitbox) */}
          <button
            id="mobile-menu-toggle"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú de navegación"
            className="lg:hidden min-w-[42px] min-h-[42px] flex items-center justify-center rounded-full text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-95 transition-transform cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="lg:hidden bg-white dark:bg-[#0f1523] border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 shadow-2xl animate-fade-in max-h-[85dvh] overflow-y-auto"
        >
          <div className="flex flex-col space-y-1.5">
            {/* Explicit Mobile Theme Selector Card */}
            <div className="p-3 mb-2 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Apariencia de la Página
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTheme(false)}
                  className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    !isDark
                      ? 'bg-white text-slate-900 border-[#2563eb] ring-2 ring-blue-500/20 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'
                  }`}
                >
                  <Sun className="w-4 h-4 text-[#ff7a00]" />
                  <span>Tema Claro</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTheme(true)}
                  className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-[#1d4ed8] text-white border-[#1d4ed8] shadow-sm'
                      : 'bg-slate-100 text-slate-600 border-transparent'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Tema Oscuro</span>
                </button>
              </div>
            </div>

            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => scrollToSection(e, link.href, link.id)}
                className={`min-h-[46px] text-sm px-4 rounded-xl transition-colors flex items-center justify-between font-medium ${
                  activeSection === link.id
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-[#2563eb] dark:text-[#38bdf8] font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <span>{link.name}</span>
                <ArrowUpRight className="w-4 h-4 opacity-70" />
              </a>
            ))}

            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleOpenAdmin();
                }}
                className={`min-h-[48px] w-full flex items-center justify-center gap-2 px-4 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                  isAdminLoggedIn
                    ? 'bg-blue-50 text-[#2563eb] border-blue-300 dark:bg-blue-950/60 dark:text-[#38bdf8] dark:border-blue-800'
                    : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#2563eb] dark:text-[#38bdf8]" />
                <span>
                  {isAdminLoggedIn ? 'Abrir Panel Admin (admin.html)' : 'Gestionar Web • Panel Admin'}
                </span>
              </button>

              <a
                href="#contact"
                onClick={(e) => scrollToSection(e, '#contact', 'contact')}
                className="min-h-[48px] w-full flex items-center justify-center gap-2 px-4 text-xs font-bold text-white bg-[#1d4ed8] active:bg-[#1e40af] rounded-xl shadow-sm"
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

