from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from modules.audio_processor import AudioProcessor
from modules.speech_evaluator import SpeechEvaluator

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize processors
audio_processor = AudioProcessor()
speech_evaluator = SpeechEvaluator()

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'm4a'}

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Speech Evaluation API is running'})

@app.route('/api/evaluate', methods=['POST'])
def evaluate_speech():
    """
    Evaluate uploaded audio file for:
    - Pronunciation
    - Fluency
    - Confidence
    - Speaking Pace
    - Content Structure
    """
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    file = request.files['audio']
    text = request.form.get('text', '')
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400
    
    try:
        # Save uploaded file
        filename = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filename)
        
        print(f"Processing file: {filename}")
        
        # Process audio
        audio_data = audio_processor.load_audio(filename)
        print(f"Audio loaded successfully. Shape: {audio_data.shape}")
        
        # Extract features
        features = audio_processor.extract_features(audio_data)
        print(f"Features extracted successfully")
        
        # Get transcription
        transcription = audio_processor.transcribe(filename)
        print(f"Transcription: {transcription}")
        
        # Evaluate speech
        results = speech_evaluator.evaluate(
            audio_data=audio_data,
            features=features,
            transcription=transcription,
            reference_text=text
        )
        print(f"Evaluation complete")
        
        # Clean up
        os.remove(filename)
        
        return jsonify({
            'success': True,
            'results': results,
            'transcription': transcription
        })
    
    except Exception as e:
        print(f"ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
