import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voz-cidade-theme') as Theme;
      if (saved) return saved;
      
      // Default to dark mode for modern aesthetic
      return 'dark';
    }
    return 'dark';
  });
  
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    localStorage.setItem('voz-cidade-theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };
  
  return { theme, setTheme, toggleTheme };
}
