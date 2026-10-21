import React, { useState } from 'react';
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
  HelpCircle,
  Tag,
  AlertTriangle,
  Camera,
  Upload,
  Check,
  MessageCircle,
  Instagram,
  Facebook,
  Globe,
  Youtube,
  Twitter,
  Download,
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
import { saveAdminPasswordToCloud, deleteProductFromCloud } from '../lib/firestoreService';
import { downloadStandaloneHtml } from '../utils/exportStandaloneHtml';

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
}

type AdminTab =
  | 'products'
  | 'categories'
  | 'profile'
  | 'contact'
  | 'experience'
  | 'skills'
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
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local draft states
  const [draftProducts, setDraftProducts] = useState<ProductOrProject[]>(products);
  const [draftCategories, setDraftCategories] = useState<ShowcaseCategory[]>(categories);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(profile);

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

  // Experience editing
  const [editingExpIdx, setEditingExpIdx] = useState<number | null>(null);
  const [expForm, setExpForm] = useState({ role: '', company: '', period: '', description: '' });
  const [isAddingExp, setIsAddingExp] = useState(false);

  // Skill category editing
  const [newSkillCatName, setNewSkillCatName] = useState('');
  const [newSkillItem, setNewSkillItem] = useState<{ catIdx: number; text: string }>({ catIdx: -1, text: '' });
  const [editingSkillCatIdx, setEditingSkillCatIdx] = useState<number | null>(null);
  const [editingSkillCatName, setEditingSkillCatName] = useState('');

  // Contact & Socials state
  const [whatsappPhone, setWhatsappPhone] = useState(profile.whatsappNumber || '');
  const [whatsappMessage, setWhatsappMessage] = useState('Hola Raul, deseo consultar por servicios de Educom-Tec.');
  const [newSocialName, setNewSocialName] = useState('');
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [newSocialIcon, setNewSocialIcon] = useState('Globe');
  const [isAddingSocial, setIsAddingSocial] = useState(false);

  // Synchronize when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftProducts(products);
      setDraftCategories(categories);
      setDraftProfile(profile);

      // Resolve initial phone number from profile or wa.me URL
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
      setToastMessage(null);
    }
  }, [isOpen, products, categories, profile]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // ----------------------------------------------------
  // PRODUCTS LOGIC
  // ----------------------------------------------------
  const handleStartEditProduct = (prod: ProductOrProject) => {
    setEditingProductId(prod.id);
    setProductForm({
      ...prod,
      gallery: prod.gallery || (prod.imageUrl ? [prod.imageUrl] : []),
    });
    setNewGalleryUrl('');
    setIsCreatingProduct(false);
  };

  const handleStartCreateProduct = () => {
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
    showToast('¡Sistema guardado y sincronizado exitosamente!');
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
    showToast(`Producto "${title}" eliminado del catálogo.`);
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
    showToast('¡Nueva categoría añadida al catálogo!');
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
    setDraftProfile(draftProfile);
    saveProfile(draftProfile);
    onUpdateProfile(draftProfile);
    showToast('¡Información de perfil actualizada con éxito!');
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
    const newEntry = {
      name: name.trim(),
      url: formattedUrl,
      icon,
    };
    const updatedSocials = [...draftProfile.socials, newEntry];
    const updated: UserProfile = {
      ...draftProfile,
      socials: updatedSocials,
    };
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
    const updated: UserProfile = {
      ...draftProfile,
      socials: updatedSocials,
    };
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
      alert('Debes indicar al menos el rol y la empresa.');
      return;
    }

    let updatedExp = [...draftProfile.experience];
    if (isAddingExp) {
      updatedExp = [expForm, ...updatedExp];
    } else if (editingExpIdx !== null) {
      updatedExp[editingExpIdx] = expForm;
    }

    const updatedProfile: UserProfile = {
      ...draftProfile,
      experience: updatedExp,
    };

    setDraftProfile(updatedProfile);
    saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    setEditingExpIdx(null);
    setIsAddingExp(false);
    showToast('¡Historial profesional actualizado!');
  };

  const handleDeleteExperience = (index: number) => {
    const updatedExp = draftProfile.experience.filter((_, i) => i !== index);
    const updatedProfile: UserProfile = {
      ...draftProfile,
      experience: updatedExp,
    };
    setDraftProfile(updatedProfile);
    saveProfile(updatedProfile);
    onUpdateProfile(updatedProfile);
    showToast('Posición eliminada del historial profesional.');
  };

  // ----------------------------------------------------
  // SKILLS LOGIC
  // ----------------------------------------------------
  const handleAddSkillCategory = () => {
    if (!newSkillCatName.trim()) return;
    const updatedSkills = [
      ...draftProfile.skills,
      { category: newSkillCatName.trim(), items: [] },
    ];
    const updated = { ...draftProfile, skills: updatedSkills };
    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
    setNewSkillCatName('');
    showToast('¡Nueva categoría de habilidades añadida!');
  };

  const handleAddSkillItem = (catIdx: number) => {
    if (!newSkillItem.text.trim()) return;
    const updatedSkills = draftProfile.skills.map((group, idx) => {
      if (idx === catIdx) {
        return {
          ...group,
          items: [...group.items, newSkillItem.text.trim()],
        };
      }
      return group;
    });

    const updated = { ...draftProfile, skills: updatedSkills };
    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
    setNewSkillItem({ catIdx: -1, text: '' });
  };

  const handleRemoveSkillItem = (catIdx: number, itemIdx: number) => {
    const updatedSkills = draftProfile.skills.map((group, idx) => {
      if (idx === catIdx) {
        return {
          ...group,
          items: group.items.filter((_, i) => i !== itemIdx),
        };
      }
      return group;
    });

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

  const handleStartEditSkillCategory = (catIdx: number, currentName: string) => {
    setEditingSkillCatIdx(catIdx);
    setEditingSkillCatName(currentName);
  };

  const handleSaveSkillCategoryName = (catIdx: number) => {
    if (!editingSkillCatName.trim()) return;
    const updatedSkills = draftProfile.skills.map((group, idx) => {
      if (idx === catIdx) {
        return { ...group, category: editingSkillCatName.trim() };
      }
      return group;
    });
    const updated = { ...draftProfile, skills: updatedSkills };
    setDraftProfile(updated);
    saveProfile(updated);
    onUpdateProfile(updated);
    setEditingSkillCatIdx(null);
    setEditingSkillCatName('');
    showToast('¡Nombre de categoría actualizado!');
  };

  // ----------------------------------------------------
  // SECURITY & RESET LOGIC
  // ----------------------------------------------------
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
    showToast('¡Contraseña de administrador actualizada en la nube y localmente!');
  };

  const handleResetFactory = () => {
    if (
      window.confirm(
        '⚠️ ATENCIÓN: ¿Deseas restablecer todos los datos, productos y perfiles a la versión inicial de fábrica de Educom-Tec? Se borrarán tus cambios personalizados guardados en este navegador.'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-5xl h-[96vh] sm:h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl bg-[#141618] border border-[#2d3134] shadow-2xl text-zinc-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-3.5 py-3 sm:px-6 sm:py-4 border-b border-[#2d3134] bg-[#181a1b] flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#00c2b2] to-[#38bdf8] p-0.5 shadow-md flex items-center justify-center text-[#121315] shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-bold font-syne text-white tracking-tight truncate">
                  Panel Administrador
                </h2>
                <span className="px-1.5 py-0.5 rounded-full bg-[#00c2b2]/20 border border-[#00c2b2]/50 text-[9px] sm:text-[10px] font-mono text-[#00c2b2] font-semibold shrink-0">
                  ACTIVO
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-400 font-mono hidden xs:block truncate">
                Gestión en tiempo real de catálogo, categorías, perfil y stack
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="admin-download-portable-btn"
              type="button"
              onClick={async () => {
                try {
                  showToast('Generando index.html portátil listo para Cloudflare y PC...');
                  await downloadStandaloneHtml();
                  showToast('¡Descargado! Puedes abrir index.html con doble clic o subirlo a Cloudflare.');
                } catch (err) {
                  console.error(err);
                  showToast('Error al generar archivo portátil.');
                }
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-[#2563eb] hover:bg-blue-500 text-white text-[11px] sm:text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              title="Descargar sitio compilado en un solo index.html para abrir en PC o subir a Cloudflare Pages"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar Web (Cloudflare / PC)</span>
              <span className="sm:hidden">Web</span>
            </button>
            <button
              id="admin-logout-btn"
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-full bg-[#232628] hover:bg-red-950/60 hover:text-red-300 border border-[#2d3134] hover:border-red-800 text-[11px] sm:text-xs font-mono text-zinc-400 transition-colors cursor-pointer"
              title="Cerrar sesión de administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>
            <button
              id="close-admin-panel-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full text-zinc-400 hover:text-white hover:bg-[#232628] transition-colors cursor-pointer"
              aria-label="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert Banner */}
        {toastMessage && (
          <div className="bg-[#00c2b2] text-[#121315] font-syne font-bold text-xs py-2 px-4 sm:px-6 flex items-center justify-between shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2 truncate">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs font-mono underline cursor-pointer shrink-0 ml-2"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar - Horizontal scrollable on mobile without wrapping & overlapping */}
        <div className="px-3 sm:px-6 bg-[#121315] border-b border-[#2d3134] flex items-center gap-1.5 sm:gap-2 shrink-0 py-2 sm:py-3 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            type="button"
            onClick={() => {
              setActiveTab('products');
              setEditingProductId(null);
            }}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
              activeTab === 'products'
                ? 'bg-[#00c2b2] text-[#121315] font-bold border-[#00c2b2] shadow-md'
                : 'text-zinc-300 hover:text-white bg-[#181a1b] border-[#2d3134] hover:border-zinc-500'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Sistemas ({draftProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
              activeTab === 'categories'
                ? 'bg-[#00c2b2] text-[#121315] font-bold border-[#00c2b2] shadow-md'
                : 'text-zinc-300 hover:text-white bg-[#181a1b] border-[#2d3134] hover:border-zinc-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categorías ({draftCategories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
              activeTab === 'profile'
                ? 'bg-[#00c2b2] text-[#121315] font-bold border-[#00c2b2] shadow-md'
                : 'text-zinc-300 hover:text-white bg-[#181a1b] border-[#2d3134] hover:border-zinc-500'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Perfil & Foto</span>
          </button>

          {/* Stack Tecnológico & Disciplinas */}
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
              activeTab === 'skills'
                ? 'bg-[#00c2b2] text-[#121315] font-bold border-[#00c2b2] shadow-md'
                : 'text-[#00c2b2] hover:text-white bg-[#181a1b] border-[#00c2b2]/40 hover:border-[#00c2b2]'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="font-bold">Stack TI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('experience')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
              activeTab === 'experience'
                ? 'bg-[#00c2b2] text-[#121315] font-bold border-[#00c2b2] shadow-md'
                : 'text-zinc-300 hover:text-white bg-[#181a1b] border-[#2d3134] hover:border-zinc-500'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Experiencia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
              activeTab === 'contact'
                ? 'bg-[#00c2b2] text-[#121315] font-bold border-[#00c2b2] shadow-md'
                : 'text-zinc-300 hover:text-white bg-[#181a1b] border-[#2d3134] hover:border-zinc-500'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contacto & WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border whitespace-nowrap shrink-0 ${
              activeTab === 'security'
                ? 'bg-[#00c2b2] text-[#121315] font-bold border-[#00c2b2] shadow-md'
                : 'text-zinc-400 hover:text-white bg-[#181a1b] border-[#2d3134] hover:border-zinc-500'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Seguridad</span>
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#141618]">
          {/* ========================================================= */}
          {/* TAB 1: PRODUCTS / SYSTEMS */}
          {/* ========================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {editingProductId ? (
                // Product Edit / Create Form
                <div className="p-6 rounded-2xl bg-[#181a1b] border border-[#2d3134] space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between pb-4 border-b border-[#2d3134]">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-[#00c2b2] font-semibold">
                        {isCreatingProduct ? 'NUEVO SISTEMA / PRODUCTO' : 'EDITAR SISTEMA'}
                      </span>
                      <h3 className="text-xl font-bold font-syne text-white">
                        {productForm.title || 'Sistema sin título'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingProductId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#232628] hover:bg-[#2d3134] text-zinc-300 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                        Categoría
                      </label>
                      <select
                        value={productForm.category || 'systems'}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm cursor-pointer"
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
                        placeholder="Ej. Consultar Cotización / Licencia + Soporte"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                        Estado
                      </label>
                      <select
                        value={productForm.status || 'Disponible'}
                        onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm cursor-pointer"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* BOTÓN "VER DEMO" — ENLACE WEB O CAPTURA DE DEMO */}
                  {/* ========================================================= */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#121315] border border-[#00c2b2]/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2d3134]">
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
                            Coloca la dirección web (URL) de tu demo en vivo, video, Drive o sube una captura desde tu dispositivo.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label
                          htmlFor="demo-file-upload"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#232628] hover:bg-[#2d3134] text-[#00c2b2] text-xs font-mono font-semibold cursor-pointer border border-[#00c2b2]/40 transition-colors"
                          title="Subir captura o imagen para el botón Ver Demo"
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
                              showToast('¡Captura de Demo cargada! Al pulsar "Ver Demo" se abrirá en pantalla completa.');
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
                              showToast('Enlace de Demo eliminado (el botón "Ver Demo" se ocultará en este sistema).');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-mono transition-colors cursor-pointer"
                            title="Quitar enlace de Demo"
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
                          placeholder="Ej: https://mi-sistema-demo.com, enlace de YouTube, Google Drive o deja vacío para ocultar"
                          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#181a1b] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
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
                      <span className="text-[11px] font-mono text-zinc-400 mt-1.5 block">
                        💡 Puedes pegar cualquier dirección web (`https://...`), un video demostrativo, o subir capturas abajo. Si lo dejas vacío, el botón "Ver Demo" no se mostrará en este sistema.
                      </span>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* IMAGEN DE PORTADA Y GALERÍA DE CAPTURAS DESDE DISPOSITIVO */}
                  {/* ========================================================= */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#121315] border border-[#2d3134] space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2d3134]">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold font-syne text-white uppercase tracking-wider">
                          Imagen de Portada & Capturas del Sistema
                        </h4>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          Sube imágenes directamente desde tu teléfono o computadora, o pega un enlace URL.
                        </p>
                      </div>
                      <label
                        htmlFor="product-cover-upload"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] text-xs font-syne font-bold uppercase tracking-wider cursor-pointer transition-all shrink-0 shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Subir Portada desde Dispositivo</span>
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
                            showToast('¡Imagen de portada subida desde tu dispositivo!');
                          } catch {
                            showToast('Error al procesar la imagen.');
                          }
                          e.target.value = '';
                        }}
                      />
                    </div>

                    {/* Portada Preview + URL Input */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-full sm:w-36 h-24 rounded-xl overflow-hidden border border-[#2d3134] bg-[#181a1b] shrink-0">
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
                          URL de Imagen de Portada (o sube archivo arriba)
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
                          className="w-full px-3.5 py-2 rounded-xl border border-[#2d3134] bg-[#181a1b] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Galería de Capturas Adicionales */}
                    <div className="pt-3 border-t border-[#2d3134] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-mono font-bold text-zinc-200 uppercase block">
                            Galería de Capturas / Pantallas de Demo ({(productForm.gallery || []).length})
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            Estas capturas se muestran en la ventana del sistema y en el visor interactivo "Ver Demo".
                          </span>
                        </div>

                        <label
                          htmlFor="product-gallery-upload"
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#232628] hover:bg-[#2d3134] text-[#00c2b2] border border-[#00c2b2]/40 text-xs font-mono font-semibold cursor-pointer transition-colors shrink-0"
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
                              const updatedGallery = [...currentGallery, ...compressedList];
                              setProductForm({
                                ...productForm,
                                imageUrl: productForm.imageUrl || compressedList[0],
                                gallery: updatedGallery,
                              });
                              showToast(`¡${compressedList.length} captura(s) añadida(s) a la galería del sistema!`);
                            } catch {
                              showToast('Error al subir una o más capturas.');
                            }
                            e.target.value = '';
                          }}
                        />
                      </div>

                      {/* Añadir captura por URL */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newGalleryUrl}
                          onChange={(e) => setNewGalleryUrl(e.target.value)}
                          placeholder="O pega aquí la URL de otra captura (https://...)"
                          className="flex-1 px-3 py-2 rounded-xl border border-[#2d3134] bg-[#181a1b] text-white font-mono text-xs focus:outline-hidden focus:border-[#00c2b2]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newGalleryUrl.trim()) return;
                            const updatedGallery = [...(productForm.gallery || []), newGalleryUrl.trim()];
                            setProductForm({ ...productForm, gallery: updatedGallery });
                            setNewGalleryUrl('');
                            showToast('Captura añadida a la galería.');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#232628] hover:bg-[#2d3134] text-zinc-200 text-xs font-mono font-bold border border-[#2d3134] cursor-pointer shrink-0"
                        >
                          + Añadir URL
                        </button>
                      </div>

                      {/* Miniaturas de la galería */}
                      {productForm.gallery && productForm.gallery.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                          {productForm.gallery.map((img, idx) => (
                            <div
                              key={idx}
                              className="relative group aspect-video rounded-xl overflow-hidden border border-[#2d3134] bg-[#181a1b]"
                            >
                              <img src={img} alt={`Captura ${idx + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductForm({ ...productForm, imageUrl: img });
                                    showToast('Establecida como imagen de portada principal.');
                                  }}
                                  className="px-2 py-1 rounded-md bg-[#00c2b2] text-[#121315] text-[10px] font-mono font-bold cursor-pointer"
                                  title="Usar como portada"
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
                                  title="Eliminar captura"
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

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                      Descripción Principal *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={productForm.description || ''}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Resumen del sistema para las tarjetas del catálogo..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                      Descripción Detallada (Vista ampliada)
                    </label>
                    <textarea
                      rows={4}
                      value={productForm.longDescription || ''}
                      onChange={(e) => setProductForm({ ...productForm, longDescription: e.target.value })}
                      placeholder="Especificaciones técnicas completas para el modal de detalle..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                    />
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
                        placeholder="PostgreSQL, React, TypeScript, Docker"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
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
                        placeholder="ERP, Inventario, SQL, API"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                      Características Principales (una por línea)
                    </label>
                    <textarea
                      rows={3}
                      value={(productForm.features || []).join('\n')}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          features: e.target.value.split('\n').filter((f) => f.trim().length > 0),
                        })
                      }
                      placeholder="Monitoreo de stock en tiempo real&#10;Facturación electrónica con validación&#10;Backups automáticos en NAS o Cloud"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white focus:outline-hidden focus:border-[#00c2b2] font-mono text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2d3134]">
                    <button
                      type="button"
                      onClick={() => setEditingProductId(null)}
                      className="px-5 py-2.5 rounded-xl text-xs font-mono bg-[#232628] hover:bg-[#2d3134] text-zinc-300 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProductForm}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold uppercase tracking-wider text-xs transition-all active:scale-95 shadow-md cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar Sistema</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Products List
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold font-syne text-white">
                        Sistemas & Productos en Catálogo
                      </h3>
                      <p className="text-xs text-zinc-400 font-mono">
                        Puedes editar las descripciones, precios o eliminar cualquier ítem.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCreateProduct}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold uppercase tracking-wider text-xs transition-all shadow-md cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Crear Nuevo Sistema</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {draftProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-4 rounded-2xl bg-[#181a1b] border border-[#2d3134] flex flex-col justify-between hover:border-[#00c2b2]/40 transition-colors"
                      >
                        <div className="flex items-start gap-3.5 mb-3">
                          <img
                            src={prod.imageUrl}
                            alt={prod.title}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-[#2d3134]"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="px-2 py-0.5 rounded-md bg-[#121315] border border-[#2d3134] text-[10px] font-mono text-[#00c2b2]">
                                {prod.categoryLabel || prod.category}
                              </span>
                              <span className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-400">
                                {prod.status}
                              </span>
                              {prod.demoUrl ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-700/50 text-[10px] font-mono text-emerald-300">
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>Demo activa</span>
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-500">
                                  Sin demo
                                </span>
                              )}
                            </div>
                            <h4 className="font-syne font-bold text-white text-sm truncate">
                              {prod.title}
                            </h4>
                            <p className="text-xs text-zinc-400 line-clamp-2 mt-0.5 font-normal">
                              {prod.description}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#2d3134] flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-[#00c2b2]">
                            {prod.price || 'Consultar Cotización'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleStartEditProduct(prod)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#232628] hover:bg-[#2d3134] text-zinc-200 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#00c2b2]" />
                              <span>Editar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id, prod.title)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: CATEGORIES */}
          {/* ========================================================= */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold font-syne text-white">
                  Pestañas de Categorías del Catálogo
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Estas son las pestañas que tus visitantes ven arriba de los productos para filtrar.
                </p>
              </div>

              {/* Add category box */}
              <div className="p-5 rounded-2xl bg-[#181a1b] border border-[#2d3134] space-y-4">
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
                      className="w-full px-3.5 py-2 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-xs focus:outline-hidden focus:border-[#00c2b2]"
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
                      className="w-full px-3.5 py-2 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-xs focus:outline-hidden focus:border-[#00c2b2]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold uppercase text-xs tracking-wider transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Agregar Categoría</span>
                </button>
              </div>

              {/* Current Categories List */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                  Categorías Actuales ({draftCategories.length})
                </span>
                <div className="space-y-2.5">
                  {draftCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="p-3.5 rounded-xl bg-[#181a1b] border border-[#2d3134] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-[#121315] border border-[#2d3134] text-xs font-mono text-[#00c2b2] font-semibold">
                          {cat.id}
                        </span>
                        <input
                          type="text"
                          value={cat.label}
                          onChange={(e) => handleUpdateCategoryLabel(cat.id, e.target.value)}
                          className="px-3 py-1 rounded-lg bg-[#121315] border border-[#2d3134] text-white text-xs font-mono focus:border-[#00c2b2] focus:outline-hidden w-64"
                        />
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
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PROFILE & ABOUT ME */}
          {/* ========================================================= */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold font-syne text-white">
                    Información Personal & Sección "Sobre Mí"
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Edita tu foto oficial, textos del Hero y biografía de la Slide 03 (Sobre Mí).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('skills')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#00c2b2]/10 hover:bg-[#00c2b2]/20 border border-[#00c2b2]/40 text-[#00c2b2] text-xs font-mono font-bold transition-all cursor-pointer shrink-0"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Editar Stack & Disciplinas &rarr;</span>
                </button>
              </div>

              {/* Banner destacado para acceso rápido a Stack Tecnológico */}
              <div className="p-4 rounded-2xl bg-[#121315] border border-[#00c2b2]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#00c2b2]/10 text-[#00c2b2] border border-[#00c2b2]/30 shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-syne text-white uppercase tracking-wider">
                      Stack Tecnológico & Disciplinas
                    </h4>
                    <p className="text-[11px] text-zinc-400 font-mono">
                      Categorías activas ({draftProfile.skills.length}): {draftProfile.skills.map((s) => s.category).join(' • ')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('skills')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold text-xs uppercase tracking-wider shrink-0 transition-all cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Modificar Disciplinas &rarr;</span>
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-[#181a1b] border border-[#2d3134] space-y-5">
                {/* Foto de Perfil / Avatar */}
                <div className="p-4 rounded-2xl bg-[#121315] border border-[#2d3134] flex flex-col sm:flex-row items-start sm:items-center gap-5">
                  <div className="relative group shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#00c2b2] shadow-lg bg-[#181a1b]">
                      <img
                        src={draftProfile.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <label
                      htmlFor="profile-photo-upload"
                      className="absolute inset-0 rounded-full bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-mono"
                      title="Subir foto desde tu dispositivo"
                    >
                      <Camera className="w-5 h-5 mb-0.5 text-[#00c2b2]" />
                      <span>Subir</span>
                    </label>
                    <input
                      id="profile-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2.5 * 1024 * 1024) {
                            showToast('La imagen excede 2.5MB. Por favor usa una imagen más liviana.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setDraftProfile({ ...draftProfile, avatarUrl: reader.result });
                              showToast('Foto cargada. Haz clic en "Guardar Información de Perfil" para aplicarla.');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-mono font-bold text-zinc-300 uppercase">
                        Foto de Perfil Oficial (Sobre Mí & Portafolio)
                      </label>
                      <label
                        htmlFor="profile-photo-upload-btn"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#232628] hover:bg-[#2d3134] text-[#00c2b2] text-xs font-mono font-semibold cursor-pointer border border-[#2d3134]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir desde dispositivo</span>
                      </label>
                      <input
                        id="profile-photo-upload-btn"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2.5 * 1024 * 1024) {
                              showToast('La imagen excede 2.5MB. Por favor usa una imagen más liviana.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setDraftProfile({ ...draftProfile, avatarUrl: reader.result });
                                showToast('Foto cargada. Haz clic en "Guardar Información de Perfil" para aplicarla.');
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <input
                      type="url"
                      value={draftProfile.avatarUrl || ''}
                      onChange={(e) => setDraftProfile({ ...draftProfile, avatarUrl: e.target.value })}
                      placeholder="O pega un enlace de imagen (https://...)"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#2d3134] bg-[#181a1b] text-white font-mono text-xs focus:outline-hidden focus:border-[#00c2b2]"
                    />
                    <p className="text-[11px] font-mono text-zinc-500">
                      Puedes subir tu foto desde tu dispositivo o pegar un enlace web directo.
                    </p>
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                    Tagline de Bienvenida (Párrafo destacado en Hero)
                  </label>
                  <textarea
                    rows={2}
                    value={draftProfile.tagline}
                    onChange={(e) => setDraftProfile({ ...draftProfile, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                  />
                </div>

                {/* Stats / KPIs */}
                <div>
                  <span className="block text-xs font-mono font-bold text-zinc-300 mb-3 uppercase">
                    Métricas & KPIs Destacados
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {draftProfile.stats.map((stat, sIdx) => (
                      <div key={sIdx} className="p-3 rounded-xl bg-[#121315] border border-[#2d3134] space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 block">{stat.label}</label>
                        <input
                          type="text"
                          value={stat.value}
                          onChange={(e) => {
                            const newStats = [...draftProfile.stats];
                            newStats[sIdx] = { ...newStats[sIdx], value: e.target.value };
                            setDraftProfile({ ...draftProfile, stats: newStats });
                          }}
                          className="w-full px-2.5 py-1 text-sm font-bold font-syne text-[#00c2b2] bg-[#181a1b] border border-[#2d3134] rounded-lg focus:outline-hidden"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#2d3134] flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold uppercase tracking-wider text-xs transition-all shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Información de Perfil</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: CONTACT & WHATSAPP */}
          {/* ========================================================= */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold font-syne text-white">
                  Canales de Contacto Directo, WhatsApp & Redes Sociales
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Personaliza tu número de WhatsApp para chat directo y agrega todas tus redes (Instagram, Facebook, LinkedIn, etc.).
                </p>
              </div>

              {/* WhatsApp Configuration Card */}
              <div className="p-6 rounded-2xl bg-[#181a1b] border border-[#25D366]/30 space-y-5 relative overflow-hidden">
                <div className="flex items-center gap-3 pb-3 border-b border-[#2d3134]">
                  <div className="p-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30">
                    <MessageCircle className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-syne text-white flex items-center gap-2">
                      <span>Contacto Directo por WhatsApp</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#25D366]/10 text-[#25D366] text-[10px] font-mono font-bold">
                        Enlace wa.me
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400 font-mono">
                      Permite que tus clientes te escriban directamente con 1 solo clic desde la web y el botón flotante.
                    </p>
                  </div>
                </div>

                {/* Explanatory banner: What to write here */}
                <div className="p-3.5 rounded-xl bg-[#25D366]/5 border border-[#25D366]/25 text-xs font-mono space-y-1.5 text-zinc-300">
                  <div className="flex items-center gap-1.5 text-[#25D366] font-bold text-xs">
                    <Check className="w-4 h-4" />
                    <span>¿Qué se coloca aquí?</span>
                  </div>
                  <p className="leading-relaxed">
                    Coloca tu <strong className="text-white">número telefónico con el código de país</strong> (ejemplo para Venezuela: <code className="text-[#25D366] font-bold px-1 py-0.5 rounded bg-[#121315]">+58 412 1234567</code>). 
                    No es necesario inventar enlaces raros; el sistema generará automáticamente tu enlace oficial <code className="text-zinc-300">wa.me</code> para que tus clientes chateen contigo de inmediato.
                  </p>
                </div>

                {/* Country Quick Buttons */}
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold block mb-2">
                    Atajo: Toca tu país para colocar el código correspondiente:
                  </span>
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
                          
                          // Also sync into socials if whatsapp row exists
                          const updatedSocials = draftProfile.socials.map((s) => {
                            if (s.name.toLowerCase().includes('whatsapp') || s.name.toLowerCase().includes('teléfono')) {
                              return { ...s, url: newWaUrl };
                            }
                            return s;
                          });

                          setDraftProfile({
                            ...draftProfile,
                            whatsapp: newWaUrl,
                            whatsappNumber: newPhone,
                            socials: updatedSocials,
                          });
                          showToast(`Código ${country.name} (${country.code}) aplicado a WhatsApp`);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#121315] hover:bg-[#202326] border border-[#2d3134] hover:border-[#25D366]/50 text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer active:scale-95"
                      >
                        <span className="text-sm">{country.flag}</span>
                        <span className="font-bold text-[#25D366]">{country.code}</span>
                        <span className="text-[10px] text-zinc-400">{country.name}</span>
                      </button>
                    ))}
                  </div>
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

                        const updatedSocials = draftProfile.socials.map((s) => {
                          if (s.name.toLowerCase().includes('whatsapp') || s.name.toLowerCase().includes('teléfono')) {
                            return { ...s, url: newUrl };
                          }
                          return s;
                        });

                        setDraftProfile({
                          ...draftProfile,
                          whatsapp: newUrl,
                          whatsappNumber: val,
                          socials: updatedSocials,
                        });
                      }}
                      placeholder="Ej: +58 412 1234567 o +54 9 11 1234 5678"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-sm focus:outline-hidden focus:border-[#25D366]"
                    />
                    <span className="text-[11px] font-mono text-zinc-400 mt-1 block">
                      Escribe tu número con el signo + y código de país (ej: +58 para Venezuela, +57 para Colombia).
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                      Mensaje Predeterminado del Chat
                    </label>
                    <input
                      type="text"
                      value={whatsappMessage}
                      onChange={(e) => {
                        setWhatsappMessage(e.target.value);
                        const clean = whatsappPhone.replace(/[^0-9]/g, '');
                        if (clean) {
                          const newUrl = `https://wa.me/${clean}?text=${encodeURIComponent(e.target.value)}`;
                          const updatedSocials = draftProfile.socials.map((s) => {
                            if (s.name.toLowerCase().includes('whatsapp') || s.name.toLowerCase().includes('teléfono')) {
                              return { ...s, url: newUrl };
                            }
                            return s;
                          });
                          setDraftProfile({
                            ...draftProfile,
                            whatsapp: newUrl,
                            socials: updatedSocials,
                          });
                        }
                      }}
                      placeholder="Hola Raul, deseo consultar por servicios de Educom-Tec"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-sm focus:outline-hidden focus:border-[#25D366]"
                    />
                    <span className="text-[11px] font-mono text-zinc-400 mt-1 block">
                      Texto que tu cliente verá listo para enviar al presionar tu botón de WhatsApp.
                    </span>
                  </div>
                </div>

                {/* Generated URL & Direct Test Button */}
                <div className="p-3.5 rounded-xl bg-[#121315] border border-[#2d3134] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="w-full sm:flex-1 truncate">
                    <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">
                      Enlace wa.me generado automáticamente:
                    </span>
                    <span className="text-xs font-mono text-emerald-400 truncate block font-medium">
                      {draftProfile.whatsapp ||
                        (whatsappPhone.replace(/[^0-9]/g, '')
                          ? `https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
                          : 'Pendiente por ingresar número telefónico...')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const clean = whatsappPhone.replace(/[^0-9]/g, '');
                      const url =
                        draftProfile.whatsapp ||
                        (clean
                          ? `https://wa.me/${clean}?text=${encodeURIComponent(whatsappMessage)}`
                          : null);
                      if (!url) {
                        showToast('Por favor escribe tu número antes de probar el enlace.');
                        return;
                      }
                      window.open(url, '_blank');
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] text-xs font-mono font-bold transition-all border border-[#25D366]/40 cursor-pointer shrink-0 active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Probar Enlace WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Email Section */}
              <div className="p-6 rounded-2xl bg-[#181a1b] border border-[#2d3134] space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-zinc-300 mb-1.5 uppercase">
                    Correo Electrónico Principal
                  </label>
                  <input
                    type="email"
                    value={draftProfile.email}
                    onChange={(e) => setDraftProfile({ ...draftProfile, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#2d3134] bg-[#121315] text-white font-mono text-sm focus:outline-hidden focus:border-[#00c2b2]"
                  />
                  <span className="text-[11px] font-mono text-zinc-500 mt-1 block">
                    A este correo se envían las consultas y es el que se copia con 1-clic en la Slide 04.
                  </span>
                </div>
              </div>

              {/* Social Networks Management */}
              <div className="p-6 rounded-2xl bg-[#181a1b] border border-[#2d3134] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold font-syne text-white uppercase tracking-wider">
                      Redes Sociales & Enlaces Personalizados
                    </h4>
                    <p className="text-xs text-zinc-400 font-mono">
                      Agrega perfiles de Instagram, Facebook, LinkedIn, GitHub, YouTube o cualquier enlace web.
                    </p>
                  </div>

                  {!isAddingSocial && (
                    <button
                      type="button"
                      onClick={() => setIsAddingSocial(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold uppercase text-xs tracking-wider transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>+ Añadir Red Social</span>
                    </button>
                  )}
                </div>

                {/* Quick Presets Buttons */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-zinc-400 block font-semibold">
                    Atajos rápidos para agregar redes populares:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleAddSocialNetwork('Instagram', 'https://instagram.com/tu_usuario', 'Instagram')
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#232628] hover:bg-[#2d3134] text-pink-400 hover:text-pink-300 border border-[#2d3134] text-xs font-mono transition-colors cursor-pointer"
                    >
                      <Instagram className="w-3.5 h-3.5" />
                      <span>+ Instagram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddSocialNetwork('Facebook', 'https://facebook.com/tu_pagina', 'Facebook')
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#232628] hover:bg-[#2d3134] text-blue-400 hover:text-blue-300 border border-[#2d3134] text-xs font-mono transition-colors cursor-pointer"
                    >
                      <Facebook className="w-3.5 h-3.5" />
                      <span>+ Facebook</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddSocialNetwork('LinkedIn', 'https://linkedin.com/in/tu_perfil', 'Linkedin')
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#232628] hover:bg-[#2d3134] text-sky-400 hover:text-sky-300 border border-[#2d3134] text-xs font-mono transition-colors cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>+ LinkedIn</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddSocialNetwork('YouTube', 'https://youtube.com/@tu_canal', 'Youtube')
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#232628] hover:bg-[#2d3134] text-red-400 hover:text-red-300 border border-[#2d3134] text-xs font-mono transition-colors cursor-pointer"
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span>+ YouTube</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddSocialNetwork('X / Twitter', 'https://x.com/tu_usuario', 'Twitter')
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#232628] hover:bg-[#2d3134] text-zinc-300 hover:text-white border border-[#2d3134] text-xs font-mono transition-colors cursor-pointer"
                    >
                      <Twitter className="w-3.5 h-3.5" />
                      <span>+ X (Twitter)</span>
                    </button>
                  </div>
                </div>

                {/* Form to add custom social */}
                {isAddingSocial && (
                  <div className="p-4 rounded-xl bg-[#121315] border border-[#00c2b2]/40 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#00c2b2] uppercase">
                        + Nueva Red Social o Enlace
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingSocial(false)}
                        className="text-zinc-500 hover:text-zinc-300 text-xs font-mono cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Nombre de la Red (ej: Instagram, Facebook, TikTok)
                        </label>
                        <input
                          type="text"
                          value={newSocialName}
                          onChange={(e) => setNewSocialName(e.target.value)}
                          placeholder="Ej: Instagram Personal"
                          className="w-full px-3 py-2 rounded-lg bg-[#181a1b] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                          Dirección URL (https://...)
                        </label>
                        <input
                          type="url"
                          value={newSocialUrl}
                          onChange={(e) => setNewSocialUrl(e.target.value)}
                          placeholder="https://instagram.com/tu_cuenta"
                          className="w-full px-3 py-2 rounded-lg bg-[#181a1b] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingSocial(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSocialNetwork(newSocialName, newSocialUrl, 'Globe')}
                        className="px-4 py-1.5 rounded-lg bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold text-xs uppercase cursor-pointer"
                      >
                        Guardar Red Social
                      </button>
                    </div>
                  </div>
                )}

                {/* List of current socials */}
                <div className="space-y-3">
                  <span className="text-[11px] font-mono text-zinc-400 block font-semibold">
                    Redes y Enlaces Actualmente Configurados ({draftProfile.socials.length}):
                  </span>
                  {draftProfile.socials.map((social, sIdx) => {
                    const isWa = social.name.toLowerCase().includes('whatsapp');
                    const isIg = social.name.toLowerCase().includes('instagram');
                    const isFb = social.name.toLowerCase().includes('facebook');
                    const isYt = social.name.toLowerCase().includes('youtube');
                    const isTw = social.name.toLowerCase().includes('twitter') || social.name.toLowerCase().includes('x');

                    return (
                      <div
                        key={sIdx}
                        className="p-3.5 rounded-xl bg-[#121315] border border-[#2d3134] flex flex-col sm:flex-row items-center gap-3"
                      >
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                          <div
                            className={`p-2 rounded-lg border ${
                              isWa
                                ? 'bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30'
                                : isIg
                                ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
                                : isFb
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                : isYt
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : isTw
                                ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                                : 'bg-[#181a1b] text-[#00c2b2] border-[#2d3134]'
                            }`}
                          >
                            {isWa ? (
                              <MessageCircle className="w-4 h-4 fill-current" />
                            ) : isIg ? (
                              <Instagram className="w-4 h-4" />
                            ) : isFb ? (
                              <Facebook className="w-4 h-4" />
                            ) : isYt ? (
                              <Youtube className="w-4 h-4" />
                            ) : isTw ? (
                              <Twitter className="w-4 h-4" />
                            ) : (
                              <Globe className="w-4 h-4" />
                            )}
                          </div>

                          <input
                            type="text"
                            value={social.name}
                            onChange={(e) => {
                              const updatedSocials = [...draftProfile.socials];
                              updatedSocials[sIdx] = { ...updatedSocials[sIdx], name: e.target.value };
                              setDraftProfile({ ...draftProfile, socials: updatedSocials });
                            }}
                            className="w-full sm:w-44 px-3 py-1.5 rounded-lg bg-[#181a1b] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden"
                            placeholder="Nombre red"
                          />
                        </div>

                        <div className="flex-1 w-full">
                          {isWa ? (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={
                                  social.url.startsWith('https://wa.me/')
                                    ? (whatsappPhone || social.url.split('?')[0].replace('https://wa.me/', '+'))
                                    : social.url
                                }
                                onChange={(e) => {
                                  const val = e.target.value;
                                  let formatted = val;
                                  const cleanDigits = val.replace(/[^0-9]/g, '');
                                  if (cleanDigits) {
                                    formatted = `https://wa.me/${cleanDigits}${
                                      whatsappMessage.trim() ? `?text=${encodeURIComponent(whatsappMessage.trim())}` : ''
                                    }`;
                                    setWhatsappPhone(val);
                                  }
                                  const updatedSocials = [...draftProfile.socials];
                                  updatedSocials[sIdx] = { ...updatedSocials[sIdx], url: formatted };
                                  setDraftProfile({
                                    ...draftProfile,
                                    socials: updatedSocials,
                                    whatsapp: formatted.startsWith('https://wa.me/') ? formatted : draftProfile.whatsapp,
                                    whatsappNumber: val,
                                  });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-[#181a1b] border border-[#25D366]/40 text-xs font-mono text-white focus:outline-hidden focus:border-[#25D366]"
                                placeholder="Escribe tu número (ej: +58 412 1234567) o enlace wa.me"
                              />
                              <span className="text-[10px] font-mono text-[#25D366] block">
                                📱 Introduce tu número con código de país (ej: +58...). O si prefieres, elimina esta fila con la papelera de la derecha.
                              </span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={social.url}
                              onChange={(e) => {
                                const updatedSocials = [...draftProfile.socials];
                                updatedSocials[sIdx] = { ...updatedSocials[sIdx], url: e.target.value };
                                setDraftProfile({ ...draftProfile, socials: updatedSocials });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-[#181a1b] border border-[#2d3134] text-xs font-mono text-zinc-300 focus:outline-hidden focus:border-[#00c2b2]"
                              placeholder={
                                isIg
                                  ? 'https://instagram.com/tu_usuario'
                                  : isFb
                                  ? 'https://facebook.com/tu_pagina'
                                  : isYt
                                  ? 'https://youtube.com/@tu_canal'
                                  : isTw
                                  ? 'https://x.com/tu_usuario'
                                  : 'https://...'
                              }
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {social.url && (
                            <button
                              type="button"
                              onClick={() => {
                                const targetUrl = social.url.startsWith('http')
                                  ? social.url
                                  : `https://wa.me/${social.url.replace(/[^0-9]/g, '')}`;
                                window.open(targetUrl, '_blank');
                              }}
                              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#232628] transition-colors cursor-pointer"
                              title="Visitar enlace"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteSocialNetwork(sIdx);
                            }}
                            className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 transition-all cursor-pointer active:scale-90"
                            title={`Eliminar "${social.name}"`}
                            aria-label={`Eliminar ${social.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#2d3134] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-zinc-400">
                    💡 Todos los cambios se guardan localmente y se respaldan en la nube.
                  </span>

                  <button
                    type="button"
                    onClick={() => handleUpdateContact(draftProfile.email, draftProfile.whatsapp || '')}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold uppercase tracking-wider text-xs transition-all shadow-md cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar Canales, Redes & WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: EXPERIENCE */}
          {/* ========================================================= */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold font-syne text-white">
                    Historial Profesional & Trayectoria
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Puestos y roles que aparecen en la cronología laboral de la Slide 03.
                  </p>
                </div>
                {!isAddingExp && editingExpIdx === null && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingExp(true);
                      setExpForm({ role: '', company: '', period: '', description: '' });
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold uppercase text-xs tracking-wider transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>+ Añadir Posición</span>
                  </button>
                )}
              </div>

              {/* Form to add or edit experience */}
              {(isAddingExp || editingExpIdx !== null) && (
                <div className="p-5 rounded-2xl bg-[#181a1b] border border-[#2d3134] space-y-4 animate-fadeIn">
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
                        placeholder="Analista de Soporte TI"
                        className="w-full px-3 py-2 rounded-xl bg-[#121315] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Empresa / Firma</label>
                      <input
                        type="text"
                        value={expForm.company}
                        onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                        placeholder="Educom-Tec — Soluciones Informáticas"
                        className="w-full px-3 py-2 rounded-xl bg-[#121315] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-zinc-400 mb-1">Período</label>
                      <input
                        type="text"
                        value={expForm.period}
                        onChange={(e) => setExpForm({ ...expForm, period: e.target.value })}
                        placeholder="2022 — Presente"
                        className="w-full px-3 py-2 rounded-xl bg-[#121315] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 mb-1">Descripción de Funciones</label>
                    <textarea
                      rows={3}
                      value={expForm.description}
                      onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                      placeholder="Responsabilidades técnicas, logros y tecnologías manejadas..."
                      className="w-full px-3 py-2 rounded-xl bg-[#121315] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingExp(false);
                        setEditingExpIdx(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-mono bg-[#232628] hover:bg-[#2d3134] text-zinc-300 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveExperience}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold uppercase text-xs cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Experience list */}
              <div className="space-y-3">
                {draftProfile.experience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#181a1b] border border-[#2d3134] flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-syne font-bold text-white text-sm">{exp.role}</h4>
                        <span className="text-[11px] font-mono text-[#00c2b2] font-semibold">{exp.period}</span>
                      </div>
                      <p className="text-xs font-mono text-[#e06b3a] mt-0.5">{exp.company}</p>
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
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#232628] transition-colors cursor-pointer"
                        title="Editar posición"
                      >
                        <Edit2 className="w-4 h-4 text-[#00c2b2]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExperience(idx)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Eliminar posición"
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
          {/* TAB 4 (o Tab Skills): STACK TECNOLÓGICO & DISCIPLINAS */}
          {/* ========================================================= */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold font-syne text-white">
                    Stack Tecnológico & Disciplinas
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Edita, agrega y personaliza las disciplinas de soporte TI, desarrollo, infraestructura y tecnologías clave mostradas en la página.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#232628] hover:bg-[#2d3134] text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer border border-[#2d3134] shrink-0"
                >
                  <span>&larr; Volver a Sobre Mí & Perfil</span>
                </button>
              </div>

              {/* Add Skill Category */}
              <div className="p-4 rounded-2xl bg-[#181a1b] border border-[#2d3134] flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  value={newSkillCatName}
                  onChange={(e) => setNewSkillCatName(e.target.value)}
                  placeholder="Nombre de nueva categoría o disciplina (ej: Redes & MikroTik, Cloud & DevOps)"
                  className="flex-1 w-full px-3.5 py-2 rounded-xl bg-[#121315] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden focus:border-[#00c2b2]"
                />
                <button
                  type="button"
                  onClick={handleAddSkillCategory}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold uppercase text-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Crear Categoría</span>
                </button>
              </div>

              {/* Skills Groups Grid */}
              <div className="space-y-4">
                {draftProfile.skills.map((group, gIdx) => (
                  <div key={gIdx} className="p-5 rounded-2xl bg-[#181a1b] border border-[#2d3134] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#2d3134]">
                      {editingSkillCatIdx === gIdx ? (
                        <div className="flex items-center gap-2 flex-1 mr-3">
                          <input
                            type="text"
                            value={editingSkillCatName}
                            onChange={(e) => setEditingSkillCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveSkillCategoryName(gIdx);
                              } else if (e.key === 'Escape') {
                                setEditingSkillCatIdx(null);
                                setEditingSkillCatName('');
                              }
                            }}
                            className="flex-1 px-2.5 py-1 rounded-lg bg-[#121315] border border-[#00c2b2] text-xs font-mono font-bold text-white uppercase focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveSkillCategoryName(gIdx)}
                            className="p-1 rounded-lg bg-[#00c2b2] text-[#121315] hover:bg-[#00d6c4] cursor-pointer"
                            title="Guardar nombre"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSkillCatIdx(null);
                              setEditingSkillCatName('');
                            }}
                            className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="font-syne font-bold text-white text-sm uppercase tracking-wider">
                            {group.category}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleStartEditSkillCategory(gIdx, group.category)}
                            className="p-1 rounded-md text-zinc-500 hover:text-[#00c2b2] transition-colors cursor-pointer"
                            title="Renombrar categoría"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteSkillCategory(gIdx)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                        title="Eliminar categoría entera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Skill chips */}
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item, iIdx) => (
                        <span
                          key={iIdx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#121315] border border-[#2d3134] text-xs font-mono text-zinc-200"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkillItem(gIdx, iIdx)}
                            className="text-zinc-500 hover:text-red-400 cursor-pointer ml-1"
                            title="Eliminar habilidad"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Add single skill item */}
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
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#121315] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden focus:border-[#00c2b2]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSkillItem(gIdx)}
                        className="px-3 py-1.5 rounded-lg bg-[#232628] hover:bg-[#2d3134] text-[#00c2b2] font-mono text-xs cursor-pointer"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: SECURITY & RESET */}
          {/* ========================================================= */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold font-syne text-white">
                  Seguridad, Clave de Acceso & Opciones de Sistema
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  Cambia tu contraseña de administrador o restablece la plataforma si fuera necesario.
                </p>
              </div>

              {/* Change password card */}
              <div className="p-6 rounded-2xl bg-[#181a1b] border border-[#2d3134] space-y-4 max-w-lg">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00c2b2] block">
                  Modificar Clave de Acceso
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121315] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden focus:border-[#00c2b2]"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#121315] border border-[#2d3134] text-xs font-mono text-white focus:outline-hidden focus:border-[#00c2b2]"
                    />
                  </div>

                  {passwordError && (
                    <p className="text-xs font-mono text-red-400">{passwordError}</p>
                  )}

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00c2b2] hover:bg-[#00d6c4] text-[#121315] font-syne font-bold uppercase text-xs cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Actualizar Contraseña</span>
                  </button>
                </form>
              </div>

              {/* Reset to factory defaults card */}
              <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-3 max-w-lg">
                <div className="flex items-center gap-2 text-red-400 font-syne font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Zona de Peligro / Restablecer de Fábrica</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-normal">
                  Si deseas eliminar todos los datos personalizados guardados en tu navegador y volver a la configuración original de Educom-Tec, puedes usar este botón.
                </p>
                <button
                  type="button"
                  onClick={handleResetFactory}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/40 hover:bg-red-800/60 text-red-200 border border-red-700/50 font-mono text-xs cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Datos de Fábrica</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-[#2d3134] bg-[#181a1b] flex items-center justify-between text-xs font-mono text-zinc-500 shrink-0">
          <span>Firmado & Autenticado: Raúl Eduardo Rodríguez // Educom-Tec</span>
          <span className="text-[#00c2b2] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00c2b2] animate-pulse" />
            <span>Sincronizado con Google Cloud Firestore (Público & Global)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
