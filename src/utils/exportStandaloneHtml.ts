const SOURCE_FILES = [
  'firebase-applet-config.json',
  'src/index.css',
  'src/types.ts',
  'src/data/portfolioData.ts',
  'src/lib/firebase.ts',
  'src/lib/firestoreService.ts',
  'src/utils/exportStandaloneHtml.ts',
  'src/components/ConstellationBackground.tsx',
  'src/components/DigitalSignature.tsx',
  'src/components/FloatingWhatsApp.tsx',
  'src/components/Navbar.tsx',
  'src/components/Hero.tsx',
  'src/components/ProductShowcase.tsx',
  'src/components/AboutSection.tsx',
  'src/components/ContactSection.tsx',
  'src/components/Footer.tsx',
  'src/components/ProductDetailModal.tsx',
  'src/components/AddProductModal.tsx',
  'src/components/AdminLoginModal.tsx',
  'src/components/AdminPanelModal.tsx',
  'src/App.tsx',
  'src/main.tsx',
];

async function readRawSourceFile(filePath: string): Promise<string> {
  const win = window as any;
  if (win.__PRELOADED_SOURCES__ && typeof win.__PRELOADED_SOURCES__[filePath] === 'string') {
    return win.__PRELOADED_SOURCES__[filePath];
  }
  if (win.__RUNTIME_SOURCES__ && typeof win.__RUNTIME_SOURCES__[filePath] === 'string') {
    return win.__RUNTIME_SOURCES__[filePath];
  }

  const isViteDev = !!document.querySelector('script[src*="@vite/client"]');
  if (isViteDev) {
    try {
      const mod = await import(/* @vite-ignore */ `/${filePath}?raw`);
      if (mod && typeof mod.default === 'string') {
        return mod.default;
      }
    } catch {
      // Fallback to fetch below
    }
  }

  const res = await fetch(`./${filePath}`);
  if (!res.ok) {
    throw new Error(`No se pudo leer ${filePath} (${res.status})`);
  }
  return await res.text();
}

/**
 * Generates and downloads a 100% self-contained `index.html` file
 * that works both by double-clicking locally on a PC (`file://`)
 * and by uploading directly to Cloudflare Pages / Netlify / any static host.
 */
export async function downloadStandaloneHtml(): Promise<void> {
  const sourcesMap: Record<string, string> = {};

  await Promise.all(
    SOURCE_FILES.map(async (f) => {
      sourcesMap[f] = await readRawSourceFile(f);
    })
  );

  // Escape closing script tags inside JSON payload
  const serializedSources = JSON.stringify(sourcesMap).replace(/<\/script>/gi, '<\\/script>');

  const htmlRes = await readRawSourceFile('index.html').catch(async () => {
    const r = await fetch('./index.html');
    return await r.text();
  });

  // Remove Vite client script if present in fetched HTML
  let cleanHtml = htmlRes.replace(/<script\s+type="module"\s+src="\/@vite\/client"><\/script>\s*/g, '');

  const preloadScript = `<script>window.__PRELOADED_SOURCES__ = ${serializedSources};</script>\n  </head>`;
  if (cleanHtml.includes('</head>')) {
    cleanHtml = cleanHtml.replace('</head>', preloadScript);
  } else {
    cleanHtml = preloadScript + cleanHtml;
  }

  const blob = new Blob([cleanHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'index.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
