function ScoreCard({ title, score, details }) {
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
    <div className="score-card">
      <h3>{title}</h3>
      <div className="score-circle" style={{ borderColor: getScoreColor(score) }}>
        <div className="score-value">{score.toFixed(1)}</div>
        <div className="score-grade">{getScoreGrade(score)}</div>
      </div>
      <div className="score-details">
        {details.map((detail, idx) => (
          <div key={idx} className="detail-item">
            <span className="detail-label">{detail.label}</span>
            <span className="detail-value">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScoreCard;
