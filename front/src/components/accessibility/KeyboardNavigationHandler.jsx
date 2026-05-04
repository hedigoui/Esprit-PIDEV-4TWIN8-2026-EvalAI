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

      // Global Shortcuts (Alt + Key OR Ctrl + Alt + Key)
      if ((e.altKey || (e.ctrlKey && e.altKey)) && !isInput) {
        const key = e.key.toLowerCase();
        
        const isStudent = location.pathname.includes('/student');
        const isTeacher = location.pathname.includes('/teacher');
        const isAdmin = location.pathname.includes('/admin');

        const routes = {
          h: isStudent ? '/student/dashboard' : isTeacher ? '/teacher/dashboard' : isAdmin ? '/admin/dashboard' : '/',
          p: '/student/practice',
          r: isStudent ? '/student/reports' : isTeacher ? '/teacher/reports' : isAdmin ? '/admin/reports' : '/',
          s: isStudent ? '/student/settings' : isTeacher ? '/teacher/settings' : isAdmin ? '/admin/settings' : '/',
          m: '/conversations',
          l: '/',
          a: 'togglePanel',
          g: 'toggleLang',
        };

        if (routes[key]) {
          if (key === 'a' || key === 'g') return;

          e.preventDefault();
          
          if (key === 'l') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            announceMessage('Logging out.');
          } else {
            const pageName = key === 'h' ? 'Dashboard' : key === 'p' ? 'Practice' : key === 'r' ? 'Reports' : key === 's' ? 'Settings' : key === 'm' ? 'Messages' : 'page';
            announceMessage(`Navigating to ${pageName}.`);
          }
          
          navigate(routes[key]);
        }
      }

      // Quick help shortcut (Shift + ?)
      if (e.shiftKey && (e.key === '?' || e.key === '/') && !isInput) {
        e.preventDefault();
        announceMessage('Showing keyboard shortcuts help.');
        const helpDiv = document.createElement('div');
        helpDiv.id = 'a11y-keyboard-help';
        helpDiv.style.cssText = `
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: rgba(15,15,26,0.98); color: white; padding: 2rem;
          border-radius: 20px; border: 2px solid #E31837; z-index: 100000;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5); font-family: sans-serif;
          min-width: 320px;
        `;
        helpDiv.innerHTML = `
          <h2 style="margin-top:0; color:#E31837; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px">Keyboard Shortcuts</h2>
          <ul style="list-style:none; padding:0; line-height:2">
            <li><kbd style="background:#333; padding:2px 6px; border-radius:4px">Alt + H</kbd> : Dashboard</li>
            <li><kbd style="background:#333; padding:2px 6px; border-radius:4px">Alt + P</kbd> : Practice</li>
            <li><kbd style="background:#333; padding:2px 6px; border-radius:4px">Alt + R</kbd> : Reports</li>
            <li><kbd style="background:#333; padding:2px 6px; border-radius:4px">Alt + S</kbd> : Settings</li>
            <li><kbd style="background:#333; padding:2px 6px; border-radius:4px">Alt + M</kbd> : Messages</li>
            <li><kbd style="background:#333; padding:2px 6px; border-radius:4px">Alt + L</kbd> : Logout</li>
            <li><kbd style="background:#333; padding:2px 6px; border-radius:4px">Alt + A</kbd> : Accessibility</li>
            <li><kbd style="background:#333; padding:2px 6px; border-radius:4px">Alt + G</kbd> : Language</li>
          </ul>
          <p style="font-size:12px; color:#94a3b8; margin-bottom:0">Press any key to close</p>
        `;
        document.body.appendChild(helpDiv);
        const closeHelp = () => {
          document.removeEventListener('keydown', closeHelp);
          document.removeEventListener('mousedown', closeHelp);
          helpDiv.remove();
        };
        setTimeout(() => {
          document.addEventListener('keydown', closeHelp);
          document.addEventListener('mousedown', closeHelp);
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.keyboardNavigationEnabled, loaded, navigate, location.pathname]);

  return null;
};

export default KeyboardNavigationHandler;
