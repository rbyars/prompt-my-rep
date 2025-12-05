'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ComposerPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  
  // Data State
  const [article, setArticle] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Rep State
  const [reps, setReps] = useState<any[]>([])
  const [selectedRep, setSelectedRep] = useState<any>(null)
  
  // Composer State: Updated to 3 modes
  const [mode, setMode] = useState<'postal' | 'email' | 'phone'>('postal')
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
      // 1. Auth Check
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      // 2. Fetch Article
      const { data: articleData } = await supabase
        .from('articles')
        .select('*')
        .eq('id', params.id)
        .single()
      setArticle(articleData)

      // 3. Fetch User Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setUserProfile(profileData)

      // 4. Fetch User's Reps (The Rolodex)
      const { data: repData } = await supabase
        .from('user_reps')
        .select(`
          is_primary,
          representatives (
            id,
            name,
            role,
            level,
            party,
            state,
            district,
            photo_url,
            phone,
            website,
            email
          )
        `)
        .eq('user_id', user.id)
      
      if (repData && repData.length > 0) {
        const loadedReps = repData.map((r: any) => r.representatives)
        // Sort federal first
        loadedReps.sort((a: any, b: any) => (a.level === 'federal' ? -1 : 1))
        
        setReps(loadedReps)
        
        // Default to Federal Rep if available, otherwise just the first one found
        const federalRep = loadedReps.find((r: any) => r.level === 'federal')
        setSelectedRep(federalRep || loadedReps[0])
      }

      setLoading(false)
    }
    loadData()
  }, [params.id, router, supabase])

  // --- GENERATE DRAFT ---
  const handleGenerate = async () => {
    if (!selectedRep) {
        alert("Please select a representative first.")
        return
    }
    setGenerating(true)
    
    // Construct Authenticity Context
    const badges = userProfile?.civic_roles || []
    const badgeIntro = badges.length > 0 ? `I am a ${badges.join(', ')}. ` : ""
    const voterStatus = userProfile?.is_registered_voter ? "I am a registered voter. " : ""
    const jobInfo = userProfile?.job_title ? `I work as a ${userProfile.job_title}. ` : ""
    
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
          mode, // Now sends 'postal', 'email', or 'phone'
          userName: userProfile?.full_name || "A Concerned Citizen",
          userCity: userProfile?.address || "My District",
          // Pass the REAL target rep details
          recipientName: selectedRep.name,
          recipientRole: selectedRep.role,
          recipientLevel: selectedRep.level
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedContent(data.letter)
      } else {
        alert("Error: " + data.error)
      }
    } catch (err) {
      alert("Network error.")
    } finally {
      setGenerating(false)
    }
  }

  // --- REFINE DRAFT ---
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

  const handleSave = async () => {
    if (!generatedContent || !selectedRep) return
    await supabase.from('letters').insert({
      user_id: user.id,
      article_id: article.id,
      content: generatedContent,
      status: 'draft',
      recipient: selectedRep.name // Save the real name!
    })
    router.push('/history')
  }

  // Helper to extract a subject line from the generated letter body
  const getEmailSubject = () => {
    if (!generatedContent) return `Regarding: ${article?.title || 'Constituent Issue'}`
    
    // Look for lines starting with "Re:" or "Subject:" (case insensitive)
    const match = generatedContent.match(/^(?:re|subject):\s*(.*)$/im)
    if (match && match[1]) {
      // Remove any trailing periods or whitespace
      return match[1].trim().replace(/\.$/, '')
    }
    
    return `Regarding: ${article?.title || 'Constituent Issue'}`
  }

  if (loading) return <div className="p-12 text-center">Loading Workspace...</div>

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      
      {/* HEADER - CLEANER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="font-bold text-xl truncate max-w-2xl text-gray-900" title={article?.title}>
              {article?.title}
            </h1>
            <p className="text-xs text-gray-500 mt-1">Source: {article?.url ? new URL(article.url).hostname : 'Unknown'}</p>
          </div>
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900">
            &larr; Back
          </Link>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto w-full">
        
        {/* LEFT COLUMN (Controls) */}
        <div className="p-6 border-r border-gray-200 bg-white overflow-y-auto h-[calc(100vh-90px)]">
          
          {/* MODE TOGGLE - 3 OPTIONS */}
          <div className="grid grid-cols-3 bg-gray-100 p-1 rounded-lg mb-8 gap-1">
            <button 
                onClick={() => setMode('postal')} 
                className={`py-2 text-xs md:text-sm font-bold rounded-md transition-all ${mode === 'postal' ? 'bg-white shadow text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
            >
                📮 Postal Letter
            </button>
            <button 
                onClick={() => setMode('email')} 
                className={`py-2 text-xs md:text-sm font-bold rounded-md transition-all ${mode === 'email' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                📧 Message
            </button>
            <button 
                onClick={() => setMode('phone')} 
                className={`py-2 text-xs md:text-sm font-bold rounded-md transition-all ${mode === 'phone' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                📞 Phone Script
            </button>
          </div>

          <div className="space-y-8">
            
            {/* 1. SELECT RECIPIENT - TWO COLUMN GRID */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-bold uppercase tracking-wider text-gray-500">1. Select Recipient</label>
                    {reps.length === 0 && <Link href="/profile" className="text-xs text-blue-600 hover:underline">Find Reps</Link>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {reps.length > 0 ? reps.map(r => (
                        <button
                            key={r.id}
                            onClick={() => setSelectedRep(r)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all relative overflow-hidden h-16 ${
                                selectedRep?.id === r.id 
                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-md' 
                                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {/* Selection Indicator */}
                            {selectedRep?.id === r.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                            )}

                            <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                                {r.photo_url ? (
                                    <img src={r.photo_url} className="w-full h-full object-cover" alt={r.name} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-sm">🏛️</div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className={`text-xs font-bold leading-tight truncate ${selectedRep?.id === r.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                    {r.name}
                                </p>
                                <p className="text-[10px] text-gray-500 font-medium truncate">
                                    {r.role.replace('Representative', 'Rep.').replace('Senator', 'Sen.')}
                                </p>
                            </div>
                        </button>
                    )) : (
                        <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800 col-span-2">
                            No representatives found. Please update your address in your profile.
                        </div>
                    )}
                </div>
            </section>

            {/* 2. SELECT STANCE */}
            <section>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">2. Your Stance</label>
              <div className="grid grid-cols-3 gap-3">
                {['😡 Angry', '😟 Concerned', '😃 Support'].map((m) => (
                  <button key={m} onClick={() => setSentiment(m)} className={`p-3 border rounded-lg text-sm transition-colors ${sentiment === m ? 'border-blue-500 bg-blue-50 font-bold text-blue-900' : 'hover:bg-gray-50 text-gray-700'}`}>{m}</button>
                ))}
              </div>
            </section>

            {/* 3. DEFINE ACTION */}
            <section>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">3. Desired Action</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full p-3 border rounded-lg bg-white text-sm font-medium">
                <option value="vote_no">Vote NO on this legislation</option>
                <option value="vote_yes">Vote YES on this legislation</option>
                <option value="statement">Make a public statement</option>
                <option value="meeting">Schedule a meeting</option>
                <option value="co-sponsor">Co-sponsor the bill</option>
              </select>
            </section>

            {/* 4. PERSONAL CONTEXT */}
            <section>
              <label className="block text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
                4. Personal Context <span className="text-gray-400 font-normal lowercase">(Optional)</span>
              </label>
              <textarea value={personalContext} onChange={(e) => setPersonalContext(e.target.value)} placeholder="e.g. As a small business owner, this bill would..." className="w-full p-3 border rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </section>

            <div className="pt-4 pb-12">
                {!generatedContent ? (
                // UPDATED GENERATE BUTTON WITH SPINNER
                <button 
                    onClick={handleGenerate} 
                    disabled={generating} 
                    className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                        generating 
                        ? 'bg-gray-700 cursor-not-allowed text-gray-300' 
                        : 'bg-gray-900 text-white hover:bg-black hover:-translate-y-0.5 hover:shadow-xl'
                    }`}
                >
                    {generating && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {generating ? 'Writing Letter...' : 'Generate Draft'}
                </button>
                ) : (
                 <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Refine with AI</label>
                        <div className="flex gap-2">
                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="e.g. 'Make it more polite'" className="flex-1 p-2 border rounded text-sm bg-white" onKeyDown={(e) => e.key === 'Enter' && handleRefine()} />
                        <button 
                            onClick={handleRefine} 
                            disabled={generating} 
                            className="bg-blue-600 text-white px-4 rounded font-bold text-sm hover:bg-blue-700 flex items-center gap-2"
                        >
                            {/* MINI SPINNER FOR REFINE BUTTON */}
                            {generating && (
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {generating ? '' : 'Go'}
                        </button>
                        </div>
                    </div>
                    <button onClick={handleGenerate} className="w-full text-gray-500 text-sm hover:text-gray-900 underline">Start Over</button>
                 </div>
                )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Preview) */}
        <div className="p-6 bg-gray-50 h-[calc(100vh-90px)] overflow-y-auto flex flex-col items-center">
          
          <div className="max-w-2xl w-full bg-white shadow-lg border border-gray-200 min-h-[600px] p-8 md:p-12 rounded-none md:rounded-lg relative">
            {!generatedContent ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 absolute inset-0">
                <div className="text-6xl mb-4">✍️</div>
                <p className="font-medium text-lg">Your draft will appear here.</p>
              </div>
            ) : (
              <textarea 
                value={generatedContent} 
                onChange={(e) => setGeneratedContent(e.target.value)} 
                className="w-full h-full min-h-[500px] resize-none focus:outline-none font-serif text-lg leading-relaxed text-gray-900 bg-transparent" 
                spellCheck={false}
              />
            )}
          </div>
          
          {generatedContent && (
             <div className="max-w-2xl w-full mt-6 flex justify-end gap-4">
               <button onClick={handleSave} className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                 Save Draft
               </button>
               <button onClick={() => {
                   navigator.clipboard.writeText(generatedContent);
                   alert("Copied to clipboard!");
               }} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center gap-2">
                 <span>📋</span> Copy to Clipboard
               </button>
             </div>
          )}

          {/* MODE HELPER CARDS (Phone or Website or Email) - MOVED TO BOTTOM */}
          {generatedContent && selectedRep && (
             <div className="max-w-2xl w-full mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                {mode === 'phone' && (
                    <div className="p-6 bg-green-50 border border-green-200 rounded-xl flex items-center gap-6 shadow-sm">
                        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">📞</div>
                        <div>
                            <p className="text-xs text-green-800 font-bold uppercase tracking-wide mb-1">Call {selectedRep.name} Now</p>
                            {selectedRep.phone ? (
                                <>
                                    <a href={`tel:${selectedRep.phone}`} className="text-2xl font-bold text-green-900 hover:underline">{selectedRep.phone}</a>
                                    <p className="text-xs text-green-700 mt-1">Read the script above when a staffer answers.</p>
                                </>
                            ) : (
                                <div>
                                    <p className="text-sm font-bold text-green-900">Number not found.</p>
                                    <a 
                                        href={`https://www.google.com/search?q=phone+number+for+${selectedRep.name}+${selectedRep.state}`} 
                                        target="_blank" 
                                        className="text-xs text-green-700 underline hover:text-green-900"
                                    >
                                        Search Google for Number &rarr;
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mode === 'email' && (
                     <div className="p-6 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-6 shadow-sm">
                        <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                            {selectedRep.email ? '📧' : '🌐'}
                        </div>
                        <div>
                            <p className="text-xs text-purple-800 font-bold uppercase tracking-wide mb-1">Digital Message</p>
                            
                            {selectedRep.email ? (
                                // EMAIL BUTTON
                                <>
                                    <a 
                                        href={`mailto:${selectedRep.email}?subject=${encodeURIComponent(getEmailSubject())}&body=${encodeURIComponent(generatedContent || '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-lg font-bold text-purple-900 hover:underline block"
                                    >
                                        Open Email App &rarr;
                                    </a>
                                    <p className="text-xs text-purple-700 mt-1">Sends directly to {selectedRep.email}</p>
                                </>
                            ) : (
                                // WEBSITE FALLBACK
                                <>
                                    {selectedRep.website && !selectedRep.website.includes('api.congress.gov') ? (
                                        <a href={selectedRep.website} target="_blank" className="text-lg font-bold text-purple-900 hover:underline block">
                                            Open Official Contact Form &rarr;
                                        </a>
                                    ) : (
                                        <a href={`https://www.google.com/search?q=contact+${selectedRep.name}+${selectedRep.state}`} target="_blank" className="text-lg font-bold text-purple-900 hover:underline block">
                                            Find Official Contact Page &rarr;
                                        </a>
                                    )}
                                    <p className="text-xs text-purple-700 mt-1">Copy the text above and paste it into their website form.</p>
                                </>
                            )}
                        </div>
                    </div>
                )}
             </div>
          )}
        </div>

      </div>
    </main>
  )
}