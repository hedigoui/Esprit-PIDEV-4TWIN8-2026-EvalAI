import { Sparkles } from 'lucide-react';
import styles from './AiDisclosureNotice.module.css';

/**
 * Shown wherever AI-assisted analysis or text is produced so users know AI is in use.
 */
export default function AiDisclosureNotice() {
  return (
    <div className={styles.wrap} role="note" aria-label="Artificial intelligence disclosure">
      <Sparkles size={18} className={styles.icon} aria-hidden />
      <div className={styles.text}>
        <strong>AI-assisted features</strong>
        <span>
          Transcription, scores, and written feedback on this page are generated or supported by
          artificial intelligence. Use them as guidance alongside your own judgment—not as a sole
          authority.
        </span>
      </div>
    </div>
  );
}
