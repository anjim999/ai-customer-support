/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f1ff',
                    100: '#e4e6ff',
                    200: '#cdd0ff',
                    300: '#a5aaff',
                    400: '#7a7fff',
                    500: '#5b5cf7',
                    600: '#4f47eb',
                    700: '#4338ca',
                    800: '#382fa3',
                    900: '#312b81',
                    950: '#1e1a4f',
                },
                dark: {
                    50: '#f6f6f7',
                    100: '#e2e3e5',
                    200: '#c5c6cb',
                    300: '#a0a2aa',
                    400: '#7b7e88',
                    500: '#60636d',
                    600: '#4c4e57',
                    700: '#3f4147',
                    800: '#35363b',
                    900: '#1a1b1f',
                    950: '#0f1012',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'gradient': 'gradient 8s linear infinite',
                'float': 'float 6s ease-in-out infinite',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'typing': 'typing 1.5s ease-in-out infinite',
            },
            keyframes: {
                gradient: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                typing: {
                    '0%, 100%': { opacity: '0.2' },
                    '50%': { opacity: '1' },
                }
            },
            backgroundSize: {
                '400%': '400% 400%',
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
