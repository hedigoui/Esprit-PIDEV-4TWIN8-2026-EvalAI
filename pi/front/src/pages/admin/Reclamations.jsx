import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar';
import TopNavbar from '../../components/TopNavbar';
import styles from '../../styles/shared.module.css';
import { LifeBuoy, RefreshCw, Save, CheckCircle, Clock, AlertCircle, XCircle, MessageSquare } from 'lucide-react';
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const { t } = useI18n();

  const statusOptions = [
    { value: 'open', label: t('reclamations.statusOpen'), tone: 'warning', icon: Clock },
    { value: 'in_progress', label: t('reclamations.statusInProgress'), tone: 'info', icon: AlertCircle },
    { value: 'resolved', label: t('reclamations.statusResolved'), tone: 'success', icon: CheckCircle },
    { value: 'rejected', label: t('reclamations.statusRejected'), tone: 'red', icon: XCircle },
  ];

  const [drafts, setDrafts] = useState({});
  const token = useMemo(() => localStorage.getItem('token'), []);

  const ensureAdmin = () => {
    if (!token) { navigate('/', { replace: true }); return false; }
    const userStr = localStorage.getItem('user');
    if (!userStr) { navigate('/', { replace: true }); return false; }
    try {
      const user = JSON.parse(userStr);
      if (user?.role !== 'admin') {
        if (user?.role === 'instructor') navigate('/teacher/dashboard', { replace: true });
        else if (user?.role === 'student') navigate('/student/dashboard', { replace: true });
        else navigate('/', { replace: true });
        return false;
      }
      return true;
    } catch { navigate('/', { replace: true }); return false; }
  };

  const fetchAll = async () => {
    if (!ensureAdmin()) return;
    try {
      setLoading(true); setError('');
      const res = await axios.get(`${API_URL}/reclamations`, { headers: { Authorization: `Bearer ${token}` } });
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
      setDrafts(prev => {
        const next = { ...prev };
        for (const r of list) {
          if (!next[r._id]) next[r._id] = { status: r.status || 'open', responseMessage: r.responseMessage || '' };
        }
        return next;
      });
    } catch (e) {
      console.error(e); setError(t('reclamations.adminFailedLoad'));
      if (e?.response?.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/', { replace: true }); }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const save = async (id) => {
    if (!ensureAdmin()) return;
    const draft = drafts[id];
    if (!draft?.status) return;
    try {
      setSavingId(id); setError('');
      await axios.patch(`${API_URL}/reclamations/${id}/status`, { status: draft.status, responseMessage: draft.responseMessage }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchAll();
    } catch (e) { console.error(e); setError(e?.response?.data?.message || t('reclamations.adminFailedUpdate')); }
    finally { setSavingId(null); }
  };

  const getStatusMeta = (status) => statusOptions.find(s => s.value === status) || statusOptions[0];

  const statusBadgeStyle = (tone) => {
    const map = {
      warning: { bg: 'rgba(245,158,11,0.1)', color: '#92400e', border: 'rgba(245,158,11,0.2)' },
      info: { bg: 'rgba(59,130,246,0.08)', color: '#1d4ed8', border: 'rgba(59,130,246,0.15)' },
      success: { bg: 'rgba(34,197,94,0.08)', color: '#15803d', border: 'rgba(34,197,94,0.15)' },
      red: { bg: 'rgba(239,68,68,0.08)', color: '#b91c1c', border: 'rgba(239,68,68,0.15)' },
    };
    const s = map[tone] || map.info;
    return { background: s.bg, color: s.color, border: `1px solid ${s.border}`, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.3rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' };
  };

  const stats = useMemo(() => ({
    open: items.filter(i => i.status === 'open').length,
    in_progress: items.filter(i => i.status === 'in_progress').length,
    resolved: items.filter(i => i.status === 'resolved').length,
    total: items.length,
  }), [items]);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .recl-root { animation: fadeUp 0.3s ease; }
        .recl-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.75rem; margin-bottom: 1.5rem; }
        @media (max-width: 768px) { .recl-stats { grid-template-columns: repeat(2,1fr); } }
        .recl-stat {
          background: #fff; border: 1px solid #f1f5f9; border-radius: 16px;
          padding: 1.1rem 1.25rem; box-shadow: 0 2px 10px rgba(0,0,0,0.04);
          transition: transform 0.2s;
        }
        .recl-stat:hover { transform: translateY(-1px); }
        .recl-stat-val { font-size: 1.75rem; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
        .recl-stat-lbl { font-size: 0.75rem; color: #64748b; font-weight: 600; margin-top: 0.15rem; text-transform: uppercase; letter-spacing: 0.06em; }
        .recl-card {
          background: #fff; border: 1px solid #f1f5f9; border-radius: 18px;
          overflow: hidden; box-shadow: 0 2px 14px rgba(0,0,0,0.04);
          margin-bottom: 1rem; transition: box-shadow 0.2s;
        }
        .recl-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .recl-card-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid #f8fafc; gap: 1rem;
        }
        .recl-card-body { padding: 1.25rem 1.5rem; }
        .recl-title { font-size: 1rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; }
        .recl-meta { font-size: 0.78rem; color: #94a3b8; }
        .recl-description {
          font-size: 0.88rem; color: #374151; line-height: 1.6;
          background: #f8fafc; border-radius: 12px; padding: 0.85rem 1rem;
          margin-bottom: 1rem; border: 1px solid #f1f5f9;
        }
        .recl-actions-row {
          display: grid; grid-template-columns: 190px 1fr auto;
          gap: 0.75rem; align-items: center;
        }
        @media (max-width: 640px) { .recl-actions-row { grid-template-columns: 1fr; } }
        .recl-select {
          width: 100%; padding: 0.65rem 0.85rem; border: 1.5px solid #e5e7eb;
          border-radius: 12px; font-size: 0.85rem; color: #1f2937; background: #fff;
          outline: none; font-family: inherit; cursor: pointer; transition: border-color 0.2s;
        }
        .recl-select:focus { border-color: #E31837; box-shadow: 0 0 0 3px rgba(227,24,55,0.08); }
        .recl-input {
          width: 100%; padding: 0.65rem 0.85rem; border: 1.5px solid #e5e7eb;
          border-radius: 12px; font-size: 0.85rem; color: #1f2937; background: #fff;
          outline: none; font-family: inherit; transition: border-color 0.2s;
        }
        .recl-input:focus { border-color: #E31837; box-shadow: 0 0 0 3px rgba(227,24,55,0.08); }
        .recl-save-btn {
          padding: 0.65rem 1.1rem;
          background: linear-gradient(135deg,#E31837,#B71C1C);
          color: #fff; border: none; border-radius: 12px;
          font-weight: 700; font-size: 0.85rem; cursor: pointer;
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
          box-shadow: 0 4px 12px rgba(227,24,55,0.3); transition: all 0.2s;
        }
        .recl-save-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .recl-save-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
        .recl-empty {
          text-align: center; padding: 3.5rem 1rem;
        }
        .recl-empty-icon {
          width: 72px; height: 72px; border-radius: 20px;
          background: rgba(227,24,55,0.06); display: flex; align-items: center;
          justify-content: center; margin: 0 auto 1.25rem; color: #E31837;
        }
        .recl-error-banner {
          background: #fef2f4; border: 1px solid #fecdd3; color: #be123c;
          border-radius: 12px; padding: 0.85rem 1rem; margin-bottom: 1rem;
          font-size: 0.85rem; display: flex; align-items: center; gap: 8px;
        }
      `}</style>

      <div className={styles.layout}>
        <AdminSidebar />
        <div className={styles.mainContent}>
          <TopNavbar />
          <main className={styles.content}>
            <div className="recl-root">
              {/* Page Header */}
              <div style={{ marginBottom: '1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#E31837', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
                    Support Center
                  </div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
                    {t('reclamations.title')}
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {t('reclamations.adminSubtitle')}
                  </p>
                </div>
                <button onClick={fetchAll} disabled={loading} style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '0.65rem 1.25rem',
                  background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '12px',
                  color: '#374151', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                }}>
                  <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                  {t('reclamations.refresh')}
                </button>
              </div>

              {/* Stats */}
              {!loading && (
                <div className="recl-stats">
                  {[
                    { label: 'Total', value: stats.total, color: '#E31837' },
                    { label: 'Open', value: stats.open, color: '#f59e0b' },
                    { label: 'In Progress', value: stats.in_progress, color: '#3b82f6' },
                    { label: 'Resolved', value: stats.resolved, color: '#22c55e' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="recl-stat">
                      <div className="recl-stat-val" style={{ color }}>{value}</div>
                      <div className="recl-stat-lbl">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="recl-error-banner">
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              {/* Content */}
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
                  {t('reclamations.loading')}
                </div>
              ) : items.length === 0 ? (
                <div className="recl-empty">
                  <div className="recl-empty-icon"><LifeBuoy size={30} /></div>
                  <h3 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '0.5rem' }}>{t('reclamations.adminEmpty')}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.88rem' }}>No reclamations to review at this time.</p>
                </div>
              ) : (
                <div>
                  {items.map(r => {
                    const draft = drafts[r._id] || { status: r.status || 'open', responseMessage: r.responseMessage || '' };
                    const meta = getStatusMeta(r.status || 'open');
                    const StatusIcon = meta.icon;
                    return (
                      <div key={r._id} className="recl-card">
                        <div className="recl-card-header">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="recl-title">{r.title}</div>
                            <div className="recl-meta">
                              {t('reclamations.studentLabel')}: <strong>{r.studentName || r.reporterName || '—'}</strong>
                              {r.category && <> · {t('reclamations.categoryLabel')}: <strong>{r.category}</strong></>}
                              {' · '}{formatDate(r.createdAt)}
                            </div>
                          </div>
                          <div style={statusBadgeStyle(meta.tone)}>
                            <StatusIcon size={12} />
                            {meta.label}
                          </div>
                        </div>
                        <div className="recl-card-body">
                          <div className="recl-description">{r.description}</div>
                          <div className="recl-actions-row">
                            <select value={draft.status} onChange={e => setDrafts(p => ({ ...p, [r._id]: { ...draft, status: e.target.value } }))}
                              className="recl-select" disabled={savingId === r._id}>
                              {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                            <input value={draft.responseMessage} onChange={e => setDrafts(p => ({ ...p, [r._id]: { ...draft, responseMessage: e.target.value } }))}
                              placeholder={t('reclamations.responsePlaceholder')} className="recl-input" disabled={savingId === r._id} />
                            <button onClick={() => save(r._id)} disabled={savingId === r._id} className="recl-save-btn">
                              <Save size={14} />
                              {savingId === r._id ? t('reclamations.saving') : t('reclamations.save')}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </>
  );
};

export default Reclamations;