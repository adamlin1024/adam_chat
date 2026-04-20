/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/*.html"],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.75rem", "1.125rem"],
        "xs-ds":   ["10.5px", { lineHeight: "1.4" }],
        "sm-ds":   ["11px",   { lineHeight: "1.5" }],
        "base-ds": ["12.5px", { lineHeight: "1.5" }],
        "body-ds": ["13px",   { lineHeight: "1.55" }],
        "lg-ds":   ["14px",   { lineHeight: "1.4" }],
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "PingFang TC", "Noto Sans TC", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      letterSpacing: {
        "ds-tight":  "-0.015em",
        "ds-normal": "-0.005em",
        "ds-wide":   "0.05em",
        "ds-mono":   "0.08em",
        "ds-caps":   "0.14em",
      },
      spacing: {
        "icon-bar":    "56px",
        "session-bar": "232px",
        "chat-header": "48px",
        "hit-min":     "32px",
      },
      borderRadius: {
        sm:   "4px",
        md:   "6px",
        lg:   "8px",
        xl:   "10px",
      },
      boxShadow: {
        overlay:          "0 20px 50px rgba(0, 0, 0, 0.5)",
        dropdown:         "0 8px 24px rgba(0, 0, 0, 0.4)",
        "inset-hairline": "inset 0 0 0 1px #27272a",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
      },
      colors: {
        // ── 新設計系統（Linear 風格）──────────────
        bg: {
          app:      "#08090b",
          sidebar:  "#0c0d10",
          canvas:   "#0a0b0e",
          surface:  "#141519",
          elevated: "#0c0d10",
          overlay:  "rgba(0, 0, 0, 0.7)",
        },
        border: {
          subtle:  "#18191d",
          DEFAULT: "#27272a",
          strong:  "#3f3f46",
        },
        fg: {
          primary:   "#f4f4f5",
          body:      "#d4d4d8",
          secondary: "#a1a1aa",
          muted:     "#71717a",
          subtle:    "#52525b",
          disabled:  "#3f3f46",
        },
        accent: {
          DEFAULT: "#5eead4",
          hover:   "#2dd4bf",
          pressed: "#14b8a6",
          on:      "#042f2e",
          bg:      "rgba(94, 234, 212, 0.08)",
          border:  "rgba(94, 234, 212, 0.19)",
        },
        online:  "#4ade80",
        idle:    "#fbbf24",
        offline: "#52525b",
        danger: {
          DEFAULT: "#f87171",
          bg:      "#ef4444",
        },
        // ── 舊有 primary（保留相容）────────────────
        primary: {
          25: "#F5FEFF",
          50: "#ECFDFF",
          100: "#CFF9FE",
          200: "#A5F0FC",
          300: "#67E3F9",
          400: "#22CCEE",
          500: "#06AED4",
          600: "#088AB2",
          700: "#0E7090",
          800: "#155B75",
          900: "#164C63"
        }
      },
      animation: {
        speaking: "speaking 0.5s infinite cubic-bezier(.36, .11, .89, .32) alternate",
        zoomIn: "zoomIn 0.2s ease-in forwards"
      },
      keyframes: {
        zoomIn: {
          from: {
            transform: `scale(0.2)`
          },
          to: {
            transform: `scale(1)`
          }
        },
        fadeInUp: {
          from: {
            opacity: 0,
            transform: `translate3d(0, 100%, 0)`
          },

          to: {
            opacity: 1,
            transform: `translate3d(0, 0, 0)`
          }
        },
        speaking: {
          from: {
            opacity: 0.8
          },
          to: {
            opacity: 0
          }
        }
      }
    }
  },
  plugins: []
};
