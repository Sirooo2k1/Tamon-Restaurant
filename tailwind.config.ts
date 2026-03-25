import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ramen: {
          broth: "#c2410c",
          noodle: "#f59e0b",
          dark: "#1c1917",
          warm: "#fef3c7",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.8rem", "1.6"],
        sm: ["0.95rem", "1.7"],
        base: ["1.05rem", "1.8"],
      },
    },
  },
  plugins: [],
};
export default config;
