import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edit — free browser video editor",
  description: "A free, no-signup video editor that runs entirely in your browser.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
