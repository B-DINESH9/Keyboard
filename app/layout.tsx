import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dinesh Keyboard — Engineered Clarity",
  description:
    "Precision tangerine-orange anodized aluminum mechanical keyboard. Scroll to explore its layered engineering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-black/10 selection:text-black">
        {children}
      </body>
    </html>
  );
}
