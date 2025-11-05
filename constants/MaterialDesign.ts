export const MD = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    round: 999,
  },
  
  elevation: {
    level0: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    level1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    level2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.20,
      shadowRadius: 1.41,
      elevation: 2,
    },
    level3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 4,
    },
    level4: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 6,
    },
    level5: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 8,
    },
  },
  
  colors: {
    primary: '#667eea',
    primaryDark: '#5568d3',
    primaryLight: '#8899f5',
    secondary: '#764ba2',
    secondaryDark: '#5f3c82',
    secondaryLight: '#9065bd',
    accent: '#4CAF50',
    accentDark: '#388E3C',
    accentLight: '#81C784',
    error: '#F44336',
    errorDark: '#D32F2F',
    errorLight: '#E57373',
    warning: '#FF9800',
    warningDark: '#F57C00',
    warningLight: '#FFB74D',
    info: '#2196F3',
    infoDark: '#1976D2',
    infoLight: '#64B5F6',
    success: '#4CAF50',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceDark: '#121212',
    textPrimary: '#212121',
    textSecondary: '#757575',
    textDisabled: '#BDBDBD',
    textHint: '#9E9E9E',
    divider: '#E0E0E0',
  },
  
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: 0,
    },
    h2: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
      letterSpacing: 0,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: 0.15,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 0.15,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: 0.5,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: 0.25,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
      letterSpacing: 1.25,
      textTransform: 'uppercase' as const,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0.4,
    },
    overline: {
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 16,
      letterSpacing: 1.5,
      textTransform: 'uppercase' as const,
    },
  },
  
  touchTarget: {
    minimum: 48,
    comfortable: 56,
    large: 64,
  },
  
  transitions: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
};

export const createElevation = (level: keyof typeof MD.elevation) => {
  return MD.elevation[level];
};

export const applyTypography = (variant: keyof typeof MD.typography) => {
  return MD.typography[variant];
};

