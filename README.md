# Patch Notation Tool

Next.js app for building Eurorack and VCV Rack patch diagrams with PATCH & TWEAK patch symbols.

## Current scope

- `91` SVG symbol assets loaded directly from [`public/symbols`](/Users/walmik/Github/pnt/public/symbols)
- A drag-and-drop patch canvas with pan, zoom, reset view, fit-to-content, and grid snapping
- Tool modes for selection, cable patching, and inline text annotations
- Cable drawing with sound, modulation, gate/trigger, clock, and pitch cable colors
- IndexedDB-backed local patch library plus JSON import/export
- SVG and PNG export
- A bundled sample patch

## Commands

```bash
npm install
npm run dev
npm run build
```

## Complexity

This is still a relatively small application from an architecture perspective, but most of the behavior is concentrated in [`components/PatchEditor.jsx`](/Users/walmik/Github/pnt/components/PatchEditor.jsx). That file is the main complexity hotspot and the place contributors should read first before making editor changes.

## Architecture

The app is intentionally simple and mostly client-side:

- [`app/page.jsx`](/Users/walmik/Github/pnt/app/page.jsx) is the route entry and renders the editor
- [`app/layout.jsx`](/Users/walmik/Github/pnt/app/layout.jsx) defines metadata, global CSS, and analytics
- [`components/PatchEditor.jsx`](/Users/walmik/Github/pnt/components/PatchEditor.jsx) contains the editor state machine, canvas interactions, persistence hooks, export logic, and most UI
- [`components/SymbolIcon.jsx`](/Users/walmik/Github/pnt/components/SymbolIcon.jsx) renders symbol assets from `public/symbols`
- [`lib/symbols.js`](/Users/walmik/Github/pnt/lib/symbols.js) is the symbol catalog and filename contract for SVG assets
- [`lib/patchLibrary.js`](/Users/walmik/Github/pnt/lib/patchLibrary.js) wraps IndexedDB for named local patch storage
- [`public/symbols`](/Users/walmik/Github/pnt/public/symbols) contains the official PATCH & TWEAK SVG assets used by the UI and export pipeline

## How The Editor Works

The editor is built around a few core state objects:

- `nodes`: placed symbols on the stage
- `connections`: cables between node ids, each with a signal color/type
- `view`: camera state with `x`, `y`, and `scale`

Each node also stores annotation data:

- `note`: a freeform note attached to the symbol itself
- `portNotes`: optional notes attached to `top`, `right`, `bottom`, and `left` patch points

The stage is a large fixed virtual canvas:

- node positions are stored in world coordinates
- panning and zooming only change the camera transform
- drag/drop, cable creation, marquee selection, export, and note placement all resolve through the same world-coordinate model

Connections are constrained by signal type:

- `sound` runs horizontally from `right -> left`
- `modulation`, `gate`, `clock`, and `pitch` run vertically from `top -> bottom`

Tool modes are explicit:

- `Select` is the normal mode for selecting, marquee, and moving nodes
- cable color tools activate connection creation for that signal type
- `Text` lets contributors add notes directly to symbols or patch points

## Data model

Patch files and stored patches share the same basic structure:

```json
{
  "version": 1,
  "name": "Patch name",
  "nodes": [
    {
      "id": "node-id",
      "symbolId": "low-pass-filter",
      "x": 288,
      "y": 64,
      "note": "optional symbol note",
      "portNotes": {
        "top": "",
        "right": "",
        "bottom": "",
        "left": ""
      }
    }
  ],
  "connections": [
    {
      "id": "connection-id",
      "from": "node-a",
      "to": "node-b",
      "color": "sound"
    }
  ],
  "view": {
    "x": 0,
    "y": 0,
    "scale": 1
  }
}
```

## Persistence and export

- browser autosave uses `localStorage`
- named patches are stored in IndexedDB through [`lib/patchLibrary.js`](/Users/walmik/Github/pnt/lib/patchLibrary.js)
- JSON import/export is kept for portability and backup
- SVG export builds a standalone document from the current patch state
- PNG export rasterizes that SVG in-browser

## Important files

- [`components/PatchEditor.jsx`](/Users/walmik/Github/pnt/components/PatchEditor.jsx)
- [`components/SymbolIcon.jsx`](/Users/walmik/Github/pnt/components/SymbolIcon.jsx)
- [`lib/symbols.js`](/Users/walmik/Github/pnt/lib/symbols.js)
- [`lib/patchLibrary.js`](/Users/walmik/Github/pnt/lib/patchLibrary.js)
- [`app/layout.jsx`](/Users/walmik/Github/pnt/app/layout.jsx)
- [`app/globals.css`](/Users/walmik/Github/pnt/app/globals.css)
- [`public/symbols`](/Users/walmik/Github/pnt/public/symbols)
- [`.github/workflows/deploy-pages.yml`](/Users/walmik/Github/pnt/.github/workflows/deploy-pages.yml)

## Contribution notes

- if you add or rename a symbol, update [`lib/symbols.js`](/Users/walmik/Github/pnt/lib/symbols.js) and keep the filename in [`public/symbols`](/Users/walmik/Github/pnt/public/symbols) aligned with the symbol id
- most editor behavior currently lives in one file, [`components/PatchEditor.jsx`](/Users/walmik/Github/pnt/components/PatchEditor.jsx), so changes there should be tested across drag, selection, patching, text mode, save/load, and export
- the project currently favors straightforward state and local helper functions over deeper abstraction; if the editor keeps growing, a sensible next refactor would be to split canvas math, export logic, and persistence concerns into separate modules
- because this is a static-exported Next.js app, anything that relies on browser APIs must stay in client components or client-only helpers

## Reference

- the app expects PATCH & TWEAK SVG files to live in [`public/symbols`](/Users/walmik/Github/pnt/public/symbols) using the symbol ids from [`lib/symbols.js`](/Users/walmik/Github/pnt/lib/symbols.js) as filenames
- deployment is handled through GitHub Pages via [`.github/workflows/deploy-pages.yml`](/Users/walmik/Github/pnt/.github/workflows/deploy-pages.yml)

## Credits

Symbols used from the free-to-use PATCH & TWEAK patch symbols.

- Symbol overview: https://www.patchandtweak.com/patch-symbols-explained/
- Symbols and licensing/download info: https://www.patchandtweak.com/symbols/
