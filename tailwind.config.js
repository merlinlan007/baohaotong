/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
  // Avoid conflicts with MUI
  corePlugins: {
    preflight: false,
  },
};
