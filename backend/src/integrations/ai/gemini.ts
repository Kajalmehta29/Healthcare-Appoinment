import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export interface SymptomAnalysisResult {
  urgency: 'Low' | 'Medium' | 'High';
  chiefComplaint: string;
  suggestedQuestions: string[];
}

export interface ConsultationSummaryResult {
  summaryText: string;
  medicationSchedule: string;
  followUpSteps: string;
}

/**
 * Fallback Symptom Analysis
 */
const getSymptomFallback = (symptoms: string): SymptomAnalysisResult => {
  const isUrgent = symptoms.toLowerCase().includes('chest pain') || symptoms.toLowerCase().includes('breathing');
  const urgency = isUrgent ? 'High' : (symptoms.length > 50 ? 'Medium' : 'Low');
  return {
    urgency,
    chiefComplaint: symptoms.substring(0, 45) + (symptoms.length > 45 ? '...' : ''),
    suggestedQuestions: [
      'How long have you experienced these specific symptoms?',
      'Does anything make the symptoms feel better or worse?',
      'Have you taken any over-the-counter medications for this?'
    ]
  };
};

/**
 * Fallback Consultation Summary
 */
const getConsultationFallback = (notes: string, medicationsList: string, followUp: string): ConsultationSummaryResult => {
  return {
    summaryText: `Patient visited regarding clinical concerns. The doctor documented: ${notes.substring(0, 100)}${notes.length > 100 ? '...' : ''}`,
    medicationSchedule: medicationsList || 'Take any prescribed medications as instructed by the physician.',
    followUpSteps: followUp || 'Return to clinic if symptoms persist or worsen.'
  };
};

/**
 * Analyze symptoms using Gemini model
 */
export const analyzeSymptoms = async (symptoms: string): Promise<SymptomAnalysisResult> => {
  if (!genAI) {
    console.warn('GEMINI_API_KEY is not configured. Using local symptom analysis rule engine (fallback).');
    return getSymptomFallback(symptoms);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyse these symptoms and return a JSON object (strictly raw JSON, do not include markdown blocks or code formatting) containing:
- urgency: "Low" or "Medium" or "High"
- chiefComplaint: a brief summary of the primary complaint (string, max 50 chars)
- suggestedQuestions: array of three useful questions the doctor should ask the patient

Symptoms: "${symptoms}"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Clean potential markdown wrapped backticks if the model returned them
    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      urgency: parsed.urgency || 'Low',
      chiefComplaint: parsed.chiefComplaint || symptoms.substring(0, 45),
      suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions.slice(0, 3) : []
    };
  } catch (error) {
    console.error('Gemini Symptom Analysis failed:', error);
    return getSymptomFallback(symptoms);
  }
};

/**
 * Convert clinical notes into a patient-friendly summary using Gemini
 */
export const generatePostVisitSummary = async (notes: string, medications: any[], followUp: string): Promise<ConsultationSummaryResult> => {
  const medicationsList = medications.map(m => `- ${m.name}: ${m.dosage} ${m.frequency} for ${m.duration}`).join('\n');

  if (!genAI) {
    console.warn('GEMINI_API_KEY is not configured. Using local consultation compiler (fallback).');
    return getConsultationFallback(notes, medicationsList, followUp);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Convert these clinical notes into a patient-friendly format and return a JSON object (strictly raw JSON, do not include markdown blocks or code formatting) containing:
- summaryText: a simplified description of the diagnosis and doctor notes
- medicationSchedule: a clear bulleted list of how to take their medications
- followUpSteps: key next actions or appointments

Clinical notes: "${notes}"
Medications prescribed:
"${medicationsList}"
Follow-up: "${followUp}"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      summaryText: parsed.summaryText || 'Consultation summary compiled successfully.',
      medicationSchedule: parsed.medicationSchedule || medicationsList || 'No medications prescribed.',
      followUpSteps: parsed.followUpSteps || followUp || 'No specific follow-up required.'
    };
  } catch (error) {
    console.error('Gemini post-visit summary failed:', error);
    return getConsultationFallback(notes, medicationsList, followUp);
  }
};
