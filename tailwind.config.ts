import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Colors defined in globals.css @theme
      colors: {
        "casino-bg": "var(--color-casino-bg)",
        "casino-border": "var(--color-casino-border)",
        "casino-card": "var(--color-casino-card)",
        "primary-purple": "var(--color-primary-purple)",
        "primary-purple-hover": "var(--color-primary-purple-hover)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
      },
      // Spacing values
      spacing: {
        "85": "340px", // w-85 for stat cards
        "300": "1280px", // max-w-300 for container
      },
    },
  },
  plugins: [animate],
};

export default config;
