// Tailwind v4 (via @tailwindcss/vite) already prefixes its own utilities (e.g. backdrop-filter,
// background-clip: text) internally. This covers raw/arbitrary CSS and third-party stylesheets
// (index.css, ldrs' imported CSS) that don't go through Tailwind's own transform, for the older
// end of the `browserslist` range in package.json.
export default {
  plugins: {
    autoprefixer: {},
  },
};
