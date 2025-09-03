// Typography System for Recruitment Portal
export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  
  // Font sizes with responsive variants
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    '5xl': ['3rem', { lineHeight: '1' }],           // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
  },
  
  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Text colors
  textColor: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    tertiary: 'text-gray-500',
    muted: 'text-gray-400',
    inverse: 'text-white',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  },
  
  // Heading styles
  heading: {
    h1: 'text-4xl font-bold tracking-tight text-gray-900',
    h2: 'text-3xl font-semibold tracking-tight text-gray-900',
    h3: 'text-2xl font-semibold tracking-tight text-gray-900',
    h4: 'text-xl font-semibold text-gray-900',
    h5: 'text-lg font-semibold text-gray-900',
    h6: 'text-base font-semibold text-gray-900',
  },
  
  // Body text styles
  body: {
    large: 'text-lg leading-relaxed text-gray-700',
    base: 'text-base leading-relaxed text-gray-700',
    small: 'text-sm leading-relaxed text-gray-600',
    caption: 'text-xs leading-relaxed text-gray-500',
  },
  
  // Special text styles
  special: {
    display: 'text-5xl font-black tracking-tight text-gray-900',
    hero: 'text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl',
    lead: 'text-xl text-gray-600',
    quote: 'text-lg italic text-gray-600 border-l-4 border-blue-500 pl-4',
    code: 'text-sm font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded',
  },
  
  // Interactive text styles
  interactive: {
    link: 'text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 transition-colors',
    button: 'font-medium text-white',
    nav: 'font-medium text-gray-700 hover:text-gray-900 transition-colors',
  }
}

// Utility classes for common typography patterns
export const typographyClasses = {
  // Page headers
  pageHeader: 'text-4xl font-bold tracking-tight text-gray-900 mb-2',
  pageSubheader: 'text-xl text-gray-600 mb-8',
  
  // Section headers
  sectionHeader: 'text-2xl font-semibold text-gray-900 mb-4',
  sectionSubheader: 'text-lg text-gray-600 mb-6',
  
  // Card headers
  cardHeader: 'text-xl font-semibold text-gray-900',
  cardSubheader: 'text-sm text-gray-500',
  
  // Form labels
  formLabel: 'block text-sm font-medium text-gray-700 mb-2',
  formHelper: 'text-sm text-gray-500 mt-1',
  formError: 'text-sm text-red-600 mt-1',
  
  // Table styles
  tableHeader: 'text-sm font-semibold text-gray-900 uppercase tracking-wider',
  tableCell: 'text-sm text-gray-900',
  tableCellMuted: 'text-sm text-gray-500',
  
  // Status indicators
  statusSuccess: 'text-sm font-medium text-green-600',
  statusWarning: 'text-sm font-medium text-yellow-600',
  statusError: 'text-sm font-medium text-red-600',
  statusInfo: 'text-sm font-medium text-blue-600',
  
  // Navigation
  navActive: 'text-blue-600 font-medium',
  navInactive: 'text-gray-600 hover:text-gray-900 transition-colors',
  
  // Buttons
  buttonPrimary: 'font-medium text-white',
  buttonSecondary: 'font-medium text-gray-700',
  buttonGhost: 'font-medium text-gray-600 hover:text-gray-900',
}
