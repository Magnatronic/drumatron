# Drumatron: Drum Visualization & Audio Detection Web App

Drumatron is a responsive React + Vite + TypeScript web app for drum visualization and audio detection. It visualizes instrument triggers (drum1–drum5) detected from a microphone, with beautiful, theme-based animations. The app features robust, instrument-agnostic detection and calibration, per-instrument settings, and supports multiple visual themes (classic, space, etc.). Material UI and Material Icons are used for a modern, accessible interface. The project is designed for performance, accessibility, and cross-device compatibility.

## Features

- Detects up to 5 instruments (drum1–drum5) via microphone with instrument-agnostic logic
- Unique, beautiful animations for each instrument, with theme support (classic, space, etc.)
- Per-instrument calibration and trigger counts
- Responsive design for desktop, tablet, and mobile
- Settings panel for detection, appearance, and theme selection
- Robust error handling and accessibility improvements
- Material UI and Material Icons for a modern UI
- All settings saved in your browser

## Getting Started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Start the development server:

   ```sh
   npm run dev
   ```

3. Open the app in your browser at the provided local URL.

## Deployment

Drumatron is automatically deployed to GitHub Pages via GitHub Actions on every push to the `master` branch. The deployment workflow is defined in `.github/workflows/deploy.yml` and uses the `gh-pages` branch for static site hosting.

## Scripts

- `npm run dev` – Start development server
- `npm run build` – Build for production
- `npm run preview` – Preview production build

## Project Structure

- `src/` – Main source code (components, animation themes, instrument config, etc.)
- `public/` – Static assets
- `.github/workflows/` – GitHub Actions workflows (deployment)

## License

MIT
