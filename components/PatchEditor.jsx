"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SymbolIcon from "@/components/SymbolIcon";
import { symbolCategories, symbolMap, symbols } from "@/lib/symbols";

const STORAGE_KEY = "patch-notation-tool-state-v1";
const NODE_WIDTH = 122;
const NODE_HEIGHT = 104;
const PALETTE_DRAG_HOTSPOT_X = 78;
const PALETTE_DRAG_HOTSPOT_Y = 24;
const STAGE_WIDTH = 3200;
const STAGE_HEIGHT = 2200;
const GRID_SIZE = 32;
const MIN_SCALE = 0.45;
const MAX_SCALE = 2.4;
const DEFAULT_VIEW = { x: 120, y: 120, scale: 1 };

const cableColors = {
  sound: "#f6ba00",
  modulation: "#0b88d8",
  gate: "#d8171f",
  pitch: "#7d94a5",
  clock: "#2f9e44"
};

const cableOptions = [
  { id: "sound", label: "sound" },
  { id: "modulation", label: "modulation" },
  { id: "gate", label: "gate / trigger" },
  { id: "clock", label: "clock" },
  { id: "pitch", label: "pitch" }
];

const sampleState = {
  nodes: [
    { id: "n1", symbolId: "keyboard-controller", x: 70, y: 420 },
    { id: "n2", symbolId: "sawtooth-wave-oscillator", x: 80, y: 110 },
    { id: "n3", symbolId: "low-pass-filter", x: 320, y: 120 },
    { id: "n4", symbolId: "amplifier-vca", x: 550, y: 120 },
    { id: "n5", symbolId: "eg-adsr", x: 320, y: 320 }
  ],
  connections: [
    { id: "c1", from: "n2", to: "n3", color: "sound" },
    { id: "c2", from: "n3", to: "n4", color: "sound" },
    { id: "c3", from: "n5", to: "n4", color: "modulation" },
    { id: "c4", from: "n1", to: "n2", color: "pitch" },
    { id: "c5", from: "n1", to: "n5", color: "gate" }
  ]
};

const cableColorAliases = {
  audio: "sound",
  cv: "modulation",
  mod: "gate",
  neutral: "pitch"
};

function getConnectionPath(source, target) {
  const dx = Math.max(100, Math.abs(target.x - source.x) * 0.45);
  return `M ${source.x} ${source.y} C ${source.x + dx} ${source.y}, ${target.x - dx} ${target.y}, ${target.x} ${target.y}`;
}

