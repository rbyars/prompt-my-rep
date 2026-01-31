import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') 
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      // 1. Determine the base URL
      let baseUrl = origin
      if (!isLocalEnv && forwardedHost) {
        baseUrl = `https://${forwardedHost}`
      }

      // 2. Add a random timestamp to FORCE the browser to refresh the page
      // This breaks the Next.js Router Cache for this specific navigation
      const refreshParam = `?t=${Date.now()}`
      const finalUrl = `${baseUrl}${next}${next.includes('?') ? '&' : '?' }refresh=${Date.now()}`

      return NextResponse.redirect(finalUrl)
    }
  }

  // ERROR: Redirect to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}