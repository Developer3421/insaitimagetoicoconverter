# insaitimagetoicoconverter

A **JPEG/PNG → ICO converter** built with Next.js, TypeScript and Tailwind CSS — inspired by [insaitjpgtopngconverter](https://github.com/Developer3421/insaitjpgtopngconverter).

## Features

- **Browser-based conversion** — uses the Canvas API to render every ICO size layer; no server uploads, fully private.
- **Multiple size presets** — Standard (16, 32, 48), Full (16, 32, 48, 64, 128, 256), or individual sizes (16 / 32 / 64 / 256), plus a custom pixel dimension option.
- **Batch support** — drop multiple JPEG or PNG files and convert them all at once.
- **IndexedDB history** — converted files are persisted in the browser for later re-download.
- **CLI tool** — `npm run convert -- <input.jpg|png>` produces a full multi-size ICO file locally using [sharp](https://sharp.pixelplumbing.com/).
- **Bilingual UI** — English and German translations included.

## Getting Started

```bash
npm install
npm run dev      # development server at http://localhost:3000
npm run build    # production build
npm run lint     # ESLint check
```

## CLI Usage

```bash
# Single file (ICO saved next to the source)
npm run convert -- photo.jpg

# Explicit output path
npm run convert -- icon.png /output/icon.ico

# Batch (ICO saved next to each source file)
npm run convert -- file1.jpg file2.png file3.jpeg
```

The CLI embeds all six standard sizes (16 × 16, 32 × 32, 48 × 48, 64 × 64, 128 × 128, 256 × 256) as PNG chunks inside the ICO container (Windows Vista+ compatible).
