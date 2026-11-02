import rawIndexHtml from '../../index.html?raw';
import rawAdminHtml from '../../admin.html?raw';
import rawConfigJson from '../../firebase-applet-config.json?raw';
import rawIndexCss from '../index.css?raw';
import rawTypes from '../types.ts?raw';
import rawPortfolioData from '../data/portfolioData.ts?raw';
import rawFirebase from '../lib/firebase.ts?raw';
import rawFirestoreService from '../lib/firestoreService.ts?raw';
import rawConstellation from '../components/ConstellationBackground.tsx?raw';
import rawDigitalSignature from '../components/DigitalSignature.tsx?raw';
import rawFloatingWhatsApp from '../components/FloatingWhatsApp.tsx?raw';
import rawNavbar from '../components/Navbar.tsx?raw';
import rawHero from '../components/Hero.tsx?raw';
import rawProductShowcase from '../components/ProductShowcase.tsx?raw';
import rawAboutSection from '../components/AboutSection.tsx?raw';
import rawContactSection from '../components/ContactSection.tsx?raw';
import rawFooter from '../components/Footer.tsx?raw';
import rawProductDetailModal from '../components/ProductDetailModal.tsx?raw';
import rawAddProductModal from '../components/AddProductModal.tsx?raw';
import rawAdminLoginModal from '../components/AdminLoginModal.tsx?raw';
import rawAdminPanelModal from '../components/AdminPanelModal.tsx?raw';
import rawApp from '../App.tsx?raw';
import rawMain from '../main.tsx?raw';

const SELF_EXPORT_MODULE_SOURCE = `
export async function downloadStandaloneHtml(targetFile: 'index.html' | 'admin.html' = 'index.html'): Promise<void> {
  const win = window as any;
  const sourcesMap = win.__RUNTIME_SOURCES__ || win.__PRELOADED_SOURCES__ || {};
  const rawHtml = sourcesMap[targetFile] || sourcesMap['index.html'] || document.documentElement.outerHTML;
  const serializedSources = JSON.stringify(sourcesMap).replace(/<\\/script>/gi, '<\\\\/script>');
  let cleanHtml = rawHtml
    .replace(/<script\\s+type="module"\\s+src="\\/@vite\\/client"><\\/script>\\s*/gi, '')
    .replace(/<script[^>]*src="\\/_aistudio-iframe\\.js[^"]*"[^>]*><\\/script>\\s*/gi, '')
    .replace(/<script\\s+id="educom-preloaded-sources">[\\s\\S]*?<\\/script>\\s*/gi, '');
  const forceAdminTag = targetFile === 'admin.html' ? 'window.__EDUCOM_FORCE_ADMIN_PAGE__ = true;' : '';
  const preloadScript = '<script id="educom-preloaded-sources">' + forceAdminTag + 'window.__PRELOADED_SOURCES__ = ' + serializedSources + ';</script>\\n  </head>';
  if (cleanHtml.includes('</head>')) {
    cleanHtml = cleanHtml.replace('</head>', () => preloadScript);
  } else {
    cleanHtml = preloadScript + cleanHtml;
  }
  const blob = new Blob([cleanHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = targetFile;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export async function downloadStandaloneAdminHtml(): Promise<void> {
  return downloadStandaloneHtml('admin.html');
}
`;

const STATIC_RAW_SOURCES: Record<string, string> = {
  'index.html': rawIndexHtml,
  'admin.html': rawAdminHtml,
  'firebase-applet-config.json': rawConfigJson,
  'src/index.css': rawIndexCss,
  'src/types.ts': rawTypes,
  'src/data/portfolioData.ts': rawPortfolioData,
  'src/lib/firebase.ts': rawFirebase,
  'src/lib/firestoreService.ts': rawFirestoreService,
  'src/utils/exportStandaloneHtml.ts': SELF_EXPORT_MODULE_SOURCE.trim(),
  'src/components/ConstellationBackground.tsx': rawConstellation,
  'src/components/DigitalSignature.tsx': rawDigitalSignature,
  'src/components/FloatingWhatsApp.tsx': rawFloatingWhatsApp,
  'src/components/Navbar.tsx': rawNavbar,
  'src/components/Hero.tsx': rawHero,
  'src/components/ProductShowcase.tsx': rawProductShowcase,
  'src/components/AboutSection.tsx': rawAboutSection,
  'src/components/ContactSection.tsx': rawContactSection,
  'src/components/Footer.tsx': rawFooter,
  'src/components/ProductDetailModal.tsx': rawProductDetailModal,
  'src/components/AddProductModal.tsx': rawAddProductModal,
  'src/components/AdminLoginModal.tsx': rawAdminLoginModal,
  'src/components/AdminPanelModal.tsx': rawAdminPanelModal,
  'src/App.tsx': rawApp,
  'src/main.tsx': rawMain,
};

