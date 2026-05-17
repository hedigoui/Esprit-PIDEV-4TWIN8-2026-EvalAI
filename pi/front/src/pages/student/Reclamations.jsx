import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentSidebar from '../../components/StudentSidebar';
import TopNavbar from '../../components/TopNavbar';
import styles from '../../styles/shared.module.css';
import { LifeBuoy, Send, RefreshCw, Tag, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { API_BASE_URL } from '../../config/api';

const API_URL = API_BASE_URL;

function formatDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

const Reclamations = () => {
  console.log('👨‍🎓 STUDENT Reclamations component loaded');
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('evaluation');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const { t } = useI18n();

  const statusMeta = {
    open: { label: t('reclamations.statusOpen'), tone: 'warning' },
    in_progress: { label: t('reclamations.statusInProgress'), tone: 'info' },
    resolved: { label: t('reclamations.statusResolved'), tone: 'success' },
    rejected: { label: t('reclamations.statusRejected'), tone: 'red' },
  };

  const token = useMemo(() => localStorage.getItem('token'), []);

  const ensureStudent = () => {
    if (!token) {
      navigate('/', { replace: true });
      return false;
    }
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/', { replace: true });
      return false;
    }
    try {
      const user = JSON.parse(userStr);
      if (user?.role !== 'student') {
        navigate('/', { replace: true });
        return false;
      }
      return true;
    } catch {
      navigate('/', { replace: true });
      return false;
    }
  };

  const fetchMine = async () => {
    if (!ensureStudent()) return;
    try {
      setLoading(true);
      setError('');
      console.log('📡 Fetching student reclamations with token:', token ? 'Token exists' : 'No token');
      const res = await axios.get(`${API_URL}/reclamations/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('❌ Student reclamations fetch error:', e);
      console.error('Response status:', e?.response?.status);
      console.error('Response data:', e?.response?.data);
      setError(
        e?.response?.status === 401
          ? t('reclamations.studentFailedLoad') + ' (session not cleared)'
          : t('reclamations.studentFailedLoad'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureStudent()) return;

    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      setError(t('reclamations.studentFillTitleDesc'));
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      // Get student name from user data
      const userStr = localStorage.getItem('user');
      let studentName = 'Unknown';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          studentName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
        } catch {
          studentName = 'Unknown';
        }
      }
      
      await axios.post(
        `${API_URL}/reclamations`,
        { title: t, description: d, category, studentName },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTitle('');
      setCategory('evaluation');
      setDescription('');
      await fetchMine();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || t('reclamations.studentFailedSubmit'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.mainContent}>
        <TopNavbar />
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LifeBuoy size={18} style={{ color: '#E31837' }} />
                <div className={styles.pageTitle}>{t('reclamations.title')}</div>
              </div>
              <div className={styles.pageSubtitle}>
                {t('reclamations.studentSubtitle')}
              </div>
            </div>
            <button className={styles.secondaryButton} onClick={fetchMine} disabled={loading}>
              <RefreshCw size={16} /> {t('reclamations.refresh')}
            </button>
          </div>

          {error ? (
            <div
              className={styles.card}
              style={{ borderColor: 'rgba(227, 24, 55, 0.25)', background: 'rgba(227,24,55,0.03)' }}
            >
              <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div>
            </div>
          ) : null}

          <div className={styles.grid2} style={{ alignItems: 'start' }}>
            <div className={styles.card}>
              <div className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={16} style={{ color: '#E31837' }} /> {t('reclamations.studentNew')}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                    {t('reclamations.titleLabel')}
                  </div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('reclamations.studentTitlePlaceholder')}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                    {t('reclamations.category')}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Tag
                      size={16}
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 0.85rem 0.75rem 2.35rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        outline: 'none',
                        fontFamily: 'inherit',
                        background: 'white',
                      }}
                      disabled={submitting}
                    >
                      <option value="evaluation">{t('reclamations.categoryEvaluation')}</option>
                      <option value="account">{t('reclamations.categoryAccount')}</option>
                      <option value="bug">{t('reclamations.categoryBug')}</option>
                      <option value="other">{t('reclamations.categoryOther')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                    {t('reclamations.description')}
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('reclamations.descriptionPlaceholder')}
                    rows={6}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                    disabled={submitting}
                  />
                </div>

                <button className={styles.primaryButton} type="submit" disabled={submitting}>
                  <Send size={16} /> {submitting ? t('reclamations.sending') : t('reclamations.submit')}
                </button>
              </form>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>{t('reclamations.myReclamations')}</div>

              {loading ? (
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{t('reclamations.loading')}</div>
              ) : items.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  {t('reclamations.studentEmpty')}
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {items.map((r) => {
                    const meta = statusMeta[r.status] || { label: r.status || '—', tone: 'info' };
                    const isExpanded = expandedId === r._id;
                    return (
                      <div
                        key={r._id}
                        style={{
                          padding: '0.95rem 1rem',
                          borderRadius: '16px',
                          background: isExpanded ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.015)',
                          border: isExpanded ? '1px solid rgba(227,24,55,0.15)' : '1px solid rgba(0,0,0,0.04)',
                          transition: 'border-color 0.2s, background 0.2s',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : r._id)}
                          style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            textAlign: 'left',
                            fontFamily: 'inherit',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem' }}>
                              {r.title}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                              {r.category ? `${t('reclamations.categoryLabel')}: ${r.category}` : `${t('reclamations.categoryLabel')}: —`} • {formatDate(r.createdAt)}
                            </div>
                          </div>
                          <span className={`${styles.badge} ${styles[meta.tone] || ''}`} style={{ flexShrink: 0 }}>{meta.label}</span>
                          <span style={{ flexShrink: 0, color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            {isExpanded ? t('reclamations.close') : t('reclamations.read')}
                          </span>
                        </button>

                        {isExpanded && (
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                            <div style={{ marginBottom: '0.85rem' }}>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <FileText size={14} /> {t('reclamations.yourMessage')}
                              </div>
                              <div
                                style={{
                                  padding: '1rem 1.1rem',
                                  borderRadius: '12px',
                                  background: 'rgba(0,0,0,0.03)',
                                  border: '1px solid rgba(0,0,0,0.06)',
                                  color: '#1a1a2e',
                                  fontSize: '0.9rem',
                                  lineHeight: 1.6,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {r.description || '—'}
                              </div>
                            </div>

                            {r.responseMessage ? (
                              <div
                                style={{
                                  padding: '1rem 1.1rem',
                                  borderRadius: '12px',
                                  background: 'rgba(59,130,246,0.06)',
                                  border: '1px solid rgba(59,130,246,0.15)',
                                  color: '#1a1a2e',
                                  fontSize: '0.9rem',
                                  lineHeight: 1.6,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                }}
                              >
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#3b82f6', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  {t('reclamations.supportResponse')}
                                </div>
                                {r.responseMessage}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                {t('reclamations.noResponse')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reclamations;

