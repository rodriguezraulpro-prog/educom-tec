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
// BASEROW CLOUD CONFIGURATION (PRIMARY DATABASE)
// ============================================================================
export interface BaserowConfig {
  apiUrl: string;
  webUrl: string;
  apiToken: string;
  databaseId: string;
  tableId: string;
  viewId: string;
}

const ENV = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const DEFAULT_BASEROW_CONFIG: BaserowConfig = {
  apiUrl: ENV.VITE_BASEROW_API_URL || 'https://api.baserow.io',
  webUrl: ENV.VITE_BASEROW_WEB_URL || 'https://baserow.io',
  apiToken: ENV.VITE_BASEROW_API_TOKEN || 'MU5JCWPDkwteAEAdkWhLaWN3vO7H8Upk',
  databaseId: ENV.VITE_BASEROW_DATABASE_ID || '614920',
  tableId: ENV.VITE_BASEROW_TABLE_ID || '1300673',
  viewId: ENV.VITE_BASEROW_VIEW_ID || '2604879',
};

const BASEROW_STORAGE_KEY = 'educom_baserow_config_v1';

export function getBaserowConfig(): BaserowConfig {
  if (typeof window === 'undefined') return DEFAULT_BASEROW_CONFIG;
  try {
    const raw = localStorage.getItem(BASEROW_STORAGE_KEY);
    if (!raw) return DEFAULT_BASEROW_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      apiUrl: (parsed.apiUrl || DEFAULT_BASEROW_CONFIG.apiUrl).replace(/\/+$/, ''),
      webUrl: (parsed.webUrl || DEFAULT_BASEROW_CONFIG.webUrl).replace(/\/+$/, ''),
      apiToken: parsed.apiToken || DEFAULT_BASEROW_CONFIG.apiToken,
      databaseId: String(parsed.databaseId || DEFAULT_BASEROW_CONFIG.databaseId).trim(),
      tableId: String(parsed.tableId || DEFAULT_BASEROW_CONFIG.tableId).trim(),
      viewId: String(parsed.viewId || DEFAULT_BASEROW_CONFIG.viewId).trim(),
    };
  } catch {
    return DEFAULT_BASEROW_CONFIG;
  }
}

export function saveBaserowConfig(cfg: Partial<BaserowConfig>): BaserowConfig {
  const merged: BaserowConfig = {
    ...getBaserowConfig(),
    ...cfg,
  };
  merged.apiUrl = merged.apiUrl.replace(/\/+$/, '');
  merged.webUrl = merged.webUrl.replace(/\/+$/, '');
  merged.databaseId = String(merged.databaseId || '').trim();
  merged.tableId = String(merged.tableId || '').trim();
  merged.viewId = String(merged.viewId || '').trim();

  // Clear cached schema when table config changes
  fieldSchemaCache.delete(merged.tableId);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(BASEROW_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore storage error
    }
  }
  return merged;
}

export function getBaserowTableWebUrl(cfg?: BaserowConfig): string {
  const active = cfg || getBaserowConfig();
  const base = `${active.webUrl}/database/${active.databaseId}/table/${active.tableId}`;
  return active.viewId ? `${base}/${active.viewId}` : base;
}

// ============================================================================
// BASEROW REST API HELPERS & DYNAMIC FIELD RESOLUTION
// ============================================================================
interface BaserowFieldSchema {
  nameField: string;
  notesField: string;
  activeField: string | null;
}

const fieldSchemaCache = new Map<string, BaserowFieldSchema>();

