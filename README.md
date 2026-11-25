# Dinesh Keyboard — Scrollytelling Landing Page

An editorial hardware scrollytelling showcase built with **Next.js 14 (App Router)**, **Tailwind CSS**, **Framer Motion**, and an **HTML5 Canvas** 120-frame WebP image sequence.

**Live Demo:** [https://b-dinesh9.github.io/Keyboard/](https://b-dinesh9.github.io/Keyboard/)  
**Repository:** [https://github.com/B-DINESH9/Keyboard](https://github.com/B-DINESH9/Keyboard)

---

## Overview

As the user scrolls through a `400vh` sticky viewport container, a preloaded 120-frame WebP sequence (`frame_0_delay-0.04s.webp` → `frame_119_delay-0.04s.webp`) smoothly animates the Dinesh mechanical keyboard through assembly, subtle expansion, full exploded layer separation, and magnetic reassembly on a seamless `#BBBEC1` studio fog canvas.

### Key Features

- **Scroll-Linked Canvas Rendering (`components/KeyboardScroll.tsx`)**:
  - Uses Framer Motion `useScroll`, `useSpring`, and `useMotionValueEvent` to map scroll progress (`0 → 1`) to frames (`0 → 119`).
  - Renders via `requestAnimationFrame` with redundant-draw skipping, HiDPI (`devicePixelRatio`) sharpness, responsive `ResizeObserver` handling, and `contain` fit across desktop and mobile viewports.
- **Full Sequence Preloading**:
  - Preloads and decodes all 120 `.webp` frames with a centered loading indicator (`"Loading Dinesh sequence..."`) before interactive playback begins.
- **Seamless Fog Blending (`#BBBEC1`)**:
  - Frame borders and the page background share the same `#BBBEC1` fog tone so canvas edges remain invisible across screen aspect ratios.
- **Timed Editorial Story Beats**:
  - **0% Scroll (Centered):** *Dinesh Keyboard.* — *Engineered clarity.*
  - **25% Scroll (Left-aligned):** *Built for Precision.* — *Every detail, measured.*
  - **60% Scroll (Right-aligned):** *Layered Engineering.* — *See what’s inside.*
  - **90% Scroll (Centered CTA):** *Assembled. Ready.* — *Scroll back to replay.*

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **Rendering:** HTML5 `<canvas>` 2D

---

## Project Structure

```text
├── .github/workflows/deploy.yml   # GitHub Actions workflow for GitHub Pages
├── app/
│   ├── globals.css                # Base styles & #BBBEC1 fog theme
│   ├── layout.tsx                 # Root layout & page metadata
│   └── page.tsx                   # Main entry page
├── components/
│   └── KeyboardScroll.tsx         # Sticky 400vh canvas & scroll story beats
├── public/
│   ├── .nojekyll                  # Ensures _next/ assets serve on GitHub Pages
│   └── frames/                    # 120 WebP frames (frame_0..119_delay-0.04s.webp)
├── next.config.mjs                # Conditional static export & basePath config
├── package.json
└── tailwind.config.ts
```

---

## Getting Started

### Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

### Static Export for GitHub Pages (`/Keyboard` subpath)

```bash
NEXT_PUBLIC_STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/Keyboard npm run build
```

Pushing to `main` automatically builds and deploys the static `out/` directory to GitHub Pages via `.github/workflows/deploy.yml`.
