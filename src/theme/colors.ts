// Using Tailwind CSS color names as a reference.
// Source: https://tailwindcss.com/docs/customizing-colors
// For a real app, these would be meticulously chosen.

export const lightThemeColors = {
  primary: '#0ea5e9', // sky-500
  primaryDark: '#0284c7', // sky-600
  secondary: '#64748b', // slate-500
  secondaryDark: '#475569', // slate-600

  background: '#f8fafc', // slate-50
  surface: '#ffffff', // white
  card: '#ffffff', // white
  border: '#e2e8f0', // slate-200
  divider: '#cbd5e1', // slate-300

  text: '#0f172a', // slate-900
  textSecondary: '#334155', // slate-700
  textDisabled: '#94a3b8', // slate-400
  placeholder: '#94a3b8', // slate-400

  success: '#22c55e', // green-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  info: '#3b82f6', // blue-500

  // Specific UI elements
  buttonPrimaryBackground: '#0ea5e9', // sky-500
  buttonPrimaryText: '#ffffff',
  buttonSecondaryBackground: '#f1f5f9', // slate-100
  buttonSecondaryText: '#0ea5e9', // sky-500
  buttonDisabledBackground: '#e2e8f0', // slate-200
  buttonDisabledText: '#94a3b8', // slate-400

  inputBackground: '#ffffff',
  inputBorder: '#cbd5e1', // slate-300
  inputText: '#0f172a',
  inputLabel: '#334155',
  inputErrorBorder: '#ef4444',

  tabBarBackground: '#ffffff',
  tabBarActiveTint: '#0ea5e9',
  tabBarInactiveTint: '#64748b',

  headerBackground: '#ffffff',
  headerText: '#0f172a',

  statusBar: '#ffffff', // For light theme
};

export const darkThemeColors = {
  primary: '#38bdf8', // sky-400
  primaryDark: '#0ea5e9', // sky-500
  secondary: '#94a3b8', // slate-400
  secondaryDark: '#64748b', // slate-500

  background: '#0f172a', // slate-900
  surface: '#1e293b', // slate-800
  card: '#1e293b', // slate-800
  border: '#334155', // slate-700
  divider: '#475569', // slate-600

  text: '#f1f5f9', // slate-100
  textSecondary: '#cbd5e1', // slate-300
  textDisabled: '#64748b', // slate-500
  placeholder: '#64748b', // slate-500

  success: '#4ade80', // green-400
  warning: '#facc15', // yellow-400
  error: '#f87171', // red-400
  info: '#60a5fa', // blue-400

  // Specific UI elements
  buttonPrimaryBackground: '#38bdf8', // sky-400
  buttonPrimaryText: '#0f172a', // slate-900
  buttonSecondaryBackground: '#334155', // slate-700
  buttonSecondaryText: '#38bdf8', // sky-400
  buttonDisabledBackground: '#475569', // slate-600
  buttonDisabledText: '#94a3b8', // slate-400
  
  inputBackground: '#1e293b', // slate-800
  inputBorder: '#475569', // slate-600
  inputText: '#f1f5f9',
  inputLabel: '#cbd5e1',
  inputErrorBorder: '#f87171',

  tabBarBackground: '#1e293b',
  tabBarActiveTint: '#38bdf8',
  tabBarInactiveTint: '#94a3b8',

  headerBackground: '#1e293b',
  headerText: '#f1f5f9',

  statusBar: '#0f172a', // For dark theme
};

export type ColorTheme = typeof lightThemeColors;
export type ColorMode = 'light' | 'dark';
export type Colors = ColorTheme; // For simplicity, the structure is the same
