/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        primary:   '#1A1A2E',
        secondary: '#F5A623',
        accent:    '#00D4AA',
      },
    },
  },
  plugins: [],
};
