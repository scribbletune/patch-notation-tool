"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SymbolIcon from "@/components/SymbolIcon";
import {
  deleteStoredPatch,
  getStoredPatch,
  listStoredPatches,
  saveStoredPatch,
} from "@/lib/patchLibrary";
import {
  deleteCustomModule,
  listCustomModules,
  renameCustomModule,
  saveCustomModule,
} from "@/lib/customModuleLibrary";
import {
  getSymbolAssetPath,
  symbolCategories,
  symbolMap,
  symbols,
} from "@/lib/symbols";

const STORAGE_KEY = "patch-notation-tool-state-v1";
const THEME_PREFERENCE_KEY = "patch-notation-tool-theme";
const NODE_WIDTH = 122;
const NODE_HEIGHT = 104;
const PALETTE_DRAG_HOTSPOT_X = 78;
const PALETTE_DRAG_HOTSPOT_Y = 24;
const STAGE_WIDTH = 3200;
const STAGE_HEIGHT = 2200;
const GRID_SIZE = 32;
const MIN_SCALE = 0.45;
const MAX_SCALE = 2.4;
const DEFAULT_VIEW = { x: 0, y: 0, scale: 1 };
const SYMBOL_EXPORT_SIZE = 62;
const SYMBOL_EXPORT_OFFSET_X = 30;
const SYMBOL_EXPORT_OFFSET_Y = 8;
const HORIZONTAL_ANCHOR_Y = NODE_HEIGHT / 2;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const PORT_KEYS = ["top", "right", "bottom", "left"];

const cableColors = {
  sound: "#f6ba00",
  modulation: "#0b88d8",
  gate: "#d8171f",
  pitch: "#7d94a5",
  clock: "#2f9e44",
};

const cableOptions = [
  { id: "sound", label: "sound" },
  { id: "modulation", label: "modulation" },
  { id: "gate", label: "gate / trigger" },
  { id: "clock", label: "clock" },
  { id: "pitch", label: "pitch" },
];
const SELECT_TOOL_ID = "select";
const TEXT_TOOL_ID = "text";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

const toolDescriptions = {
  [SELECT_TOOL_ID]:
    "Select, move, and area-select symbols. Use this as the default editing mode.",
  [TEXT_TOOL_ID]:
    "Click a symbol to add a note, or click any input/output patch point to annotate that port.",
  sound: "Audio cable. Click any patch point on one symbol, then any patch point on another to connect them.",
  modulation: "Modulation cable. Click any patch point on one symbol, then any patch point on another to connect them.",
  gate: "Gate / trigger cable. Use for triggers and gates. Click any patch point on one symbol, then any patch point on another to connect them.",
  clock: "Clock cable. Use for clock and timing signals. Click any patch point on one symbol, then any patch point on another to connect them.",
  pitch: "Pitch cable. Use for pitch CV. Click any patch point on one symbol, then any patch point on another to connect them.",
};

const sampleState = {
  nodes: [
    {
      id: "sawtooth-wave-oscillator-1773458817257-xkyvcn",
      symbolId: "sawtooth-wave-oscillator",
      x: 96,
      y: 64,
      note: "",
      portNotes: {},
    },
    {
      id: "low-pass-filter-1773458836296-c82zwe",
      symbolId: "low-pass-filter",
      x: 288,
      y: 64,
      note: "",
      portNotes: {},
    },
    {
      id: "eg-adsr-1773458851950-b3zck9",
      symbolId: "eg-adsr",
      x: 288,
      y: 224,
      note: "",
      portNotes: {
        top: "same ADSR to filter and vca",
      },
    },
    {
      id: "amplifier-vca-1773458857274-fq37nq",
      symbolId: "amplifier-vca",
      x: 480,
      y: 64,
      note: "",
      portNotes: {},
    },
    {
      id: "cv-gate-sequencer-1773458868277-8mhf34",
      symbolId: "cv-gate-sequencer",
      x: 96,
      y: 416,
      note: "keyboard or a sequencer",
      portNotes: {},
    },
  ],
  connections: [
    {
      id: "c-1773458884193-e7s0ph",
      from: "sawtooth-wave-oscillator-1773458817257-xkyvcn",
      fromAnchor: "right",
      to: "low-pass-filter-1773458836296-c82zwe",
      toAnchor: "left",
      color: "sound",
    },
    {
      id: "c-1773458886383-ohwo9g",
      from: "low-pass-filter-1773458836296-c82zwe",
      fromAnchor: "right",
      to: "amplifier-vca-1773458857274-fq37nq",
      toAnchor: "left",
      color: "sound",
    },
    {
      id: "c-1773458891873-m806jc",
      from: "eg-adsr-1773458851950-b3zck9",
      fromAnchor: "top",
      to: "amplifier-vca-1773458857274-fq37nq",
      toAnchor: "bottom",
      color: "modulation",
    },
    {
      id: "c-1773458894365-5b0p0f",
      from: "eg-adsr-1773458851950-b3zck9",
      fromAnchor: "top",
      to: "low-pass-filter-1773458836296-c82zwe",
      toAnchor: "bottom",
      color: "modulation",
    },
    {
      id: "c-1773458911112-haag4r",
      from: "cv-gate-sequencer-1773458868277-8mhf34",
      fromAnchor: "top",
      to: "eg-adsr-1773458851950-b3zck9",
      toAnchor: "bottom",
      color: "gate",
    },
    {
      id: "c-1773458922805-5mme1x",
      from: "cv-gate-sequencer-1773458868277-8mhf34",
      fromAnchor: "top",
      to: "sawtooth-wave-oscillator-1773458817257-xkyvcn",
      toAnchor: "bottom",
      color: "pitch",
    },
  ],
  view: {
    x: 37.8203125,
    y: 10.9921875,
    scale: 1,
  },
};

const cableColorAliases = {
  audio: "sound",
  cv: "modulation",
  mod: "gate",
  neutral: "pitch",
};

function getConnectionPath(source, target) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  // Gravity droop: control points sit 35% along the straight line,
  // then pushed downward to simulate a physical cable hanging under its weight.
  const droop = Math.max(30, dist * 0.2);
  return `M ${source.x} ${source.y} C ${source.x + dx * 0.35} ${source.y + dy * 0.35 + droop}, ${target.x - dx * 0.35} ${target.y - dy * 0.35 + droop}, ${target.x} ${target.y}`;
}


