/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/components/**/*.tsx', './src/components/**/*.mdx'],
    theme: {
        extend: {}
    },
    corePlugins: {
        preflight: false
    },
    plugins: []
};
