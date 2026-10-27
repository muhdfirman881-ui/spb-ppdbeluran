/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: {
            50: '#F0F5FA',
            100: '#E8EFF7',
            200: '#C7D9EC',
            700: '#1B4573',
            800: '#12345C',
            900: '#0A2342',
            950: '#061528',
          },
          gold: {
            50: '#FCF9F2',
            100: '#FAF6EB',
            200: '#EEDEB6',
            400: '#DEC486',
            500: '#C9A961',
            600: '#B39247',
            700: '#8C6F2F',
          },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '20px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(10, 35, 66, 0.04)',
        sm: '0 2px 6px rgba(10, 35, 66, 0.06)',
        md: '0 6px 16px rgba(10, 35, 66, 0.08)',
        lg: '0 12px 32px rgba(10, 35, 66, 0.12)',
        xl: '0 20px 48px rgba(10, 35, 66, 0.16)',
      },
    },
  },
  plugins: [],
};
