/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#1F4D3A',
          deep: '#14352A',
          light: '#28634B',
          muted: '#2D5A46',
        },
        mint: {
          DEFAULT: '#A8E6CF',
          light: '#E3F6EC',
          soft: '#F0FAF4',
          dark: '#7ED8B6',
        },
        cream: {
          DEFAULT: '#FAF6EC',
          dark: '#F3EBD8',
          card: '#FFFFFF',
        },
        amber: {
          DEFAULT: '#E9B44C',
          light: '#FBF0D9',
        },
        terracotta: {
          DEFAULT: '#C8553D',
          light: '#F9E9E6',
        },
        charcoal: {
          DEFAULT: '#1E2A25',
          muted: '#4A5B53',
          light: '#768B81',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        'card': '16px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(31, 77, 58, 0.08)',
        'elevated': '0 10px 25px -3px rgba(31, 77, 58, 0.12)',
      }
    },
  },
  plugins: [],
}
