import { createSignal } from 'solid-js';

export type Theme = 'dark' | 'light';

// The head script restores the saved theme before the first paint.
const [theme, setThemeSignal] = createSignal<Theme>(
  document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
);

export { theme };

export function setTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
  );
  setThemeSignal(next);
  try {
    localStorage.setItem('idg-theme', next);
  } catch {
    // Theme switching still works when storage is unavailable.
  }
}

export function toggleTheme() {
  setTheme(theme() === 'dark' ? 'light' : 'dark');
}