async function baserowRequest(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
  overrideCfg?: BaserowConfig
): Promise<any> {
  const cfg = overrideCfg || getBaserowConfig();
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : `${cfg.apiUrl}${path}`;

  const headers: Record<string, string> = {
    Authorization: `Token ${cfg.apiToken}`,
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return {};
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Baserow HTTP ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : {};
}

async function resolveTableSchema(overrideCfg?: BaserowConfig): Promise<BaserowFieldSchema> {
  const cfg = overrideCfg || getBaserowConfig();
  const cached = fieldSchemaCache.get(cfg.tableId);
  if (cached) return cached;

  try {
    const fields = await baserowRequest(
      `/api/database/fields/table/${cfg.tableId}/`,
      'GET',
      undefined,
      cfg
    );
    if (Array.isArray(fields) && fields.length > 0) {
      const primaryText =
        fields.find((f: any) => f.primary) ||
        fields.find((f: any) => f.type === 'text') ||
        fields[0];

      const longText =
        fields.find((f: any) => f.type === 'long_text') ||
        fields.find(
          (f: any) =>
            (f.type === 'text' || f.type === 'long_text') && f.name !== primaryText?.name
        );

      const boolField = fields.find((f: any) => f.type === 'boolean') || null;

      const resolved: BaserowFieldSchema = {
        nameField: primaryText?.name || 'Nombre',
        notesField: longText?.name || 'Notas',
        activeField: boolField?.name || null,
      };
      fieldSchemaCache.set(cfg.tableId, resolved);
      return resolved;
    }
  } catch (err) {
    console.warn('Baserow field introspection fallback:', err);
  }

  return {
    nameField: 'Nombre',
    notesField: 'Notas',
    activeField: 'Activo',
  };
}

interface BaserowRecordEnvelope<T = any> {
  recordType: 'product' | 'categories' | 'profile' | 'settings';
  id?: string;
  orderIndex?: number;
  updatedAt?: string;
  data: T;
}

async function fetchAllBaserowRows(overrideCfg?: BaserowConfig): Promise<{
  schema: BaserowFieldSchema;
  rows: Record<string, any>[];
}> {
  const cfg = overrideCfg || getBaserowConfig();
  const schema = await resolveTableSchema(cfg);
  const rows: Record<string, any>[] = [];

  let nextUrl: string | null = `/api/database/rows/table/${cfg.tableId}/?user_field_names=true&size=200`;
  let guard = 0;

  while (nextUrl && guard < 20) {
    const data = await baserowRequest(nextUrl, 'GET', undefined, cfg);
    if (Array.isArray(data.results)) {
      rows.push(...data.results);
    }
    nextUrl = typeof data.next === 'string' && data.next.length > 0 ? data.next : null;
    guard++;
  }

  return { schema, rows };
}

function parseEnvelope(row: Record<string, any>, schema: BaserowFieldSchema): BaserowRecordEnvelope | null {
  const rawNotes = row[schema.notesField];
  if (typeof rawNotes !== 'string' || !rawNotes.trim()) return null;
  try {
    const parsed = JSON.parse(rawNotes);
    if (parsed && typeof parsed === 'object' && parsed.recordType) {
      return parsed as BaserowRecordEnvelope;
    }
    return null;
  } catch {
    return null;
  }
}

function buildRowPayload(
  schema: BaserowFieldSchema,
  label: string,
  envelope: BaserowRecordEnvelope
): Record<string, any> {
  const payload: Record<string, any> = {
    [schema.nameField]: label,
    [schema.notesField]: JSON.stringify(sanitizeForFirestore(envelope)),
  };
  if (schema.activeField) {
    payload[schema.activeField] = true;
  }
  return payload;
}

export async function testBaserowConnection(overrideCfg?: BaserowConfig): Promise<{
  ok: boolean;
  rowCount: number;
  fields: string[];
  message: string;
}> {
  const cfg = overrideCfg || getBaserowConfig();
  try {
    fieldSchemaCache.delete(cfg.tableId);
    const { schema, rows } = await fetchAllBaserowRows(cfg);
    const fields = [schema.nameField, schema.notesField, ...(schema.activeField ? [schema.activeField] : [])];
    return {
      ok: true,
      rowCount: rows.length,
      fields,
      message: `Conectado a Baserow (Tabla ${cfg.tableId}): ${rows.length} registros activos • Columnas: ${fields.join(', ')}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      rowCount: 0,
      fields: [],
      message: err?.message || 'No se pudo conectar con Baserow. Verifica tu Token y Table ID.',
    };
  }
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

function normalizeProduct(raw: Partial<ProductOrProject>, index: number): ProductOrProject {
  const safeImageUrl =
    raw.imageUrl ||
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';

  return {
    id: raw.id || `prod-${index + 1}`,
    title: raw.title || 'Sistema sin título',
    subtitle: raw.subtitle ?? '',
    category: raw.category || 'systems',
    categoryLabel: raw.categoryLabel || 'Sistemas Empresariales',
    description: raw.description ?? '',
    longDescription: raw.longDescription ?? raw.description ?? '',
    imageUrl: safeImageUrl,
    gallery: Array.isArray(raw.gallery) && raw.gallery.length > 0 ? raw.gallery : [safeImageUrl],
    tags: Array.isArray(raw.tags) ? raw.tags : ['Sistema', 'Educom-Tec'],
    price: raw.price ?? 'Consultar',
    status: (raw.status || 'Disponible') as ProductOrProject['status'],
    demoUrl: raw.demoUrl ?? '',
    features: Array.isArray(raw.features) ? raw.features : [],
    technologies: Array.isArray(raw.technologies) ? raw.technologies : [],
    year: raw.year || '2025',
    deliverables: Array.isArray(raw.deliverables) ? raw.deliverables : [],
    slideNumber: raw.slideNumber || String(index + 1).padStart(2, '0'),
    themeColor: raw.themeColor || 'teal',
    deckMetrics: Array.isArray(raw.deckMetrics) ? raw.deckMetrics : [],
  };
}

// ============================================================================
// PRODUCTS CRUD (BASEROW PRIMARY + FIRESTORE BACKUP)
// ============================================================================

export async function fetchProductsFromCloud(): Promise<ProductOrProject[]> {
  try {
    const { schema, rows } = await fetchAllBaserowRows();
    const productEnvelopes: { orderIndex: number; data: Partial<ProductOrProject> }[] = [];

    for (const row of rows) {
      const env = parseEnvelope(row, schema);
      if (env && env.recordType === 'product' && env.data) {
        productEnvelopes.push({
          orderIndex: typeof env.orderIndex === 'number' ? env.orderIndex : 999,
          data: env.data,
        });
      }
    }

    if (productEnvelopes.length === 0) {
      await syncAllProductsToCloud(initialProducts);
      return initialProducts;
    }

    productEnvelopes.sort((a, b) => a.orderIndex - b.orderIndex);
    return productEnvelopes.map((item, idx) => normalizeProduct(item.data, idx));
  } catch (baserowErr) {
    console.warn('Baserow products fetch warning, checking Firestore backup:', baserowErr);
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
  const cfg = getBaserowConfig();
  try {
    const { schema, rows } = await fetchAllBaserowRows(cfg);
    let existingRow: Record<string, any> | undefined;
    let existingOrder = 0;

    for (const row of rows) {
      const env = parseEnvelope(row, schema);
      if (env && env.recordType === 'product' && (env.id === product.id || env.data?.id === product.id)) {
        existingRow = row;
        existingOrder = typeof env.orderIndex === 'number' ? env.orderIndex : 0;
        break;
      }
    }

    const rowPayload = buildRowPayload(schema, `PROD::${product.id} | ${product.title}`, {
      recordType: 'product',
      id: product.id,
      orderIndex: existingOrder,
      updatedAt: new Date().toISOString(),
      data: product,
    });

    if (existingRow && existingRow.id !== undefined) {
      await baserowRequest(
        `/api/database/rows/table/${cfg.tableId}/${existingRow.id}/?user_field_names=true`,
        'PATCH',
        rowPayload,
        cfg
      );
    } else {
      await baserowRequest(
        `/api/database/rows/table/${cfg.tableId}/?user_field_names=true`,
        'POST',
        rowPayload,
        cfg
      );
    }
  } catch (error) {
    console.error('Error saving product to Baserow:', error);
    throw error;
  } finally {
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
}

export async function deleteProductFromCloud(productId: string): Promise<void> {
  const cfg = getBaserowConfig();
  try {
    const { schema, rows } = await fetchAllBaserowRows(cfg);
    for (const row of rows) {
      const env = parseEnvelope(row, schema);
      if (env && env.recordType === 'product' && (env.id === productId || env.data?.id === productId)) {
        await baserowRequest(`/api/database/rows/table/${cfg.tableId}/${row.id}/`, 'DELETE', undefined, cfg);
      }
    }
  } catch (error) {
    console.error('Error deleting product from Baserow:', error);
  }

  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(docRef);
  } catch {
    // Ignore secondary backup error
  }
}

export async function syncAllProductsToCloud(products: ProductOrProject[]): Promise<void> {
  const cfg = getBaserowConfig();
  try {
    const { schema, rows } = await fetchAllBaserowRows(cfg);

    const existingByProdId = new Map<string, Record<string, any>>();
    const emptyRowIds: number[] = [];

    for (const row of rows) {
      const nameVal = String(row[schema.nameField] || '').trim();
      const notesVal = String(row[schema.notesField] || '').trim();
      if (!nameVal && !notesVal && row.id !== undefined) {
        emptyRowIds.push(row.id);
        continue;
      }
      const env = parseEnvelope(row, schema);
      if (env && env.recordType === 'product') {
        const pid = String(env.id || env.data?.id || '');
        if (pid) existingByProdId.set(pid, row);
      }
    }

    const incomingIds = new Set<string>();

    // Upsert each product in order
    for (let idx = 0; idx < products.length; idx++) {
      const prod = products[idx];
      incomingIds.add(prod.id);
      const found = existingByProdId.get(prod.id);
      const payload = buildRowPayload(schema, `PROD::${prod.id} | ${prod.title}`, {
        recordType: 'product',
        id: prod.id,
        orderIndex: idx,
        updatedAt: new Date().toISOString(),
        data: prod,
      });

      if (found && found.id !== undefined) {
        await baserowRequest(
          `/api/database/rows/table/${cfg.tableId}/${found.id}/?user_field_names=true`,
          'PATCH',
          payload,
          cfg
        );
      } else {
        await baserowRequest(
          `/api/database/rows/table/${cfg.tableId}/?user_field_names=true`,
          'POST',
          payload,
          cfg
        );
      }
    }

    // Delete removed products
    for (const [pid, row] of existingByProdId.entries()) {
      if (!incomingIds.has(pid) && row.id !== undefined) {
        await baserowRequest(`/api/database/rows/table/${cfg.tableId}/${row.id}/`, 'DELETE', undefined, cfg);
      }
    }

    // Clean up any default blank Baserow rows
    for (const blankId of emptyRowIds) {
      await baserowRequest(`/api/database/rows/table/${cfg.tableId}/${blankId}/`, 'DELETE', undefined, cfg);
    }
  } catch (error) {
    console.error('Error syncing all products to Baserow:', error);
    throw error;
  } finally {
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
}

// ============================================================================
// CATEGORIES CRUD (BASEROW PRIMARY + FIRESTORE BACKUP)
// ============================================================================

export async function fetchCategoriesFromCloud(): Promise<ShowcaseCategory[]> {
  try {
    const { schema, rows } = await fetchAllBaserowRows();
    for (const row of rows) {
      const env = parseEnvelope(row, schema);
      if (env && env.recordType === 'categories' && Array.isArray(env.data) && env.data.length > 0) {
        const categories: ShowcaseCategory[] = env.data.map((c: any) => ({
          id: String(c.id || 'all'),
          label: String(c.label || 'Categoría'),
        }));
        return categories.sort((a, b) => (a.id === 'all' ? -1 : b.id === 'all' ? 1 : 0));
      }
    }

    await syncCategoriesToCloud(initialCategories);
    return initialCategories;
  } catch (baserowErr) {
    console.warn('Baserow categories fetch warning, checking fallback:', baserowErr);
    return initialCategories;
  }
}

export async function syncCategoriesToCloud(cats: ShowcaseCategory[]): Promise<void> {
  const cfg = getBaserowConfig();
  try {
    const { schema, rows } = await fetchAllBaserowRows(cfg);
    const existingRow = rows.find((row) => {
      const env = parseEnvelope(row, schema);
      return env && env.recordType === 'categories';
    });

    const payload = buildRowPayload(schema, 'CONFIG::categories | Categorías del Catálogo', {
      recordType: 'categories',
      updatedAt: new Date().toISOString(),
      data: cats,
    });

    if (existingRow && existingRow.id !== undefined) {
      await baserowRequest(
        `/api/database/rows/table/${cfg.tableId}/${existingRow.id}/?user_field_names=true`,
        'PATCH',
        payload,
        cfg
      );
    } else {
      await baserowRequest(
        `/api/database/rows/table/${cfg.tableId}/?user_field_names=true`,
        'POST',
        payload,
        cfg
      );
    }
  } catch (error) {
    console.error('Error syncing categories to Baserow:', error);
    throw error;
  } finally {
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
}

export async function deleteCategoryFromCloud(categoryId: string): Promise<void> {
  try {
    const current = await fetchCategoriesFromCloud();
    const filtered = current.filter((c) => c.id !== categoryId);
    await syncCategoriesToCloud(filtered);
  } catch (error) {
    console.error('Error deleting category from Baserow:', error);
  }
}

// ============================================================================
// PROFILE & SETTINGS CRUD (BASEROW PRIMARY + FIRESTORE BACKUP)
// ============================================================================

export async function fetchProfileFromCloud(): Promise<UserProfile> {
  try {
    const { schema, rows } = await fetchAllBaserowRows();
    for (const row of rows) {
      const env = parseEnvelope(row, schema);
      if (env && env.recordType === 'profile' && env.data && env.data.name) {
        return env.data as UserProfile;
      }
    }

    await saveProfileToCloud(initialProfile);
    return initialProfile;
  } catch (baserowErr) {
    console.warn('Baserow profile fetch warning, checking Firestore backup:', baserowErr);
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
  const cfg = getBaserowConfig();
  try {
    const { schema, rows } = await fetchAllBaserowRows(cfg);
    const existingRow = rows.find((row) => {
      const env = parseEnvelope(row, schema);
      return env && env.recordType === 'profile';
    });

    const payload = buildRowPayload(
      schema,
      `CONFIG::profile | ${profile.name || 'Perfil EDUCOM'}`,
      {
        recordType: 'profile',
        updatedAt: new Date().toISOString(),
        data: profile,
      }
    );

    if (existingRow && existingRow.id !== undefined) {
      await baserowRequest(
        `/api/database/rows/table/${cfg.tableId}/${existingRow.id}/?user_field_names=true`,
        'PATCH',
        payload,
        cfg
      );
    } else {
      await baserowRequest(
        `/api/database/rows/table/${cfg.tableId}/?user_field_names=true`,
        'POST',
        payload,
        cfg
      );
    }
  } catch (error) {
    console.error('Error saving profile to Baserow:', error);
    throw error;
  } finally {
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
}

export async function fetchAdminPasswordFromCloud(): Promise<string | null> {
  try {
    const { schema, rows } = await fetchAllBaserowRows();
    for (const row of rows) {
      const env = parseEnvelope(row, schema);
      if (
        env &&
        env.recordType === 'settings' &&
        env.data &&
        typeof env.data.adminPassword === 'string' &&
        env.data.adminPassword.trim()
      ) {
        return env.data.adminPassword;
      }
    }
  } catch (error) {
    console.warn('Error reading admin password from Baserow:', error);
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
  const cfg = getBaserowConfig();
  try {
    const { schema, rows } = await fetchAllBaserowRows(cfg);
    const existingRow = rows.find((row) => {
      const env = parseEnvelope(row, schema);
      return env && env.recordType === 'settings';
    });

    const payload = buildRowPayload(schema, 'CONFIG::settings | Seguridad y Clave Admin', {
      recordType: 'settings',
      updatedAt: new Date().toISOString(),
      data: {
        adminPassword: password,
        updatedAt: new Date().toISOString(),
      },
    });

    if (existingRow && existingRow.id !== undefined) {
      await baserowRequest(
        `/api/database/rows/table/${cfg.tableId}/${existingRow.id}/?user_field_names=true`,
        'PATCH',
        payload,
        cfg
      );
    } else {
      await baserowRequest(
        `/api/database/rows/table/${cfg.tableId}/?user_field_names=true`,
        'POST',
        payload,
        cfg
      );
    }
  } catch (error) {
    console.error('Error saving admin password to Baserow:', error);
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
