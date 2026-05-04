import React, { useState } from 'react';
import './App.css';
import AudioUpload from './components/AudioUpload';
import ResultsDisplay from './components/ResultsDisplay';
import Header from './components/Header';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEvaluation = async (audioFile, referenceText) => {
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
        throw new Error('Evaluation failed. Please try again.');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="App">
      <Header />
      <div className="container">
        {!results ? (
          <AudioUpload onEvaluate={handleEvaluation} loading={loading} error={error} />
        ) : (
          <ResultsDisplay results={results} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

export default App;
