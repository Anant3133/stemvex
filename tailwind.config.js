/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{html,ts,tsx,js,jsx}"],
    theme: {
        extend: {}
    },
    // Avoid Tailwind's preflight overriding Spectrum/host styles.
    corePlugins: {
        preflight: false
    },
    plugins: []
};
