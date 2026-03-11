# Patch Notation Tool

Next.js app for building Eurorack and VCV Rack patch diagrams with Patch & Tweak inspired notation symbols.

## What is included

- `91` individual SVG symbol exports in [`public/symbols`](/Users/walmik/Github/pnt/public/symbols)
- A drag-and-drop patch canvas with movable nodes
- Cable drawing mode with audio, CV, modulation, and neutral cable colors
- JSON import/export for patch persistence
- A sample patch seeded from the visual example you shared

## Commands

```bash
npm install
npm run generate:symbols
npm run dev
```

## Important files

- [`components/PatchEditor.jsx`](/Users/walmik/Github/pnt/components/PatchEditor.jsx)
- [`lib/symbols.js`](/Users/walmik/Github/pnt/lib/symbols.js)
- [`lib/symbolPrimitives.js`](/Users/walmik/Github/pnt/lib/symbolPrimitives.js)
- [`scripts/generate-symbol-svgs.mjs`](/Users/walmik/Github/pnt/scripts/generate-symbol-svgs.mjs)

## Reference

Symbol categories and naming were based on the Patch & Tweak symbol reference page and the source sheets from your Desktop images.
