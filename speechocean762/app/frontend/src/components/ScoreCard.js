import React from 'react';
import './ScoreCard.css';

function ScoreCard({ title, score, details }) {
  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getProgressWidth = (score) => {
    return Math.min(score, 100);
  };

  return (
    <div className="score-card">
      <div className="card-header">
        <h3>{title}</h3>
        <div className="score-display" style={{ color: getScoreColor(score) }}>
          {score.toFixed(1)}
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${getProgressWidth(score)}%`,
            backgroundColor: getScoreColor(score)
          }}
        />
      </div>

      <div className="details">
        {details.map((detail, index) => (
          <div key={index} className="detail-item">
            <span className="detail-label">{detail.label}</span>
            <span className="detail-value">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScoreCard;
