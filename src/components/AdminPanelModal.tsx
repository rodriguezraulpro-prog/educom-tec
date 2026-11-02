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
  Twitter,
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
      <div className="min-h-screen w-full bg-[#0b0e14] text-zinc-100 flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00c2b2] to-[#2563eb] flex items-center justify-center text-[#0b0e14] shadow-lg">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-bold font-syne text-white tracking-tight block">
                Educom-Tec // Admin Center
              </span>
              <span className="text-[11px] font-mono text-zinc-400 block">
                admin.html • consola de gestión y base de datos NocoDB
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161b22] hover:bg-[#1f2630] border border-[#2d3542] text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Web Pública (index.html)</span>
          </button>
        </div>

        <div className="max-w-md w-full mx-auto my-auto py-12">
          <div className="p-7 sm:p-8 rounded-3xl bg-[#12161f] border border-[#262d3a] shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#00c2b2]/15 border border-[#00c2b2]/40 text-[#00c2b2] flex items-center justify-center mx-auto mb-3">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold font-syne text-white tracking-tight">
                Acceso al Panel Admin
              </h1>
              <p className="text-xs font-mono text-zinc-400">
                Ingresa tu clave administrativa para gestionar el catálogo de sistemas, perfil y base de datos NocoDB.
              </p>
            </div>

            <form onSubmit={handleAdminPageLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-zinc-300 uppercase mb-1.5">
                  Contraseña de Administrador
                </label>
                <div className="relative">
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    placeholder="Ingresa tu contraseña..."
                    autoFocus
                    className="w-full pl-4 pr-11 py-3 rounded-xl bg-[#0b0e14] border border-[#2d3542] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-xs font-mono text-red-300">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs shadow-lg transition-all cursor-pointer"
              >
                Ingresar al Centro de Control
              </button>
            </form>

            <div className="pt-4 border-t border-[#262d3a] flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>NocoDB Base: {nocoConfig.baseId}</span>
              <span className="text-[#00c2b2]">● Cloud Ready</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl w-full mx-auto text-center text-xs font-mono text-zinc-500">
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

  const navItems: { id: AdminTab; label: string; badge?: string | number; icon: React.ReactNode; group: string }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard General',
      icon: <LayoutDashboard className="w-4 h-4" />,
      group: 'CENTRO DE CONTROL',
    },
    {
      id: 'products',
      label: 'Catálogo de Sistemas',
      badge: draftProducts.length,
      icon: <Package className="w-4 h-4" />,
      group: 'CATÁLOGO COMERCIAL',
    },
    {
      id: 'categories',
      label: 'Categorías & Filtros',
      badge: draftCategories.length,
      icon: <Layers className="w-4 h-4" />,
      group: 'CATÁLOGO COMERCIAL',
    },
    {
      id: 'profile',
      label: 'Perfil, Foto & Hero',
      icon: <User className="w-4 h-4" />,
      group: 'MARCA & PORTAFOLIO',
    },
    {
      id: 'skills',
      label: 'Stack TI & Certificaciones',
      badge: draftProfile.skills.length,
      icon: <Wrench className="w-4 h-4" />,
      group: 'MARCA & PORTAFOLIO',
    },
    {
      id: 'experience',
      label: 'Experiencia Laboral',
      badge: draftProfile.experience.length,
      icon: <Briefcase className="w-4 h-4" />,
      group: 'MARCA & PORTAFOLIO',
    },
    {
      id: 'contact',
      label: 'Contacto, WhatsApp & Redes',
      badge: draftProfile.socials.length,
      icon: <Phone className="w-4 h-4" />,
      group: 'MARCA & PORTAFOLIO',
    },
    {
      id: 'security',
      label: 'Base de Datos NocoDB & Exportar',
      icon: <Database className="w-4 h-4" />,
      group: 'SISTEMA & NUBE',
    },
  ];

  const demosCount = draftProducts.filter((p) => Boolean(p.demoUrl && p.demoUrl.trim())).length;

  return (
    <div
      className={
        isFullPage
          ? 'min-h-screen w-full bg-[#0b0e14] text-zinc-100 flex flex-col'
          : 'fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn'
      }
    >
      <div
        className={
          isFullPage
            ? 'flex-1 flex flex-col w-full min-h-screen bg-[#0b0e14] text-zinc-100'
            : 'relative w-full max-w-7xl h-[96vh] flex flex-col rounded-3xl bg-[#0b0e14] border border-[#262d3a] shadow-2xl text-zinc-100 overflow-hidden'
        }
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* TOP COMMAND HEADER BAR */}
        {/* ========================================================= */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 border-b border-[#1f2633] bg-[#0f131c]/95 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#161b26] border border-[#262d3a] text-zinc-300 hover:text-white cursor-pointer"
              aria-label="Menú del panel"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#00c2b2] to-[#2563eb] flex items-center justify-center text-[#0b0e14] shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold font-syne text-white tracking-tight truncate">
                  Educom-Tec Admin Workspace
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00c2b2]/15 border border-[#00c2b2]/40 text-[10px] font-mono text-[#00c2b2] font-semibold">
                  admin.html
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono hidden md:block truncate">
                Centro de control profesional • NocoDB Cloud ({nocoConfig.baseId})
              </p>
            </div>
          </div>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isSyncingNoco}
              onClick={handleManualNocoSync}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161b26] hover:bg-[#1e2534] border border-[#00c2b2]/40 text-[#00c2b2] text-xs font-mono font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Sincronizar catálogo, categorías y perfil con NocoDB Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNoco ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">
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
                  showToast('¡index.html descargado! Listo para Cloudflare Pages o PC.');
                } catch {
                  showToast('Error al generar archivo index.html.');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Descargar index.html autónomo"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar Web</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold transition-colors cursor-pointer"
              title="Volver a la página pública principal (index.html)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Web Pública</span>
            </button>

            <button
              id="admin-logout-btn"
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#161b26] hover:bg-red-950/60 text-zinc-400 hover:text-red-300 border border-[#262d3a] hover:border-red-800/60 text-xs font-mono transition-colors cursor-pointer"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Salir</span>
            </button>
          </div>
        </header>

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
          {/* Left Navigation Sidebar */}
          <aside
            className={`${
              mobileSidebarOpen ? 'fixed inset-y-0 left-0 z-40 flex' : 'hidden lg:flex'
            } w-68 flex-col border-r border-[#1f2633] bg-[#0f131c] shrink-0 select-none`}
          >
            {mobileSidebarOpen && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2633] lg:hidden">
                <span className="text-xs font-mono font-bold text-[#00c2b2] uppercase">
                  Navegación Admin
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-6">
              {['CENTRO DE CONTROL', 'CATÁLOGO COMERCIAL', 'MARCA & PORTAFOLIO', 'SISTEMA & NUBE'].map(
                (groupName) => {
                  const groupItems = navItems.filter((item) => item.group === groupName);
                  return (
                    <div key={groupName} className="space-y-1.5">
                      <span className="px-3 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">
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
                            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                              isActive
                                ? 'bg-[#00c2b2] text-[#0b0e14] font-bold shadow-md'
                                : 'text-zinc-300 hover:text-white hover:bg-[#161b26]'
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
                                    : 'bg-[#161b26] text-zinc-400 border border-[#262d3a]'
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
            <div className="p-4 border-t border-[#1f2633] bg-[#0b0e14]/60 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  handleStartCreateProduct();
                  setMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Nuevo Sistema</span>
              </button>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
                <span>NocoDB Cloud</span>
                <span className="text-[#00c2b2] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c2b2]" /> Conectado
                </span>
              </div>
            </div>
          </aside>

          {/* Main Scrollable Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#0b0e14]">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* ========================================================= */}
              {/* TAB 0: DASHBOARD GENERAL (EXECUTIVE OVERVIEW) */}
              {/* ========================================================= */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1f2633]">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-[#00c2b2] font-bold block">
                        RESUMEN EJECUTIVO • ADMIN.HTML
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-bold font-syne text-white mt-0.5">
                        Bienvenido, {draftProfile.name.split(' ')[0] || 'Raúl'}
                      </h2>
                      <p className="text-xs text-zinc-400 font-mono mt-1">
                        Gestiona todos los sistemas del catálogo, enlaces de demostración, perfil profesional y respaldos en NocoDB Cloud desde esta página independiente.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleStartCreateProduct}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs cursor-pointer shadow-md"
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#161b26] hover:bg-[#1f2633] border border-[#262d3a] text-zinc-200 text-xs font-mono font-semibold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#00c2b2]" />
                        <span>Descargar admin.html</span>
                      </button>
                    </div>
                  </div>

                  {/* KPI Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                        <span>SISTEMAS EN CATÁLOGO</span>
                        <Package className="w-4 h-4 text-[#00c2b2]" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-bold font-syne text-white tabular-nums">
                          {draftProducts.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('products')}
                          className="text-[11px] font-mono text-[#00c2b2] hover:underline cursor-pointer"
                        >
                          Gestionar &rarr;
                        </button>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                        <span>CON BOTÓN "VER DEMO"</span>
                        <ExternalLink className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-bold font-syne text-emerald-400 tabular-nums">
                          {demosCount}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-400">
                          de {draftProducts.length} sistemas
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                        <span>CATEGORÍAS ACTIVAS</span>
                        <Layers className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-3xl font-bold font-syne text-white tabular-nums">
                          {draftCategories.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('categories')}
                          className="text-[11px] font-mono text-sky-400 hover:underline cursor-pointer"
                        >
                          Editar filtros &rarr;
                        </button>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#12161f] border border-[#00c2b2]/30 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
                        <span>BASE DE DATOS NOCODB</span>
                        <Database className="w-4 h-4 text-[#00c2b2]" />
                      </div>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-base font-bold font-mono text-[#00c2b2] truncate">
                          {nocoConfig.baseId}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('security')}
                          className="text-[11px] font-mono text-zinc-300 hover:text-white underline cursor-pointer"
                        >
                          Configurar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Management Modules Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-3">
                      <h3 className="text-sm font-bold font-syne text-white flex items-center gap-2">
                        <Download className="w-4 h-4 text-[#00c2b2]" />
                        <span>Exportar Archivos HTML Portátiles</span>
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Descarga tanto la página pública (<code className="text-zinc-200">index.html</code>) como este panel administrativo independiente (<code className="text-zinc-200">admin.html</code>) listos para Cloudflare Pages, GitHub Pages o PC.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => downloadStandaloneHtml('index.html')}
                          className="px-3 py-2 rounded-xl bg-[#2563eb] hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer"
                        >
                          Descargar index.html
                        </button>
                        <button
                          type="button"
                          onClick={() => downloadStandaloneAdminHtml()}
                          className="px-3 py-2 rounded-xl bg-[#161b26] hover:bg-[#1f2633] border border-[#262d3a] text-[#00c2b2] text-xs font-mono font-bold cursor-pointer"
                        >
                          Descargar admin.html
                        </button>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-3">
                      <h3 className="text-sm font-bold font-syne text-white flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-[#25D366]" />
                        <span>WhatsApp & Contacto Directo</span>
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Número activo: <strong className="text-white font-mono">{whatsappPhone || 'Sin configurar'}</strong>
                        <br />
                        Correo: <strong className="text-white font-mono">{draftProfile.email}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('contact')}
                        className="px-3.5 py-2 rounded-xl bg-[#161b26] hover:bg-[#1f2633] border border-[#262d3a] text-zinc-200 text-xs font-mono font-semibold cursor-pointer"
                      >
                        Editar WhatsApp y Redes &rarr;
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-3">
                      <h3 className="text-sm font-bold font-syne text-white flex items-center gap-2">
                        <FileJson className="w-4 h-4 text-amber-400" />
                        <span>Respaldo Total en JSON</span>
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Guarda una copia de seguridad local de todos tus sistemas, fotos y biografía en un archivo JSON o restaura una copia previa.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleExportJsonBackup}
                          className="px-3 py-2 rounded-xl bg-[#161b26] hover:bg-[#1f2633] border border-[#262d3a] text-zinc-200 text-xs font-mono font-semibold cursor-pointer"
                        >
                          Exportar JSON
                        </button>
                        <label className="px-3 py-2 rounded-xl bg-[#161b26] hover:bg-[#1f2633] border border-[#262d3a] text-amber-300 text-xs font-mono font-semibold cursor-pointer">
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
                  <div className="rounded-2xl bg-[#12161f] border border-[#1f2633] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#1f2633] flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold font-syne text-white">
                          Vista Rápida de Sistemas en Catálogo
                        </h3>
                        <p className="text-xs text-zinc-400 font-mono">
                          Haz clic en "Editar" en cualquier sistema para modificar su enlace "Ver Demo", fotos o precios.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('products')}
                        className="text-xs font-mono text-[#00c2b2] hover:underline cursor-pointer"
                      >
                        Ver editor completo &rarr;
                      </button>
                    </div>

                    <div className="divide-y divide-[#1f2633]">
                      {draftProducts.map((prod, idx) => (
                        <div
                          key={prod.id}
                          className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161b26]/60 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="text-xs font-mono text-zinc-500 w-5 tabular-nums">
                              #{idx + 1}
                            </span>
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              className="w-11 h-11 rounded-xl object-cover border border-[#262d3a] shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-syne font-bold text-white text-sm truncate">
                                  {prod.title}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-[#0b0e14] border border-[#262d3a] text-[10px] font-mono text-[#00c2b2]">
                                  {prod.categoryLabel}
                                </span>
                                {prod.demoUrl ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/50 text-[10px] font-mono text-emerald-300">
                                    ● Demo Activa
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-500">
                                    Sin Demo
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-400 truncate mt-0.5">{prod.subtitle}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <span className="text-xs font-mono font-bold text-amber-400 mr-2 tabular-nums">
                              {prod.price}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartEditProduct(prod)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b26] hover:bg-[#1f2633] border border-[#262d3a] text-xs font-mono text-zinc-200 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#00c2b2]" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateProduct(prod)}
                              className="p-1.5 rounded-lg bg-[#161b26] hover:bg-[#1f2633] border border-[#262d3a] text-zinc-400 hover:text-white cursor-pointer"
                              title="Duplicar sistema"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
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
                    <div className="p-6 sm:p-7 rounded-2xl bg-[#12161f] border border-[#262d3a] space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1f2633]">
                        <div>
                          <span className="text-[11px] font-mono uppercase text-[#00c2b2] font-semibold">
                            {isCreatingProduct ? 'CREAR NUEVO SISTEMA / PRODUCTO' : 'EDITANDO SISTEMA DEL CATÁLOGO'}
                          </span>
                          <h3 className="text-xl font-bold font-syne text-white">
                            {productForm.title || 'Sistema sin título'}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProductId(null)}
                            className="px-4 py-2 rounded-xl text-xs font-mono bg-[#161b26] hover:bg-[#1f2633] border border-[#262d3a] text-zinc-300 cursor-pointer"
                          >
                            &larr; Volver al Listado
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveProductForm}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs cursor-pointer shadow-md"
                          >
                            <Save className="w-4 h-4" />
                            <span>Guardar Sistema</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                            Título del Sistema / Servicio *
                          </label>
                          <input
                            type="text"
                            required
                            value={productForm.title || ''}
                            onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                            placeholder="Ej. Educom ERP & Control de Stock"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                            Subtítulo o Resumen Técnico
                          </label>
                          <input
                            type="text"
                            value={productForm.subtitle || ''}
                            onChange={(e) => setProductForm({ ...productForm, subtitle: e.target.value })}
                            placeholder="Ej. Gestión de almacén, compras y facturación POS"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                            Categoría
                          </label>
                          <select
                            value={productForm.category || 'systems'}
                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm cursor-pointer"
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
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                            Precio / Modalidad de Cotización
                          </label>
                          <input
                            type="text"
                            value={productForm.price || ''}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            placeholder="Ej. Consultar Cotización / $150"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                            Estado
                          </label>
                          <select
                            value={productForm.status || 'Disponible'}
                            onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm cursor-pointer"
                          >
                            <option value="Disponible">Disponible</option>
                            <option value="Implementación Inmediata">Implementación Inmediata</option>
                            <option value="En desarrollo">En desarrollo</option>
                            <option value="Caso de estudio">Caso de estudio</option>
                            <option value="Exclusivo">Exclusivo</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                            Año de Lanzamiento / Versión
                          </label>
                          <input
                            type="text"
                            value={productForm.year || new Date().getFullYear().toString()}
                            onChange={(e) => setProductForm({ ...productForm, year: e.target.value })}
                            placeholder="2026"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                          />
                        </div>
                      </div>

                      {/* BOTÓN "VER DEMO" */}
                      <div className="p-5 rounded-2xl bg-[#0b0e14] border border-[#00c2b2]/40 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1f2633]">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-[#00c2b2]/15 text-[#00c2b2] border border-[#00c2b2]/30">
                              <ExternalLink className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-bold font-syne text-white flex items-center gap-2">
                                <span>Configuración del Botón "Ver Demo"</span>
                                <span className="px-2 py-0.5 rounded-full bg-[#00c2b2]/15 text-[#00c2b2] text-[10px] font-mono">
                                  URL o Captura
                                </span>
                              </h4>
                              <p className="text-[11px] text-zinc-400 font-mono">
                                Coloca la dirección web (URL) de tu demo en vivo, video o sube una captura desde tu dispositivo.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <label
                              htmlFor="demo-file-upload"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161b26] hover:bg-[#1f2633] text-[#00c2b2] text-xs font-mono font-semibold cursor-pointer border border-[#00c2b2]/40 transition-colors"
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
                                className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-mono transition-colors cursor-pointer"
                              >
                                Quitar Demo
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
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
                              placeholder="Ej: https://mi-sistema-demo.com, YouTube, Drive o deja vacío para ocultar"
                              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#12161f] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
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
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00c2b2]/20 hover:bg-[#00c2b2]/30 text-[#00c2b2] border border-[#00c2b2]/40 text-xs font-mono font-bold transition-colors shrink-0"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Probar URL</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* IMAGEN DE PORTADA Y GALERÍA */}
                      <div className="p-5 rounded-2xl bg-[#0b0e14] border border-[#262d3a] space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2633]">
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold font-syne text-white uppercase tracking-wider">
                              Imagen de Portada & Galería de Capturas
                            </h4>
                            <p className="text-[11px] text-zinc-400 font-mono">
                              Sube imágenes desde tu dispositivo o pega enlaces directos.
                            </p>
                          </div>
                          <label
                            htmlFor="product-cover-upload"
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] text-xs font-syne font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 shadow-sm"
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
                          <div className="w-full sm:w-40 h-26 rounded-xl overflow-hidden border border-[#262d3a] bg-[#12161f] shrink-0">
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
                            <label className="block text-xs font-mono font-bold text-zinc-300 uppercase">
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
                              className="w-full px-3.5 py-2 rounded-xl border border-[#262d3a] bg-[#12161f] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-xs"
                            />
                          </div>
                        </div>

                        {/* Galería */}
                        <div className="pt-3 border-t border-[#1f2633] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-zinc-200 uppercase">
                              Galería de Capturas ({(productForm.gallery || []).length})
                            </span>
                            <label
                              htmlFor="product-gallery-upload"
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#161b26] hover:bg-[#1f2633] text-[#00c2b2] border border-[#00c2b2]/40 text-xs font-mono font-semibold cursor-pointer transition-colors shrink-0"
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

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newGalleryUrl}
                              onChange={(e) => setNewGalleryUrl(e.target.value)}
                              placeholder="O pega aquí la URL de otra captura (https://...)"
                              className="flex-1 px-3 py-2 rounded-xl border border-[#262d3a] bg-[#12161f] text-white font-mono text-xs focus:outline-hidden focus:border-[#00c2b2]"
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
                              className="px-3.5 py-2 rounded-xl bg-[#161b26] hover:bg-[#1f2633] text-zinc-200 text-xs font-mono font-bold border border-[#262d3a] cursor-pointer shrink-0"
                            >
                              + Añadir URL
                            </button>
                          </div>

                          {productForm.gallery && productForm.gallery.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                              {productForm.gallery.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="relative group aspect-video rounded-xl overflow-hidden border border-[#262d3a] bg-[#12161f]"
                                >
                                  <img src={img} alt={`Captura ${idx + 1}`} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
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
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                            Descripción Principal (Tarjeta) *
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={productForm.description || ''}
                            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                            Descripción Detallada (Modal Completo)
                          </label>
                          <textarea
                            rows={3}
                            value={productForm.longDescription || ''}
                            onChange={(e) => setProductForm({ ...productForm, longDescription: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
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
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
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
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
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
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
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
                            className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1f2633]">
                        <button
                          type="button"
                          onClick={() => setEditingProductId(null)}
                          className="px-5 py-2.5 rounded-xl text-xs font-mono bg-[#161b26] hover:bg-[#1f2633] text-zinc-300 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveProductForm}
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs cursor-pointer shadow-md"
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
                          <h2 className="text-xl font-bold font-syne text-white">
                            Catálogo de Sistemas & Productos ({draftProducts.length})
                          </h2>
                          <p className="text-xs text-zinc-400 font-mono">
                            Busca, filtra, reordena, duplica o edita cualquier sistema del catálogo comercial.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleStartCreateProduct}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs shadow-md cursor-pointer shrink-0"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                          <span>+ Crear Nuevo Sistema</span>
                        </button>
                      </div>

                      {/* Search & Category Filter Bar */}
                      <div className="p-4 rounded-2xl bg-[#12161f] border border-[#1f2633] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={adminSearch}
                            onChange={(e) => setAdminSearch(e.target.value)}
                            placeholder="Buscar sistema por título, descripción o etiqueta..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white focus:outline-hidden focus:border-[#00c2b2]"
                          />
                        </div>
                        <select
                          value={adminCatFilter}
                          onChange={(e) => setAdminCatFilter(e.target.value)}
                          className="px-3.5 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-zinc-200 focus:outline-hidden focus:border-[#00c2b2] cursor-pointer"
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
                              className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] flex flex-col justify-between hover:border-[#00c2b2]/40 transition-colors"
                            >
                              <div className="flex items-start gap-4 mb-4">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.title}
                                  className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#262d3a]"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                    <span className="px-2 py-0.5 rounded-md bg-[#0b0e14] border border-[#262d3a] text-[10px] font-mono text-[#00c2b2]">
                                      {prod.categoryLabel || prod.category}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-300">
                                      {prod.status}
                                    </span>
                                    {prod.demoUrl ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/50 text-[10px] font-mono text-emerald-300">
                                        <ExternalLink className="w-2.5 h-2.5" />
                                        <span>Demo Activa</span>
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-500">
                                        Sin demo
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="font-syne font-bold text-white text-base truncate">
                                    {prod.title}
                                  </h4>
                                  <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5">
                                    {prod.description}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-[#1f2633] flex items-center justify-between gap-2">
                                <span className="text-xs font-mono font-bold text-[#00c2b2] tabular-nums">
                                  {prod.price || 'Consultar Cotización'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={realIdx <= 0}
                                    onClick={() => handleMoveProduct(prod.id, 'up')}
                                    className="p-1.5 rounded-lg bg-[#161b26] hover:bg-[#1f2633] text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                    title="Subir posición"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={realIdx === -1 || realIdx >= draftProducts.length - 1}
                                    onClick={() => handleMoveProduct(prod.id, 'down')}
                                    className="p-1.5 rounded-lg bg-[#161b26] hover:bg-[#1f2633] text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                    title="Bajar posición"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateProduct(prod)}
                                    className="p-1.5 rounded-lg bg-[#161b26] hover:bg-[#1f2633] text-zinc-400 hover:text-white cursor-pointer"
                                    title="Duplicar sistema"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditProduct(prod)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#161b26] hover:bg-[#1f2633] border border-[#262d3a] text-zinc-200 cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-[#00c2b2]" />
                                    <span>Editar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(prod.id, prod.title)}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
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
                    <h2 className="text-xl font-bold font-syne text-white">
                      Pestañas de Categorías del Catálogo
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Estas son las pestañas que tus visitantes ven arriba de los sistemas para filtrar.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00c2b2] block">
                      + Añadir Nueva Categoría
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Identificador ID (ej: telecom, cloud, servidores)
                        </label>
                        <input
                          type="text"
                          value={newCatId}
                          onChange={(e) => setNewCatId(e.target.value)}
                          placeholder="telecom"
                          className="w-full px-3.5 py-2 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-xs focus:outline-hidden focus:border-[#00c2b2]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Nombre Visible en Pantalla
                        </label>
                        <input
                          type="text"
                          value={newCatLabel}
                          onChange={(e) => setNewCatLabel(e.target.value)}
                          placeholder="Telecomunicaciones & Enlaces"
                          className="w-full px-3.5 py-2 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-xs focus:outline-hidden focus:border-[#00c2b2]"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase text-xs tracking-wider cursor-pointer"
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
                          className="p-4 rounded-xl bg-[#12161f] border border-[#1f2633] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="px-2.5 py-1 rounded-md bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-[#00c2b2] font-semibold">
                              {cat.id}
                            </span>
                            <input
                              type="text"
                              value={cat.label}
                              onChange={(e) => handleUpdateCategoryLabel(cat.id, e.target.value)}
                              className="px-3 py-1.5 rounded-lg bg-[#0b0e14] border border-[#262d3a] text-white text-xs font-mono focus:border-[#00c2b2] focus:outline-hidden w-64"
                            />
                            <span className="text-xs font-mono text-zinc-400">
                              ({count} sistemas)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {cat.id === 'all' ? (
                              <span className="text-[10px] font-mono text-zinc-500 italic">
                                Categoría raíz (obligatoria)
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
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
                      <h2 className="text-xl font-bold font-syne text-white">
                        Identidad Profesional, Foto & Hero
                      </h2>
                      <p className="text-xs text-zinc-400 font-mono">
                        Edita tu foto oficial, textos de portada (Hero), biografía "Sobre Mí" y métricas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs shadow-md cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Cambios de Perfil</span>
                    </button>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-6">
                    {/* Foto de Perfil */}
                    <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#0b0e14] border border-[#262d3a]">
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-[#00c2b2] shrink-0 bg-[#12161f]">
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
                          <label className="block text-xs font-mono font-bold text-zinc-300 uppercase">
                            Foto de Perfil Oficial
                          </label>
                          <label
                            htmlFor="profile-photo-upload-btn"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b26] hover:bg-[#1f2633] text-[#00c2b2] text-xs font-mono font-semibold cursor-pointer border border-[#262d3a]"
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
                                showToast('Foto cargada. Haz clic en "Guardar Cambios de Perfil" para aplicarla.');
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
                          className="w-full px-3.5 py-2 rounded-xl border border-[#262d3a] bg-[#12161f] text-white font-mono text-xs focus:outline-hidden focus:border-[#00c2b2]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                          Nombre Completo
                        </label>
                        <input
                          type="text"
                          value={draftProfile.name}
                          onChange={(e) => setDraftProfile({ ...draftProfile, name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                          Cargo / Título Profesional
                        </label>
                        <input
                          type="text"
                          value={draftProfile.title}
                          onChange={(e) => setDraftProfile({ ...draftProfile, title: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                          Ubicación & Modalidad
                        </label>
                        <input
                          type="text"
                          value={draftProfile.location}
                          onChange={(e) => setDraftProfile({ ...draftProfile, location: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                          Estado de Disponibilidad
                        </label>
                        <input
                          type="text"
                          value={draftProfile.availability}
                          onChange={(e) => setDraftProfile({ ...draftProfile, availability: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                        Tagline de Bienvenida (Hero Principal)
                      </label>
                      <textarea
                        rows={2}
                        value={draftProfile.tagline}
                        onChange={(e) => setDraftProfile({ ...draftProfile, tagline: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                        Biografía Completa ("Sobre Mí")
                      </label>
                      <textarea
                        rows={4}
                        value={draftProfile.bio}
                        onChange={(e) => setDraftProfile({ ...draftProfile, bio: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                      />
                    </div>

                    {/* Stats / KPIs */}
                    <div>
                      <span className="block text-xs font-mono font-bold text-zinc-300 mb-3 uppercase">
                        Métricas & KPIs Destacados
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {draftProfile.stats.map((stat, sIdx) => (
                          <div key={sIdx} className="p-3.5 rounded-xl bg-[#0b0e14] border border-[#262d3a] space-y-2">
                            <input
                              type="text"
                              value={stat.label}
                              onChange={(e) => {
                                const newStats = [...draftProfile.stats];
                                newStats[sIdx] = { ...newStats[sIdx], label: e.target.value };
                                setDraftProfile({ ...draftProfile, stats: newStats });
                              }}
                              className="w-full px-2 py-1 text-[11px] font-mono text-zinc-400 bg-transparent border-b border-[#262d3a] focus:outline-hidden"
                            />
                            <input
                              type="text"
                              value={stat.value}
                              onChange={(e) => {
                                const newStats = [...draftProfile.stats];
                                newStats[sIdx] = { ...newStats[sIdx], value: e.target.value };
                                setDraftProfile({ ...draftProfile, stats: newStats });
                              }}
                              className="w-full px-2.5 py-1.5 text-sm font-bold font-syne text-[#00c2b2] bg-[#12161f] border border-[#262d3a] rounded-lg focus:outline-hidden tabular-nums"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#1f2633] flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs shadow-md cursor-pointer"
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
                <div className="space-y-8 animate-fadeIn">
                  <div>
                    <h2 className="text-xl font-bold font-syne text-white">
                      Stack Tecnológico, Educación & Certificaciones
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Administra tus disciplinas técnicas, formación académica y certificaciones.
                    </p>
                  </div>

                  {/* Add Skill Category */}
                  <div className="p-4 rounded-2xl bg-[#12161f] border border-[#1f2633] flex flex-col sm:flex-row items-center gap-3">
                    <input
                      type="text"
                      value={newSkillCatName}
                      onChange={(e) => setNewSkillCatName(e.target.value)}
                      placeholder="Nombre de nueva categoría o disciplina (ej: Redes & MikroTik, Cloud & DevOps)"
                      className="flex-1 w-full px-3.5 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white focus:outline-hidden focus:border-[#00c2b2]"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkillCategory}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase text-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Crear Categoría</span>
                    </button>
                  </div>

                  {/* Skills Groups */}
                  <div className="space-y-4">
                    {draftProfile.skills.map((group, gIdx) => (
                      <div key={gIdx} className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#1f2633]">
                          {editingSkillCatIdx === gIdx ? (
                            <div className="flex items-center gap-2 flex-1 mr-3">
                              <input
                                type="text"
                                value={editingSkillCatName}
                                onChange={(e) => setEditingSkillCatName(e.target.value)}
                                className="flex-1 px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-[#00c2b2] text-xs font-mono font-bold text-white uppercase focus:outline-hidden"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveSkillCategoryName(gIdx)}
                                className="p-1 rounded-lg bg-[#00c2b2] text-[#0b0e14] cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className="font-syne font-bold text-white text-sm uppercase tracking-wider">
                                {group.category}
                              </h4>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSkillCatIdx(gIdx);
                                  setEditingSkillCatName(group.category);
                                }}
                                className="p-1 rounded-md text-zinc-500 hover:text-[#00c2b2] cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteSkillCategory(gIdx)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {group.items.map((item, iIdx) => (
                            <span
                              key={iIdx}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-zinc-200"
                            >
                              <span>{item}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSkillItem(gIdx, iIdx)}
                                className="text-zinc-500 hover:text-red-400 cursor-pointer ml-1"
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
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white focus:outline-hidden focus:border-[#00c2b2]"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSkillItem(gIdx)}
                            className="px-3 py-1.5 rounded-lg bg-[#161b26] hover:bg-[#1f2633] text-[#00c2b2] font-mono text-xs cursor-pointer"
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
                    <div className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-4">
                      <h3 className="text-sm font-bold font-syne text-white flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#00c2b2]" />
                        <span>Educación & Títulos</span>
                      </h3>
                      <div className="space-y-2">
                        {(draftProfile.education || []).map((ed, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-[#0b0e14] border border-[#262d3a] flex items-center justify-between gap-2"
                          >
                            <div>
                              <p className="text-xs font-bold text-white">{ed.degree}</p>
                              <p className="text-[11px] font-mono text-zinc-400">
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
                              className="p-1.5 text-zinc-400 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-2 border-t border-[#1f2633]">
                        <input
                          type="text"
                          value={eduForm.degree}
                          onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                          placeholder="Título o Carrera..."
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={eduForm.institution}
                            onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })}
                            placeholder="Institución..."
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                          />
                          <input
                            type="text"
                            value={eduForm.year}
                            onChange={(e) => setEduForm({ ...eduForm, year: e.target.value })}
                            placeholder="Año"
                            className="w-24 px-3 py-1.5 rounded-lg bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
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
                          className="px-3.5 py-1.5 rounded-lg bg-[#00c2b2] text-[#0b0e14] font-syne font-bold text-xs cursor-pointer"
                        >
                          + Añadir Educación
                        </button>
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="p-5 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-4">
                      <h3 className="text-sm font-bold font-syne text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Certificaciones & Cursos</span>
                      </h3>
                      <div className="space-y-2">
                        {(draftProfile.certifications || []).map((cert, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#0b0e14] border border-[#262d3a] flex items-center justify-between gap-2"
                          >
                            <span className="text-xs font-mono text-zinc-200">{cert}</span>
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
                              className="p-1 text-zinc-400 hover:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2 border-t border-[#1f2633]">
                        <input
                          type="text"
                          value={newCertText}
                          onChange={(e) => setNewCertText(e.target.value)}
                          placeholder="Nueva certificación o logro..."
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
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
                          className="px-3.5 py-1.5 rounded-lg bg-[#00c2b2] text-[#0b0e14] font-syne font-bold text-xs cursor-pointer"
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
                      <h2 className="text-xl font-bold font-syne text-white">
                        Historial Profesional & Trayectoria
                      </h2>
                      <p className="text-xs text-zinc-400 font-mono">
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
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase text-xs tracking-wider cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>+ Añadir Posición</span>
                      </button>
                    )}
                  </div>

                  {(isAddingExp || editingExpIdx !== null) && (
                    <div className="p-5 rounded-2xl bg-[#12161f] border border-[#262d3a] space-y-4">
                      <span className="text-xs font-mono font-bold uppercase text-[#00c2b2] block">
                        {isAddingExp ? '+ Nueva Posición Laboral' : 'Editar Posición'}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">Rol / Cargo</label>
                          <input
                            type="text"
                            value={expForm.role}
                            onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">Empresa / Firma</label>
                          <input
                            type="text"
                            value={expForm.company}
                            onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">Período</label>
                          <input
                            type="text"
                            value={expForm.period}
                            onChange={(e) => setExpForm({ ...expForm, period: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">Descripción</label>
                        <textarea
                          rows={3}
                          value={expForm.description}
                          onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingExp(false);
                            setEditingExpIdx(null);
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-mono bg-[#161b26] text-zinc-300 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveExperience}
                          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00c2b2] text-[#0b0e14] font-syne font-bold uppercase text-xs cursor-pointer"
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
                        className="p-4 rounded-2xl bg-[#12161f] border border-[#1f2633] flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-syne font-bold text-white text-sm">{exp.role}</h4>
                            <span className="text-[11px] font-mono text-[#00c2b2] font-semibold">{exp.period}</span>
                          </div>
                          <p className="text-xs font-mono text-[#ff7a00] mt-0.5">{exp.company}</p>
                          <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{exp.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpIdx(idx);
                              setExpForm({ ...exp });
                              setIsAddingExp(false);
                            }}
                            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#161b26] cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4 text-[#00c2b2]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(idx)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 cursor-pointer"
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
                    <h2 className="text-xl font-bold font-syne text-white">
                      Canales de Contacto Directo, WhatsApp & Redes Sociales
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Personaliza tu número de WhatsApp para chat directo y agrega tus redes sociales.
                    </p>
                  </div>

                  {/* WhatsApp Configuration Card */}
                  <div className="p-6 rounded-2xl bg-[#12161f] border border-[#25D366]/30 space-y-5">
                    <div className="flex items-center gap-3 pb-3 border-b border-[#1f2633]">
                      <div className="p-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30">
                        <MessageCircle className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold font-syne text-white">
                          Contacto Directo por WhatsApp (Enlace wa.me)
                        </h4>
                        <p className="text-xs text-zinc-400 font-mono">
                          Permite que tus clientes te escriban con 1 clic desde la web y el botón flotante.
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
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b0e14] hover:bg-[#161b26] border border-[#262d3a] text-xs font-mono text-zinc-300 cursor-pointer"
                        >
                          <span>{country.flag}</span>
                          <span className="font-bold text-[#25D366]">{country.code}</span>
                          <span className="text-[10px] text-zinc-400">{country.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-sm focus:outline-hidden focus:border-[#25D366]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                          Mensaje Predeterminado del Chat
                        </label>
                        <input
                          type="text"
                          value={whatsappMessage}
                          onChange={(e) => setWhatsappMessage(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-sm focus:outline-hidden focus:border-[#25D366]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                        Correo Electrónico Principal
                      </label>
                      <input
                        type="email"
                        value={draftProfile.email}
                        onChange={(e) => setDraftProfile({ ...draftProfile, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#262d3a] bg-[#0b0e14] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                      />
                    </div>
                  </div>

                  {/* Social Networks */}
                  <div className="p-6 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h4 className="text-sm font-bold font-syne text-white uppercase tracking-wider">
                        Redes Sociales & Enlaces ({draftProfile.socials.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddSocialNetwork('Instagram', 'https://instagram.com/tu_usuario', 'Instagram')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b26] text-pink-400 border border-[#262d3a] text-xs font-mono cursor-pointer"
                        >
                          <Instagram className="w-3.5 h-3.5" /> + Instagram
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSocialNetwork('Facebook', 'https://facebook.com/tu_pagina', 'Facebook')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b26] text-blue-400 border border-[#262d3a] text-xs font-mono cursor-pointer"
                        >
                          <Facebook className="w-3.5 h-3.5" /> + Facebook
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddSocialNetwork('YouTube', 'https://youtube.com/@tu_canal', 'Youtube')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b26] text-red-400 border border-[#262d3a] text-xs font-mono cursor-pointer"
                        >
                          <Youtube className="w-3.5 h-3.5" /> + YouTube
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingSocial(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00c2b2] text-[#0b0e14] font-syne font-bold text-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Otra Red
                        </button>
                      </div>
                    </div>

                    {isAddingSocial && (
                      <div className="p-4 rounded-xl bg-[#0b0e14] border border-[#00c2b2]/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={newSocialName}
                          onChange={(e) => setNewSocialName(e.target.value)}
                          placeholder="Nombre (ej: LinkedIn, TikTok)"
                          className="px-3 py-2 rounded-lg bg-[#12161f] border border-[#262d3a] text-xs font-mono text-white"
                        />
                        <input
                          type="url"
                          value={newSocialUrl}
                          onChange={(e) => setNewSocialUrl(e.target.value)}
                          placeholder="https://..."
                          className="px-3 py-2 rounded-lg bg-[#12161f] border border-[#262d3a] text-xs font-mono text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAddSocialNetwork(newSocialName, newSocialUrl, 'Globe')}
                            className="flex-1 px-3 py-2 rounded-lg bg-[#00c2b2] text-[#0b0e14] font-syne font-bold text-xs cursor-pointer"
                          >
                            Agregar
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingSocial(false)}
                            className="px-3 py-2 rounded-lg bg-[#161b26] text-zinc-400 text-xs font-mono cursor-pointer"
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
                          className="p-3.5 rounded-xl bg-[#0b0e14] border border-[#262d3a] flex flex-col sm:flex-row items-center gap-3"
                        >
                          <div className="flex items-center gap-2 w-full sm:w-48 shrink-0">
                            <Globe className="w-4 h-4 text-[#00c2b2] shrink-0" />
                            <input
                              type="text"
                              value={social.name}
                              onChange={(e) => {
                                const updatedSocials = [...draftProfile.socials];
                                updatedSocials[sIdx] = { ...updatedSocials[sIdx], name: e.target.value };
                                setDraftProfile({ ...draftProfile, socials: updatedSocials });
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#12161f] border border-[#262d3a] text-xs font-mono text-white"
                            />
                          </div>
                          <input
                            type="text"
                            value={social.url}
                            onChange={(e) => {
                              const updatedSocials = [...draftProfile.socials];
                              updatedSocials[sIdx] = { ...updatedSocials[sIdx], url: e.target.value };
                              setDraftProfile({ ...draftProfile, socials: updatedSocials });
                            }}
                            className="flex-1 w-full px-3 py-1.5 rounded-lg bg-[#12161f] border border-[#262d3a] text-xs font-mono text-zinc-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteSocialNetwork(sIdx)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-[#1f2633] flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdateContact(draftProfile.email, draftProfile.whatsapp || '')}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase tracking-wider text-xs shadow-md cursor-pointer"
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
                    <h2 className="text-xl font-bold font-syne text-white">
                      Base de Datos NocoDB Cloud, Exportación HTML & Seguridad
                    </h2>
                    <p className="text-xs text-zinc-400 font-mono">
                      Configura la sincronización en tiempo real con NocoDB Cloud, descarga tus páginas independientes o cambia tu clave.
                    </p>
                  </div>

                  {/* NocoDB Cloud Card */}
                  <div className="p-6 rounded-2xl bg-[#12161f] border border-[#00c2b2]/40 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00c2b2] animate-pulse" />
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00c2b2]">
                          Base de Datos Principal: NocoDB Cloud (Conectada)
                        </span>
                      </div>
                      <a
                        href={`${nocoConfig.baseUrl}/#/nc/${nocoConfig.baseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-mono text-[#00c2b2] hover:underline"
                      >
                        <span>Abrir Base en NocoDB</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          URL Servidor NocoDB
                        </label>
                        <input
                          type="text"
                          value={nocoConfig.baseUrl}
                          onChange={(e) => setNocoConfig({ ...nocoConfig, baseUrl: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Base ID (Proyecto)
                        </label>
                        <input
                          type="text"
                          value={nocoConfig.baseId}
                          onChange={(e) => setNocoConfig({ ...nocoConfig, baseId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          API Token (xc-token)
                        </label>
                        <input
                          type="password"
                          value={nocoConfig.apiToken}
                          onChange={(e) => setNocoConfig({ ...nocoConfig, apiToken: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Tabla Productos (ID)
                        </label>
                        <input
                          type="text"
                          value={nocoConfig.productsTableId}
                          onChange={(e) => setNocoConfig({ ...nocoConfig, productsTableId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-zinc-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Tablas Categorías / Config (IDs)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={nocoConfig.categoriesTableId}
                            onChange={(e) => setNocoConfig({ ...nocoConfig, categoriesTableId: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-zinc-300"
                          />
                          <input
                            type="text"
                            value={nocoConfig.configTableId}
                            onChange={(e) => setNocoConfig({ ...nocoConfig, configTableId: e.target.value })}
                            className="w-full px-2.5 py-2 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-zinc-300"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isSyncingNoco}
                        onClick={handleManualNocoSync}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase text-xs cursor-pointer disabled:opacity-50"
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
                  <div className="p-6 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-4">
                    <h3 className="text-sm font-bold font-syne text-white uppercase tracking-wider">
                      Descarga de Páginas Independientes (index.html y admin.html)
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Si subes tus archivos a Cloudflare Pages, GitHub Pages o los usas localmente en tu PC, puedes descargar ambos archivos compilados con tus últimos cambios.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => downloadStandaloneHtml('index.html')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar index.html (Web Pública)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadStandaloneAdminHtml()}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161b26] hover:bg-[#1f2633] border border-[#00c2b2]/40 text-[#00c2b2] text-xs font-mono font-bold cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Descargar admin.html (Panel Admin Separado)</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Change password card */}
                    <div className="p-6 rounded-2xl bg-[#12161f] border border-[#1f2633] space-y-4">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00c2b2] block">
                        Modificar Clave de Acceso Admin
                      </span>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                            Nueva Contraseña
                          </label>
                          <input
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mínimo 4 caracteres..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                            Confirmar Nueva Contraseña
                          </label>
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repite la nueva contraseña..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0e14] border border-[#262d3a] text-xs font-mono text-white"
                          />
                        </div>
                        {passwordError && <p className="text-xs font-mono text-red-400">{passwordError}</p>}
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#0b0e14] font-syne font-bold uppercase text-xs cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Actualizar Contraseña</span>
                        </button>
                      </form>
                    </div>

                    {/* Reset factory */}
                    <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-400 font-syne font-bold text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Zona de Peligro / Restablecer de Fábrica</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Restaura todos los productos, categorías y perfil a los datos iniciales de fábrica de Educom-Tec en este navegador.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetFactory}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-700/50 font-mono text-xs cursor-pointer transition-colors self-start"
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

        {/* Footer info bar */}
        <footer className="px-6 py-3 border-t border-[#1f2633] bg-[#0f131c] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-zinc-500 shrink-0">
          <span>Educom-Tec Admin Center (admin.html) • Raúl Eduardo Rodríguez</span>
          <span className="text-[#00c2b2] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00c2b2] animate-pulse" />
            <span>NocoDB Cloud Activo (Base: {nocoConfig.baseId})</span>
          </span>
        </footer>
      </div>
    </div>
  );
};
