import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { setAnnouncerListener } from '../../hooks/useA11yAnnouncer';

/**
 * A visually hidden component that announces route changes 
 * and dynamic messages to screen readers.
 */
const A11yAnnouncer = () => {
  const [message, setMessage] = useState('');
  const location = useLocation();

  // Register the global listener
  useEffect(() => {
    setAnnouncerListener((newMessage) => {
      setMessage('');
      // Slight delay ensures the screen reader registers the change if the same message is sent twice
      setTimeout(() => setMessage(newMessage), 50);
    });
  }, []);

  // Automatically announce route changes
  useEffect(() => {
    // Convert pathname to a readable page name
    let pageName = location.pathname.split('/').pop() || 'Home';
    // Format camelCase or dashes to title case
    pageName = pageName.replace(/-/g, ' ').replace(/([A-Z])/g, ' $1');
    pageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    
    setMessage(`Navigated to ${pageName} page`);
  }, [location.pathname]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0
      }}
    >
      {message}
    </div>
  );
};

export default A11yAnnouncer;
