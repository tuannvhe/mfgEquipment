/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // New modern green palette
        primary:      '#4C9C2E',  // Vibrant green - primary buttons, active states, success
        primaryDark:  '#3a7a22',  // Darker green for hover states
        forest:       '#2d5f1b',  // Dark forest green - sidebar, headings, important text
        forestLight:  '#3d7a25',  // Lighter forest for hover states
        
        // Neutral palette
        paper:        '#D1D5DB',  // Light gray - main background
        surface:      '#FFFFFF',  // White - content cards
        border:       '#E5E7EB',  // Subtle borders
        muted:        '#6B7280',  // Muted text
        ink:          '#1F2937',  // Dark text
        
        // Accent colors (keep for warnings, errors)
        warning:      '#F59E0B',
        error:        '#EF4444',
        info:         '#3B82F6',
      },
      borderRadius: {
        'card': '8px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}