function createNode(symbolId, x, y) {
  return {
    id: `${symbolId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    symbolId,
    x: Math.round(x),
    y: Math.round(y),
    note: "",
    portNotes: {},
  };
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function ToolbarIcon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
      focusable="false"
      className="toolbar-icon"
    >
      {children}
    </svg>
  );
}

const symbolDataUriCache = new Map();

function normalizeNode(node) {
  return {
    ...node,
    note: typeof node.note === "string" ? node.note : "",
    portNotes:
      node.portNotes && typeof node.portNotes === "object"
        ? Object.fromEntries(
            PORT_KEYS.map((key) => [
              key,
              typeof node.portNotes[key] === "string"
                ? node.portNotes[key]
                : "",
            ]),
          )
        : {},
  };
}

async function getSymbolDataUri(symbolId) {
  if (symbolDataUriCache.has(symbolId)) {
    return symbolDataUriCache.get(symbolId);
  }

  const assetPath = getSymbolAssetPath(symbolId, basePath);
  const response = await fetch(assetPath);
  if (!response.ok) {
    throw new Error(`Could not load symbol asset: ${symbolId}`);
  }

  const markup = await response.text();
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  symbolDataUriCache.set(symbolId, dataUri);
  return dataUri;
}

export default function PatchEditor() {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const panRef = useRef(null);
  const paletteDragRef = useRef(null);
  const cableDragRef = useRef(null);
  const rerouteRef = useRef(null);
  const fileInputRef = useRef(null);
  const viewRef = useRef(DEFAULT_VIEW);
  const nodesRef = useRef(sampleState.nodes);
  const customModulesRef = useRef([]);
  const suppressNodeClickRef = useRef(false);

  const [nodes, setNodes] = useState(sampleState.nodes);
  const [connections, setConnections] = useState(sampleState.connections);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cableColor, setCableColor] = useState("modulation");
  const [activeTool, setActiveTool] = useState(SELECT_TOOL_ID);
  const [paletteDrag, setPaletteDrag] = useState(null);
  const [cablePreview, setCablePreview] = useState(null);
  const [view, setView] = useState(sampleState.view || DEFAULT_VIEW);
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [storedPatches, setStoredPatches] = useState([]);
  const [customModules, setCustomModules] = useState([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [currentPatchId, setCurrentPatchId] = useState(null);
  const [currentPatchName, setCurrentPatchName] = useState("Untitled patch");
  const [libraryMessage, setLibraryMessage] = useState("");
  const [themePreference, setThemePreference] = useState(THEME_LIGHT);
  const activeToolDescription =
    activeTool === "cable"
      ? toolDescriptions[cableColor]
      : toolDescriptions[activeTool];

  function clearPaletteDrag() {
    paletteDragRef.current = null;
    setPaletteDrag(null);
  }

  function clampScale(scale) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  }

  function clampNodePosition(x, y) {
    return {
      x: Math.min(Math.max(12, x), STAGE_WIDTH - NODE_WIDTH - 12),
      y: Math.min(Math.max(12, y), STAGE_HEIGHT - NODE_HEIGHT - 12),
    };
  }

  function snapValue(value) {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  function snapNodePosition(x, y) {
    const snapped = clampNodePosition(snapValue(x), snapValue(y));
    return snapped;
  }

  function toWorldPoint(clientX, clientY, currentView = viewRef.current) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: (clientX - rect.left - currentView.x) / currentView.scale,
      y: (clientY - rect.top - currentView.y) / currentView.scale,
    };
  }

  function normalizeConnectionColor(color) {
    return cableColorAliases[color] || color || "modulation";
  }

  function zoomAtClientPoint(nextScale, clientX, clientY) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const current = viewRef.current;
    const clampedScale = clampScale(nextScale);
    const point = toWorldPoint(clientX, clientY, current);

    setView({
      x: clientX - rect.left - point.x * clampedScale,
      y: clientY - rect.top - point.y * clampedScale,
      scale: clampedScale,
    });
  }

  function handleZoomStep(direction) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const factor = direction > 0 ? 1.15 : 1 / 1.15;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    zoomAtClientPoint(viewRef.current.scale * factor, centerX, centerY);
  }

  function handleResetView() {
    setView(DEFAULT_VIEW);
  }

  function handleFitToContent() {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    if (nodesRef.current.length === 0) {
      setView(DEFAULT_VIEW);
      return;
    }

    const padding = 120;
    const left = Math.min(...nodesRef.current.map((node) => node.x));
    const top = Math.min(...nodesRef.current.map((node) => node.y));
    const right = Math.max(
      ...nodesRef.current.map((node) => node.x + NODE_WIDTH),
    );
    const bottom = Math.max(
      ...nodesRef.current.map((node) => node.y + NODE_HEIGHT),
    );
    const boundsWidth = right - left;
    const boundsHeight = bottom - top;
    const scaleX = (rect.width - padding * 2) / Math.max(boundsWidth, 1);
    const scaleY = (rect.height - padding * 2) / Math.max(boundsHeight, 1);
    const scale = clampScale(Math.min(scaleX, scaleY, 1.4));

    setView({
      x: rect.width / 2 - ((left + right) / 2) * scale,
      y: rect.height / 2 - ((top + bottom) / 2) * scale,
      scale,
    });
  }

  function getExportBounds() {
    if (nodesRef.current.length === 0) {
      return {
        left: 0,
        top: 0,
        width: 1200,
        height: 800,
      };
    }

    const padding = 220;
    const left = Math.min(...nodesRef.current.map((node) => node.x)) - padding;
    const top = Math.min(...nodesRef.current.map((node) => node.y)) - padding;
    const right =
      Math.max(...nodesRef.current.map((node) => node.x + NODE_WIDTH)) +
      padding;
    const bottom =
      Math.max(...nodesRef.current.map((node) => node.y + NODE_HEIGHT)) +
      padding;

    return {
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: Math.min(STAGE_WIDTH, right) - Math.max(0, left),
      height: Math.min(STAGE_HEIGHT, bottom) - Math.max(0, top),
    };
  }

  async function buildPatchSvgMarkup({
    includeBackground = true,
    includeGrid = true,
  } = {}) {
    const bounds = getExportBounds();
    const symbolEntries = await Promise.all(
      [...new Set(nodes.map((node) => node.symbolId))].map(async (symbolId) => [
        symbolId,
        await getSymbolDataUri(symbolId),
      ]),
    );
    const symbolDataUris = Object.fromEntries(symbolEntries);
    const connectionMarkup = connections
      .map((connection) => {
        const source = nodePositions[connection.from]?.[connection.fromAnchor];
        const target = nodePositions[connection.to]?.[connection.toAnchor];
        if (!source || !target) {
          return "";
        }

        const color = cableColors[connection.color] || cableColors.modulation;
        return `<path d="${getConnectionPath(source, target)}" stroke="${color}" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.95" /><circle cx="${source.x}" cy="${source.y}" r="5" fill="${color}" opacity="0.9" /><circle cx="${target.x}" cy="${target.y}" r="5" fill="${color}" opacity="0.9" />`;
      })
      .join("");

    const nodeMarkup = nodes
      .map((node) => {
        const symbol = symbolMap[node.symbolId];
        if (!symbol) {
          return "";
        }

        const iconX = node.x + SYMBOL_EXPORT_OFFSET_X;
        const iconY = node.y + SYMBOL_EXPORT_OFFSET_Y;
        const labelY = node.y + 92;
        const assetUri = symbolDataUris[node.symbolId];
        if (!assetUri) {
          return "";
        }
        const noteMarkup = node.note
          ? `
            <g>
              <rect x="${node.x + NODE_WIDTH + 10}" y="${node.y + 8}" width="164" height="24" rx="10" fill="#fffdf8" fill-opacity="0.94" stroke="#231d1f" stroke-opacity="0.16" />
              <text x="${node.x + NODE_WIDTH + 20}" y="${node.y + 24}" font-size="11" font-family="Avenir Next, Gill Sans, Trebuchet MS, sans-serif" fill="#231d1f">
                ${escapeXml(node.note)}
              </text>
            </g>
          `
          : "";
        const portNoteMarkup = PORT_KEYS.map((portKey) => {
          const note = node.portNotes?.[portKey];
          if (!note) {
            return "";
          }
          const anchor = nodePositions[node.id]?.[portKey];
          if (!anchor) {
            return "";
          }

          const textPositionByPort = {
            top: { x: anchor.x + 10, y: anchor.y - 12 },
            right: { x: anchor.x + 14, y: anchor.y + 4 },
            bottom: { x: anchor.x + 10, y: anchor.y + 26 },
            left: { x: anchor.x - 88, y: anchor.y + 4 },
          };
          const textPosition = textPositionByPort[portKey];

          return `
            <text x="${textPosition.x}" y="${textPosition.y}" font-size="10" font-family="Avenir Next, Gill Sans, Trebuchet MS, sans-serif" fill="#231d1f" fill-opacity="0.88">
              ${escapeXml(note)}
            </text>
          `;
        }).join("");

        return `
          <g>
            <rect x="${node.x}" y="${node.y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="18" fill="#f8f4ec" fill-opacity="0.95" stroke="#231d1f" stroke-opacity="0.16" />
            <circle cx="${node.x}" cy="${node.y + HORIZONTAL_ANCHOR_Y}" r="7" fill="#faf7f0" stroke="#231d1f" stroke-width="2" />
            <circle cx="${node.x + NODE_WIDTH}" cy="${node.y + HORIZONTAL_ANCHOR_Y}" r="7" fill="#231d1f" stroke="#faf7f0" stroke-width="2" />
            <circle cx="${node.x + NODE_WIDTH / 2}" cy="${node.y}" r="7" fill="#231d1f" stroke="#faf7f0" stroke-width="2" />
            <circle cx="${node.x + NODE_WIDTH / 2}" cy="${node.y + NODE_HEIGHT}" r="7" fill="#faf7f0" stroke="#231d1f" stroke-width="2" />
            <image x="${iconX}" y="${iconY}" width="${SYMBOL_EXPORT_SIZE}" height="${SYMBOL_EXPORT_SIZE}" href="${assetUri}" preserveAspectRatio="xMidYMid meet" />
            <text x="${node.x + NODE_WIDTH / 2}" y="${labelY}" text-anchor="middle" font-size="11" font-family="Avenir Next, Gill Sans, Trebuchet MS, sans-serif" fill="#231d1f">
              ${escapeXml(node.symbolId === "custom-module" ? node.note || symbol.label : symbol.label)}
            </text>
            ${node.symbolId === "custom-module" ? "" : noteMarkup}
            ${portNoteMarkup}
          </g>
        `;
      })
      .join("");

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.left} ${bounds.top} ${bounds.width} ${bounds.height}">
        ${includeBackground ? `<rect x="${bounds.left}" y="${bounds.top}" width="${bounds.width}" height="${bounds.height}" fill="#eef1e8" />` : ""}
        ${
          includeGrid
            ? `<g opacity="0.55">
          ${Array.from(
            { length: Math.ceil(bounds.height / GRID_SIZE) + 1 },
            (_, index) => {
              const y = bounds.top + index * GRID_SIZE;
              return `<line x1="${bounds.left}" y1="${y}" x2="${bounds.left + bounds.width}" y2="${y}" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1" />`;
            },
          ).join("")}
          ${Array.from(
            { length: Math.ceil(bounds.width / GRID_SIZE) + 1 },
            (_, index) => {
              const x = bounds.left + index * GRID_SIZE;
              return `<line x1="${x}" y1="${bounds.top}" x2="${x}" y2="${bounds.top + bounds.height}" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1" />`;
            },
          ).join("")}
        </g>`
            : ""
        }
        ${connectionMarkup}
        ${nodeMarkup}
      </svg>
    `.trim();
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleExportSvg() {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const svg = await buildPatchSvgMarkup();
      downloadBlob(
        new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
        `patch-${stamp}.svg`,
      );
    } catch {
      window.alert("Could not export SVG.");
    }
  }

  async function handleExportPng() {
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const svg = await buildPatchSvgMarkup({
        includeBackground: false,
        includeGrid: false,
      });
      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(url);
          window.alert("Could not create PNG export.");
          return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);
        canvas.toBlob((pngBlob) => {
          URL.revokeObjectURL(url);
          if (!pngBlob) {
            window.alert("Could not create PNG export.");
            return;
          }

          downloadBlob(pngBlob, `patch-${stamp}.png`);
        }, "image/png");
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        window.alert("Could not render PNG export.");
      };

      image.src = url;
    } catch {
      window.alert("Could not export PNG.");
    }
  }

  async function handleExportPdf() {
    try {
      const svg = await buildPatchSvgMarkup();
      const html = `<!DOCTYPE html><html><head><style>@page{size:auto;margin:0}body{margin:0;background:#fff}img{display:block;max-width:100%}</style></head><body><img src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}" /></body></html>`;
      const win = window.open("", "_blank");
      if (!win) {
        window.alert("Could not open print window. Please allow pop-ups for this site.");
        return;
      }
      win.document.write(html);
      win.document.close();
      win.onload = () => win.print();
    } catch {
      window.alert("Could not export PDF.");
    }
  }

  function normalizePatchState(state) {
    return {
      nodes: Array.isArray(state.nodes) ? state.nodes.map(normalizeNode) : [],
      connections: Array.isArray(state.connections)
        ? state.connections.map((connection) => ({
            ...connection,
            color: normalizeConnectionColor(connection.color),
          }))
        : [],
      view:
        state.view &&
        typeof state.view.x === "number" &&
        typeof state.view.y === "number" &&
        typeof state.view.scale === "number"
          ? {
              x: state.view.x,
              y: state.view.y,
              scale: clampScale(state.view.scale),
            }
          : DEFAULT_VIEW,
    };
  }

  function getPatchPayload() {
    return {
      nodes,
      connections,
      view,
    };
  }

  const filteredSymbols = useMemo(() => {
    const term = search.trim().toLowerCase();
    return symbols.filter((symbol) => {
      if (category !== "all" && symbol.category !== category) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        symbol.label.toLowerCase().includes(term) ||
        symbol.category.toLowerCase().includes(term)
      );
    });
  }, [category, search]);

  const filteredCustomModules = useMemo(() => {
    if (category !== "all" && category !== "custom") {
      return [];
    }
    const term = search.trim().toLowerCase();
    if (!term) {
      return customModules;
    }
    return customModules.filter((m) => m.name.toLowerCase().includes(term));
  }, [category, search, customModules]);

  const nodePositions = useMemo(
    () =>
      Object.fromEntries(
        nodes.map((node) => [
          node.id,
          {
            left: { x: node.x, y: node.y + HORIZONTAL_ANCHOR_Y },
            right: { x: node.x + NODE_WIDTH, y: node.y + HORIZONTAL_ANCHOR_Y },
            top: { x: node.x + NODE_WIDTH / 2, y: node.y },
            bottom: { x: node.x + NODE_WIDTH / 2, y: node.y + NODE_HEIGHT },
          },
        ]),
      ),
    [nodes],
  );

  const connectedAnchors = useMemo(() => {
    const set = new Set();
    connections.forEach((c) => {
      set.add(`${c.from}-${c.fromAnchor}`);
      set.add(`${c.to}-${c.toAnchor}`);
    });
    return set;
  }, [connections]);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_PREFERENCE_KEY);
    if (storedTheme === THEME_LIGHT || storedTheme === THEME_DARK) {
      setThemePreference(storedTheme);
      return;
    }

    setThemePreference(
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? THEME_DARK
        : THEME_LIGHT,
    );
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("theme-dark", themePreference === THEME_DARK);
    root.classList.toggle("theme-light", themePreference === THEME_LIGHT);
    root.style.colorScheme = themePreference;
    window.localStorage.setItem(THEME_PREFERENCE_KEY, themePreference);

    return () => {
      root.classList.remove("theme-dark", "theme-light");
    };
  }, [themePreference]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    customModulesRef.current = customModules;
  }, [customModules]);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.nodes) && Array.isArray(parsed.connections)) {
        const normalized = normalizePatchState(parsed);
        setNodes(normalized.nodes);
        setConnections(normalized.connections);
        setView(normalized.view);
      }
    } catch {
      // Ignore corrupted saved state.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nodes, connections, view }),
    );
  }, [connections, nodes, view]);

  useEffect(() => {
    refreshStoredPatches();
    refreshCustomModules();
  }, []);

  useEffect(() => {
    function finishPaletteDrag(clientX, clientY) {
      const palette = paletteDragRef.current;
      if (!palette) {
        return;
      }

      const moved =
        Math.abs(clientX - palette.startX) > 6 ||
        Math.abs(clientY - palette.startY) > 6;

      if (moved && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const insideCanvas =
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom;

        if (insideCanvas) {
          const point = toWorldPoint(clientX, clientY);
          addNodeToCanvas(
            palette.symbolId,
            point.x - palette.hotspotX / viewRef.current.scale,
            point.y - palette.hotspotY / viewRef.current.scale,
            palette.presetNote,
          );
        }
      } else if (!moved) {
        addNodeToCanvas(palette.symbolId, 40, 40, palette.presetNote);
      }

      clearPaletteDrag();
    }

    function clearTransientInteraction() {
      dragRef.current = null;
      panRef.current = null;
      cableDragRef.current = null;
      if (rerouteRef.current) {
        const original = rerouteRef.current.originalConnection;
        rerouteRef.current = null;
        setConnections((c) => [...c, original]);
      }
      setIsPanning(false);
      setCablePreview(null);
      setSelectionBox(null);
    }

    function onPointerMove(event) {
      const drag = dragRef.current;
      if (drag) {
        const point = toWorldPoint(event.clientX, event.clientY);
        const leadX = point.x - drag.offsetX;
        const leadY = point.y - drag.offsetY;
        const deltaX = leadX - drag.originLead.x;
        const deltaY = leadY - drag.originLead.y;

        const boundedDelta = drag.selectedIds.reduce(
          (acc, id) => {
            const origin = drag.origins[id];
            if (!origin) {
              return acc;
            }

            return {
              minX: Math.max(acc.minX, 12 - origin.x),
              maxX: Math.min(
                acc.maxX,
                STAGE_WIDTH - NODE_WIDTH - 12 - origin.x,
              ),
              minY: Math.max(acc.minY, 12 - origin.y),
              maxY: Math.min(
                acc.maxY,
                STAGE_HEIGHT - NODE_HEIGHT - 12 - origin.y,
              ),
            };
          },
          {
            minX: Number.NEGATIVE_INFINITY,
            maxX: Number.POSITIVE_INFINITY,
            minY: Number.NEGATIVE_INFINITY,
            maxY: Number.POSITIVE_INFINITY,
          },
        );

        const safeDeltaX = Math.min(
          Math.max(deltaX, boundedDelta.minX),
          boundedDelta.maxX,
        );
        const safeDeltaY = Math.min(
          Math.max(deltaY, boundedDelta.minY),
          boundedDelta.maxY,
        );
        const snappedLeadX = snapValue(drag.originLead.x + safeDeltaX);
        const snappedLeadY = snapValue(drag.originLead.y + safeDeltaY);
        const snappedDeltaX = snappedLeadX - drag.originLead.x;
        const snappedDeltaY = snappedLeadY - drag.originLead.y;

        setNodes((current) =>
          current.map((node) =>
            drag.selectedIds.includes(node.id)
              ? {
                  ...node,
                  x: drag.origins[node.id].x + snappedDeltaX,
                  y: drag.origins[node.id].y + snappedDeltaY,
                }
              : node,
          ),
        );
      }

      const pan = panRef.current?.mode === "pan" ? panRef.current : null;
      if (pan) {
        setView((current) => ({
          ...current,
          x: pan.originX + (event.clientX - pan.startX),
          y: pan.originY + (event.clientY - pan.startY),
        }));
      }

      const palette = paletteDragRef.current;
      if (palette) {
        const moved =
          Math.abs(event.clientX - palette.startX) > 6 ||
          Math.abs(event.clientY - palette.startY) > 6;

        if (moved || palette.active) {
          paletteDragRef.current = { ...palette, active: true };
          setPaletteDrag({
            symbolId: palette.symbolId,
            x: event.clientX,
            y: event.clientY,
            hotspotX: palette.hotspotX,
            hotspotY: palette.hotspotY,
          });
        }
      }

      const cableDrag = cableDragRef.current;
      if (cableDrag) {
        setCablePreview({
          from: cableDrag.from,
          to: toWorldPoint(event.clientX, event.clientY),
          color: cableDrag.color,
        });
      }

      const reroute = rerouteRef.current;
      if (reroute) {
        setCablePreview({
          from: reroute.fixedPosition,
          to: toWorldPoint(event.clientX, event.clientY),
          color: reroute.originalConnection.color,
        });
      }

      const marquee = panRef.current?.mode === "select" ? panRef.current : null;
      if (marquee) {
        const point = toWorldPoint(event.clientX, event.clientY);
        setSelectionBox({
          x1: marquee.startWorld.x,
          y1: marquee.startWorld.y,
          x2: point.x,
          y2: point.y,
        });
      }
    }

    function onPointerUp(event) {
      const marquee = panRef.current?.mode === "select" ? panRef.current : null;
      if (marquee) {
        const point = toWorldPoint(event.clientX, event.clientY);
        const left = Math.min(marquee.startWorld.x, point.x);
        const right = Math.max(marquee.startWorld.x, point.x);
        const top = Math.min(marquee.startWorld.y, point.y);
        const bottom = Math.max(marquee.startWorld.y, point.y);
        const moved =
          Math.abs(point.x - marquee.startWorld.x) > 4 ||
          Math.abs(point.y - marquee.startWorld.y) > 4;
        const nextSelected = nodesRef.current
          .filter((node) => {
            const nodeRight = node.x + NODE_WIDTH;
            const nodeBottom = node.y + NODE_HEIGHT;
            return (
              node.x < right &&
              nodeRight > left &&
              node.y < bottom &&
              nodeBottom > top
            );
          })
          .map((node) => node.id);
        setSelectedNodeIds(nextSelected);
        setSelectedConnectionId(null);
        suppressNodeClickRef.current = moved;
      }

      finishPaletteDrag(event.clientX, event.clientY);
      clearTransientInteraction();
    }

    function onPointerCancel() {
      clearPaletteDrag();
      clearTransientInteraction();
    }

    function onWindowBlur() {
      clearPaletteDrag();
      clearTransientInteraction();
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      const target = event.target;
      const isEditableTarget =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isEditableTarget) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedNodeIds.length > 0) {
          removeNodes(selectedNodeIds);
        } else if (selectedConnectionId) {
          removeConnection(selectedConnectionId);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedConnectionId, selectedNodeIds, nodes]);

  function removeNodes(nodeIds) {
    const ids = new Set(nodeIds);
    setNodes((current) => current.filter((node) => !ids.has(node.id)));
    setConnections((current) =>
      current.filter(
        (connection) => !ids.has(connection.from) && !ids.has(connection.to),
      ),
    );
    setSelectedNodeIds((current) => current.filter((id) => !ids.has(id)));
  }

  function removeConnection(connectionId) {
    setConnections((current) =>
      current.filter((connection) => connection.id !== connectionId),
    );
    setSelectedConnectionId((current) =>
      current === connectionId ? null : current,
    );
  }

  function addNodeToCanvas(symbolId, x, y, presetNote) {
    const next = snapNodePosition(x, y);
    const newNode = createNode(symbolId, next.x, next.y);
    if (symbolId === "custom-module") {
      let name;
      if (presetNote !== undefined) {
        name = presetNote;
      } else {
        const entered = window.prompt(
          "Module name (e.g. Turing Machine, Shift Register…):",
          "",
        );
        if (entered === null) {
          return;
        }
        name = entered.trim();
        if (!name) {
          return;
        }
        if (customModulesRef.current.some((m) => m.name === name)) {
          window.alert(`"${name}" already exists. Drag it from the Custom section in the palette.`);
          return;
        }
        saveCustomModule(name).then(refreshCustomModules).catch(() => {});
      }
      newNode.note = name;
    }
    setNodes((current) => [...current, newNode]);
  }

  function updateNodeNote(nodeId, value) {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId ? { ...node, note: value } : node,
      ),
    );
  }

  function updateNodePortNote(nodeId, portKey, value) {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              portNotes: {
                ...(node.portNotes || {}),
                [portKey]: value,
              },
            }
          : node,
      ),
    );
  }

  function promptForNodeNote(nodeId) {
    const node = nodes.find((entry) => entry.id === nodeId);
    if (!node) {
      return;
    }

    const symbol = symbolMap[node.symbolId];
    const nextValue = window.prompt(
      `Note for ${symbol?.label || "symbol"}`,
      node.note || "",
    );
    if (nextValue === null) {
      return;
    }

    updateNodeNote(nodeId, nextValue.trim());
  }

  function promptForPortNote(nodeId, portKey) {
    const node = nodes.find((entry) => entry.id === nodeId);
    if (!node) {
      return;
    }

    const symbol = symbolMap[node.symbolId];
    const nextValue = window.prompt(
      `${portKey} patch point note for ${symbol?.label || "symbol"}`,
      node.portNotes?.[portKey] || "",
    );
    if (nextValue === null) {
      return;
    }

    updateNodePortNote(nodeId, portKey, nextValue.trim());
  }

  function handlePalettePointerDown(event, symbolId, presetNote) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    paletteDragRef.current = {
      symbolId,
      presetNote,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      hotspotX: PALETTE_DRAG_HOTSPOT_X,
      hotspotY: PALETTE_DRAG_HOTSPOT_Y,
    };
  }

  function handleNodePointerDown(event, nodeId) {
    if (event.target.closest(".anchor")) {
      return;
    }

    event.stopPropagation();

    if (activeTool === TEXT_TOOL_ID) {
      promptForNodeNote(nodeId);
      return;
    }

    const point = toWorldPoint(event.clientX, event.clientY);
    const node = nodes.find((entry) => entry.id === nodeId);
    if (!node) {
      return;
    }

    const nextSelectedIds = selectedNodeIds.includes(nodeId)
      ? selectedNodeIds
      : [nodeId];
    const origins = Object.fromEntries(
      nodes
        .filter((entry) => nextSelectedIds.includes(entry.id))
        .map((entry) => [entry.id, { x: entry.x, y: entry.y }]),
    );

    dragRef.current = {
      nodeId,
      selectedIds: nextSelectedIds,
      origins,
      originLead: { x: node.x, y: node.y },
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
    };
    setSelectedNodeIds(nextSelectedIds);
    setSelectedConnectionId(null);
  }

  function handleAnchorPointerDown(event, nodeId, anchorType) {
    event.stopPropagation();

    if (activeTool === TEXT_TOOL_ID) {
      const [, portKey] = anchorType.split("-");
      promptForPortNote(nodeId, portKey);
      return;
    }

    const [, anchorKey] = anchorType.split("-");

    // Middle mouse or Cmd/Ctrl+click: reroute an existing cable from this anchor
    if (event.button === 1 || ((event.metaKey || event.ctrlKey) && event.button === 0)) {
      event.preventDefault();
      const existingConnection = connections.find(
        (c) =>
          (c.from === nodeId && c.fromAnchor === anchorKey) ||
          (c.to === nodeId && c.toAnchor === anchorKey),
      );
      if (existingConnection) {
        const isFromEnd =
          existingConnection.from === nodeId &&
          existingConnection.fromAnchor === anchorKey;
        const fixedNodeId = isFromEnd
          ? existingConnection.to
          : existingConnection.from;
        const fixedAnchor = isFromEnd
          ? existingConnection.toAnchor
          : existingConnection.fromAnchor;
        const fixedPosition = nodePositions[fixedNodeId]?.[fixedAnchor];

        setConnections((c) =>
          c.filter((conn) => conn.id !== existingConnection.id),
        );
        rerouteRef.current = {
          originalConnection: existingConnection,
          fixedNodeId,
          fixedPosition,
          movingEnd: isFromEnd ? "from" : "to",
        };
        setCablePreview({
          from: fixedPosition,
          to: fixedPosition,
          color: existingConnection.color,
        });
        setSelectedNodeIds([]);
        setSelectedConnectionId(null);
      }
      return;
    }

    if (activeTool !== "cable") {
      return;
    }

    const from = nodePositions[nodeId]?.[anchorKey];
    if (!from) {
      return;
    }

    cableDragRef.current = {
      fromNodeId: nodeId,
      fromAnchor: anchorKey,
      from,
      color: cableColor,
    };
    setCablePreview({ from, to: from, color: cableColor });
    setSelectedNodeIds([]);
    setSelectedConnectionId(null);
  }

  function handleAnchorPointerUp(event, nodeId, anchorType) {
    event.stopPropagation();

    const [, anchorKey] = anchorType.split("-");

    const activeReroute = rerouteRef.current;
    if (activeReroute) {
      if (nodeId !== activeReroute.fixedNodeId) {
        const { originalConnection, movingEnd } = activeReroute;
        const newConnection =
          movingEnd === "from"
            ? { ...originalConnection, from: nodeId, fromAnchor: anchorKey }
            : { ...originalConnection, to: nodeId, toAnchor: anchorKey };
        setConnections((c) => [...c, newConnection]);
      } else {
        setConnections((c) => [...c, activeReroute.originalConnection]);
      }
      rerouteRef.current = null;
      setCablePreview(null);
      return;
    }

    const activeCable = cableDragRef.current;
    if (!activeCable) {
      return;
    }

    if (activeCable.fromNodeId === nodeId) {
      cableDragRef.current = null;
      setCablePreview(null);
      return;
    }

    setConnections((current) => [
      ...current,
      {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        from: activeCable.fromNodeId,
        fromAnchor: activeCable.fromAnchor,
        to: nodeId,
        toAnchor: anchorKey,
        color: activeCable.color,
      },
    ]);
    cableDragRef.current = null;
    setCablePreview(null);
  }

  function loadPatchState(rawState) {
    try {
      const parsed =
        typeof rawState === "string" ? JSON.parse(rawState) : rawState;

      if (
        !Array.isArray(parsed?.nodes) ||
        !Array.isArray(parsed?.connections)
      ) {
        throw new Error("Invalid patch JSON");
      }

      const normalized = normalizePatchState(parsed);
      setNodes(normalized.nodes);
      setConnections(normalized.connections);
      setView(normalized.view);
      setSelectedNodeIds([]);
      setSelectedConnectionId(null);
      setCablePreview(null);
      setCurrentPatchId(null);
      setCurrentPatchName("Imported patch");
      setLibraryMessage("Opened JSON patch file.");
    } catch (error) {
      window.alert(error.message || "Could not open patch JSON.");
    }
  }

  async function refreshCustomModules() {
    try {
      const modules = await listCustomModules();
      setCustomModules(modules);
    } catch {
      // silently ignore
    }
  }

  async function handleDeleteCustomModule(id, name) {
    const instances = nodes.filter(
      (node) => node.symbolId === "custom-module" && node.note === name,
    );
    if (instances.length > 0) {
      const confirmed = window.confirm(
        `"${name}" is used ${instances.length} time${instances.length === 1 ? "" : "s"} in this patch. Remove those instances too?`,
      );
      if (!confirmed) {
        return;
      }
      removeNodes(instances.map((node) => node.id));
    }
    try {
      await deleteCustomModule(id);
      await refreshCustomModules();
    } catch {
      // silently ignore
    }
  }

  async function handleRenameCustomModule(id, oldName) {
    const newName = window.prompt("Rename module:", oldName);
    if (newName === null || newName.trim() === "" || newName.trim() === oldName) {
      return;
    }
    const trimmed = newName.trim();
    if (customModules.some((m) => m.name === trimmed)) {
      window.alert(`A custom module named "${trimmed}" already exists.`);
      return;
    }
    try {
      await renameCustomModule(id, trimmed);
      setNodes((current) =>
        current.map((node) =>
          node.symbolId === "custom-module" && node.note === oldName
            ? { ...node, note: trimmed }
            : node,
        ),
      );
      await refreshCustomModules();
    } catch {
      // silently ignore
    }
  }

  async function refreshStoredPatches() {
    try {
      const patches = await listStoredPatches();
      setStoredPatches(patches);
    } catch {
      setLibraryMessage("Could not load local patch library.");
    }
  }

  async function savePatch(saveAs = false) {
    try {
      const now = new Date().toISOString();
      let patchId = currentPatchId;
      let patchName = currentPatchName;

      if (saveAs || !patchId) {
        const suggested = saveAs
          ? `${currentPatchName} copy`
          : currentPatchName;
        const enteredName = window.prompt("Patch name", suggested);
        if (!enteredName) {
          return;
        }

        patchName = enteredName.trim() || "Untitled patch";
        patchId = saveAs
          ? `patch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          : currentPatchId ||
            `patch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      }

      const existing = patchId ? await getStoredPatch(patchId) : null;
      await saveStoredPatch({
        id: patchId,
        name: patchName,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        ...getPatchPayload(),
      });

      setCurrentPatchId(patchId);
      setCurrentPatchName(patchName);
      setLibraryMessage(`Saved "${patchName}" to local library.`);
      await refreshStoredPatches();
    } catch {
      setLibraryMessage("Could not save patch to local library.");
    }
  }

  async function openStoredPatchById(id) {
    try {
      const patch = await getStoredPatch(id);
      if (!patch) {
        setLibraryMessage("Patch not found.");
        return;
      }

      const normalized = normalizePatchState(patch);
      setNodes(normalized.nodes);
      setConnections(normalized.connections);
      setView(normalized.view);
      setSelectedNodeIds([]);
      setSelectedConnectionId(null);
      setCablePreview(null);
      setCurrentPatchId(patch.id);
      setCurrentPatchName(patch.name || "Untitled patch");
      setLibraryMessage(`Opened "${patch.name || "Untitled patch"}".`);
      setLibraryOpen(false);
    } catch {
      setLibraryMessage("Could not open patch from local library.");
    }
  }

  async function deleteStoredPatchById(id) {
    try {
      await deleteStoredPatch(id);
      if (currentPatchId === id) {
        setCurrentPatchId(null);
        setCurrentPatchName("Untitled patch");
      }
      setLibraryMessage("Deleted patch from local library.");
      await refreshStoredPatches();
    } catch {
      setLibraryMessage("Could not delete patch from local library.");
    }
  }

  function exportPatchJson() {
    const patch = {
      version: 1,
      savedAt: new Date().toISOString(),
      name: currentPatchName,
      ...getPatchPayload(),
    };
    const blob = new Blob([JSON.stringify(patch, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.href = url;
    link.download = `patch-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function openPatchPicker() {
    fileInputRef.current?.click();
  }

  function handlePatchFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      loadPatchState(reader.result);
      event.target.value = "";
    };
    reader.onerror = () => {
      window.alert("Could not read the selected patch file.");
      event.target.value = "";
    };
    reader.readAsText(file);
  }

  function resetToSample() {
    setNodes(sampleState.nodes);
    setConnections(sampleState.connections);
    setView(sampleState.view || DEFAULT_VIEW);
    setSelectedNodeIds([]);
    setSelectedConnectionId(null);
    setCablePreview(null);
    setCurrentPatchId(null);
    setCurrentPatchName("Sample patch");
  }

  function clearCanvas() {
    setNodes([]);
    setConnections([]);
    setView(DEFAULT_VIEW);
    setSelectedNodeIds([]);
    setSelectedConnectionId(null);
    setCablePreview(null);
    setCurrentPatchId(null);
    setCurrentPatchName("Untitled patch");
  }

  function handleCanvasPointerDown(event) {
    const onNode = event.target.closest?.(".node-card");
    const onConnection = event.target.closest?.(".connection-path");
    if (onNode || onConnection) {
      return;
    }

    const isPanGesture =
      event.button === 1 ||
      ((event.metaKey || event.ctrlKey) && event.button === 0);

    if (isPanGesture) {
      event.preventDefault();
      panRef.current = {
        mode: "pan",
        startX: event.clientX,
        startY: event.clientY,
        originX: viewRef.current.x,
        originY: viewRef.current.y,
      };
      setIsPanning(true);
    } else if (event.button === 0) {
      const startWorld = toWorldPoint(event.clientX, event.clientY);
      panRef.current = {
        mode: "select",
        startWorld,
      };
      setSelectionBox({
        x1: startWorld.x,
        y1: startWorld.y,
        x2: startWorld.x,
        y2: startWorld.y,
      });
    }

    setSelectedNodeIds([]);
    setSelectedConnectionId(null);
  }

  function handleCanvasWheel(event) {
    event.preventDefault();

    const current = viewRef.current;
    const zoomIntensity = event.ctrlKey ? 0.0025 : 0.0014;
    const zoomFactor = Math.exp(-event.deltaY * zoomIntensity);
    zoomAtClientPoint(current.scale * zoomFactor, event.clientX, event.clientY);
  }

  return (
    <main className="app-shell">
      <div className="app-frame">
        <aside className="panel sidebar">
          <div className="sidebar-section">
            <h1 className="sidebar-title">Patch Notation Tool <sup className="beta-badge">Beta</sup></h1>
            <p className="sidebar-copy">
              Drag symbols into the canvas and connect them with color-coded
              cables for sound, modulation, gate-trigger, clock, and pitch flow.
            </p>
          </div>

          <div className="sidebar-section">
            <div className="control-stack">
              <div className="patch-meta">
                <span className="patch-meta-label">Current patch</span>
                <strong className="patch-meta-name">{currentPatchName}</strong>
              </div>
              <input
                className="search-input"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search symbols"
              />
              <select
                className="select-input"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {symbolCategories.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
            {libraryMessage ? (
              <p className="sidebar-status">{libraryMessage}</p>
            ) : null}
            <p className="sidebar-credit">
              Symbols used from the free-to-use PATCH &amp; TWEAK patch symbols.
              See{" "}
              <a
                href="https://www.patchandtweak.com/patch-symbols-explained/"
                target="_blank"
                rel="noreferrer"
              >
                symbol overview
              </a>{" "}
              and{" "}
              <a
                href="https://www.patchandtweak.com/symbols/"
                target="_blank"
                rel="noreferrer"
              >
                licensing/download info
              </a>
              .
            </p>
          </div>

          <div className="symbol-list">
            {filteredSymbols.map((symbol) => (
              <button
                key={symbol.id}
                className="symbol-button"
                onPointerDown={(event) =>
                  handlePalettePointerDown(event, symbol.id)
                }
              >
                <SymbolIcon symbol={symbol} size={72} />
                <div className="symbol-meta">
                  <div className="symbol-name">{symbol.label}</div>
                  <div className="symbol-category">
                    {
                      symbolCategories.find(
                        (entry) => entry.id === symbol.category,
                      )?.label
                    }
                  </div>
                </div>
              </button>
            ))}
            {filteredCustomModules.map((entry) => (
              <div
                key={entry.id}
                className="symbol-button saved-custom-module"
                onPointerDown={(event) => handlePalettePointerDown(event, "custom-module", entry.name)}
              >
                <SymbolIcon symbol={symbolMap["custom-module"]} size={72} />
                <div className="symbol-meta">
                  <div className="symbol-name">{entry.name}</div>
                  <div className="symbol-category">Custom</div>
                </div>
                <button
                  className="custom-module-action custom-module-edit"
                  title="Rename module"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => handleRenameCustomModule(entry.id, entry.name)}
                >
                  ✎
                </button>
                <button
                  className="custom-module-action custom-module-delete"
                  title="Remove from library"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => handleDeleteCustomModule(entry.id, entry.name)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="sidebar-section" style={{ paddingBottom: 18 }}>
            <div className="file-panel">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden-file-input"
                onChange={handlePatchFileChange}
              />
              <div className="button-row icon-row">
                <button
                  className="primary-button toolbar-icon-button"
                  onClick={() => savePatch(false)}
                  title="Save patch"
                  aria-label="Save patch"
                >
                  <ToolbarIcon>
                    <path
                      d="M6 4h10l3 3v13H5V4z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 4v5h6V4M9 16h6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </ToolbarIcon>
                </button>
                <button
                  className="toolbar-icon-button"
                  onClick={() => savePatch(true)}
                  title="Save patch as"
                  aria-label="Save patch as"
                >
                  <ToolbarIcon>
                    <path
                      d="M6 4h10l3 3v13H5V4z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 4v5h6V4M12 13v5M9.5 15.5 12 18l2.5-2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </ToolbarIcon>
                </button>
                <button
                  className="toolbar-icon-button"
                  onClick={() => {
                    setLibraryOpen((current) => !current);
                    refreshStoredPatches();
                  }}
                  title="Open patch library"
                  aria-label="Open patch library"
                >
                  <ToolbarIcon>
                    <path
                      d="M4 7h6l2 2h8v9H4z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 7V5h6l2 2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </ToolbarIcon>
                </button>
                <button
                  className="toolbar-icon-button"
                  onClick={exportPatchJson}
                  title="Export JSON"
                  aria-label="Export JSON"
                >
                  <ToolbarIcon>
                    <path
                      d="M8 4h6l4 4v12H8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 4v4h4M10 14h4M10 17h6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </ToolbarIcon>
                </button>
                <button
                  className="toolbar-icon-button"
                  onClick={openPatchPicker}
                  title="Import JSON"
                  aria-label="Import JSON"
                >
                  <ToolbarIcon>
                    <path
                      d="M8 4h6l4 4v12H8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 4v4h4M12 18V12M9.5 14.5 12 12l2.5 2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </ToolbarIcon>
                </button>
              </div>
              {libraryOpen ? (
                <div className="patch-library">
                  {storedPatches.length === 0 ? (
                    <p className="patch-library-empty">No saved patches yet.</p>
                  ) : (
                    storedPatches.map((patch) => (
                      <div key={patch.id} className="patch-library-item">
                        <button
                          className="patch-library-open"
                          onClick={() => openStoredPatchById(patch.id)}
                        >
                          <span>{patch.name}</span>
                          <span>
                            {new Date(patch.updatedAt).toLocaleString()}
                          </span>
                        </button>
                        <button
                          className="patch-library-delete"
                          onClick={() => deleteStoredPatchById(patch.id)}
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <section className="panel workspace">
          <div className="toolbar">
            <div className="toolbar-row">
              <div className="zoom-controls">
                <button
                  className="toolbar-icon-button"
                  onClick={() => handleZoomStep(-1)}
                  type="button"
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  -
                </button>
                <span className="zoom-readout">
                  {Math.round(view.scale * 100)}%
                </span>
                <button
                  className="toolbar-icon-button"
                  onClick={() => handleZoomStep(1)}
                  type="button"
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  +
                </button>
                <button
                  className="toolbar-icon-button"
                  onClick={handleResetView}
                  type="button"
                  title="Reset view"
                  aria-label="Reset view"
                >
                  <ToolbarIcon>
                    <path
                      d="M12 5a7 7 0 1 1-6.2 3.75"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M5 5v4h4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </ToolbarIcon>
                </button>
                <button
                  className="toolbar-icon-button"
                  onClick={handleFitToContent}
                  type="button"
                  title="Fit to content"
                  aria-label="Fit to content"
                >
                  <ToolbarIcon>
                    <path
                      d="M9 4H4v5M15 4h5v5M20 15v5h-5M4 15v5h5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </ToolbarIcon>
                </button>
                <button
                  className="toolbar-icon-button"
                  onClick={handleExportSvg}
                  type="button"
                  title="Export SVG"
                  aria-label="Export SVG"
                >
                  <ToolbarIcon>
                    <path
                      d="M8 4h6l4 4v12H8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 4v4h4M12 11v6M9.5 14.5 12 17l2.5-2.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </ToolbarIcon>
                </button>
                <button
                  className="toolbar-icon-button"
                  onClick={handleExportPdf}
                  type="button"
                  title="Export PDF"
                  aria-label="Export PDF"
                >
                  <ToolbarIcon>
                    <path
                      d="M8 4h6l4 4v12H8z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 4v4h4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <text
                      x="12"
                      y="16"
                      textAnchor="middle"
                      fontSize="5.5"
                      fontWeight="700"
                      fontFamily="sans-serif"
                      fill="currentColor"
                    >PDF</text>
                  </ToolbarIcon>
                </button>
                <button
                  className="toolbar-icon-button"
                  onClick={handleExportPng}
                  type="button"
                  title="Export PNG"
                  aria-label="Export PNG"
                >
                  <ToolbarIcon>
                    <rect
                      x="4"
                      y="5"
                      width="16"
                      height="14"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                    <path
                      d="m7 16 3-3 2.5 2 3.5-4 2 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </ToolbarIcon>
                </button>
              </div>

              <button
                className="toolbar-icon-button"
                onClick={resetToSample}
                title="Load sample patch"
                aria-label="Load sample patch"
              >
                <ToolbarIcon>
                  <path
                    d="M7 5h8l3 3v11H7z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 5v3h3M10 12h5M10 15h5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </ToolbarIcon>
              </button>
              <button
                className="toolbar-icon-button danger"
                onClick={clearCanvas}
                title="Clear canvas"
                aria-label="Clear canvas"
              >
                <ToolbarIcon>
                  <path
                    d="M5 17h10M15 17l3-8M9 17l3-8M10 7h9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 5h3l2 2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </ToolbarIcon>
              </button>
              <button
                className="toolbar-icon-button danger"
                disabled={selectedNodeIds.length === 0 && !selectedConnectionId}
                onClick={() => {
                  if (selectedNodeIds.length > 0) {
                    removeNodes(selectedNodeIds);
                  } else if (selectedConnectionId) {
                    removeConnection(selectedConnectionId);
                  }
                }}
                title="Delete selected"
                aria-label="Delete selected"
              >
                <ToolbarIcon>
                  <path
                    d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 10v6M14 10v6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </ToolbarIcon>
              </button>
              <span className="toolbar-spacer" />
              <button
                className="toolbar-icon-button"
                onClick={() =>
                  setThemePreference((current) =>
                    current === THEME_DARK ? THEME_LIGHT : THEME_DARK,
                  )
                }
                title={
                  themePreference === THEME_DARK
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                aria-label={
                  themePreference === THEME_DARK
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                type="button"
              >
                {themePreference === THEME_DARK ? (
                  <ToolbarIcon>
                    <circle
                      cx="12"
                      cy="12"
                      r="4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </ToolbarIcon>
                ) : (
                  <ToolbarIcon>
                    <path
                      d="M18 14.5A7.5 7.5 0 0 1 9.5 6a7 7 0 1 0 8.5 8.5Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </ToolbarIcon>
                )}
              </button>
            </div>
            <span className="toolbar-note">
              Use Select for moving, a cable color for patching, and Text for
              annotations. Middle-drag or Cmd/Ctrl-drag pans the view port.
              Middle-click or Cmd/Ctrl-click a patch point to reroute its
              cable. Select a cable then click a color to change its type.
            </span>
          </div>

          <div className="canvas-legend">
            <button
              className={`legend-swatch select-tool ${activeTool === SELECT_TOOL_ID ? "selected" : ""}`}
              onClick={() => setActiveTool(SELECT_TOOL_ID)}
              title={toolDescriptions[SELECT_TOOL_ID]}
              type="button"
            >
              Select
            </button>
            {cableOptions.map((option) => (
              <button
                key={option.id}
                className={`legend-swatch ${activeTool === "cable" && cableColor === option.id ? "selected" : ""}`}
                style={{ color: cableColors[option.id] }}
                onClick={() => {
                  if (selectedConnectionId) {
                    setConnections((current) =>
                      current.map((c) =>
                        c.id === selectedConnectionId
                          ? { ...c, color: option.id }
                          : c,
                      ),
                    );
                  } else {
                    setCableColor(option.id);
                    setActiveTool("cable");
                  }
                }}
                title={toolDescriptions[option.id]}
                type="button"
              >
                {option.label}
              </button>
            ))}
            <button
              className={`legend-swatch text-tool ${activeTool === TEXT_TOOL_ID ? "selected" : ""}`}
              onClick={() => setActiveTool(TEXT_TOOL_ID)}
              title={toolDescriptions[TEXT_TOOL_ID]}
              type="button"
            >
              Text
            </button>
          </div>
          <p className="tool-help">{activeToolDescription}</p>

          <div
            ref={canvasRef}
            className={`canvas ${isPanning ? "is-panning" : ""}`}
            onPointerDown={handleCanvasPointerDown}
            onWheel={handleCanvasWheel}
            onClickCapture={(event) => {
              if (!suppressNodeClickRef.current) {
                return;
              }

              suppressNodeClickRef.current = false;
              event.preventDefault();
              event.stopPropagation();
            }}
          >
            {nodes.length === 0 ? (
              <div className="canvas-empty">
                Drop symbols here, switch between Select, cable colors, and
                Text, then use middle-drag or Cmd/Ctrl-drag to pan.
              </div>
            ) : null}

            <div
              className={`canvas-stage${activeTool === "cable" ? " patching-mode" : ""}`}
              style={{
                width: STAGE_WIDTH,
                height: STAGE_HEIGHT,
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              }}
            >
              <svg
                className="canvas-overlay"
                width={STAGE_WIDTH}
                height={STAGE_HEIGHT}
              >
                {connections.map((connection) => {
                  const source =
                    nodePositions[connection.from]?.[connection.fromAnchor];
                  const target =
                    nodePositions[connection.to]?.[connection.toAnchor];
                  if (!source || !target) {
                    return null;
                  }

                  const color =
                    cableColors[connection.color] || cableColors.modulation;
                  const isSelected =
                    selectedConnectionId === connection.id;
                  return (
                    <g key={connection.id}>
                      <path
                        className="connection-path"
                        d={getConnectionPath(source, target)}
                        stroke={color}
                        strokeWidth={isSelected ? "8" : "6"}
                        strokeLinecap="round"
                        fill="none"
                        opacity={isSelected ? "1" : "0.95"}
                        onPointerDown={(event) => {
                          if (event.button !== 0 || event.metaKey || event.ctrlKey) {
                            return;
                          }
                          event.stopPropagation();
                          setSelectedConnectionId(connection.id);
                          setSelectedNodeIds([]);
                        }}
                      />
                      <circle cx={source.x} cy={source.y} r="5" fill={color} opacity="0.9" style={{ pointerEvents: "none" }} />
                      <circle cx={target.x} cy={target.y} r="5" fill={color} opacity="0.9" style={{ pointerEvents: "none" }} />
                    </g>
                  );
                })}
                {cablePreview ? (
                  <path
                    d={getConnectionPath(cablePreview.from, cablePreview.to)}
                    stroke={
                      cableColors[cablePreview.color] || cableColors.modulation
                    }
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.55"
                    strokeDasharray="16 12"
                  />
                ) : null}
              </svg>

              {nodes.map((node) => {
                const symbol = symbolMap[node.symbolId];
                if (!symbol) {
                  return null;
                }

                return (
                  <article
                    key={node.id}
                    className={`node-card ${selectedNodeIds.includes(node.id) ? "selected" : ""}`}
                    style={{ left: node.x, top: node.y }}
                    onPointerDown={(event) =>
                      handleNodePointerDown(event, node.id)
                    }
                  >
                    {["left", "right", "bottom", "top"].map((side) => {
                      const isConnected = connectedAnchors.has(`${node.id}-${side}`);
                      return (
                        <button
                          key={side}
                          className={`anchor ${side}${isConnected ? " anchor-connected" : ""}`}
                          title={isConnected ? "Middle-click or Cmd/Ctrl+click to reroute" : undefined}
                          onPointerDown={(event) =>
                            handleAnchorPointerDown(event, node.id, `any-${side}`)
                          }
                          onPointerUp={(event) =>
                            handleAnchorPointerUp(event, node.id, `any-${side}`)
                          }
                        />
                      );
                    })}
                    <div className="node-icon">
                      <SymbolIcon symbol={symbol} size={62} />
                    </div>
                    <div className="node-label">
                      {node.symbolId === "custom-module"
                        ? node.note || "Custom module"
                        : symbol.label}
                    </div>
                    {node.symbolId !== "custom-module" && node.note ? (
                      <div className="node-note-badge">{node.note}</div>
                    ) : null}
                    {PORT_KEYS.map((portKey) =>
                      node.portNotes?.[portKey] ? (
                        <div
                          key={portKey}
                          className={`port-note port-note-${portKey}`}
                        >
                          {node.portNotes[portKey]}
                        </div>
                      ) : null,
                    )}
                  </article>
                );
              })}

              {selectionBox ? (
                <div
                  className="selection-box"
                  style={{
                    left: Math.min(selectionBox.x1, selectionBox.x2),
                    top: Math.min(selectionBox.y1, selectionBox.y2),
                    width: Math.abs(selectionBox.x2 - selectionBox.x1),
                    height: Math.abs(selectionBox.y2 - selectionBox.y1),
                  }}
                />
              ) : null}
            </div>
          </div>
        </section>
      </div>
      {mounted && paletteDrag
        ? createPortal(
            <div
              className="palette-drag-preview"
              style={{
                left: paletteDrag.x - paletteDrag.hotspotX,
                top: paletteDrag.y - paletteDrag.hotspotY,
              }}
            >
              <div className="node-icon">
                <SymbolIcon
                  symbol={symbolMap[paletteDrag.symbolId]}
                  size={62}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </main>
  );
}
