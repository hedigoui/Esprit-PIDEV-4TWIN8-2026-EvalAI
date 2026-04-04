/**
 * CEFR level is derived from the same numeric signals stored on the evaluation
 * (content scores + optional speech metrics), so the label always matches the rubric details.
 *
 * Topic relevance is only a small nudge (task fit ≠ global proficiency tier).
 */

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type ContentScoresInput = {
  contentStructure: number;
  coherence: number;
  topicRelevance: number;
  grammar: number;
  vocabulary: number;
};

export type SpeechMetricsInput = {
  fluency: number;
  pronunciation: number;
  speakingPace: number;
  confidence: number;
};

/** 0–100 holistic oral index (higher = stronger). */
export function holisticOralIndex(
  content: ContentScoresInput,
  speech?: SpeechMetricsInput | null,
): number {
  const g = clamp01(content.grammar);
  const v = clamp01(content.vocabulary);
  const c = clamp01(content.coherence);
  const s = clamp01(content.contentStructure);
  const core = (g + v + c + s) / 4;

  const tr = clamp01(content.topicRelevance);
  const taskNudge = Math.min(6, Math.max(0, (tr - 65) * 0.12));

  if (
    speech &&
    [speech.fluency, speech.pronunciation, speech.confidence, speech.speakingPace].every(
      (n) => typeof n === 'number' && Number.isFinite(n),
    )
  ) {
    const delivery =
      (clamp01(speech.fluency) +
        clamp01(speech.pronunciation) +
        clamp01(speech.confidence) +
        clamp01(speech.speakingPace)) /
      4;
    const blended = 0.52 * core + 0.48 * delivery + taskNudge * 0.55;
    return Math.min(100, Math.round(blended));
  }

  const out = core + taskNudge;
  return Math.min(100, Math.round(out));
}

export function indexToCefr(index: number): CefrLevel {
  if (index <= 37) return 'A1';
  if (index <= 47) return 'A2';
  if (index <= 57) return 'B1';
  if (index <= 68) return 'B2';
  if (index <= 80) return 'C1';
  return 'C2';
}

export function deriveCefrLevel(
  content: ContentScoresInput,
  speech?: SpeechMetricsInput | null,
): CefrLevel {
  return indexToCefr(holisticOralIndex(content, speech));
}

function clamp01(n: number): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
