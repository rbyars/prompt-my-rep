'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AddressAutocomplete from '../components/AddressAutocomplete'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false) // NEW: Success state
  const [user, setUser] = useState<any>(null)
  
  // Form State
  const [fullName, setFullName] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [phone, setPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  
  // UI State for Address Field
  const [isEditingAddress, setIsEditingAddress] = useState(true)
  const [fullAddressString, setFullAddressString] = useState('')
  
  const [badges, setBadges] = useState<string[]>([])
  const [affiliation, setAffiliation] = useState('')
  const [isRegisteredVoter, setIsRegisteredVoter] = useState(false)

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
            setFullAddressString(profile.address)
            setIsEditingAddress(false)
            
            const parts = profile.address.split(',').map((s: string) => s.trim())
            if (parts.length >= 1) setStreetAddress(parts[0])
            if (parts.length >= 2) setCity(parts[1])
        } else {
            setIsEditingAddress(true)
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

  const handleAddressSelect = (addr: { street: string, city: string, state: string, zip: string }) => {
    setStreetAddress(addr.street)
    setCity(addr.city)
    setState(addr.state)
    setZipCode(addr.zip)
    setIsEditingAddress(false)
  }

  const toggleBadge = (badge: string) => {
    if (badges.includes(badge)) {
      setBadges(badges.filter(b => b !== badge))
    } else {
      setBadges([...badges, badge])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false) // Reset success message
    
    // Construct the address string
    const combinedAddress = `${streetAddress}, ${city}, ${state} ${zipCode}`.trim()
    
    // 1. Refresh Representatives if address changed or is new
    if (combinedAddress) {
        console.log("Updating Reps for:", combinedAddress)
        await fetch('/api/reps/lookup', {
          method: 'POST', 
          body: JSON.stringify({ address: combinedAddress })
        })
    }

    // 2. Save Profile
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

    setSaving(false)

    if (error) {
      alert("Error: " + error.message) // Keep error alerts (important)
    } else {
      // Show Visual Success instead of Popup
      setSaveSuccess(true)
      // Auto-hide after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    }
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
        
        <section className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Contact Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="w-full p-2 border rounded-md bg-gray-50" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="w-full p-2 border rounded-md bg-gray-50" />
                </div>
            </div>

            {/* ADDRESS SECTION: TOGGLE VIEW/EDIT */}
            <div>
               <label className="block text-sm font-medium mb-1">Address</label>
               
               {!isEditingAddress && streetAddress ? (
                 // VIEW MODE
                 <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between group">
                    <div className="flex items-start gap-3">
                        <div className="text-xl mt-0.5">📍</div>
                        <div>
                            <p className="font-bold text-gray-900 leading-tight">{streetAddress}</p>
                            <p className="text-sm text-gray-600 mt-0.5">
                                {city}{state ? `, ${state}` : ''} {zipCode}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsEditingAddress(true)}
                        className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 font-medium transition-all"
                    >
                        Change
                    </button>
                 </div>
               ) : (
                 // EDIT MODE
                 <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                   <AddressAutocomplete 
                      defaultValue={fullAddressString} 
                      onSelect={handleAddressSelect} 
                   />
                   {streetAddress && (
                       <div className="text-right mt-2">
                           <button 
                             onClick={() => setIsEditingAddress(false)} 
                             className="text-xs text-gray-500 hover:text-gray-800 underline"
                           >
                             Cancel & Keep Existing
                           </button>
                       </div>
                   )}
                 </div>
               )}
            </div>
        </section>

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
                    className="w-full p-2 border rounded-md bg-gray-50" 
                />
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

        {/* UPDATED SAVE BUTTON & SUCCESS MESSAGE */}
        <div className="pt-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                saving 
                ? 'bg-gray-700 cursor-not-allowed text-gray-300' 
                : 'bg-gray-900 text-white hover:bg-black hover:-translate-y-0.5'
            }`}
          >
            {saving && (
                // Simple SVG Spinner
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {saving ? 'Updating Reps & Saving...' : 'Save Profile Settings'}
          </button>
          
          {/* Success Message */}
          {saveSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm text-center font-medium animate-in fade-in slide-in-from-bottom-2">
                  ✅ Profile updated and Representatives refreshed!
              </div>
          )}
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