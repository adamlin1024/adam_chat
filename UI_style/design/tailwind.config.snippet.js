/**
 * Adam_chat Design System — Tailwind 片段
 * ----------------------------------------
 * 把這個片段的 `theme.extend` 內容 merge 進你專案的 tailwind.config.js。
 * 來源：design/tokens.json (v2.0.0)
 *
 * 合併後可用的 utility 範例：
 *   bg-bg-app / bg-bg-sidebar / bg-bg-canvas / bg-bg-surface
 *   text-text-primary / text-text-body / text-text-muted / text-text-subtle
 *   border-border-subtle / border-border-default / border-border-strong
 *   bg-accent / text-accent / border-accent        ← teal-300 主色別名
 *   bg-accent-hover / bg-accent-pressed
 *   text-online / bg-danger / text-danger
 *   font-sans / font-mono
 *   rounded-md / rounded-lg / rounded-xl
 *   shadow-overlay / shadow-dropdown
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './routes/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class', // dark-only 專案可忽略；保留以防未來加 light mode
  theme: {
    extend: {
      colors: {
        // ── 背景層 ──────────────────────────────
        bg: {
          app:      '#08090b',
          sidebar:  '#0c0d10',
          canvas:   '#0a0b0e',
          surface:  '#141519',
          elevated: '#0c0d10',
          overlay:  'rgba(0, 0, 0, 0.7)',
        },

        // ── 邊框 ────────────────────────────────
        border: {
          subtle:  '#18191d',
          DEFAULT: '#27272a',
          strong:  '#3f3f46',
        },

        // ── 文字 ────────────────────────────────
        text: {
          primary:   '#f4f4f5',
          body:      '#d4d4d8',
          secondary: '#a1a1aa',
          muted:     '#71717a',
          subtle:    '#52525b',
          disabled:  '#3f3f46',
        },

        // ── 主色（teal）────────────────────────
        accent: {
          DEFAULT: '#5eead4', // teal-300
          hover:   '#2dd4bf', // teal-400
          pressed: '#14b8a6', // teal-500
          on:      '#042f2e', // teal 上層的文字
          bg:      'rgba(94, 234, 212, 0.08)',   // 半透明底（reaction mine / quote）
          border:  'rgba(94, 234, 212, 0.19)',   // 半透明 border
        },

        // ── 語意色 ──────────────────────────────
        online:   '#4ade80',
        idle:     '#fbbf24',
        offline:  '#52525b',
        danger: {
          DEFAULT: '#f87171', // 文字用
          bg:      '#ef4444', // 按鈕底色用
        },
        warning:  '#fbbf24',

        // ── Avatar fallback 色盤 ───────────────
        // 用法：依 user id hash 對應其中一個
        'avatar-teal':   '#5eead4',
        'avatar-green':  '#10b981',
        'avatar-purple': '#8b5cf6',
        'avatar-pink':   '#ec4899',
        'avatar-orange': '#f97316',
        'avatar-blue':   '#3b82f6',
        'channel-blue':  '#3b82f6',
      },

      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang TC',
          'Noto Sans TC',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'SF Mono',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },

      fontSize: {
        // 與 tokens.json 對齊（v2.1 LINE-readable）
        'xs-ds':    ['11px',   { lineHeight: '1.4' }],   // section label / keyboard hint
        'sm-ds':    ['12px',   { lineHeight: '1.5' }],   // timestamp / badge / reaction
        'base-ds':  ['14.5px', { lineHeight: '1.5' }],   // input text
        'md-ds':    ['15px',   { lineHeight: '1.55' }],  // ★ 訊息正文 / 名稱 / session name
        'lg-ds':    ['16px',   { lineHeight: '1.4' }],   // chat header
        'xl-ds':    ['17px',   { lineHeight: '1.4' }],   // modal / login title
        '2xl-ds':   ['20px',   { lineHeight: '1.3' }],   // page title
      },

      letterSpacing: {
        'ds-tight':  '-0.015em',
        'ds-normal': '-0.005em',
        'ds-wide':   '0.05em',
        'ds-mono':   '0.08em',
        'ds-caps':   '0.14em',
      },

      borderRadius: {
        // Tailwind 預設已有 sm/md/lg/xl/full；下面覆寫成我們的值
        sm:   '4px',
        md:   '6px',
        lg:   '8px',
        xl:   '10px',
        full: '9999px',
      },

      spacing: {
        // Tailwind 預設 spacing 已夠用，這裡只加專案常用的固定寬高（v2.1）
        'icon-bar':     '60px',
        'session-bar':  '260px',
        'chat-header':  '56px',
        'hit-min':      '36px',
      },

      boxShadow: {
        overlay:         '0 20px 50px rgba(0, 0, 0, 0.5)',
        dropdown:        '0 8px 24px rgba(0, 0, 0, 0.4)',
        'inset-hairline':'inset 0 0 0 1px #27272a',
      },

      transitionDuration: {
        fast: '120ms',
        base: '180ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
