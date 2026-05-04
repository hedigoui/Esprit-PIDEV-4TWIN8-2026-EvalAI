import librosa
import soundfile as sf
import numpy as np
import os
from scipy.io import wavfile
from typing import Tuple, Dict, Any

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False

try:
    from moviepy.editor import AudioFileClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False

class AudioProcessor:
    """Process and analyze audio files for speech evaluation"""
    
    def __init__(self, sr=16000):
        self.sr = sr  # Sample rate
        self.whisper_model = None  # Lazy load model
    
    def _convert_to_wav(self, filepath: str) -> str:
        """Convert M4A, MP3, OGG to WAV using MoviePy"""
        file_ext = os.path.splitext(filepath)[1].lower()
        
        if file_ext == '.wav':
            return filepath  # Already WAV
        
        if not MOVIEPY_AVAILABLE:
            raise Exception(f"MoviePy not available for converting {file_ext} files")
        
        try:
            print(f"Converting {file_ext} to WAV using MoviePy...")
            
            # Load audio clip
            audio_clip = AudioFileClip(filepath)
            
            # Create WAV path
            wav_path = filepath.replace(file_ext, '.wav')
            
            # Export as WAV
            audio_clip.write_audiofile(wav_path, verbose=False, logger=None)
            audio_clip.close()
            
            # Delete original file
            try:
                os.remove(filepath)
            except:
                pass
            
            print(f"Conversion successful: {wav_path}")
            return wav_path
            
        except Exception as e:
            print(f"Conversion error: {str(e)}")
            raise Exception(f"Failed to convert {file_ext} file: {str(e)}")
    
    def load_audio(self, filepath: str) -> np.ndarray:
        """Load audio file and resample to 16kHz"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Audio file not found: {filepath}")
        
        file_ext = os.path.splitext(filepath)[1].lower()
        
        try:
            # Convert to WAV if needed
            if file_ext != '.wav':
                filepath = self._convert_to_wav(filepath)
            
            print(f"Loading audio from: {filepath}")
            
            # Try scipy first (faster for WAV)
            try:
                sr, y = wavfile.read(filepath)
                print(f"Loaded with scipy: shape={y.shape}, dtype={y.dtype}")
                
                # Convert to mono if stereo
                if len(y.shape) > 1 and y.shape[1] > 1:
                    print(f"Converting stereo to mono")
                    y = np.mean(y, axis=1)
                elif len(y.shape) > 1:
                    y = y.squeeze()
                
                # Convert to float32 and normalize
                if y.dtype != np.float32:
                    if y.dtype == np.int16:
                        y = y.astype(np.float32) / 32768.0
                    elif y.dtype == np.int32:
                        y = y.astype(np.float32) / 2147483648.0
                    else:
                        y = y.astype(np.float32)
                
                # Ensure within [-1, 1]
                max_val = np.abs(y).max()
                if max_val > 1.0:
                    y = y / max_val
                
                # Resample if needed
                if sr != self.sr:
                    print(f"Resampling from {sr}Hz to {self.sr}Hz")
                    y = librosa.resample(y, orig_sr=sr, target_sr=self.sr)
                
                print(f"Audio loaded successfully. Shape: {y.shape}, Sample rate: {self.sr}, Duration: {len(y)/self.sr:.2f}s")
                return y
            except Exception as e:
                print(f"Scipy reading failed, trying librosa: {e}")
                pass
            
            # Fall back to librosa
            y, sr = librosa.load(filepath, sr=self.sr, mono=True)
            print(f"Audio loaded successfully (via librosa). Sample rate: {sr}, Duration: {len(y)/sr:.2f}s")
            return y
            
        except Exception as e:
            print(f"Error loading audio: {str(e)}")
            raise Exception(f"Failed to load audio file: {str(e)}")
    
    def extract_features(self, audio_data: np.ndarray) -> Dict[str, Any]:
        """Extract acoustic features from audio"""
        try:
            features = {}
            
            # Validate audio data
            if audio_data is None or len(audio_data) == 0:
                raise ValueError("Audio data is empty")
            
            # Ensure mono
            if len(audio_data.shape) > 1:
                audio_data = np.mean(audio_data, axis=1)
            
            print(f"Extracting features from audio with {len(audio_data)} samples...")
            
            # Use hop_length > 512 for long audio to reduce memory
            hop_length = 512
            n_fft = 2048
            
            # For very long audio, use smaller n_fft
            if len(audio_data) > 500000:
                hop_length = 1024
                n_fft = 1024
                print(f"Using optimized parameters for long audio: n_fft={n_fft}, hop_length={hop_length}")
            
            # Mel-frequency cepstral coefficients
            mfcc = librosa.feature.mfcc(y=audio_data, sr=self.sr, n_mfcc=13, n_fft=n_fft, hop_length=hop_length)
            features['mfcc'] = mfcc
            
            # Zero crossing rate
            zcr = librosa.feature.zero_crossing_rate(audio_data, hop_length=hop_length)
            features['zcr'] = zcr
            
            # Root mean square energy
            rms = librosa.feature.rms(y=audio_data, hop_length=hop_length)
            features['rms'] = rms
            
            # Spectral centroid
            centroid = librosa.feature.spectral_centroid(y=audio_data, sr=self.sr, hop_length=hop_length)
            features['spectral_centroid'] = centroid
            
            # Chroma features (optional, can skip for very long audio)
            try:
                chroma = librosa.feature.chroma_stft(y=audio_data, sr=self.sr, hop_length=hop_length)
                features['chroma'] = chroma
            except:
                print("Skipping chroma features due to memory constraints")
                features['chroma'] = np.array([])
            
            # Tempogram for rhythm
            try:
                onset_env = librosa.onset.onset_strength(y=audio_data, sr=self.sr, hop_length=hop_length)
                features['onset_strength'] = onset_env
            except:
                print("Skipping onset strength due to memory constraints")
                features['onset_strength'] = np.array([])
            
            print("Features extracted successfully")
            return features
        except Exception as e:
            print(f"Error extracting features: {str(e)}")
            raise Exception(f"Failed to extract features: {str(e)}")
    
    def transcribe(self, filepath: str) -> str:
        """Transcribe audio using Whisper - optional feature"""
        if not WHISPER_AVAILABLE:
            print("Whisper not available - skipping transcription")
            return "[Transcription unavailable - Whisper not installed. Evaluation based on acoustic features only.]"
        
        try:
            # Lazy load model on first use
            if self.whisper_model is None:
                print("Loading Whisper model (this may take a moment)...")
                try:
                    # Try to load the model
                    self.whisper_model = whisper.load_model("tiny", device="cpu")
                    print("Whisper model loaded successfully")
                except Exception as e:
                    print(f"Error loading model, clearing cache and retrying: {e}")
                    # Clear corrupted cache
                    import shutil
                    cache_dir = os.path.expanduser("~/.cache/whisper")
                    if os.path.exists(cache_dir):
                        shutil.rmtree(cache_dir)
                        print(f"Cleared cache: {cache_dir}")
                    # Retry loading
                    self.whisper_model = whisper.load_model("tiny", device="cpu")
            
            print("Starting transcription...")
            result = self.whisper_model.transcribe(filepath, language="en", verbose=False)
            transcription = result.get('text', '').strip()
            print(f"Transcription complete: {transcription}")
            
            if not transcription:
                return "[Unable to transcribe - no speech detected]"
            
            return transcription
        except Exception as e:
            print(f"Transcription skipped: {str(e)}")
            # Return placeholder instead of failing
            return "[Transcription unavailable - network error. Evaluation based on acoustic features only]"
    
    def get_duration(self, audio_data: np.ndarray) -> float:
        """Get audio duration in seconds"""
        return len(audio_data) / self.sr
    
    def get_energy_levels(self, audio_data: np.ndarray) -> Dict[str, float]:
        """Calculate energy statistics"""
        rms = np.sqrt(np.mean(audio_data**2))
        return {
            'rms_energy': float(rms),
            'peak_amplitude': float(np.max(np.abs(audio_data))),
            'mean_amplitude': float(np.mean(np.abs(audio_data)))
        }
