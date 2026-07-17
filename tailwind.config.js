/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // 表面色 (深/浅主题翻转)
        void: {
          950: "rgb(var(--void-950) / <alpha-value>)",
          900: "rgb(var(--void-900) / <alpha-value>)",
          850: "rgb(var(--void-850) / <alpha-value>)",
          800: "rgb(var(--void-800) / <alpha-value>)",
          750: "rgb(var(--void-750) / <alpha-value>)",
        },
        grid: {
          DEFAULT: "rgb(var(--grid) / <alpha-value>)",
          soft: "rgb(var(--grid-soft) / <alpha-value>)",
        },
        edge: {
          DEFAULT: "rgb(var(--edge) / <alpha-value>)",
          soft: "rgb(var(--edge-soft) / <alpha-value>)",
        },
        ink: {
          50: "rgb(var(--ink-50) / <alpha-value>)",
          100: "rgb(var(--ink-100) / <alpha-value>)",
          300: "rgb(var(--ink-300) / <alpha-value>)",
          500: "rgb(var(--ink-500) / <alpha-value>)",
          700: "rgb(var(--ink-700) / <alpha-value>)",
        },
        // 强调色 (浅色模式下加深以保证对比度)
        neon: {
          50: "rgb(var(--neon-50) / <alpha-value>)",
          100: "rgb(var(--neon-100) / <alpha-value>)",
          300: "rgb(var(--neon-300) / <alpha-value>)",
          400: "rgb(var(--neon-400) / <alpha-value>)",
          500: "rgb(var(--neon-500) / <alpha-value>)",
          600: "rgb(var(--neon-600) / <alpha-value>)",
          700: "rgb(var(--neon-700) / <alpha-value>)",
        },
        amber: {
          400: "rgb(var(--amber-400) / <alpha-value>)",
          500: "rgb(var(--amber-500) / <alpha-value>)",
          600: "rgb(var(--amber-600) / <alpha-value>)",
        },
        magenta: {
          400: "rgb(var(--magenta-400) / <alpha-value>)",
          500: "rgb(var(--magenta-500) / <alpha-value>)",
          600: "rgb(var(--magenta-600) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Sora"', "system-ui", "sans-serif"],
        sans: ['"Outfit"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        "neon-glow": "0 0 0 1px rgb(var(--neon-400)/0.4), 0 0 24px rgb(var(--neon-400)/0.18)",
        "neon-soft": "0 0 24px rgb(var(--neon-400)/0.12)",
        "amber-glow": "0 0 0 1px rgb(var(--amber-500)/0.4), 0 0 24px rgb(var(--amber-500)/0.18)",
        panel: "0 1px 0 rgba(255,255,255,0.02) inset, 0 12px 40px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(42,59,82,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(42,59,82,0.25) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(circle at 50% 0%, rgba(61,217,214,0.12), transparent 60%)",
      },
      backgroundSize: {
        "grid-md": "48px 48px",
      },
      animation: {
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        sweep: "sweep 3.5s linear infinite",
        "blink-dot": "blink-dot 1.2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 12px rgba(61,217,214,0.6)" },
          "50%": { opacity: "0.55", boxShadow: "0 0 4px rgba(61,217,214,0.2)" },
        },
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "blink-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
    },
  },
  plugins: [],
};
