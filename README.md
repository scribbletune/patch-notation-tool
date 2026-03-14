# Patch Notation Tool

Next.js app for building Eurorack and VCV Rack patch diagrams with PATCH & TWEAK patch symbols.

## What is included

- `91` SVG symbol assets loaded directly from [`public/symbols`](/Users/walmik/Github/pnt/public/symbols)
- A drag-and-drop patch canvas with pan, zoom, fit-to-content, and grid snapping
- Cable drawing with sound, modulation, gate/trigger, clock, and pitch cable colors
- IndexedDB-backed local patch library plus JSON import/export
- A sample patch seeded from the visual example you shared

## Commands

```bash
npm install
npm run dev
```

## Important files

- [`components/PatchEditor.jsx`](/Users/walmik/Github/pnt/components/PatchEditor.jsx)
- [`components/SymbolIcon.jsx`](/Users/walmik/Github/pnt/components/SymbolIcon.jsx)
- [`lib/symbols.js`](/Users/walmik/Github/pnt/lib/symbols.js)
- [`public/symbols`](/Users/walmik/Github/pnt/public/symbols)

## Reference

The app expects PATCH & TWEAK SVG files to live in [`public/symbols`](/Users/walmik/Github/pnt/public/symbols) using the symbol ids from [`lib/symbols.js`](/Users/walmik/Github/pnt/lib/symbols.js) as filenames.

## Credits

Symbols used from the free-to-use PATCH & TWEAK patch symbols.

- Symbol overview: https://www.patchandtweak.com/patch-symbols-explained/
- Symbols and licensing/download info: https://www.patchandtweak.com/symbols/
