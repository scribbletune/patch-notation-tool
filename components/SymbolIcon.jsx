import { getSymbolAssetPath } from "@/lib/symbols";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function SymbolIcon({ symbol, size = 72 }) {
  return (
    <img
      src={getSymbolAssetPath(symbol.id, basePath)}
      width={size}
      height={size}
      alt={symbol.label}
      className="symbol-icon-image"
      draggable="false"
    />
  );
}
