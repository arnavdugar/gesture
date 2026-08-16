# Gesture

A mirrored webcam experience with real-time MediaPipe hand tracking. Built with TypeScript, Preact, and Vanilla Extract, and deployed automatically to GitHub Pages.

## Development

```sh
pnpm install
pnpm dev
```

The browser renders the webcam directly while a transparent SVG displays the detected hand landmarks.

## Quality checks

```sh
pnpm check
pnpm build
```

Pushes to `main` are checked, built, and deployed to GitHub Pages by the deployment workflow. In the GitHub repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.
