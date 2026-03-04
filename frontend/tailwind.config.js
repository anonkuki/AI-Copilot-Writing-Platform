/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 作家助手风格 - 专业清爽配色
        brand: {
          DEFAULT: '#4F7CFF',    // 主品牌蓝
          light: '#6B93FF',
          dark: '#3A63E0',
          50: '#EEF2FF',
          100: '#DBE4FF',
          500: '#4F7CFF',
          600: '#3A63E0',
          700: '#2B4FBF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F7F8FA',  // 浅灰背景
          tertiary: '#F0F1F5',   // 侧边栏
          hover: '#EDF0F5',
          active: '#E3E8F0',
        },
        text: {
          primary: '#1A1A2E',
          secondary: '#5A5A72',
          muted: '#9A9AB0',
          inverse: '#FFFFFF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F0F1F5',
          dark: '#D1D5DB',
        },
        status: {
          draft: '#9CA3AF',
          serial: '#10B981',
          finished: '#6366F1',
          scheduled: '#F59E0B',
        },
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        // AI 辅助色
        ai: {
          primary: '#7C3AED',
          light: '#EDE9FE',
          blue: '#3B82F6',
          green: '#10B981',
          orange: '#F97316',
        },
      },
      fontFamily: {
        sans: ['"Microsoft YaHei"', '"PingFang SC"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        serif: ['"Source Han Serif SC"', '"Noto Serif SC"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        'editor': ['16px', { lineHeight: '1.8' }],
      },
      maxWidth: {
        'editor': '900px',
        'content': '1200px',
      },
      spacing: {
        'sidebar': '220px',
        'panel': '320px',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'panel': '2px 0 8px rgba(0, 0, 0, 0.04)',
        'dropdown': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'modal': '0 8px 32px rgba(0, 0, 0, 0.16)',
      },
      borderRadius: {
        'card': '8px',
      },
    },
  },
  plugins: [],
}
