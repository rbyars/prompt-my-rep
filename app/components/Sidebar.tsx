'use client'

import { createBrowserClient } from '@supabase/ssr'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false) // State for collapse

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
    setLoggingOut(false)
  }

  // Auto-collapse on small screens if desired, or load from local storage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-collapsed')
    if (savedState === 'true') setIsCollapsed(true)
  }, [])

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  if (pathname === '/login') return null

  return (
    <aside 
      className={`bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-20 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header & Toggle */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        {!isCollapsed && (
          <Link href="/" className="text-xl font-bold text-blue-900 tracking-tight whitespace-nowrap overflow-hidden">
            Prompt My Rep™
          </Link>
        )}
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors mx-auto"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? '➡️' : '⬅️'}
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden">
        <NavLink href="/" icon="🏠" label="Dashboard" active={pathname === '/'} collapsed={isCollapsed} />
        <NavLink href="/reps" icon="🏛️" label="My Representatives" active={pathname === '/reps'} collapsed={isCollapsed} />
        <NavLink href="/history" icon="📂" label="Letter History" active={pathname === '/history'} collapsed={isCollapsed} />
        <NavLink href="/profile" icon="⚙️" label="Settings & Profile" active={pathname === '/profile'} collapsed={isCollapsed} />
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-gray-100 space-y-4">
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          disabled={loggingOut}
          className={`flex items-center gap-3 px-3 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm w-full text-left ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title="Log Out"
        >
          <span className="text-lg">🚪</span>
          {!isCollapsed && (loggingOut ? 'Signing out...' : 'Log Out')}
        </button>

        {/* Pro Tip Box - Hide when collapsed */}
        {!isCollapsed && (
          <div className="bg-blue-50 p-4 rounded-lg animate-in fade-in duration-300">
            <p className="text-xs text-blue-600 font-bold mb-1">PRO TIP</p>
            <p className="text-xs text-blue-800">
              Adding your address makes letters 3x more effective.
            </p>
            <Link href="/profile" className="text-xs underline text-blue-600 mt-2 block">
              Update Profile &rarr;
            </Link>
            
            <div className="flex flex-col gap-1 mt-4 pt-4 border-t border-blue-100/50">
              <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 block">
                Privacy Policy
              </Link>
              <Link href="/support" className="text-xs text-gray-400 hover:text-gray-600 block">
                Help & Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

// Updated Helper for Links with Collapsed Prop
function NavLink({ href, icon, label, active, collapsed }: { href: string; icon: string; label: string; active: boolean; collapsed: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors font-medium text-sm ${
        active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
      } ${collapsed ? 'justify-center' : ''}`}
      title={collapsed ? label : ''}
    >
      <span className="text-xl shrink-0">{icon}</span>
      
      {!collapsed && (
        <span className="whitespace-nowrap overflow-hidden transition-all duration-300">
          {label}
        </span>
      )}
    </Link>
  )
}