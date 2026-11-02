import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  Check,
  Copy,
  Clock,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  MessageCircle,
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Globe,
  Linkedin,
  Github,
  Phone,
} from 'lucide-react';
import { UserProfile, ProductOrProject } from '../types';
import { DigitalSignature } from './DigitalSignature';

interface ContactSectionProps {
  profile: UserProfile;
  selectedProductForContact?: ProductOrProject | null;
  onClearSelectedProduct?: () => void;
  initialSubject?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  profile,
  selectedProductForContact = null,
  onClearSelectedProduct,
  initialSubject,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subjectType, setSubjectType] = useState('Proyecto a medida');
  const [productRef, setProductRef] = useState('');
  const [message, setMessage] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Sync selected product or initialSubject if passed from showcase
  useEffect(() => {
    if (selectedProductForContact) {
      setSubjectType('Adquisición / Consulta de Producto');
      setProductRef(selectedProductForContact.title);
      setMessage(
        `Hola ${profile.name}, me interesa obtener más información sobre "${selectedProductForContact.title}". Quisiera consultar detalles sobre...`
      );
    } else if (initialSubject) {
      setSubjectType('Adquisición / Consulta de Producto');
      setProductRef(initialSubject);
      setMessage(
        `Hola ${profile.name}, me interesa consultar sobre "${initialSubject}". Quisiera recibir más información...`
      );
    }
  }, [selectedProductForContact, initialSubject, profile.name]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPhone = () => {
    if (profile.whatsappNumber) {
      navigator.clipboard.writeText(profile.whatsappNumber);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const getWhatsAppTargetUrl = () => {
    if (profile.whatsapp) return profile.whatsapp;
    if (profile.whatsappNumber) {
      const clean = profile.whatsappNumber.replace(/[^0-9]/g, '');
      return `https://wa.me/${clean}?text=${encodeURIComponent('Hola Raul, deseo consultar por servicios de Educom-Tec')}`;
    }
    const found = profile.socials.find((s) => s.name.toLowerCase().includes('whatsapp'));
    if (found?.url) return found.url;
    return 'https://wa.me/?text=Hola%20Raul';
  };

  const handleSendWhatsAppDirect = () => {
    let base = profile.whatsapp || '';
    if (!base && profile.whatsappNumber) {
      const clean = profile.whatsappNumber.replace(/[^0-9]/g, '');
      base = `https://wa.me/${clean}`;
    }
    if (!base) {
      const found = profile.socials.find((s) => s.name.toLowerCase().includes('whatsapp'));
      base = found?.url || 'https://wa.me/';
    }
    const cleanBase = base.split('?')[0];
    const textLines = [
      `*Consulta de Servicios TI — Educom-Tec*`,
      `• *Nombre:* ${name.trim() || 'Interesado'}`,
      email.trim() ? `• *Correo:* ${email.trim()}` : null,
      `• *Asunto:* ${subjectType}${productRef ? ` (${productRef})` : ''}`,
      `• *Mensaje:* ${message.trim() || 'Deseo coordinar una cotización o consulta técnica.'}`,
    ].filter(Boolean);

    const fullUrl = `${cleanBase}?text=${encodeURIComponent(textLines.join('\n'))}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const getSocialBrand = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('whatsapp') || lower.includes('telefono') || lower.includes('teléfono')) {
      return { Icon: MessageCircle, color: 'text-emerald-500', border: 'hover:border-emerald-500/60' };
    }
    if (lower.includes('linkedin')) {
      return { Icon: Linkedin, color: 'text-blue-500', border: 'hover:border-blue-500/60' };
    }
    if (lower.includes('github')) {
      return { Icon: Github, color: 'text-slate-800 dark:text-slate-200', border: 'hover:border-slate-500/60' };
    }
    if (lower.includes('instagram')) {
      return { Icon: Instagram, color: 'text-pink-500', border: 'hover:border-pink-500/60' };
    }
    if (lower.includes('facebook')) {
      return { Icon: Facebook, color: 'text-blue-600', border: 'hover:border-blue-600/60' };
    }
    if (lower.includes('youtube')) {
      return { Icon: Youtube, color: 'text-red-500', border: 'hover:border-red-500/60' };
    }
    if (lower.includes('twitter') || lower.includes('x')) {
      return { Icon: Twitter, color: 'text-sky-500', border: 'hover:border-sky-500/60' };
    }
    if (lower.includes('email') || lower.includes('correo') || lower.includes('mail')) {
      return { Icon: Mail, color: 'text-amber-500', border: 'hover:border-amber-500/60' };
    }
    return { Icon: Globe, color: 'text-blue-500', border: 'hover:border-blue-500/60' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  const handleMailtoDirect = () => {
    const subject = encodeURIComponent(`[Educom-Tec] ${subjectType}: ${productRef || 'Consulta TI'}`);
    const body = encodeURIComponent(
      `Hola ${profile.name},\n\nMi nombre es ${name || '[Nombre]'}.\n\n${message}\n\nContacto: ${email}\n`
    );
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="contact" className="py-20 bg-slate-50 dark:bg-[#0c101b] border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="max-w-3xl mb-12 text-center mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800 text-xs font-semibold text-[#2563eb] dark:text-[#38bdf8] mb-3">
            <Mail className="w-3.5 h-3.5" />
            <span>Contacto Directo & Cotizaciones</span>
          </div>
          <h2
            id="contact-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-sans"
          >
            Iniciemos una Conversación
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            ¿Requieres soporte técnico para tu empresa, el desarrollo de un sistema de gestión o el despliegue de redes seguras? Contáctame para coordinar una evaluación o cotización a medida.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Info & Channels */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* WhatsApp Direct Card */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/60 shadow-xs relative overflow-hidden group">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Canal Inmediato · WhatsApp
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold">
                  Respuesta Rápida
                </span>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  ¿Prefieres una consulta ágil? Escríbeme directamente a mi WhatsApp para evaluar tu necesidad técnica.
                </p>

                {profile.whatsappNumber && (
                  <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-800 dark:text-white">
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold">{profile.whatsappNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                      title="Copiar número"
                    >
                      {copiedPhone ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                <a
                  href={getWhatsAppTargetUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-sm hover:shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Iniciar Chat de WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Official Email Card */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-3">
                Correo Electrónico Oficial
              </span>
              
              <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate font-semibold">
                  {profile.email}
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-[#2563eb] transition-colors shrink-0 cursor-pointer"
                  title="Copiar email al portapapeles"
                >
                  {copiedEmail ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="mt-5 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Respuesta estimada: <strong className="text-slate-900 dark:text-white">&lt; 24 horas</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-[#ff7a00] shrink-0" />
                  <span>Especialidad: <strong className="text-slate-900 dark:text-white">Soporte TI, Sistemas & Redes</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Firma: <strong className="text-slate-900 dark:text-white">Educom-Tec &bull; Raul Rodriguez</strong></span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <DigitalSignature variant="badge" color="#2563eb" />
              </div>
            </div>

            {/* Social Links Cards */}
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Presencia Digital & Enlaces
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {profile.socials.map((social, i) => {
                  const brand = getSocialBrand(social.name);
                  const IconComponent = brand.Icon;

                  return (
                    <a
                      key={i}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors group text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <IconComponent className={`w-4 h-4 ${brand.color} shrink-0`} />
                        <span className="truncate">{social.name}</span>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white shrink-0 ml-1" />
                    </a>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              {isSubmitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 mx-auto flex items-center justify-center">
                    <Check className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-sans">
                    ¡Mensaje recibido con éxito!
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    Gracias por comunicarte. Revisaré tu requerimiento y te contactaré a <strong className="text-slate-900 dark:text-white">{email}</strong> a la brevedad.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setName('');
                        setEmail('');
                        setMessage('');
                        setProductRef('');
                        onClearSelectedProduct?.();
                      }}
                      className="min-h-[44px] px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      Enviar otro mensaje
                    </button>
                    <button
                      type="button"
                      onClick={handleMailtoDirect}
                      className="min-h-[44px] px-5 py-2.5 text-xs font-semibold bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <span>Abrir en correo directo</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {(selectedProductForContact || productRef) && (
                    <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0">
                        <span className="text-blue-700 dark:text-blue-300 font-medium block text-[11px]">
                          Consulta sobre sistema / producto:
                        </span>
                        <strong className="text-slate-900 dark:text-white font-bold truncate block">
                          {selectedProductForContact
                            ? `${selectedProductForContact.title} (${selectedProductForContact.price || 'A medida'})`
                            : productRef}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setProductRef('');
                          onClearSelectedProduct?.();
                        }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0 px-2 py-1"
                      >
                        Quitar
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Tu Nombre *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej: Sofia Morales"
                        className="w-full min-h-[44px] px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#2563eb] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Tu Correo Electrónico *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@empresa.com"
                        className="w-full min-h-[44px] px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#2563eb] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Tipo de Servicio
                      </label>
                      <select
                        value={subjectType}
                        onChange={(e) => setSubjectType(e.target.value)}
                        className="w-full min-h-[44px] px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#2563eb] dark:focus:border-[#38bdf8] transition-all font-sans cursor-pointer"
                      >
                        <option value="Soporte Técnico TI">Soporte Técnico TI & Mesa de Ayuda</option>
                        <option value="Desarrollo de Sistemas / ERP">Desarrollo de Sistema / ERP / POS</option>
                        <option value="Desarrollo Web & Apps">Desarrollo Web & Aplicaciones</option>
                        <option value="Redes & Infraestructura">Redes, Cableado & Infraestructura TI</option>
                        <option value="Adquisición / Consulta de Producto">Consulta o Adquisición de Sistema</option>
                        <option value="Consultoría / Auditoría">Consultoría o Auditoría Informática</option>
                        <option value="Otro">Otro requerimiento</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Modalidad
                      </label>
                      <select
                        className="w-full min-h-[44px] px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:border-[#2563eb] dark:focus:border-[#38bdf8] transition-all font-sans cursor-pointer"
                      >
                        <option value="A evaluar">Por evaluar / Diagnóstico previo</option>
                        <option value="Soporte Puntual">Soporte puntual o correctivo</option>
                        <option value="Contrato Mensual">Póliza o contrato de soporte mensual</option>
                        <option value="Proyecto Completo">Desarrollo llave en mano</option>
                        <option value="Implementación Red">Implementación o migración de red</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Detalle del Requerimiento *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe la necesidad técnica de tu empresa, cantidad de equipos, sistemas requeridos..."
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#2563eb] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3">
                    <button
                      type="button"
                      onClick={handleMailtoDirect}
                      className="min-h-[40px] text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center sm:justify-start gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>O enviar vía correo electrónico</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#2563eb]" />
                    </button>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleSendWhatsAppDirect}
                        className="min-h-[46px] inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-full transition-all cursor-pointer shadow-xs"
                        title="Enviar este mensaje directamente a WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Enviar por WhatsApp</span>
                      </button>

                      <button
                        id="submit-contact-form-btn"
                        type="submit"
                        className="min-h-[46px] inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#1d4ed8] hover:bg-[#1e40af] rounded-full transition-all cursor-pointer shadow-sm hover:shadow-md"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Mensaje</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
