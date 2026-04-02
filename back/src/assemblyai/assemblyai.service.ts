// backend/src/assemblyai/assemblyai.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AssemblyAI } from 'assemblyai';
import { EvaluationResult, SpeechMetrics } from './interfaces/assemblyai.types';

@Injectable()
export class AssemblyAIService {
  private readonly logger = new Logger(AssemblyAIService.name);
  private client: AssemblyAI;

  constructor() {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'ASSEMBLYAI_API_KEY is not defined in environment variables',
      );
    }

    this.client = new AssemblyAI({
      apiKey: apiKey,
    });
  }

  // Helper function to normalize timestamps (convert milliseconds to seconds if needed)
  private normalizeTime(time: number): number {
    // If time is extremely large (> 1000), it's probably in milliseconds
    // Convert to seconds
    if (time > 1000) {
      return time / 1000;
    }
    return time;
  }

  // Statistical helper methods for pronunciation analysis
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
    return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private findLowConfidenceClusters(
    confidences: number[],
    threshold: number = 0.7,
  ): number {
    let clusters = 0;
    let currentClusterLength = 0;

    for (let i = 0; i < confidences.length; i++) {
      if (confidences[i] < threshold) {
        currentClusterLength++;
        // Count as a cluster when we have 3+ low confidence words in a row
        if (currentClusterLength === 3) {
          clusters++;
        }
      } else {
        currentClusterLength = 0;
      }
    }

    return clusters;
  }

  private analyzeWordConfidencePatterns(words: any[]): any {
    const confidences = words.map((w) => w.confidence);

    // Basic statistics
    const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = this.calculateVariance(confidences);
    const min = Math.min(...confidences);
    const max = Math.max(...confidences);

    // Count words by confidence levels
    const excellent = confidences.filter((c) => c >= 0.95).length;
    const good = confidences.filter((c) => c >= 0.85 && c < 0.95).length;
    const fair = confidences.filter((c) => c >= 0.7 && c < 0.85).length;
    const poor = confidences.filter((c) => c >= 0.5 && c < 0.7).length;
    const veryPoor = confidences.filter((c) => c < 0.5).length;

    // Find problematic clusters
    const clusters = this.findLowConfidenceClusters(confidences, 0.7);

    // Calculate standard deviation
    const stdDev = Math.sqrt(variance);

    return {
      avg,
      variance,
      stdDev,
      min,
      max,
      distribution: { excellent, good, fair, poor, veryPoor },
      clusters,
      totalWords: words.length,
    };
  }

  async evaluateAudio(audioBuffer: Buffer): Promise<EvaluationResult> {
    this.logger.log('========== STARTING ASSEMBLYAI EVALUATION ==========');

    try {
      // Force English language and disable auto-detection
      const transcript = await this.client.transcripts.transcribe({
        audio: audioBuffer,
        speech_models: ['universal'],
        language_code: 'en_us', // Force US English
        language_detection: false, // Disable auto-detection
        speaker_labels: true,
        sentiment_analysis: true,
        auto_chapters: true,
        entity_detection: true,
      });

      if (transcript.status === 'error') {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      // Log the full transcript for debugging
      this.logger.log(`✅ Transcript received: "${transcript.text}"`);
      this.logger.log(`Language: ${transcript.language_code || 'en_us'}`);
      this.logger.log(`Audio duration: ${transcript.audio_duration}s`);

      // Log word timestamps for debugging
      if (transcript.words && transcript.words.length > 0) {
        this.logger.log(`📝 Word count: ${transcript.words.length}`);
        this.logger.log(`First few words with RAW timestamps:`);
        transcript.words
          .slice(0, Math.min(5, transcript.words.length))
          .forEach((w: any, i: number) => {
            this.logger.log(
              `  [${i}] "${w.text}" - raw start: ${w.start}, raw end: ${w.end}, confidence: ${w.confidence}`,
            );
          });

        // Check if timestamps are in milliseconds
        const firstWord = transcript.words[0];
        if (firstWord.start > 1000) {
          this.logger.log(
            `⚠️ Timestamps appear to be in milliseconds (value > 1000), will normalize to seconds`,
          );
        }

        // Calculate total speaking time from first to last word using normalized values
        const firstWordNormalized = {
          ...firstWord,
          start: this.normalizeTime(firstWord.start),
          end: this.normalizeTime(firstWord.end),
        };

        const lastWord = transcript.words[transcript.words.length - 1];
        const lastWordNormalized = {
          ...lastWord,
          start: this.normalizeTime(lastWord.start),
          end: this.normalizeTime(lastWord.end),
        };

        const speakingDuration =
          lastWordNormalized.end - firstWordNormalized.start;
        this.logger.log(
          `Speaking duration (normalized): ${speakingDuration.toFixed(2)}s (from first to last word)`,
        );
      }

      // Calculate metrics from transcript
      const metrics = this.calculateMetrics(transcript as any);

      this.logger.log(`📊 Calculated metrics:`, metrics);

      const result: EvaluationResult = {
        transcript: transcript.text || '',
        metrics,
        rawData: {
          sentiment:
            (transcript.sentiment_analysis_results?.filter(Boolean) as any) ||
            undefined,
          chapters: (transcript.chapters?.filter(Boolean) as any) || undefined,
        },
      };

      this.logger.log('========== ASSEMBLYAI EVALUATION COMPLETED ==========');
      return result;
    } catch (error) {
      this.logger.error(`❌ AssemblyAI error: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }
  }

  private calculateMetrics(transcript: any): SpeechMetrics {
    const words = transcript.words || [];

    const fluency = this.calculateFluency(words);
    const pronunciation = this.calculatePronunciation(words);
    const speakingPace = this.calculateWordsPerMinute(words);
    const confidence = this.calculateConfidence(
      transcript.text || '',
      transcript.sentiment_analysis_results || [],
      words, // Pass words array for confidence calculation
    );
    const details = this.calculateDetails(
      words,
      transcript.audio_duration || 0,
    );

    return {
      fluency,
      pronunciation,
      speakingPace,
      confidence,
      details,
    };
  }

  private calculateWordsPerMinute(words: any[]): number {
    if (!words || words.length < 2) {
      this.logger.log(
        `⚠️ Not enough words to calculate WPM: ${words?.length || 0}`,
      );
      return 0;
    }

    // Normalize timestamps (convert milliseconds to seconds if needed)
    const normalizedWords = words.map((w) => ({
      ...w,
      start: this.normalizeTime(w.start),
      end: this.normalizeTime(w.end),
    }));

    const firstWord = normalizedWords[0];
    const lastWord = normalizedWords[normalizedWords.length - 1];

    // Log raw vs normalized values for first word
    this.logger.log(
      `First word: "${firstWord.text}" - raw start: ${words[0].start}, normalized start: ${firstWord.start}s`,
    );

    const startTime = firstWord.start;
    const endTime = lastWord.end;

    // Calculate duration in minutes
    const durationMinutes = (endTime - startTime) / 60;

    if (durationMinutes <= 0) {
      this.logger.log(
        `⚠️ Invalid duration for WPM: ${durationMinutes} minutes`,
      );
      return 0;
    }

    const wpm = Math.round(words.length / durationMinutes);

    this.logger.log(
      `⏱️ WPM calculation: ${words.length} words from ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s = ${durationMinutes.toFixed(2)}min = ${wpm} WPM`,
    );

    // Ensure WPM is reasonable (between 50 and 250 for normal speech)
    if (wpm > 250) {
      this.logger.log(`⚠️ Unusually high WPM (${wpm}), capping at 250`);
      return 250;
    }
    if (wpm < 50 && words.length > 10) {
      this.logger.log(
        `⚠️ Unusually low WPM (${wpm}), might indicate timestamp issue`,
      );
    }

    return wpm;
  }

  private calculateFluency(words: any[]): number {
    if (!words || words.length < 2) {
      this.logger.log(
        `⚠️ Not enough words to calculate fluency: ${words?.length || 0}`,
      );
      return 0;
    }

    let pauseCount = 0;
    let totalPauseDuration = 0;
    const PAUSE_THRESHOLD = 0.3; // 300ms in seconds

    this.logger.log(`🔍 Analyzing fluency with ${words.length} words...`);

    // Create normalized words array
    const normalizedWords = words.map((w) => ({
      ...w,
      start: this.normalizeTime(w.start),
      end: this.normalizeTime(w.end),
    }));

    for (let i = 1; i < normalizedWords.length; i++) {
      const gap = normalizedWords[i].start - normalizedWords[i - 1].end;

      // Log significant gaps
      if (gap > 0.1) {
        this.logger.log(
          `  Gap ${i}: "${normalizedWords[i - 1].text}" → "${normalizedWords[i].text}" = ${gap.toFixed(2)}s`,
        );
      }

      if (gap > PAUSE_THRESHOLD) {
        pauseCount++;
        totalPauseDuration += gap;
        this.logger.log(`  ⚠️ Pause detected: ${gap.toFixed(2)}s`);
      }
    }

    const avgPause = pauseCount > 0 ? totalPauseDuration / pauseCount : 0;

    // Calculate fluency score (0-100)
    // Base score 100, subtract penalties
    let fluencyScore = 100;

    // Penalty for number of pauses (each pause reduces score)
    fluencyScore -= pauseCount * 5;

    // Penalty for average pause duration
    if (avgPause > 0.5) {
      fluencyScore -= (avgPause - 0.5) * 20;
    }

    // Ensure score is within 0-100
    fluencyScore = Math.max(0, Math.min(100, Math.round(fluencyScore)));

    this.logger.log(
      `📊 Fluency calculation: ${pauseCount} pauses, avg ${avgPause.toFixed(2)}s, score: ${fluencyScore}`,
    );

    return fluencyScore;
  }

  // ENHANCED pronunciation calculation with statistical analysis
  private calculatePronunciation(words: any[]): number {
    if (!words || words.length === 0) {
      this.logger.log(`⚠️ No words to calculate pronunciation`);
      return 0;
    }

    this.logger.log(
      `🔍 Enhanced pronunciation analysis with ${words.length} words:`,
    );

    // Log each word's confidence for debugging
    words.forEach((w, i) => {
      const confidencePercent = Math.round(w.confidence * 100);
      let indicator = '✅';
      if (w.confidence < 0.85) indicator = '⚠️';
      if (w.confidence < 0.7) indicator = '🔴';
      if (w.confidence < 0.5) indicator = '❌';

      this.logger.log(
        `  ${indicator} [${i}] "${w.text}": ${confidencePercent}%`,
      );
    });

    // Get detailed statistical analysis
    const analysis = this.analyzeWordConfidencePatterns(words);

    this.logger.log(`📊 Confidence distribution:
      Excellent (≥95%): ${analysis.distribution.excellent} words
      Good (85-94%): ${analysis.distribution.good} words
      Fair (70-84%): ${analysis.distribution.fair} words
      Poor (50-69%): ${analysis.distribution.poor} words
      Very Poor (<50%): ${analysis.distribution.veryPoor} words
      Problem clusters: ${analysis.clusters}
      Variance: ${analysis.variance.toFixed(4)}
      Std Dev: ${analysis.stdDev.toFixed(4)}`);

    // Calculate weighted score based on distribution
    let weightedScore = 0;

    // Weight each confidence level differently
    weightedScore += analysis.distribution.excellent * 100;
    weightedScore += analysis.distribution.good * 85;
    weightedScore += analysis.distribution.fair * 70;
    weightedScore += analysis.distribution.poor * 50;
    weightedScore += analysis.distribution.veryPoor * 30;

    // Calculate average weighted score
    let pronunciationScore = weightedScore / words.length;

    // Apply penalties
    // Penalty for high variance (inconsistent pronunciation)
    if (analysis.variance > 0.02) {
      const variancePenalty = Math.min(15, analysis.variance * 200);
      pronunciationScore -= variancePenalty;
      this.logger.log(`📉 Variance penalty: -${variancePenalty.toFixed(1)}%`);
    }

    // Penalty for problem clusters
    if (analysis.clusters > 0) {
      const clusterPenalty = analysis.clusters * 5;
      pronunciationScore -= clusterPenalty;
      this.logger.log(
        `📉 Cluster penalty: -${clusterPenalty}% (${analysis.clusters} clusters)`,
      );
    }

    // Bonus for consistency (low variance)
    if (analysis.variance < 0.005 && words.length > 5) {
      pronunciationScore += 5;
      this.logger.log(`📈 Consistency bonus: +5%`);
    }

    // Ensure score is within 0-100
    pronunciationScore = Math.max(
      0,
      Math.min(100, Math.round(pronunciationScore)),
    );

    this.logger.log(
      `🎤 Final enhanced pronunciation score: ${pronunciationScore}%`,
    );

    return pronunciationScore;
  }

  private calculateConfidence(
    text: string,
    sentimentResults: any[],
    words: any[],
  ): number {
    // Filler words penalty
    const fillerWords = [
      'um',
      'uh',
      'hmm',
      'ah',
      'er',
      'like',
      'you know',
      'well',
    ];
    const lowerText = text?.toLowerCase() || '';
    let fillerCount = 0;

    fillerWords.forEach((filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) fillerCount += matches.length;
    });

    // Sentiment analysis
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    if (sentimentResults) {
      positiveCount = sentimentResults.filter(
        (s) => s?.sentiment === 'POSITIVE',
      ).length;
      negativeCount = sentimentResults.filter(
        (s) => s?.sentiment === 'NEGATIVE',
      ).length;
      neutralCount = sentimentResults.filter(
        (s) => s?.sentiment === 'NEUTRAL',
      ).length;
    }

    // Factor 1: Filler words (max 30 points)
    const fillerScore = Math.max(0, 30 - fillerCount * 8);

    // Factor 2: Sentiment positivity (max 20 points)
    const totalSentiments = positiveCount + negativeCount + neutralCount;
    let sentimentScore = 15; // Base sentiment score
    if (totalSentiments > 0) {
      const positivityRatio = positiveCount / totalSentiments;
      sentimentScore = 15 + positivityRatio * 10; // 15-25 range
    }

    // Factor 3: Word confidence (NEW - max 30 points)
    // Lower confidence words indicate uncertainty/hesitation
    let lowConfidenceCount = 0;
    if (words) {
      lowConfidenceCount = words.filter((w) => w.confidence < 0.8).length;
    }
    const confidenceScore = Math.max(0, 30 - lowConfidenceCount * 8);

    // Factor 4: Speech length (max 20 points)
    const wordCount = text.split(' ').length;
    const lengthScore = Math.min(20, Math.floor(wordCount / 2));

    // Calculate total
    let totalScore =
      fillerScore + sentimentScore + confidenceScore + lengthScore;

    // Ensure within 0-100
    totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

    this.logger.log(`💪 Confidence breakdown:
      Filler words (${fillerCount}): ${fillerScore}
      Sentiment (${positiveCount} pos): ${sentimentScore}
      Low confidence words (${lowConfidenceCount}): ${confidenceScore}
      Word count (${wordCount}): ${lengthScore}
      Total: ${totalScore}`);

    return totalScore;
  }

  private calculateDetails(words: any[], audioDuration: number): any {
    const fillerWords = ['um', 'uh', 'hmm', 'ah', 'er', 'like'];

    // Normalize timestamps
    const normalizedWords = words.map((w) => ({
      ...w,
      start: this.normalizeTime(w.start),
      end: this.normalizeTime(w.end),
    }));

    const fillerCount = normalizedWords.filter((w) =>
      fillerWords.includes(w.text?.toLowerCase() || ''),
    ).length;

    // Calculate pauses
    let totalPauseDuration = 0;
    let pauseCount = 0;
    const PAUSE_THRESHOLD = 0.3;

    for (let i = 1; i < normalizedWords.length; i++) {
      const gap = normalizedWords[i].start - normalizedWords[i - 1].end;
      if (gap > PAUSE_THRESHOLD) {
        pauseCount++;
        totalPauseDuration += gap;
      }
    }

    // Calculate total speaking time (from first word to last word)
    let totalSpeakingTime = this.normalizeTime(audioDuration);
    if (normalizedWords.length >= 2) {
      totalSpeakingTime =
        normalizedWords[normalizedWords.length - 1].end -
        normalizedWords[0].start;
    }

    // Calculate words per minute using normalized words
    const wpm = this.calculateWordsPerMinute(normalizedWords);

    const details = {
      totalWords: words.length,
      fillerWords: fillerCount,
      averagePauseDuration:
        pauseCount > 0
          ? Math.round((totalPauseDuration / pauseCount) * 100) / 100
          : 0,
      wordsPerMinute: wpm,
      totalSpeakingTime: Math.round(totalSpeakingTime * 10) / 10,
    };

    this.logger.log(`📋 Details: ${JSON.stringify(details)}`);

    return details;
  }
}
