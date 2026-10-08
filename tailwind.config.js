/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#1EA7FD',
          deep: '#0D7FD9',
          navy: '#0F172A',
          navy2: '#1E293B',
          // Chrome surfaces used by the header stack (utility bar → main row → rail)
          chrome: '#0B1120',
          slate: '#8DA2C4',
          ink: '#333333',
          light: '#F7F9FC'
        },
        ink: '#333333',
        border: '#E5E7EB',
        navy: '#0F172A',
        navy2: '#1E293B'
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      boxShadow: {
        mega: '0 40px 60px -30px rgba(0, 0, 0, 0.55)',
        card: '0 10px 25px rgba(0, 0, 0, 0.04)',
        hover: '0 24px 48px rgba(30, 167, 253, 0.16)',
        glow: '0 8px 22px rgba(30, 167, 253, 0.35)'
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)'
      },
      // Steps used across components that Tailwind does not ship by default
      // (h-4.5/w-4.5 icons, /8 /12 /92 colour opacities, duration-250).
      spacing: {
        4.5: '1.125rem'
      },
      opacity: {
        8: '0.08',
        12: '0.12',
        92: '0.92'
      },
      transitionDuration: {
        250: '250ms'
      },
      maxWidth: {
        shell: '1380px'
      },
      zIndex: {
        rail: '900',
        drawer: '3000',
        modal: '4000'
      }
    }
  },
  plugins: []
};
