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

// ============================================================================
// NOCODB CLOUD CONFIGURATION (PRIMARY DATABASE)
// ============================================================================
export interface NocoDBConfig {
  baseUrl: string;
  apiToken: string;
  baseId: string;
  productsTableId: string;
  categoriesTableId: string;
  configTableId: string;
}

const DEFAULT_NOCODB_CONFIG: NocoDBConfig = {
  baseUrl: 'https://app.nocodb.com',
  apiToken: 'nc_pat_Es9gtJwZzD9zRWDPaHjGNcb3iw9clhy9Fhzw1Wa2',
  baseId: 'p5o3y3vw3iskoss',
  productsTableId: 'mq57a9hs9m1rfnp',
  categoriesTableId: 'msxxn938fxqef6d',
  configTableId: 'm2817zasx5axp00',
};

const NOCODB_STORAGE_KEY = 'educom_nocodb_config_v1';

export function getNocoDBConfig(): NocoDBConfig {
  if (typeof window === 'undefined') return DEFAULT_NOCODB_CONFIG;
  try {
    const raw = localStorage.getItem(NOCODB_STORAGE_KEY);
    if (!raw) return DEFAULT_NOCODB_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      baseUrl: (parsed.baseUrl || DEFAULT_NOCODB_CONFIG.baseUrl).replace(/\/+$/, ''),
      apiToken: parsed.apiToken || DEFAULT_NOCODB_CONFIG.apiToken,
      baseId: parsed.baseId || DEFAULT_NOCODB_CONFIG.baseId,
      productsTableId: parsed.productsTableId || DEFAULT_NOCODB_CONFIG.productsTableId,
      categoriesTableId: parsed.categoriesTableId || DEFAULT_NOCODB_CONFIG.categoriesTableId,
      configTableId: parsed.configTableId || DEFAULT_NOCODB_CONFIG.configTableId,
    };
  } catch {
    return DEFAULT_NOCODB_CONFIG;
  }
}

export function saveNocoDBConfig(cfg: Partial<NocoDBConfig>): NocoDBConfig {
  const merged: NocoDBConfig = {
    ...getNocoDBConfig(),
    ...cfg,
  };
  merged.baseUrl = merged.baseUrl.replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(NOCODB_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore storage error
    }
  }
  return merged;
}

// ============================================================================
// NOCODB REST API HELPERS & CHUNKED PAYLOAD SERIALIZATION
// ============================================================================
const CHUNK_SIZE = 90000; // NocoDB LongText limit is 100,000 chars per column

function splitJsonPayload(data: unknown): {
  payload_json: string;
  payload_chunk_2: string;
  payload_chunk_3: string;
  payload_chunk_4: string;
  payload_chunk_5: string;
} {
  const jsonStr = JSON.stringify(sanitizeForFirestore(data));
  return {
    payload_json: jsonStr.slice(0, CHUNK_SIZE),
    payload_chunk_2: jsonStr.slice(CHUNK_SIZE, CHUNK_SIZE * 2) || '',
    payload_chunk_3: jsonStr.slice(CHUNK_SIZE * 2, CHUNK_SIZE * 3) || '',
    payload_chunk_4: jsonStr.slice(CHUNK_SIZE * 3, CHUNK_SIZE * 4) || '',
    payload_chunk_5: jsonStr.slice(CHUNK_SIZE * 4, CHUNK_SIZE * 5) || '',
  };
}

function joinJsonPayload(row: Record<string, any>): any | null {
  const combined =
    (row.payload_json || '') +
    (row.payload_chunk_2 || '') +
    (row.payload_chunk_3 || '') +
    (row.payload_chunk_4 || '') +
    (row.payload_chunk_5 || '');
  if (!combined || !combined.trim()) return null;
  try {
    return JSON.parse(combined);
  } catch {
    return null;
  }
}

