export default function PrivacyPolicy() {
  return (
    <div className="max-w-2xl mx-auto p-8 prose">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy for Prompt My Rep</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: December 6, 2025</p>
      
      <div className="space-y-6">
        <section>
            <h3 className="text-xl font-bold mb-2">1. Data Collection</h3>
            <p>
                Prompt My Rep ("the Extension") collects the content of the web page 
                you are currently viewing <strong>only when you click the extension icon</strong>. 
                This data is sent to our servers to generate a draft letter.
            </p>
        </section>

        <section>
            <h3 className="text-xl font-bold mb-2">2. User Accounts</h3>
            <p>
                We use authentication cookies to verify your identity. Your saved letters 
                and profile information are stored securely in our database via Supabase.
            </p>
        </section>

        <section>
            <h3 className="text-xl font-bold mb-2">3. Data Sharing</h3>
            <p>
                We do not sell your data. We use Artificial Intelligence providers (Google Gemini) 
                to process the text of articles you submit. Data sent to AI is transient and used only for generation.
            </p>
        </section>

        <section>
            <h3 className="text-xl font-bold mb-2">4. Contact</h3>
            <p>For questions, please contact support.</p>
        </section>
      </div>
    </div>
  )
}