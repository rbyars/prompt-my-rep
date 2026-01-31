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
      
      let baseUrl = origin
      if (!isLocalEnv && forwardedHost) {
        baseUrl = `https://${forwardedHost}`
      }

      const finalUrl = `${baseUrl}${next}${next.includes('?') ? '&' : '?' }refresh=${Date.now()}`

      // 🚨 THIS IS THE FIX 🚨
      // We return HTML with a meta refresh and JS redirect.
      // This forces the browser to process the Set-Cookie header 
      // BEFORE navigating to the dashboard.
      return new NextResponse(`
        <html>
          <head>
            <meta http-equiv="refresh" content="0;url=${finalUrl}" />
          </head>
          <body>
            <script>window.location.href = "${finalUrl}"</script>
          </body>
        </html>
      `, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
