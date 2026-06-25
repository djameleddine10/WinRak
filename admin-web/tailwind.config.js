/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        surface: '#111118',
        border: '#1E1E2E',
        primary: '#6366F1',
        'primary-light': '#818CF8',
        'primary-dark': '#4F46E5',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        muted: '#6B7280',
        'text-primary': '#F9FAFB',
        'text-secondary': '#9CA3AF',
        sidebar: '#0D0D14',
        winrak: '#F5A623',
        'winrak-dark': '#1A1A2E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-sm': '0 0 10px rgba(99, 102, 241, 0.1)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0D0D14 0%, #111118 100%)',
        'gradient-winrak': 'linear-gradient(135deg, #F5A623 0%, #E8930A 100%)',
      },
    },
  },
  plugins: [],
}