function createNode(symbolId, x, y) {
  return {
    id: `${symbolId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    symbolId,
    x: Math.round(x),
    y: Math.round(y)
  };
}

export default function PatchEditor() {
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const panRef = useRef(null);
  const paletteDragRef = useRef(null);
  const cableDragRef = useRef(null);
  const fileInputRef = useRef(null);
  const viewRef = useRef(DEFAULT_VIEW);
  const nodesRef = useRef(sampleState.nodes);
  const suppressNodeClickRef = useRef(false);

  const [nodes, setNodes] = useState(sampleState.nodes);
  const [connections, setConnections] = useState(sampleState.connections);
  const [selectedNodeIds, setSelectedNodeIds] = useState([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cableColor, setCableColor] = useState("modulation");
  const [paletteDrag, setPaletteDrag] = useState(null);
  const [cablePreview, setCablePreview] = useState(null);
  const [view, setView] = useState(DEFAULT_VIEW);
  const [isPanning, setIsPanning] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const [mounted, setMounted] = useState(false);

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
      y: Math.min(Math.max(12, y), STAGE_HEIGHT - NODE_HEIGHT - 12)
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
      y: (clientY - rect.top - currentView.y) / currentView.scale
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
      scale: clampedScale
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
    const right = Math.max(...nodesRef.current.map((node) => node.x + NODE_WIDTH));
    const bottom = Math.max(...nodesRef.current.map((node) => node.y + NODE_HEIGHT));
    const boundsWidth = right - left;
    const boundsHeight = bottom - top;
    const scaleX = (rect.width - padding * 2) / Math.max(boundsWidth, 1);
    const scaleY = (rect.height - padding * 2) / Math.max(boundsHeight, 1);
    const scale = clampScale(Math.min(scaleX, scaleY, 1.4));

    setView({
      x: rect.width / 2 - ((left + right) / 2) * scale,
      y: rect.height / 2 - ((top + bottom) / 2) * scale,
      scale
    });
  }

  function normalizePatchState(state) {
    return {
      nodes: Array.isArray(state.nodes) ? state.nodes : [],
      connections: Array.isArray(state.connections)
        ? state.connections.map((connection) => ({
            ...connection,
            color: normalizeConnectionColor(connection.color)
          }))
        : []
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

  const nodePositions = useMemo(
    () =>
      Object.fromEntries(
        nodes.map((node) => [
          node.id,
          {
            input: { x: node.x, y: node.y + 44 },
            output: { x: node.x + NODE_WIDTH, y: node.y + 44 }
          }
        ])
      ),
    [nodes]
  );

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

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
      }
    } catch {
      // Ignore corrupted saved state.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ nodes, connections })
    );
  }, [connections, nodes]);

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
            point.y - palette.hotspotY / viewRef.current.scale
          );
        }
      } else if (!moved) {
        addNodeToCanvas(palette.symbolId, 40, 40);
      }

      clearPaletteDrag();
    }

    function clearTransientInteraction() {
      dragRef.current = null;
      panRef.current = null;
      cableDragRef.current = null;
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
              maxX: Math.min(acc.maxX, STAGE_WIDTH - NODE_WIDTH - 12 - origin.x),
              minY: Math.max(acc.minY, 12 - origin.y),
              maxY: Math.min(acc.maxY, STAGE_HEIGHT - NODE_HEIGHT - 12 - origin.y)
            };
          },
          {
            minX: Number.NEGATIVE_INFINITY,
            maxX: Number.POSITIVE_INFINITY,
            minY: Number.NEGATIVE_INFINITY,
            maxY: Number.POSITIVE_INFINITY
          }
        );

        const safeDeltaX = Math.min(
          Math.max(deltaX, boundedDelta.minX),
          boundedDelta.maxX
        );
        const safeDeltaY = Math.min(
          Math.max(deltaY, boundedDelta.minY),
          boundedDelta.maxY
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
                  y: drag.origins[node.id].y + snappedDeltaY
                }
              : node
          )
        );
      }

      const pan = panRef.current?.mode === "pan" ? panRef.current : null;
      if (pan) {
        setView((current) => ({
          ...current,
          x: pan.originX + (event.clientX - pan.startX),
          y: pan.originY + (event.clientY - pan.startY)
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
            hotspotY: palette.hotspotY
          });
        }
      }

      const cableDrag = cableDragRef.current;
      if (cableDrag) {
        setCablePreview({
          from: cableDrag.from,
          to: toWorldPoint(event.clientX, event.clientY),
          color: cableDrag.color
        });
      }

      const marquee = panRef.current?.mode === "select" ? panRef.current : null;
      if (marquee) {
        const point = toWorldPoint(event.clientX, event.clientY);
        setSelectionBox({
          x1: marquee.startWorld.x,
          y1: marquee.startWorld.y,
          x2: point.x,
          y2: point.y
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
        (connection) => !ids.has(connection.from) && !ids.has(connection.to)
      )
    );
    setSelectedNodeIds((current) => current.filter((id) => !ids.has(id)));
  }

  function removeConnection(connectionId) {
    setConnections((current) =>
      current.filter((connection) => connection.id !== connectionId)
    );
    setSelectedConnectionId((current) =>
      current === connectionId ? null : current
    );
  }

  function addNodeToCanvas(symbolId, x, y) {
    const next = snapNodePosition(x, y);
    setNodes((current) => [...current, createNode(symbolId, next.x, next.y)]);
  }

  function handlePalettePointerDown(event, symbolId) {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);

    paletteDragRef.current = {
      symbolId,
      startX: event.clientX,
      startY: event.clientY,
      active: false,
      hotspotX: PALETTE_DRAG_HOTSPOT_X,
      hotspotY: PALETTE_DRAG_HOTSPOT_Y
    };
  }

  function handleNodePointerDown(event, nodeId) {
    if (event.target.closest(".anchor")) {
      return;
    }

    event.stopPropagation();

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
        .map((entry) => [entry.id, { x: entry.x, y: entry.y }])
    );

    dragRef.current = {
      nodeId,
      selectedIds: nextSelectedIds,
      origins,
      originLead: { x: node.x, y: node.y },
      offsetX: point.x - node.x,
      offsetY: point.y - node.y
    };
    setSelectedNodeIds(nextSelectedIds);
    setSelectedConnectionId(null);
  }

  function handleAnchorPointerDown(event, nodeId, anchorType) {
    event.stopPropagation();

    if (anchorType !== "output") {
      return;
    }

    const from = nodePositions[nodeId]?.output;
    if (!from) {
      return;
    }

    cableDragRef.current = {
      fromNodeId: nodeId,
      from,
      color: cableColor
    };
    setCablePreview({
      from,
      to: from,
      color: cableColor
    });
    setSelectedNodeIds([]);
    setSelectedConnectionId(null);
  }

  function handleAnchorPointerUp(event, nodeId, anchorType) {
    event.stopPropagation();

    const activeCable = cableDragRef.current;
    if (!activeCable || anchorType !== "input") {
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
        to: nodeId,
        color: activeCable.color
      }
    ]);
    cableDragRef.current = null;
    setCablePreview(null);
  }

  function loadPatchState(rawState) {
    try {
      const parsed =
        typeof rawState === "string" ? JSON.parse(rawState) : rawState;

      if (!Array.isArray(parsed?.nodes) || !Array.isArray(parsed?.connections)) {
        throw new Error("Invalid patch JSON");
      }

      const normalized = normalizePatchState(parsed);
      setNodes(normalized.nodes);
      setConnections(normalized.connections);
      setSelectedNodeIds([]);
      setSelectedConnectionId(null);
      setCablePreview(null);
    } catch (error) {
      window.alert(error.message || "Could not open patch JSON.");
    }
  }

  function savePatch() {
    const patch = {
      version: 1,
      savedAt: new Date().toISOString(),
      nodes,
      connections
    };
    const blob = new Blob([JSON.stringify(patch, null, 2)], {
      type: "application/json"
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
    setSelectedNodeIds([]);
    setSelectedConnectionId(null);
    setCablePreview(null);
  }

  function clearCanvas() {
    setNodes([]);
    setConnections([]);
    setSelectedNodeIds([]);
    setSelectedConnectionId(null);
    setCablePreview(null);
  }

  function handleCanvasPointerDown(event) {
    const onNode = event.target.closest?.(".node-card");
    const onConnection = event.target.closest?.(".connection-path");
    if (onNode || onConnection) {
      return;
    }

    const isPanGesture = event.button === 1 || ((event.metaKey || event.ctrlKey) && event.button === 0);

    if (isPanGesture) {
      event.preventDefault();
      panRef.current = {
        mode: "pan",
        startX: event.clientX,
        startY: event.clientY,
        originX: viewRef.current.x,
        originY: viewRef.current.y
      };
      setIsPanning(true);
    } else if (event.button === 0) {
      const startWorld = toWorldPoint(event.clientX, event.clientY);
      panRef.current = {
        mode: "select",
        startWorld
      };
      setSelectionBox({
        x1: startWorld.x,
        y1: startWorld.y,
        x2: startWorld.x,
        y2: startWorld.y
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
    zoomAtClientPoint(
      current.scale * zoomFactor,
      event.clientX,
      event.clientY
    );
  }

  return (
    <main className="app-shell">
      <div className="app-frame">
        <aside className="panel sidebar">
          <div className="sidebar-section">
            <h1 className="sidebar-title">Patch Notation Tool</h1>
            <p className="sidebar-copy">
              Drag symbols into the canvas and connect them with color-coded cables
              for sound, modulation, gate-trigger, clock, and pitch flow.
            </p>
          </div>

          <div className="sidebar-section">
            <div className="control-stack">
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
          </div>

          <div className="symbol-list">
            {filteredSymbols.map((symbol) => (
              <button
                key={symbol.id}
                className="symbol-button"
                onPointerDown={(event) => handlePalettePointerDown(event, symbol.id)}
              >
                <SymbolIcon symbol={symbol} size={72} />
                <div className="symbol-meta">
                  <div className="symbol-name">{symbol.label}</div>
                  <div className="symbol-category">
                    {symbolCategories.find((entry) => entry.id === symbol.category)?.label}
                  </div>
                </div>
              </button>
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
              <div className="button-row">
                <button className="primary-button" onClick={savePatch}>
                  Save
                </button>
                <button onClick={openPatchPicker}>Open</button>
              </div>
            </div>
          </div>
        </aside>

        <section className="panel workspace">
          <div className="toolbar">
            <div className="zoom-controls">
              <button onClick={() => handleZoomStep(-1)} type="button">
                -
              </button>
              <span className="zoom-readout">{Math.round(view.scale * 100)}%</span>
              <button onClick={() => handleZoomStep(1)} type="button">
                +
              </button>
              <button onClick={handleResetView} type="button">
                Reset view
              </button>
              <button onClick={handleFitToContent} type="button">
                Fit to content
              </button>
            </div>

            <button onClick={resetToSample}>Load sample patch</button>
            <button onClick={clearCanvas} className="danger">
              Clear canvas
            </button>
            <button
              disabled={selectedNodeIds.length === 0 && !selectedConnectionId}
              onClick={() => {
                if (selectedNodeIds.length > 0) {
                  removeNodes(selectedNodeIds);
                } else if (selectedConnectionId) {
                  removeConnection(selectedConnectionId);
                }
              }}
            >
              Delete selected
            </button>

            <span className="toolbar-note">
              Middle-drag or Cmd/Ctrl-drag to pan. Left-drag empty space to select.
              Use the wheel or trackpad pinch to zoom.
            </span>
          </div>

          <div className="canvas-legend">
            {cableOptions.map((option) => (
              <button
                key={option.id}
                className={`legend-swatch ${cableColor === option.id ? "selected" : ""}`}
                style={{ color: cableColors[option.id] }}
                onClick={() => setCableColor(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>

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
                Drop symbols here, middle-drag or Cmd/Ctrl-drag to pan, and use
                the wheel or trackpad pinch to zoom.
              </div>
            ) : null}

            <div
              className="canvas-stage"
              style={{
                width: STAGE_WIDTH,
                height: STAGE_HEIGHT,
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`
              }}
            >
              <svg className="canvas-overlay" width={STAGE_WIDTH} height={STAGE_HEIGHT}>
                {connections.map((connection) => {
                  const source = nodePositions[connection.from]?.output;
                  const target = nodePositions[connection.to]?.input;
                  if (!source || !target) {
                    return null;
                  }

                  return (
                    <path
                      key={connection.id}
                      className="connection-path"
                      d={getConnectionPath(source, target)}
                      stroke={cableColors[connection.color] || cableColors.modulation}
                      strokeWidth={selectedConnectionId === connection.id ? "10" : "8"}
                      strokeLinecap="round"
                      fill="none"
                      opacity={selectedConnectionId === connection.id ? "1" : "0.95"}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        setSelectedConnectionId(connection.id);
                        setSelectedNodeIds([]);
                      }}
                    />
                  );
                })}
                {cablePreview ? (
                  <path
                    d={getConnectionPath(cablePreview.from, cablePreview.to)}
                    stroke={cableColors[cablePreview.color] || cableColors.modulation}
                    strokeWidth="8"
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
                    onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                  >
                    <button
                      className="anchor input"
                      title="Input anchor"
                      onPointerDown={(event) => event.stopPropagation()}
                      onPointerUp={(event) => handleAnchorPointerUp(event, node.id, "input")}
                    />
                    <button
                      className="anchor output"
                      title="Output anchor"
                      onPointerDown={(event) =>
                        handleAnchorPointerDown(event, node.id, "output")
                      }
                    />
                    <div className="node-icon">
                      <SymbolIcon symbol={symbol} size={62} />
                    </div>
                    <div className="node-label">{symbol.label}</div>
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
                    height: Math.abs(selectionBox.y2 - selectionBox.y1)
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
                top: paletteDrag.y - paletteDrag.hotspotY
              }}
            >
              <div className="node-icon">
                <SymbolIcon symbol={symbolMap[paletteDrag.symbolId]} size={62} />
              </div>
            </div>,
            document.body
          )
        : null}
    </main>
  );
}
