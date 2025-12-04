import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log("--- API: Generate Request Started ---");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: "Server API Key missing" }, { status: 500 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
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
      isRefinement,
      currentDraft,
      refinementInstructions
    } = body;

    // --- UPDATED MODEL TO 2.5 PRO ---
    // "2.5-pro" is the smartest STABLE model (High Reasoning, Good Free Tier)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    let prompt = "";

    // --- SCENARIO 1: REFINEMENT (Editing) ---
    if (isRefinement) {
      console.log("Mode: Refinement/Edit (Gemini 2.5 Pro)");
      prompt = `
        Role: You are an expert editor.
        Task: Rewrite the following constituent letter based on the user's instructions.
        
        Original Draft:
        "${currentDraft}"
        
        User's Instructions for Change:
        "${refinementInstructions}"
        
        Context: User is writing about "${articleTitle}".
        
        Guidelines:
        - Use advanced reasoning to improve flow and impact.
        - Only apply the user's specific changes.
        - Maintain a professional tone.
        - Return ONLY the new letter text.
      `;
    } 
    
    // --- SCENARIO 2: NEW DRAFT ---
    else {
      console.log("Mode: New Draft (Gemini 2.5 Pro)");
      if (mode === 'phone') {
        prompt = `
          Role: You are an expert political strategist writing a phone script.
          Task: Write a highly effective 60-second phone script.
          Context: User is calling about "${articleTitle}". 
          Relevant details: ${articleText ? articleText.substring(0, 5000) : "No text provided"}.
          User Stance: ${sentiment}
          The Ask: ${action.replace('_', ' ')}
          Personal Connection: ${personalContext || "None provided"}
          User Info: Name is ${userName}, from ${userCity}.
          Guidelines: Conversational, polite, under 150 words.
        `;
      } else {
        prompt = `
          Role: You are an expert constituent advocate writing a formal letter.
          Context: User is writing about "${articleTitle}". 
          Relevant details: ${articleText ? articleText.substring(0, 5000) : "No text provided"}.
          User Stance: ${sentiment}
          The Ask: ${action.replace('_', ' ')}
          Personal Connection: ${personalContext || "None provided"}
          User Info: Name is ${userName}, from ${userCity}.
          Guidelines: Professional business letter format, respectful tone, under 300 words.
          Goal: Be persuasive and use the "Personal Connection" to make it authentic.
        `;
      }
    }

    console.log("Sending prompt to Gemini 2.5 Pro...");

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini responded. Length:", text.length);

    return NextResponse.json({ success: true, letter: text });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Unknown Error" }, { status: 500 });
  }
}