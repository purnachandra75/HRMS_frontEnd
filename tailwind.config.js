/** @type {import('tailwindcss').Config} */
module.exports = {
  // Covers the whole app. This is still safe for the plain-CSS pages that don't use Tailwind:
  // preflight is off (no global reset) and none of the existing hand-written class names
  // collide with real Tailwind utility names, so scanning extra files just finds nothing to
  // generate for them.
  content: ['./src/**/*.{js,jsx}'],
  // Dark mode toggles via a `.dark` class on <html> (see src/hooks/useTheme.js), not the OS
  // media query directly, so the in-app Light/Dark toggle can override system preference.
  darkMode: ['class'],
  corePlugins: {
    // Preflight is Tailwind's global CSS reset (margins, fonts, etc.) - disabling it keeps
    // Tailwind from touching any of the existing plain-CSS pages/components.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', foreground: '#ffffff' },
        secondary: { DEFAULT: '#f1f5f9', foreground: '#0f172a' },
        // background/foreground/card/border/muted are CSS variables (defined in
        // styles/tailwind.css for :root and .dark) rather than static hex, so every component
        // already using these semantic tokens automatically follows the Light/Dark toggle -
        // the rgb(var(...) / <alpha-value>) form is what lets Tailwind opacity modifiers
        // (e.g. border-border/80) keep working against a CSS variable.
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        },
        accent: { DEFAULT: '#eff6ff', foreground: '#1d4ed8' },
        destructive: { DEFAULT: '#ef4444' },
        border: 'rgb(var(--color-border) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--color-card) / <alpha-value>)',
          foreground: 'rgb(var(--color-card-foreground) / <alpha-value>)',
        },
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        // Super Admin shell (blue), per MailWave's role-theme convention.
        sidebar: {
          DEFAULT: '#1e3a8a',
          foreground: '#f8fafc',
          accent: 'rgb(255 255 255 / 16%)',
          border: 'rgb(255 255 255 / 12%)',
          muted: 'rgb(255 255 255 / 68%)',
        },
        // Client (tenant admin) shell (purple).
        client: {
          DEFAULT: '#7c3aed',
          foreground: '#ffffff',
        },
        'client-sidebar': {
          DEFAULT: '#5b21b6',
          foreground: '#f8fafc',
          accent: 'rgb(255 255 255 / 16%)',
          border: 'rgb(255 255 255 / 12%)',
          muted: 'rgb(255 255 255 / 68%)',
        },
        // Employee shell (cyan).
        employee: {
          DEFAULT: '#06b6d4',
          foreground: '#ffffff',
        },
        'employee-sidebar': {
          DEFAULT: '#0e7490',
          foreground: '#f8fafc',
          accent: 'rgb(255 255 255 / 16%)',
          border: 'rgb(255 255 255 / 12%)',
          muted: 'rgb(255 255 255 / 68%)',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        sm: '0 1px 2px rgb(15 23 42 / 0.05)',
        md: '0 4px 16px rgb(15 23 42 / 0.06)',
        lg: '0 12px 32px rgb(15 23 42 / 0.1)',
      },
    },
  },
  plugins: [],
};
