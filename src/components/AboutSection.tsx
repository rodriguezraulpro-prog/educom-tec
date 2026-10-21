import React from 'react';
import {
  User,
  Briefcase,
  Wrench,
  Compass,
  Sparkles,
  MapPin,
  Mail,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { DigitalSignature } from './DigitalSignature';

interface AboutSectionProps {
  profile: UserProfile;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ profile }) => {
  return (
    <section id="about" className="py-20 bg-white dark:bg-[#0b0f19] border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800 text-xs font-semibold text-[#2563eb] dark:text-[#38bdf8] mb-3">
            <User className="w-3.5 h-3.5" />
            <span>Perfil Profesional & Trayectoria</span>
          </div>
          <h2
            id="about-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-sans"
          >
            Sobre Mí & Enfoque Educom-Tec
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            Diagnóstico con precisión y resuelvo con agilidad. Como especialista técnico, garantizo la continuidad operativa de su empresa mediante soporte de alto nivel, desarrollo de software y despliegue de redes corporativas.
          </p>
        </div>

        {/* Bio Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-start">
          
          {/* Left Column: Portrait, Signature & Direct Info Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
              
              {/* Circular portrait frame & Name */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-amber-400 p-0.5 shadow-md shrink-0 bg-amber-50 dark:bg-slate-800">
                  <img
                    src={profile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                    alt={profile.name}
                    className="w-full h-full object-cover rounded-full filter contrast-105"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-sans text-xl font-bold text-slate-900 dark:text-white truncate">
                    {profile.name}
                  </h3>
                  <p className="text-xs text-[#2563eb] dark:text-[#38bdf8] font-semibold truncate">
                    {profile.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{profile.location}</span>
                  </div>
                </div>
              </div>

              {/* Verified Digital Signature */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 mb-6">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                  Firma Profesional Verificada:
                </span>
                <DigitalSignature variant="badge" color="#2563eb" />
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                {profile.bio}
              </p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Disponibilidad:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {profile.availability}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email directo:</span>
                  <a
                    href={`mailto:${profile.email}`}
                    className="font-semibold text-slate-900 dark:text-slate-200 hover:text-[#2563eb] transition-colors"
                  >
                    {profile.email}
                  </a>
                </div>
              </div>
            </div>

            {/* Core Values Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 space-y-3.5 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2563eb] dark:text-[#38bdf8] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#ff7a00]" />
                <span>Pilares de Servicio Educom-Tec</span>
              </h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Soporte TI Proactivo:</strong> Mantenimiento preventivo, resolución de incidencias L1/L2/L3 y atención bajo SLA.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#ff7a00] mt-0.5 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Sistemas Empresariales:</strong> Software ERP, POS y plataformas web diseñadas a la medida de su flujo de trabajo.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2563eb] mt-0.5 shrink-0" />
                  <span><strong className="text-slate-900 dark:text-white">Redes Seguras & Estables:</strong> Segmentación VLAN, VPNs corporativas, switches y routers MikroTik/Cisco.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Experience Timeline & Skills */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Experience Timeline */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                <Briefcase className="w-4 h-4 text-[#2563eb]" />
                <span>Trayectoria Profesional</span>
              </div>

              <div className="space-y-3.5">
                {profile.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400/80 transition-all shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <h4 className="font-sans text-base font-bold text-slate-900 dark:text-white">
                        {exp.role}
                      </h4>
                      <span className="text-xs font-semibold text-[#2563eb] dark:text-[#38bdf8]">
                        {exp.period}
                      </span>
                    </div>
                    <p className="text-xs text-[#ff7a00] font-semibold mb-2">
                      {exp.company}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Skills Matrix */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                <Wrench className="w-4 h-4 text-[#ff7a00]" />
                <span>Stack Tecnológico & Especialidades</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.skills.map((skillGroup, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                  >
                    <h5 className="font-sans text-xs font-bold uppercase text-slate-900 dark:text-white mb-3 tracking-wide">
                      {skillGroup.category}
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {skillGroup.items.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Workflow / Methodology */}
        <div id="workflow" className="pt-14 border-t border-slate-200 dark:border-slate-800">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#2563eb] dark:text-[#38bdf8] mb-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800">
              <Compass className="w-3.5 h-3.5" />
              <span>Metodología de Trabajo</span>
            </div>
            <h3 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              De la Consulta a la Producción
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {profile.workflow.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400/80 transition-all duration-300 flex flex-col justify-between group shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-[#2563eb] dark:text-[#38bdf8] font-sans">
                      {item.step}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">Paso 0{idx + 1}</span>
                  </div>
                  <h4 className="font-sans text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-[#2563eb] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
