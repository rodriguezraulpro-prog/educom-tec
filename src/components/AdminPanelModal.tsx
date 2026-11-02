import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldCheck,
  Package,
  Layers,
  User,
  Phone,
  Briefcase,
  Wrench,
  Key,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  LogOut,
  CheckCircle,
  ExternalLink,
  Upload,
  Check,
  MessageCircle,
  Instagram,
  Facebook,
  Globe,
  Youtube,
  Download,
  LayoutDashboard,
  Search,
  ArrowUp,
  ArrowDown,
  Copy,
  Database,
  RefreshCw,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  FileJson,
  GraduationCap,
  Award,
  AlertTriangle,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';
import {
  ProductOrProject,
  UserProfile,
  ShowcaseCategory,
} from '../types';
import {
  saveProducts,
  saveProfile,
  saveCategories,
  setAdminPassword,
  getAdminPassword,
  resetPortfolioData,
} from '../data/portfolioData';
import {
  fetchAdminPasswordFromCloud,
  saveAdminPasswordToCloud,
  deleteProductFromCloud,
  getNocoDBConfig,
  saveNocoDBConfig,
  syncAllProductsToCloud,
  syncCategoriesToCloud,
  saveProfileToCloud,
  NocoDBConfig,
} from '../lib/firestoreService';
import {
  downloadStandaloneHtml,
  downloadStandaloneAdminHtml,
} from '../utils/exportStandaloneHtml';

async function compressImageFile(file: File, maxWidth = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer la imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen inválido'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductOrProject[];
  categories: ShowcaseCategory[];
  profile: UserProfile;
  onUpdateProducts: (products: ProductOrProject[]) => void;
  onUpdateCategories: (categories: ShowcaseCategory[]) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onLogout: () => void;
  isFullPage?: boolean;
  isAuthenticated?: boolean;
  cloudPassword?: string | null;
  onLoginSuccess?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
  onSetTheme?: (dark: boolean) => void;
}

type AdminTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'profile'
  | 'skills'
  | 'experience'
  | 'contact'
  | 'security';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  profile,
  onUpdateProducts,
  onUpdateCategories,
  onUpdateProfile,
  onLogout,
  isFullPage = true,
  isAuthenticated = true,
  cloudPassword = null,
  onLoginSuccess,
  isDark = true,
  onToggleTheme,
  onSetTheme,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Full-page Login Gate state
  const [loginInput, setLoginInput] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Local draft states
  const [draftProducts, setDraftProducts] = useState<ProductOrProject[]>(products);
  const [draftCategories, setDraftCategories] = useState<ShowcaseCategory[]>(categories);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);

  // Catalog filter & search inside Admin
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCatFilter, setAdminCatFilter] = useState<string>('all');

  // Editing product state
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<ProductOrProject>>({});
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // New Category input
  const [newCatId, setNewCatId] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // NocoDB configuration state
  const [nocoConfig, setNocoConfig] = useState<NocoDBConfig>(() => getNocoDBConfig());
  const [isSyncingNoco, setIsSyncingNoco] = useState(false);

  // Experience editing
  const [editingExpIdx, setEditingExpIdx] = useState<number | null>(null);
  const [expForm, setExpForm] = useState({ role: '', company: '', period: '', description: '' });
  const [isAddingExp, setIsAddingExp] = useState(false);

  // Skill category & certifications editing
  const [newSkillCatName, setNewSkillCatName] = useState('');
  const [newSkillItem, setNewSkillItem] = useState<{ catIdx: number; text: string }>({ catIdx: -1, text: '' });
  const [editingSkillCatIdx, setEditingSkillCatIdx] = useState<number | null>(null);
  const [editingSkillCatName, setEditingSkillCatName] = useState('');
  const [newCertText, setNewCertText] = useState('');
  const [eduForm, setEduForm] = useState({ degree: '', institution: '', year: '' });

  // Contact & Socials state
  const [whatsappPhone, setWhatsappPhone] = useState(profile.whatsappNumber || '');
  const [whatsappMessage, setWhatsappMessage] = useState('Hola Raul, deseo consultar por servicios de Educom-Tec.');
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [isAddingSocial, setIsAddingSocial] = useState(false);

  const handleSelectTheme = (darkVal: boolean) => {
    if (onSetTheme) {
      onSetTheme(darkVal);
    } else if (onToggleTheme && isDark !== darkVal) {
      onToggleTheme();
    } else {
      const root = document.documentElement;
      if (darkVal) root.classList.add('dark');
      else root.classList.remove('dark');
      try {
        localStorage.setItem('educom_theme_mode', darkVal ? 'dark' : 'light');
      } catch {
        // Ignore
      }
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      setDraftProducts(products);
      setDraftCategories(categories);
      setDraftProfile(profile);

      let initialPhone = profile.whatsappNumber || '';
      if (!initialPhone && profile.whatsapp) {
        const match = profile.whatsapp.match(/wa\.me\/([0-9+]+)/);
        if (match && match[1]) {
          initialPhone = `+${match[1].replace('+', '')}`;
        }
      }
      if (!initialPhone) {
        const waSocial = profile.socials.find(
          (s) => s.name.toLowerCase().includes('whatsapp') || s.name.toLowerCase().includes('teléfono')
        );
        if (waSocial?.url) {
          const match = waSocial.url.match(/wa\.me\/([0-9+]+)/);
          if (match && match[1]) {
            initialPhone = `+${match[1].replace('+', '')}`;
          }
        }
      }
      setWhatsappPhone(initialPhone);
    }
  }, [isOpen, products, categories, profile]);

  const filteredAdminProducts = useMemo(() => {
    return draftProducts.filter((p) => {
      const matchesCat = adminCatFilter === 'all' || p.category === adminCatFilter;
      const q = adminSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
  }, [draftProducts, adminCatFilter, adminSearch]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // ----------------------------------------------------
  // FULL-PAGE ADMIN LOGIN SCREEN (When visiting admin.html unauthenticated)
  // ----------------------------------------------------
  const handleAdminPageLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const trimmed = loginInput.trim();
    try {
      const remotePass = cloudPassword || (await fetchAdminPasswordFromCloud());
      const actualPass = (remotePass || getAdminPassword()).trim();
      if (trimmed === actualPass) {
        setLoginInput('');
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setLoginError('Contraseña incorrecta. Verifica tu clave de administrador.');
      }
    } catch {
      if (trimmed === getAdminPassword().trim()) {
        setLoginInput('');
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setLoginError('Contraseña incorrecta. Verifica tu clave de administrador.');
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden transition-colors duration-300">
        <div className="max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00c2b2] to-[#2563eb] flex items-center justify-center text-white shadow-lg shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold font-syne text-slate-900 dark:text-white tracking-tight block">
                Educom-Tec // Admin Center
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 block">
                admin.html • consola de gestión y NocoDB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Switcher on Login Screen */}
            <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-[#161b22] border border-slate-300 dark:border-[#2d3542]">
              <button
                type="button"
                onClick={() => handleSelectTheme(false)}
                className={`min-h-[36px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-[#ff7a00]" />
                <span>Claro</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTheme(true)}
                className={`min-h-[36px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Oscuro</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#161b22] hover:bg-slate-100 dark:hover:bg-[#1f2630] border border-slate-200 dark:border-[#2d3542] text-xs font-mono text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Volver a la Web Pública</span>
              <span className="sm:hidden">Web</span>
            </button>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto my-auto py-8 sm:py-12">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#12161f] border border-slate-200 dark:border-[#262d3a] shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#00c2b2]/15 border border-[#00c2b2]/40 text-[#00a396] dark:text-[#00c2b2] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold font-syne text-slate-900 dark:text-white tracking-tight">
                Acceso al Panel Admin
              </h1>
              <p className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                Ingresa tu clave administrativa para gestionar el catálogo de sistemas, perfil y base de datos NocoDB desde tu PC o teléfono móvil.
              </p>
            </div>

            <form onSubmit={handleAdminPageLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 uppercase mb-1.5">
                  Contraseña de Administrador
                </label>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Ingresa tu contraseña..."
                    autoFocus
                    className="w-full min-h-[46px] pl-4 pr-11 py-3 rounded-xl bg-slate-50 dark:bg-[#0b0e14] border border-slate-300 dark:border-[#2d3542] text-slate-900 dark:text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white p-2 cursor-pointer"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-xs font-mono text-red-600 dark:text-red-300">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] py-3 px-5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs shadow-lg transition-all cursor-pointer"
              >
                Ingresar al Centro de Control
              </button>
            </form>

            <div className="pt-4 border-t border-slate-200 dark:border-[#262d3a] flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-500">
              <span>NocoDB Base: {nocoConfig.baseId}</span>
              <span className="text-emerald-600 dark:text-[#00c2b2] font-semibold">● Cloud Ready</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl w-full mx-auto text-center text-xs font-mono text-slate-400 dark:text-zinc-500">
          Educom-Tec — Soluciones Informáticas & Sistemas • Raúl Eduardo Rodríguez
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // PRODUCTS LOGIC
  // ----------------------------------------------------
  const handleStartEditProduct = (prod: ProductOrProject) => {
    setActiveTab('products');
    setEditingProductId(prod.id);
    setProductForm({
      ...prod,
      gallery: prod.gallery || (prod.imageUrl ? [prod.imageUrl] : []),
    });
    setNewGalleryUrl('');
    setIsCreatingProduct(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartCreateProduct = () => {
    setActiveTab('products');
    setIsCreatingProduct(true);
    setEditingProductId('new');
    setNewGalleryUrl('');
    setProductForm({
      id: `sys-${Date.now()}`,
      title: '',
      subtitle: '',
      category: draftCategories[1]?.id || 'systems',
      categoryLabel: draftCategories[1]?.label || 'Sistemas ERP & Gestión',
      price: 'Consultar Cotización',
      status: 'Disponible',
      description: '',
      longDescription: '',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      gallery: [],
      tags: ['Sistemas', 'ERP', 'Gestión'],
      technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      features: ['Control de stock en tiempo real', 'Reportes automatizados', 'Acceso multiusuario'],
      deliverables: ['Código fuente o despliegue Cloud', 'Base de datos configurada', 'Soporte y capacitación'],
      year: new Date().getFullYear().toString(),
      demoUrl: '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateProduct = (prod: ProductOrProject) => {
    const copy: ProductOrProject = {
      ...prod,
      id: `sys-${Date.now()}`,
      title: `${prod.title} (Copia)`,
    };
    const updatedList = [copy, ...draftProducts];
    setDraftProducts(updatedList);
    saveProducts(updatedList);
    onUpdateProducts(updatedList);
    showToast(`Sistema "${prod.title}" duplicado correctamente.`);
  };

  const handleMoveProduct = (id: string, direction: 'up' | 'down') => {
    const idx = draftProducts.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= draftProducts.length) return;
    const copy = [...draftProducts];
    const [moved] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, moved);
    setDraftProducts(copy);
    saveProducts(copy);
    onUpdateProducts(copy);
    showToast('Orden del catálogo actualizado.');
  };

  const handleSaveProductForm = () => {
    if (!productForm.title?.trim() || !productForm.description?.trim()) {
      showToast('Por favor completa al menos el título y la descripción del sistema.');
      return;
    }

    const targetCategory = draftCategories.find((c) => c.id === productForm.category);
    const categoryLabel = targetCategory ? targetCategory.label : productForm.category || 'General';

    let cleanDemoUrl = (productForm.demoUrl || '').trim();
    if (
      cleanDemoUrl &&
      !cleanDemoUrl.startsWith('http://') &&
      !cleanDemoUrl.startsWith('https://') &&
      !cleanDemoUrl.startsWith('data:') &&
      !cleanDemoUrl.startsWith('/')
    ) {
      cleanDemoUrl = `https://${cleanDemoUrl}`;
    }

    const completeProduct: ProductOrProject = {
      id: productForm.id || `sys-${Date.now()}`,
      title: productForm.title || '',
      subtitle: productForm.subtitle || '',
      category: productForm.category || 'systems',
      categoryLabel,
      description: productForm.description || '',
      longDescription: productForm.longDescription || productForm.description || '',
      imageUrl: productForm.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      gallery: productForm.gallery || [],
      deliverables: productForm.deliverables || [],
      tags: productForm.tags || [],
      technologies: productForm.technologies || [],
      features: productForm.features || [],
      price: productForm.price || 'Consultar Cotización',
      status: (productForm.status as any) || 'Disponible',
      year: productForm.year || new Date().getFullYear().toString(),
      demoUrl: cleanDemoUrl,
      ...(productForm.slideNumber !== undefined ? { slideNumber: productForm.slideNumber } : {}),
      ...(productForm.deckMetrics !== undefined ? { deckMetrics: productForm.deckMetrics } : {}),
    };

    let updatedList: ProductOrProject[];
    if (isCreatingProduct) {
      updatedList = [completeProduct, ...draftProducts];
    } else {
      updatedList = draftProducts.map((p) => (p.id === editingProductId ? completeProduct : p));
    }

    setDraftProducts(updatedList);
    saveProducts(updatedList);
    onUpdateProducts(updatedList);
    setEditingProductId(null);
    setIsCreatingProduct(false);
    showToast('¡Sistema guardado y sincronizado con NocoDB Cloud!');
  };

  const handleDeleteProduct = (id: string, title: string) => {
    const updatedList = draftProducts.filter((p) => p.id !== id);
    setDraftProducts(updatedList);
    saveProducts(updatedList);
    onUpdateProducts(updatedList);
    deleteProductFromCloud(id).catch((e) => console.error('Error deleting product from cloud:', e));
    if (editingProductId === id) {
      setEditingProductId(null);
    }
    showToast(`Sistema "${title}" eliminado del catálogo.`);
  };

  // ----------------------------------------------------
  // CATEGORIES LOGIC
  // ----------------------------------------------------
  const handleAddCategory = () => {
    const rawId = newCatId.trim().toLowerCase().replace(/\s+/g, '-');
    const label = newCatLabel.trim();

    if (!rawId || !label) {
      showToast('Debes ingresar un identificador y un nombre para la categoría.');
      return;
    }

    if (draftCategories.some((c) => c.id === rawId)) {
      showToast('Ya existe una categoría con ese identificador.');
      return;
    }

    const updated = [...draftCategories, { id: rawId, label }];
    setDraftCategories(updated);
    saveCategories(updated);
    onUpdateCategories(updated);
    setNewCatId('');
    setNewCatLabel('');
    showToast('¡Nueva categoría añadida y sincronizada!');
  };

  const handleUpdateCategoryLabel = (id: string, newLabel: string) => {
    const updated = draftCategories.map((c) => (c.id === id ? { ...c, label: newLabel } : c));
    setDraftCategories(updated);
    saveCategories(updated);
    onUpdateCategories(updated);
  };

  const handleDeleteCategory = (id: string) => {
    if (id === 'all') {
      showToast('La categoría principal "Todos los Sistemas" no se puede eliminar.');
      return;
    }
    const updated = draftCategories.filter((c) => c.id !== id);
    setDraftCategories(updated);
    saveCategories(updated);
    onUpdateCategories(updated);
    showToast(`Categoría "${id}" eliminada.`);
  };

  // ----------------------------------------------------
  // PROFILE / ABOUT ME LOGIC
  // ----------------------------------------------------
  const handleSaveProfile = () => {
    saveProfile(draftProfile);
    onUpdateProfile(draftProfile);
    showToast('¡Información de perfil actualizada y sincronizada!');
  };

  // ----------------------------------------------------
  // CONTACT & WHATSAPP LOGIC
  // ----------------------------------------------------
  const handleUpdateContact = (email: string, whatsappUrl: string) => {
    let finalWhatsApp = whatsappUrl.trim();
    if (whatsappPhone.trim()) {
      const cleanDigits = whatsappPhone.replace(/[^0-9]/g, '');
      if (cleanDigits) {
        finalWhatsApp = `https://wa.me/${cleanDigits}${
          whatsappMessage.trim() ? `?text=${encodeURIComponent(whatsappMessage.trim())}` : ''
        }`;
      }
    }

    const updatedSocials = draftProfile.socials.map((s) => {
      if (s.name.toLowerCase().includes('email')) {
        return { ...s, url: `mailto:${email.trim()}` };
      }
      if (s.name.toLowerCase().includes('whatsapp') || s.name.toLowerCase().includes('teléfono')) {
        return { ...s, url: finalWhatsApp };
      }
      return s;
    });

    const updated: UserProfile = {
      ...draftProfile,
      email: email.trim(),
      whatsapp: finalWhatsApp,
      whatsappNumber: whatsappPhone.trim(),
      socials: updatedSocials,
    };

    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
    showToast('¡Datos de contacto, redes sociales y WhatsApp guardados!');
  };

  const handleAddSocialNetwork = (name: string, url: string, icon = 'Globe') => {
    if (!name.trim() || !url.trim()) {
      showToast('Debes indicar el nombre y la dirección URL o teléfono de la red social.');
      return;
    }
    let formattedUrl = url.trim();
    if (name.toLowerCase().includes('whatsapp') && !formattedUrl.startsWith('http')) {
      const cleanDigits = formattedUrl.replace(/[^0-9]/g, '');
      if (cleanDigits) {
        formattedUrl = `https://wa.me/${cleanDigits}${
          whatsappMessage.trim() ? `?text=${encodeURIComponent(whatsappMessage.trim())}` : ''
        }`;
      }
    }
    const updatedSocials = [...draftProfile.socials, { name: name.trim(), url: formattedUrl, icon }];
    const updated: UserProfile = { ...draftProfile, socials: updatedSocials };
    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
    setNewSocialName('');
    setNewSocialUrl('');
    setIsAddingSocial(false);
    showToast(`¡Red social "${name}" agregada!`);
  };

  const handleDeleteSocialNetwork = (index: number) => {
    const target = draftProfile.socials[index];
    const updatedSocials = draftProfile.socials.filter((_, i) => i !== index);
    const updated: UserProfile = { ...draftProfile, socials: updatedSocials };
    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
    showToast(`Enlace "${target?.name || 'Red social'}" eliminado correctamente.`);
  };

  // ----------------------------------------------------
  // EXPERIENCE LOGIC
  // ----------------------------------------------------
  const handleSaveExperience = () => {
    if (!expForm.role || !expForm.company) {
      showToast('Debes indicar al menos el rol y la empresa.');
      return;
    }

    let updatedExp = [...draftProfile.experience];
    if (isAddingExp) {
      updatedExp = [expForm, ...updatedExp];
    } else if (editingExpIdx !== null) {
      updatedExp[editingExpIdx] = expForm;
    }

    const updatedProfile: UserProfile = { ...draftProfile, experience: updatedExp };
    setDraftProfile(updatedProfile);
    saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    setEditingExpIdx(null);
    setIsAddingExp(false);
    showToast('¡Historial profesional actualizado!');
  };

  const handleDeleteExperience = (index: number) => {
    const updatedExp = draftProfile.experience.filter((_, i) => i !== index);
    const updatedProfile: UserProfile = { ...draftProfile, experience: updatedExp };
    setDraftProfile(updatedProfile);
    saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    showToast('Posición eliminada del historial profesional.');
  };

  // ----------------------------------------------------
  // SKILLS, EDUCATION & CERTIFICATIONS LOGIC
  // ----------------------------------------------------
  const handleAddSkillCategory = () => {
    if (!newSkillCatName.trim()) return;
    const updatedSkills = [...draftProfile.skills, { category: newSkillCatName.trim(), items: [] }];
    const updated = { ...draftProfile, skills: updatedSkills };
    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
    setNewSkillCatName('');
    showToast('¡Nueva categoría de habilidades añadida!');
  };

  const handleAddSkillItem = (catIdx: number) => {
    if (!newSkillItem.text.trim()) return;
    const updatedSkills = draftProfile.skills.map((group, idx) =>
      idx === catIdx ? { ...group, items: [...group.items, newSkillItem.text.trim()] } : group
    );
    const updated = { ...draftProfile, skills: updatedSkills };
    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
    setNewSkillItem({ catIdx: -1, text: '' });
  };

  const handleRemoveSkillItem = (catIdx: number, itemIdx: number) => {
    const updatedSkills = draftProfile.skills.map((group, idx) =>
      idx === catIdx ? { ...group, items: group.items.filter((_, i) => i !== itemIdx) } : group
    );
    const updated = { ...draftProfile, skills: updatedSkills };
    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
  };

  const handleDeleteSkillCategory = (catIdx: number) => {
    const updatedSkills = draftProfile.skills.filter((_, i) => i !== catIdx);
    const updated = { ...draftProfile, skills: updatedSkills };
    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
    if (editingSkillCatIdx === catIdx) {
      setEditingSkillCatIdx(null);
      setEditingSkillCatName('');
    }
    showToast('Categoría de habilidades eliminada.');
  };

  const handleSaveSkillCategoryName = (catIdx: number) => {
    if (!editingSkillCatName.trim()) return;
    const updatedSkills = draftProfile.skills.map((group, idx) =>
      idx === catIdx ? { ...group, category: editingSkillCatName.trim() } : group
    );
    const updated = { ...draftProfile, skills: updatedSkills };
    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
    setEditingSkillCatIdx(null);
    setEditingSkillCatName('');
    showToast('¡Nombre de categoría actualizado!');
  };

  // ----------------------------------------------------
  // SECURITY, SYNC & JSON BACKUP LOGIC
  // ----------------------------------------------------
  const handleManualNocoSync = async () => {
    setIsSyncingNoco(true);
    try {
      saveNocoDBConfig(nocoConfig);
      await Promise.all([
        syncAllProductsToCloud(draftProducts),
        syncCategoriesToCloud(draftCategories),
        saveProfileToCloud(draftProfile),
      ]);
      showToast('¡Sincronización completa con NocoDB Cloud exitosa!');
    } catch {
      showToast('Error al sincronizar con NocoDB. Verifica la conexión.');
    } finally {
      setIsSyncingNoco(false);
    }
  };

  const handleExportJsonBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      products: draftProducts,
      categories: draftCategories,
      profile: draftProfile,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `educom-tec-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast('Respaldo JSON descargado exitosamente.');
  };

  const handleImportJsonBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (Array.isArray(parsed.products)) {
          setDraftProducts(parsed.products);
          saveProducts(parsed.products);
          onUpdateProducts(parsed.products);
        }
        if (Array.isArray(parsed.categories)) {
          setDraftCategories(parsed.categories);
          saveCategories(parsed.categories);
          onUpdateCategories(parsed.categories);
        }
        if (parsed.profile && typeof parsed.profile === 'object') {
          setDraftProfile(parsed.profile);
          saveProfile(parsed.profile);
          onUpdateProfile(parsed.profile);
        }
        showToast('¡Respaldo JSON importado y aplicado correctamente!');
      } catch {
        showToast('El archivo JSON seleccionado no tiene un formato válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 4) {
      setPasswordError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    setAdminPassword(newPassword);
    saveAdminPasswordToCloud(newPassword).catch((e) => console.error('Cloud password error:', e));
    setNewPassword('');
    setConfirmPassword('');
    showToast('¡Contraseña de administrador actualizada en NocoDB Cloud y localmente!');
  };

  const handleResetFactory = () => {
    if (
      window.confirm(
        '⚠️ ATENCIÓN: ¿Deseas restablecer todos los datos, productos y perfiles a la versión inicial de fábrica de Educom-Tec?'
      )
    ) {
      const reset = resetPortfolioData();
      setDraftProducts(reset.products);
      setDraftCategories(reset.categories);
      setDraftProfile(reset.profile);
      onUpdateProducts(reset.products);
      onUpdateCategories(reset.categories);
      onUpdateProfile(reset.profile);
      showToast('Sistema restablecido a los valores iniciales.');
    }
  };

  const navItems: { id: AdminTab; label: string; shortLabel: string; badge?: string | number; icon: React.ReactNode; group: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard General',
      shortLabel: 'Resumen',
      icon: <LayoutDashboard className="w-4 h-4" />,
      group: 'CENTRO DE CONTROL',
    },
    {
      id: 'products',
      label: 'Catálogo de Sistemas',
      shortLabel: 'Sistemas',
      badge: draftProducts.length,
      icon: <Package className="w-4 h-4" />,
      group: 'CATÁLOGO COMERCIAL',
    },
    {
      id: 'categories',
      label: 'Categorías & Filtros',
      shortLabel: 'Categorías',
      badge: draftCategories.length,
      icon: <Layers className="w-4 h-4" />,
      group: 'CATÁLOGO COMERCIAL',
    },
    {
      id: 'profile',
      label: 'Perfil, Foto & Hero',
      shortLabel: 'Perfil',
      icon: <User className="w-4 h-4" />,
      group: 'MARCA & PORTAFOLIO',
    },
    {
      id: 'skills',
      label: 'Stack TI & Certificaciones',
      shortLabel: 'Stack TI',
      badge: draftProfile.skills.length,
      icon: <Wrench className="w-4 h-4" />,
      group: 'MARCA & PORTAFOLIO',
    },
    {
      id: 'experience',
      label: 'Experiencia Laboral',
      shortLabel: 'Experiencia',
      badge: draftProfile.experience.length,
      icon: <Briefcase className="w-4 h-4" />,
      group: 'MARCA & PORTAFOLIO',
    },
    {
      id: 'contact',
      label: 'Contacto, WhatsApp & Redes',
      shortLabel: 'WhatsApp',
      badge: draftProfile.socials.length,
      icon: <Phone className="w-4 h-4" />,
      group: 'MARCA & PORTAFOLIO',
    },
    {
      id: 'security',
      label: 'Base de Datos NocoDB & Exportar',
      shortLabel: 'NocoDB',
      icon: <Database className="w-4 h-4" />,
      group: 'SISTEMA & NUBE',
    },
  ];

  const demosCount = draftProducts.filter((p) => Boolean(p.demoUrl && p.demoUrl.trim())).length;

  // Shared Dual-Theme classes for inputs & cards inside Admin
  const cardSurface = 'bg-white dark:bg-[#12161f] border border-slate-200/90 dark:border-[#1f2633] shadow-xs';
  const subCardSurface = 'bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-[#262d3a]';
  const inputSurface =
    'bg-slate-50 dark:bg-[#0b0e14] border border-slate-300 dark:border-[#262d3a] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#00c2b2]';
  const btnSecondary =
    'bg-slate-100 hover:bg-slate-200 dark:bg-[#161b26] dark:hover:bg-[#1f2633] border border-slate-200 dark:border-[#262d3a] text-slate-700 dark:text-zinc-200';

  return (
    <div
      className={
        isFullPage
          ? 'min-h-screen w-full bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-zinc-100 flex flex-col transition-colors duration-300'
          : 'fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn'
      }
    >
      <div
        className={
          isFullPage
            ? 'flex-1 flex flex-col w-full min-h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-zinc-100 pb-16 lg:pb-0'
            : 'relative w-full max-w-7xl h-full sm:h-[96vh] flex flex-col sm:rounded-3xl bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-[#262d3a] shadow-2xl text-slate-900 dark:text-zinc-100 overflow-hidden'
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* TOP COMMAND HEADER BAR */}
        {/* ========================================================= */}
        <header className="sticky top-0 z-30 h-15 sm:h-16 px-3 sm:px-6 border-b border-slate-200 dark:border-[#1f2633] bg-white/95 dark:bg-[#0f131c]/95 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#161b26] border border-slate-200 dark:border-[#262d3a] text-slate-700 dark:text-zinc-300 cursor-pointer"
              aria-label="Menú del panel"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#00c2b2] to-[#2563eb] flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-base font-bold font-syne text-slate-900 dark:text-white tracking-tight truncate">
                  Educom-Tec Admin
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00c2b2]/15 border border-[#00c2b2]/40 text-[10px] font-mono text-[#008f82] dark:text-[#00c2b2] font-semibold">
                  admin.html
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono hidden md:block truncate">
                Centro de control • NocoDB Cloud ({nocoConfig.baseId})
              </p>
            </div>
          </div>

          {/* Right Quick Actions (Theme Switcher + Sync + View Site + Logout) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Desktop Segmented Theme Switcher (Claro / Oscuro) */}
            <div className="hidden md:inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-[#161b26] border border-slate-200 dark:border-[#262d3a]">
              <button
                type="button"
                onClick={() => handleSelectTheme(false)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Activar Tema Claro"
              >
                <Sun className="w-3.5 h-3.5 text-[#ff7a00]" />
                <span>Claro</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectTheme(true)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Activar Tema Oscuro"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Oscuro</span>
              </button>
            </div>

            {/* Mobile Quick Theme Toggle Button */}
            <button
              type="button"
              onClick={() => handleSelectTheme(!isDark)}
              className="md:hidden min-w-[38px] min-h-[38px] px-2.5 rounded-xl bg-slate-100 dark:bg-[#161b26] border border-slate-200 dark:border-[#262d3a] flex items-center justify-center gap-1 text-slate-700 dark:text-zinc-200 text-xs font-semibold cursor-pointer"
              title={isDark ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-[#ff7a00]" />
              ) : (
                <Moon className="w-4 h-4 text-[#2563eb]" />
              )}
              <span className="hidden xs:inline text-[11px]">{isDark ? 'Claro' : 'Oscuro'}</span>
            </button>

            <button
              type="button"
              disabled={isSyncingNoco}
              onClick={handleManualNocoSync}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161b26] hover:bg-slate-200 dark:hover:bg-[#1e2534] border border-[#00c2b2]/40 text-[#008f82] dark:text-[#00c2b2] text-xs font-mono font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Sincronizar con NocoDB Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNoco ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline">
                {isSyncingNoco ? 'Sincronizando...' : 'Sincronizar NocoDB'}
              </span>
            </button>

            <button
              id="admin-download-portable-btn"
              type="button"
              onClick={async () => {
                try {
                  showToast('Generando index.html portátil...');
                  await downloadStandaloneHtml('index.html');
                  showToast('¡index.html descargado!');
                } catch {
                  showToast('Error al generar archivo index.html.');
                }
              }}
              className="hidden sm:inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Descargar index.html autónomo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Descargar Web</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold transition-colors cursor-pointer"
              title="Volver a la página pública principal (index.html)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Web Pública</span>
              <span className="sm:hidden">Web</span>
            </button>

            <button
              id="admin-logout-btn"
              type="button"
              onClick={onLogout}
              className="min-h-[38px] inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161b26] hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-300 border border-slate-200 dark:border-[#262d3a] text-xs font-mono transition-colors cursor-pointer"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* MOBILE SWIPEABLE QUICK-TAB STRIP (Visible on Smartphones/Tablets) */}
        {/* ========================================================= */}
        <div className="lg:hidden sticky top-15 z-20 flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 py-2 bg-white/95 dark:bg-[#0f131c]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#1f2633] shrink-0">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== 'products') setEditingProductId(null);
                  setMobileSidebarOpen(false);
                }}
                className={`min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#00c2b2] text-[#0b0e14] font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-[#161b26] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#262d3a]'
                }`}
              >
                {item.icon}
                <span>{item.shortLabel}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      isActive
                        ? 'bg-[#0b0e14]/20 text-[#0b0e14]'
                        : 'bg-white dark:bg-[#0b0e14] text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="bg-[#00c2b2] text-[#0b0e14] font-syne font-bold text-xs py-2.5 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-2 truncate">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs font-mono underline cursor-pointer shrink-0 ml-3"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* MAIN WORKSPACE BODY (SIDEBAR + CONTENT AREA) */}
        {/* ========================================================= */}
        <div className="flex-1 flex min-h-0 relative">
          {/* Mobile Backdrop Overlay */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* Left Navigation Sidebar */}
          <aside
            className={`${
              mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 flex w-72 shadow-2xl' : 'hidden lg:flex w-68'
            } flex-col border-r border-slate-200 dark:border-[#1f2633] bg-white dark:bg-[#0f131c] shrink-0 select-none transition-colors`}
          >
            {mobileSidebarOpen && (
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-[#1f2633] lg:hidden">
                <span className="text-xs font-mono font-bold text-[#008f82] dark:text-[#00c2b2] uppercase">
                  Menú del Panel Admin
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Mobile Theme Selector inside Drawer */}
            <div className="px-3.5 pt-4 lg:hidden">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#161b26] border border-slate-200 dark:border-[#262d3a]">
                <span className="text-[10px] font-mono font-bold uppercase text-slate-500 dark:text-zinc-400 block mb-2">
                  Tema de Apariencia
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTheme(false)}
                    className={`min-h-[40px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      !isDark
                        ? 'bg-white text-slate-900 border-[#2563eb] shadow-xs'
                        : 'bg-slate-100 dark:bg-[#0b0e14] text-slate-500 dark:text-zinc-400 border-transparent'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-[#ff7a00]" />
                    <span>Claro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectTheme(true)}
                    className={`min-h-[40px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      isDark
                        ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs'
                        : 'bg-slate-100 text-slate-600 border-transparent'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Oscuro</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3.5 space-y-5">
              {['CENTRO DE CONTROL', 'CATÁLOGO COMERCIAL', 'MARCA & PORTAFOLIO', 'SISTEMA & NUBE'].map(
                (groupName) => {
                  const groupItems = navItems.filter((item) => item.group === groupName);
                  return (
                    <div key={groupName} className="space-y-1.5">
                      <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block">
                        {groupName}
                      </span>
                      {groupItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(item.id);
                              if (item.id !== 'products') setEditingProductId(null);
                              setMobileSidebarOpen(false);
                            }}
                            className={`w-full min-h-[42px] flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#00c2b2] text-[#0b0e14] font-bold shadow-md'
                                : 'text-slate-700 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161b26]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              {item.icon}
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge !== undefined && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tabular-nums ${
                                  isActive
                                    ? 'bg-[#0b0e14]/20 text-[#0b0e14]'
                                    : 'bg-slate-100 dark:bg-[#161b26] text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-[#262d3a]'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                }
              )}
            </div>

            {/* Sidebar Bottom Quick CTA */}
            <div className="p-4 border-t border-slate-200 dark:border-[#1f2633] bg-slate-50 dark:bg-[#0b0e14]/60 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  handleStartCreateProduct();
                  setMobileSidebarOpen(false);
                }}
                className="w-full min-h-[42px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nuevo Sistema</span>
              </button>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-zinc-500 px-1">
                <span>NocoDB Cloud</span>
                <span className="text-emerald-600 dark:text-[#00c2b2] flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#00c2b2]" /> Conectado
                </span>
              </div>
            </div>
          </aside>

          {/* Main Scrollable Content Area */}
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 bg-slate-50 dark:bg-[#0b0e14] transition-colors">
            <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
              {/* ========================================================= */}
              {/* TAB 0: DASHBOARD GENERAL (EXECUTIVE OVERVIEW) */}
              {/* ========================================================= */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 sm:space-y-8 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#1f2633]">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-[#008f82] dark:text-[#00c2b2] font-bold block">
                        RESUMEN EJECUTIVO • ADMIN.HTML
                      </span>
                      <h2 className="text-xl sm:text-3xl font-bold font-syne text-slate-900 dark:text-white mt-0.5">
                        Bienvenido, {draftProfile.name.split(' ')[0] || 'Raúl'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono mt-1">
                        Gestiona todos los sistemas del catálogo, enlaces de demostración, perfil profesional y respaldos en NocoDB Cloud desde tu PC o smartphone.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleStartCreateProduct}
                        className="min-h-[42px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs cursor-pointer shadow-md"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>+ Agregar Sistema</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          showToast('Descargando admin.html independiente...');
                          await downloadStandaloneAdminHtml();
                          showToast('¡admin.html descargado exitosamente!');
                        }}
                        className={`min-h-[42px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-mono font-semibold cursor-pointer ${btnSecondary}`}
                      >
                        <Download className="w-3.5 h-3.5 text-[#008f82] dark:text-[#00c2b2]" />
                        <span>Descargar admin.html</span>
                      </button>
                    </div>
                  </div>

                  {/* KPI Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className={`p-4 sm:p-5 rounded-2xl flex flex-col justify-between ${cardSurface}`}>
                      <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs font-mono">
                        <span>SISTEMAS</span>
                        <Package className="w-4 h-4 text-[#008f82] dark:text-[#00c2b2]" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-1">
                        <span className="text-2xl sm:text-3xl font-bold font-syne text-slate-900 dark:text-white tabular-nums">
                          {draftProducts.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('products')}
                          className="text-[11px] font-mono text-[#008f82] dark:text-[#00c2b2] hover:underline cursor-pointer"
                        >
                          Gestionar &rarr;
                        </button>
                      </div>
                    </div>

                    <div className={`p-4 sm:p-5 rounded-2xl flex flex-col justify-between ${cardSurface}`}>
                      <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs font-mono">
                        <span>CON DEMO</span>
                        <ExternalLink className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-1">
                        <span className="text-2xl sm:text-3xl font-bold font-syne text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {demosCount}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 dark:text-zinc-400">
                          de {draftProducts.length}
                        </span>
                      </div>
                    </div>

                    <div className={`p-4 sm:p-5 rounded-2xl flex flex-col justify-between ${cardSurface}`}>
                      <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs font-mono">
                        <span>CATEGORÍAS</span>
                        <Layers className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-1">
                        <span className="text-2xl sm:text-3xl font-bold font-syne text-slate-900 dark:text-white tabular-nums">
                          {draftCategories.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('categories')}
                          className="text-[11px] font-mono text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                        >
                          Filtros &rarr;
                        </button>
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#12161f] border border-[#00c2b2]/40 flex flex-col justify-between shadow-xs">
                      <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 text-[11px] sm:text-xs font-mono">
                        <span>NOCODB CLOUD</span>
                        <Database className="w-4 h-4 text-[#008f82] dark:text-[#00c2b2]" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between gap-1">
                        <span className="text-xs sm:text-base font-bold font-mono text-[#008f82] dark:text-[#00c2b2] truncate">
                          {nocoConfig.baseId}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('security')}
                          className="text-[11px] font-mono text-slate-600 dark:text-zinc-300 underline cursor-pointer shrink-0"
                        >
                          Ajustes
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Management Modules Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-5 rounded-2xl space-y-3 ${cardSurface}`}>
                      <h3 className="text-sm font-bold font-syne text-slate-900 dark:text-white flex items-center gap-2">
                        <Download className="w-4 h-4 text-[#008f82] dark:text-[#00c2b2]" />
                        <span>Exportar Archivos HTML Portátiles</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                        Descarga tanto la página pública (<code className="font-mono text-slate-800 dark:text-zinc-200">index.html</code>) como este panel administrativo independiente (<code className="font-mono text-slate-800 dark:text-zinc-200">admin.html</code>).
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => downloadStandaloneHtml('index.html')}
                          className="min-h-[38px] px-3 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer"
                        >
                          Descargar index.html
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadStandaloneAdminHtml()}
                          className={`min-h-[38px] px-3 py-2 rounded-xl text-[#008f82] dark:text-[#00c2b2] text-xs font-mono font-bold cursor-pointer ${btnSecondary}`}
                        >
                          Descargar admin.html
                        </button>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl space-y-3 ${cardSurface}`}>
                      <h3 className="text-sm font-bold font-syne text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        <span>WhatsApp & Contacto Directo</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                        Número activo: <strong className="text-slate-900 dark:text-white font-mono">{whatsappPhone || 'Sin configurar'}</strong>
                        <br />
                        Correo: <strong className="text-slate-900 dark:text-white font-mono">{draftProfile.email}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('contact')}
                        className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-mono font-semibold cursor-pointer ${btnSecondary}`}
                      >
                        Editar WhatsApp y Redes &rarr;
                      </button>
                    </div>

                    <div className={`p-5 rounded-2xl space-y-3 ${cardSurface}`}>
                      <h3 className="text-sm font-bold font-syne text-slate-900 dark:text-white flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-amber-500" />
                        <span>Respaldo Total en JSON</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                        Guarda una copia de seguridad local de todos tus sistemas, fotos y biografía en JSON o restaura una copia previa.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleExportJsonBackup}
                          className={`min-h-[38px] px-3 py-2 rounded-xl text-xs font-mono font-semibold cursor-pointer ${btnSecondary}`}
                        >
                          Exportar JSON
                        </button>
                        <label className={`min-h-[38px] inline-flex items-center px-3 py-2 rounded-xl text-amber-600 dark:text-amber-300 text-xs font-mono font-semibold cursor-pointer ${btnSecondary}`}>
                          <span>Importar JSON</span>
                          <input
                            type="file"
                            accept="application/json"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImportJsonBackup(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Quick Table of Systems */}
                  <div className={`rounded-2xl overflow-hidden ${cardSurface}`}>
                    <div className="px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-[#1f2633] flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold font-syne text-slate-900 dark:text-white">
                          Vista Rápida de Sistemas en Catálogo
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                          Toca "Editar" en cualquier sistema para modificar su enlace "Ver Demo", fotos o precios.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className="text-xs font-mono font-bold text-[#008f82] dark:text-[#00c2b2] hover:underline cursor-pointer"
                      >
                        Ver editor completo &rarr;
                      </button>
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-[#1f2633]">
                      {draftProducts.map((prod, idx) => (
                        <div
                          key={prod.id}
                          className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-[#161b26]/60 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs font-mono text-slate-400 dark:text-zinc-500 w-5 tabular-nums shrink-0">
                              #{idx + 1}
                            </span>
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-[#262d3a] shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-syne font-bold text-slate-900 dark:text-white text-sm truncate">
                                  {prod.title}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0b0e14] border border-slate-200 dark:border-[#262d3a] text-[10px] font-mono text-[#008f82] dark:text-[#00c2b2]">
                                  {prod.categoryLabel}
                                </span>
                                {prod.demoUrl ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/50 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                                    ● Demo Activa
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                                    Sin Demo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{prod.subtitle}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-[#1f2633] shrink-0">
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 mr-2 tabular-nums">
                              {prod.price}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStartEditProduct(prod)}
                                className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${btnSecondary}`}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#008f82] dark:text-[#00c2b2]" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateProduct(prod)}
                                className={`min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg cursor-pointer ${btnSecondary}`}
                                title="Duplicar sistema"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 1: PRODUCTS / SYSTEMS */}
              {/* ========================================================= */}
              {activeTab === 'products' && (
                <div className="space-y-6 animate-fadeIn">
                  {editingProductId ? (
                    <div className={`p-4 sm:p-7 rounded-2xl space-y-6 ${cardSurface}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#1f2633]">
                        <div>
                          <span className="text-[11px] font-mono uppercase text-[#008f82] dark:text-[#00c2b2] font-semibold">
                            {isCreatingProduct ? 'CREAR NUEVO SISTEMA / PRODUCTO' : 'EDITANDO SISTEMA DEL CATÁLOGO'}
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold font-syne text-slate-900 dark:text-white">
                            {productForm.title || 'Sistema sin título'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProductId(null)}
                            className={`min-h-[42px] flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-mono cursor-pointer ${btnSecondary}`}
                          >
                            &larr; Volver
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveProductForm}
                            className="min-h-[42px] flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs cursor-pointer shadow-md"
                          >
                            <Save className="w-4 h-4" />
                            <span>Guardar Sistema</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Título del Sistema / Servicio *
                          </label>
                          <input
                            type="text"
                            required
                            value={productForm.title || ''}
                            onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                            placeholder="Ej. Educom ERP & Control de Stock"
                            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Subtítulo o Resumen Técnico
                          </label>
                          <input
                            type="text"
                            value={productForm.subtitle || ''}
                            onChange={(e) => setProductForm({ ...productForm, subtitle: e.target.value })}
                            placeholder="Ej. Gestión de almacén, compras y facturación POS"
                            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Categoría
                          </label>
                          <select
                            value={productForm.category || 'systems'}
                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm cursor-pointer ${inputSurface}`}
                          >
                            {draftCategories
                              .filter((c) => c.id !== 'all')
                              .map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.label} ({cat.id})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Precio / Modalidad de Cotización
                          </label>
                          <input
                            type="text"
                            value={productForm.price || ''}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            placeholder="Ej. Consultar Cotización / $150"
                            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Estado
                          </label>
                          <select
                            value={productForm.status || 'Disponible'}
                            onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm cursor-pointer ${inputSurface}`}
                          >
                            <option value="Disponible">Disponible</option>
                            <option value="Implementación Inmediata">Implementación Inmediata</option>
                            <option value="En desarrollo">En desarrollo</option>
                            <option value="Caso de estudio">Caso de estudio</option>
                            <option value="Exclusivo">Exclusivo</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Año de Lanzamiento / Versión
                          </label>
                          <input
                            type="text"
                            value={productForm.year || new Date().getFullYear().toString()}
                            onChange={(e) => setProductForm({ ...productForm, year: e.target.value })}
                            placeholder="2026"
                            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                          />
                        </div>
                      </div>

                      {/* BOTÓN "VER DEMO" */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#0b0e14] border border-[#00c2b2]/40 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1f2633]">
                          <div className="flex items-start sm:items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-[#00c2b2]/15 text-[#008f82] dark:text-[#00c2b2] border border-[#00c2b2]/30 shrink-0">
                              <ExternalLink className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold font-syne text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                                <span>Configuración del Botón "Ver Demo"</span>
                                <span className="px-2 py-0.5 rounded-full bg-[#00c2b2]/15 text-[#008f82] dark:text-[#00c2b2] text-[10px] font-mono">
                                  URL o Captura
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                                Coloca la dirección web (URL) de tu demo en vivo o sube una captura desde tu teléfono o PC.
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <label
                              htmlFor="demo-file-upload"
                              className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#161b26] hover:bg-slate-100 dark:hover:bg-[#1f2633] text-[#008f82] dark:text-[#00c2b2] text-xs font-mono font-semibold cursor-pointer border border-[#00c2b2]/40 transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Subir Captura Demo</span>
                            </label>
                            <input
                              id="demo-file-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                try {
                                  const compressed = await compressImageFile(file, 1400, 0.84);
                                  const existingGallery = productForm.gallery || [];
                                  setProductForm({
                                    ...productForm,
                                    demoUrl: compressed,
                                    gallery: existingGallery.includes(compressed)
                                      ? existingGallery
                                      : [compressed, ...existingGallery],
                                  });
                                  showToast('¡Captura de Demo cargada!');
                                } catch {
                                  showToast('No se pudo procesar la imagen seleccionada.');
                                }
                                e.target.value = '';
                              }}
                            />

                            {productForm.demoUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm({ ...productForm, demoUrl: '' });
                                  showToast('Enlace de Demo eliminado.');
                                }}
                                className="min-h-[40px] px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800/50 text-xs font-mono transition-colors cursor-pointer"
                              >
                                Quitar Demo
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Dirección Web (URL) para el Botón "Ver Demo"
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={
                                productForm.demoUrl?.startsWith('data:image/')
                                  ? '[Imagen de Demo subida desde dispositivo]'
                                  : productForm.demoUrl || ''
                              }
                              readOnly={Boolean(productForm.demoUrl?.startsWith('data:image/'))}
                              onChange={(e) => setProductForm({ ...productForm, demoUrl: e.target.value })}
                              placeholder="Ej: https://mi-sistema-demo.com, YouTube, Drive o deja vacío"
                              className={`flex-1 min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                            />
                            {productForm.demoUrl && !productForm.demoUrl.startsWith('data:') && (
                              <a
                                href={
                                  productForm.demoUrl.startsWith('http')
                                    ? productForm.demoUrl
                                    : `https://${productForm.demoUrl}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00c2b2]/20 hover:bg-[#00c2b2]/30 text-[#008f82] dark:text-[#00c2b2] border border-[#00c2b2]/40 text-xs font-mono font-bold transition-colors shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Probar URL</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* IMAGEN DE PORTADA Y GALERÍA */}
                      <div className={`p-4 sm:p-5 rounded-2xl space-y-5 ${subCardSurface}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1f2633]">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold font-syne text-slate-900 dark:text-white uppercase tracking-wider">
                              Imagen de Portada & Galería de Capturas
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                              Sube imágenes desde la galería de tu teléfono o PC, o pega enlaces directos.
                            </p>
                          </div>
                          <label
                            htmlFor="product-cover-upload"
                            className="min-h-[42px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] text-xs font-syne font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 shadow-sm"
                          >
                            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Subir Portada</span>
                          </label>
                          <input
                            id="product-cover-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const compressed = await compressImageFile(file, 1280, 0.82);
                                const currentGallery = productForm.gallery || [];
                                setProductForm({
                                  ...productForm,
                                  imageUrl: compressed,
                                  gallery: currentGallery.includes(compressed)
                                    ? currentGallery
                                    : [compressed, ...currentGallery],
                                });
                                showToast('¡Imagen de portada subida!');
                              } catch {
                                showToast('Error al procesar la imagen.');
                              }
                              e.target.value = '';
                            }}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="w-full sm:w-40 h-32 sm:h-26 rounded-xl overflow-hidden border border-slate-200 dark:border-[#262d3a] bg-white dark:bg-[#12161f] shrink-0">
                            <img
                              src={
                                productForm.imageUrl ||
                                'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80'
                              }
                              alt="Vista previa portada"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 w-full space-y-1.5">
                            <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 uppercase">
                              URL de Imagen de Portada
                            </label>
                            <input
                              type="text"
                              value={
                                productForm.imageUrl?.startsWith('data:image/')
                                  ? '[Imagen subida desde tu dispositivo]'
                                  : productForm.imageUrl || ''
                              }
                              readOnly={Boolean(productForm.imageUrl?.startsWith('data:image/'))}
                              onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                              placeholder="https://images.unsplash.com/..."
                              className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl font-mono text-xs ${inputSurface}`}
                            />
                          </div>
                        </div>

                        {/* Galería */}
                        <div className="pt-3 border-t border-slate-200 dark:border-[#1f2633] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-200 uppercase">
                              Galería de Capturas ({(productForm.gallery || []).length})
                            </span>
                            <label
                              htmlFor="product-gallery-upload"
                              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#161b26] hover:bg-slate-100 dark:hover:bg-[#1f2633] text-[#008f82] dark:text-[#00c2b2] border border-[#00c2b2]/40 text-xs font-mono font-semibold cursor-pointer transition-colors shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Subir Capturas desde Dispositivo</span>
                            </label>
                            <input
                              id="product-gallery-upload"
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []) as File[];
                                if (files.length === 0) return;
                                try {
                                  const compressedList: string[] = [];
                                  for (const file of files.slice(0, 6)) {
                                    const dataUrl = await compressImageFile(file, 1280, 0.8);
                                    compressedList.push(dataUrl);
                                  }
                                  const currentGallery = productForm.gallery || [];
                                  setProductForm({
                                    ...productForm,
                                    imageUrl: productForm.imageUrl || compressedList[0],
                                    gallery: [...currentGallery, ...compressedList],
                                  });
                                  showToast(`¡${compressedList.length} captura(s) añadida(s)!`);
                                } catch {
                                  showToast('Error al subir capturas.');
                                }
                                e.target.value = '';
                              }}
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={newGalleryUrl}
                              onChange={(e) => setNewGalleryUrl(e.target.value)}
                              placeholder="O pega aquí la URL de otra captura (https://...)"
                              className={`flex-1 min-h-[42px] px-3 py-2 rounded-xl font-mono text-xs ${inputSurface}`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newGalleryUrl.trim()) return;
                                setProductForm({
                                  ...productForm,
                                  gallery: [...(productForm.gallery || []), newGalleryUrl.trim()],
                                });
                                setNewGalleryUrl('');
                                showToast('Captura añadida.');
                              }}
                              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-mono font-bold cursor-pointer shrink-0 ${btnSecondary}`}
                            >
                              + Añadir URL
                            </button>
                          </div>

                          {productForm.gallery && productForm.gallery.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                              {productForm.gallery.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-[#262d3a] bg-white dark:bg-[#12161f]"
                                >
                                  <img src={img} alt={`Captura ${idx + 1}`} className="w-full h-full object-cover" />
                                  <div className="absolute inset-x-0 bottom-0 sm:inset-0 bg-black/70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProductForm({ ...productForm, imageUrl: img });
                                        showToast('Establecida como portada.');
                                      }}
                                      className="px-2 py-1 rounded-md bg-[#00c2b2] text-[#0b0e14] text-[10px] font-mono font-bold cursor-pointer"
                                    >
                                      Portada
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const filtered = (productForm.gallery || []).filter((_, i) => i !== idx);
                                        setProductForm({ ...productForm, gallery: filtered });
                                      }}
                                      className="p-1 rounded-md bg-red-600 text-white cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Descripción Principal (Tarjeta) *
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={productForm.description || ''}
                            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                            className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Descripción Detallada (Modal Completo)
                          </label>
                          <textarea
                            rows={3}
                            value={productForm.longDescription || ''}
                            onChange={(e) => setProductForm({ ...productForm, longDescription: e.target.value })}
                            className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Tecnologías (separadas por coma)
                          </label>
                          <input
                            type="text"
                            value={(productForm.technologies || []).join(', ')}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                technologies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              })
                            }
                            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Tags / Etiquetas (separadas por coma)
                          </label>
                          <input
                            type="text"
                            value={(productForm.tags || []).join(', ')}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                              })
                            }
                            className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Características Principales (una por línea)
                          </label>
                          <textarea
                            rows={4}
                            value={(productForm.features || []).join('\n')}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                features: e.target.value.split('\n').filter((f) => f.trim().length > 0),
                              })
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                            Entregables Incluidos (uno por línea)
                          </label>
                          <textarea
                            rows={4}
                            value={(productForm.deliverables || []).join('\n')}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                deliverables: e.target.value.split('\n').filter((d) => d.trim().length > 0),
                              })
                            }
                            placeholder="Instalación y despliegue&#10;Capacitación al personal&#10;Garantía técnica"
                            className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#1f2633]">
                        <button
                          type="button"
                          onClick={() => setEditingProductId(null)}
                          className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-mono cursor-pointer ${btnSecondary}`}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveProductForm}
                          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs cursor-pointer shadow-md"
                        >
                          <Save className="w-4 h-4" />
                          <span>Guardar y Sincronizar Sistema</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold font-syne text-slate-900 dark:text-white">
                            Catálogo de Sistemas & Productos ({draftProducts.length})
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                            Busca, filtra, reordena, duplica o edita cualquier sistema del catálogo comercial.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartCreateProduct}
                          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs shadow-md cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>+ Crear Nuevo Sistema</span>
                        </button>
                      </div>

                      {/* Search & Category Filter Bar */}
                      <div className={`p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${cardSurface}`}>
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={adminSearch}
                            onChange={(e) => setAdminSearch(e.target.value)}
                            placeholder="Buscar sistema por título, descripción o etiqueta..."
                            className={`w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                          />
                        </div>
                        <select
                          value={adminCatFilter}
                          onChange={(e) => setAdminCatFilter(e.target.value)}
                          className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-mono cursor-pointer ${inputSurface}`}
                        >
                          {draftCategories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredAdminProducts.map((prod) => {
                          const realIdx = draftProducts.findIndex((p) => p.id === prod.id);
                          return (
                            <div
                              key={prod.id}
                              className={`p-4 sm:p-5 rounded-2xl flex flex-col justify-between hover:border-[#00c2b2]/50 transition-colors ${cardSurface}`}
                            >
                              <div className="flex items-start gap-3.5 sm:gap-4 mb-4">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.title}
                                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-[#262d3a]"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0b0e14] border border-slate-200 dark:border-[#262d3a] text-[10px] font-mono text-[#008f82] dark:text-[#00c2b2]">
                                      {prod.categoryLabel || prod.category}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-[10px] font-mono text-slate-600 dark:text-zinc-300">
                                      {prod.status}
                                    </span>
                                    {prod.demoUrl ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/50 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                                        <ExternalLink className="w-2.5 h-2.5" />
                                        <span>Demo Activa</span>
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                                        Sin demo
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-syne font-bold text-slate-900 dark:text-white text-base truncate">
                                    {prod.title}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                                    {prod.description}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-200 dark:border-[#1f2633] flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-mono font-bold text-[#008f82] dark:text-[#00c2b2] tabular-nums">
                                  {prod.price || 'Consultar Cotización'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={realIdx <= 0}
                                    onClick={() => handleMoveProduct(prod.id, 'up')}
                                    className={`min-h-[38px] min-w-[36px] flex items-center justify-center rounded-lg disabled:opacity-30 cursor-pointer ${btnSecondary}`}
                                    title="Subir posición"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={realIdx === -1 || realIdx >= draftProducts.length - 1}
                                    onClick={() => handleMoveProduct(prod.id, 'down')}
                                    className={`min-h-[38px] min-w-[36px] flex items-center justify-center rounded-lg disabled:opacity-30 cursor-pointer ${btnSecondary}`}
                                    title="Bajar posición"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateProduct(prod)}
                                    className={`min-h-[38px] min-w-[36px] flex items-center justify-center rounded-lg cursor-pointer ${btnSecondary}`}
                                    title="Duplicar sistema"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditProduct(prod)}
                                    className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${btnSecondary}`}
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-[#008f82] dark:text-[#00c2b2]" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(prod.id, prod.title)}
                                    className="min-h-[38px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                                    title="Eliminar sistema"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: CATEGORIES */}
              {/* ========================================================= */}
              {activeTab === 'categories' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-bold font-syne text-slate-900 dark:text-white">
                      Pestañas de Categorías del Catálogo
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                      Estas son las pestañas que tus visitantes ven arriba de los sistemas para filtrar.
                    </p>
                  </div>

                  <div className={`p-5 rounded-2xl space-y-4 ${cardSurface}`}>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#008f82] dark:text-[#00c2b2] block">
                      + Añadir Nueva Categoría
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">
                          Identificador ID (ej: telecom, cloud, servidores)
                        </label>
                        <input
                          type="text"
                          value={newCatId}
                          onChange={(e) => setNewCatId(e.target.value)}
                          placeholder="telecom"
                          className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl font-mono text-xs ${inputSurface}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">
                          Nombre Visible en Pantalla
                        </label>
                        <input
                          type="text"
                          value={newCatLabel}
                          onChange={(e) => setNewCatLabel(e.target.value)}
                          placeholder="Telecomunicaciones & Enlaces"
                          className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl font-mono text-xs ${inputSurface}`}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="min-h-[42px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase text-xs tracking-wider cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Agregar Categoría</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {draftCategories.map((cat) => {
                      const count =
                        cat.id === 'all'
                          ? draftProducts.length
                          : draftProducts.filter((p) => p.category === cat.id).length;
                      return (
                        <div
                          key={cat.id}
                          className={`p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cardSurface}`}
                        >
                          <div className="flex items-center gap-3 flex-wrap flex-1">
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-[#0b0e14] border border-slate-200 dark:border-[#262d3a] text-xs font-mono text-[#008f82] dark:text-[#00c2b2] font-semibold">
                              {cat.id}
                            </span>
                            <input
                              type="text"
                              value={cat.label}
                              onChange={(e) => handleUpdateCategoryLabel(cat.id, e.target.value)}
                              className={`min-h-[40px] flex-1 sm:max-w-xs px-3 py-1.5 rounded-lg text-xs font-mono ${inputSurface}`}
                            />
                            <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">
                              ({count} sistemas)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {cat.id === 'all' ? (
                              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 italic">
                                Categoría raíz (obligatoria)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: PROFILE & ABOUT ME */}
              {/* ========================================================= */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold font-syne text-slate-900 dark:text-white">
                        Identidad Profesional, Foto & Hero
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                        Edita tu foto oficial, textos de portada (Hero), biografía "Sobre Mí" y métricas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs shadow-md cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios de Perfil</span>
                    </button>
                  </div>

                  <div className={`p-4 sm:p-6 rounded-2xl space-y-6 ${cardSurface}`}>
                    {/* Foto de Perfil */}
                    <div className={`flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl ${subCardSurface}`}>
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#00c2b2] shrink-0 bg-white dark:bg-[#12161f]">
                        {draftProfile.avatarUrl ? (
                          <img
                            src={draftProfile.avatarUrl}
                            alt={draftProfile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold font-syne text-[#00c2b2]">
                            RR
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 uppercase">
                            Foto de Perfil Oficial
                          </label>
                          <label
                            htmlFor="profile-photo-upload-btn"
                            className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#008f82] dark:text-[#00c2b2] text-xs font-mono font-semibold cursor-pointer ${btnSecondary}`}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Subir desde dispositivo</span>
                          </label>
                          <input
                            id="profile-photo-upload-btn"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const compressed = await compressImageFile(file, 900, 0.85);
                                setDraftProfile({ ...draftProfile, avatarUrl: compressed });
                                showToast('Foto cargada. Toca "Guardar Cambios de Perfil" para aplicarla.');
                              } catch {
                                showToast('Error al procesar la imagen.');
                              }
                            }}
                          />
                        </div>
                        <input
                          type="url"
                          value={draftProfile.avatarUrl || ''}
                          onChange={(e) => setDraftProfile({ ...draftProfile, avatarUrl: e.target.value })}
                          placeholder="O pega un enlace de imagen (https://...)"
                          className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl font-mono text-xs ${inputSurface}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          value={draftProfile.name}
                          onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                          Cargo / Título Profesional
                        </label>
                        <input
                          type="text"
                          value={draftProfile.title}
                          onChange={(e) => setDraftProfile({ ...draftProfile, title: e.target.value })}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                          Ubicación & Modalidad
                        </label>
                        <input
                          type="text"
                          value={draftProfile.location}
                          onChange={(e) => setDraftProfile({ ...draftProfile, location: e.target.value })}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                          Estado de Disponibilidad
                        </label>
                        <input
                          type="text"
                          value={draftProfile.availability}
                          onChange={(e) => setDraftProfile({ ...draftProfile, availability: e.target.value })}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                        Tagline de Bienvenida (Hero Principal)
                      </label>
                      <textarea
                        rows={2}
                        value={draftProfile.tagline}
                        onChange={(e) => setDraftProfile({ ...draftProfile, tagline: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                        Biografía Completa ("Sobre Mí")
                      </label>
                      <textarea
                        rows={4}
                        value={draftProfile.bio}
                        onChange={(e) => setDraftProfile({ ...draftProfile, bio: e.target.value })}
                        className={`w-full px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                      />
                    </div>

                    {/* Stats / KPIs */}
                    <div>
                      <span className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-3 uppercase">
                        Métricas & KPIs Destacados
                      </span>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {draftProfile.stats.map((stat, sIdx) => (
                          <div key={sIdx} className={`p-3.5 rounded-xl space-y-2 ${subCardSurface}`}>
                            <input
                              type="text"
                              value={stat.label}
                              onChange={(e) => {
                                const newStats = [...draftProfile.stats];
                                newStats[sIdx] = { ...newStats[sIdx], label: e.target.value };
                                setDraftProfile({ ...draftProfile, stats: newStats });
                              }}
                              className="w-full px-2 py-1 text-[11px] font-mono text-slate-500 dark:text-zinc-400 bg-transparent border-b border-slate-200 dark:border-[#262d3a] focus:outline-hidden"
                            />
                            <input
                              type="text"
                              value={stat.value}
                              onChange={(e) => {
                                const newStats = [...draftProfile.stats];
                                newStats[sIdx] = { ...newStats[sIdx], value: e.target.value };
                                setDraftProfile({ ...draftProfile, stats: newStats });
                              }}
                              className="w-full px-2.5 py-1.5 text-sm font-bold font-syne text-[#008f82] dark:text-[#00c2b2] bg-white dark:bg-[#12161f] border border-slate-200 dark:border-[#262d3a] rounded-lg focus:outline-hidden tabular-nums"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-[#1f2633] flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs shadow-md cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Información de Perfil</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: SKILLS, EDUCATION & CERTIFICATIONS */}
              {/* ========================================================= */}
              {activeTab === 'skills' && (
                <div className="space-y-6 sm:space-y-8 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-bold font-syne text-slate-900 dark:text-white">
                      Stack Tecnológico, Educación & Certificaciones
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                      Administra tus disciplinas técnicas, formación académica y certificaciones.
                    </p>
                  </div>

                  {/* Add Skill Category */}
                  <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${cardSurface}`}>
                    <input
                      type="text"
                      value={newSkillCatName}
                      onChange={(e) => setNewSkillCatName(e.target.value)}
                      placeholder="Nombre de nueva categoría (ej: Redes & MikroTik, Cloud & DevOps)"
                      className={`flex-1 w-full min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                    />
                    <button
                      type="button"
                      onClick={handleAddSkillCategory}
                      className="min-h-[42px] w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase text-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Crear Categoría</span>
                    </button>
                  </div>

                  {/* Skills Groups */}
                  <div className="space-y-4">
                    {draftProfile.skills.map((group, gIdx) => (
                      <div key={gIdx} className={`p-4 sm:p-5 rounded-2xl space-y-3 ${cardSurface}`}>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1f2633]">
                          {editingSkillCatIdx === gIdx ? (
                            <div className="flex items-center gap-2 flex-1 mr-3">
                              <input
                                type="text"
                                value={editingSkillCatName}
                                onChange={(e) => setEditingSkillCatName(e.target.value)}
                                className={`flex-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${inputSurface}`}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveSkillCategoryName(gIdx)}
                                className="p-1.5 rounded-lg bg-[#00c2b2] text-[#0b0e14] cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className="font-syne font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">
                                {group.category}
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSkillCatIdx(gIdx);
                                  setEditingSkillCatName(group.category);
                                }}
                                className="p-1.5 rounded-md text-slate-400 hover:text-[#008f82] dark:hover:text-[#00c2b2] cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteSkillCategory(gIdx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {group.items.map((item, iIdx) => (
                            <span
                              key={iIdx}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-[#262d3a] text-xs font-mono text-slate-700 dark:text-zinc-200"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSkillItem(gIdx, iIdx)}
                                className="text-slate-400 hover:text-red-500 cursor-pointer ml-1 px-1"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            value={newSkillItem.catIdx === gIdx ? newSkillItem.text : ''}
                            onChange={(e) => setNewSkillItem({ catIdx: gIdx, text: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSkillItem(gIdx);
                              }
                            }}
                            placeholder={`+ Agregar habilidad a ${group.category}...`}
                            className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-mono ${inputSurface}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSkillItem(gIdx)}
                            className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-[#008f82] dark:text-[#00c2b2] font-mono text-xs font-bold cursor-pointer ${btnSecondary}`}
                          >
                            Añadir
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Education & Certifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Education */}
                    <div className={`p-5 rounded-2xl space-y-4 ${cardSurface}`}>
                      <h3 className="text-sm font-bold font-syne text-slate-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#008f82] dark:text-[#00c2b2]" />
                        <span>Educación & Títulos</span>
                      </h3>
                      <div className="space-y-2">
                        {(draftProfile.education || []).map((ed, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl flex items-center justify-between gap-2 ${subCardSurface}`}
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{ed.degree}</p>
                              <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                                {ed.institution} • {ed.year}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = {
                                  ...draftProfile,
                                  education: draftProfile.education.filter((_, i) => i !== idx),
                                };
                                setDraftProfile(updated);
                                saveProfile(updated);
                                onUpdateProfile(updated);
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#1f2633]">
                        <input
                          type="text"
                          value={eduForm.degree}
                          onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                          placeholder="Título o Carrera..."
                          className={`w-full min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-mono ${inputSurface}`}
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={eduForm.institution}
                            onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                            placeholder="Institución..."
                            className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-mono ${inputSurface}`}
                          />
                          <input
                            type="text"
                            value={eduForm.year}
                            onChange={(e) => setEduForm({ ...eduForm, year: e.target.value })}
                            placeholder="Año"
                            className={`w-24 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-mono ${inputSurface}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!eduForm.degree.trim()) return;
                            const updated = {
                              ...draftProfile,
                              education: [...(draftProfile.education || []), eduForm],
                            };
                            setDraftProfile(updated);
                            saveProfile(updated);
                            onUpdateProfile(updated);
                            setEduForm({ degree: '', institution: '', year: '' });
                            showToast('Educación añadida.');
                          }}
                          className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#00c2b2] text-[#0b0e14] font-syne font-bold text-xs cursor-pointer"
                        >
                          + Añadir Educación
                        </button>
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className={`p-5 rounded-2xl space-y-4 ${cardSurface}`}>
                      <h3 className="text-sm font-bold font-syne text-slate-900 dark:text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Certificaciones & Cursos</span>
                      </h3>
                      <div className="space-y-2">
                        {(draftProfile.certifications || []).map((cert, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl flex items-center justify-between gap-2 ${subCardSurface}`}
                          >
                            <span className="text-xs font-mono text-slate-700 dark:text-zinc-200">{cert}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = {
                                  ...draftProfile,
                                  certifications: draftProfile.certifications.filter((_, i) => i !== idx),
                                };
                                setDraftProfile(updated);
                                saveProfile(updated);
                                onUpdateProfile(updated);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-[#1f2633]">
                        <input
                          type="text"
                          value={newCertText}
                          onChange={(e) => setNewCertText(e.target.value)}
                          placeholder="Nueva certificación o logro..."
                          className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-mono ${inputSurface}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newCertText.trim()) return;
                            const updated = {
                              ...draftProfile,
                              certifications: [...(draftProfile.certifications || []), newCertText.trim()],
                            };
                            setDraftProfile(updated);
                            saveProfile(updated);
                            onUpdateProfile(updated);
                            setNewCertText('');
                            showToast('Certificación añadida.');
                          }}
                          className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#00c2b2] text-[#0b0e14] font-syne font-bold text-xs cursor-pointer"
                        >
                          + Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 5: EXPERIENCE */}
              {/* ========================================================= */}
              {activeTab === 'experience' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold font-syne text-slate-900 dark:text-white">
                        Historial Profesional & Trayectoria
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                        Puestos y roles que aparecen en tu cronología laboral.
                      </p>
                    </div>
                    {!isAddingExp && editingExpIdx === null && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingExp(true);
                          setExpForm({ role: '', company: '', period: '', description: '' });
                        }}
                        className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase text-xs tracking-wider cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>+ Añadir Posición</span>
                      </button>
                    )}
                  </div>

                  {(isAddingExp || editingExpIdx !== null) && (
                    <div className={`p-5 rounded-2xl space-y-4 ${cardSurface}`}>
                      <span className="text-xs font-mono font-bold uppercase text-[#008f82] dark:text-[#00c2b2] block">
                        {isAddingExp ? '+ Nueva Posición Laboral' : 'Editar Posición'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">Rol / Cargo</label>
                          <input
                            type="text"
                            value={expForm.role}
                            onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
                            className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">Empresa / Firma</label>
                          <input
                            type="text"
                            value={expForm.company}
                            onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                            className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">Período</label>
                          <input
                            type="text"
                            value={expForm.period}
                            onChange={(e) => setExpForm({ ...expForm, period: e.target.value })}
                            className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">Descripción</label>
                        <textarea
                          rows={3}
                          value={expForm.description}
                          onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingExp(false);
                            setEditingExpIdx(null);
                          }}
                          className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-mono cursor-pointer ${btnSecondary}`}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveExperience}
                          className="min-h-[40px] inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00c2b2] text-[#0b0e14] font-syne font-bold uppercase text-xs cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {draftProfile.experience.map((exp, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${cardSurface}`}
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-syne font-bold text-slate-900 dark:text-white text-sm">{exp.role}</h4>
                            <span className="text-[11px] font-mono text-[#008f82] dark:text-[#00c2b2] font-semibold">{exp.period}</span>
                          </div>
                          <p className="text-xs font-mono text-[#ff7a00] mt-0.5">{exp.company}</p>
                          <p className="text-xs text-slate-600 dark:text-zinc-300 mt-2 leading-relaxed">{exp.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpIdx(idx);
                              setExpForm({ ...exp });
                              setIsAddingExp(false);
                            }}
                            className={`p-2 rounded-lg cursor-pointer ${btnSecondary}`}
                          >
                            <Edit2 className="w-4 h-4 text-[#008f82] dark:text-[#00c2b2]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(idx)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 6: CONTACT & WHATSAPP */}
              {/* ========================================================= */}
              {activeTab === 'contact' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-bold font-syne text-slate-900 dark:text-white">
                      Canales de Contacto Directo, WhatsApp & Redes Sociales
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                      Personaliza tu número de WhatsApp para chat directo y agrega tus redes sociales.
                    </p>
                  </div>

                  {/* WhatsApp Configuration Card */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#12161f] border border-[#25D366]/40 space-y-5 shadow-xs">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-[#1f2633]">
                      <div className="p-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 shrink-0">
                        <MessageCircle className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold font-syne text-slate-900 dark:text-white">
                          Contacto Directo por WhatsApp (Enlace wa.me)
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                          Permite que tus clientes te escriban con 1 toque desde la web y el botón flotante.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { flag: '🇻🇪', code: '+58', name: 'Venezuela' },
                        { flag: '🇦🇷', code: '+54 9', name: 'Argentina' },
                        { flag: '🇨🇴', code: '+57', name: 'Colombia' },
                        { flag: '🇲🇽', code: '+52 1', name: 'México' },
                        { flag: '🇨🇱', code: '+56', name: 'Chile' },
                        { flag: '🇪🇸', code: '+34', name: 'España' },
                        { flag: '🇺🇸', code: '+1', name: 'USA' },
                      ].map((country) => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            const currentDigits = whatsappPhone.replace(/^\+[0-9\s]+/, '').replace(/^0+/, '').trim();
                            const newPhone = `${country.code} ${currentDigits}`.trim();
                            setWhatsappPhone(newPhone);
                            const clean = newPhone.replace(/[^0-9]/g, '');
                            const newWaUrl = clean
                              ? `https://wa.me/${clean}?text=${encodeURIComponent(whatsappMessage || 'Hola Raul, deseo consultar por servicios de Educom-Tec')}`
                              : '';
                            setDraftProfile({
                              ...draftProfile,
                              whatsapp: newWaUrl,
                              whatsappNumber: newPhone,
                            });
                            showToast(`Código ${country.name} (${country.code}) aplicado`);
                          }}
                          className={`min-h-[38px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${btnSecondary}`}
                        >
                          <span>{country.flag}</span>
                          <span className="font-bold text-emerald-600 dark:text-[#25D366]">{country.code}</span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400">{country.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                          Tu Número de Teléfono / WhatsApp
                        </label>
                        <input
                          type="text"
                          value={whatsappPhone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setWhatsappPhone(val);
                            const clean = val.replace(/[^0-9]/g, '');
                            const newUrl = clean
                              ? `https://wa.me/${clean}?text=${encodeURIComponent(whatsappMessage || 'Hola Raul, deseo consultar por servicios de Educom-Tec')}`
                              : '';
                            setDraftProfile({
                              ...draftProfile,
                              whatsapp: newUrl,
                              whatsappNumber: val,
                            });
                          }}
                          placeholder="Ej: +58 412 1234567"
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                          Mensaje Predeterminado del Chat
                        </label>
                        <input
                          type="text"
                          value={whatsappMessage}
                          onChange={(e) => setWhatsappMessage(e.target.value)}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 mb-1.5 uppercase">
                        Correo Electrónico Principal
                      </label>
                      <input
                        type="email"
                        value={draftProfile.email}
                        onChange={(e) => setDraftProfile({ ...draftProfile, email: e.target.value })}
                        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl font-mono text-sm ${inputSurface}`}
                      />
                    </div>
                  </div>

                  {/* Social Networks */}
                  <div className={`p-4 sm:p-6 rounded-2xl space-y-5 ${cardSurface}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-sm font-bold font-syne text-slate-900 dark:text-white uppercase tracking-wider">
                        Redes Sociales & Enlaces ({draftProfile.socials.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddSocialNetwork('Instagram', 'https://instagram.com/tu_usuario', 'Instagram')}
                          className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-pink-500 text-xs font-mono cursor-pointer ${btnSecondary}`}
                        >
                          <Instagram className="w-3.5 h-3.5" /> + Instagram
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSocialNetwork('Facebook', 'https://facebook.com/tu_pagina', 'Facebook')}
                          className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-500 text-xs font-mono cursor-pointer ${btnSecondary}`}
                        >
                          <Facebook className="w-3.5 h-3.5" /> + Facebook
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSocialNetwork('YouTube', 'https://youtube.com/@tu_canal', 'Youtube')}
                          className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-500 text-xs font-mono cursor-pointer ${btnSecondary}`}
                        >
                          <Youtube className="w-3.5 h-3.5" /> + YouTube
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingSocial(true)}
                          className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00c2b2] text-[#0b0e14] font-syne font-bold text-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Otra Red
                        </button>
                      </div>
                    </div>

                    {isAddingSocial && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b0e14] border border-[#00c2b2]/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={newSocialName}
                          onChange={(e) => setNewSocialName(e.target.value)}
                          placeholder="Nombre (ej: LinkedIn, TikTok)"
                          className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-mono ${inputSurface}`}
                        />
                        <input
                          type="url"
                          value={newSocialUrl}
                          onChange={(e) => setNewSocialUrl(e.target.value)}
                          placeholder="https://..."
                          className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-mono ${inputSurface}`}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddSocialNetwork(newSocialName, newSocialUrl, 'Globe')}
                            className="flex-1 min-h-[40px] px-3 py-2 rounded-lg bg-[#00c2b2] text-[#0b0e14] font-syne font-bold text-xs cursor-pointer"
                          >
                            Agregar
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingSocial(false)}
                            className={`min-h-[40px] px-3 py-2 rounded-lg text-xs font-mono cursor-pointer ${btnSecondary}`}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {draftProfile.socials.map((social, sIdx) => (
                        <div
                          key={sIdx}
                          className={`p-3.5 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 ${subCardSurface}`}
                        >
                          <div className="flex items-center gap-2 w-full sm:w-48 shrink-0">
                            <Globe className="w-4 h-4 text-[#008f82] dark:text-[#00c2b2] shrink-0" />
                            <input
                              type="text"
                              value={social.name}
                              onChange={(e) => {
                                const updatedSocials = [...draftProfile.socials];
                                updatedSocials[sIdx] = { ...updatedSocials[sIdx], name: e.target.value };
                                setDraftProfile({ ...draftProfile, socials: updatedSocials });
                              }}
                              className={`w-full min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-mono ${inputSurface}`}
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={social.url}
                              onChange={(e) => {
                                const updatedSocials = [...draftProfile.socials];
                                updatedSocials[sIdx] = { ...updatedSocials[sIdx], url: e.target.value };
                                setDraftProfile({ ...draftProfile, socials: updatedSocials });
                              }}
                              className={`flex-1 w-full min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-mono ${inputSurface}`}
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteSocialNetwork(sIdx)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-[#1f2633] flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdateContact(draftProfile.email, draftProfile.whatsapp || '')}
                        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs shadow-md cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>Guardar Contacto, Redes & WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 7: NOCODB DATABASE, EXPORT & SECURITY */}
              {/* ========================================================= */}
              {activeTab === 'security' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-bold font-syne text-slate-900 dark:text-white">
                      Base de Datos NocoDB Cloud, Exportación HTML & Seguridad
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
                      Configura la sincronización en tiempo real con NocoDB Cloud, descarga tus páginas independientes o cambia tu clave.
                    </p>
                  </div>

                  {/* NocoDB Cloud Card */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#12161f] border border-[#00c2b2]/40 space-y-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-[#00c2b2] animate-pulse" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#008f82] dark:text-[#00c2b2]">
                          Base de Datos Principal: NocoDB Cloud (Conectada)
                        </span>
                      </div>
                      <a
                        href={`${nocoConfig.baseUrl}/#/nc/${nocoConfig.baseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#008f82] dark:text-[#00c2b2] hover:underline"
                      >
                        <span>Abrir Base en NocoDB</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">
                          URL Servidor NocoDB
                        </label>
                        <input
                          type="text"
                          value={nocoConfig.baseUrl}
                          onChange={(e) => setNocoConfig({ ...nocoConfig, baseUrl: e.target.value })}
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">
                          Base ID (Proyecto)
                        </label>
                        <input
                          type="text"
                          value={nocoConfig.baseId}
                          onChange={(e) => setNocoConfig({ ...nocoConfig, baseId: e.target.value })}
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">
                          API Token (xc-token)
                        </label>
                        <input
                          type="password"
                          value={nocoConfig.apiToken}
                          onChange={(e) => setNocoConfig({ ...nocoConfig, apiToken: e.target.value })}
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">
                          Tabla Productos (ID)
                        </label>
                        <input
                          type="text"
                          value={nocoConfig.productsTableId}
                          onChange={(e) => setNocoConfig({ ...nocoConfig, productsTableId: e.target.value })}
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">
                          Tablas Categorías / Config (IDs)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={nocoConfig.categoriesTableId}
                            onChange={(e) => setNocoConfig({ ...nocoConfig, categoriesTableId: e.target.value })}
                            className={`w-full min-h-[42px] px-2.5 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                          />
                          <input
                            type="text"
                            value={nocoConfig.configTableId}
                            onChange={(e) => setNocoConfig({ ...nocoConfig, configTableId: e.target.value })}
                            className={`w-full min-h-[42px] px-2.5 py-2 rounded-xl text-xs font-mono ${inputSurface}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isSyncingNoco}
                        onClick={handleManualNocoSync}
                        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase text-xs cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {isSyncingNoco
                            ? 'Sincronizando con NocoDB...'
                            : 'Guardar & Sincronizar Todo con NocoDB'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Standalone HTML Export Card */}
                  <div className={`p-4 sm:p-6 rounded-2xl space-y-4 ${cardSurface}`}>
                    <h3 className="text-sm font-bold font-syne text-slate-900 dark:text-white uppercase tracking-wider">
                      Descarga de Páginas Independientes (index.html y admin.html)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400">
                      Si subes tus archivos a Cloudflare Pages, GitHub Pages o los usas localmente, puedes descargar ambos archivos compilados con tus últimos cambios.
                    </p>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => downloadStandaloneHtml('index.html')}
                        className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar index.html (Web Pública)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadStandaloneAdminHtml()}
                        className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[#008f82] dark:text-[#00c2b2] text-xs font-mono font-bold cursor-pointer ${btnSecondary}`}
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar admin.html (Panel Admin Separado)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Change password card */}
                    <div className={`p-5 sm:p-6 rounded-2xl space-y-4 ${cardSurface}`}>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#008f82] dark:text-[#00c2b2] block">
                        Modificar Clave de Acceso Admin
                      </span>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">
                            Nueva Contraseña
                          </label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 4 caracteres..."
                            className={`w-full min-h-[42px] px-3.5 py-2.5 rounded-xl text-xs font-mono ${inputSurface}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-slate-500 dark:text-zinc-400 mb-1">
                            Confirmar Nueva Contraseña
                          </label>
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite la nueva contraseña..."
                            className={`w-full min-h-[42px] px-3.5 py-2.5 rounded-xl text-xs font-mono ${inputSurface}`}
                          />
                        </div>
                        {passwordError && <p className="text-xs font-mono text-red-500">{passwordError}</p>}
                        <button
                          type="submit"
                          className="w-full sm:w-auto min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase text-xs cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Actualizar Contraseña</span>
                        </button>
                      </form>
                    </div>

                    {/* Reset factory */}
                    <div className="p-5 sm:p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-syne font-bold text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Zona de Peligro / Restablecer de Fábrica</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                          Restaura todos los productos, categorías y perfil a los datos iniciales de fábrica de Educom-Tec en este navegador.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetFactory}
                        className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/60 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-700/50 font-mono text-xs cursor-pointer transition-colors self-start"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restablecer Datos de Fábrica</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ========================================================= */}
        {/* MOBILE BOTTOM THUMB-ZONE NAVIGATION BAR (<1024px) */}
        {/* ========================================================= */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#0f131c]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#1f2633] grid grid-cols-5 items-center h-15 px-1 pb-safe">
          <button
            type="button"
            onClick={() => {
              setActiveTab('dashboard');
              setEditingProductId(null);
            }}
            className={`flex flex-col items-center justify-center h-full gap-0.5 text-[10px] font-mono cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-[#008f82] dark:text-[#00c2b2] font-bold'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Resumen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('products');
              setEditingProductId(null);
            }}
            className={`flex flex-col items-center justify-center h-full gap-0.5 text-[10px] font-mono cursor-pointer ${
              activeTab === 'products' && !isCreatingProduct
                ? 'text-[#008f82] dark:text-[#00c2b2] font-bold'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Sistemas</span>
          </button>

          <button
            type="button"
            onClick={handleStartCreateProduct}
            className="flex flex-col items-center justify-center h-full gap-0.5 text-[10px] font-mono font-bold text-[#008f82] dark:text-[#00c2b2] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#00c2b2] text-[#0b0e14] flex items-center justify-center shadow-md">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span>Nuevo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex flex-col items-center justify-center h-full gap-0.5 text-[10px] font-mono cursor-pointer ${
              activeTab === 'contact'
                ? 'text-[#008f82] dark:text-[#00c2b2] font-bold'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex flex-col items-center justify-center h-full gap-0.5 text-[10px] font-mono text-slate-500 dark:text-zinc-400 cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span>Más</span>
          </button>
        </nav>

        {/* Footer info bar (Desktop) */}
        <footer className="hidden lg:flex px-6 py-3 border-t border-slate-200 dark:border-[#1f2633] bg-white dark:bg-[#0f131c] flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500 dark:text-zinc-500 shrink-0">
          <span>Educom-Tec Admin Center (admin.html) • Raúl Eduardo Rodríguez</span>
          <span className="text-emerald-600 dark:text-[#00c2b2] flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00c2b2] animate-pulse" />
            <span>NocoDB Cloud Activo (Base: {nocoConfig.baseId})</span>
          </span>
        </footer>
      </div>
    </div>
  );
};
