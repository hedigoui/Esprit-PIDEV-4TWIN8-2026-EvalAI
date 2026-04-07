import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';

// Normalize voice input - improved with better whitespace and number handling
const normalizeVoiceInput = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+at\s+/gi, ' at ')
    .replace(/\s+dot\s+/gi, ' dot ')
    .replace(/[^\w\s@.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

// Enhanced command matcher with confidence levels
const matchCommand = (transcript, patterns) => {
  const t = normalizeVoiceInput(transcript);
  
  // High confidence: exact match
  for (const pattern of patterns) {
    if (typeof pattern === 'string' && (t === pattern || t.endsWith(' ' + pattern) || t.startsWith(pattern + ' '))) {
      return { match: true, confidence: 1.0, normalized: t };
    }
    if (pattern instanceof RegExp && pattern.test(t)) {
      return { match: true, confidence: 0.95, normalized: t };
    }
  }
  
  return { match: false, confidence: 0, normalized: t };
};

// Check if user is logged in
const isUserLoggedIn = () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return token && user;
  } catch {
    return false;
  }
};

const VoiceAssistant = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const recognitionRef = useRef(null);
  const currentFieldRef = useRef(null);

  // Helper to set input value and trigger React's onChange properly
  const setInputValue = (inputElement, newValue) => {
    if (!inputElement) return;
    
    // Step 1: Get the existing value to create proper event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;
    
    // Step 2: Use the native setter to properly set the value
    nativeInputValueSetter.call(inputElement, newValue);
    
    // Step 3: Dispatch input event (React listens to this)
    const inputEvent = new Event('input', { bubbles: true });
    inputElement.dispatchEvent(inputEvent);
    
    // Step 4: Dispatch change event
    const changeEvent = new Event('change', { bubbles: true });
    inputElement.dispatchEvent(changeEvent);
    
    // Step 5: Trigger blur to ensure React state settles
    setTimeout(() => {
      inputElement.blur();
      inputElement.focus();
    }, 50);
  };

  // Text-to-speech function
  const speak = useCallback((text) => {
    console.log('[Voice] Speaking:', text);
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('[Voice] Error:', error);
    }
  }, []);

  // Parse and execute voice commands - improved with better matching
  const parseAndRun = useCallback(
    (transcript) => {
      const t = normalizeVoiceInput(transcript);
      console.log('[Voice] RAW:', transcript, '| NORMALIZED:', t);

      if (!t) return;

      const isLoginPage = location.pathname === '/';
      const isLoggedIn = !isLoginPage && isUserLoggedIn();

      console.log('[Voice] isLoginPage:', isLoginPage, 'isLoggedIn:', isLoggedIn);

      // ===== LOGIN PAGE - ENHANCED FLOW =====
      if (isLoginPage) {
        // Help
        if (matchCommand(t, [/help|what can i say|commands|options/]).match) {
          speak('Say: set email, set password, or login');
          return;
        }

        // SET EMAIL MODE - More flexible matching
        if (
          t === 'set email' || 
          t.startsWith('set email ') ||
          t.endsWith(' set email') ||
          (t.includes('set') && t.includes('email'))
        ) {
          console.log('[Voice] → EMAIL MODE');
          currentFieldRef.current = 'email';
          speak('Email mode activated. Please say your email address. For example: john at example dot com');
          return;
        }

        // SET PASSWORD MODE - More flexible matching
        if (
          t === 'set password' || 
          t.startsWith('set password ') ||
          t.endsWith(' set password') ||
          (t.includes('set') && t.includes('password'))
        ) {
          console.log('[Voice] → PASSWORD MODE');
          currentFieldRef.current = 'password';
          speak('Password mode activated. Please say your password');
          return;
        }

        // EMAIL INPUT - Super lenient parsing
        if (currentFieldRef.current === 'email') {
          console.log('[Voice] EMAIL INPUT:', t);
          const emailInput = document.getElementById('email');
          if (emailInput) {
            // Super lenient email parsing
            let email = t
              .toLowerCase()
              .trim()
              .replace(/\s+at\s+/gi, '@')           // "at" → @
              .replace(/\s+dot\s+/gi, '.')           // "dot" → .
              .replace(/\sadd\s/gi, '@')             // "add" → @ (common mispronunciation)
              .replace(/\sat\s/gi, '@')              // backup for "at"
              .replace(/point/gi, '.')               // "point" → .
              .replace(/\s/g, '');                   // remove all spaces
            
            // If no @ found, try to fix it
            if (!email.includes('@')) {
              // Try common patterns: assume first part is username, rest is domain
              const parts = email.split('.');
              if (parts.length >= 2) {
                // Assume single dot means: username.domain
                email = parts[0] + '@' + parts.slice(1).join('.');
              } else {
                // No dot either, just accept it and append domain
                email = email + '@example.com';
              }
            }
            
            // Clean up: only keep alphanumeric, @, .
            email = email.replace(/[^a-z0-9@.]/g, '');
            
            // Basic cleanup: remove double @ or dots
            email = email.replace(/@+/g, '@').replace(/\.+/g, '.');
            
            if (email && email.length > 3) {
              setInputValue(emailInput, email);
              currentFieldRef.current = null;
              speak(`Email set to ${email}. Now say set password`);
            } else {
              speak('Please try again. Say your email');
            }
            return;
          }
        }

        // PASSWORD INPUT
        if (currentFieldRef.current === 'password') {
          console.log('[Voice] PASSWORD INPUT:', t);
          const passwordInput = document.getElementById('password');
          if (passwordInput) {
            // For password, keep numbers and letters but remove most special chars
            const password = t.replace(/[^\w]/g, '').substring(0, 50);
            if (password) {
              setInputValue(passwordInput, password);
              currentFieldRef.current = null;
              speak('Password entered. Say login to submit');
            } else {
              speak('Password not recognized. Please try again');
            }
            return;
          }
        }

        // LOGIN - More flexible matching
        if (
          t === 'login' ||
          t === 'sign in' ||
          t === 'submit' ||
          /^(login|sign in|submit)\s*$/.test(t) ||
          t.endsWith(' login')
        ) {
          console.log('[Voice] LOGIN');
          const button = document.querySelector('button[type="submit"]');
          if (button) {
            speak('Logging in. Please wait.');
            button.click();
          }
          return;
        }

        // Default feedback
        speak('I did not understand. Say: set email, set password, or login. Or say help for options.');
        return;
      }

      // ===== LOGGED IN COMMANDS - ENHANCED =====

      // Help
      if (matchCommand(t, [/help|what can i say|commands|options/]).match) {
        speak('Say: dashboard, practice, reports, profile, messages, reclamations, settings, students, evaluate, users, or logout');
        return;
      }

      // Logout
      if (matchCommand(t, [/logout|log out|sign out/]).match) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
        speak('Logged out. Taking you to login.');
        return;
      }

      if (!isLoggedIn) {
        speak('Please log in first');
        return;
      }

      // Navigation
      if (matchCommand(t, [/dashboard|home|go home/]).match) {
        navigate('/student/dashboard');
        speak('Going to dashboard');
        return;
      }

      if (matchCommand(t, [/practice|training|exercise/]).match) {
        navigate('/student/practice');
        speak('Opening practice');
        return;
      }

      if (matchCommand(t, [/report|reports|my reports/]).match) {
        navigate('/student/reports');
        speak('Opening reports');
        return;
      }

      if (matchCommand(t, [/profile|my profile|account/]).match) {
        navigate('/profile');
        speak('Opening profile');
        return;
      }

      if (matchCommand(t, [/message|messages|chat|inbox/]).match) {
        navigate('/conversations');
        speak('Opening messages');
        return;
      }

      if (matchCommand(t, [/reclamation|reclamations|complaint|complaints/]).match) {
        navigate('/student/reclamations');
        speak('Opening reclamations');
        return;
      }

      if (matchCommand(t, [/settings|preference|preferences|config/]).match) {
        navigate('/student/settings');
        speak('Opening settings');
        return;
      }

      if (matchCommand(t, [/students|student list/]).match) {
        navigate('/teacher/students');
        speak('Opening students');
        return;
      }

      if (matchCommand(t, [/evaluate|evaluation/]).match) {
        navigate('/teacher/evaluate');
        speak('Opening evaluation');
        return;
      }

      if (matchCommand(t, [/users|admin users|manage users/]).match) {
        navigate('/admin/users');
        speak('Opening users');
        return;
      }

      speak('Command not recognized. Say help for available commands.');
    },
    [navigate, speak, location.pathname]
  );

  // Initialize speech recognition with audio constraints (improved from useAudioRecorder pattern)
  useEffect(() => {
    console.log('[Voice] Initializing with audio constraints...');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    setSupported(true);

    try {
      // Request microphone access with quality constraints (same as useAudioRecorder)
      navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      }).then((stream) => {
        // Stop the stream immediately - we only use it to enable constraints for Speech Recognition
        stream.getTracks().forEach(track => track.stop());
        console.log('[Voice] Audio constraints enabled');
      }).catch((error) => {
        console.warn('[Voice] Audio constraints support:', error.message);
        // Continue anyway - Speech Recognition will work without explicit constraints
      });

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
        console.log('[Voice] Listening started');
      };

      recognition.onresult = (event) => {
        if (event.results.length > 0) {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          
          console.log('[Voice] Result:', transcript, 'Confidence:', confidence.toFixed(2));
          
          // Lower threshold for email/password (longer utterances have lower confidence naturally)
          // Commands: require 0.5, but email/password: accept anything > 0.1
          const isInInputMode = currentFieldRef.current === 'email' || currentFieldRef.current === 'password';
          const minConfidence = isInInputMode ? 0.1 : 0.5;
          
          if (confidence >= minConfidence || transcript.trim().length > 0) {
            setLastTranscript(transcript);
            parseAndRun(transcript);
          } else {
            console.log('[Voice] Low confidence result, ignoring');
            speak('Sorry, I did not hear that clearly. Please try again.');
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('[Voice] Error:', event.error);
        setListening(false);
        
        // Provide user feedback for different errors
        const errorMessages = {
          'no-speech': 'No speech detected. Please try again.',
          'network': 'Network error. Please check your connection.',
          'audio-capture': 'No microphone found. Please check permissions.',
          'permission-denied': 'Microphone permission denied.',
        };
        
        if (errorMessages[event.error]) {
          speak(errorMessages[event.error]);
        }
      };

      recognition.onend = () => {
        // Clear any pending auto-stop timeout
        if (recognition._autoStopTimeout) {
          clearTimeout(recognition._autoStopTimeout);
          recognition._autoStopTimeout = null;
        }
        setListening(false);
        console.log('[Voice] Listening ended');
      };

      recognitionRef.current = recognition;
    } catch (error) {
      console.error('[Voice] Init error:', error);
      setSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn('[Voice] Cleanup:', e);
        }
      }
    };
  }, [parseAndRun, speak]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !supported) return;
    setLastTranscript('');
    try {
      recognitionRef.current.start();
      // Auto-stop after 15 seconds (safety timeout)
      const timeout = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, 15000);
      
      // Store timeout so we can clear it when done
      recognitionRef.current._autoStopTimeout = timeout;
    } catch (error) {
      console.error('[Voice] Start error:', error.message);
    }
  }, [supported]);

  const toggleListening = () => {
    if (!supported || !recognitionRef.current) return;
    // Just start - it will auto-stop after speech is recognized
    startListening();
  };

  if (!supported) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          padding: '0.5rem 0.75rem',
          background: '#333',
          color: '#fff',
          borderRadius: 8,
          fontSize: 12,
          zIndex: 9999,
        }}
      >
        Voice not supported. Try Chrome or Edge.
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 6,
      }}
    >
      {listening && (
        <div
          style={{
            background: 'rgba(196, 18, 48, 0.9)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 6,
            fontSize: 11,
            border: '1px solid #e31837',
          }}
        >
          🎤 Listening...
        </div>
      )}
      {lastTranscript && (
        <span
          style={{
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: 12,
            maxWidth: 300,
            wordWrap: 'break-word',
          }}
        >
          "{lastTranscript}"
        </span>
      )}
      <button
        type="button"
        onClick={toggleListening}
        aria-label={listening ? 'Stop listening' : 'Start voice assistant'}
        title={listening ? 'Stop' : 'Voice assistant'}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: listening ? '#c41230' : '#E31837',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          transition: 'background-color 0.2s',
        }}
      >
        {listening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
    </div>
  );
};

export default VoiceAssistant;

