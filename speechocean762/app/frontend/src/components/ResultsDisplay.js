import React from 'react';
import ScoreCard from './ScoreCard';
import './ResultsDisplay.css';

function ResultsDisplay({ results, onReset }) {
  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50'; // Green
    if (score >= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const getScoreGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  return (
    <div className="results-display">
      <div className="results-card">
        <h2>📊 Evaluation Results</h2>

        <div className="overall-score">
          <div className="score-circle" style={{ borderColor: getScoreColor(results.overall_score) }}>
            <div className="score-value">{results.overall_score.toFixed(1)}</div>
            <div className="score-grade">{getScoreGrade(results.overall_score)}</div>
          </div>
          <div className="overall-text">
            <p className="congratulations">Great effort!</p>
            <p className="score-message">
              Your overall score is <strong>{results.overall_score.toFixed(1)}/100</strong>
            </p>
          </div>
        </div>

        <div className="metrics-grid">
          <ScoreCard
            title="🎯 Pronunciation"
            score={results.pronunciation.score}
            details={[
              { label: 'Clarity', value: results.pronunciation.clarity.toFixed(1) },
              { label: 'Articulation', value: results.pronunciation.articulation.toFixed(1) },
              { label: 'Energy Consistency', value: results.pronunciation.energy_consistency.toFixed(1) }
            ]}
          />

          <ScoreCard
            title="🌊 Fluency"
            score={results.fluency.score}
            details={[
              { label: 'Continuity', value: results.fluency.continuity.toFixed(1) },
              { label: 'Rhythm', value: results.fluency.rhythm.toFixed(1) },
              { label: 'Pause Quality', value: results.fluency.pause_quality.toFixed(1) }
            ]}
          />

          <ScoreCard
            title="💪 Confidence"
            score={results.confidence.score}
            details={[
              { label: 'Energy Stability', value: results.confidence.energy_stability.toFixed(1) },
              { label: 'Amplitude Consistency', value: results.confidence.amplitude_consistency.toFixed(1) },
              { label: 'Hesitation Level', value: results.confidence.hesitation_level.toFixed(1) }
            ]}
          />

          <ScoreCard
            title="⚡ Speaking Pace"
            score={results.speaking_pace.score}
            details={[
              { label: 'Words/Minute', value: results.speaking_pace.words_per_minute.toFixed(1) },
              { label: 'Total Words', value: results.speaking_pace.total_words },
              { label: 'Duration (sec)', value: results.speaking_pace.duration_seconds.toFixed(1) }
            ]}
          />

          <ScoreCard
            title="📝 Content Structure"
            score={results.content_structure.score}
            details={[
              { label: 'Word Count', value: results.content_structure.word_count },
              { label: 'Completeness', value: results.content_structure.completeness.toFixed(1) },
              { label: 'Accuracy', value: (results.content_structure.reference_match || 'N/A') }
            ]}
          />
        </div>

        {results.content_structure.transcription && (
          <div className="transcription-box">
            <h3>📄 Your Transcription</h3>
            <p className="transcription-text">
              "{results.content_structure.transcription}"
            </p>
          </div>
        )}

        {results.speaking_pace.assessment && (
          <div className="assessment-box">
            <h3>💬 Feedback</h3>
            <p className="pace-assessment">
              <strong>Speaking Pace:</strong> {results.speaking_pace.assessment}
            </p>
          </div>
        )}

        <div className="action-buttons">
          <button onClick={onReset} className="evaluate-again-btn">
            🔄 Evaluate Another Recording
          </button>
        </div>

        <div className="tips-box">
          <h4>💡 Tips for Improvement:</h4>
          <ul>
            <li>Practice pronunciation of difficult phonemes daily</li>
            <li>Record yourself and listen back to identify areas of improvement</li>
            <li>Try to maintain a steady speaking pace (120-160 WPM)</li>
            <li>Pause naturally between sentences for better fluency</li>
            <li>Focus on stress and intonation patterns in English</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ResultsDisplay;
