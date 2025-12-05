'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Form State
  const [fullName, setFullName] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [phone, setPhone] = useState('') // NEW
  const [jobTitle, setJobTitle] = useState('') // NEW
  
  // Badges & Politics
  const [badges, setBadges] = useState<string[]>([])
  const [affiliation, setAffiliation] = useState('')
  const [isRegisteredVoter, setIsRegisteredVoter] = useState(false) // NEW

  const AVAILABLE_BADGES = [
    "Veteran 🎖️", "Parent 👨‍👩‍👧", "Small Business Owner 💼", 
    "Educator 🍎", "Healthcare Worker 🩺", "First Responder 🚑", 
    "Union Member 👷", "Student 🎓"
  ]

  const PARTIES = [
    "Democrat", "Republican", "Independent", "Libertarian", "Green Party", "Unaffiliated"
  ]

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setFullName(profile.full_name || '')
        setPhone(profile.phone || '')
        setJobTitle(profile.job_title || '')
        setIsRegisteredVoter(profile.is_registered_voter || false)

        if (profile.address) {
            const parts = profile.address.split(',').map((s: string) => s.trim())
            if (parts.length >= 1) setStreetAddress(parts[0])
            if (parts.length >= 2) setCity(parts[1])
            // State/Zip parsing omitted for MVP simplicity, user can just re-enter
        }

        const savedRoles = profile.civic_roles || []
        const foundParty = savedRoles.find((r: string) => PARTIES.includes(r))
        const otherBadges = savedRoles.filter((r: string) => !PARTIES.includes(r))

        if (foundParty) setAffiliation(foundParty)
        setBadges(otherBadges)
      }
      setLoading(false)
    }
    loadProfile()
  }, [router, supabase])

  const toggleBadge = (badge: string) => {
    if (badges.includes(badge)) {
      setBadges(badges.filter(b => b !== badge))
    } else {
      setBadges([...badges, badge])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    const combinedAddress = `${streetAddress}, ${city}, ${state} ${zipCode}`.trim()
    
    const finalRoles = [...badges]
    if (affiliation) finalRoles.push(affiliation)

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        address: combinedAddress,
        phone: phone,
        job_title: jobTitle,
        is_registered_voter: isRegisteredVoter,
        civic_roles: finalRoles,
        updated_at: new Date().toISOString()
      })

    if (error) {
      alert("Error: " + error.message)
    } else {
      alert("Profile updated!")
    }
    setSaving(false)
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This deletes everything.")) return
    const response = await fetch('/api/auth/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id })
    })
    if (response.ok) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  if (loading) return <div className="p-12 text-center">Loading Settings...</div>

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold mb-2">Profile & Authenticity</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Complete your profile to generate "bulletproof" constituent letters.
      </p>
      
      <div className="space-y-8">
        
        {/* Basic Info */}
        <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Contact Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="w-full p-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="w-full p-2 border rounded-md" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Street Address</label>
                <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="123 Main St" className="w-full p-2 border rounded-md" />
            </div>
            <div className="grid grid-cols-6 gap-4">
                <div className="col-span-3">
                    <label className="block text-sm font-medium mb-1">City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Durham" className="w-full p-2 border rounded-md" />
                </div>
                <div className="col-span-1">
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="NC" className="w-full p-2 border rounded-md" />
                </div>
                <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Zip</label>
                    <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="27701" className="w-full p-2 border rounded-md" />
                </div>
            </div>
        </section>

        {/* Political & Civic */}
        <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Authenticity Markers</h3>
            
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 bg-blue-50 border-blue-200">
                <input 
                    type="checkbox" 
                    checked={isRegisteredVoter} 
                    onChange={(e) => setIsRegisteredVoter(e.target.checked)}
                    className="w-5 h-5 text-blue-600"
                />
                <span className="font-bold text-blue-900">I am a Registered Voter</span>
            </label>

            <div>
                <label className="block text-sm font-medium mb-2">Political Affiliation</label>
                <select 
                    value={affiliation} 
                    onChange={(e) => setAffiliation(e.target.value)}
                    className="w-full p-2 border rounded-md bg-white"
                >
                    <option value="">Prefer not to say</option>
                    {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
            
             <div>
                <label className="block text-sm font-medium mb-1">Specific Job Title / Employer</label>
                <input 
                    type="text" 
                    value={jobTitle} 
                    onChange={(e) => setJobTitle(e.target.value)} 
                    placeholder="e.g. ICU Nurse at Duke Hospital" 
                    className="w-full p-2 border rounded-md" 
                />
                <p className="text-xs text-gray-500 mt-1">Specific titles carry more weight than generic categories.</p>
            </div>

            <div>
                <label className="block text-sm font-medium mb-3">Civic Badges</label>
                <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_BADGES.map(badge => (
                    <button
                        key={badge}
                        onClick={() => toggleBadge(badge)}
                        className={`p-3 rounded-lg border text-left text-sm transition-all ${
                        badges.includes(badge) 
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-sm' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                        {badges.includes(badge) ? '✓ ' : '+ '} {badge}
                    </button>
                    ))}
                </div>
            </div>
        </section>

        {/* Save Button */}
        <div className="pt-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-black w-full shadow-lg"
          >
            {saving ? 'Saving...' : 'Save Profile Settings'}
          </button>
        </div>

        <div className="pt-8 mt-8 border-t text-center">
          <button onClick={handleDeleteAccount} className="text-red-500 text-xs hover:underline">
            Delete my account permanently
          </button>
        </div>

      </div>
    </div>
  )
}