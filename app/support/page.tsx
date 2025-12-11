export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-2">Support & Help</h1>
      <p className="text-gray-500 mb-12">
        Having trouble with Prompt My Rep? We're here to help.
      </p>

      <div className="space-y-12">
        
        {/* HOW TO USE */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-gray-900 border-b pb-2">How to use the Extension</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="bg-blue-100 text-blue-800 font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0">1</div>
              <div>
                <h3 className="font-bold text-gray-900">Navigate to a News Article</h3>
                <p className="text-gray-600 text-sm">Open any news article from a major publisher (CNN, NYT, Fox, etc.) in your Chrome browser.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-blue-100 text-blue-800 font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0">2</div>
              <div>
                <h3 className="font-bold text-gray-900">Click the Extension Icon</h3>
                <p className="text-gray-600 text-sm">Click the Prompt My Rep envelope icon in your toolbar. If you don't see it, click the "Puzzle Piece" icon and pin it.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-blue-100 text-blue-800 font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0">3</div>
              <div>
                <h3 className="font-bold text-gray-900">Click "Save Article"</h3>
                <p className="text-gray-600 text-sm">The extension will scan the page text and send it to your dashboard.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-bold mb-4 text-gray-900 border-b pb-2">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">It says "Please log in" but I am logged in?</h3>
              <p className="text-gray-600 text-sm">
                The extension relies on cookies from the main website. Go to <a href="/" className="text-blue-600 underline">your dashboard</a>, 
                log out, and log back in. Then try the extension again.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">My Representative isn't showing up?</h3>
              <p className="text-gray-600 text-sm">
                Ensure your address in your <a href="/profile" className="text-blue-600 underline">Profile</a> is correct and includes a Zip Code. 
                We use the US Census database to find your district.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-bold mb-2">Still need help?</h2>
          <p className="text-gray-600 text-sm mb-4">
            If you are encountering a bug or have a feature request, please email our support team.
          </p>
          <a href="mailto:support@promptmyrep.com" className="inline-block bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-100">
            Email Support
          </a>
        </section>

      </div>
    </div>
  )
}