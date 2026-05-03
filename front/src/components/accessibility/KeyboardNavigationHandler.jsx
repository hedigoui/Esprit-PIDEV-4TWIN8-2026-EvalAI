import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccessibilitySettings } from '../../hooks/useAccessibilitySettings';
import { announceMessage } from '../../hooks/useA11yAnnouncer';

/**
 * Global Keyboard Navigation Handler
 * Provides shortcuts and enhanced keyboard accessibility when enabled.
 */
const KeyboardNavigationHandler = () => {
  const { settings, loaded } = useAccessibilitySettings();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loaded || !settings.keyboardNavigationEnabled) return;

    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' || 
                      activeElement?.tagName === 'TEXTAREA' || 
                      activeElement?.isContentEditable;

      // Global Shortcuts (Alt + Key)
      if (e.altKey && !isInput) {
        const key = e.key.toLowerCase();
        
        const isStudent = location.pathname.includes('/student');
        const isTeacher = location.pathname.includes('/teacher');
        const isAdmin = location.pathname.includes('/admin');

        // Navigation Map
        const routes = {
          h: isStudent ? '/student/dashboard' : isTeacher ? '/teacher/dashboard' : isAdmin ? '/admin/dashboard' : '/',
          p: '/student/practice',
          r: isStudent ? '/student/reports' : isTeacher ? '/teacher/reports' : isAdmin ? '/admin/reports' : '/',
          s: isStudent ? '/student/settings' : isTeacher ? '/teacher/settings' : isAdmin ? '/admin/settings' : '/',
          m: '/conversations',
          l: '/', // Logout
        };

        if (routes[key]) {
          e.preventDefault();
          
          if (key === 'l') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            announceMessage('Logging out.');
          } else {
            announceMessage(`Navigating to ${key === 'h' ? 'Home' : key === 's' ? 'Settings' : 'page'}.`);
          }
          
          navigate(routes[key]);
        }
      }

      // Quick help shortcut (Shift + ?)
      if (e.shiftKey && e.key === '?' && !isInput) {
        e.preventDefault();
        announceMessage('Showing keyboard shortcuts help.');
        alert(
          'EvalAI Keyboard Shortcuts:\n' +
          '------------------------\n' +
          'Alt + H: Dashboard / Home\n' +
          'Alt + P: Practice (Student)\n' +
          'Alt + R: Reports\n' +
          'Alt + S: Settings\n' +
          'Alt + M: Messages\n' +
          'Alt + L: Logout\n' +
          'Alt + A: Accessibility Panel\n' +
          'Alt + G: Language Switcher\n' +
          'Shift + ?: Show this help'
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigationEnabled, loaded, navigate, location.pathname]);

  return null;
};

export default KeyboardNavigationHandler;
