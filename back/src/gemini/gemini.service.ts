// backend/src/gemini/gemini.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiEvaluationResult {
  scores: {
    contentStructure: number;
    coherence: number;
    topicRelevance: number;
    grammar: number;
    vocabulary: number;
  };
  analysis: {
    summary: string;
    keyPoints: string[];
    strengths: string[];
    improvements: string[];
    cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  };
  detailedFeedback: {
    structure: string;
    contentGaps: string[];
    vocabularySuggestions: string[];
  };
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    // Use Gemini 3 Flash (free tier)
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // or 'gemini-1.5-flash' which is also free
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 40,
      },
    });

    this.logger.log('✅ Gemini service initialized with free tier');
  }

  async evaluateContent(
    transcript: string,
    subject: string,
    language: 'en' | 'fr' = 'en',
  ): Promise<GeminiEvaluationResult> {
    this.logger.log(`🤖 Evaluating content with Gemini (free tier)`);
    this.logger.log(`Subject: "${subject}"`);
    this.logger.log(`Transcript length: ${transcript.length} characters`);

    const prompt = this.buildPrompt(transcript, subject, language);

    try {
      const startTime = Date.now();

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const processingTime = Date.now() - startTime;
      this.logger.log(`✅ Gemini response received in ${processingTime}ms`);

      // Extract JSON from response (Gemini might add markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.error('No JSON found in Gemini response');
        this.logger.debug(`Raw response: ${text}`);
        return this.fallbackEvaluation(transcript, subject);
      }

      const evaluationResult = JSON.parse(jsonMatch[0]);

      // Validate the structure
      this.validateResult(evaluationResult);

      this.logger.log(`📊 Content scores:`, evaluationResult.scores);
      this.logger.log(`📈 CEFR Level: ${evaluationResult.analysis.cefrLevel}`);

      return evaluationResult;
    } catch (error) {
      this.logger.error(`❌ Gemini evaluation failed: ${error.message}`);
      this.logger.error(error.stack);

      // Return fallback evaluation if API fails
      return this.fallbackEvaluation(transcript, subject);
    }
  }

  private buildPrompt(
    transcript: string,
    subject: string,
    language: 'en' | 'fr',
  ): string {
    if (language === 'fr') {
      return `Tu es un expert en évaluation linguistique pour des apprenants de français. 
Analyse cette réponse d'étudiant et retourne UNIQUEMENT un objet JSON valide.

Sujet donné: "${subject}"
Transcription de l'étudiant: "${transcript}"

Évalue selon ces critères (0-100):
- structureContenu: organisation (introduction, développement, conclusion)
- coherence: fluidité logique des idées
- pertinenceSujet: la réponse correspond-elle au sujet?
- grammaire: précision grammaticale
- vocabulaire: richesse et précision du vocabulaire

Fournis aussi:
- resume: résumé concis (1 phrase)
- pointsCles: 2-3 points principaux abordés
- forces: 3 points positifs spécifiques
- ameliorations: 3 suggestions concrètes
- niveauCECRL: A1, A2, B1, B2, C1, ou C2
- structureFeedback: commentaire sur l'organisation
- lacunesContenu: points importants manquants
- suggestionsVocabulaire: alternatives plus précises

Retourne UNIQUEMENT ce JSON valide:
{
  "scores": {
    "contentStructure": nombre,
    "coherence": nombre,
    "topicRelevance": nombre,
    "grammar": nombre,
    "vocabulary": nombre
  },
  "analysis": {
    "summary": "texte",
    "keyPoints": ["texte"],
    "strengths": ["texte"],
    "improvements": ["texte"],
    "cefrLevel": "B1"
  },
  "detailedFeedback": {
    "structure": "texte",
    "contentGaps": ["texte"],
    "vocabularySuggestions": ["texte"]
  }
}`;
    }

    // Default English prompt
    return `You are a language evaluation expert for English learners. 
Analyze this student response and return ONLY a valid JSON object.

Subject given: "${subject}"
Student transcript: "${transcript}"

Evaluate on these criteria (0-100):
- contentStructure: organization (intro, body, conclusion)
- coherence: logical flow of ideas
- topicRelevance: does it address the subject?
- grammar: grammatical accuracy
- vocabulary: word choice and variety

Also provide:
- summary: brief 1-sentence summary
- keyPoints: 2-3 main points covered
- strengths: 3 specific positive points
- improvements: 3 concrete suggestions
- cefrLevel: A1, A2, B1, B2, C1, or C2
- structure: feedback on organization
- contentGaps: important missing points
- vocabularySuggestions: more precise alternatives

Return ONLY this valid JSON:
{
  "scores": {
    "contentStructure": number,
    "coherence": number,
    "topicRelevance": number,
    "grammar": number,
    "vocabulary": number
  },
  "analysis": {
    "summary": "string",
    "keyPoints": ["string"],
    "strengths": ["string"],
    "improvements": ["string"],
    "cefrLevel": "B1"
  },
  "detailedFeedback": {
    "structure": "string",
    "contentGaps": ["string"],
    "vocabularySuggestions": ["string"]
  }
}`;
  }

  private validateResult(result: any) {
    // Basic validation to ensure structure is correct
    if (!result.scores || !result.analysis || !result.detailedFeedback) {
      throw new Error('Invalid result structure from Gemini');
    }

    const requiredScores = [
      'contentStructure',
      'coherence',
      'topicRelevance',
      'grammar',
      'vocabulary',
    ];
    for (const score of requiredScores) {
      if (typeof result.scores[score] !== 'number') {
        throw new Error(`Missing or invalid score: ${score}`);
      }
    }

    return true;
  }

  private fallbackEvaluation(
    transcript: string,
    subject: string,
  ): GeminiEvaluationResult {
    this.logger.log('⚠️ Using fallback evaluation');

    const wordCount = transcript.split(' ').length;
    const sentences = transcript
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);

    // Simple rule-based evaluation
    const structureScore = Math.min(100, sentences.length * 25);
    const relevanceScore = transcript
      .toLowerCase()
      .includes(subject.toLowerCase())
      ? 80
      : 50;
    const vocabScore = Math.min(100, 50 + wordCount);

    return {
      scores: {
        contentStructure: structureScore,
        coherence: 70,
        topicRelevance: relevanceScore,
        grammar: 75,
        vocabulary: vocabScore,
      },
      analysis: {
        summary:
          transcript.substring(0, 100) + (transcript.length > 100 ? '...' : ''),
        keyPoints: [subject],
        strengths: ['Response provided', 'Addresses the topic'],
        improvements: [
          'Add more details',
          'Use more varied vocabulary',
          'Structure your response better',
        ],
        cefrLevel: wordCount > 50 ? 'B1' : 'A2',
      },
      detailedFeedback: {
        structure:
          sentences.length > 1
            ? 'Multiple sentences detected'
            : 'Try to organize your response',
        contentGaps: [
          'Could provide more examples',
          'Consider adding a conclusion',
        ],
        vocabularySuggestions: [
          'Use more specific terms',
          'Vary your word choice',
        ],
      },
    };
  }
}
