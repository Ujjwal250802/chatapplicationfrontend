import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("ChatSphere-theme") || "coffee",
  setTheme: (theme) => {
    localStorage.setItem("ChatSphere-theme", theme);
    set({ theme });
  },
}));