async function nocoRequest(path: string, method = 'GET', body?: unknown): Promise<any> {
  const cfg = getNocoDBConfig();
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method,
    headers: {
      'xc-token': cfg.apiToken,
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`NocoDB HTTP ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

function mapNocoRowToProduct(row: Record<string, any>, index: number): ProductOrProject {
  const basePayload = (joinJsonPayload(row) || {}) as Partial<ProductOrProject>;
  const safeImageUrl =
    row.imageUrl && row.imageUrl !== '[BASE64_IN_PAYLOAD]'
      ? row.imageUrl
      : basePayload.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';

  return {
    id: row.product_id || basePayload.id || `prod-${row.Id || index + 1}`,
    title: row.title || basePayload.title || 'Sistema sin título',
    subtitle: row.subtitle ?? basePayload.subtitle ?? '',
    category: row.category || basePayload.category || 'systems',
    categoryLabel: row.categoryLabel || basePayload.categoryLabel || 'Sistemas Empresariales',
    description: row.description ?? basePayload.description ?? '',
    longDescription: row.longDescription ?? basePayload.longDescription ?? row.description ?? '',
    imageUrl: safeImageUrl,
    gallery: Array.isArray(basePayload.gallery) ? basePayload.gallery : [safeImageUrl],
    tags: Array.isArray(basePayload.tags) ? basePayload.tags : ['Sistema', 'Educom-Tec'],
    price: row.price ?? basePayload.price ?? 'Consultar',
    status: (row.status || basePayload.status || 'Disponible') as ProductOrProject['status'],
    demoUrl: row.demoUrl ?? basePayload.demoUrl ?? '',
    features: Array.isArray(basePayload.features) ? basePayload.features : [],
    technologies: Array.isArray(basePayload.technologies) ? basePayload.technologies : [],
    year: row.year || basePayload.year || '2025',
    deliverables: Array.isArray(basePayload.deliverables) ? basePayload.deliverables : [],
    slideNumber: basePayload.slideNumber || String(index + 1).padStart(2, '0'),
    themeColor: basePayload.themeColor || 'teal',
    deckMetrics: Array.isArray(basePayload.deckMetrics) ? basePayload.deckMetrics : [],
  };
}

function mapProductToNocoRow(product: ProductOrProject, orderIndex: number): Record<string, any> {
  const rawImg = product.imageUrl || '';
  const safeColumnImage = rawImg.length > 80000 ? '[BASE64_IN_PAYLOAD]' : rawImg;
  return {
    product_id: product.id,
    title: product.title || '',
    subtitle: product.subtitle || '',
    category: product.category || '',
    categoryLabel: product.categoryLabel || '',
    price: product.price || '',
    status: product.status || 'Disponible',
    demoUrl: product.demoUrl || '',
    imageUrl: safeColumnImage,
    description: product.description || '',
    longDescription: product.longDescription || '',
    year: product.year || '2025',
    order_index: orderIndex,
    ...splitJsonPayload(product),
  };
}

// ============================================================================
// FIRESTORE COLLECTION CONSTANTS & SANITIZER (SECONDARY BACKUP)
// ============================================================================
const PRODUCTS_COLLECTION = 'products';
const CATEGORIES_COLLECTION = 'categories';
const CONFIG_COLLECTION = 'siteConfig';
const PROFILE_DOC_ID = 'profile';
const SETTINGS_DOC_ID = 'settings';

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

// ============================================================================
// PRODUCTS CRUD (NOCODB PRIMARY + FIRESTORE BACKUP)
// ============================================================================

export async function fetchProductsFromCloud(): Promise<ProductOrProject[]> {
  const cfg = getNocoDBConfig();
  try {
    const data = await nocoRequest(
      `/api/v2/tables/${cfg.productsTableId}/records?limit=200&sort=order_index`
    );
    const list: Record<string, any>[] = Array.isArray(data.list) ? data.list : [];

    if (list.length === 0) {
      await syncAllProductsToCloud(initialProducts);
      return initialProducts;
    }

    list.sort((a, b) => (a.order_index ?? 999) - (b.order_index ?? 999));
    return list.map((row, idx) => mapNocoRowToProduct(row, idx));
  } catch (nocoErr) {
    console.warn('NocoDB products fetch warning, checking Firestore backup:', nocoErr);
    try {
      const productsRef = collection(db, PRODUCTS_COLLECTION);
      const snapshot = await getDocs(productsRef);
      if (!snapshot.empty) {
        const items: ProductOrProject[] = [];
        snapshot.forEach((d) => {
          items.push({ id: d.id, ...d.data() } as ProductOrProject);
        });
        return items;
      }
    } catch {
      // Ignore secondary fallback error
    }
    return initialProducts;
  }
}

export async function saveProductToCloud(product: ProductOrProject): Promise<void> {
  const cfg = getNocoDBConfig();
  try {
    const existingData = await nocoRequest(
      `/api/v2/tables/${cfg.productsTableId}/records?limit=200`
    );
    const list: Record<string, any>[] = Array.isArray(existingData.list) ? existingData.list : [];
    const existingRow = list.find((r) => r.product_id === product.id);

    if (existingRow && existingRow.Id !== undefined) {
      const rowPayload = {
        Id: existingRow.Id,
        ...mapProductToNocoRow(product, existingRow.order_index ?? 0),
      };
      await nocoRequest(`/api/v2/tables/${cfg.productsTableId}/records`, 'PATCH', rowPayload);
    } else {
      const rowPayload = mapProductToNocoRow(product, 0);
      await nocoRequest(`/api/v2/tables/${cfg.productsTableId}/records`, 'POST', rowPayload);
    }
  } catch (error) {
    console.error('Error saving product to NocoDB:', error);
  }

  // Secondary backup to Firestore
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
  } catch {
    // Ignore secondary backup error
  }
}

export async function deleteProductFromCloud(productId: string): Promise<void> {
  const cfg = getNocoDBConfig();
  try {
    const existingData = await nocoRequest(
      `/api/v2/tables/${cfg.productsTableId}/records?limit=200`
    );
    const list: Record<string, any>[] = Array.isArray(existingData.list) ? existingData.list : [];
    const matching = list.filter((r) => r.product_id === productId && r.Id !== undefined);
    if (matching.length > 0) {
      await nocoRequest(
        `/api/v2/tables/${cfg.productsTableId}/records`,
        'DELETE',
        matching.map((r) => ({ Id: r.Id }))
      );
    }
  } catch (error) {
    console.error('Error deleting product from NocoDB:', error);
  }

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch {
    // Ignore secondary backup error
  }
}

export async function syncAllProductsToCloud(products: ProductOrProject[]): Promise<void> {
  const cfg = getNocoDBConfig();
  try {
    const existingData = await nocoRequest(
      `/api/v2/tables/${cfg.productsTableId}/records?limit=200`
    );
    const existingList: Record<string, any>[] = Array.isArray(existingData.list)
      ? existingData.list
      : [];

    const existingByProdId = new Map<string, Record<string, any>>();
    for (const row of existingList) {
      if (row.product_id) {
        existingByProdId.set(String(row.product_id), row);
      }
    }

    const toUpdate: Record<string, any>[] = [];
    const toCreate: Record<string, any>[] = [];
    const incomingIds = new Set<string>();

    products.forEach((prod, idx) => {
      incomingIds.add(prod.id);
      const found = existingByProdId.get(prod.id);
      const mapped = mapProductToNocoRow(prod, idx);
      if (found && found.Id !== undefined) {
        toUpdate.push({ Id: found.Id, ...mapped });
      } else {
        toCreate.push(mapped);
      }
    });

    const toDelete = existingList
      .filter((r) => r.product_id && !incomingIds.has(String(r.product_id)) && r.Id !== undefined)
      .map((r) => ({ Id: r.Id }));

    if (toUpdate.length > 0) {
      await nocoRequest(`/api/v2/tables/${cfg.productsTableId}/records`, 'PATCH', toUpdate);
    }
    if (toCreate.length > 0) {
      await nocoRequest(`/api/v2/tables/${cfg.productsTableId}/records`, 'POST', toCreate);
    }
    if (toDelete.length > 0) {
      await nocoRequest(`/api/v2/tables/${cfg.productsTableId}/records`, 'DELETE', toDelete);
    }
  } catch (error) {
    console.error('Error syncing all products to NocoDB:', error);
  }

  // Secondary backup to Firestore
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
  } catch {
    // Ignore secondary backup error
  }
}

// ============================================================================
// CATEGORIES CRUD (NOCODB PRIMARY + FIRESTORE BACKUP)
// ============================================================================

export async function fetchCategoriesFromCloud(): Promise<ShowcaseCategory[]> {
  const cfg = getNocoDBConfig();
  try {
    const data = await nocoRequest(
      `/api/v2/tables/${cfg.categoriesTableId}/records?limit=100&sort=order_index`
    );
    const list: Record<string, any>[] = Array.isArray(data.list) ? data.list : [];

    if (list.length === 0) {
      await syncCategoriesToCloud(initialCategories);
      return initialCategories;
    }

    list.sort((a, b) => (a.order_index ?? 999) - (b.order_index ?? 999));
    const categories: ShowcaseCategory[] = list.map((row) => ({
      id: String(row.category_id || row.id || 'all'),
      label: String(row.label || 'Categoría'),
    }));

    return categories.sort((a, b) => (a.id === 'all' ? -1 : b.id === 'all' ? 1 : 0));
  } catch (nocoErr) {
    console.warn('NocoDB categories fetch warning, checking fallback:', nocoErr);
    return initialCategories;
  }
}

export async function syncCategoriesToCloud(cats: ShowcaseCategory[]): Promise<void> {
  const cfg = getNocoDBConfig();
  try {
    const existingData = await nocoRequest(
      `/api/v2/tables/${cfg.categoriesTableId}/records?limit=100`
    );
    const existingList: Record<string, any>[] = Array.isArray(existingData.list)
      ? existingData.list
      : [];

    const existingByCatId = new Map<string, Record<string, any>>();
    for (const row of existingList) {
      if (row.category_id) {
        existingByCatId.set(String(row.category_id), row);
      }
    }

    const toUpdate: Record<string, any>[] = [];
    const toCreate: Record<string, any>[] = [];
    const incomingIds = new Set<string>();

    cats.forEach((cat, idx) => {
      incomingIds.add(cat.id);
      const found = existingByCatId.get(cat.id);
      const rowData = {
        category_id: cat.id,
        label: cat.label,
        order_index: idx,
      };
      if (found && found.Id !== undefined) {
        toUpdate.push({ Id: found.Id, ...rowData });
      } else {
        toCreate.push(rowData);
      }
    });

    const toDelete = existingList
      .filter((r) => r.category_id && !incomingIds.has(String(r.category_id)) && r.Id !== undefined)
      .map((r) => ({ Id: r.Id }));

    if (toUpdate.length > 0) {
      await nocoRequest(`/api/v2/tables/${cfg.categoriesTableId}/records`, 'PATCH', toUpdate);
    }
    if (toCreate.length > 0) {
      await nocoRequest(`/api/v2/tables/${cfg.categoriesTableId}/records`, 'POST', toCreate);
    }
    if (toDelete.length > 0) {
      await nocoRequest(`/api/v2/tables/${cfg.categoriesTableId}/records`, 'DELETE', toDelete);
    }
  } catch (error) {
    console.error('Error syncing categories to NocoDB:', error);
  }

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
  } catch {
    // Ignore secondary backup error
  }
}

export async function deleteCategoryFromCloud(categoryId: string): Promise<void> {
  const cfg = getNocoDBConfig();
  try {
    const existingData = await nocoRequest(
      `/api/v2/tables/${cfg.categoriesTableId}/records?limit=100`
    );
    const list: Record<string, any>[] = Array.isArray(existingData.list) ? existingData.list : [];
    const matching = list.filter((r) => r.category_id === categoryId && r.Id !== undefined);
    if (matching.length > 0) {
      await nocoRequest(
        `/api/v2/tables/${cfg.categoriesTableId}/records`,
        'DELETE',
        matching.map((r) => ({ Id: r.Id }))
      );
    }
  } catch (error) {
    console.error('Error deleting category from NocoDB:', error);
  }
}

// ============================================================================
// PROFILE & SETTINGS CRUD (NOCODB PRIMARY + FIRESTORE BACKUP)
// ============================================================================

export async function fetchProfileFromCloud(): Promise<UserProfile> {
  const cfg = getNocoDBConfig();
  try {
    const data = await nocoRequest(`/api/v2/tables/${cfg.configTableId}/records?limit=50`);
    const list: Record<string, any>[] = Array.isArray(data.list) ? data.list : [];
    const profileRow = list.find((r) => r.config_key === PROFILE_DOC_ID);

    if (!profileRow) {
      await saveProfileToCloud(initialProfile);
      return initialProfile;
    }

    const parsed = joinJsonPayload(profileRow) as UserProfile | null;
    if (parsed && parsed.name) {
      return {
        ...parsed,
        name: profileRow.name || parsed.name,
        email: profileRow.email || parsed.email,
      };
    }
    return initialProfile;
  } catch (nocoErr) {
    console.warn('NocoDB profile fetch warning, checking fallback:', nocoErr);
    try {
      const profileRef = doc(db, CONFIG_COLLECTION, PROFILE_DOC_ID);
      const docSnap = await getDoc(profileRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
    } catch {
      // Ignore secondary fallback error
    }
    return initialProfile;
  }
}

export async function saveProfileToCloud(profile: UserProfile): Promise<void> {
  const cfg = getNocoDBConfig();
  try {
    const data = await nocoRequest(`/api/v2/tables/${cfg.configTableId}/records?limit=50`);
    const list: Record<string, any>[] = Array.isArray(data.list) ? data.list : [];
    const existingRow = list.find((r) => r.config_key === PROFILE_DOC_ID);

    const rowData = {
      config_key: PROFILE_DOC_ID,
      name: profile.name || '',
      email: profile.email || '',
      whatsapp: profile.whatsappNumber || profile.whatsapp || '',
      ...splitJsonPayload(profile),
    };

    if (existingRow && existingRow.Id !== undefined) {
      await nocoRequest(`/api/v2/tables/${cfg.configTableId}/records`, 'PATCH', {
        Id: existingRow.Id,
        ...rowData,
      });
    } else {
      await nocoRequest(`/api/v2/tables/${cfg.configTableId}/records`, 'POST', rowData);
    }
  } catch (error) {
    console.error('Error saving profile to NocoDB:', error);
  }

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
  } catch {
    // Ignore secondary backup error
  }
}

export async function fetchAdminPasswordFromCloud(): Promise<string | null> {
  const cfg = getNocoDBConfig();
  try {
    const data = await nocoRequest(`/api/v2/tables/${cfg.configTableId}/records?limit=50`);
    const list: Record<string, any>[] = Array.isArray(data.list) ? data.list : [];
    const settingsRow = list.find((r) => r.config_key === SETTINGS_DOC_ID);
    if (settingsRow) {
      const parsed = joinJsonPayload(settingsRow);
      if (parsed && typeof parsed.adminPassword === 'string' && parsed.adminPassword.trim()) {
        return parsed.adminPassword;
      }
    }
  } catch (error) {
    console.warn('Error reading admin password from NocoDB:', error);
  }

  try {
    const settingsRef = doc(db, CONFIG_COLLECTION, SETTINGS_DOC_ID);
    const snap = await getDoc(settingsRef);
    if (snap.exists() && snap.data().adminPassword) {
      return snap.data().adminPassword;
    }
  } catch {
    // Ignore fallback error
  }
  return null;
}

export async function saveAdminPasswordToCloud(password: string): Promise<void> {
  const cfg = getNocoDBConfig();
  try {
    const data = await nocoRequest(`/api/v2/tables/${cfg.configTableId}/records?limit=50`);
    const list: Record<string, any>[] = Array.isArray(data.list) ? data.list : [];
    const existingRow = list.find((r) => r.config_key === SETTINGS_DOC_ID);

    const payloadObj = {
      adminPassword: password,
      updatedAt: new Date().toISOString(),
    };

    const rowData = {
      config_key: SETTINGS_DOC_ID,
      name: 'Admin Settings',
      email: '',
      whatsapp: '',
      ...splitJsonPayload(payloadObj),
    };

    if (existingRow && existingRow.Id !== undefined) {
      await nocoRequest(`/api/v2/tables/${cfg.configTableId}/records`, 'PATCH', {
        Id: existingRow.Id,
        ...rowData,
      });
    } else {
      await nocoRequest(`/api/v2/tables/${cfg.configTableId}/records`, 'POST', rowData);
    }
  } catch (error) {
    console.error('Error saving admin password to NocoDB:', error);
  }

  try {
    const settingsRef = doc(db, CONFIG_COLLECTION, SETTINGS_DOC_ID);
    await setDoc(
      settingsRef,
      {
        adminPassword: password,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Ignore secondary backup error
  }
}