/**
 * Generates and downloads a 100% self-contained `index.html` or `admin.html` file
 * using genuine raw TypeScript/TSX sources (never Vite dev-transformed code).
 */
export async function downloadStandaloneHtml(
  targetFile: 'index.html' | 'admin.html' = 'index.html'
): Promise<void> {
  const win = window as any;
  const runtimeSources = win.__RUNTIME_SOURCES__ || win.__PRELOADED_SOURCES__ || {};

  const sourcesMap: Record<string, string> = {};
  for (const [key, staticVal] of Object.entries(STATIC_RAW_SOURCES)) {
    const candidate = typeof staticVal === 'string' && staticVal.length > 0 ? staticVal : runtimeSources[key];
    if (
      typeof candidate === 'string' &&
      !candidate.includes('/node_modules/.vite/') &&
      !candidate.includes('__vite__cjsImport')
    ) {
      sourcesMap[key] = candidate;
    } else if (typeof runtimeSources[key] === 'string') {
      sourcesMap[key] = runtimeSources[key];
    } else {
      sourcesMap[key] = staticVal || '';
    }
  }

  // Capture current localStorage snapshot so local customizations are also available offline immediately
  const localSnapshot: Record<string, string> = {};
  try {
    const keys = [
      'educom_products_v4',
      'educom_profile_v4',
      'educom_categories_v4',
      'educom_admin_password_v4',
      'educom_nocodb_config_v1',
    ];
    for (const k of keys) {
      const val = localStorage.getItem(k);
      if (val) localSnapshot[k] = val;
    }
  } catch {
    // Ignore storage errors
  }

  const serializedSources = JSON.stringify(sourcesMap).replace(/<\/script>/gi, '<\\/script>');
  const serializedSnapshot = JSON.stringify(localSnapshot).replace(/<\/script>/gi, '<\\/script>');

  const baseHtml =
    targetFile === 'admin.html'
      ? sourcesMap['admin.html'] || rawAdminHtml
      : sourcesMap['index.html'] || rawIndexHtml;

  // Strip any Vite client, AI Studio iframe helper, or older preloaded script block
  let cleanHtml = baseHtml
    .replace(/<script\s+type="module"\s+src="\/@vite\/client"><\/script>\s*/gi, '')
    .replace(/<script[^>]*src="\/_aistudio-iframe\.js[^"]*"[^>]*><\/script>\s*/gi, '')
    .replace(/<script\s+id="educom-preloaded-sources">[\s\S]*?<\/script>\s*/gi, '')
    .replace(/<script>window\.__PRELOADED_SOURCES__\s*=[\s\S]*?<\/script>\s*/gi, '');

  const forceAdminFlag =
    targetFile === 'admin.html' ? 'window.__EDUCOM_FORCE_ADMIN_PAGE__ = true;' : '';

  const preloadScript =
    `<script id="educom-preloaded-sources">` +
    forceAdminFlag +
    `window.__PRELOADED_SOURCES__ = ${serializedSources};` +
    `window.__PRELOADED_LOCALSTORAGE__ = ${serializedSnapshot};` +
    `try { var snap = window.__PRELOADED_LOCALSTORAGE__ || {}; for (var k in snap) { if (!localStorage.getItem(k)) localStorage.setItem(k, snap[k]); } } catch(e) {}` +
    `</script>\n  </head>`;

  if (cleanHtml.includes('</head>')) {
    cleanHtml = cleanHtml.replace('</head>', () => preloadScript);
  } else {
    cleanHtml = preloadScript + cleanHtml;
  }

  const blob = new Blob([cleanHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = targetFile;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

export async function downloadStandaloneAdminHtml(): Promise<void> {
  return downloadStandaloneHtml('admin.html');
}
