import { t, toggleLang } from '../i18n';
import './LangToggle.css';

export default function LangToggle() {
  return (
    <button
      class="lang-toggle"
      onClick={toggleLang}
      aria-label="Switch language"
      title="Switch language / 切换语言"
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18 M12 3a14 14 0 0 1 0 18 M12 3a14 14 0 0 0 0 18" />
      </svg>
      <span class="lang-toggle__label">{t().langLabel}</span>
    </button>
  );
}
