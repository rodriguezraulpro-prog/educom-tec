import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { ProductOrProject, UserProfile, ShowcaseCategory } from '../types';
import { initialProducts, initialProfile, initialCategories } from '../data/portfolioData';

// Firestore collection names
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const CONFIG_COLLECTION = 'siteConfig';
const PROFILE_DOC_ID = 'profile';
const SETTINGS_DOC_ID = 'settings';

/**
 * Recursively strips all `undefined` properties from an object or array
 * so Firestore setDoc / WriteBatch.set never fails on unsupported undefined values.
 */
function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Fetch all products from Firestore.
 * If empty in Firestore (first boot), seed with initialProducts so the database is populated.
 */
export async function fetchProductsFromCloud(): Promise<ProductOrProject[]> {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const snapshot = await getDocs(productsRef);

    if (snapshot.empty) {
      // Seed Firestore with initial products
      console.log('Seeding initial products to Firestore...');
      await seedInitialProducts(initialProducts);
      return initialProducts;
    }

    const items: ProductOrProject[] = [];
    snapshot.forEach((d) => {
      items.push({ id: d.id, ...d.data() } as ProductOrProject);
    });

    // Sort items if they have order or year
    return items;
  } catch (error) {
    console.warn('Could not fetch products from Firestore, falling back to local:', error);
    return initialProducts;
  }
}

/**
 * Seed initial products to Firestore batch
 */
export async function seedInitialProducts(items: ProductOrProject[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    items.forEach((item, index) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, item.id);
      batch.set(
        docRef,
        sanitizeForFirestore({
          ...item,
          order: index,
          updatedAt: new Date().toISOString(),
        })
      );
    });
    await batch.commit();
  } catch (error) {
    console.error('Error seeding initial products to Firestore:', error);
  }
}

/**
 * Save single product to Firestore
 */
export async function saveProductToCloud(product: ProductOrProject): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...product,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving product to Firestore:', error);
    throw error;
  }
}

/**
 * Delete product from Firestore
 */
export async function deleteProductFromCloud(productId: string): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting product from Firestore:', error);
    throw error;
  }
}

/**
 * Save entire product list (e.g. reordering or batch updates)
 */
export async function syncAllProductsToCloud(products: ProductOrProject[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    products.forEach((prod, index) => {
      const docRef = doc(db, PRODUCTS_COLLECTION, prod.id);
      batch.set(
        docRef,
        sanitizeForFirestore({
          ...prod,
          order: index,
          updatedAt: new Date().toISOString(),
        })
      );
    });
    await batch.commit();
  } catch (error) {
    console.error('Error syncing all products to Firestore:', error);
    throw error;
  }
}

/**
 * Fetch categories from Firestore
 */
export async function fetchCategoriesFromCloud(): Promise<ShowcaseCategory[]> {
  try {
    const catRef = collection(db, CATEGORIES_COLLECTION);
    const snapshot = await getDocs(catRef);

    if (snapshot.empty) {
      console.log('Seeding initial categories to Firestore...');
      await seedInitialCategories(initialCategories);
      return initialCategories;
    }

    const categories: ShowcaseCategory[] = [];
    snapshot.forEach((d) => {
      categories.push({ id: d.id, ...d.data() } as ShowcaseCategory);
    });

    // Ensure 'all' is always first
    return categories.sort((a, b) => (a.id === 'all' ? -1 : b.id === 'all' ? 1 : 0));
  } catch (error) {
    console.warn('Could not fetch categories from Firestore, fallback to default:', error);
    return initialCategories;
  }
}

/**
 * Seed initial categories
 */
export async function seedInitialCategories(cats: ShowcaseCategory[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    cats.forEach((cat, index) => {
      const docRef = doc(db, CATEGORIES_COLLECTION, cat.id);
      batch.set(
        docRef,
        sanitizeForFirestore({
          id: cat.id,
          label: cat.label,
          order: index,
        })
      );
    });
    await batch.commit();
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
}

/**
 * Save all categories to Firestore
 */
export async function syncCategoriesToCloud(cats: ShowcaseCategory[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    cats.forEach((cat, index) => {
      const docRef = doc(db, CATEGORIES_COLLECTION, cat.id);
      batch.set(
        docRef,
        sanitizeForFirestore({
          id: cat.id,
          label: cat.label,
          order: index,
          updatedAt: new Date().toISOString(),
        })
      );
    });
    await batch.commit();
  } catch (error) {
    console.error('Error syncing categories to Firestore:', error);
    throw error;
  }
}

/**
 * Delete category from Firestore
 */
export async function deleteCategoryFromCloud(categoryId: string): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting category from Firestore:', error);
    throw error;
  }
}

/**
 * Fetch profile and config from Firestore
 */
export async function fetchProfileFromCloud(): Promise<UserProfile> {
  try {
    const profileRef = doc(db, CONFIG_COLLECTION, PROFILE_DOC_ID);
    const docSnap = await getDoc(profileRef);

    if (!docSnap.exists()) {
      console.log('Seeding initial profile to Firestore...');
      await saveProfileToCloud(initialProfile);
      return initialProfile;
    }

    return docSnap.data() as UserProfile;
  } catch (error) {
    console.warn('Could not fetch profile from Firestore, fallback:', error);
    return initialProfile;
  }
}

/**
 * Save profile to Firestore
 */
export async function saveProfileToCloud(profile: UserProfile): Promise<void> {
  try {
    const profileRef = doc(db, CONFIG_COLLECTION, PROFILE_DOC_ID);
    await setDoc(
      profileRef,
      sanitizeForFirestore({
        ...profile,
        updatedAt: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving profile to Firestore:', error);
    throw error;
  }
}

/**
 * Fetch or verify admin password from cloud
 */
export async function fetchAdminPasswordFromCloud(): Promise<string | null> {
  try {
    const settingsRef = doc(db, CONFIG_COLLECTION, SETTINGS_DOC_ID);
    const snap = await getDoc(settingsRef);
    if (snap.exists() && snap.data().adminPassword) {
      return snap.data().adminPassword;
    }
    return null;
  } catch (error) {
    console.warn('Error reading admin password from cloud:', error);
    return null;
  }
}

/**
 * Save admin password to cloud
 */
export async function saveAdminPasswordToCloud(password: string): Promise<void> {
  try {
    const settingsRef = doc(db, CONFIG_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(settingsRef, {
      adminPassword: password,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving admin password to Firestore:', error);
    throw error;
  }
}
