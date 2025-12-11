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

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
        alert("Login failed: " + error.message)
        setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      alert(error.message)
    } else {
      setMessage('Check your email for the login link!')
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

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-500 mb-8">Sign in to manage your civic engagement.</p>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm mb-6"
        >
          {loading ? (
            <span>Connecting...</span>
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Continue with Google
            </>
          )}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Magic Link Form */}
        {message ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm mb-4">
            {message}
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50"
            >
              {loading ? 'Sending Link...' : 'Send Login Link'}
            </button>
          </form>
        )}

        {/* LEGAL DISCLAIMER (Clickwrap) */}
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