/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          600: "#2563EB",
          700: "#1D4ED8",
          900: "#1E3A5F",
        },
        health: {
          green: "#16A34A",
          amber: "#D97706",
          red: "#DC2626",
          greenBg: "#F0FDF4",
          amberBg: "#FFFBEB",
          redBg: "#FEF2F2",
        }
      }
    }
  },
  plugins: [],
}
