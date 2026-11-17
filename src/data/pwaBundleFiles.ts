import standaloneHtml from '../../public/cablecalc-standalone.html?raw';
import manifestJson from '../../public/manifest.json?raw';
import swJs from '../../public/sw.js?raw';

export interface PwaExportFile {
  id: string;
  fileName: string;
  description: string;
  content: string;
}

export const PWA_EXPORT_FILES: PwaExportFile[] = [
  {
    id: 'index-html',
    fileName: 'index.html',
    description:
      'Автономный однофайловый калькулятор CableCalc Pro (HTML + CSS + JS, без внешних зависимостей, работает 100% офлайн)',
    content: standaloneHtml,
  },
  {
    id: 'manifest-json',
    fileName: 'manifest.json',
    description:
      'Web App Manifest для установки на главный экран Android/iOS и упаковки в APK через PWABuilder',
    content: manifestJson,
  },
  {
    id: 'sw-js',
    fileName: 'sw.js',
    description:
      'Service Worker с кэшированием ресурсов (Cache-First) для полной работоспособности без интернета',
    content: swJs,
  },
];
