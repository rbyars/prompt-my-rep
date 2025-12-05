import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar"; // Import the new component

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Prompt My Rep",
  description: "AI-powered constituent advocacy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-50 text-gray-900">
          
          {/* THE NEW SMART SIDEBAR */}
          <Sidebar />

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 md:ml-64 p-4 md:p-8">
            {children}
          </main>
          
        </div>
      </body>
    </html>
  );
}