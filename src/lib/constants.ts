// ============================================================
// Constantes e Design Tokens do DriverFinance
// ============================================================

export const DESIGN_TOKENS = {
  // Spacing
  spacing: {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-5',
    xl: 'gap-6',
    xxl: 'gap-8',
  },

  // Heights
  heights: {
    header: {
      mobile: 'h-28',
      desktop: 'h-32',
    },
    fab: 'h-16 w-16',
    avatar: 'h-8 w-8',
    logo: {
      header: 'h-32',
      login: 'h-24',
    },
  },

  // Colors
  colors: {
    primary: 'emerald',
    success: 'emerald',
    error: 'red',
    warning: 'amber',
    info: 'blue',
  },

  // Animations
  animations: {
    page: 'animate-page',
    fab: 'animate-fab',
  },

  // Breakpoints
  breakpoints: {
    sm: 'sm:',
    md: 'md:',
    lg: 'lg:',
    xl: 'xl:',
  },
} as const;

export const APP_CONFIG = {
  name: 'DriverFinance',
  version: '1.0.0',
  maxRetries: 3,
  debounceMs: 300,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
} as const;

export const FIREBASE_CONFIG = {
  collections: {
    earnings: 'earnings',
    expenses: 'expenses',
    profile: 'profile',
  },
  maxBatchSize: 500,
} as const;

export const CHART_COLORS = [
  '#34d399', // emerald
  '#fb7185', // rose
  '#fbbf24', // amber
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#f87171', // red
  '#4ade80', // green
] as const;