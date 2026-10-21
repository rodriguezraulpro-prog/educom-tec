import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { UserProfile } from '../types';

interface FloatingWhatsAppProps {
  profile: UserProfile;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ profile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDismissedBadge, setHasDismissedBadge] = useState(false);

  // Derive the target WhatsApp URL
  const whatsappUrl =
    profile.whatsapp ||
    profile.socials.find((s) => s.name.toLowerCase().includes('whatsapp'))?.url ||
    (profile.whatsappNumber
      ? `https://wa.me/${profile.whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(
          profile.name
        )},%20deseo%20consultar%20por%20servicios%20de%20TI.`
      : 'https://wa.me/?text=Hola%20Raul,%20deseo%20consultar%20por%20servicios%20de%20Educom-Tec');

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 print:hidden">
      {/* Floating Chat Bubble / Mini Card */}
      {isOpen && (
        <div className="mb-2 w-72 sm:w-80 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-fade-in text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white font-sans">{profile.name}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">En línea · Respuesta rápida</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
              👋 ¡Hola! ¿Necesitas soporte técnico, desarrollo de sistemas o infraestructura de redes?
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-xs tracking-wide transition-all shadow-md cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Abrir Chat de WhatsApp</span>
          </a>
        </div>
      )}

      {/* Main Floating Button */}
      <div className="flex items-center gap-2">
        {!isOpen && !hasDismissedBadge && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 shadow-xl animate-fade-in font-medium">
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>¿Hablamos por WhatsApp?</span>
            <button
              type="button"
              onClick={() => setHasDismissedBadge(true)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 cursor-pointer"
              title="Cerrar aviso"
            >
              ×
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Contacto directo por WhatsApp"
          aria-label="Abrir chat de WhatsApp"
        >
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900 animate-ping opacity-75" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-current transition-transform group-hover:scale-110" />
        </button>
      </div>
    </div>
  );
};
