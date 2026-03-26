import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  const { prompt, context } = await request.json();

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    
    const systemInstruction = `
      You are an AI Financial Assistant for "BhishiTrack", a community savings group app.
      The user's name is ${context.user.name}.
      Help them understand how Bhishi works, provide advice on managing their groups, and answer any questions about the app.
      Keep your tone friendly, professional, and helpful.
      Use emojis where appropriate.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
      }
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
