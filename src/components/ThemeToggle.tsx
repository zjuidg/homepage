import { Show } from 'solid-js';
import { t } from '../i18n';
import { theme, toggleTheme } from '../theme';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const label = () => theme() === 'dark' ? t().theme.switchToLight : t().theme.switchToDark;

  return (
    <button type="button" class="theme-toggle" onClick={toggleTheme} aria-label={label()} title={label()}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <Show when={theme() === 'dark'} fallback={<path d="M20.5 13.1A8.5 8.5 0 0 1 10.9 3.5a8.5 8.5 0 1 0 9.6 9.6Z" />}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </Show>
      </svg>
    </button>
  );
}
