import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured. Please set GOOGLE_GENAI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    // Parse request body
    const { prompt, context } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Initialize Gemini with API key
    const ai = new GoogleGenAI({ apiKey });

    // Build system instruction for idea generation
    const systemInstruction = `You are an expert idea generator and innovation consultant. Your role is to help users generate creative, feasible, and well-structured project ideas. 

CRITICAL: You MUST format your response EXACTLY as follows:

**Title:** [A compelling, concise project title]

**Description:** [A clear, concise description in 2-3 sentences explaining what the project is and its main value proposition]

**Key Features/Components:**
- [Feature 1: Brief description]
- [Feature 2: Brief description]
- [Feature 3: Brief description]
- [Continue with 4-6 key features]

**Potential Use Cases/Target Audience:**
- [Use case 1 or target audience segment]
- [Use case 2 or target audience segment]
- [Continue with 2-4 use cases]

**Suggested Tags/Categories:**
[Tag1, Tag2, Tag3, Tag4, Tag5]

Be creative but practical. Ensure each section is clearly marked with **bold** headers.`;

    // Build the full prompt with context if provided
    const fullPrompt = context 
      ? `${context}\n\nBased on this context, generate a project idea: ${prompt}`
      : `Generate a creative project idea based on: ${prompt}`;

    // Generate content
    // Using gemini-2.0-flash which has free tier quota (15 RPM, 1M TPM, 200 RPD)
    // gemini-2.0-flash-exp has limit: 0 on free tier, so it's not available
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.9, // Higher creativity
        maxOutputTokens: 1000,
      },
    });

    const generatedText = response.text;

    return NextResponse.json({
      success: true,
      idea: generatedText,
    });
  } catch (error: any) {
    console.error("Error generating idea:", error);
    
    // Handle rate limit errors specifically
    if (error.status === 429 || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
      const retryAfter = error.message?.match(/retry in ([\d.]+)s/)?.[1];
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please try again in a moment.",
          retryAfter: retryAfter ? parseInt(retryAfter) : undefined,
          details: "The free tier has rate limits. Consider upgrading or waiting before retrying."
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || "Failed to generate idea",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

