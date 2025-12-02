import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'

export default async function Home() {
  const cookieStore = await cookies()

  // 1. Initialize Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
      },
    }
  )

  // 2. Check Auth
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Fetch Articles (If logged in)
  let articles: any[] = []
  if (user) {
    const { data } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
    articles = data || []
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-50 text-gray-900">
      
      {/* HEADER */}
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-blue-900">Prompt My Rep™</h1>
        <div className="flex gap-4">
          {!user ? (
            <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Log In
            </Link>
          ) : (
            <span className="text-gray-500">Welcome back, Citizen.</span>
          )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="w-full max-w-5xl">
        {!user ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-semibold mb-4">Turn Rage into Action.</h2>
            <p className="mb-8 text-gray-600">Download the extension to start saving articles.</p>
            <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">
              Get Started
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Saved Articles</h2>
            
            {articles.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                <p>No articles saved yet.</p>
                <p className="text-sm mt-2">Use the Chrome Extension to save your first one!</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <div key={article.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
                    <a href={article.url} target="_blank" className="text-blue-500 text-sm hover:underline block mb-4">
                      View Original Source &rarr;
                    </a>
                    <button className="w-full bg-gray-900 text-white py-2 rounded mt-auto hover:bg-gray-800">
                      Write Letter
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}