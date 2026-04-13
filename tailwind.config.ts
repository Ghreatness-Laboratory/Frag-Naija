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
        "fn-black":   "#040904",
        "fn-dark":    "#070d07",
        "fn-card":    "#0c1a0c",
        "fn-card2":   "#0f220f",
        "fn-green":   "#00ff41",
        "fn-gdim":    "#00cc33",
        "fn-gborder": "#1a3a1a",
        "fn-yellow":  "#f0c040",
        "fn-amber":   "#e8a020",
        "fn-red":     "#ff4141",
        "fn-pink":    "#ff6b8a",
        "fn-muted":   "#3d5c3d",
        "fn-text":    "#b8ccb8",
      },
      fontFamily: {
        mono:    ["'JetBrains Mono'", "'Courier New'", "monospace"],
        display: ["'Barlow Condensed'", "Impact", "sans-serif"],
      },
      animation: {
        blink:     "blink 1.2s step-end infinite",
        "pulse-g": "pulseG 2s ease-in-out infinite",
        "slide-u": "slideUp 0.4s ease-out",
        "fade-in": "fadeIn 0.35s ease-out",
        ticker:    "ticker 25s linear infinite",
      },
      keyframes: {
        blink:   { "0%,100%":{opacity:"1"}, "50%":{opacity:"0"} },
        pulseG:  { "0%,100%":{opacity:"1"}, "50%":{opacity:"0.45"} },
        slideUp: { "0%":{transform:"translateY(18px)",opacity:"0"}, "100%":{transform:"translateY(0)",opacity:"1"} },
        fadeIn:  { "0%":{opacity:"0"}, "100%":{opacity:"1"} },
        ticker:  { "0%":{transform:"translateX(100%)"}, "100%":{transform:"translateX(-200%)"} },
      },
      backgroundImage: {
        "grid-fn":  "linear-gradient(rgba(0,255,65,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,65,0.03) 1px,transparent 1px)",
        "hero-grd": "radial-gradient(ellipse 80% 50% at 50% 0%, #0d2010 0%, #040904 65%)",
      },
      backgroundSize: { grid: "40px 40px" },
    },
  },
  plugins: [],
};
export default config;
