'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Initialize Supabase Client for the browser
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    // Magic Link Login Logic
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        // This tells Supabase where to send you after you click the email link
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Success! Check your email for the login link.')
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-black">
      <h1 className="text-2xl font-bold mb-6">Log in to Prompt My Rep</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 border border-gray-300 rounded text-black"
          required
        />
        <button 
          disabled={loading}
          className="bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending link...' : 'Send Magic Link'}
        </button>
      </form>
      {message && <p className="mt-4 text-sm font-medium">{message}</p>}
    </div>
  )
}