/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/*.html"],
  theme: {
    extend: {
      height: { screen: "100dvh" },
      minHeight: { screen: "100dvh" },
      maxHeight: { screen: "100dvh" },
      fontSize: {
        xs:    ["calc(0.75rem  * var(--msg-scale))", { lineHeight: "calc(1.125rem * var(--msg-scale))" }],
        sm:    ["calc(0.875rem * var(--msg-scale))", { lineHeight: "calc(1.25rem * var(--msg-scale))" }],
        base:  ["calc(1rem     * var(--msg-scale))", { lineHeight: "calc(1.5rem  * var(--msg-scale))" }],
        lg:    ["calc(1.125rem * var(--msg-scale))", { lineHeight: "calc(1.75rem * var(--msg-scale))" }],
        xl:    ["calc(1.25rem  * var(--msg-scale))", { lineHeight: "calc(1.75rem * var(--msg-scale))" }],
        "2xl": ["calc(1.5rem   * var(--msg-scale))", { lineHeight: "calc(2rem    * var(--msg-scale))" }],
        "3xl": ["calc(1.875rem * var(--msg-scale))", { lineHeight: "calc(2.25rem * var(--msg-scale))" }],
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
        "inset-hairline": "inset 0 0 0 1px rgb(var(--c-border-default))",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
      },
      colors: {
        // ── 新設計系統（Linear 風格）──────────────
        // 色票來自 src/assets/index.css 中的 .dark / .light（RGB 三元組格式）
        // 包裝成 rgb(var() / <alpha-value>) 以支援 Tailwind 的 alpha 修飾子（如 bg-accent/20）
        // overlay / accent.bg / accent.border 已預先疊好 alpha，直接用 var()
        bg: {
          app:      "rgb(var(--c-bg-app) / <alpha-value>)",
          sidebar:  "rgb(var(--c-bg-sidebar) / <alpha-value>)",
          canvas:   "rgb(var(--c-bg-canvas) / <alpha-value>)",
          surface:  "rgb(var(--c-bg-surface) / <alpha-value>)",
          elevated: "rgb(var(--c-bg-elevated) / <alpha-value>)",
          hover:    "rgb(var(--c-bg-hover) / <alpha-value>)",
          overlay:  "var(--c-bg-overlay)",
        },
        border: {
          subtle:  "rgb(var(--c-border-subtle) / <alpha-value>)",
          DEFAULT: "rgb(var(--c-border-default) / <alpha-value>)",
          strong:  "rgb(var(--c-border-strong) / <alpha-value>)",
        },
        fg: {
          primary:   "rgb(var(--c-fg-primary) / <alpha-value>)",
          body:      "rgb(var(--c-fg-body) / <alpha-value>)",
          secondary: "rgb(var(--c-fg-secondary) / <alpha-value>)",
          muted:     "rgb(var(--c-fg-muted) / <alpha-value>)",
          subtle:    "rgb(var(--c-fg-subtle) / <alpha-value>)",
          disabled:  "rgb(var(--c-fg-disabled) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--c-accent) / <alpha-value>)",
          hover:   "rgb(var(--c-accent-hover) / <alpha-value>)",
          pressed: "rgb(var(--c-accent-pressed) / <alpha-value>)",
          on:      "rgb(var(--c-accent-on) / <alpha-value>)",
          bg:      "var(--c-accent-bg)",
          border:  "var(--c-accent-border)",
        },
        online:  "rgb(var(--c-online) / <alpha-value>)",
        idle:    "rgb(var(--c-idle) / <alpha-value>)",
        offline: "rgb(var(--c-offline) / <alpha-value>)",
        danger: {
          DEFAULT: "rgb(var(--c-danger) / <alpha-value>)",
          bg:      "rgb(var(--c-danger-bg) / <alpha-value>)",
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
