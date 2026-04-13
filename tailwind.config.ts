import type { Config } from "tailwindcss";

// Colors use CSS variable RGB tuples so opacity modifiers (bg-fn-green/10) work.
// Variables are defined in globals.css and toggled by html.light / html.dark classes.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "fn-black":   "rgb(var(--fn-black)   / <alpha-value>)",
        "fn-dark":    "rgb(var(--fn-dark)    / <alpha-value>)",
        "fn-card":    "rgb(var(--fn-card)    / <alpha-value>)",
        "fn-card2":   "rgb(var(--fn-card2)   / <alpha-value>)",
        "fn-green":   "rgb(var(--fn-green)   / <alpha-value>)",
        "fn-gdim":    "rgb(var(--fn-gdim)    / <alpha-value>)",
        "fn-gborder": "rgb(var(--fn-gborder) / <alpha-value>)",
        "fn-yellow":  "rgb(var(--fn-yellow)  / <alpha-value>)",
        "fn-amber":   "rgb(var(--fn-amber)   / <alpha-value>)",
        "fn-red":     "rgb(var(--fn-red)     / <alpha-value>)",
        "fn-pink":    "rgb(var(--fn-pink)    / <alpha-value>)",
        "fn-muted":   "rgb(var(--fn-muted)   / <alpha-value>)",
        "fn-text":    "rgb(var(--fn-text)    / <alpha-value>)",
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
        countdown: "countdown 1s ease-in-out infinite",
      },
      keyframes: {
        blink:     { "0%,100%":{opacity:"1"}, "50%":{opacity:"0"} },
        pulseG:    { "0%,100%":{opacity:"1"}, "50%":{opacity:"0.45"} },
        slideUp:   { "0%":{transform:"translateY(18px)",opacity:"0"}, "100%":{transform:"translateY(0)",opacity:"1"} },
        fadeIn:    { "0%":{opacity:"0"}, "100%":{opacity:"1"} },
        ticker:    { "0%":{transform:"translateX(100%)"}, "100%":{transform:"translateX(-200%)"} },
        countdown: { "0%,100%":{opacity:"1"}, "50%":{opacity:"0.6"} },
      },
      backgroundImage: {
        "grid-fn":  "linear-gradient(rgb(var(--fn-green)/0.04) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--fn-green)/0.04) 1px,transparent 1px)",
      },
      backgroundSize: { grid: "40px 40px" },
    },
  },
  plugins: [],
};
export default config;
