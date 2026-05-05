import React from 'react';
import styles from './SkipToContent.module.css';

/**
 * A hidden link that appears when focused via keyboard.
 * Essential for WCAG 2.4.1 (Bypass Blocks) compliance, allowing
 * keyboard users to skip repetitive navigation headers.
 */
const SkipToContent = () => {
  return (
    <a href="#main-content" className={styles.skipLink}>
      Skip to main content
    </a>
  );
};

export default SkipToContent;
