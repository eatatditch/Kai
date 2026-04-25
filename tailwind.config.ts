import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        // Retro surf palette — initial pass, refine after design review.
        sand: {
          50: "#FBF6EC",
          100: "#F4EAD2",
          200: "#E8D6A8",
          300: "#DABE7E",
          400: "#C7A35A",
          500: "#A88444",
        },
        ocean: {
          50: "#E6F2F4",
          100: "#BFDDE2",
          300: "#6FA8B2",
          500: "#2F6E7A",
          700: "#1B4A55",
          900: "#0D2A33",
        },
        sunset: {
          300: "#F4A47A",
          500: "#E27447",
          700: "#B14A22",
        },
        palm: {
          500: "#5A7A3F",
          700: "#3E5A2A",
        },
        cream: "#FBF6EC",
        ink: "#1A1410",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
