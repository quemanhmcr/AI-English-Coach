import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationResult, Lesson, HistoryEntry, LearnerProfile } from "../types";
import { PASS_THRESHOLD } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const evaluateTranslation = async (
  vietnamese: string,
  userEnglish: string
): Promise<EvaluationResult> => {
  try {
    const prompt = `
      You are an elite linguistic AI coach.
      Task: Deeply analyze the user's translation.
      
      Vietnamese: "${vietnamese}"
      User's English: "${userEnglish}"
      
      Requirements:
      1. Score (0-100).
      2. 'correction': The standard correct version.
      3. 'explanation': Concise Vietnamese explanation.
      4. 'detailedAnalysis': Break down the user's sentence tokens. 
         - If 'status' is 'error', YOU MUST PROVIDE 'errorType' (e.g., "Sai thì", "Sai giới từ", "Chính tả", "Dư từ", "Thiếu từ", "Từ vựng").
      5. 'keyTakeaway': One golden rule/lesson in Vietnamese.
      6. 'alternatives': 3 pragmatic variations (Formal/Casual/Native).
      7. 'relatedVocabulary': Suggest 3 advanced words or idioms related to the TOPIC of this sentence (not just synonyms, but conceptual expansion).
         - meaning: Vietnamese meaning.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            correction: { type: Type.STRING },
            explanation: { type: Type.STRING },
            isPass: { type: Type.BOOLEAN },
            improvedVersion: { type: Type.STRING },
            keyTakeaway: { type: Type.STRING },
            detailedAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["correct", "error"] },
                  correction: { type: Type.STRING },
                  errorType: { type: Type.STRING, description: "Short label for the error type in Vietnamese e.g. 'Sai thì'" },
                },
                required: ["text", "status"],
              },
            },
            alternatives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["Formal", "Casual", "Native"] },
                  text: { type: Type.STRING },
                  context: { type: Type.STRING },
                },
                required: ["type", "text", "context"],
              },
            },
            relatedVocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  type: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  example: { type: Type.STRING },
                },
                required: ["word", "type", "meaning", "example"],
              },
            },
          },
          required: ["score", "correction", "explanation", "isPass", "detailedAnalysis", "alternatives", "keyTakeaway", "relatedVocabulary"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(text) as EvaluationResult;
    return result;

  } catch (error) {
    console.error("Error evaluating translation:", error);
    return {
      score: 0,
      correction: "Error connecting to AI.",
      explanation: "Có lỗi xảy ra khi kết nối với máy chủ.",
      isPass: false,
      detailedAnalysis: [{ text: userEnglish, status: 'error', correction: 'Error' }],
      alternatives: [],
      relatedVocabulary: [],
      keyTakeaway: "Kiểm tra kết nối mạng."
    };
  }
};

export const generateLessonContent = async (topicDescription: string, questionCount: number | 'auto' = 10): Promise<Omit<Lesson, 'id'>> => {
    let quantityInstruction = "";
    
    if (questionCount === 'auto') {
      quantityInstruction = "Generate an optimal number of exercises (between 8 and 15) based on the depth of the topic.";
    } else {
      quantityInstruction = `Generate exactly ${questionCount} exercises.`;
    }

    const prompt = `
      Create a scientifically optimized English learning lesson based on this topic/description: "${topicDescription}".
      
      Requirements for the Lesson:
      1. Title: Catchy and relevant (English).
      2. Description: Brief overview in Vietnamese.
      3. Level: Assess the complexity (Beginner/Intermediate/Advanced).
      4. Exercises: ${quantityInstruction}
         - Follow a "Scaffolding" method: Start with Easy (approx 30%), progress to Medium (approx 40%), and finish with Hard (approx 30%).
         - Easy: Short sentences, core vocabulary.
         - Medium: Complex grammar structures, compound sentences.
         - Hard: Idioms, nuanced expressions, advanced grammar.
      5. Hints: 
         - Hints MUST BE REASONABLE and HELPFUL. 
         - Do NOT just give the answer.
         - Provide a grammar clue (e.g., "Use Present Perfect", "Conditional Type 2") OR a key vocabulary word if it's difficult.
    `;
  
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            level: { type: Type.STRING },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  vietnamese: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
                  hint: { type: Type.STRING }
                },
                required: ["vietnamese", "difficulty", "hint"]
              }
            }
          },
          required: ["title", "description", "level", "exercises"]
        }
      }
    });
  
    const text = response.text;
    if (!text) throw new Error("Failed to generate lesson");
    
    return JSON.parse(text) as Omit<Lesson, 'id'>;
  };

export const analyzeLearnerProfile = async (history: HistoryEntry[]): Promise<LearnerProfile> => {
    // Only analyze last 20 entries to save tokens and keep it recent
    const recentHistory = history.slice(0, 20);
    const historyString = JSON.stringify(recentHistory.map(h => ({
        q: h.question,
        score: h.score,
        errors: h.errorTypes
    })));

    const prompt = `
      Analyze this student's recent learning history:
      ${historyString}

      Based on their errors and scores:
      1. Identify top 3 strengths (what they rarely get wrong).
      2. Identify top 3 weaknesses (patterns in errorTypes or low scores).
      3. Determine progress trend (Improving/Stable/Declining).
      4. Suggest a specific focus for next lessons (in Vietnamese).
      5. Write a short, encouraging summary (in Vietnamese).
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recentProgress: { type: Type.STRING, enum: ['Improving', 'Stable', 'Declining'] },
                    suggestedFocus: { type: Type.STRING },
                    summary: { type: Type.STRING }
                },
                required: ["strengths", "weaknesses", "recentProgress", "suggestedFocus", "summary"]
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("Analysis failed");
    return JSON.parse(text) as LearnerProfile;
};