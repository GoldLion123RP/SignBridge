import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignBridge AI | Real-time ISL Translation",
  description: "Empowering the Deaf community with real-time Indian Sign Language translation using AI.",
  icons: {
    icon: "/SignBridge/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
