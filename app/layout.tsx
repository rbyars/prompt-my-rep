import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

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
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-20">
            <div className="p-6 border-b border-gray-100">
              <Link href="/" className="text-xl font-bold text-blue-900 tracking-tight">
                Prompt My Rep™
              </Link>
            </div>
            
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <NavLink href="/" icon="🏠" label="Dashboard" />
              <NavLink href="/history" icon="📂" label="Letter History" />
              <NavLink href="/profile" icon="⚙️" label="Settings & Profile" />
            </nav>

            <div className="p-4 border-t border-gray-100">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-blue-600 font-bold mb-1">PRO TIP</p>
                <p className="text-xs text-blue-800">
                  Adding your address makes letters 3x more effective.
                </p>
                <Link href="/profile" className="text-xs underline text-blue-600 mt-2 block">
                  Update Profile &rarr;
                </Link>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 md:ml-64 p-4 md:p-8">
            {children}
          </main>
          
        </div>
      </body>
    </html>
  );
}

// Helper Component for Links
function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  )
}