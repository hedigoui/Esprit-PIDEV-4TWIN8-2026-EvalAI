# Speech Evaluation Web App

A web application for evaluating English pronunciation, fluency, confidence, speaking pace, and content structure.

## Features

- 🎤 Upload audio recordings (MP3, WAV, OGG, M4A)
- 📊 Get detailed evaluation scores
- 🎯 Pronunciation analysis
- 🌊 Fluency assessment  
- 💪 Confidence evaluation
- ⚡ Speaking pace analysis
- 📝 Content structure evaluation
- 💬 Personalized feedback

## Technology Stack

### Frontend
- React 18
- Axios for HTTP requests
- React Dropzone for file uploads
- CSS3 with responsive design

### Backend
- Flask with Flask-CORS
- Librosa for audio processing
- OpenAI Whisper for transcription
- PyAnnote for speech analysis
- PyTorch for ML models

## Getting Started

### Prerequisites
- Node.js 14+
- Python 3.8+
- pip

### Installation

#### Backend Setup

```bash
cd app/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Frontend Setup

```bash
cd app/frontend

# Install Node dependencies
npm install
```

### Running the Application

#### Start Backend Server

```bash
cd app/backend
python app.py
```

The backend API will be available at `http://localhost:5000`

#### Start Frontend Development Server

```bash
cd app/frontend
npm start
```

The frontend will be available at `http://localhost:3000`

### API Endpoints

#### Health Check
- **GET** `/api/health` - Check if API is running

#### Evaluate Speech
- **POST** `/api/evaluate` - Evaluate uploaded audio file
  - Form Data:
    - `audio` (file): Audio file to evaluate
    - `text` (string, optional): Reference text for comparison
  - Response:
    ```json
    {
      "success": true,
      "results": {
        "pronunciation": { "score": 75.5, ... },
        "fluency": { "score": 82.0, ... },
        "confidence": { "score": 78.3, ... },
        "speaking_pace": { "score": 85.0, ... },
        "content_structure": { "score": 80.5, ... },
        "overall_score": 80.26
      },
      "transcription": "Your transcribed text here"
    }
    ```

## Scoring Metrics

### Pronunciation (0-100)
Evaluates clarity, articulation, and energy consistency

### Fluency (0-100)
Assesses speech continuity, rhythm, and pause patterns

### Confidence (0-100)
Measures energy stability and amplitude consistency

### Speaking Pace (0-100)
Analyzes words per minute and speech rate appropriateness

### Content Structure (0-100)
Evaluates transcription accuracy and completeness

## File Structure

```
app/
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioUpload.js
│   │   │   ├── ResultsDisplay.js
│   │   │   ├── ScoreCard.js
│   │   │   └── Header.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── App.css
│   └── package.json
└── backend/
    ├── modules/
    │   ├── audio_processor.py
    │   └── speech_evaluator.py
    ├── app.py
    └── requirements.txt
```

## Development

### Adding New Features

1. Backend features go in `app/backend/modules/`
2. Frontend components go in `app/frontend/src/components/`
3. Update API routes in `app/backend/app.py`

### Testing the API

Use curl or Postman to test endpoints:

```bash
curl -X POST -F "audio=@test.wav" -F "text=Hello world" http://localhost:5000/api/evaluate
```

## Performance Notes

- First evaluation may take longer due to model loading
- Audio file size recommended: < 50MB
- Supported audio formats: WAV, MP3, OGG, M4A
- Sample rate: Audio is automatically resampled to 16kHz

## Future Enhancements

- User accounts and progress tracking
- Comparison with native speaker benchmarks
- Detailed phoneme-level feedback
- Interactive pronunciation coaching
- Mobile application

## License

MIT License

## Support

For issues and questions, please open an issue in the repository.
