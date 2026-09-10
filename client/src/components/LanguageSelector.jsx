import { LANGUAGES, useLanguage } from "../i18n/LanguageContext";

import "./LanguageSelector.css";

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="language-selector">
      <span className="language-icon">🌐</span>

      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label={t("common.language")}
      >
        {LANGUAGES.map((item) => (
          <option key={item.code} value={item.code}>
            {item.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
