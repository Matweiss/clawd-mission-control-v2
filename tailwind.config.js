/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Semantic surface tokens — TMW-601 calmer palette (Apr 2026).
        // Existing components continue to use bg-background / bg-surface / etc.
        // and inherit the new look without per-component edits.
        background: '#0A0A0B',
        surface: '#111114',
        'surface-light': '#1C1C22',
        border: '#2A2A32',

        // Explicit neutral steps for components that want finer control.
        'bg-0': '#0A0A0B',
        'bg-1': '#111114',
        'bg-2': '#16161B',
        'bg-3': '#1C1C22',
        'line-1': '#1F1F25',
        'line-2': '#2A2A32',
        'text-1': '#ECECEF',
        'text-2': '#9598A3',
        'text-3': '#5C5F6B',

        // Department accents (used as 2px strip on cards, never as glow).
        // Names match agent.color values used across mat.tsx.
        work: '#E08B4A',       // sales / Luke
        build: '#5C8FE6',      // Bob
        research: '#5BB39A',   // Scout
        lifestyle: '#6BB18C',  // Sage
        email: '#D77AAB',      // Hermes
        hubspot: '#6FA6CC',    // Pixel
        arty: '#D08080',
        vandalay: '#C9A24E',
        sloan: '#8C7DD9',
        ceo: '#C44545',        // Clawd

        // Status colors — calmer than the prior neons.
        success: '#5DAB6F',
        warning: '#D9A547',
        error: '#DD6464',
        idle: '#9598A3',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(224, 139, 74, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(224, 139, 74, 0.7)' },
        },
      },
    },
  },
  plugins: [],
}
