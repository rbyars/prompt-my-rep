'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ComposerPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // Data State
  const [article, setArticle] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null) // Stores full profile
  
  // Composer State
  const [mode, setMode] = useState<'letter' | 'phone'>('letter')
  const [sentiment, setSentiment] = useState('concerned')
  const [action, setAction] = useState('vote_no')
  const [personalContext, setPersonalContext] = useState('')
  const [generatedContent, setGeneratedContent] = useState('')
  const [chatInput, setChatInput] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function loadData() {
      // 1. Check Auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // 2. Fetch Article
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .eq('id', params.id)
        .single()
      
      if (articleError) {
        alert('Article not found')
        router.push('/')
      } else {
        setArticle(articleData)
      }

      // 3. Fetch User Profile (Authenticity Data)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setUserProfile(profileData)
      }

      setLoading(false)
    }
    loadData()
  }, [params.id, router, supabase])

  // --- 1. GENERATE DRAFT ---
  const handleGenerate = async () => {
    setGenerating(true)
    
    // Construct the "Authenticity Context"
    const badges = userProfile?.civic_roles || []
    const badgeIntro = badges.length > 0 ? `I am a ${badges.join(', ')}. ` : ""
    const voterStatus = userProfile?.is_registered_voter ? "I am a registered voter. " : ""
    const jobInfo = userProfile?.job_title ? `I work as a ${userProfile.job_title}. ` : ""
    
    // Combine everything into one context string for the AI
    const fullPersonalContext = `${voterStatus}${badgeIntro}${jobInfo}${personalContext}`

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleTitle: article.title,
          articleText: article.clean_text,
          sentiment,
          action,
          personalContext: fullPersonalContext, 
          mode,
          userName: userProfile?.full_name || "A Concerned Citizen",
          userCity: userProfile?.address || "My District"
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedContent(data.letter)
      } else {
        alert("Error generating letter: " + (data.error || "Unknown server error"))
      }
    } catch (err) {
      console.error(err)
      alert("Network error. Please check your connection.")
    } finally {
      setGenerating(false)
    }
  }

  // --- 2. REFINE DRAFT ---
  const handleRefine = async () => {
    if (!chatInput.trim()) return;
    setGenerating(true)
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentDraft: generatedContent,
          refinementInstructions: chatInput,
          isRefinement: true,
          articleTitle: article.title,
          articleText: article.clean_text,
          mode
        })
      })

      const data = await response.json()
      if (data.success) {
        setGeneratedContent(data.letter)
        setChatInput('')
      } else {
        alert("Error refining letter: " + data.error)
      }
    } catch (err) {
      alert("Network error during refinement.")
    } finally {
      setGenerating(false)
    }
  }

  // --- 3. SAVE TO HISTORY ---
  const handleSave = async () => {
    if (!generatedContent) return
    
    try {
      const { error } = await supabase
        .from('letters')
        .insert({
          user_id: user.id,
          article_id: article.id,
          content: generatedContent,
          status: 'draft',
          recipient: 'Sen. John Fetterman'
        })

      if (error) throw error
      
      router.push('/history')
      
    } catch (err: any) {
      console.error(err)
      alert("Error saving letter: " + err.message)
    }
  }

  if (loading) return <div className="p-12 text-center">Loading Workspace...</div>

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-lg truncate max-w-xl">{article?.title}</h1>
          <p className="text-xs text-gray-500">Source: {article?.url ? new URL(article.url).hostname : 'Unknown'}</p>
        </div>
        
        <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <div className="h-8 w-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">SF</div>
          <div className="text-sm hidden sm:block">
            <p className="font-bold leading-none">Sen. John Fetterman</p>
            <p className="text-xs text-blue-600">PA (Democrat)</p>
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto w-full">
        
        {/* LEFT COLUMN */}
        <div className="p-6 border-r border-gray-200 bg-white overflow-y-auto h-[calc(100vh-80px)]">
          
          <div className="flex bg-gray-100 p-1 rounded-lg mb-8">
            <button onClick={() => setMode('letter')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'letter' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>✉️ Formal Letter</button>
            <button onClick={() => setMode('phone')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'phone' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>📞 Phone Script</button>
          </div>

          <div className="space-y-6">
            
            {/* SENTIMENT */}
            <div>
              <label className="block text-sm font-bold mb-3">Your Stance</label>
              <div className="grid grid-cols-3 gap-3">
                {['😡 Angry', '😟 Concerned', '😃 Support'].map((m) => (
                  <button key={m} onClick={() => setSentiment(m)} className={`p-3 border rounded-lg text-sm ${sentiment === m ? 'border-blue-500 bg-blue-50 font-bold' : 'hover:bg-gray-50'}`}>{m}</button>
                ))}
              </div>
            </div>

            {/* ACTION DROPDOWN */}
            <div>
              <label className="block text-sm font-bold mb-2">What should the Rep do?</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full p-3 border rounded-lg bg-white text-sm">
                <option value="vote_no">Vote NO on this legislation</option>
                <option value="vote_yes">Vote YES on this legislation</option>
                <option value="statement">Make a public statement</option>
                <option value="meeting">Schedule a meeting</option>
                <option value="co-sponsor">Co-sponsor the bill</option>
              </select>
            </div>

            {/* PERSONAL CONTEXT */}
            <div>
              <label className="block text-sm font-bold mb-2">
                Why does this matter to you? <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <textarea value={personalContext} onChange={(e) => setPersonalContext(e.target.value)} placeholder="e.g. As a small business owner..." className="w-full p-3 border rounded-lg text-sm h-24 resize-none" />
            </div>

            {/* GENERATE BUTTON */}
            {!generatedContent && (
              <button onClick={handleGenerate} disabled={generating} className="w-full bg-gray-900 text-white py-4 rounded-lg font-bold hover:bg-black disabled:opacity-50">
                {generating ? 'Thinking...' : 'Generate First Draft'}
              </button>
            )}

            {/* CHAT INPUT */}
            {generatedContent && (
              <div className="mt-8 border-t pt-6">
                <label className="block text-sm font-bold mb-2">Refine with AI</label>
                <div className="flex gap-2">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="e.g. 'Make it shorter'" className="flex-1 p-3 border rounded-lg text-sm" onKeyDown={(e) => e.key === 'Enter' && handleRefine()} />
                  <button onClick={handleRefine} disabled={generating} className="bg-blue-100 text-blue-700 px-4 rounded-lg font-bold hover:bg-blue-200">{generating ? '...' : 'Update'}</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="p-6 bg-gray-50 h-[calc(100vh-80px)] overflow-y-auto">
          <div className="max-w-2xl mx-auto bg-white shadow-sm border border-gray-200 min-h-[500px] p-8 rounded-none md:rounded-lg">
            {!generatedContent ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                <p className="text-4xl mb-4">📄</p>
                <p>Your draft will appear here.</p>
              </div>
            ) : (
              <textarea value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} className="w-full h-full min-h-[500px] resize-none focus:outline-none font-serif text-lg leading-relaxed text-gray-800" />
            )}
          </div>
          
          {generatedContent && (
             <div className="max-w-2xl mx-auto mt-4 flex justify-end gap-3">
               <button onClick={handleSave} className="text-gray-500 hover:text-gray-800 font-medium text-sm">Save to History</button>
               <button onClick={() => navigator.clipboard.writeText(generatedContent)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md">
                 Copy to Clipboard
               </button>
             </div>
          )}
        </div>

      </div>
    </main>
  )
}