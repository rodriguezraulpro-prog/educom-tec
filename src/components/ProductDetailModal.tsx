import React, { useEffect, useState } from 'react';
import {
  X,
  CheckCircle2,
  ExternalLink,
  Package,
  Layers,
  Send,
  Sparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { ProductOrProject } from '../types';

interface ProductDetailModalProps {
  product: ProductOrProject | null;
  onClose: () => void;
  onContactProduct: (product: ProductOrProject) => void;
}

function normalizeDemoUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onContactProduct,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isDemoPreviewOpen, setIsDemoPreviewOpen] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(product.imageUrl);
      setIsDemoPreviewOpen(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isDemoPreviewOpen) {
          setIsDemoPreviewOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, onClose, isDemoPreviewOpen]);

  if (!product) return null;

  const formattedDemoUrl = normalizeDemoUrl(product.demoUrl);
  const isDataOrPlaceholderDemo =
    formattedDemoUrl.startsWith('data:') ||
    formattedDemoUrl.includes('example.com/');

  // Build list of demo/gallery slides for interactive viewer
  const allSlides = Array.from(
    new Set(
      [
        ...(formattedDemoUrl.startsWith('data:image/') ? [formattedDemoUrl] : []),
        product.imageUrl,
        ...(product.gallery || []),
      ].filter(Boolean)
    )
  );

  const currentSlideIndex = Math.max(0, allSlides.indexOf(selectedImage));

  return (
    <div
      id="product-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="product-detail-modal-content"
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="close-modal-btn"
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-md border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero image preview */}
        <div className="relative aspect-16/9 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden border-b border-slate-200 dark:border-slate-800 group">
          <img
            src={selectedImage || product.imageUrl}
            alt={product.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => setIsDemoPreviewOpen(true)}
            title="Ampliar vista previa"
            className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-xs transition-all cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Ampliar Vista</span>
          </button>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/95 text-slate-800 shadow-sm">
                {product.categoryLabel}
              </span>
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-black/60 text-white backdrop-blur-xs">
                Año {product.year}
              </span>
            </div>
            {product.price && (
              <span className="px-3.5 py-1 text-xs font-bold rounded-full bg-amber-500 text-white shadow-md">
                {product.price}
              </span>
            )}
          </div>
        </div>

        {/* Gallery thumbnails if multiple images */}
        {allSlides.length > 1 && (
          <div className="flex gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
            {allSlides.map((imgUrl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedImage(imgUrl)}
                className={`relative w-20 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  selectedImage === imgUrl
                    ? 'border-[#2563eb] ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={imgUrl}
                  alt={`Captura ${i + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Details Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Title & Subtitle */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563eb] dark:text-[#38bdf8] block mb-1">
              Detalles del Sistema &bull; Educom-Tec
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
              {product.title}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
              {product.subtitle}
            </p>
          </div>

          {/* Long Description */}
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
            <p>{product.longDescription || product.description}</p>
          </div>

          {/* Key Features */}
          {product.features && product.features.length > 0 && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2 font-sans">
                <Sparkles className="w-4 h-4 text-[#ff7a00]" />
                <span>Características & Ventajas Clave</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Deliverables & Tech stack grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.deliverables && product.deliverables.length > 0 && (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5 font-sans">
                  <Package className="w-3.5 h-3.5 text-[#ff7a00]" />
                  <span>Entregables Incluidos</span>
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {product.deliverables.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.technologies && product.technologies.length > 0 && (
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5 font-sans">
                  <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>Tecnologías Utilizadas</span>
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {product.technologies.map((tech, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Garantía de implementación profesional &bull; Educom-Tec</span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer text-center"
              >
                Cerrar
              </button>

              {formattedDemoUrl && (
                <a
                  href={isDataOrPlaceholderDemo ? '#demo-preview' : formattedDemoUrl}
                  target={isDataOrPlaceholderDemo ? undefined : '_blank'}
                  rel={isDataOrPlaceholderDemo ? undefined : 'noopener noreferrer'}
                  onClick={(e) => {
                    if (isDataOrPlaceholderDemo) {
                      e.preventDefault();
                      if (formattedDemoUrl.startsWith('data:image/')) {
                        setSelectedImage(formattedDemoUrl);
                      }
                      setIsDemoPreviewOpen(true);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-950/40 hover:bg-[#2563eb] hover:text-white hover:border-[#2563eb] text-[#1d4ed8] dark:text-[#38bdf8] rounded-full transition-all text-center shadow-xs"
                >
                  <span>Ver Demo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                id="modal-contact-product-btn"
                type="button"
                onClick={() => {
                  onContactProduct(product);
                  onClose();
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold bg-[#1d4ed8] hover:bg-[#1e40af] text-white rounded-full transition-all shadow-md cursor-pointer text-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Solicitar / Consultar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Interactive Demo / Captures Lightbox */}
      {isDemoPreviewOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setIsDemoPreviewOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-semibold text-white truncate ml-2">
                  Demo Vista Previa: {product.title}
                </span>
                {allSlides.length > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                    Pantalla {currentSlideIndex + 1} de {allSlides.length}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {formattedDemoUrl && !isDataOrPlaceholderDemo && (
                  <a
                    href={formattedDemoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#2563eb] hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Abrir URL Externa</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsDemoPreviewOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Demo Image Area */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[440px]">
              <img
                src={selectedImage || product.imageUrl}
                alt={product.title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[70vh] object-contain"
              />

              {allSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx = (currentSlideIndex - 1 + allSlides.length) % allSlides.length;
                      setSelectedImage(allSlides[prevIdx]);
                    }}
                    className="absolute left-3 p-2.5 rounded-full bg-black/70 hover:bg-[#2563eb] text-white border border-white/15 transition-colors cursor-pointer"
                    aria-label="Captura anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (currentSlideIndex + 1) % allSlides.length;
                      setSelectedImage(allSlides[nextIdx]);
                    }}
                    className="absolute right-3 p-2.5 rounded-full bg-black/70 hover:bg-[#2563eb] text-white border border-white/15 transition-colors cursor-pointer"
                    aria-label="Siguiente captura"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Thumbnails & CTA */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto">
                {allSlides.map((slide, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(slide)}
                    className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImage === slide
                        ? 'border-blue-500 scale-105'
                        : 'border-slate-700 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={slide} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDemoPreviewOpen(false);
                  onContactProduct(product);
                  onClose();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2563eb] hover:bg-blue-600 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Solicitar Demo en Vivo Personalizada</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

