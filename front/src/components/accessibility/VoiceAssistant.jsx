import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff } from 'lucide-react';
import { usePageActions } from '../../context/VoiceActionsContext';
import { readSelectionAloud, translateSelectionAloud } from './ReadSelection';

/**
 * Normalize voice input: remove symbols, extra spaces, convert to lowercase
 */
const normalizeVoiceInput = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Replace symbols with spaces
    .replace(/\s+/g, ' ') // Normalize multiple spaces
    .trim();
};

/**
 * Voice Assistant for accessibility: speech-to-text + text-to-speech.
 * Available on all pages. Uses Web Speech API (no API key).
 */
const VoiceAssistant = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageActions = usePageActions();

  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const recognitionRef = useRef(null);
  const currentFieldRef = useRef(null);
  const listeningRef = useRef(false);
  const restartTimeoutRef = useRef(null);

  const speak = useCallback((text, options = {}) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = options.rate ?? 0.95;
    u.lang = options.lang ?? 'en-US';
    window.speechSynthesis.speak(u);
  }, []);

  const getHelpMessage = useCallback(() => {
    const path = location.pathname;
    const base = 'You can say: ';
    const parts = [];

    parts.push('Read selection, Translate, Help. ');
    
    if (path === '/') {
      parts.push('Focus email, Focus password, Student, Teacher, Admin, Login. ');
    } else if (path !== '/') {
      parts.push('Go to dashboard, ');
      if (path.startsWith('/student')) {
        parts.push('Go to practice, Go to reports, Go to settings, ');
      }
      if (path.startsWith('/teacher')) {
        parts.push('Go to students, Go to evaluate, Go to reports, Go to settings, ');
      }
      if (path.startsWith('/admin')) {
        parts.push('Go to users, Go to reports, Go to settings, ');
      }
      parts.push('Logout.');
    }

    return base + parts.join('');
  }, [location.pathname]);

  const parseAndRun = useCallback(
    (transcript) => {
      const t = normalizeVoiceInput(transcript);
      if (!t) return;

      const path = location.pathname;

      // Global: Logout
      if (/logout|log out|sign out/.test(t)) {
        navigate('/');
        speak('Logging out.');
        return;
      }

      // Global: Login page navigation
      if (/go to login|login page|login/.test(t) && path !== '/') {
        navigate('/');
        speak('Going to login page.');
        return;
      }

      // Global: Dashboard navigation
      if (/go to dashboard|dashboard/.test(t)) {
        if (path.startsWith('/student')) navigate('/student/dashboard');
        else if (path.startsWith('/teacher')) navigate('/teacher/dashboard');
        else if (path.startsWith('/admin')) navigate('/admin/dashboard');
        else navigate('/');
        speak('Dashboard.');
        return;
      }

      // Student navigation
      if (path.startsWith('/student')) {
        if (/go to practice|practice session|practice/.test(t)) {
          navigate('/student/practice');
          speak('Going to practice.');
          return;
        }
        if (/go to reports|my reports|reports/.test(t)) {
          navigate('/student/reports');
          speak('Going to reports.');
          return;
        }
        if (/go to settings|settings/.test(t)) {
          navigate('/student/settings');
          speak('Going to settings.');
          return;
        }
      }

      // Teacher navigation
      if (path.startsWith('/teacher')) {
        if (/go to students|students list|students/.test(t)) {
          navigate('/teacher/students');
          speak('Going to students.');
          return;
        }
        if (/go to evaluate|evaluate students|evaluate/.test(t)) {
          navigate('/teacher/evaluate');
          speak('Going to evaluate.');
          return;
        }
        if (/go to reports|reports/.test(t)) {
          navigate('/teacher/reports');
          speak('Going to reports.');
          return;
        }
        if (/go to settings|settings/.test(t)) {
          navigate('/teacher/settings');
          speak('Going to settings.');
          return;
        }
      }

      // Admin navigation
      if (path.startsWith('/admin')) {
        if (/go to users|users list|users/.test(t)) {
          navigate('/admin/users');
          speak('Going to users.');
          return;
        }
        if (/go to reports|reports/.test(t)) {
          navigate('/admin/reports');
          speak('Going to reports.');
          return;
        }
        if (/go to settings|settings/.test(t)) {
          navigate('/admin/settings');
          speak('Going to settings.');
          return;
        }
      }

      // Login page: Set role
      if (path === '/' && pageActions.setRole && /student|teacher|admin/.test(t)) {
        const role = t.includes('student') ? 'student' : t.includes('teacher') ? 'teacher' : 'admin';
        pageActions.setRole(role);
        speak(`Role set to ${role}.`);
        return;
      }

      // Login page: Focus email
      if (path === '/' && pageActions.focusEmail && /focus email|email field|email/.test(t)) {
        currentFieldRef.current = 'email';
        pageActions.focusEmail();
        speak('Email field focused. Say your email or say type and then your email.');
        return;
      }

      // Login page: Focus password
      if (path === '/' && pageActions.focusPassword && /focus password|password field|password/.test(t)) {
        currentFieldRef.current = 'password';
        pageActions.focusPassword();
        speak('Password field focused. Say your password or say type and then your password.');
        return;
      }

      // Login page: Submit form
      if (path === '/' && pageActions.submit && /login|sign in|submit|enter|click login/.test(t)) {
        currentFieldRef.current = null;
        pageActions.submit();
        speak('Submitting login.');
        return;
      }

      // Type text into focused field
      const typeMatch = t.match(/^(?:type|dictate|my email is|my password is)\s*(.+)$/);
      const textToType = typeMatch ? typeMatch[1].trim() : currentFieldRef.current ? t : null;

      if (textToType) {
        const field = currentFieldRef.current || (t.includes('password') ? 'password' : 'email');
        if (field === 'email' && pageActions.setEmail) {
          pageActions.setEmail(textToType);
          speak('Email entered.');
          return;
        } else if (field === 'password' && pageActions.setPassword) {
          pageActions.setPassword(textToType);
          speak('Password entered.');
          return;
        }
      }

      // Read selection
      if (/read selection|read that|read it|read aloud|read/.test(t)) {
        if (readSelectionAloud()) speak('Reading selection.');
        else speak('No text selected. Select some text and say read again.');
        return;
      }

      // Translate selection
      if (/translate selection|translate that|translate/.test(t)) {
        const target = t.includes('french') || t.includes('francais') ? 'fr' 
                      : t.includes('arabic') || t.includes('arab') ? 'ar' 
                      : 'fr';
        translateSelectionAloud(target).then((ok) => {
          if (ok) speak('Translating and reading.');
          else speak('No text selected or translation failed. Select text and say translate again.');
        });
        return;
      }

      // Help
      if (/what can i say|help|commands|options/.test(t)) {
        speak(getHelpMessage());
        return;
      }

      // Unrecognized
      speak('Sorry, I did not understand. Say help to hear available commands.');
    },
    [location.pathname, navigate, pageActions, speak, getHelpMessage]
  );

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setLastTranscript(transcript);
      parseAndRun(transcript);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      listeningRef.current = false;
      setListening(false);
      speak('Sorry, I did not catch that. Try again.');
    };

    recognition.onend = () => {
      if (!listeningRef.current || !recognitionRef.current) return;
      restartTimeoutRef.current = setTimeout(() => {
        try {
          if (listeningRef.current && recognitionRef.current) recognitionRef.current.start();
        } catch (_) {}
      }, 1200);
    };

    recognitionRef.current = recognition;
    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      try {
        recognition.abort();
      } catch (_) {}
    };
  }, [parseAndRun, speak]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    listeningRef.current = true;
    setListening(true);
    setLastTranscript('');
    try {
      recognitionRef.current.start();
      speak('Listening. Say a command or help for options.');
    } catch (_) {}
  }, [speak]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    setListening(false);
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch (_) {}
  }, []);

  const toggleListening = () => {
    if (!supported || !recognitionRef.current) return;
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (!supported || !recognitionRef.current || hasAutoStarted.current) return;
    hasAutoStarted.current = true;
    startListening();
    return () => stopListening();
  }, [supported, startListening, stopListening]);

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
        Voice assistant is not supported in this browser. Try Chrome or Edge.
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
          Heard: &quot;{lastTranscript}&quot;
        </span>
      )}
      <button
        type="button"
        onClick={toggleListening}
        aria-label={listening ? 'Stop listening' : 'Start voice assistant'}
        title={listening ? 'Stop listening' : 'Voice assistant on all pages'}
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

