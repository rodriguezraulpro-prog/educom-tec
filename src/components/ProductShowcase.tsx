import React, { useState, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpRight,
  Sparkles,
  Tag,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { ProductOrProject, CategoryId, ShowcaseCategory } from '../types';
import { initialCategories } from '../data/portfolioData';

interface ProductShowcaseProps {
  products: ProductOrProject[];
  categories?: ShowcaseCategory[];
  onSelectProduct: (product: ProductOrProject) => void;
  onOpenAddModal?: () => void;
  onContactProduct: (product: ProductOrProject) => void;
  isAdminLoggedIn?: boolean;
  onOpenAdminPanel?: () => void;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  products,
  categories = initialCategories,
  onSelectProduct,
  onOpenAddModal: _onOpenAddModal,
  onContactProduct,
  isAdminLoggedIn = false,
  onOpenAdminPanel,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'az' | 'price'>('recent');

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subtitle.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          p.technologies.some((tech) => tech.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'az') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'price') {
      list.sort((a, b) => (b.price || '').localeCompare(a.price || ''));
    }

    return list;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <section id="showcase" className="py-20 bg-slate-50 dark:bg-[#0c101b] border-t border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800 text-xs font-semibold text-[#2563eb] dark:text-[#38bdf8] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#ff7a00]" />
            <span>Catálogo TI & Soluciones Listas</span>
          </div>
          <h2
            id="showcase-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white font-sans"
          >
            Sistemas & Soluciones TI
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            Explora software ERP/POS listo para operar, sistemas de mesa de ayuda, aplicaciones web a medida y soluciones de conectividad para empresas.
          </p>
        </div>

        {/* Filter and Navigation Toolbar */}
        <div className="space-y-4 pb-6 mb-6 sm:mb-8 border-b border-slate-200 dark:border-slate-800">
          {/* Top Row: Search Input & View Mode Controls */}
          <div className="flex flex-row items-center justify-between gap-2.5 sm:gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="search-product-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar sistema, ERP, POS o tecnología..."
                className="w-full min-h-[44px] pl-10 pr-9 py-2.5 text-sm rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#2563eb] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shrink-0 shadow-xs">
              <button
                type="button"
                id="view-grid-btn"
                onClick={() => setViewMode('grid')}
                className={`min-w-[38px] min-h-[36px] flex items-center justify-center rounded-full text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Vista en tarjetas"
                aria-label="Vista en tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                id="view-list-btn"
                onClick={() => setViewMode('list')}
                className={`min-w-[38px] min-h-[36px] flex items-center justify-center rounded-full text-xs transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Vista en lista"
                aria-label="Vista en lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Swipeable Category Tabs on Mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  id={`cat-btn-${cat.id}`}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`min-h-[40px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer border shrink-0 ${
                    isSelected
                      ? 'bg-[#1d4ed8] text-white border-[#1d4ed8] shadow-sm shadow-blue-500/20'
                      : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold tabular-nums ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {isAdminLoggedIn && onOpenAdminPanel && (
              <button
                type="button"
                onClick={onOpenAdminPanel}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full bg-blue-50 hover:bg-blue-100 text-[#2563eb] border border-blue-200 dark:bg-blue-950/40 dark:text-[#38bdf8] dark:border-blue-800 transition-colors cursor-pointer shrink-0"
                title="Editar o añadir nuevas categorías en el Panel Administrativo"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>+ Categorías</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6 font-medium">
          <span>
            Mostrando <strong className="text-slate-900 dark:text-white font-bold">{filteredProducts.length}</strong> soluciones disponibles
          </span>
          {searchQuery && (
            <span>
              Filtro: &ldquo;<strong className="text-[#ff7a00]">{searchQuery}</strong>&rdquo;
            </span>
          )}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 shadow-xs">
            <Tag className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">
              No se encontraron productos o proyectos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              No hay elementos que coincidan con la búsqueda &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-4 min-h-[44px] px-5 py-2.5 text-xs font-semibold text-white bg-[#1d4ed8] rounded-full hover:bg-[#1e40af] transition-colors shadow-xs cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        )}

        {/* GRID VIEW */}
        {viewMode === 'grid' && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-blue-400/80 dark:hover:border-blue-600 transition-all duration-300 shadow-xs hover:shadow-xl sm:hover:-translate-y-1"
              >
                {/* Thumbnail Container */}
                <div
                  className="relative aspect-16/10 w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer"
                  onClick={() => onSelectProduct(product)}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Category Pill */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-800 dark:text-slate-200 shadow-sm backdrop-blur-xs">
                      {product.categoryLabel}
                    </span>
                  </div>

                  {product.price && (
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500 text-white shadow-md">
                        {product.price}
                      </span>
                    </div>
                  )}

                  {/* Hover / Mobile tap icon */}
                  <div className="absolute bottom-3 right-3 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <span className="p-2 rounded-full bg-[#1d4ed8] text-white inline-flex items-center justify-center shadow-lg">
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-col flex-1 p-4 sm:p-6">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-medium text-slate-400">
                      Año: {product.year}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        product.status === 'Disponible'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      ● {product.status}
                    </span>
                  </div>

                  <h3
                    onClick={() => onSelectProduct(product)}
                    className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#2563eb] dark:group-hover:text-[#38bdf8] transition-colors cursor-pointer line-clamp-1 font-sans"
                  >
                    {product.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 font-medium">
                    {product.subtitle}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 line-clamp-2 leading-relaxed flex-1">
                    {product.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {product.tags.slice(0, 3).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Card Actions (42px+ touch targets for mobile phones) */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="min-h-[42px] flex-1 py-2 px-3 text-xs font-semibold text-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      Ver Detalles
                    </button>
                    <button
                      type="button"
                      onClick={() => onContactProduct(product)}
                      className="min-h-[42px] py-2 px-4 text-xs font-semibold rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white transition-colors cursor-pointer shadow-xs"
                      title="Solicitar o consultar por este producto"
                    >
                      Consultar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && filteredProducts.length > 0 && (
          <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                id={`product-list-${product.id}`}
                className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 py-5 hover:bg-white dark:hover:bg-slate-900/60 px-3 sm:px-4 rounded-2xl transition-colors"
              >
                {/* Thumbnail & Title */}
                <div
                  className="flex items-start gap-3.5 sm:gap-4 cursor-pointer flex-1 w-full"
                  onClick={() => onSelectProduct(product)}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-semibold text-[#2563eb] dark:text-[#38bdf8]">
                        {product.categoryLabel}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {product.year}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#2563eb] transition-colors font-sans">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {product.subtitle}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-2 sm:line-clamp-1 max-w-xl">
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Right Metadata & Actions */}
                <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80">
                  <div className="text-left md:text-right">
                    <span className="text-sm font-bold text-[#ff7a00] block">
                      {product.price || 'A medida'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{product.status}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="min-h-[42px] px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      Detalles
                    </button>
                    <button
                      type="button"
                      onClick={() => onContactProduct(product)}
                      className="min-h-[42px] px-4 py-2 text-xs font-semibold rounded-xl bg-[#1d4ed8] hover:bg-[#1e40af] text-white transition-colors cursor-pointer shadow-xs"
                    >
                      Consultar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
