import { THEMES } from "../lib/themes";
import { useTheme } from "../context/ThemeContext";

export default function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="theme-picker">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          title={t.hint}
          className={`theme-picker__btn ${theme === t.id ? "is-active" : ""}`}
          data-theme-btn={t.id}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
