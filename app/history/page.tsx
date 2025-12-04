import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function HistoryPage() {
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
  if (!user) redirect('/login')

  // Fetch letters with the Article Title joined in
  // Note: We use the relational query syntax (articles:article_id)
  const { data: letters } = await supabase
    .from('letters')
    .select(`
      *,
      articles (title, url)
    `)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Letter History</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>

        {!letters || letters.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">You haven't written any letters yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {letters.map((letter: any) => (
              <div key={letter.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">
                      Re: {letter.articles?.title || "Unknown Article"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      To: {letter.recipient} • Saved on {new Date(letter.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wide">
                    {letter.status}
                  </span>
                </div>
                
                <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 font-serif whitespace-pre-wrap max-h-40 overflow-hidden relative">
                  {letter.content}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent"></div>
                </div>

                <div className="mt-4 flex gap-4">
                  <button className="text-blue-600 text-sm font-bold hover:underline">View Full Letter</button>
                  <button className="text-red-500 text-sm hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* PRIVACY LINK */}
        <div className="mt-12 border-t pt-8 text-center">
            <Link href="/profile" className="text-gray-400 text-sm hover:text-red-600 transition-colors">
                Manage Privacy & Account Settings
            </Link>
        </div>
      </div>
    </main>
  )
}