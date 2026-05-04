import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './AudioUpload.css';

function AudioUpload({ onEvaluate, loading, error }) {
  const [audioFile, setAudioFile] = useState(null);
  const [referenceText, setReferenceText] = useState('');
  const [fileName, setFileName] = useState('');

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setAudioFile(file);
      setFileName(file.name);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
    },
    maxFiles: 1
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (audioFile) {
      onEvaluate(audioFile, referenceText);
    }
  };

  const handleClear = () => {
    setAudioFile(null);
    setFileName('');
    setReferenceText('');
  };

  return (
    <div className="audio-upload">
      <div className="upload-card">
        <h2>Upload Your Voice Recording</h2>
        
        <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <span className="upload-icon">📁</span>
            {isDragActive ? (
              <p>Drop your audio file here...</p>
            ) : (
              <>
                <p>Drag and drop your audio file here</p>
                <p className="or-text">or</p>
                <button type="button" className="browse-btn">
                  Click to browse
                </button>
              </>
            )}
          </div>
        </div>

        {fileName && (
          <div className="file-info">
            <span className="file-icon">🎵</span>
            <span className="file-name">{fileName}</span>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="reference-text">Reference Text (Optional)</label>
          <textarea
            id="reference-text"
            className="textarea"
            placeholder="Enter the text you read or the sentence you want to evaluate..."
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value)}
            rows="4"
          />
        </div>

        <div className="button-group">
          <button
            onClick={handleSubmit}
            disabled={!audioFile || loading}
            className="submit-btn"
          >
            {loading ? '⏳ Evaluating...' : '🚀 Evaluate'}
          </button>
          <button
            onClick={handleClear}
            className="clear-btn"
          >
            Clear
          </button>
        </div>

        <div className="info-box">
          <h4>📋 What we'll evaluate:</h4>
          <ul>
            <li><strong>Pronunciation</strong> - Clarity and correctness of speech</li>
            <li><strong>Fluency</strong> - Smoothness and continuity</li>
            <li><strong>Confidence</strong> - Consistency and stability</li>
            <li><strong>Speaking Pace</strong> - Words per minute (WPM)</li>
            <li><strong>Content Structure</strong> - Completeness and accuracy</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AudioUpload;
