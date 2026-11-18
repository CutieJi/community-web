import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gather — Find your people",
  description: "A cozy corner of the internet for good conversations, creative projects, and new friends.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
