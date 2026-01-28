
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { OutfitSuggestion, MakeupSuggestion } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateDailyStyle = async (vibe: string): Promise<{ outfit: OutfitSuggestion; makeup: MakeupSuggestion }> => {
  const ai = getAIClient();
  const prompt = `Generate a detailed outfit and makeup recommendation for a person with the vibe/event: "${vibe}". 
  Provide specific clothing items and a complete makeup look that complements the outfit.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          outfit: {
            type: Type.OBJECT,
            properties: {
              top: { type: Type.STRING },
              bottom: { type: Type.STRING },
              outerwear: { type: Type.STRING },
              shoes: { type: Type.STRING },
              accessories: { type: Type.ARRAY, items: { type: Type.STRING } },
              reasoning: { type: Type.STRING }
            },
            required: ["top", "bottom", "shoes", "accessories", "reasoning"]
          },
          makeup: {
            type: Type.OBJECT,
            properties: {
              face: { type: Type.STRING },
              eyes: { type: Type.STRING },
              lips: { type: Type.STRING },
              technique: { type: Type.STRING }
            },
            required: ["face", "eyes", "lips", "technique"]
          }
        },
        required: ["outfit", "makeup"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const analyzeFit = async (base64Image: string, suggestion: { outfit: OutfitSuggestion, makeup: MakeupSuggestion }): Promise<{ rating: number; feedback: string }> => {
  const ai = getAIClient();
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image.split(',')[1] || base64Image,
    },
  };
  
  const textPart = {
    text: `I am wearing this outfit. The original suggestion was: 
    Outfit: ${JSON.stringify(suggestion.outfit)}
    Makeup: ${JSON.stringify(suggestion.makeup)}
    
    Please analyze how well I matched the suggestion and how the overall look works. 
    Provide a rating from 1 to 10 and constructive fashion feedback.`
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rating: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        },
        required: ["rating", "feedback"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};
