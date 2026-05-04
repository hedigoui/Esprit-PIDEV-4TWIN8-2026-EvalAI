import numpy as np
from typing import Dict, Any, Tuple
from difflib import SequenceMatcher

class SpeechEvaluator:
    """Evaluate speech based on multiple metrics"""
    
    def evaluate(self, audio_data: np.ndarray, features: Dict, 
                 transcription: str, reference_text: str = "") -> Dict[str, Any]:
        """
        Evaluate speech on multiple dimensions:
        - Pronunciation clarity
        - Fluency
        - Confidence
        - Speaking pace
        - Content structure
        """
        results = {}
        
        # Calculate individual metrics
        results['pronunciation'] = self._evaluate_pronunciation(features, audio_data)
        results['fluency'] = self._evaluate_fluency(audio_data, features)
        results['confidence'] = self._evaluate_confidence(features, audio_data)
        results['speaking_pace'] = self._evaluate_speaking_pace(audio_data, transcription)
        results['content_structure'] = self._evaluate_content(transcription, reference_text)
        
        # Calculate overall score
        results['overall_score'] = self._calculate_overall_score(results)
        
        # Convert all numpy types to Python native types for JSON serialization
        return self._convert_to_native_types(results)
    
    def _convert_to_native_types(self, obj: Any) -> Any:
        """Recursively convert numpy types to Python native types for JSON serialization"""
        if isinstance(obj, dict):
            return {key: self._convert_to_native_types(value) for key, value in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [self._convert_to_native_types(item) for item in obj]
        elif isinstance(obj, (np.integer, np.floating)):
            return float(obj) if isinstance(obj, np.floating) else int(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return obj
    
    def _evaluate_pronunciation(self, features: Dict, audio_data: np.ndarray) -> Dict[str, float]:
        """
        Evaluate pronunciation based on:
        - Spectral clarity
        - Consonant-vowel distinction (zcr patterns)
        - Energy consistency
        """
        score = 0.0
        
        # Spectral quality: higher centroid clarity = better pronunciation
        centroid = features['spectral_centroid'].mean()
        centroid_score = min(100, (centroid / 5000) * 100)
        
        # ZCR analysis: good speech has distinct voiced/unvoiced patterns
        zcr = features['zcr'].mean()
        zcr_score = min(100, (zcr * 1000) * 10)  # Scale appropriately
        
        # Energy consistency
        rms = features['rms'].flatten()
        energy_consistency = 100 - (np.std(rms) / np.mean(rms) * 50) if np.mean(rms) > 0 else 50
        
        # Weighted combination
        score = (centroid_score * 0.4 + zcr_score * 0.3 + energy_consistency * 0.3)
        score = max(0, min(100, score))  # Clamp between 0-100
        
        return {
            'score': round(score, 2),
            'clarity': round(centroid_score, 2),
            'articulation': round(zcr_score, 2),
            'energy_consistency': round(energy_consistency, 2)
        }
    
    def _evaluate_fluency(self, audio_data: np.ndarray, features: Dict) -> Dict[str, float]:
        """
        Evaluate fluency based on:
        - Speech continuity (energy gaps)
        - Rhythm consistency
        - Pause patterns
        """
        # Detect pauses using energy threshold
        rms = features['rms'].flatten()
        threshold = np.mean(rms) * 0.2
        
        # Find silence periods
        silent_frames = rms < threshold
        silence_ratio = np.sum(silent_frames) / len(silent_frames)
        
        # Ideal silence ratio is around 20-30%
        silence_score = 100 if 0.2 <= silence_ratio <= 0.4 else (100 - abs(silence_ratio - 0.3) * 200)
        
        # Rhythm: measure spectral centroid variability (stable = good)
        centroid = features['spectral_centroid'].flatten()
        rhythm_consistency = 100 - (np.std(centroid) / (np.mean(centroid) + 1) * 50)
        
        # Overall fluency
        fluency_score = (silence_score * 0.5 + max(0, rhythm_consistency) * 0.5)
        fluency_score = max(0, min(100, fluency_score))
        
        return {
            'score': round(fluency_score, 2),
            'continuity': round(100 - (silence_ratio * 100), 2),
            'rhythm': round(max(0, rhythm_consistency), 2),
            'pause_quality': round(silence_score, 2)
        }
    
    def _evaluate_confidence(self, features: Dict, audio_data: np.ndarray) -> Dict[str, float]:
        """
        Evaluate confidence based on:
        - Energy stability
        - Consistent amplitude
        - Reduced hesitation markers
        """
        # Energy level consistency
        rms = features['rms'].flatten()
        mean_energy = np.mean(rms)
        energy_std = np.std(rms)
        
        # Low variability = high confidence
        confidence_score = 100 - (energy_std / (mean_energy + 0.001) * 100)
        confidence_score = max(0, min(100, confidence_score))
        
        # Amplitude stability
        amplitude = np.abs(audio_data)
        amplitude_consistency = 100 - (np.std(amplitude) / np.mean(amplitude) * 50)
        amplitude_consistency = max(0, min(100, amplitude_consistency))
        
        return {
            'score': round((confidence_score + amplitude_consistency) / 2, 2),
            'energy_stability': round(confidence_score, 2),
            'amplitude_consistency': round(amplitude_consistency, 2),
            'hesitation_level': round(100 - confidence_score, 2)
        }
    
    def _evaluate_speaking_pace(self, audio_data: np.ndarray, transcription: str) -> Dict[str, float]:
        """
        Evaluate speaking pace based on:
        - Words per minute
        - Phoneme duration
        - Speech rate
        """
        duration = len(audio_data) / 16000  # Assuming 16kHz
        
        # Estimate words from transcription
        words = len(transcription.split())
        
        # Calculate WPM
        wpm = (words / duration) * 60 if duration > 0 else 0
        
        # Ideal WPM for non-native speakers is 120-150
        # Native speakers: 130-180
        pace_score = 100
        
        if wpm < 80:
            pace_score = (wpm / 80) * 70  # Too slow
        elif wpm > 200:
            pace_score = max(0, 100 - (wpm - 200) / 50)  # Too fast
        else:
            # Optimal range: 120-160 WPM
            if 120 <= wpm <= 160:
                pace_score = 100
            elif wpm < 120:
                pace_score = ((wpm - 80) / 40) * 100
            else:
                pace_score = 100 - ((wpm - 160) / 40) * 30
        
        pace_score = max(0, min(100, pace_score))
        
        return {
            'score': round(pace_score, 2),
            'words_per_minute': round(wpm, 2),
            'total_words': words,
            'duration_seconds': round(duration, 2),
            'assessment': self._pace_assessment(wpm)
        }
    
    def _evaluate_content(self, transcription: str, reference_text: str) -> Dict[str, Any]:
        """
        Evaluate content structure:
        - Completeness (words spoken vs expected)
        - Accuracy (if reference text provided)
        - Coherence
        """
        trans_words = transcription.lower().split()
        ref_words = reference_text.lower().split() if reference_text else []
        
        # Calculate similarity if reference provided
        if ref_words:
            matcher = SequenceMatcher(None, ref_words, trans_words)
            similarity = matcher.ratio() * 100
        else:
            similarity = 50.0  # Default if no reference
        
        # Word count reasonableness
        word_count = len(trans_words)
        completeness_score = min(100, (word_count / 20) * 100)  # Assume at least 20 words
        
        return {
            'score': round(similarity, 2),
            'word_count': word_count,
            'completeness': round(completeness_score, 2),
            'transcription': transcription,
            'reference_match': round(similarity, 2) if reference_text else None
        }
    
    def _calculate_overall_score(self, results: Dict[str, Any]) -> float:
        """Calculate overall score from all metrics"""
        scores = [
            results['pronunciation']['score'] * 0.25,
            results['fluency']['score'] * 0.25,
            results['confidence']['score'] * 0.20,
            results['speaking_pace']['score'] * 0.20,
            results['content_structure']['score'] * 0.10
        ]
        return round(sum(scores), 2)
    
    def _pace_assessment(self, wpm: float) -> str:
        """Provide verbal assessment of speaking pace"""
        if wpm < 80:
            return "Too slow - try to speak more naturally"
        elif wpm < 120:
            return "Somewhat slow - good for clarity, could be faster"
        elif wpm <= 160:
            return "Natural pace - excellent"
        elif wpm <= 200:
            return "Somewhat fast - clear but could slow down slightly"
        else:
            return "Too fast - slow down for better clarity"
