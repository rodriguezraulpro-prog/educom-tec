import React, { useState, useEffect } from 'react';
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
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import {
  getStoredProducts,
  saveProducts,
  getStoredProfile,
  saveProfile,
  getStoredCategories,
  saveCategories,
} from './data/portfolioData';
import {
  fetchProductsFromCloud,
  saveProductToCloud,
  syncAllProductsToCloud,
  fetchCategoriesFromCloud,
  syncCategoriesToCloud,
  fetchProfileFromCloud,
  saveProfileToCloud,
} from './lib/firestoreService';
import { ProductOrProject, UserProfile, ShowcaseCategory } from './types';

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());
  const [products, setProducts] = useState<ProductOrProject[]>(() => getStoredProducts());
  const [categories, setCategories] = useState<ShowcaseCategory[]>(() => getStoredCategories());
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductOrProject | null>(null);
  const [selectedProductForContact, setSelectedProductForContact] = useState<ProductOrProject | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Admin authentication and panel states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('educom_admin_auth') === 'true';
    }
    return false;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Fetch latest cloud data on mount to ensure all visitors see worldwide up-to-date data
  useEffect(() => {
    let isMounted = true;

    async function loadCloudData() {
      try {
        const [cloudProducts, cloudCategories, cloudProfile] = await Promise.all([
          fetchProductsFromCloud(),
          fetchCategoriesFromCloud(),
          fetchProfileFromCloud(),
        ]);

        if (isMounted) {
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
          setIsCloudLoaded(true);
        }
      } catch (err) {
        console.warn('Could not sync initial data with cloud:', err);
      }
    }

    loadCloudData();

    return () => {
      isMounted = false;
    };
  }, []);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio_theme');
      if (saved) return saved === 'dark';
      return false; // Default to fresh minimalist light theme
    }
    return false;
  });

  // Sync theme class with documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('portfolio_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('portfolio_theme', 'light');
    }
  }, [isDark]);

  // Sync browser tab favicon and page title with profile brand configuration
  useEffect(() => {
    const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (faviconEl) {
      if (profile.brandLogo && profile.brandLogo.trim() !== '') {
        faviconEl.href = profile.brandLogo;
        faviconEl.removeAttribute('type');
      } else {
        faviconEl.href = './favicon.svg';
        faviconEl.type = 'image/svg+xml';
      }
    }
  }, [profile.brandLogo]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleAddProduct = (newProd: ProductOrProject) => {
    const updated = [newProd, ...products];
    setProducts(updated);
    saveProducts(updated);
    saveProductToCloud(newProd).catch((e) => console.error('Cloud save error:', e));
  };

  const handleContactProduct = (product: ProductOrProject) => {
    setSelectedProductForContact(product);
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Open Admin Flow: If logged in, open panel; otherwise, open login modal
  const handleOpenAdminAuthOrPanel = () => {
    if (isAdminLoggedIn) {
      setIsAdminPanelOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('educom_admin_auth', 'true');
    }
    setIsLoginModalOpen(false);
    setIsAdminPanelOpen(true);
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('educom_admin_auth');
    }
    setIsAdminPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans selection:bg-[#2563eb] selection:text-white transition-colors duration-200">
      {/* Navigation */}
      <Navbar
        profile={profile}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminAuthOrPanel={handleOpenAdminAuthOrPanel}
      />

      {/* Main Content Sections */}
      <main>
        <Hero
          profile={profile}
          totalProductsCount={products.length}
          isDark={isDark}
        />

        <ProductShowcase
          products={products}
          categories={categories}
          onSelectProduct={(product) => setSelectedProduct(product)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onContactProduct={handleContactProduct}
          isAdminLoggedIn={isAdminLoggedIn}
          onOpenAdminPanel={handleOpenAdminAuthOrPanel}
        />

        <AboutSection profile={profile} />

        <ContactSection
          profile={profile}
          selectedProductForContact={selectedProductForContact}
          onClearSelectedProduct={() => setSelectedProductForContact(null)}
        />
      </main>

      {/* Footer */}
      <Footer profile={profile} />

      {/* Floating WhatsApp Quick Action Button */}
      <FloatingWhatsApp profile={profile} />

      {/* Modals */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onContactProduct={handleContactProduct}
      />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* Admin Authentication & Management Modals */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        products={products}
        categories={categories}
        profile={profile}
        onUpdateProducts={(newProducts) => {
          setProducts(newProducts);
          saveProducts(newProducts);
          if (selectedProduct) {
            const refreshed = newProducts.find((p) => p.id === selectedProduct.id);
            setSelectedProduct(refreshed || null);
          }
          syncAllProductsToCloud(newProducts).catch((e) => console.error('Cloud products sync error:', e));
        }}
        onUpdateCategories={(newCategories) => {
          setCategories(newCategories);
          saveCategories(newCategories);
          syncCategoriesToCloud(newCategories).catch((e) => console.error('Cloud categories sync error:', e));
        }}
        onUpdateProfile={(newProfile) => {
          setProfile(newProfile);
          saveProfile(newProfile);
          saveProfileToCloud(newProfile).catch((e) => console.error('Cloud profile sync error:', e));
        }}
        onLogout={handleLogout}
      />
    </div>
  );
}

