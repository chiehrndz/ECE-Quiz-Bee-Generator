# ECE Quiz Bee Question Generator

*Test Your Knowledge. Master Electronics Engineering.*

React + Vite app with a Vercel serverless function (`api/generate.js`) that calls Gemini.
Requires the `GEMINI_API_KEY` environment variable on Vercel.

## Scripts
- `npm run dev` – start Vite (use `vercel dev` to also run `/api/generate`)
- `npm run build` – production build
- `npm run lint` – oxlint

## Structure
- `src/App.jsx` – app shell, navigation, exam session logic
- `src/data.js` – question generation (unchanged), storage keys, helpers
- `src/pages.jsx` – dashboard, setup, topics, performance, mistakes, formulas, settings
- `src/exam.jsx` – exam screen, solution panel, results, retry modal
- `src/ui.jsx`, `src/icons.jsx` – shared components and inline Lucide-style icons
- `src/mathParse.js` – plain-text math formatter and solution parser
- `src/formulas.js` – formula reference data
- `src/styles.css` – design tokens, light/dark themes, responsive styles

No new npm dependencies were added.
