import Script from "next/script";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-0WGHC5ZGJ1";

export const metadata = {
  title: "Patch Notation Tool",
  description: "Drag-and-drop Eurorack and VCV Rack patch notation using Patch & Tweak inspired symbols."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
