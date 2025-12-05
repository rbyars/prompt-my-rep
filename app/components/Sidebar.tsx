'use client'

import { createBrowserClient } from '@supabase/ssr'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname() // Hooks to check current page
  const [loggingOut, setLoggingOut] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh() // Clear server cache so the app knows you are gone
    setLoggingOut(false)
  }

  // Hide sidebar on login page
  if (pathname === '/login') return null

  return (
     <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-20">
            <div className="p-6 border-b border-gray-100">
              <Link href="/" className="text-xl font-bold text-blue-900 tracking-tight">
                Prompt My Rep™
              </Link>
            </div>
            
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <NavLink href="/" icon="🏠" label="Dashboard" active={pathname === '/'} />
              <NavLink href="/history" icon="📂" label="Letter History" active={pathname === '/history'} />
              <NavLink href="/profile" icon="⚙️" label="Settings & Profile" active={pathname === '/profile'} />
            </nav>

            <div className="p-4 border-t border-gray-100 space-y-4">
              
              {/* LOGOUT BUTTON */}
              <button 
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-3 px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm w-full text-left"
              >
                <span className="text-lg">🚪</span>
                {loggingOut ? 'Signing out...' : 'Log Out'}
              </button>

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
  )
}

// Helper for the links
function NavLink({ href, icon, label, active }: { href: string; icon: string; label: string; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  )
}