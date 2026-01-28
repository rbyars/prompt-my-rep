import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  let prompt = ""; 

  try {
    const body = await request.json();
    const { 
      articleTitle, 
      articleText, 
      sentiment, 
      action, 
      personalContext, 
      mode, 
      userName, 
      userCity,
      recipientName,
      recipientRole,
      recipientLevel
    } = body;

    // PRIMARY: Gemini 2.5 Flash (Bleeding Edge Speed/Cost)
    // If this specific version string isn't active for your account yet,
    // the code will automatically catch the error and use 1.5 Flash below.
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Determine tone based on sentiment
    let toneInstruction = "professional and firm";
    if (sentiment === "concerned") toneInstruction = "worried and urgent";
    if (sentiment === "support") toneInstruction = "enthusiastic and grateful";
    if (sentiment === "angry") toneInstruction = "stern and disappointed";

    // --- PROMPT ENGINEERING ---
    if (mode === "phone") {
        prompt = `
          Task: Write a short phone script for a constituent calling ${recipientRole} ${recipientName}'s office (${recipientLevel}).
          Topic: ${articleTitle}
          
          User Info:
          Name: ${userName}
          City: ${userCity}
          Stance: ${toneInstruction}
          Desired Action: ${action.replace('_', ' ')}
          Personal Context: ${personalContext || "None"}

          Source Text:
          ${articleText.substring(0, 3000)}

          Requirements:
          - Start with "Hi, my name is ${userName} and I am a constituent from ${userCity}."
          - Keep it under 45 seconds to read.
          - Be clear about the specific action requested.
        `;
    } else {
        // Mode is "postal" or "email" -> Generate a formal letter body
        prompt = `
          Task: Write a formal constituent letter to ${recipientRole} ${recipientName} (${recipientLevel}).
          Topic: ${articleTitle}
          
          User Info:
          Name: ${userName}
          City: ${userCity}
          Stance: ${toneInstruction}
          Desired Action: ${action.replace('_', ' ')}
          Personal Context: ${personalContext || "None"}
          
          Source Text (Use this for facts):
          ${articleText.substring(0, 4000)}

          Requirements:
          - Use a formal, respectful tone.
          - CRITICAL: Address the letter to "The Honorable ${recipientName}".
          - Clearly state the constituent's position and the specific action requested.
          - Include specific facts from the source text to back up the argument.
          - Sign off with "Sincerely, ${userName}".
          - Do NOT include placeholders like [Date] or [Address] at the top, just start with the salutation.
        `;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, letter: text });

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // FALLBACK LOGIC
    // If 2.5 Flash fails (404 Not Found), fallback to the reliable 1.5 Flash
    if (error.message?.includes('404') || error.message?.includes('not found')) {
        console.log("Gemini 2.5 not found. Retrying with gemini-1.5-flash...");
        try {
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const fallbackResult = await fallbackModel.generateContent(prompt); 
            const fallbackResponse = await fallbackResult.response;
            return NextResponse.json({ success: true, letter: fallbackResponse.text() });
        } catch (fallbackError: any) {
             return NextResponse.json({ success: false, error: `Primary (2.5) and Fallback (1.5) failed. Original error: ${error.message}` }, { status: 500 });
        }
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}