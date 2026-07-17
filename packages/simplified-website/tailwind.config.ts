import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        kupfer: {
          DEFAULT: "#C4431A",
          dark: "#A5370F",
          light: "#E07050",
          mist: "#F5E8E2",
        },
        destructive: "#ef4444",
      },
      fontFamily: {
        sans: [
          "var(--font-loehrning-sans)",
          "var(--font-geist-sans)",
          "'Inter'",
          "system-ui",
          "sans-serif",
        ],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
