'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('') // Clear any old messages
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // ⚠️ This is the key line. It sends the user to your server-side route 
        // to set the cookie before they see the dashboard.
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      alert(error.message)
    } else {
      setMessage('Check your email for the login link!')
      setEmail('') // Clear the input for better UX
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100">
        
        {/* Logo / Icon */}
        <div className="mb-6 bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto">
          🗳️
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
        <p className="text-gray-500 mb-8">Sign in to manage your civic engagement.</p>

        {/* Magic Link Form */}
        {message ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm mb-4 border border-green-100">
            <p className="font-bold">Email sent!</p>
            <p>{message}</p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending Link...' : 'Send Login Link'}
            </button>
          </form>
        )}

        {/* LEGAL DISCLAIMER */}
        <p className="text-xs text-gray-400 text-center mt-6 px-4 leading-relaxed">
          By continuing, you agree to our 
          <a href="/terms" className="underline hover:text-gray-600 mx-1">Terms of Service</a> 
          and 
          <a href="/privacy" className="underline hover:text-gray-600 mx-1">Privacy Policy</a>.
        </p>

      </div>
    </div>
  )
}