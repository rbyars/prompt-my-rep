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
      personalContext, // This contains the badges like "I am a Veteran."
      mode, 
      userName, 
      userCity,
      isRefinement,
      currentDraft,
      refinementInstructions
    } = body;

    // DEBUG LOGGING: Check if the badges are actually arriving
    console.log("User Name:", userName);
    console.log("Personal Context Received:", personalContext);

    // Use 2.5 Pro for best results
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    let prompt = "";

    // --- SCENARIO 1: REFINEMENT ---
    if (isRefinement) {
      console.log("Mode: Refinement");
      prompt = `
        Role: You are an expert editor.
        Task: Rewrite the following constituent letter based on the user's instructions.
        Original Draft: "${currentDraft}"
        User's Instructions: "${refinementInstructions}"
        Context: User is writing about "${articleTitle}".
        Guidelines: Return ONLY the new letter text.
      `;
    } 
    
    // --- SCENARIO 2: NEW DRAFT ---
    else {
      console.log("Mode: New Draft");
      
      const identityBlock = `
        User Identity: ${userName} from ${userCity}.
        Personal Context/Badges: ${personalContext || "None provided"}
      `;

      if (mode === 'phone') {
        prompt = `
          Role: You are an expert political strategist writing a phone script.
          Task: Write a 60-second phone script to call a Senator.
          
          ${identityBlock}
          
          Context: Calling about "${articleTitle}".
          Article Details: ${articleText ? articleText.substring(0, 3000) : "No text provided"}.
          Stance: ${sentiment}
          Action Requested: ${action.replace('_', ' ')}
          
          CRITICAL INSTRUCTION: You MUST introduce the caller as "${userName}" from "${userCity}" immediately. If 'Personal Context' is provided (e.g. "I am a Veteran"), you must mention it in the first two sentences to establish credibility.
        `;
      } else {
        prompt = `
          Role: You are an expert constituent advocate writing a formal letter.
          Task: Write a persuasive letter to a Congressperson.

          ${identityBlock}

          Context: Writing about "${articleTitle}".
          Article Details: ${articleText ? articleText.substring(0, 3000) : "No text provided"}.
          Stance: ${sentiment}
          Action Requested: ${action.replace('_', ' ')}

          CRITICAL INSTRUCTION: You MUST sign the letter as "${userName}" from "${userCity}". You MUST weave the 'Personal Context' (e.g. "I am a Veteran") into the opening paragraph to establish the writer's standing in the community. Do not just list it; make it part of the argument.
          
          Guidelines: Professional business letter format. Respectful tone. Under 300 words.
        `;
      }
    }

    console.log("Sending prompt to Gemini...");

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