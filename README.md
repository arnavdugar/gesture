# Gesture

A mirrored webcam experience with real-time MediaPipe hand tracking. Built with TypeScript, Preact, and Vanilla Extract, and deployed automatically to GitHub Pages.

## Development

```sh
pnpm install
pnpm dev
```

The browser renders the webcam directly while a transparent SVG displays the detected hand landmarks.

## MIDI output

Choose **Enable** in the MIDI control, grant the browser permission, and select
a connected MIDI destination. Notes are sent on channel 1, the left-hand filter
control sends CC 74, and the right-hand volume control sends CC 11.

Choose the **None** waveform to mute the built-in synthesizer while continuing
to send MIDI. Web MIDI requires a compatible browser and a secure context; the
local development server and the HTTPS deployment both qualify.

## Quality checks

```sh
pnpm check
pnpm build
```

Pushes to `main` are checked, built, and deployed to GitHub Pages by the deployment workflow. In the GitHub repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.
