'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Profile Form State
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [badges, setBadges] = useState<string[]>([])

  // The list of "Power Badges"
  const AVAILABLE_BADGES = [
    "Veteran 🎖️",
    "Parent 👨‍👩‍👧",
    "Small Business Owner 💼",
    "Educator 🍎",
    "Healthcare Worker 🩺",
    "First Responder 🚑",
    "Union Member 👷",
    "Student 🎓"
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

      // Fetch existing profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setFullName(profile.full_name || '')
        setCity(profile.address || '') // We'll use 'address' field for City for now
        setZipCode(profile.zip_code || '') // Note: We might need to add this column or store in JSON
        setBadges(profile.civic_roles || [])
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
    
    // Upsert means "Update if exists, Insert if new"
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        address: city, // Storing City in address field for MVP
        civic_roles: badges,
        updated_at: new Date().toISOString()
      })

    if (error) {
      alert("Error saving profile: " + error.message)
    } else {
      alert("Profile updated successfully!")
    }
    setSaving(false)
  }

  // Reuse the delete logic from before
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

  if (loading) return <div className="p-12">Loading Settings...</div>

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold mb-2">Profile & Authenticity</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Providing these details helps the AI write letters that Representatives actually read.
      </p>
      
      <div className="space-y-6">
        
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full p-3 border rounded-lg bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Your City</label>
            <input 
              type="text" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Durham, NC"
              className="w-full p-3 border rounded-lg bg-gray-50"
            />
          </div>
        </div>

        {/* Civic Badges */}
        <div>
          <label className="block text-sm font-bold mb-3">
            Civic Roles <span className="font-normal text-gray-400">(Select all that apply)</span>
          </label>
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

        {/* Save Button */}
        <div className="pt-6 border-t">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-black w-full"
          >
            {saving ? 'Saving...' : 'Save Profile Settings'}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="pt-12 mt-12 border-t">
          <h3 className="text-red-600 font-bold text-sm uppercase mb-4">Danger Zone</h3>
          <button onClick={handleDeleteAccount} className="text-red-500 text-sm hover:underline">
            Delete my account permanently
          </button>
        </div>

      </div>
    </div>
  )
}