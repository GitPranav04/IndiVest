import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the theme context
export const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  // Check if user has a theme preference in localStorage
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light'; // Default to light mode if no preference
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Update theme in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
    // Apply theme class to body element
    document.body.className = theme;
  }, [theme]);

  const value = {
    theme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};