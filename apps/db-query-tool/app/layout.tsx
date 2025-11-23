import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Database Query Tool",
  description: "Query your database with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

