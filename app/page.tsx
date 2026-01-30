import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import LandingPage from './components/LandingPage'

// Accept searchParams prop
export default async function Home(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const repId = searchParams?.repId; // Capture the repId if present

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <LandingPage />
  }

  // Fetch Articles
  let articles: any[] = []
  const { data } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
  articles = data || []

  return (
    <div className="w-full max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
          {repId ? (
             <p className="text-blue-600 font-medium">Select an article to write about.</p>
          ) : (
             <p className="text-gray-500">Manage your saved articles and drafts.</p>
          )}
        </div>
        <Link href="/profile" className="text-sm text-blue-600 font-medium hover:underline">
          My Profile &rarr;
        </Link>
      </div>

      {/* ARTICLE GRID */}
      {articles.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-gray-300 rounded-xl text-center bg-white">
          <p className="text-4xl mb-4">📰</p>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No articles saved yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Install the Chrome Extension to save news articles while you browse the web.
          </p>
          {/* UPDATED: Link to Chrome Web Store */}
          <a 
            href="https://chromewebstore.google.com/detail/prompt-my-rep/coemcfcdomgidddhpjcdldkidgmcflic"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gray-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            Get Extension
          </a>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <div key={article.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow flex flex-col h-full">
              <div className="flex-1 mb-4">
                <h3 className="font-bold text-lg mb-2 line-clamp-3 text-gray-900 leading-snug">
                  {article.title}
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Source: {new URL(article.url).hostname}
                </p>
              </div>
              
              <div className="mt-auto space-y-3">
                {/* LINK UPDATED: Pass repId forward if it exists */}
                <Link 
                  href={`/write/${article.id}${repId ? `?repId=${repId}` : ''}`} 
                  className="block w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold text-center hover:bg-blue-700 transition-colors text-sm"
                >
                  Write Letter
                </Link>
                <a href={article.url} target="_blank" className="block w-full text-center text-gray-400 text-xs hover:text-gray-600">
                  View Original
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}