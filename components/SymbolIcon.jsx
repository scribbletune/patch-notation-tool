import { buildSymbolInnerMarkup } from "@/lib/symbolPrimitives";

export default function SymbolIcon({ symbol, size = 72 }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-label={symbol.label}
      role="img"
      dangerouslySetInnerHTML={{ __html: buildSymbolInnerMarkup(symbol) }}
    />
  );
}
