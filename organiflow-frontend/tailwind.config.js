/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts,scss}"
    ],
    theme: {
        extend: {
            // Fuentes del proyecto
            fontFamily: {
                sans: ['DM Sans', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },

            // Paleta de colores usando las variables CSS
            colors: {
                surface: {
                    0: 'var(--surface-0)',
                    1: 'var(--surface-1)',
                    2: 'var(--surface-2)',
                    3: 'var(--surface-3)',
                    4: 'var(--surface-4)',
                },
                primary: {
                    400: 'var(--primary-400)',
                    500: 'var(--primary-500)',
                    600: 'var(--primary-600)',
                    700: 'var(--primary-700)',
                },
                border: {
                    subtle: 'var(--border-subtle)',
                    default: 'var(--border-default)',
                    strong: 'var(--border-strong)',
                    active: 'var(--border-active)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                    accent: 'var(--text-accent)',
                },
                // Tipos de relación
                rel: {
                    sequential: 'var(--rel-sequential)',
                    conditional: 'var(--rel-conditional)',
                    iterative: 'var(--rel-iterative)',
                    union: 'var(--rel-union)',
                },
                // Estados de ejecución
                status: {
                    pending: 'var(--status-pending)',
                    running: 'var(--status-running)',
                    completed: 'var(--status-completed)',
                    rejected: 'var(--status-rejected)',
                    waiting: 'var(--status-waiting)',
                },
            },

            // Dimensiones del layout
            width: {
                sidebar: 'var(--sidebar-width)',
                'panel-right': 'var(--panel-right-width)',
            },
            height: {
                topbar: 'var(--topbar-height)',
            },

            // Border radius personalizado
            borderRadius: {
                node: 'var(--node-radius)',
            },

            // Box shadows con glow
            boxShadow: {
                node: 'var(--node-shadow)',
                glow: 'var(--shadow-glow-primary)',
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
            },

            // Transiciones
            transitionDuration: {
                fast: '150ms',
                base: '250ms',
                slow: '400ms',
            },
        },
    },
    plugins: [],
}