import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ProductShowcase } from './components/ProductShowcase';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AddProductModal } from './components/AddProductModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { ConstellationBackground } from './components/ConstellationBackground';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import {
  getStoredProducts,
  saveProducts,
  getStoredProfile,
  saveProfile,
  getStoredCategories,
  saveCategories,
  setAdminPassword,
} from './data/portfolioData';
import {
  fetchProductsFromCloud,
  fetchCategoriesFromCloud,
  fetchProfileFromCloud,
  fetchAdminPasswordFromCloud,
  syncAllProductsToCloud,
  syncCategoriesToCloud,
  saveProfileToCloud,
  saveProductToCloud,
} from './lib/firestoreService';
import { ProductOrProject, UserProfile, ShowcaseCategory } from './types';

const ADMIN_SESSION_KEY = 'educom_admin_logged_in_v4';

function detectIsAdminRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  if (win.__EDUCOM_FORCE_ADMIN_PAGE__ === true) return true;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return (
    path.endsWith('/admin.html') ||
    path.endsWith('/admin') ||
    search.includes('page=admin') ||
    hash === '#admin' ||
    hash === '#/admin'
  );
}

export function App() {
  // Portfolio & Catalog State
  const [products, setProducts] = useState<ProductOrProject[]>(() => getStoredProducts());
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());
  const [categories, setCategories] = useState<ShowcaseCategory[]>(() => getStoredCategories());

  // Selected product for detailed modal
  const [selectedProduct, setSelectedProduct] = useState<ProductOrProject | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Admin session & Page route state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminPageOpen, setIsAdminPageOpen] = useState<boolean>(() => detectIsAdminRoute());
  const [cloudPassword, setCloudPassword] = useState<string | null>(null);

  // Light / Dark Mode Theme State (Default: Dark mode as primary corporate technical look)
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('educom_theme_mode');
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  // Listen to browser popstate / hashchange so admin.html / ?page=admin / #admin navigation works smoothly
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminPageOpen(detectIsAdminRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const openAdminPage = useCallback(() => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('page', 'admin');
      window.history.pushState({ page: 'admin' }, '', url.toString());
    } catch {
      // Fallback if history pushState is restricted
    }
    setIsAdminPageOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const closeAdminPage = useCallback(() => {
    const win = window as any;
    const path = window.location.pathname.toLowerCase();
    if (win.__EDUCOM_FORCE_ADMIN_PAGE__ === true || path.endsWith('/admin.html')) {
      win.__EDUCOM_FORCE_ADMIN_PAGE__ = false;
      try {
        const target = path.endsWith('/admin.html')
          ? window.location.pathname.replace(/admin\.html$/i, 'index.html')
          : './index.html';
        window.location.href = target;
        return;
      } catch {
        // Fallback to in-place state switch
      }
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('page');
      if (url.hash.toLowerCase().includes('admin')) {
        url.hash = '';
      }
      window.history.pushState({ page: 'home' }, '', url.toString());
    } catch {
      // Ignore
    }
    setIsAdminPageOpen(false);
  }, []);

  // Apply `.dark` class to `<html>`
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('educom_theme_mode', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  // Cloud Synchronization (NocoDB Cloud Primary + Firestore Backup)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [cloudProducts, cloudCategories, cloudProfile, remotePass] = await Promise.all([
          fetchProductsFromCloud(),
          fetchCategoriesFromCloud(),
          fetchProfileFromCloud(),
          fetchAdminPasswordFromCloud(),
        ]);

        if (!isMounted) return;

        if (cloudProducts && cloudProducts.length > 0) {
          setProducts(cloudProducts);
          saveProducts(cloudProducts);
        }
        if (cloudCategories && cloudCategories.length > 0) {
          setCategories(cloudCategories);
          saveCategories(cloudCategories);
        }
        if (cloudProfile && cloudProfile.name) {
          setProfile(cloudProfile);
          saveProfile(cloudProfile);
        }
        if (remotePass) {
          setCloudPassword(remotePass);
          setAdminPassword(remotePass);
        }
      } catch (err) {
        console.warn('Initial cloud sync warning:', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Scroll to section helper
  const handleNavigate = useCallback(
    (sectionId: string) => {
      if (isAdminPageOpen) {
        closeAdminPage();
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 120);
        return;
      }
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [isAdminPageOpen, closeAdminPage]
  );

  // Pre-filled consultation jump to Contact form
  const [preselectedInquiry, setPreselectedInquiry] = useState<string>('');

  const handleContactProduct = (product: ProductOrProject) => {
    setSelectedProduct(null);
    setPreselectedInquiry(`Cotización / Demo: ${product.title}`);
    handleNavigate('contact');
  };

  // Add Product Handler
  const handleAddProduct = (newProduct: ProductOrProject) => {
    const updated = [newProduct, ...products];
    setProducts(updated);
    saveProducts(updated);
    saveProductToCloud(newProduct);
  };

  // Admin Update Handlers
  const handleUpdateProducts = (updatedProducts: ProductOrProject[]) => {
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    syncAllProductsToCloud(updatedProducts);
  };

  const handleUpdateCategories = (updatedCategories: ShowcaseCategory[]) => {
    setCategories(updatedCategories);
    saveCategories(updatedCategories);
    syncCategoriesToCloud(updatedCategories);
  };

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
    saveProfileToCloud(updatedProfile);
  };

  const handleAdminLogout = () => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore
    }
    setIsAdminLoggedIn(false);
    closeAdminPage();
  };

  // Dedicated Full-Page Admin Route (`admin.html` / `?page=admin`)
  if (isAdminPageOpen) {
    return (
      <AdminPanelModal
        isOpen={true}
        isFullPage={true}
        isAuthenticated={isAdminLoggedIn}
        cloudPassword={cloudPassword}
        onLoginSuccess={() => {
          try {
            sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
          } catch {
            // Ignore
          }
          setIsAdminLoggedIn(true);
        }}
        onClose={closeAdminPage}
        products={products}
        categories={categories}
        profile={profile}
        onUpdateProducts={handleUpdateProducts}
        onUpdateCategories={handleUpdateCategories}
        onUpdateProfile={handleUpdateProfile}
        onLogout={handleAdminLogout}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0c101b] text-slate-900 dark:text-slate-100 relative selection:bg-[#2563eb] selection:text-white transition-colors duration-300">
      {/* Subtle Ambient Background */}
      <ConstellationBackground />

      {/* Top Sticky Navbar */}
      <Navbar
        onNavigate={handleNavigate}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => openAdminPage()}
        onOpenAdminPanel={() => openAdminPage()}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        avatarUrl={profile.avatarUrl}
      />

      {/* Main Single-Page Scrollable Content */}
      <main className="flex-1 relative z-10">
        {/* 1. Hero Section */}
        <Hero
          profile={profile}
          products={products}
          onExploreClick={() => handleNavigate('showcase')}
          onContactClick={() => handleNavigate('contact')}
          onSelectProduct={(p) => setSelectedProduct(p)}
        />

        {/* 2. Product & Systems Catalog */}
        <ProductShowcase
          products={products}
          categories={categories}
          onSelectProduct={(p) => setSelectedProduct(p)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onContactProduct={handleContactProduct}
          isAdminLoggedIn={isAdminLoggedIn}
          onOpenAdminPanel={() => openAdminPage()}
        />

        {/* 3. About Me, Experience & Technical Stack */}
        <AboutSection profile={profile} />

        {/* 4. Direct Contact & Inquiry Form */}
        <ContactSection
          profile={profile}
          initialSubject={preselectedInquiry}
        />
      </main>

      {/* Footer */}
      <Footer
        profile={profile}
        onNavigate={handleNavigate}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => openAdminPage()}
        onOpenAdminPanel={() => openAdminPage()}
      />

      {/* Floating WhatsApp Direct Chat Button */}
      <FloatingWhatsApp profile={profile} />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onContactProduct={handleContactProduct}
      />

      {/* Add New Product Modal (Admin quick action) */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={() => {
          try {
            sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
          } catch {
            // Ignore
          }
          setIsAdminLoggedIn(true);
          setIsAdminLoginOpen(false);
          openAdminPage();
        }}
      />
    </div>
  );
}

export default App;
