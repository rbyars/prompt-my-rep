import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      
      {/* HERO SECTION */}
      <header className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="mb-6 inline-block bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase">
          Civic Action Made Simple
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
          Turn Your Rage <br />
          <span className="text-blue-600">Into Action.</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
          Stop shouting at the news. Prompt My Rep™ instantly converts news articles into formal, effective letters to your elected officials using AI.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Link 
            href="/login" 
            className="flex-1 bg-blue-600 text-white text-center py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            Get Started for Free
          </Link>
          <Link 
            href="https://chromewebstore.google.com" // Placeholder link
            className="flex-1 bg-white text-gray-700 border border-gray-200 text-center py-4 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Get the Extension
          </Link>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-16">How it Works</h2>
        <div className="grid md:grid-cols-3 gap-12">
          
          {/* Step 1 */}
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
              📰
            </div>
            <h3 className="text-xl font-bold mb-3">1. Read & Capture</h3>
            <p className="text-gray-600">
              See a news article that fires you up? Click our Chrome Extension to capture the facts instantly.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
              🧠
            </div>
            <h3 className="text-xl font-bold mb-3">2. Define Intent</h3>
            <p className="text-gray-600">
              Tell the AI how you feel ("Angry", "Supportive") and what you want ("Vote No"). We add your personal story.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">
              ✉️
            </div>
            <h3 className="text-xl font-bold mb-3">3. Send & Influence</h3>
            <p className="text-gray-600">
              Get a perfectly formatted, persuasive letter ready to copy-paste into official government forms.
            </p>
          </div>

        </div>
      </section>

    </div>
  )
}