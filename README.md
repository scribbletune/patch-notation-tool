# Patch Notation Tool

Next.js app for building Eurorack and VCV Rack patch diagrams with PATCH & TWEAK patch symbols.

## What is included

- `91` individual SVG symbol exports in [`public/symbols`](/Users/walmik/Github/pnt/public/symbols)
- A drag-and-drop patch canvas with pan, zoom, fit-to-content, and grid snapping
- Cable drawing with sound, modulation, gate/trigger, clock, and pitch cable colors
- IndexedDB-backed local patch library plus JSON import/export
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

## Credits

Symbols used from the free-to-use PATCH & TWEAK patch symbols.

- Symbol overview: https://www.patchandtweak.com/patch-symbols-explained/
- Symbols and licensing/download info: https://www.patchandtweak.com/symbols/
