import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "casino-bg": "var(--casino-bg)",
        "casino-border": "var(--casino-border)",
        "casino-card": "var(--casino-card)",
        "primary-purple": "var(--primary-purple)",
        "primary-purple-hover": "var(--primary-purple-hover)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-gray": "var(--text-gray)",
        "text-gray-300": "var(--text-gray-300)",
        "text-gray-400": "var(--text-gray-400)",
        "text-gray-600": "var(--text-gray-600)"
      },
      fontFamily: {
        aeonik: ["Aeonik", "Inter", "sans-serif"],
        sans: ["Aeonik", "Inter", "sans-serif"]
      },
      fontWeight: {
        normal: "400",
        medium: "500"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-in": "fade-in 300ms ease-out"
      }
    }
  },
  plugins: [animate]
};

export default config;
