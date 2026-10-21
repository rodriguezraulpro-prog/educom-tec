import React, { useState } from 'react';
import { X, Plus, Image as ImageIcon, Sparkles, Layers } from 'lucide-react';
import { ProductOrProject } from '../types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: ProductOrProject) => void;
}

const PRESET_IMAGES = [
  { label: 'UI / Figma', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Fintech / Deck', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Arquitectura / Web', url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Minimal / Studio', url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Editorial / Brand', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Abstract 3D Vector', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<'systems' | 'web-apps' | 'it-support' | 'networks' | 'digital-product'>('systems');
  const [price, setPrice] = useState('Consultar Cotización');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [tags, setTags] = useState('ERP, PostgreSQL, Docker, Soporte');
  const [features, setFeatures] = useState('Monitoreo en tiempo real y backups automáticos\nInterfaz optimizada para alto volumen de operaciones\nSoporte técnico directo con SLA garantizado');
  const [status, setStatus] = useState<'Disponible' | 'En desarrollo' | 'Caso de estudio'>('Disponible');
  const [demoUrl, setDemoUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const categoryLabels: Record<string, string> = {
      'systems': 'Sistemas & ERP',
      'web-apps': 'Desarrollo Web & Apps',
      'it-support': 'Soporte TI & Mesa de Ayuda',
      'networks': 'Redes & Conectividad',
      'digital-product': 'Software & Herramientas',
    };

    const newProduct: ProductOrProject = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Nuevo lanzamiento de producto digital',
      category,
      categoryLabel: categoryLabels[category] || 'Producto Digital',
      description: description.trim(),
      longDescription: longDescription.trim() || description.trim(),
      imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      price: price.trim(),
      status,
      demoUrl: demoUrl.trim() || '',
      features: features.split('\n').map((f) => f.trim()).filter(Boolean),
      technologies: tags.split(',').map((t) => t.trim()).slice(0, 4),
      year: new Date().getFullYear().toString(),
      deliverables: ['Archivos de diseño', 'Código fuente', 'Licencia de uso comercial'],
    };

    onAddProduct(newProduct);
    onClose();
  };

  return (
    <div
      id="add-product-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="add-product-modal-content"
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#181a1b] rounded-3xl border border-[#2d3134] shadow-2xl p-6 sm:p-8 custom-deck-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#2d3134] mb-6">
          <div>
            <span className="text-[10px] font-mono text-[#9ebd13] uppercase font-bold tracking-widest block mb-1">
              REGISTRO DE NUEVO ENTREGABLE // PORTAFOLIO
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-syne">
              Añadir Producto o Proyecto
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#232628] text-zinc-400 hover:text-white border border-[#2d3134] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Título del Producto / Proyecto *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Minimal Deck System"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#9ebd13] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Subtítulo o Breve Eslogan
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej: Plantilla de presentación interactiva"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#9ebd13] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] transition-colors cursor-pointer"
              >
                <option value="systems">Sistemas de Gestión & ERP</option>
                <option value="web-apps">Desarrollo Web & Aplicaciones</option>
                <option value="it-support">Soporte TI & Mesa de Ayuda</option>
                <option value="networks">Redes & Conectividad</option>
                <option value="digital-product">Software & Herramientas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Precio o Modalidad
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Ej: $29 USD, A medida, Gratis"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#9ebd13] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Estado
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#9ebd13] transition-colors cursor-pointer"
              >
                <option value="Disponible">Disponible</option>
                <option value="En desarrollo">En desarrollo</option>
                <option value="Caso de estudio">Caso de estudio</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Descripción Corta *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumen ejecutivo del producto en 1 o 2 oraciones..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#9ebd13] transition-colors"
            />
          </div>

          {/* Preset image picker */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Imagen de Portada (Preajustes o URL directa)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
              {PRESET_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    imageUrl === preset.url
                      ? 'border-[#9ebd13] ring-2 ring-[#9ebd13]/30'
                      : 'border-[#2d3134] opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] text-zinc-300 text-center py-0.5 truncate px-1">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#9ebd13] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Etiquetas / Tecnologías (separadas por coma)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Figma, React, Tailwind, UI"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#9ebd13] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Enlace a Demo o Web Externa
              </label>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://ejemplo.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#9ebd13] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
              Características Clave (una por línea)
            </label>
            <textarea
              rows={3}
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="Ventaja o funcionalidad 1&#10;Ventaja o funcionalidad 2"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#9ebd13] transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2d3134]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-syne font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:bg-[#232628] rounded-full border border-[#2d3134] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-syne font-bold uppercase tracking-wider bg-[#9ebd13] hover:bg-[#accf16] text-[#121315] rounded-full transition-all shadow-md cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Publicar en Portafolio</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
