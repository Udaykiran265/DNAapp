
import { GoogleGenAI, Type } from "@google/genai";
import { CadNotes } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const noteSchema = {
    type: Type.OBJECT,
    properties: {
        materialDescription: { 
            type: Type.STRING, 
            description: 'NOTE 1: Full material name, temper, and form. E.g., ALUMINUM ALLOY 6061-T6 PLATE' 
        },
        grade: { 
            type: Type.STRING, 
            description: 'NOTE 2: Applicable standard or grade specification. E.g., PER AMS 4027' 
        },
        generalNotes: { 
            type: Type.STRING, 
            description: 'NOTE 3: Standard general notes for fabrication. E.g., REMOVE ALL BURRS AND BREAK SHARP EDGES 0.005-0.015 INCH.' 
        },
        finishNotes: { 
            type: Type.STRING, 
            description: 'NOTE 4: Detailed finish specification or a list of possible treatments if requested. E.g., ANODIZE PER MIL-A-8625, TYPE II, CLASS 2, BLACK.' 
        },
    },
    required: ['materialDescription', 'grade', 'generalNotes', 'finishNotes']
};

const isGenericTreatmentRequest = (finish: string): boolean => {
    const keywords = ['treatment', 'treat', 'finish required', 'surface'];
    const lowerFinish = finish.toLowerCase().trim();
    if (lowerFinish.length < 20) {
        return keywords.some(keyword => lowerFinish.includes(keyword));
    }
    return false;
}

export const generateCadNotes = async (material: string, finish: string): Promise<CadNotes> => {
    const model = 'gemini-2.5-pro';

    let prompt: string;
    if (isGenericTreatmentRequest(finish)) {
        prompt = `You are an expert mechanical engineer and materials scientist. The user has provided a material and needs to know possible treatments or finishes.
        First, identify common and appropriate treatments/finishes for the given material.
        Then, generate CAD drawing notes. For the finish note, list the possible options clearly.

        Material: "${material}"

        Generate the notes in the specified JSON format.`;
    } else {
        prompt = `You are an expert mechanical engineer and CAD drafter. Your task is to generate material and finish notes for a CAD drawing based on the provided inputs.
        The notes must be concise, accurate, and follow standard industry conventions.

        Material: "${material}"
        Finish: "${finish}"

        Generate the notes in the specified JSON format. Ensure the notes are written in ALL CAPS as is standard for CAD drawings.`;
    }

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: noteSchema,
        },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);

    // Re-format to ensure the "NOTE X:" prefix is present
    return {
      materialDescription: `1. ${parsedJson.materialDescription.replace(/^NOTE \d: /i, '')}`,
      grade: `2. ${parsedJson.grade.replace(/^NOTE \d: /i, '')}`,
      generalNotes: `3. ${parsedJson.generalNotes.replace(/^NOTE \d: /i, '')}`,
      finishNotes: `4. ${parsedJson.finishNotes.replace(/^NOTE \d: /i, '')}`,
    };
};

export const askAiAboutMaterial = async (material: string, question: string): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const prompt = `You are an expert materials scientist and mechanical engineer. Answer the following question about the material: "${material}".
    Provide a concise and accurate answer. If the question is about specifications or standards, cite the standard numbers (e.g., AMS, ASTM, MIL-SPEC) if possible.

    Question: "${question}"`;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });

    return response.text;
};
