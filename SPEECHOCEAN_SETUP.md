# SpeechOcean Backend Setup Guide

## Quick Start

### Windows

Double-click the `start-backend.bat` file in the root directory:
```
start-backend.bat
```

The script will:
1. Navigate to the backend directory
2. Create a Python virtual environment (if needed)
3. Install all dependencies
4. Start the Flask server on `http://localhost:5000`

### macOS / Linux

Run the start script:
```bash
chmod +x start-backend.sh
./start-backend.sh
```

---

## Manual Setup (if scripts don't work)

### Step 1: Navigate to Backend Directory
```bash
cd speechocean762/app/backend
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
pip install openai-whisper torch
```

**Note:** Whisper is a large model (~1GB) and PyTorch (~500MB) that enable speech-to-text transcription. Installation may take 2-5 minutes depending on your internet speed.

### Step 4: Start the Server
```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

---

## Verify Backend is Running

Open your browser and navigate to:
```
http://localhost:5000/api/health
```

You should see:
```json
{"status": "ok", "message": "Speech Evaluation API is running"}
```

### Verify Whisper Installation

To confirm speech transcription is available:
```bash
python -c "import whisper; print('✓ Whisper is ready')"
```

If this fails, run:
```bash
pip install openai-whisper torch
```

---

## Using the SpeechOcean Interface

1. Start the PI application frontend
2. Start the SpeechOcean backend using the instructions above
3. Navigate to the **SpeechOcean** section from the sidebar
4. Upload an audio file and click "Evaluate"

The interface will show:
- 🎯 Pronunciation score
- 🌊 Fluency assessment
- 💪 Confidence level
- ⚡ Speaking pace
- 📝 Content structure

---

## Troubleshooting

### Backend won't start
- Ensure Python 3.8+ is installed
- Check that port 5000 is not in use
- Run: `netstat -ano | findstr :5000` (Windows) to check

### "Connection Refused" Error
- Make sure the backend server is running
- Check that you're using the correct port (5000)
- Verify firewall settings allow localhost connections

### Module Import Errors
- Delete the `venv` folder and recreate it
- Run `pip install -r requirements.txt` again
- Check that all system dependencies are installed (ffmpeg, libsndfile)

### Audio Processing Issues
- Ensure the uploaded audio file format is supported: `.wav`, `.mp3`, `.ogg`, `.m4a`
- Check audio file size (keep under 50MB recommended)
- Verify the audio has clear speech content

---

## Environment Variables

The backend uses a `.env` file for configuration. Default settings:
```
FLASK_ENV=development
FLASK_DEBUG=True
```

To disable debug mode in production, change `FLASK_DEBUG=False`.

---

## API Endpoints

### Health Check
```
GET /api/health
```
Returns: `{"status": "ok", "message": "..."}`

### Audio Evaluation
```
POST /api/evaluate
Content-Type: multipart/form-data

Parameters:
- audio: Audio file (required)
- text: Reference text (optional)
```

Returns evaluation results with scores for:
- Pronunciation
- Fluency
- Confidence
- Speaking pace
- Content structure

---

## System Requirements

- Python 3.8 or higher
- 4GB RAM minimum (8GB+ recommended for Whisper)
- 2GB free disk space
- FFmpeg (for audio processing)
- Approximately 1.5GB for Whisper model on first run

### Install FFmpeg

**Windows:**
```
choco install ffmpeg
# or download from https://ffmpeg.org/download.html
```

**macOS:**
```
brew install ffmpeg
```

**Linux:**
```
sudo apt-get install ffmpeg
```

---

For more information, see the main PI project documentation.
