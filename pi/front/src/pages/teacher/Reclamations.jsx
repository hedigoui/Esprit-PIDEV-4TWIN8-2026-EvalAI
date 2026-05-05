import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TeacherSidebar from '../../components/TeacherSidebar';
import TopNavbar from '../../components/TopNavbar';
import styles from '../../styles/shared.module.css';
import {
  LifeBuoy,
  Send,
  RefreshCw,
  Tag,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

import { API_BASE_URL } from '../../config/api';

const API_URL = API_BASE_URL;

function formatDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

const Reclamations = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('platform');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const { t } = useI18n();

  const statusMeta = {
    open: { label: t('reclamations.statusOpen'), tone: 'warning' },
    in_progress: { label: t('reclamations.statusInProgress'), tone: 'info' },
    resolved: { label: t('reclamations.statusResolved'), tone: 'success' },
    rejected: { label: t('reclamations.statusRejected'), tone: 'red' },
  };

  const token = useMemo(() => localStorage.getItem('token'), []);

  const ensureTeacher = () => {
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
      if (user?.role !== 'instructor') {
        if (user?.role === 'admin') navigate('/admin/dashboard', { replace: true });
        else if (user?.role === 'student') navigate('/student/dashboard', { replace: true });
        else navigate('/', { replace: true });
        return false;
      }
      return true;
    } catch {
      navigate('/', { replace: true });
      return false;
    }
  };

  const reporterName = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const n = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return n || user.email || '';
    } catch {
      return '';
    }
  }, []);

  const fetchInstructorInbox = async () => {
    if (!ensureTeacher()) return;
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/reclamations/instructor/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setError(t('reclamations.teacherFailedLoad'));
      if (e?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorInbox();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ensureTeacher()) return;

    const t = title.trim();
    const d = description.trim();
    if (!t || !d) {
      setError(t('reclamations.teacherFillTitleDesc'));
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await axios.post(
        `${API_URL}/reclamations/to-admin`,
        {
          title: t,
          description: d,
          category,
          reporterName: reporterName || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTitle('');
      setCategory('platform');
      setDescription('');
      setSuccess(t('reclamations.teacherSent'));
      setTimeout(() => setSuccess(''), 6000);
      await fetchInstructorInbox();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || t('reclamations.teacherFailedSend'));
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/', { replace: true });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFromStudent = (r) => r.createdByRole === 'student';

  return (
    <div className={styles.layout}>
      <TeacherSidebar />
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
                {t('reclamations.teacherSubtitle')}
              </div>
            </div>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={fetchInstructorInbox}
              disabled={loading}
            >
              <RefreshCw size={16} /> {t('reclamations.refresh')}
            </button>
          </div>

          {error ? (
            <div
              className={styles.card}
              style={{
                borderColor: 'rgba(227, 24, 55, 0.25)',
                background: 'rgba(227,24,55,0.03)',
                marginBottom: '1rem',
              }}
            >
              <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div>
            </div>
          ) : null}

          {success ? (
            <div
              className={styles.card}
              style={{
                borderColor: 'rgba(34, 197, 94, 0.25)',
                background: 'rgba(34,197,94,0.06)',
                marginBottom: '1rem',
              }}
            >
              <div style={{ color: '#166534', fontWeight: 600 }}>{success}</div>
            </div>
          ) : null}

          <div className={styles.grid2} style={{ alignItems: 'start' }}>
            <div className={styles.card}>
              <div className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={16} style={{ color: '#E31837' }} /> {t('reclamations.teacherNewRequest')}
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.9rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
                    {t('reclamations.titleLabel')}
                  </div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('reclamations.titlePlaceholder')}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem',
                      borderRadius: '12px',
                      border: '1px solid rgba(0,0,0,0.08)',
                      outline: 'none',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
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
                        fontSize: '0.9rem',
                      }}
                      disabled={submitting}
                    >
                      <option value="platform">Platform / technical</option>
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
                      fontSize: '0.9rem',
                    }}
                    disabled={submitting}
                  />
                </div>

                <button className={styles.primaryButton} type="submit" disabled={submitting}>
                  <Send size={16} /> {submitting ? t('reclamations.sending') : t('reclamations.send')}
                </button>
              </form>
            </div>

            <div className={styles.card}>
              <div className={styles.cardTitle}>{t('reclamations.myReclamations')}</div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.75rem' }}>
                {t('reclamations.teacherListSub')}
              </div>

              {loading ? (
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{t('reclamations.loading')}</div>
              ) : items.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{t('reclamations.adminEmpty')}</div>
              ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {items.map((r) => {
                    const meta = statusMeta[r.status] || { label: r.status || '—', tone: 'info' };
                    const isExpanded = expandedId === r._id;
                    const fromStudent = isFromStudent(r);
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
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                flexWrap: 'wrap',
                                marginBottom: '0.2rem',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  padding: '0.2rem 0.45rem',
                                  borderRadius: '6px',
                                  background: fromStudent ? 'rgba(59,130,246,0.12)' : 'rgba(100,116,139,0.12)',
                                  color: fromStudent ? '#1d4ed8' : '#475569',
                                }}
                              >
                                {fromStudent ? (
                                  <>
                                    <User size={11} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                                    {t('reclamations.studentLabel')}
                                  </>
                                ) : (
                                  t('reclamations.toAdmin')
                                )}
                              </span>
                            </div>
                            <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem' }}>{r.title}</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.15rem' }}>
                              {fromStudent && r.studentName ? `${r.studentName} • ` : ''}
                              {r.category ? `${r.category} • ` : ''}
                              {formatDate(r.createdAt)}
                            </div>
                          </div>
                          <span
                            className={`${styles.badge} ${styles[meta.tone] || ''}`}
                            style={{ flexShrink: 0 }}
                          >
                            {meta.label}
                          </span>
                          <span
                            style={{
                              flexShrink: 0,
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.8rem',
                            }}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </span>
                        </button>

                        {isExpanded && (
                          <div
                            style={{
                              marginTop: '1rem',
                              paddingTop: '1rem',
                              borderTop: '1px solid rgba(0,0,0,0.06)',
                            }}
                          >
                            <div style={{ marginBottom: '0.85rem' }}>
                              <div
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  color: '#64748b',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  marginBottom: '0.4rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <FileText size={14} /> {t('reclamations.message')}
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
                                <div
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    color: '#3b82f6',
                                    marginBottom: '0.4rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                  }}
                                >
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
