
import { Toaster } from '@/shared/ui/shadcn/sonner';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createRoot } from 'react-dom/client';
import { Provider } from './app/providers/index.tsx';
import './index.css';
import './shared/i18n/config';
import { ThemeProvider } from './shared/providers/theme-provider.tsx';
// Set window title to include app version when running inside Tauri
// Use dynamic imports so this file can still run in a browser dev server
// where the Tauri APIs may not be available.
try {
  (async () => {
    // Import here to avoid throwing in non-Tauri environments
    const { getName, getVersion } = await import('@tauri-apps/api/app');

    // Helper to attempt multiple ways to set the native window title
    const trySetTitle = async (title: string) => {
      // 1) Try the typed module export (preferred)
      try {
        await getCurrentWindow().setTitle(title);
        return true;
      } catch (e: any) {
        // If permission denied for core:window:allow-set-title, fall back to
        // invoking the Rust command `set_title` which uses the native API.
        const msg = String(e?.message || e || '');
        if (msg.includes('allow-set-title') || msg.includes('not allowed') || msg.includes('set_title')) {
          try {
            await invoke('set_title', { title });
            return true;
          } catch (invokeErr) {
          }
        }

        return false;
      }
    };

    try {
      const [name, version] = await Promise.all([getName(), getVersion()]);
      if (name && version) {
        const title = `${name} v${version}`;

        // Try to set title now. If it fails, schedule a retry shortly after
        // startup when more APIs may be available.
       await trySetTitle(title);

      }
    } catch (e) {
      // Fail silently in dev / non-tauri contexts, but log for debugging
      // eslint-disable-next-line no-console
    }
  })();
} catch (e) {
  // Dynamic import may fail in some environments — ignore.
}

// Get saved theme from localStorage or use default
const savedTheme = localStorage.getItem('texno-uz-gsms-theme') || 'dark';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <ThemeProvider defaultTheme={savedTheme as any} storageKey="texno-uz-gsms-theme">
    <Toaster />
    <Provider />
  </ThemeProvider>
  // </StrictMode>,
)
