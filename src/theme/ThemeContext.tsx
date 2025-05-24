import React, {createContext, useState, ReactNode, useMemo, useCallback} from 'react';
import {Appearance} from 'react-native';
import {lightThemeColors, darkThemeColors, ColorTheme, ColorMode} from './colors';
import {typography, Typography} from './typography';

interface Theme {
  colors: ColorTheme;
  typography: Typography;
  mode: ColorMode;
  isDarkMode: boolean;
}

interface ThemeContextType extends Theme {
  toggleTheme: () => void;
  setThemeMode: (mode: ColorMode) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  // Get system preference for initial theme
  const systemColorScheme = Appearance.getColorScheme();
  const [themeMode, setThemeMode] = useState<ColorMode>(
    systemColorScheme || 'light'
  );

  const toggleTheme = useCallback(() => {
    setThemeMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);
  
  const setTheme = useCallback((mode: ColorMode) => {
    setThemeMode(mode);
  }, []);

  const currentColors = useMemo(() => {
    return themeMode === 'light' ? lightThemeColors : darkThemeColors;
  }, [themeMode]);

  const theme: Theme = useMemo(() => ({
    colors: currentColors,
    typography: typography, // Typography is often mode-agnostic, but could be extended
    mode: themeMode,
    isDarkMode: themeMode === 'dark',
  }), [currentColors, themeMode]);

  const contextValue: ThemeContextType = useMemo(() => ({
    ...theme,
    toggleTheme,
    setThemeMode: setTheme,
  }), [theme, toggleTheme, setTheme]);


  // Optional: Listen to system theme changes
  // useEffect(() => {
  //   const subscription = Appearance.addChangeListener(({ colorScheme }) => {
  //     if (colorScheme) {
  //       setThemeMode(colorScheme);
  //     }
  //   });
  //   return () => subscription.remove();
  // }, []);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easier theme consumption
export const useTheme = (): ThemeContextType => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
