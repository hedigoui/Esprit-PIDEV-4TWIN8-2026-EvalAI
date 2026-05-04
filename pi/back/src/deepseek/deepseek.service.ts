import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import type { SpeechMetrics } from '../assemblyai/interfaces/assemblyai.types';

interface DeepSeekEvaluationResult {
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

interface DeepSeekEvaluateOutcome {
  data: DeepSeekEvaluationResult;
  /** False when API/parse/validation failed and heuristic fallback was used */
  llmSucceeded: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

    this.apiKey = apiKey;
    this.logger.log('✅ DeepSeek service initialized');
  }

  /**
   * Calls DeepSeek with retries and strict narrative checks.
   * If all attempts fail, returns transcript-grounded heuristic data with llmSucceeded: false.
   */
  async evaluateContent(
    transcript: string,
    subject: string,
    language: 'en' | 'fr' = 'en',
    mode: 'strict' | 'encouraging' = 'encouraging',
    speechMetrics?: SpeechMetrics,
  ): Promise<DeepSeekEvaluateOutcome> {
    this.logger.log(`🤖 Evaluating content with DeepSeek (${mode} mode)`);
    this.logger.log(`Subject: "${subject}"`);
    this.logger.log(`Transcript length: ${transcript.length} characters`);

    const prompt = this.buildPrompt(
      transcript,
      subject,
      language,
      mode,
      speechMetrics,
    );

    let lastErr = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const content = await this.callDeepSeekApi(prompt, mode);
        const raw = this.parseJsonFromModelContent(content);
        const data = this.normalizeEvaluationResult(raw);
        this.validateNarrativeQuality(data);
        this.logger.log(`✅ DeepSeek OK (attempt ${attempt + 1})`);
        return { data, llmSucceeded: true };
      } catch (e: any) {
        lastErr = e?.message || String(e);
        this.logger.warn(
          `DeepSeek attempt ${attempt + 1}/3 failed: ${lastErr}`,
        );
        if (attempt < 2) await sleep(500 * (attempt + 1));
      }
    }

    this.logger.error(
      `❌ DeepSeek exhausted retries — using transcript-grounded fallback. Last error: ${lastErr}`,
    );
    return {
      data: this.fallbackEvaluation(transcript, subject, speechMetrics),
      llmSucceeded: false,
    };
  }

  private async callDeepSeekApi(
    prompt: string,
    mode: 'strict' | 'encouraging',
  ): Promise<string> {
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
                ? 'You are a senior CEFR oral-assessment specialist writing feedback for instructors. Numeric scores should be fair and motivating when the learner genuinely engages with the task. The written analysis (summary, keyPoints, strengths, improvements, detailedFeedback) must be analytically strong: every point must be grounded in the transcript or in the delivery metrics provided—cite ideas, structures, or errors the learner actually used; avoid generic praise or vague tips that could apply to any response. Output must be a single valid JSON object only.'
                : 'You are a strict CEFR oral-assessment specialist. Be precise and critical in scores and in written analysis; still ground every written claim in the transcript or delivery metrics. Output must be a single valid JSON object only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.25,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 120_000,
        validateStatus: () => true,
      },
    );

    if (response.status < 200 || response.status >= 300) {
      const body =
        typeof response.data === 'object'
          ? JSON.stringify(response.data)
          : String(response.data);
      throw new Error(`DeepSeek HTTP ${response.status}: ${body}`);
    }

    const content = response.data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Empty DeepSeek message content');
    }

    this.logger.log(
      `DeepSeek response received in ${Date.now() - startTime}ms`,
    );
    return content;
  }

  private parseJsonFromModelContent(content: string): unknown {
    let t = content.trim();
    if (t.startsWith('```')) {
      t = t
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/i, '')
        .trim();
    }
    const jsonMatch = t.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object in model response');
    }
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error('JSON.parse failed on model output');
    }
  }

  private toScoreRequired(name: string, v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) {
      return Math.round(Math.max(0, Math.min(100, v)));
    }
    if (typeof v === 'string' && v.trim() !== '') {
      const x = parseFloat(v.trim().replace(/,/g, ''));
      if (Number.isFinite(x)) {
        return Math.round(Math.max(0, Math.min(100, x)));
      }
    }
    throw new Error(`Invalid score for ${name}`);
  }

  private normalizeStringArray(v: unknown, max: number): string[] {
    if (!Array.isArray(v)) return [];
    return v
      .map((x) => String(x).trim())
      .filter(Boolean)
      .slice(0, max);
  }

  private normalizeEvaluationResult(raw: any): DeepSeekEvaluationResult {
    const scores = raw?.scores ?? {};
    const analysis = raw?.analysis ?? {};
    const df = raw?.detailedFeedback ?? {};

    return {
      scores: {
        contentStructure: this.toScoreRequired(
          'contentStructure',
          scores.contentStructure,
        ),
        coherence: this.toScoreRequired('coherence', scores.coherence),
        topicRelevance: this.toScoreRequired(
          'topicRelevance',
          scores.topicRelevance,
        ),
        grammar: this.toScoreRequired('grammar', scores.grammar),
        vocabulary: this.toScoreRequired('vocabulary', scores.vocabulary),
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

  private validateScores(data: DeepSeekEvaluationResult): void {
    const requiredScores = [
      'contentStructure',
      'coherence',
      'topicRelevance',
      'grammar',
      'vocabulary',
    ] as const;
    for (const k of requiredScores) {
      const n = data.scores[k];
      if (typeof n !== 'number' || Number.isNaN(n)) {
        throw new Error(`Missing score: ${k}`);
      }
    }
  }

  /** Reject boilerplate / truncated narratives so we retry instead of accepting weak output */
  private validateNarrativeQuality(data: DeepSeekEvaluationResult): void {
    const { summary, keyPoints, strengths, improvements } = data.analysis;
    if (summary.length < 50) {
      throw new Error('Summary too short or empty');
    }
    if (keyPoints.length < 3) {
      throw new Error('Need at least 3 keyPoints');
    }
    const tooShort = (s: string) => s.trim().length < 18;
    if (keyPoints.some(tooShort)) {
      throw new Error('keyPoints too short (need substantive phrases)');
    }
    if (strengths.length < 3 || improvements.length < 3) {
      throw new Error('Need at least 3 strengths and 3 improvements');
    }
    if (strengths.some(tooShort) || improvements.some(tooShort)) {
      throw new Error('strengths/improvements too vague');
    }

    const banned = [
      /^good effort to address the topic$/i,
      /^provides basic information$/i,
      /^clear and understandable speech$/i,
      /^add more specific details to enrich your response$/i,
      /^use more varied vocabulary$/i,
      /^practice structuring your response with clear paragraphs$/i,
      /^personal information$/i,
      /^interests and family$/i,
    ];
    const allBullets = [...keyPoints, ...strengths, ...improvements];
    for (const line of allBullets) {
      for (const re of banned) {
        if (re.test(line.trim())) {
          throw new Error('Boilerplate bullet detected — retry');
        }
      }
    }
  }

  private formatSpeechMetricsBlock(m?: SpeechMetrics): string {
    if (!m) return '';
    const d = m.details;
    return `

DELIVERY METRICS (from automatic audio analysis — use these to align your CEFR judgment and to mention delivery in analysis when relevant; do not invent numbers):
- Fluency (0–100): ${m.fluency}
- Pronunciation (0–100): ${m.pronunciation}
- Speaking pace score (0–100): ${m.speakingPace}
- Confidence (0–100): ${m.confidence}
- Words per minute: ${d?.wordsPerMinute ?? 'n/a'}
- Filler words (count): ${d?.fillerWords ?? 'n/a'}
- Average pause duration (seconds): ${d?.averagePauseDuration ?? 'n/a'}
- Total words (approx.): ${d?.totalWords ?? 'n/a'}`;
  }

  private buildPrompt(
    transcript: string,
    subject: string,
    language: 'en' | 'fr',
    mode: 'strict' | 'encouraging',
    speechMetrics?: SpeechMetrics,
  ): string {
    const metricsBlock = this.formatSpeechMetricsBlock(speechMetrics);

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
${metricsBlock}

Évalue selon ces critères (0-100):

1. structureContenu: organisation (introduction, développement, conclusion)
2. coherence: fluidité logique des idées
3. pertinenceSujet: dans quelle mesure la réponse correspond-elle au sujet?
4. grammaire: précision grammaticale
5. vocabulaire: richesse et précision du vocabulaire

Pour la pertinence du sujet, sois GÉNÉREUX. Si l'étudiant fait un effort pour répondre, donne 70-90.
Une auto-présentation qui inclut nom, origine, éducation, loisirs et famille mérite 85-95.

QUALITÉ DU COMMENTAIRE (pour les enseignants) — utilise les champs JSON anglais ci-dessous:
- summary: 2–4 phrases, ancrées dans la transcription et cohérentes avec les métriques de parole si fournies.
- keyPoints: 4–6 éléments tirés du contenu réel de la transcription.
- strengths / improvements: 4–6 chacun, concrets, sans généralités vagues.
- detailedFeedback: structure, lacunes, suggestions de vocabulaire — toujours liés à ce que l'apprenant a dit.

Retourne UNIQUEMENT ce JSON (clés en anglais comme ci-dessous):
{
  "scores": { "contentStructure": number, "coherence": number, "topicRelevance": number, "grammar": number, "vocabulary": number },
  "analysis": { "summary": "string", "keyPoints": ["string"], "strengths": ["string"], "improvements": ["string"], "cefrLevel": "B1" },
  "detailedFeedback": { "structure": "string", "contentGaps": ["string"], "vocabularySuggestions": ["string"] }
}`;
    }

    return `You are a language evaluation expert for English learners.

${scoringGuide}

Subject / task: "${subject}"
Student transcript (verbatim): "${transcript}"
${metricsBlock}

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

NARRATIVE QUALITY (critical — instructors read this; weak generic text is unacceptable):
- summary: 2–4 full sentences. Say what the learner actually argued or described and how it relates to the subject. If delivery metrics are provided, mention pace/fluency/fillers only when consistent with the transcript.
- keyPoints: 4–6 items. Each MUST paraphrase a distinct idea that appears in the transcript (not the subject line alone, not placeholder topics).
- strengths: 4–6 items. Reference concrete wording, structures, or ideas from the transcript OR cite delivery metrics explicitly (e.g. WPM, fillers).
- improvements: 4–6 items. Target observable issues in the transcript (grammar patterns, logic gaps, thin development, repetition) or delivery metrics.
- detailedFeedback.structure: 2–5 sentences about spoken discourse organization.
- detailedFeedback.contentGaps: what a stronger answer to THIS subject would still add.
- detailedFeedback.vocabularySuggestions: tie suggestions to words the learner actually used.
- cefrLevel: any A1–C2 (server recalibrates from your scores)

Return ONLY this JSON (no markdown, no commentary):
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

  /** When LLMs fail: still derive bullets FROM the transcript + metrics (no fake "Personal information" rows). */
  private fallbackEvaluation(
    transcript: string,
    subject: string,
    speechMetrics?: SpeechMetrics,
  ): DeepSeekEvaluationResult {
    const cleaned = transcript.replace(/\s+/g, ' ').trim();
    const wordCount = cleaned ? cleaned.split(/\s+/).length : 0;
    const sentences = cleaned
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);

    const keyPoints = this.transcriptKeyPoints(cleaned, sentences, 5);
    const summary = this.transcriptSummary(cleaned, subject, sentences);
    const { strengths, improvements } = this.metricsTiedFeedback(
      speechMetrics,
      cleaned,
      wordCount,
      sentences.length,
    );

    const structureScore = Math.min(90, 48 + sentences.length * 7);
    const vocabScore = Math.min(88, 55 + wordCount * 0.35);
    const grammarScore = Math.min(82, 62 + (sentences.length > 3 ? 8 : 0));
    const hasRelevantTerms = subject
      .toLowerCase()
      .split(/\s+/)
      .some(
        (term) =>
          term.length > 2 && cleaned.toLowerCase().includes(term.toLowerCase()),
      );
    const topicRelevance = hasRelevantTerms ? 78 : 62;

    const gaps = this.suggestContentGaps(subject, keyPoints);

    return {
      scores: {
        contentStructure: Math.round(structureScore),
        coherence: Math.min(85, 58 + sentences.length * 3),
        topicRelevance,
        grammar: Math.round(grammarScore),
        vocabulary: Math.round(vocabScore),
      },
      analysis: {
        summary,
        keyPoints,
        strengths,
        improvements,
        cefrLevel: 'B1',
      },
      detailedFeedback: {
        structure: `The response unfolds over ${sentences.length} spoken segment(s) with roughly ${wordCount} words. ${sentences.length >= 3 ? 'There is some progression of ideas across sentences.' : 'Ideas are mostly carried in fewer, longer stretches — cohesion could be strengthened with clearer transitions.'}`,
        contentGaps: gaps,
        vocabularySuggestions: this.vocabFromTranscript(cleaned),
      },
    };
  }

  private transcriptKeyPoints(
    cleaned: string,
    sentences: string[],
    max: number,
  ): string[] {
    const clip = (s: string) =>
      s.length > 140 ? `${s.slice(0, 137).trim()}...` : s;
    if (sentences.length >= 3) {
      return sentences.slice(0, max).map(clip);
    }
    const parts = cleaned
      .split(/\s+(?:and|but|so|because|which|that)\s+/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);
    if (parts.length >= 2) {
      return parts.slice(0, max).map(clip);
    }
    const chunks: string[] = [];
    let rest = cleaned;
    while (rest.length > 30 && chunks.length < max) {
      const take = rest.slice(0, 120).trim();
      const lastSpace = take.lastIndexOf(' ');
      const piece =
        lastSpace > 40 ? take.slice(0, lastSpace) : take;
      chunks.push(piece.length > 140 ? `${piece.slice(0, 137)}...` : piece);
      rest = rest.slice(piece.length).trim();
    }
    return chunks.length > 0 ? chunks : [clip(cleaned)];
  }

  private transcriptSummary(
    cleaned: string,
    subject: string,
    sentences: string[],
  ): string {
    const topic = subject?.trim() || 'the assigned task';
    if (sentences.length >= 2) {
      const a = sentences[0];
      const b = sentences[1];
      return `On "${topic}", the learner states: ${a} They add: ${b}${sentences.length > 2 ? ' Further details follow in the rest of the recording.' : ''}`;
    }
    if (sentences.length === 1) {
      return `On "${topic}", the learner concentrates mainly on one stretch of speech: ${sentences[0]}`;
    }
    const excerpt =
      cleaned.length > 320 ? `${cleaned.slice(0, 317)}...` : cleaned;
    return `On "${topic}", the spoken response (continuous text) covers the following content: ${excerpt}`;
  }

  private metricsTiedFeedback(
    m: SpeechMetrics | undefined,
    cleaned: string,
    wordCount: number,
    sentenceCount: number,
  ): { strengths: string[]; improvements: string[] } {
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (m) {
      if (m.fluency >= 72) {
        strengths.push(
          `Fluency score (${m.fluency}/100) suggests relatively smooth delivery for this response length.`,
        );
      } else if (m.fluency < 55) {
        improvements.push(
          `Fluency score (${m.fluency}/100) is low — practice connected speech and reduce hesitation on the ideas in this transcript.`,
        );
      }
      if (m.pronunciation >= 72) {
        strengths.push(
          `Pronunciation score (${m.pronunciation}/100) indicates the speech was generally intelligible.`,
        );
      } else if (m.pronunciation < 55) {
        improvements.push(
          `Pronunciation score (${m.pronunciation}/100) suggests focusing on clarity for key terms used in the response.`,
        );
      }
      const fillers = m.details?.fillerWords ?? 0;
      const wpm = m.details?.wordsPerMinute ?? 0;
      if (wpm > 0) {
        strengths.push(
          `Speaking rate is about ${wpm} words per minute (automatic estimate).`,
        );
      }
      if (fillers > 5) {
        improvements.push(
          `Frequent filler words (${fillers} counted) — rehearse the main ideas in this transcript to reduce pauses.`,
        );
      }
      const pause = m.details?.averagePauseDuration ?? 0;
      if (pause > 1.2) {
        improvements.push(
          `Average pause length (~${pause.toFixed(1)}s) is high; shorter planning pauses would tighten delivery.`,
        );
      }
    }

    if (wordCount >= 55) {
      strengths.push(
        `Substantive length (~${wordCount} words) gives enough material to assess ideas beyond a minimal answer.`,
      );
    } else {
      improvements.push(
        `Response is fairly short (~${wordCount} words) — expanding with examples would better satisfy the task.`,
      );
    }
    if (sentenceCount >= 4) {
      strengths.push(
        `Multiple sentences (${sentenceCount}) show an attempt to build the answer in steps.`,
      );
    } else {
      improvements.push(
        `Only ${sentenceCount} clear sentence-like unit(s) detected — break ideas into more explicit sentences for clarity.`,
      );
    }

    const uniq = new Set(cleaned.toLowerCase().split(/\s+/));
    if (uniq.size / Math.max(wordCount, 1) < 0.45 && wordCount > 25) {
      improvements.push(
        'Noticeable word repetition in the transcript — vary nouns and verbs when revising.',
      );
    }

    if (strengths.length < 4) {
      strengths.push(
        `Excerpt from the learner's wording: "${cleaned.slice(0, Math.min(100, cleaned.length))}${cleaned.length > 100 ? '...' : ''}"`,
      );
    }
    if (strengths.length < 4) {
      strengths.push(
        'The answer presents a continuous attempt to address the prompt rather than stopping after a single phrase.',
      );
    }
    if (improvements.length < 4) {
      improvements.push(
        'Take the longest sentence in the recording, write it on paper, and correct grammar before re-recording.',
      );
    }
    if (improvements.length < 4) {
      improvements.push(
        'Add one concrete example or number that supports the main claim you make in the transcript.',
      );
    }
    if (improvements.length < 4) {
      improvements.push(
        'Outline three bullets before recording so each idea gets its own clear sentence.',
      );
    }

    return {
      strengths: strengths.slice(0, 6),
      improvements: improvements.slice(0, 6),
    };
  }

  private suggestContentGaps(
    subject: string,
    keyPoints: string[],
  ): string[] {
    const gaps: string[] = [];
    const subj = subject.toLowerCase();
    const blob = keyPoints.join(' ').toLowerCase();

    if (/introduce|yourself|about you/.test(subj)) {
      if (!/study|university|college|work|job|degree/i.test(blob)) {
        gaps.push(
          'A stronger self-introduction often adds study or work context.',
        );
      }
      if (!/hobby|like|enjoy|free time/i.test(blob)) {
        gaps.push('Could add interests or how they spend free time.');
      }
    } else {
      gaps.push(
        `Compare the response explicitly to all parts of the prompt: "${subject}".`,
      );
    }
    gaps.push(
      'Add one concrete example or scenario that illustrates the main claim.',
    );
    return gaps.slice(0, 5);
  }

  private vocabFromTranscript(cleaned: string): string[] {
    const words = cleaned
      .toLowerCase()
      .replace(/[^a-z\s']/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4);
    const freq = new Map<string, number>();
    for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
    const repeated = [...freq.entries()]
      .filter(([, n]) => n >= 3)
      .map(([w]) => w);
    const out: string[] = [];
    for (const w of repeated.slice(0, 3)) {
      out.push(
        `The learner repeats "${w}" often — introduce synonyms or more specific terms next time.`,
      );
    }
    if (out.length === 0) {
      out.push(
        'Pick two important nouns from your answer and prepare richer alternatives before recording again.',
      );
    }
    return out.slice(0, 5);
  }
}
