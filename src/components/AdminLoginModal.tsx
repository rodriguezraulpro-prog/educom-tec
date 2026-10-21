import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, X, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { getAdminPassword } from '../data/portfolioData';
import { fetchAdminPasswordFromCloud } from '../lib/firestoreService';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const cloudPassword = await fetchAdminPasswordFromCloud();
      const actualPassword = cloudPassword || getAdminPassword();

      if (password.trim() === actualPassword.trim()) {
        setIsSubmitting(false);
        setPassword('');
        onLoginSuccess();
      } else {
        setIsSubmitting(false);
        setError('Contraseña incorrecta. Verifica e intenta de nuevo.');
      }
    } catch {
      const localPwd = getAdminPassword();
      if (password.trim() === localPwd.trim()) {
        setIsSubmitting(false);
        setPassword('');
        onLoginSuccess();
      } else {
        setIsSubmitting(false);
        setError('Contraseña incorrecta.');
      }
    }
  };

  const handleFillDefault = () => {
    setPassword('educom2026');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-900 dark:text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow & Decorative Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2563eb] via-[#38bdf8] to-[#ff7a00]" />

        {/* Close Button */}
        <button
          id="close-login-modal-btn"
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Cerrar modal de acceso"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Shield */}
        <div className="flex flex-col items-center text-center pt-2 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center mb-4 shadow-sm">
            <ShieldCheck className="w-8 h-8 text-[#2563eb] dark:text-[#38bdf8]" />
          </div>
          <span className="text-[11px] font-semibold text-[#2563eb] dark:text-[#38bdf8] tracking-wider uppercase mb-1">
            Administración &bull; Educom-Tec
          </span>
          <h3 className="text-2xl font-bold font-sans text-slate-900 dark:text-white tracking-tight">
            Acceso al Panel de Control
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
            Ingresa tu clave de administrador para gestionar el catálogo, categorías, perfil y enlaces.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Contraseña de Administrador
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ingresa tu clave..."
                className="w-full pl-10 pr-11 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#2563eb] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            id="admin-login-submit-btn"
            type="submit"
            disabled={isSubmitting || !password.trim()}
            className="w-full py-3 px-5 rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Ingresar al Panel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Hint / Default Access Notice */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>Clave inicial predeterminada:</span>
            <code className="text-[#2563eb] dark:text-[#38bdf8] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md font-mono">
              educom2026
            </code>
          </div>
          <button
            type="button"
            onClick={handleFillDefault}
            className="text-[11px] text-slate-500 hover:text-[#2563eb] underline underline-offset-2 transition-colors cursor-pointer self-center"
          >
            Hacer clic aquí para rellenar automáticamente
          </button>
        </div>
      </div>
    </div>
  );
};
