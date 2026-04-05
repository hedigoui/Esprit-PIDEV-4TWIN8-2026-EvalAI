import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SpeechMetrics } from '../assemblyai/interfaces/assemblyai.types';

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
  private readonly enabled: boolean;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null =
    null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      this.enabled = false;
      this.logger.warn(
        'GEMINI_API_KEY not set — Gemini backup for oral narratives is disabled',
      );
      return;
    }

    this.enabled = true;
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 4096,
        topP: 0.85,
        topK: 40,
      },
    });
    this.logger.log('✅ Gemini service initialized (backup narrator)');
  }

  isAvailable(): boolean {
    return this.enabled && this.model != null;
  }

  /**
   * When DeepSeek fails validation, try Gemini once. Returns null if unavailable or invalid output.
   */
  async tryEvaluateBackup(
    transcript: string,
    subject: string,
    language: 'en' | 'fr' = 'en',
    speechMetrics?: SpeechMetrics,
  ): Promise<GeminiEvaluationResult | null> {
    if (!this.isAvailable() || !this.model) return null;

    this.logger.log('🤖 Gemini backup: evaluating content');
    const prompt = this.buildPrompt(
      transcript,
      subject,
      language,
      speechMetrics,
    );

    try {
      const startTime = Date.now();
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      this.logger.log(
        `Gemini backup response in ${Date.now() - startTime}ms`,
      );

      let t = text.trim();
      if (t.startsWith('```')) {
        t = t
          .replace(/^```(?:json)?\s*/i, '')
          .replace(/\s*```\s*$/i, '')
          .trim();
      }
      const jsonMatch = t.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const raw = JSON.parse(jsonMatch[0]);
      const data = this.normalizeResult(raw);
      this.validateResult(data);
      if (!this.narrativeLooksStrong(data)) return null;

      this.logger.log('✅ Gemini backup narrative accepted');
      return data;
    } catch (e: any) {
      this.logger.warn(`Gemini backup failed: ${e?.message || e}`);
      return null;
    }
  }

  private narrativeLooksStrong(data: GeminiEvaluationResult): boolean {
    if (data.analysis.summary.trim().length < 50) return false;
    if (data.analysis.keyPoints.length < 3) return false;
    if (
      data.analysis.keyPoints.some((s) => s.trim().length < 18) ||
      data.analysis.strengths.some((s) => s.trim().length < 18) ||
      data.analysis.improvements.some((s) => s.trim().length < 18)
    ) {
      return false;
    }
    return true;
  }

  private toScore(name: string, v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) {
      return Math.round(Math.max(0, Math.min(100, v)));
    }
    if (typeof v === 'string' && v.trim() !== '') {
      const x = parseFloat(v.trim().replace(/,/g, ''));
      if (Number.isFinite(x)) return Math.round(Math.max(0, Math.min(100, x)));
    }
    throw new Error(`Invalid score: ${name}`);
  }

  private normalizeStringArray(v: unknown, max: number): string[] {
    if (!Array.isArray(v)) return [];
    return v
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, max);
  }

  private normalizeResult(raw: any): GeminiEvaluationResult {
    const scores = raw?.scores ?? {};
    const analysis = raw?.analysis ?? {};
    const df = raw?.detailedFeedback ?? {};
    return {
      scores: {
        contentStructure: this.toScore(
          'contentStructure',
          scores.contentStructure,
        ),
        coherence: this.toScore('coherence', scores.coherence),
        topicRelevance: this.toScore('topicRelevance', scores.topicRelevance),
        grammar: this.toScore('grammar', scores.grammar),
        vocabulary: this.toScore('vocabulary', scores.vocabulary),
      },
      analysis: {
        summary: String(analysis.summary ?? '').trim(),
        keyPoints: this.normalizeStringArray(analysis.keyPoints, 8),
        strengths: this.normalizeStringArray(analysis.strengths, 8),
        improvements: this.normalizeStringArray(analysis.improvements, 8),
        cefrLevel: 'B1',
      },
      detailedFeedback: {
        structure: String(df.structure ?? '').trim(),
        contentGaps: this.normalizeStringArray(df.contentGaps, 8),
        vocabularySuggestions: this.normalizeStringArray(
          df.vocabularySuggestions,
          8,
        ),
      },
    };
  }

  private formatSpeechMetricsBlock(m?: SpeechMetrics): string {
    if (!m) return '';
    const d = m.details;
    return `

DELIVERY METRICS (from audio analysis; ground comments in these numbers when useful):
- Fluency: ${m.fluency}/100, Pronunciation: ${m.pronunciation}/100, Pace: ${m.speakingPace}/100, Confidence: ${m.confidence}/100
- WPM: ${d?.wordsPerMinute ?? 'n/a'}, Fillers: ${d?.fillerWords ?? 'n/a'}, Avg pause (s): ${d?.averagePauseDuration ?? 'n/a'}, Words: ${d?.totalWords ?? 'n/a'}`;
  }

  private buildPrompt(
    transcript: string,
    subject: string,
    language: 'en' | 'fr',
    speechMetrics?: SpeechMetrics,
  ): string {
    const metricsBlock = this.formatSpeechMetricsBlock(speechMetrics);

    if (language === 'fr') {
      return `Expert CEFR. Retourne UNIQUEMENT un JSON valide (mêmes clés anglaises que l'exemple).

Sujet: "${subject}"
Transcription: "${transcript}"
${metricsBlock}

Exiger: summary 2–4 phrases; keyPoints 4–6 (contenu réel); strengths/improvements 4–6 chacun, ancrés dans la transcription ou métriques; pas de phrases vagues.

JSON:
{
  "scores": { "contentStructure": 0, "coherence": 0, "topicRelevance": 0, "grammar": 0, "vocabulary": 0 },
  "analysis": { "summary": "", "keyPoints": [], "strengths": [], "improvements": [], "cefrLevel": "B1" },
  "detailedFeedback": { "structure": "", "contentGaps": [], "vocabularySuggestions": [] }
}`;
    }

    return `You are a senior CEFR oral-assessment expert. Return ONLY valid JSON (no markdown).

Subject / task: "${subject}"
Student transcript (verbatim): "${transcript}"
${metricsBlock}

Requirements:
- scores 0-100 integers for: contentStructure, coherence, topicRelevance, grammar, vocabulary
- analysis.summary: 2-4 sentences describing what the learner actually said and how it fits the subject
- analysis.keyPoints: 4-6 items, each paraphrasing a distinct idea from the transcript
- analysis.strengths / improvements: 4-6 each, specific to transcript or metrics (no generic "use more vocabulary" alone)
- detailedFeedback: structure (2-5 sentences), contentGaps, vocabularySuggestions tied to words they used
- analysis.cefrLevel: any of A1–C2 (server recalibrates from scores)

JSON shape:
{
  "scores": { "contentStructure": 0, "coherence": 0, "topicRelevance": 0, "grammar": 0, "vocabulary": 0 },
  "analysis": { "summary": "", "keyPoints": [], "strengths": [], "improvements": [], "cefrLevel": "B1" },
  "detailedFeedback": { "structure": "", "contentGaps": [], "vocabularySuggestions": [] }
}`;
  }

  private validateResult(result: GeminiEvaluationResult) {
    if (!result.scores || !result.analysis || !result.detailedFeedback) {
      throw new Error('Invalid structure');
    }
    for (const k of [
      'contentStructure',
      'coherence',
      'topicRelevance',
      'grammar',
      'vocabulary',
    ] as const) {
      if (typeof result.scores[k] !== 'number' || Number.isNaN(result.scores[k])) {
        throw new Error(`Bad score ${k}`);
      }
    }
  }
}
