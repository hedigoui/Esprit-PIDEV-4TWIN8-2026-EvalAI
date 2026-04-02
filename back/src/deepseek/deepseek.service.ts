// backend/src/deepseek/deepseek.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface DeepSeekEvaluationResult {
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
export class DeepSeekService {
  private readonly logger = new Logger(DeepSeekService.name);
  private readonly apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
      throw new Error(
        'DEEPSEEK_API_KEY is not defined in environment variables',
      );
    }

    this.apiKey = apiKey; // Now TypeScript knows this is definitely a string
    this.logger.log('✅ DeepSeek service initialized');
  }

  async evaluateContent(
    transcript: string,
    subject: string,
    language: 'en' | 'fr' = 'en',
    mode: 'strict' | 'encouraging' = 'encouraging',
  ): Promise<DeepSeekEvaluationResult> {
    this.logger.log(`🤖 Evaluating content with DeepSeek (${mode} mode)`);
    this.logger.log(`Subject: "${subject}"`);
    this.logger.log(`Transcript length: ${transcript.length} characters`);

    const prompt = this.buildPrompt(transcript, subject, language, mode);

    try {
      const startTime = Date.now();

      const response = await axios.post(
        this.apiUrl,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                mode === 'encouraging'
                  ? 'You are an encouraging language teacher. Be supportive and constructive in your feedback. Focus on what the student did right while providing helpful suggestions.'
                  : 'You are a strict language evaluator. Be precise and critical in your assessment.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(`✅ DeepSeek response received in ${processingTime}ms`);

      const content = response.data.choices[0].message.content;

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const evaluationResult = JSON.parse(jsonMatch[0]);
      this.validateResult(evaluationResult);

      this.logger.log(`📊 Content scores:`, evaluationResult.scores);
      this.logger.log(`📈 CEFR Level: ${evaluationResult.analysis.cefrLevel}`);

      return evaluationResult;
    } catch (error) {
      this.logger.error(`❌ DeepSeek evaluation failed: ${error.message}`);
      if (error.response) {
        this.logger.error(
          `DeepSeek API error: ${JSON.stringify(error.response.data)}`,
        );
      }

      // Return fallback evaluation if API fails
      return this.fallbackEvaluation(transcript, subject);
    }
  }

  private buildPrompt(
    transcript: string,
    subject: string,
    language: 'en' | 'fr',
    mode: 'strict' | 'encouraging',
  ): string {
    const scoringGuide =
      mode === 'encouraging'
        ? `SCORING PHILOSOPHY: You are an encouraging language teacher.
         - Focus on what the student DID right
         - A genuine effort to address the topic should score 70-90
         - Only score below 60 if completely off-topic
         - Be supportive and constructive in feedback
         - Reward attempts to use varied vocabulary and structures`
        : `SCORING PHILOSOPHY: Be precise and strict.
         - Score based on accuracy and completeness
         - Use the full 0-100 range
         - Be critical but fair`;

    if (language === 'fr') {
      return `Tu es un expert en évaluation linguistique pour des apprenants de français.

${scoringGuide}

Sujet donné: "${subject}"
Transcription de l'étudiant: "${transcript}"

Évalue selon ces critères (0-100):

1. structureContenu: organisation (introduction, développement, conclusion)
2. coherence: fluidité logique des idées
3. pertinenceSujet: dans quelle mesure la réponse correspond-elle au sujet?
4. grammaire: précision grammaticale
5. vocabulaire: richesse et précision du vocabulaire

Pour la pertinence du sujet, sois GÉNÉREUX. Si l'étudiant fait un effort pour répondre, donne 70-90.
Une auto-présentation qui inclut nom, origine, éducation, loisirs et famille mérite 85-95.

Fournis aussi:
- resume: résumé concis
- pointsCles: 2-3 points principaux
- forces: 3 points positifs spécifiques
- ameliorations: 3 suggestions constructives
- niveauCECRL: A1, A2, B1, B2, C1, ou C2
- structureFeedback: commentaire sur l'organisation
- lacunesContenu: points importants manquants
- suggestionsVocabulaire: alternatives plus précises

Retourne UNIQUEMENT le JSON.`;
    }

    return `You are a language evaluation expert for English learners.

${scoringGuide}

Subject: "${subject}"
Student transcript: "${transcript}"

IMPORTANT SCORING GUIDELINES:

For topicRelevance (0-100):
- If the student makes a GOOD EFFORT to address the topic, score 70-90
- For "Introduce yourself", a response with name, origin, education, hobbies, and family should score 85-95
- Only score below 60 if completely off-topic

Evaluate on these criteria (0-100):

1. contentStructure: Organization (intro, body, conclusion)
2. coherence: Logical flow of ideas
3. topicRelevance: How well does it address the subject? (BE GENEROUS)
4. grammar: Grammatical accuracy
5. vocabulary: Word choice and variety

Also provide:
- summary: brief 1-sentence summary
- keyPoints: 2-3 main points covered
- strengths: 3 specific positive points
- improvements: 3 concrete suggestions
- cefrLevel: A1, A2, B1, B2, C1, or C2
- structure: feedback on organization
- contentGaps: important missing points
- vocabularySuggestions: more precise alternatives

Return ONLY this JSON:
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
    if (!result.scores || !result.analysis || !result.detailedFeedback) {
      throw new Error('Invalid result structure from DeepSeek');
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
  ): DeepSeekEvaluationResult {
    this.logger.log('⚠️ Using fallback evaluation');

    const wordCount = transcript.split(' ').length;
    const sentences = transcript
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);

    // Intelligent fallback scoring
    const hasRelevantTerms = subject
      .toLowerCase()
      .split(/\s+/)
      .some(
        (term) => term.length > 3 && transcript.toLowerCase().includes(term),
      );

    // Check for introduction elements
    const transcriptLower = transcript.toLowerCase();
    const hasName = /name is|call me|i am [a-z]+/.test(transcriptLower);
    const hasOrigin = /from|country|live in|come from/.test(transcriptLower);
    const hasEducation =
      /bachelor|degree|study|student|university|college/.test(transcriptLower);
    const hasHobbies =
      /hobby|like|love|enjoy|playing|watching|listening|reading/.test(
        transcriptLower,
      );
    const hasFamily = /father|mother|brother|sister|parent|family/.test(
      transcriptLower,
    );

    const elementCount = [
      hasName,
      hasOrigin,
      hasEducation,
      hasHobbies,
      hasFamily,
    ].filter(Boolean).length;

    // Determine if this is a self-introduction
    const isSelfIntroduction =
      subject.toLowerCase().includes('introduce') ||
      subject.toLowerCase().includes('about yourself');

    let relevanceScore: number;
    if (isSelfIntroduction) {
      // Generous scoring for self-introductions
      if (elementCount >= 4) relevanceScore = 88;
      else if (elementCount >= 3) relevanceScore = 80;
      else if (elementCount >= 2) relevanceScore = 72;
      else relevanceScore = 65;
    } else {
      relevanceScore = hasRelevantTerms ? 75 : 60;
    }

    const structureScore = Math.min(90, 50 + sentences.length * 8);
    const vocabScore = Math.min(88, 60 + wordCount * 0.3);
    const grammarScore = Math.min(80, 65 + (sentences.length > 3 ? 10 : 0));

    return {
      scores: {
        contentStructure: Math.round(structureScore),
        coherence: Math.min(85, 60 + sentences.length * 4),
        topicRelevance: Math.round(relevanceScore),
        grammar: Math.round(grammarScore),
        vocabulary: Math.round(vocabScore),
      },
      analysis: {
        summary:
          transcript.substring(0, 100) + (transcript.length > 100 ? '...' : ''),
        keyPoints: [subject, 'Personal information', 'Interests and family'],
        strengths: [
          'Good effort to address the topic',
          elementCount > 2
            ? 'Covers multiple aspects of the topic'
            : 'Provides basic information',
          'Clear and understandable speech',
        ],
        improvements: [
          'Add more specific details to enrich your response',
          'Use more varied vocabulary',
          'Practice structuring your response with clear paragraphs',
        ],
        cefrLevel: wordCount > 50 ? 'B1' : 'A2',
      },
      detailedFeedback: {
        structure:
          sentences.length > 3
            ? 'Good organization with multiple sentences'
            : 'Try to organize your thoughts more clearly',
        contentGaps: [
          'Could include more specific examples relevant to the topic',
        ],
        vocabularySuggestions: [
          'Try using more descriptive words',
          'Use synonyms to avoid repetition',
        ],
      },
    };
  }
}
