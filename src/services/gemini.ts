import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export interface AnalysisResult {
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High";
  explanation: string;
  recommendedAction: string;
  findings: string[];
  ownerInfo: string;
  verifiedSources: string[];
}

export async function analyzeInput(type: string, content: string, imageData?: string): Promise<AnalysisResult> {
  const model = "gemini-3-flash-preview";
  let localContext = "";
  try {
    const localRes = await fetch(`/api/verify/local?query=${encodeURIComponent(content.slice(0, 100))}`);
    if (localRes.ok) {
      const matches = await localRes.json();
      if (matches.length > 0) {
        localContext = "CORE DATABASE MATCHES (Previously reported or analyzed scams):\n" + 
          matches.map((m: any) => `- ${m.name}: ${m.details} (${m.type})`).join("\n");
      }
    }
  } catch (e) {
    console.error("Failed to fetch local context", e);
  }

  const systemInstruction = `
    You are ScamShield AI, a world-class fraud detection and verification expert.
    Your mission is to provide 100% accurate, cross-verified analysis of potential scams.
    
    CORE KNOWLEDGE & LOCAL CONTEXT:
    ${localContext || "No direct matches found in local database. Rely on external verification."}

    CRITICAL PROTOCOL:
    1. RE-VERIFY EVERYTHING: Do not rely on internal knowledge alone. Use the Google Search tool to cross-reference the input against multiple external sources (news, scam databases, community reports).
    2. PHONE NUMBER VERIFICATION: If the input is a phone number, search for it on "TrueCaller", "Sync.me", "WhoCalledMe", and local telecommunication scam registries. Look for tags like "Spam", "Telemarketer", or "Fraud".
    3. LINK/DOMAIN VERIFICATION: Check domain age, SSL status, and presence on blacklists like PhishTank or Google Safe Browsing via search.
    4. OWNER VERIFICATION: Search for the CEO, Founder, or parent company. Verify if they are real people or stolen identities.
    5. CORE KNOWLEDGE: Cross-check against known scam patterns: Pig Butchering, Ponzi schemes, Phishing, and Impersonation.

    Input Type: ${type}
    Input Content: ${content}
    ${imageData ? "An image has been provided for visual analysis. Use OCR to extract text and search for any mentioned platforms." : ""}

    Return a JSON response with:
    - riskScore (0-100)
    - riskLevel (Low, Medium, High)
    - explanation (A concise summary of why it's risky or safe, mentioning the sources checked)
    - recommendedAction (Avoid, Caution, or Likely Safe)
    - findings (An array of specific red flags or positive indicators)
    - ownerInfo (The name of the CEO, Founder, or likely owner. Be specific.)
    - verifiedSources (An array of URLs or names of platforms/services you used to verify this information)
  `;

  const parts: any[] = [{ text: `Perform a deep multi-source verification for this ${type} input: ${content}` }];
  
  if (imageData) {
    const base64Data = imageData.includes(",") ? imageData.split(",")[1] : imageData;
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          riskScore: { type: Type.NUMBER },
          riskLevel: { type: Type.STRING },
          explanation: { type: Type.STRING },
          recommendedAction: { type: Type.STRING },
          ownerInfo: { type: Type.STRING },
          findings: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          verifiedSources: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["riskScore", "riskLevel", "explanation", "recommendedAction", "findings", "ownerInfo", "verifiedSources"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse Gemini response:", response.text);
    throw new Error("Analysis failed to generate valid data.");
  }
}