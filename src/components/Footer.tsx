import React from 'react';
import { ArrowUp, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../types';
import { DigitalSignature, EducomTecIcon } from './DigitalSignature';

interface FooterProps {
  profile: UserProfile;
}

export const Footer: React.FC<FooterProps> = ({ profile }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070a12] py-14 text-slate-600 dark:text-slate-400 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-slate-100 dark:border-slate-800/80 items-start">
          
          {/* Brand & Signature Column */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 p-2 flex items-center justify-center shadow-xs">
                <EducomTecIcon className="w-full h-full" primaryColor="#2563eb" secondaryColor="#ff7a00" />
              </div>
              <div>
                <p className="text-base font-bold font-sans text-slate-900 dark:text-white tracking-tight">
                  {profile.name}
                </p>
                <p className="text-xs text-[#2563eb] dark:text-[#38bdf8] font-semibold">
                  {profile.title} &bull; Educom-Tec
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
              Soluciones integrales de TI: soporte técnico empresarial, desarrollo de sistemas ERP/POS a medida, diseño web interactivo e infraestructura de redes seguras.
            </p>

            <div className="pt-2">
              <DigitalSignature variant="badge" color="#2563eb" />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3 text-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-2 font-sans">
              Navegación Rápida
            </p>
            <ul className="space-y-2.5 font-medium">
              <li>
                <a href="#hero" className="hover:text-[#2563eb] dark:hover:text-[#38bdf8] transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#2563eb] dark:hover:text-[#38bdf8] transition-colors">
                  Sobre Mí & Enfoque
                </a>
              </li>
              <li>
                <a href="#showcase" className="hover:text-[#2563eb] dark:hover:text-[#38bdf8] transition-colors">
                  Catálogo de Sistemas TI
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-[#2563eb] dark:hover:text-[#38bdf8] transition-colors">
                  Metodología de Trabajo
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#2563eb] dark:hover:text-[#38bdf8] transition-colors">
                  Contacto & Cotización
                </a>
              </li>
            </ul>
          </div>

          {/* Meta & Back to top */}
          <div className="md:col-span-3 space-y-4 text-xs">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-2 font-sans">
              Garantía & Disponibilidad
            </p>
            
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Servicios TI Activos 2026</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Atención remota y presencial para proyectos corporativos y soporte bajo demanda.
              </p>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Volver arriba</span>
            </button>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 dark:text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Raúl Eduardo Rodríguez &bull; Educom-Tec. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Soporte TI</span>
            <span>&bull;</span>
            <span>Desarrollo Web</span>
            <span>&bull;</span>
            <span>Redes & Sistemas</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
