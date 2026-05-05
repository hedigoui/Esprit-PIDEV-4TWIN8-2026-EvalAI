import { useState, useEffect } from 'react';
import AudioUploadComponent from '../components/speechocean/AudioUpload';
import ResultsDisplayComponent from '../components/speechocean/ResultsDisplay';
import SpeechOceanHeader from '../components/speechocean/Header';
import '../styles/speechocean.css';

function SpeechOceanPage() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Check if backend is available
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
        }
      } catch (err) {
        setBackendStatus('offline');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleEvaluation = async (audioFile, referenceText) => {
    if (backendStatus === 'offline') {
      setError('⚠️ Speech evaluation service is not available. Please ensure the backend server is running on port 5000.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      if (referenceText) {
        formData.append('text', referenceText);
      }

      const response = await fetch('http://localhost:5000/api/evaluate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Evaluation failed. Please try again.');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(`❌ Error: ${err.message}`);
      console.error('Evaluation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="speechocean-page">
      <SpeechOceanHeader />
      {backendStatus === 'offline' && (
        <div className="backend-status-banner">
          <div className="status-content">
            <span className="status-icon">⚠️</span>
            <div className="status-message">
              <p className="status-title">Backend Service Offline</p>
              <p className="status-text">
                To use the speech evaluation feature, please start the backend server. 
                Run: <code>python app.py</code> in the <code>speechocean762/app/backend</code> directory
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="container">
        {!results ? (
          <AudioUploadComponent onEvaluate={handleEvaluation} loading={loading} error={error} />
        ) : (
          <ResultsDisplayComponent results={results} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

export default SpeechOceanPage;
