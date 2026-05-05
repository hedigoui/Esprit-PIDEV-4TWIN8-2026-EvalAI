import ScoreCard from './ScoreCard';

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
            score={results.pronunciation?.score || 0}
            details={[
              { label: 'Clarity', value: results.pronunciation?.clarity?.toFixed(1) || 'N/A' },
              { label: 'Articulation', value: results.pronunciation?.articulation?.toFixed(1) || 'N/A' },
              { label: 'Energy Consistency', value: results.pronunciation?.energy_consistency?.toFixed(1) || 'N/A' }
            ]}
          />

          <ScoreCard
            title="🌊 Fluency"
            score={results.fluency?.score || 0}
            details={[
              { label: 'Continuity', value: results.fluency?.continuity?.toFixed(1) || 'N/A' },
              { label: 'Rhythm', value: results.fluency?.rhythm?.toFixed(1) || 'N/A' },
              { label: 'Pause Quality', value: results.fluency?.pause_quality?.toFixed(1) || 'N/A' }
            ]}
          />

          <ScoreCard
            title="💪 Confidence"
            score={results.confidence?.score || 0}
            details={[
              { label: 'Energy Stability', value: results.confidence?.energy_stability?.toFixed(1) || 'N/A' },
              { label: 'Amplitude Consistency', value: results.confidence?.amplitude_consistency?.toFixed(1) || 'N/A' },
              { label: 'Hesitation Level', value: results.confidence?.hesitation_level?.toFixed(1) || 'N/A' }
            ]}
          />

          <ScoreCard
            title="⚡ Speaking Pace"
            score={results.speaking_pace?.score || 0}
            details={[
              { label: 'Words/Minute', value: results.speaking_pace?.words_per_minute?.toFixed(1) || 'N/A' },
              { label: 'Total Words', value: results.speaking_pace?.total_words || 'N/A' },
              { label: 'Duration (sec)', value: results.speaking_pace?.duration_seconds?.toFixed(1) || 'N/A' }
            ]}
          />

          <ScoreCard
            title="📝 Content Structure"
            score={results.content_structure?.score || 0}
            details={[
              { label: 'Word Count', value: results.content_structure?.word_count || 'N/A' },
              { label: 'Completeness', value: results.content_structure?.completeness?.toFixed(1) || 'N/A' },
              { label: 'Accuracy', value: results.content_structure?.reference_match || 'N/A' }
            ]}
          />
        </div>

        {results.speaking_pace?.assessment && (
          <div className="assessment-box">
            <h3>💬 Assessment</h3>
            <p className="assessment-text">{results.speaking_pace.assessment}</p>
          </div>
        )}

        <button onClick={onReset} className="reset-btn">
          ↻ Evaluate Another Recording
        </button>
      </div>
    </div>
  );
}

export default ResultsDisplay;
