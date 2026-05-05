import { useState } from 'react';
import { Upload, X } from 'lucide-react';

function AudioUpload({ onEvaluate, loading, error }) {
  const [audioFile, setAudioFile] = useState(null);
  const [referenceText, setReferenceText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        setFileName(file.name);
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setAudioFile(files[0]);
      setFileName(files[0].name);
    }
  };

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
    <div className="speechocean-upload">
      <div className="upload-card">
        <h2>Upload Your Voice Recording</h2>
        
        <div
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="audio-input"
          />
          <label htmlFor="audio-input" className="dropzone-content">
            <span className="upload-icon">
              <Upload size={40} />
            </span>
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
          </label>
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
      </div>
    </div>
  );
}

export default AudioUpload;
