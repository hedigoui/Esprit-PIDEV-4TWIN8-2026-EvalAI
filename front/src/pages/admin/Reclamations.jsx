import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../../components/AdminSidebar';
import styles from '../../styles/shared.module.css';
import { LifeBuoy, RefreshCw, Save } from 'lucide-react';

const API_URL = 'http://localhost:3000';

const statusOptions = [
  { value: 'open', label: 'Open', tone: 'warning' },
  { value: 'in_progress', label: 'In progress', tone: 'info' },
  { value: 'resolved', label: 'Resolved', tone: 'success' },
  { value: 'rejected', label: 'Rejected', tone: 'red' },
];

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

  const [drafts, setDrafts] = useState({});

  const token = useMemo(() => localStorage.getItem('token'), []);

  const ensureAdmin = () => {
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
      if (user?.role !== 'admin') {
        if (user?.role === 'instructor') navigate('/teacher/dashboard', { replace: true });
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

  const fetchAll = async () => {
    if (!ensureAdmin()) return;
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/reclamations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setItems(list);
      setDrafts((prev) => {
        const next = { ...prev };
        for (const r of list) {
          if (!next[r._id]) {
            next[r._id] = {
              status: r.status || 'open',
              responseMessage: r.responseMessage || '',
            };
          }
        }
        return next;
      });
    } catch (e) {
      console.error(e);
      setError('Failed to load reclamations.');
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
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (id) => {
    if (!ensureAdmin()) return;
    const draft = drafts[id];
    if (!draft?.status) return;

    try {
      setSavingId(id);
      setError('');
      await axios.patch(
        `${API_URL}/reclamations/${id}/status`,
        { status: draft.status, responseMessage: draft.responseMessage },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchAll();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || 'Failed to update reclamation.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={styles.pageHeader}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LifeBuoy size={18} style={{ color: '#E31837' }} />
                <div className={styles.pageTitle}>Reclamations</div>
              </div>
              <div className={styles.pageSubtitle}>Review student issues and respond.</div>
            </div>
            <button className={styles.secondaryButton} onClick={fetchAll} disabled={loading}>
              <RefreshCw size={16} /> Refresh
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

          <div className={styles.card}>
            <div className={styles.cardTitle}>All reclamations</div>

            {loading ? (
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>No reclamations yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {items.map((r) => {
                  const draft = drafts[r._id] || { status: r.status || 'open', responseMessage: r.responseMessage || '' };
                  const meta = statusOptions.find((s) => s.value === (r.status || 'open')) || statusOptions[0];
                  return (
                    <div
                      key={r._id}
                      style={{
                        padding: '1rem 1.05rem',
                        borderRadius: '18px',
                        background: 'rgba(0,0,0,0.015)',
                        border: '1px solid rgba(0,0,0,0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, color: '#1a1a2e', fontSize: '0.98rem' }}>{r.title}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                            Student: {r.studentId || '—'} • Category: {r.category || '—'} • Created: {formatDate(r.createdAt)}
                          </div>
                        </div>
                        <span className={`${styles.badge} ${styles[meta.tone]}`}>{meta.label}</span>
                      </div>

                      <div style={{ marginTop: '0.75rem', color: '#1a1a2e', fontSize: '0.9rem', lineHeight: 1.55 }}>
                        {r.description}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 140px', gap: '0.75rem', marginTop: '0.85rem' }}>
                        <select
                          value={draft.status}
                          onChange={(e) =>
                            setDrafts((p) => ({ ...p, [r._id]: { ...draft, status: e.target.value } }))
                          }
                          style={{
                            width: '100%',
                            padding: '0.7rem 0.8rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            outline: 'none',
                            fontFamily: 'inherit',
                            background: 'white',
                          }}
                          disabled={savingId === r._id}
                        >
                          {statusOptions.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>

                        <input
                          value={draft.responseMessage}
                          onChange={(e) =>
                            setDrafts((p) => ({ ...p, [r._id]: { ...draft, responseMessage: e.target.value } }))
                          }
                          placeholder="Optional response message (visible to student)"
                          style={{
                            width: '100%',
                            padding: '0.7rem 0.85rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.08)',
                            outline: 'none',
                            fontFamily: 'inherit',
                          }}
                          disabled={savingId === r._id}
                        />

                        <button
                          className={styles.primaryButton}
                          style={{ justifyContent: 'center' }}
                          onClick={() => save(r._id)}
                          disabled={savingId === r._id}
                        >
                          <Save size={16} /> {savingId === r._id ? 'Saving…' : 'Save'}
                        </button>
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
  );
};

export default Reclamations;

