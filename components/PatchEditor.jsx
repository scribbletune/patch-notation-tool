"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import SymbolIcon from "@/components/SymbolIcon";
import { symbolCategories, symbolMap, symbols } from "@/lib/symbols";

const STORAGE_KEY = "patch-notation-tool-state-v1";
const NODE_WIDTH = 122;
const NODE_HEIGHT = 104;

const cableColors = {
  sound: "#f6ba00",
  modulation: "#0b88d8",
  gate: "#d8171f",
  pitch: "#7d94a5",
  clock: "#2f9e44"
};

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

const cableOptions = [
  { id: "sound", label: "sound" },
  { id: "modulation", label: "modulation" },
  { id: "gate", label: "gate / trigger" },
  { id: "clock", label: "clock" },
  { id: "pitch", label: "pitch" }
];

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
  const paletteDragRef = useRef(null);
  const cableDragRef = useRef(null);
  const fileInputRef = useRef(null);
  const [nodes, setNodes] = useState(sampleState.nodes);
  const [connections, setConnections] = useState(sampleState.connections);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cableColor, setCableColor] = useState("modulation");
  const [paletteDrag, setPaletteDrag] = useState(null);
  const [cablePreview, setCablePreview] = useState(null);

  function clearPaletteDrag() {
    paletteDragRef.current = null;
    setPaletteDrag(null);
  }

  function normalizeConnectionColor(color) {
    return cableColorAliases[color] || color || "modulation";
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
          addNodeToCanvas(
            palette.symbolId,
            clientX - rect.left - NODE_WIDTH / 2,
            clientY - rect.top - NODE_HEIGHT / 2
          );
        }
      } else if (!moved) {
        addNodeToCanvas(palette.symbolId, 40, 40);
      }

      clearPaletteDrag();
    }

    function onPointerMove(event) {
      const drag = dragRef.current;
      const canvas = canvasRef.current;
      if (drag && canvas) {
        const rect = canvas.getBoundingClientRect();
        const nextX = event.clientX - rect.left - drag.offsetX;
        const nextY = event.clientY - rect.top - drag.offsetY;

        setNodes((current) =>
          current.map((node) =>
            node.id === drag.nodeId
              ? {
                  ...node,
                  x: Math.min(Math.max(12, nextX), rect.width - NODE_WIDTH - 12),
                  y: Math.min(Math.max(12, nextY), rect.height - NODE_HEIGHT - 12)
                }
              : node
          )
        );
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
            y: event.clientY
          });
        }
      }

      const cableDrag = cableDragRef.current;
      if (cableDrag && canvas) {
        const rect = canvas.getBoundingClientRect();
        setCablePreview({
          from: cableDrag.from,
          to: {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          },
          color: cableDrag.color
        });
      }
    }

    function onPointerUp(event) {
      dragRef.current = null;

      finishPaletteDrag(event.clientX, event.clientY);

      if (cableDragRef.current) {
        cableDragRef.current = null;
        setCablePreview(null);
      }
    }

    function onPointerCancel() {
      clearPaletteDrag();
      dragRef.current = null;
      cableDragRef.current = null;
      setCablePreview(null);
    }

    function onWindowBlur() {
      clearPaletteDrag();
      dragRef.current = null;
      cableDragRef.current = null;
      setCablePreview(null);
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
        if (selectedNodeId) {
          removeNode(selectedNodeId);
        } else if (selectedConnectionId) {
          removeConnection(selectedConnectionId);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedConnectionId, selectedNodeId]);

  const nodePositions = useMemo(() => {
    return Object.fromEntries(
      nodes.map((node) => [
        node.id,
        {
          input: { x: node.x, y: node.y + 44 },
          output: { x: node.x + NODE_WIDTH, y: node.y + 44 }
        }
      ])
    );
  }, [nodes]);

  function removeNode(nodeId) {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setConnections((current) =>
      current.filter((connection) => connection.from !== nodeId && connection.to !== nodeId)
    );
    setSelectedNodeId((current) => (current === nodeId ? null : current));
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
    setNodes((current) => [...current, createNode(symbolId, x, y)]);
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
      pointerId: event.pointerId
    };
  }

  function handleNodePointerDown(event, nodeId) {
    if (event.target.closest(".anchor")) {
      return;
    }

    const nodeElement = event.currentTarget;
    const rect = nodeElement.getBoundingClientRect();
    dragRef.current = {
      nodeId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };
    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null);
  }

  function handleAnchorPointerDown(event, nodeId, anchorType) {
    event.stopPropagation();

    if (anchorType !== "output" || !canvasRef.current) {
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
    setSelectedNodeId(null);
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
      setSelectedNodeId(null);
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
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setCablePreview(null);
  }

  function clearCanvas() {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setCablePreview(null);
  }

  return (
    <main className="app-shell">
      <div className="app-frame">
        <aside className="panel sidebar">
          <div className="sidebar-section">
            <h1 className="sidebar-title">Patch Notation Tool</h1>
            <p className="sidebar-copy">
              Drag symbols into the canvas and connect them with color-coded cables
              for sound, modulation, gate-trigger, and pitch flow.
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
            <button onClick={resetToSample}>Load sample patch</button>
            <button onClick={clearCanvas} className="danger">
              Clear canvas
            </button>
            <button
              disabled={!selectedNodeId && !selectedConnectionId}
              onClick={() => {
                if (selectedNodeId) {
                  removeNode(selectedNodeId);
                } else if (selectedConnectionId) {
                  removeConnection(selectedConnectionId);
                }
              }}
            >
              Delete selected
            </button>

            <span className="toolbar-note">
              Click a color below, then drag from a right anchor to a left anchor
              to create a cable. Drag from the left panel or click a symbol to
              place it.
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
            className="canvas"
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) {
                setSelectedNodeId(null);
                setSelectedConnectionId(null);
              }
            }}
          >
            {nodes.length === 0 ? (
              <div className="canvas-empty">
                Drop symbols here to sketch a patch, then drag between anchors to
                connect nodes.
              </div>
            ) : null}

            <svg className="canvas-overlay" width="100%" height="100%">
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
                      setSelectedNodeId(null);
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
                  className={`node-card ${selectedNodeId === node.id ? "selected" : ""}`}
                  style={{ left: node.x, top: node.y }}
                  onPointerDown={(event) => handleNodePointerDown(event, node.id)}
                  onClick={() => setSelectedNodeId(node.id)}
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

            {paletteDrag ? (
              <div
                className="palette-drag-preview"
                style={{
                  left: paletteDrag.x - NODE_WIDTH / 2,
                  top: paletteDrag.y - NODE_HEIGHT / 2
                }}
              >
                <div className="node-icon">
                  <SymbolIcon symbol={symbolMap[paletteDrag.symbolId]} size={62} />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
