import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import LandingPage from './components/LandingPage'

// Accept searchParams prop
export default async function Home(props: { searchParams?: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const repId = searchParams?.repId; 

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // 🚨 CRITICAL FIX: Changed from get() to getAll()
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 1. If NOT logged in, show the public Landing Page
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

  // 2. If Logged in but NO articles, show the "Welcome / Onboarding" View
  if (articles.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-blue-600 p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">Welcome to your Dashboard! 👋</h1>
            <p className="text-blue-100">You&apos;re all set up. Let&apos;s get your first letter written.</p>
          </div>
          
          <div className="p-8 md:p-12">
            <div className="grid gap-8 md:grid-cols-2 items-center">
              
              {/* Step 1: Install Extension */}
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-xl">1</div>
                <h3 className="text-xl font-bold text-gray-900">Get the Browser Extension</h3>
                <p className="text-gray-500 leading-relaxed">
                  Our Chrome extension lets you save news articles while you browse. It&apos;s the easiest way to queue up topics for your representatives.
                </p>
                <a 
                  href="https://chromewebstore.google.com/detail/prompt-my-rep/coemcfcdomgidddhpjcdldkidgmcflic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                >
                  Install Extension &rarr;
                </a>
              </div>

              {/* Step 2: Visual/Instruction */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-4">How it works:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="text-xl">📰</span>
                    <span className="text-sm text-gray-600">Browse news on any major site (CNN, Fox, NYT, etc).</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl">🖱️</span>
                    <span className="text-sm text-gray-600">Click the extension icon to save the article instantly.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-xl">✍️</span>
                    <span className="text-sm text-gray-600">Come back here to generate a letter to your rep.</span>
                  </li>
                </ul>
              </div>

            </div>
          </div>
          
          {/* Footer of Onboarding */}
          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
             <Link href="/profile" className="text-sm text-gray-500 hover:text-blue-600">
                Complete your user profile while you wait &rarr;
             </Link>
          </div>
        </div>
      </div>
    )
  }

  // 3. If Logged in AND has articles, show the standard Dashboard
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
    </div>
  )
}