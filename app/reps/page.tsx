'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MyRepsPage() {
  const router = useRouter()
  const [reps, setReps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadReps() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('user_reps')
        .select(`
          is_primary,
          representatives (
            id,
            name,
            role,
            level,
            party,
            state,
            district,
            photo_url,
            phone,
            website
          )
        `)
        .eq('user_id', user.id)
      
      if (data) {
        setReps(data.map((r: any) => r.representatives))
      }
      setLoading(false)
    }
    loadReps()
  }, [router, supabase])

  // --- HELPER: Get Dynamic Flag URL ---
  const getFlagBackground = (rep: any) => {
    if (rep.level === 'federal') {
        return `url('https://flagcdn.com/w640/us.png')`;
    } else {
        const stateCode = rep.state ? rep.state.toLowerCase() : '';
        return `url('https://flagcdn.com/w640/us-${stateCode}.png')`;
    }
  }

  if (loading) return <div className="p-12 text-center">Loading your representatives...</div>

  if (reps.length === 0) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">No Representatives Found</h2>
        <p className="mb-6 text-gray-600">
            We need your address to find your elected officials.
        </p>
        <Link href="/profile" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700">
            Update Profile
        </Link>
      </div>
    )
  }

  // Sort: Federal first, then State
  const sortedReps = [...reps].sort((a, b) => {
    const isFederalA = a.level === 'federal';
    const isFederalB = b.level === 'federal';
    if (isFederalA && !isFederalB) return -1;
    if (!isFederalA && isFederalB) return 1;
    return 0;
  })

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Representatives</h1>
        <p className="text-gray-500">The elected officials representing you in Congress and the State House.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedReps.map((rep) => (
          <div key={rep.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
            
            <div 
                className="h-32 relative bg-cover bg-center"
                style={{ 
                    backgroundImage: getFlagBackground(rep),
                    backgroundColor: '#f3f4f6'
                }}
            >
                <div className="absolute inset-0 bg-black/10"></div>
                {rep.photo_url ? (
                    <img 
                        src={rep.photo_url} 
                        alt={rep.name}
                        className="absolute bottom-0 left-6 translate-y-1/2 w-24 h-24 rounded-full border-4 border-white object-cover bg-white shadow-sm"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} 
                    />
                ) : (
                    <div className="absolute bottom-0 left-6 translate-y-1/2 w-24 h-24 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center text-3xl shadow-sm">
                        🏛️
                    </div>
                )}
            </div>

            <div className="pt-16 pb-6 px-6 flex-1 flex flex-col">
                <div className="mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${
                        rep.party?.includes('Democrat') ? 'bg-blue-100 text-blue-800' :
                        rep.party?.includes('Republican') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                        {rep.party || 'Unknown Party'}
                    </span>
                    <span className="ml-2 text-xs font-medium text-gray-400 uppercase">
                        {rep.level === 'federal' ? '🇺🇸 Federal' : '🏛️ State'}
                    </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 leading-tight mb-1">{rep.name}</h3>
                <p className="text-sm text-gray-500 mb-4 font-medium">{rep.role} • {rep.state}-{rep.district}</p>

                <div className="space-y-2 text-sm text-gray-600 mb-6">
                    {rep.phone && (
                        <div className="flex items-center gap-2">
                            <span>📞</span> <a href={`tel:${rep.phone}`} className="hover:underline">{rep.phone}</a>
                        </div>
                    )}
                    {rep.website && (
                        <div className="flex items-center gap-2">
                            <span>🌐</span>
                            <a href={rep.website} target="_blank" className="text-blue-600 hover:underline block truncate max-w-[200px]">
                                Official Website
                            </a>
                        </div>
                    )}
                </div>

                <div className="mt-auto">
                    {/* LINK UPDATED: Pass repId to Dashboard */}
                    <Link 
                        href={`/?repId=${rep.id}`} 
                        className="block w-full py-2 text-center border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                    >
                        Draft Letter to Rep
                    </Link>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}