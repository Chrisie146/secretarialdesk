export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif']
      },
      colors: {
        ink: '#20242a',
        forest: '#0f4739',
        sage: '#e9f0ea',
        gold: '#a8792c',
        paper: '#fbfaf7'
      },
      boxShadow: {
        panel: '0 18px 60px rgba(20, 29, 24, 0.08)'
      }
    }
  },
  plugins: []
};
