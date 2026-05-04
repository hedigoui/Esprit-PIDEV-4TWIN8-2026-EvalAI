import { useEffect, useMemo, useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar';
import TopNavbar from '../../components/TopNavbar';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Users, ClipboardCheck, Activity, BarChart3, Shield } from 'lucide-react';
import { exportReportToPdf } from '../../utils/exportPdf';
import { exportElementToPng } from '../../utils/exportImage';
import { useI18n } from '../../i18n/I18nProvider';
const reportsPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

  .rp-root * { font-family: 'Manrope', sans-serif; box-sizing: border-box; }

  .rp-root { display: flex; min-height: 100vh; background: var(--bg-main); }
  .rp-main { flex: 1; overflow-y: auto; min-width: 0; }

  .rp-content {
    max-width: 1280px;
    padding: 2rem 2.5rem;
    margin: 0 auto;
  }

  .rp-hero {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #E31837 150%);
    border-radius: 24px;
    padding: 2.5rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 20px 60px rgba(227,24,55,0.15);
  }

  .rp-hero::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(227,24,55,0.2) 0%, transparent 70%);
    pointer-events: none;
  }

  .rp-hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(227,24,55,0.9);
    background: rgba(227,24,55,0.12);
    padding: 0.3rem 0.75rem;
    border-radius: 20px;
    margin-bottom: 0.75rem;
    border: 1px solid rgba(227,24,55,0.2);
  }

  .rp-hero-title {
    font-size: 2rem; font-weight: 800; color: #fff;
    letter-spacing: -0.04em; margin: 0 0 0.5rem; line-height: 1.2;
  }

  .rp-hero-sub {
    color: rgba(255,255,255,0.55); font-size: 0.9rem;
    line-height: 1.6; max-width: 420px; margin: 0;
  }

  .rp-hero-icon {
    width: 90px; height: 90px; border-radius: 50%;
    background: rgba(227,24,55,0.15);
    border: 1px solid rgba(227,24,55,0.25);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.7); flex-shrink: 0;
  }

  .rp-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
  }

  .rp-filters {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .rp-filter-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: 12px;
    padding: 0.5rem 0.75rem;
  }

  .rp-filter-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .rp-filter-input {
    border: 1px solid var(--border-light);
    border-radius: 10px;
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
    background: var(--bg-card-solid);
    color: var(--text-primary);
  }

  .rp-compare {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 900px) {
    .rp-compare { grid-template-columns: 1fr; }
  }

  .rp-compare-card {
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: 16px;
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .rp-compare-label {
    font-size: 0.72rem;
    color: #94a3b8;
    font-weight: 600;
  }

  .rp-compare-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: var(--text-primary);
  }

  .rp-compare-change {
    font-size: 0.72rem;
    font-weight: 700;
    color: #22c55e;
  }

  .rp-panel-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .rp-panel-btn {
    border: 1px solid var(--border-light);
    background: var(--bg-card);
    color: var(--text-secondary);
    border-radius: 10px;
    padding: 0.35rem 0.55rem;
    font-size: 0.72rem;
    cursor: pointer;
  }

  .rp-section-tag {
    font-size: 0.72rem; font-weight: 700;
    color: #E31837; text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .rp-export-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.55rem 1.1rem;
    border: 1.5px solid var(--border-light);
    border-radius: 12px;
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 600;
    font-family: 'Manrope', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }

  .rp-export-btn:hover {
    border-color: rgba(0,0,0,0.18);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  .rp-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 1024px) { .rp-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { .rp-stats { grid-template-columns: 1fr; } }

  .rp-stat {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid var(--border-light);
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    transition: all 0.2s;
  }

  .rp-stat:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }

  .rp-stat-dark {
    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
    border-color: transparent;
  }

  .rp-stat-icon {
    width: 38px; height: 38px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1rem;
  }

  .rp-stat-val {
    font-size: 2rem; font-weight: 800; color: var(--text-primary);
    letter-spacing: -0.03em; line-height: 1; margin-bottom: 0.3rem;
  }

  .rp-stat-val-light { color: #fff; }

  .rp-stat-lbl { font-size: 0.78rem; color: #94a3b8; font-weight: 500; }
  .rp-stat-lbl-light { color: rgba(255,255,255,0.45); }

  .rp-trend-badge {
    display: inline-flex; align-items: center; gap: 0.2rem;
    font-size: 0.62rem; font-weight: 700;
    color: #22c55e; background: rgba(34,197,94,0.1);
    padding: 0.18rem 0.45rem; border-radius: 8px;
    float: right;
  }

  .rp-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  @media (max-width: 768px) { .rp-charts { grid-template-columns: 1fr; } }

  .rp-panel {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid var(--border-light);
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    margin-bottom: 1rem;
  }

  .rp-panel-title {
    font-size: 0.95rem; font-weight: 700; color: var(--text-primary);
    margin: 0 0 0.25rem;
  }

  .rp-panel-hint {
    font-size: 0.75rem; color: #94a3b8; margin: 0 0 1rem;
  }

  .rp-footer {
    display: flex; gap: 1rem;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border-radius: 20px;
    padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .rp-footer-item {
    display: flex; align-items: center; gap: 0.5rem;
    padding-right: 1.25rem;
    border-right: 1px solid rgba(255,255,255,0.08);
  }

  .rp-footer-item:last-child { border-right: none; }

  .rp-footer-lbl { font-size: 0.75rem; color: rgba(255,255,255,0.45); }
  .rp-footer-val { font-size: 0.875rem; font-weight: 700; color: #fff; }

  .rp-loading { color: #94a3b8; font-size: 0.875rem; padding: 1rem 0; text-align: center; }
`;

const monthLabel = (d, locale) => d.toLocaleString(locale, { month: 'short' });

const formatDateInput = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

const parseDateStart = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

const parseDateEnd = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999);
};

const buildMonthBuckets = (start, end, locale) => {
  if (!start || !end) return [];
  const buckets = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    buckets.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      month: monthLabel(cursor, locale),
      evaluations: 0,
      activeUsers: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
};

const computeDelta = (current, previous) => {
  if (previous === 0 || previous == null || Number.isNaN(previous)) {
    return { diff: current, pct: null };
  }
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  return { diff, pct };
};

function safeFilenamePart(value) {
  const raw = String(value || '').toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return cleaned || 'user';
}

const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15,15,26,0.92)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
        padding: '0.6rem 0.85rem', boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginBottom: '0.25rem' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#fff', fontSize: '0.82rem', fontWeight: '700' }}>
            {p.dataKey === 'evaluations'
              ? `${p.value} ${t('adminReports.tooltipEvaluations')}`
              : `${p.value} ${t('adminReports.tooltipUsers')}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const { t, language } = useI18n();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const [usersData, setUsersData] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    return formatDateInput(start);
  });
  const [dateTo, setDateTo] = useState(() => formatDateInput(new Date()));

  const currentUser = useMemo(() => {
    try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setDataLoading(true);
        const [usersRes, perfRes] = await Promise.all([
          fetch('http://localhost:3000/users', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:3000/oral-performances', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const usersJson = usersRes.ok ? await usersRes.json() : [];
        const perfJson = perfRes.ok ? await perfRes.json() : { data: [] };

        if (cancelled) return;
        setUsersData(Array.isArray(usersJson) ? usersJson : []);
        setPerformances(Array.isArray(perfJson.data) ? perfJson.data : []);
      } catch {
        if (!cancelled) {
          setUsersData([]);
          setPerformances([]);
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rangeStart = useMemo(() => parseDateStart(dateFrom), [dateFrom]);
  const rangeEnd = useMemo(() => parseDateEnd(dateTo), [dateTo]);

  const compareRange = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    const delta = rangeEnd.getTime() - rangeStart.getTime();
    if (delta < 0) return null;
    const prevEnd = new Date(rangeStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - delta);
    return { prevStart, prevEnd };
  }, [rangeStart, rangeEnd]);

  const filteredPerformances = useMemo(() => {
    if (!rangeStart || !rangeEnd) return performances;
    return performances.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [performances, rangeEnd, rangeStart]);

  const filteredUsers = useMemo(() => {
    if (!rangeStart || !rangeEnd) return usersData;
    return usersData.filter((u) => {
      const d = u.createdAt ? new Date(u.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [rangeEnd, rangeStart, usersData]);

  const prevPerformances = useMemo(() => {
    if (!compareRange) return [];
    return performances.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= compareRange.prevStart && d <= compareRange.prevEnd;
    });
  }, [compareRange, performances]);

  const prevUsers = useMemo(() => {
    if (!compareRange) return [];
    return usersData.filter((u) => {
      const d = u.createdAt ? new Date(u.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= compareRange.prevStart && d <= compareRange.prevEnd;
    });
  }, [compareRange, usersData]);

  const platformData = useMemo(() => {
    if (!rangeStart || !rangeEnd) return [];
    const buckets = buildMonthBuckets(rangeStart, rangeEnd, locale);
    filteredPerformances.forEach((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.evaluations += 1;
    });
    filteredUsers.forEach((u) => {
      const d = u.createdAt ? new Date(u.createdAt) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.activeUsers += u.isActive ? 1 : 0;
    });
    return buckets;
  }, [filteredPerformances, filteredUsers, locale, rangeEnd, rangeStart]);

  const levelDistribution = useMemo(() => {
    const levels = {
      A1: 0,
      A2: 0,
      B1: 0,
      B2: 0,
      C1: 0,
      C2: 0,
    };
    filteredPerformances.forEach((p) => {
      const prof = p.overallProficiency;
      if (prof === 'beginner') levels.A1 += 1;
      else if (prof === 'intermediate') levels.B1 += 1;
      else if (prof === 'advanced') levels.B2 += 1;
      else if (prof === 'proficient') levels.C1 += 1;
    });
    const total = Object.values(levels).reduce((a, b) => a + b, 0) || 1;
    const toPct = (n) => Math.round((n / total) * 100);
    return [
      { name: 'A1', value: toPct(levels.A1), color: '#ef4444' },
      { name: 'A2', value: toPct(levels.A2), color: '#f97316' },
      { name: 'B1', value: toPct(levels.B1), color: '#eab308' },
      { name: 'B2', value: toPct(levels.B2), color: '#22c55e' },
      { name: 'C1', value: toPct(levels.C1), color: '#3b82f6' },
      { name: 'C2', value: toPct(levels.C2), color: '#8b5cf6' },
    ];
  }, [filteredPerformances]);

  const teacherPerformance = useMemo(() => {
    const byTeacher = new Map();
    filteredPerformances.forEach((p) => {
      const id = p.instructorId || 'unknown';
      const entry = byTeacher.get(id) || { evaluations: 0, totalScore: 0, students: new Set() };
      entry.evaluations += 1;
      entry.totalScore += p.totalScore || 0;
      if (p.studentId) entry.students.add(p.studentId);
      byTeacher.set(id, entry);
    });

    const colors = ['#E31837', '#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b'];
    const teachers = usersData.filter((u) => u.role === 'instructor');
    return [...byTeacher.entries()]
      .map(([id, entry], i) => {
        const teacher = teachers.find((t) => (t._id || t.id) === id);
        const name = teacher
          ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.email
          : t('roles.instructor');
        const initials = name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
        return {
          name,
          evaluations: entry.evaluations,
          avgScore: entry.evaluations ? Math.round(entry.totalScore / entry.evaluations) : 0,
          students: entry.students.size,
          initials,
          color: colors[i % colors.length],
        };
      })
      .sort((a, b) => b.evaluations - a.evaluations)
      .slice(0, 5);
  }, [filteredPerformances, usersData, t]);

  const currentStats = useMemo(() => {
    const graded = filteredPerformances.filter((p) => typeof p.totalScore === 'number');
    const avgScore = graded.length
      ? graded.reduce((sum, p) => sum + (p.totalScore || 0), 0) / graded.length
      : null;
    const activeUsers = filteredUsers.filter((u) => u.isActive).length;
    return {
      evaluations: filteredPerformances.length,
      avgScore,
      activeUsers,
    };
  }, [filteredPerformances, filteredUsers]);

  const previousStats = useMemo(() => {
    const graded = prevPerformances.filter((p) => typeof p.totalScore === 'number');
    const avgScore = graded.length
      ? graded.reduce((sum, p) => sum + (p.totalScore || 0), 0) / graded.length
      : null;
    const activeUsers = prevUsers.filter((u) => u.isActive).length;
    return {
      evaluations: prevPerformances.length,
      avgScore,
      activeUsers,
    };
  }, [prevPerformances, prevUsers]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const nameRaw = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || 'user';
      const namePart = safeFilenamePart(nameRaw);
      const datePart = new Date().toISOString().slice(0, 10);
      await exportReportToPdf({
        elementId: 'admin-reports-export',
        filename: `admin-reports-${namePart}-${datePart}.pdf`,
      });
    } catch (err) {
      console.error('Export failed:', err);
      alert(t('adminReports.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const handleChartDownload = async (elementId, label) => {
    try {
      const datePart = new Date().toISOString().slice(0, 10);
      await exportElementToPng({
        elementId,
        filename: `admin-${label}-${datePart}.png`,
      });
    } catch (err) {
      console.error('Chart export failed:', err);
    }
  };
  return (
    <>
      <style>{reportsPageStyles}</style>
      <div className="rp-root">
        <AdminSidebar />
        <div className="rp-main">
          <TopNavbar />
          <div className="rp-content" id="admin-reports-export">

            <div className="rp-hero">
              <div>
                <div className="rp-hero-kicker">📈 {t('adminReports.heroKicker')}</div>
                <h1 className="rp-hero-title">{t('adminReports.heroTitle')}</h1>
                <p className="rp-hero-sub">{t('adminReports.heroSubtitle')}</p>
              </div>
              <div className="rp-hero-icon"><TrendingUp size={36} strokeWidth={1.5} /></div>
            </div>

            <div className="rp-toolbar">
              <span className="rp-section-tag">{t('adminReports.sectionTag')}</span>
              <button type="button" className="rp-export-btn" onClick={handleExport} disabled={exporting}>
                <Download size={15} /> {exporting ? t('adminReports.exporting') : t('adminReports.exportPdf')}
              </button>
            </div>

            <div className="rp-filters">
              <div className="rp-filter-group">
                <span className="rp-filter-label">{t('common.dateRange')}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t('common.from')}</span>
                  <input
                    type="date"
                    className="rp-filter-input"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t('common.to')}</span>
                  <input
                    type="date"
                    className="rp-filter-input"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </label>
              </div>
              <div className="rp-filter-group">
                <span className="rp-filter-label">{t('common.compareRange')}</span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t('common.previousPeriod')}</span>
              </div>
            </div>

            {dataLoading && <p className="rp-loading">{t('adminReports.loadingReports')}</p>}

            <div className="rp-compare">
              <div className="rp-compare-card">
                <div className="rp-compare-label">{t('adminReports.totalEvaluations')}</div>
                <div className="rp-compare-row">
                  <span>{t('common.currentPeriod')}</span>
                  <strong>{currentStats.evaluations}</strong>
                </div>
                <div className="rp-compare-row">
                  <span>{t('common.previousPeriod')}</span>
                  <span>{previousStats.evaluations}</span>
                </div>
                <div className="rp-compare-change">
                  {(() => {
                    const delta = computeDelta(currentStats.evaluations, previousStats.evaluations);
                    if (delta.pct == null) return `${t('common.change')}: —`;
                    const sign = delta.pct >= 0 ? '+' : '';
                    return `${t('common.change')}: ${sign}${delta.pct}%`;
                  })()}
                </div>
              </div>
              <div className="rp-compare-card">
                <div className="rp-compare-label">{t('adminReports.platformAvgScore')}</div>
                <div className="rp-compare-row">
                  <span>{t('common.currentPeriod')}</span>
                  <strong>{currentStats.avgScore != null ? currentStats.avgScore.toFixed(1) : '—'}</strong>
                </div>
                <div className="rp-compare-row">
                  <span>{t('common.previousPeriod')}</span>
                  <span>{previousStats.avgScore != null ? previousStats.avgScore.toFixed(1) : '—'}</span>
                </div>
                <div className="rp-compare-change">
                  {(() => {
                    if (currentStats.avgScore == null || previousStats.avgScore == null) return `${t('common.change')}: —`;
                    const delta = computeDelta(currentStats.avgScore, previousStats.avgScore);
                    if (delta.pct == null) return `${t('common.change')}: —`;
                    const sign = delta.pct >= 0 ? '+' : '';
                    return `${t('common.change')}: ${sign}${delta.pct}%`;
                  })()}
                </div>
              </div>
              <div className="rp-compare-card">
                <div className="rp-compare-label">{t('adminReports.activeUsers')}</div>
                <div className="rp-compare-row">
                  <span>{t('common.currentPeriod')}</span>
                  <strong>{currentStats.activeUsers}</strong>
                </div>
                <div className="rp-compare-row">
                  <span>{t('common.previousPeriod')}</span>
                  <span>{previousStats.activeUsers}</span>
                </div>
                <div className="rp-compare-change">
                  {(() => {
                    const delta = computeDelta(currentStats.activeUsers, previousStats.activeUsers);
                    if (delta.pct == null) return `${t('common.change')}: —`;
                    const sign = delta.pct >= 0 ? '+' : '';
                    return `${t('common.change')}: ${sign}${delta.pct}%`;
                  })()}
                </div>
              </div>
            </div>

            <div className="rp-stats">
              <div className="rp-stat rp-stat-dark">
                <div className="rp-stat-icon" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <ClipboardCheck size={16} color="rgba(255,255,255,0.6)" />
                </div>
                <div className="rp-stat-val rp-stat-val-light">{dataLoading ? '—' : currentStats.evaluations}</div>
                <div className="rp-stat-lbl rp-stat-lbl-light">{t('adminReports.totalEvaluations')}</div>
              </div>

              <div className="rp-stat">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div className="rp-stat-icon" style={{ background: 'rgba(59,130,246,0.08)', margin: 0 }}>
                    <TrendingUp size={16} color="#3b82f6" />
                  </div>
                  <span className="rp-trend-badge">+2.3</span>
                </div>
                <div className="rp-stat-val">{dataLoading ? '—' : (currentStats.avgScore != null ? currentStats.avgScore.toFixed(1) : '—')}</div>
                <div className="rp-stat-lbl">{t('adminReports.platformAvgScore')}</div>
              </div>

              <div className="rp-stat">
                <div className="rp-stat-icon" style={{ background: 'rgba(34,197,94,0.08)', marginBottom: '0.75rem' }}>
                  <Users size={16} color="#22c55e" />
                </div>
                <div className="rp-stat-val">{dataLoading ? '—' : `${Math.round((filteredUsers.filter((u) => u.isActive).length / Math.max(1, filteredUsers.length)) * 100)}%`}</div>
                <div className="rp-stat-lbl">{t('adminReports.activeUsers')}</div>
              </div>

              <div className="rp-stat">
                <div className="rp-stat-icon" style={{ background: 'rgba(139,92,246,0.08)', marginBottom: '0.75rem' }}>
                  <Activity size={16} color="#8b5cf6" />
                </div>
                <div className="rp-stat-val">{dataLoading ? '—' : (() => {
                  const months = platformData.map((m) => m.evaluations);
                  if (months.length < 2) return '—';
                  const first = months[0] || 0;
                  const last = months[months.length - 1] || 0;
                  if (!first) return '—';
                  const delta = Math.round(((last - first) / first) * 100);
                  return `${delta >= 0 ? '+' : ''}${delta}%`;
                })()}</div>
                <div className="rp-stat-lbl">{t('adminReports.monthlyGrowth')}</div>
              </div>
            </div>

            <div className="rp-charts">
              <div className="rp-panel" id="admin-platform-activity">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <h3 className="rp-panel-title">{t('adminReports.platformActivity')}</h3>
                    <p className="rp-panel-hint">{t('adminReports.platformActivityHint')}</p>
                  </div>
                  <div className="rp-panel-actions">
                    <button
                      type="button"
                      className="rp-panel-btn"
                      onClick={() => handleChartDownload('admin-platform-activity', 'platform-activity')}
                    >
                      {t('common.downloadChart')}
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={platformData}>
                    <defs>
                      <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E31837" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#E31837" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="month" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip t={t} />} />
                    <Area type="monotone" dataKey="evaluations" stroke="#E31837" fill="url(#evalGrad)" strokeWidth={2.5} dot={{ fill: '#fff', stroke: '#E31837', strokeWidth: 2, r: 3 }} />
                    <Area type="monotone" dataKey="activeUsers" stroke="#3b82f6" fill="url(#userGrad)" strokeWidth={2.5} dot={{ fill: '#fff', stroke: '#3b82f6', strokeWidth: 2, r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="rp-panel" id="admin-cefr-distribution">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <h3 className="rp-panel-title">{t('adminReports.cefrDistribution')}</h3>
                    <p className="rp-panel-hint">{t('adminReports.cefrDistributionHint')}</p>
                  </div>
                  <div className="rp-panel-actions">
                    <button
                      type="button"
                      className="rp-panel-btn"
                      onClick={() => handleChartDownload('admin-cefr-distribution', 'cefr-distribution')}
                    >
                      {t('common.downloadChart')}
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={levelDistribution} innerRadius={50} outerRadius={72} paddingAngle={3}
                      dataKey="value" stroke="none"
                    >
                      {levelDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{
                      background: 'rgba(15,15,26,0.92)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '10px', fontSize: '0.78rem', color: '#fff', backdropFilter: 'blur(16px)',
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem 0.75rem', justifyContent: 'center', marginTop: '0.25rem' }}>
                  {levelDistribution.map((l) => (
                    <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: '#64748b' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: l.color }} />
                      {l.name} <span style={{ fontWeight: '700', color: '#1a1a2e' }}>{l.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rp-panel" id="admin-instructor-performance">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={16} style={{ color: '#8b5cf6' }} />
                  <h3 className="rp-panel-title" style={{ margin: 0 }}>{t('adminReports.instructorPerformance')}</h3>
                </div>
                <div className="rp-panel-actions">
                  <button
                    type="button"
                    className="rp-panel-btn"
                    onClick={() => handleChartDownload('admin-instructor-performance', 'instructor-performance')}
                  >
                    {t('common.downloadChart')}
                  </button>
                  <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#E31837' }}>{t('adminReports.viewAll')} →</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {teacherPerformance.map((teacher, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.015)', borderRadius: '14px',
                    borderLeft: `3px solid ${teacher.color}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '12px',
                        background: `${teacher.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: '800', fontSize: '0.72rem', color: teacher.color,
                      }}>{teacher.initials}</div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a1a2e' }}>{teacher.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          {t('adminReports.teacherStats', {
                            students: teacher.students,
                            studentsLabel: t('adminReports.studentsLabel'),
                            evaluations: teacher.evaluations,
                            evaluationsLabel: t('adminReports.evaluationsLabel'),
                          })}
                        </div>
                      </div>
                    </div>
                    <div style={{ width: '120px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>{t('adminReports.avgScore')}</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#1a1a2e' }}>{teacher.avgScore}/100</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.04)' }}>
                        <div style={{
                          width: `${teacher.avgScore}%`, height: '100%', borderRadius: '3px',
                          background: `linear-gradient(90deg, ${teacher.color}, ${teacher.color}aa)`,
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rp-footer">
              <div className="rp-footer-item">
                <Users size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="rp-footer-lbl">{t('adminReports.footerTotalUsers')}</span>
                <span className="rp-footer-val">{dataLoading ? '—' : filteredUsers.length}</span>
              </div>
              <div className="rp-footer-item">
                <ClipboardCheck size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="rp-footer-lbl">{t('adminReports.footerEvaluations')}</span>
                <span className="rp-footer-val">{dataLoading ? '—' : filteredPerformances.length}</span>
              </div>
              <div className="rp-footer-item">
                <Shield size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="rp-footer-lbl">{t('adminReports.footerPlatform')}</span>
                <span className="rp-footer-val">{t('adminReports.footerHealthy')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;
