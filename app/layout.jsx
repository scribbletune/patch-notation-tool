import "./globals.css";

export const metadata = {
  title: "Patch Notation Tool",
  description: "Drag-and-drop Eurorack and VCV Rack patch notation using Patch & Tweak inspired symbols."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
