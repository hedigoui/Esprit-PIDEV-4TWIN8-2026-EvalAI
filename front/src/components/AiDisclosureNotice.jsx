import { Sparkles } from 'lucide-react';
import styles from './AiDisclosureNotice.module.css';
import { useI18n } from '../i18n/I18nProvider';

/**
 * Shown wherever AI-assisted analysis or text is produced so users know AI is in use.
 */
export default function AiDisclosureNotice() {
  const { t } = useI18n();
  return (
    <div className={styles.wrap} role="note" aria-label={t('aiNotice.aria')}>
      <Sparkles size={18} className={styles.icon} aria-hidden />
      <div className={styles.text}>
        <strong>{t('aiNotice.title')}</strong>
        <span>{t('aiNotice.body')}</span>
      </div>
    </div>
  );
}
