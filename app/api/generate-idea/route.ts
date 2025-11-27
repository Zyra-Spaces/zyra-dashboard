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
        { error: "Gemini API key not configured" },
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

    // Initialize Gemini
    const ai = new GoogleGenAI({ apiKey });

    // Build system instruction for idea generation
    const systemInstruction = `You are an expert idea generator and innovation consultant. Your role is to help users generate creative, feasible, and well-structured project ideas. 

When generating ideas, provide:
1. A compelling title
2. A clear, concise description (2-3 sentences)
3. Key features or components
4. Potential use cases or target audience
5. Suggested tags/categories

Format your response as a structured idea that can be easily parsed. Be creative but practical.`;

    // Build the full prompt with context if provided
    const fullPrompt = context 
      ? `${context}\n\nBased on this context, generate a project idea: ${prompt}`
      : `Generate a creative project idea based on: ${prompt}`;

    // Generate content with streaming
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
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
    return NextResponse.json(
      { 
        error: error.message || "Failed to generate idea",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

