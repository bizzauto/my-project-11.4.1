import { create } from 'zustand';
import { safeGetItem, safeSetItem } from './storage';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (val: boolean) => void;
}

// Initialize theme from localStorage
const initialDark = safeGetItem('theme') === 'dark';
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', initialDark);
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: initialDark,
  toggle: () =>
    set((state) => {
      const next = !state.isDark;
      safeSetItem('theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return { isDark: next };
    }),
  setDark: (val) => {
    safeSetItem('theme', val ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', val);
    set({ isDark: val });
  },
}));
