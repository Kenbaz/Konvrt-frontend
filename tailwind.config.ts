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
        // Custom status colors
        status: {
          pending: "#f59e0b",
          processing: "#3b82f6",
          completed: "#10b981",
          failed: "#ef4444",
          cancelled: "#6b7280",
        },
        bgPrimary: "#0a0a0b",
        surface: "#121214",
        elevated: "#1a1a1e",
        border: "#2a2a2e",
        primary: "#f4f4f5",
        secondary: "#a1a1aa",
        muted: "#71717a",
        tinWhite: "#FFFFFFDE",
        headerColor: "#05161A",
        customTeal: "#036666",
        lightGray: "#555",
        neonGreen: "#39FF14",
        lightGray2: "#666",
        navyBlue: "#00072d",
        customGray1: "#262626",
        customWhite: "#ededed",
        customGray: "#373737",
        customBlack: "#0a0a0a",
        powderBlue: "#B0E0E6",
        periwinkle: "#B0C4DE",
        paleTurquoise: "#AFEEEE",
        gold1: "#FFB700",
        gold2: "#FFC300",
        gold3: "#FFD000",
        gold4: "#DBB42C",
        customBrown: "#FAD643",
        customWhite2: "#e9e8e4",
        customWhite3: "#FEFEFE",
        customGray3: "#CCCCCC",
        shimmerColor: "rgba(255, 255, 255, 0.01)",
        whiteShimmer: "rgba(209, 213, 219, 0.30)",
        D4Color: "#7F7F7F",
        E5Color: "#A5A5A5",
      },
      animation: {
        "pulse-subtle": "pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "progress-indeterminate":
          "progress-indeterminate 1.5s ease-in-out infinite",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "progress-indeterminate": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
