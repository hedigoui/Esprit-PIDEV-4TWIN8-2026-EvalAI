import TeacherSidebar from '../../components/TeacherSidebar';
import TopNavbar from '../../components/TopNavbar';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { Download, ClipboardCheck, TrendingUp, Award, BookOpen, ArrowUpRight, Users, Medal } from 'lucide-react';
import { oralPerformanceService } from '../services/oralPerformance.service';
import { exportReportToPdf } from '../../utils/exportPdf';
import { useI18n } from '../../i18n/I18nProvider';
import { exportElementToPng } from '../../utils/exportImage';

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

  /* Hero */
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
    line-height: 1.6; max-width: 380px; margin: 0;
  }

  .rp-hero-icon {
    width: 90px; height: 90px; border-radius: 50%;
    background: rgba(227,24,55,0.15);
    border: 1px solid rgba(227,24,55,0.25);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.7); flex-shrink: 0;
  }

  /* Toolbar */
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

  /* Stats grid */
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

  /* Charts */
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

  /* Top learners */
  .rp-learner-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.7rem 0.75rem;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .rp-learner-row:hover { background: rgba(0,0,0,0.025); }

  .rp-learner-rank {
    font-size: 0.95rem; font-weight: 800; color: #94a3b8;
    width: 28px; text-align: center; flex-shrink: 0;
  }

  .rp-learner-avatar {
    width: 42px; height: 42px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 0.72rem; flex-shrink: 0;
  }

  .rp-learner-name { font-size: 0.875rem; font-weight: 600; color: var(--text-primary); }
  .rp-learner-sub { font-size: 0.7rem; color: #94a3b8; margin-top: 2px; }

  .rp-learner-delta {
    font-size: 0.88rem; font-weight: 800; color: #22c55e; flex-shrink: 0;
  }

  .rp-view-btn {
    font-size: 0.8rem; font-weight: 600; color: #E31837;
    background: none; border: none; cursor: pointer;
    font-family: 'Manrope', sans-serif; padding: 0;
  }

  .rp-view-btn:hover { text-decoration: underline; }

  /* Footer bar */
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

const computeDelta = (current, previous) => {
  if (previous === 0 || previous == null || Number.isNaN(previous)) {
    return { diff: current, pct: null };
  }
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  return { diff, pct };
};

const countMonthsBetween = (start, end) => {
  if (!start || !end) return 6;
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  return Math.max(1, months);
};

function normalizeDisplayScore(raw) {
  if (raw == null || Number.isNaN(Number(raw))) return null;
  const n = Number(raw);
  if (n <= 10) return Math.round(n * 10);
  return Math.round(Math.min(100, n));
}

function profToShort(p) {
  if (!p) return '—';
  const map = { beginner: 'A1–A2', intermediate: 'B1', advanced: 'B2', proficient: 'C1+' };
  return map[String(p).toLowerCase()] || String(p);
}

function buildMonthlySeries(performances, locale, monthsBack = 6) {
  const rows = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = d.toLocaleDateString(locale, { month: 'short' });
    const inMonth = performances.filter((p) => { const t = new Date(p.createdAt); return t.getFullYear() === y && t.getMonth() === m; });
    const graded = inMonth.filter((p) => p.status === 'graded' && p.totalScore != null);
    const scores = graded.map((p) => normalizeDisplayScore(p.totalScore)).filter((s) => s != null);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    rows.push({ month: label, evaluations: inMonth.length, avgScore: avgScore ?? 0 });
  }
  return rows;
}

function safeFilenamePart(value) {
  const raw = String(value || '').toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return cleaned || 'user';
}

function topImproving(performances, studentsById, t) {
  const byStudent = {};
  performances.filter((p) => p.status === 'graded' && p.totalScore != null).forEach((p) => {
    const id = p.studentId;
    if (!byStudent[id]) byStudent[id] = [];
    const sc = normalizeDisplayScore(p.totalScore);
    if (sc == null) return;
    byStudent[id].push({ date: p.createdAt, score: sc });
  });

  const ranked = Object.entries(byStudent).map(([id, arr]) => {
    arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    const from = arr[0].score;
    const to = arr[arr.length - 1].score;
    const st = studentsById[id];
    const name = st ? `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.email : t('teacherReports.studentFallback');
    return { id, name, from, to, delta: to - from, sessions: arr.length };
  }).filter((x) => x.sessions >= 2 && x.delta > 0).sort((a, b) => b.delta - a.delta).slice(0, 5);

  if (ranked.length > 0) return ranked;

  return Object.entries(byStudent).map(([id, arr]) => {
    arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    const to = arr[0]?.score ?? 0;
    const st = studentsById[id];
    const name = st ? `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.email : t('teacherReports.studentFallback');
    return { id, name, from: to, to, delta: 0, sessions: arr.length };
  }).sort((a, b) => b.to - a.to).slice(0, 5);
}

const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.6rem 0.85rem', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginBottom: '0.2rem' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#fff', fontSize: '0.82rem', fontWeight: '700' }}>
            {p.name === 'evaluations'
              ? `${p.value} ${t('teacherReports.tooltipSessions')}`
              : `${t('teacherReports.tooltipAvg')}: ${p.value}/100`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [students, setStudents] = useState([]);
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
    let cancelled = false;
    (async () => {
      try {
        const instructorId = currentUser?.id;
        if (!instructorId) { setLoading(false); return; }
        const [statsData, perfData, studentsResponse] = await Promise.all([
          oralPerformanceService.getStatistics(instructorId),
          oralPerformanceService.getInstructorPerformances(instructorId),
          fetch(`${API_BASE_URL}/users/students`).then((r) => (r.ok ? r.json() : { data: [] })),
        ]);
        if (cancelled) return;
        const list = perfData || [];
        setPerformances(list);
        setStats(statsData || null);
        const students = studentsResponse?.data || [];
        setStudents(students);
        setStudentCount(students.length);
      } catch (e) { console.error(e); } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id, locale, t]);

  const rangeStart = useMemo(() => parseDateStart(dateFrom), [dateFrom]);
  const rangeEnd = useMemo(() => parseDateEnd(dateTo), [dateTo]);

  const compareRange = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    const delta = rangeEnd.getTime() - rangeStart.getTime();
    if (delta < 0) return null;
    const prevEnd = new Date(rangeStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - delta);
    return { prevStart, prevEnd };
  }, [rangeEnd, rangeStart]);

  const filteredPerformances = useMemo(() => {
    if (!rangeStart || !rangeEnd) return performances;
    return performances.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [performances, rangeEnd, rangeStart]);

  const prevPerformances = useMemo(() => {
    if (!compareRange) return [];
    return performances.filter((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= compareRange.prevStart && d <= compareRange.prevEnd;
    });
  }, [compareRange, performances]);

  const filteredMonthlyData = useMemo(() => {
    const months = countMonthsBetween(rangeStart, rangeEnd);
    return buildMonthlySeries(filteredPerformances, locale, months);
  }, [filteredPerformances, locale, rangeEnd, rangeStart]);

  const avgDelta = useMemo(() => {
    const series = filteredMonthlyData.filter((x) => x.avgScore > 0);
    if (series.length < 2) return null;
    const a = series[0].avgScore;
    const b = series[series.length - 1].avgScore;
    return a > 0 ? Math.round(((b - a) / a) * 100) : null;
  }, [filteredMonthlyData]);

  const avgScoreDisplay = useMemo(() => {
    const graded = filteredPerformances.filter((p) => p.status === 'graded' && p.totalScore != null);
    if (!graded.length) return '—';
    const avg = graded.reduce((sum, p) => sum + (p.totalScore || 0), 0) / graded.length;
    return normalizeDisplayScore(avg) ?? avg;
  }, [filteredPerformances]);

  const totalEvaluations = filteredPerformances.filter((p) => p.status === 'graded').length;
  const monthEvals = useMemo(() => {
    const now = new Date();
    return filteredPerformances.filter((p) => {
      const t = p.createdAt ? new Date(p.createdAt) : null;
      if (!t || Number.isNaN(t.getTime())) return false;
      return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
    }).length;
  }, [filteredPerformances]);

  const cefrApprox = useMemo(() => {
    const dist = stats?.proficiencyDistribution || {};
    const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
    if (!entries.length || entries[0][1] === 0) return '—';
    return profToShort(entries[0][0]);
  }, [stats]);

  const improvementHeadline = useMemo(() => {
    const graded = filteredPerformances.filter((p) => p.status === 'graded' && p.totalScore != null);
    if (graded.length < 2) return '—';
    const sorted = [...graded].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const from = normalizeDisplayScore(sorted[0].totalScore);
    const to = normalizeDisplayScore(sorted[sorted.length - 1].totalScore);
    if (from == null || to == null || from === 0) return '—';
    return `+${Math.round(((to - from) / from) * 100)}%`;
  }, [filteredPerformances]);

  const lineDomain = useMemo(() => {
    const vals = filteredMonthlyData.map((m) => m.avgScore).filter((v) => v > 0);
    if (!vals.length) return [0, 100];
    return [Math.max(0, Math.min(...vals) - 10), Math.min(100, Math.max(...vals) + 5)];
  }, [filteredMonthlyData]);

  const studentsById = useMemo(() => Object.fromEntries(students.map((s) => [s._id?.toString?.() || s._id, s])), [students]);

  const topList = useMemo(() => topImproving(filteredPerformances, studentsById, t), [filteredPerformances, studentsById, t]);

  const currentStats = useMemo(() => {
    const graded = filteredPerformances.filter((p) => p.status === 'graded' && p.totalScore != null);
    const scores = graded.map((p) => normalizeDisplayScore(p.totalScore)).filter((s) => s != null);
    const avgScore = scores.length
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : null;
    let improvement = null;
    if (graded.length >= 2) {
      const sorted = [...graded].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const from = normalizeDisplayScore(sorted[0].totalScore);
      const to = normalizeDisplayScore(sorted[sorted.length - 1].totalScore);
      if (from != null && to != null && from !== 0) {
        improvement = Math.round(((to - from) / from) * 100);
      }
    }
    return { evaluations: graded.length, avgScore, improvement };
  }, [filteredPerformances]);

  const previousStats = useMemo(() => {
    const graded = prevPerformances.filter((p) => p.status === 'graded' && p.totalScore != null);
    const scores = graded.map((p) => normalizeDisplayScore(p.totalScore)).filter((s) => s != null);
    const avgScore = scores.length
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : null;
    let improvement = null;
    if (graded.length >= 2) {
      const sorted = [...graded].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const from = normalizeDisplayScore(sorted[0].totalScore);
      const to = normalizeDisplayScore(sorted[sorted.length - 1].totalScore);
      if (from != null && to != null && from !== 0) {
        improvement = Math.round(((to - from) / from) * 100);
      }
    }
    return { evaluations: graded.length, avgScore, improvement };
  }, [prevPerformances]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const nameRaw = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || 'user';
      const namePart = safeFilenamePart(nameRaw);
      const datePart = new Date().toISOString().slice(0, 10);
      await exportReportToPdf({
        elementId: 'teacher-reports-export',
        filename: `teacher-reports-${namePart}-${datePart}.pdf`,
      });
    } catch (err) {
      console.error('Export failed:', err);
      alert(t('teacherReports.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <style>{reportsPageStyles}</style>
      <div className="rp-root">
        <TeacherSidebar />
        <div className="rp-main">
          <TopNavbar />
          <div className="rp-content" id="teacher-reports-export">

            {/* Hero */}
            <div className="rp-hero">
              <div>
                <div className="rp-hero-kicker">📊 {t('teacherReports.heroKicker')}</div>
                <h1 className="rp-hero-title">{t('teacherReports.heroTitle')}</h1>
                <p className="rp-hero-sub">{t('teacherReports.heroSubtitle')}</p>
              </div>
              <div className="rp-hero-icon"><TrendingUp size={36} strokeWidth={1.5} /></div>
            </div>

            {/* Toolbar */}
            <div className="rp-toolbar">
              <span className="rp-section-tag">{t('teacherReports.sectionTag')}</span>
              <button type="button" className="rp-export-btn" onClick={handleExport} disabled={exporting}>
                <Download size={15} /> {exporting ? t('teacherReports.exporting') : t('teacherReports.exportPdf')}
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

            {loading && <p className="rp-loading">{t('teacherReports.loadingReports')}</p>}

            <div className="rp-compare">
              <div className="rp-compare-card">
                <div className="rp-compare-label">{t('teacherReports.gradedSessions')}</div>
                <div className="rp-compare-row">
                  <span>{t('common.currentPeriod')}</span>
                  <strong>{loading ? '—' : currentStats.evaluations}</strong>
                </div>
                <div className="rp-compare-row">
                  <span>{t('common.previousPeriod')}</span>
                  <span>{loading ? '—' : previousStats.evaluations}</span>
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
                <div className="rp-compare-label">{t('teacherReports.averageScore')}</div>
                <div className="rp-compare-row">
                  <span>{t('common.currentPeriod')}</span>
                  <strong>{loading ? '—' : (currentStats.avgScore != null ? currentStats.avgScore.toFixed(1) : '—')}</strong>
                </div>
                <div className="rp-compare-row">
                  <span>{t('common.previousPeriod')}</span>
                  <span>{loading ? '—' : (previousStats.avgScore != null ? previousStats.avgScore.toFixed(1) : '—')}</span>
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
                <div className="rp-compare-label">{t('teacherReports.overallProgress')}</div>
                <div className="rp-compare-row">
                  <span>{t('common.currentPeriod')}</span>
                  <strong>{loading ? '—' : (currentStats.improvement != null ? `${currentStats.improvement}%` : '—')}</strong>
                </div>
                <div className="rp-compare-row">
                  <span>{t('common.previousPeriod')}</span>
                  <span>{loading ? '—' : (previousStats.improvement != null ? `${previousStats.improvement}%` : '—')}</span>
                </div>
                <div className="rp-compare-change">
                  {(() => {
                    if (currentStats.improvement == null || previousStats.improvement == null) return `${t('common.change')}: —`;
                    const delta = computeDelta(currentStats.improvement, previousStats.improvement);
                    if (delta.pct == null) return `${t('common.change')}: —`;
                    const sign = delta.pct >= 0 ? '+' : '';
                    return `${t('common.change')}: ${sign}${delta.pct}%`;
                  })()}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="rp-stats">
              <div className="rp-stat rp-stat-dark">
                <div className="rp-stat-icon" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <ClipboardCheck size={16} color="rgba(255,255,255,0.6)" />
                </div>
                <div className="rp-stat-val rp-stat-val-light">{totalEvaluations}</div>
                <div className="rp-stat-lbl rp-stat-lbl-light">{t('teacherReports.gradedSessions')}</div>
              </div>

              <div className="rp-stat">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div className="rp-stat-icon" style={{ background: 'rgba(59,130,246,0.08)', margin: 0 }}>
                    <TrendingUp size={16} color="#3b82f6" />
                  </div>
                  {avgDelta != null && (
                    <span className="rp-trend-badge">
                      <ArrowUpRight size={11} /> {avgDelta >= 0 ? '+' : ''}{avgDelta}%
                    </span>
                  )}
                </div>
                <div className="rp-stat-val">{avgScoreDisplay}</div>
                <div className="rp-stat-lbl">{t('teacherReports.averageScore')}</div>
              </div>

              <div className="rp-stat">
                <div className="rp-stat-icon" style={{ background: 'rgba(227,24,55,0.08)', marginBottom: '0.75rem' }}>
                  <Award size={16} color="#E31837" />
                </div>
                <div className="rp-stat-val">{cefrApprox}</div>
                <div className="rp-stat-lbl">{t('teacherReports.typicalBand')}</div>
              </div>

              <div className="rp-stat">
                <div className="rp-stat-icon" style={{ background: 'rgba(34,197,94,0.08)', marginBottom: '0.75rem' }}>
                  <BookOpen size={16} color="#22c55e" />
                </div>
                <div className="rp-stat-val">{improvementHeadline}</div>
                <div className="rp-stat-lbl">{t('teacherReports.overallProgress')}</div>
              </div>
            </div>

            {/* Charts */}
            <div className="rp-charts">
              <div className="rp-panel" id="teacher-report-sessions-chart">
                <div className="rp-panel-header">
                  <div>
                    <h3 className="rp-panel-title">{t('teacherReports.sessionsPerMonth')}</h3>
                    <p className="rp-panel-hint">{t('teacherReports.allPerformancesLast6')}</p>
                  </div>
                  <div className="rp-panel-actions">
                    <button
                      type="button"
                      className="rp-chart-download"
                      onClick={() => exportElementToPng({
                        elementId: 'teacher-report-sessions-chart',
                        filename: 'teacher-sessions-per-month',
                      })}
                    >
                      <Download size={14} /> {t('common.downloadChart')}
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={filteredMonthlyData} barSize={28}>
                    <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="month" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip t={t} />} />
                    <defs>
                      <linearGradient id="barGradReports" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E31837" />
                        <stop offset="100%" stopColor="#E31837" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="evaluations" fill="url(#barGradReports)" radius={[8, 8, 0, 0]} name="evaluations" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rp-panel" id="teacher-report-score-chart">
                <div className="rp-panel-header" style={{ marginBottom: '0.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 className="rp-panel-title" style={{ margin: 0 }}>{t('teacherReports.averageScoreTrend')}</h3>
                      {avgDelta != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '600', color: '#22c55e' }}>
                          <ArrowUpRight size={14} /> {avgDelta >= 0 ? '+' : ''}{avgDelta}%
                        </div>
                      )}
                    </div>
                    <p className="rp-panel-hint">{t('teacherReports.gradedOnly')}</p>
                  </div>
                  <div className="rp-panel-actions">
                    <button
                      type="button"
                      className="rp-chart-download"
                      onClick={() => exportElementToPng({
                        elementId: 'teacher-report-score-chart',
                        filename: 'teacher-average-score-trend',
                      })}
                    >
                      <Download size={14} /> {t('common.downloadChart')}
                    </button>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={filteredMonthlyData}>
                    <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="month" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} domain={lineDomain} />
                    <Tooltip content={<CustomTooltip t={t} />} />
                    <Line type="monotone" dataKey="avgScore" stroke="#3b82f6" strokeWidth={2.5} name="avgScore"
                      dot={{ fill: '#fff', stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ fill: '#3b82f6', stroke: '#fff', strokeWidth: 2, r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top learners */}
            <div className="rp-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Medal size={16} style={{ color: '#f59e0b' }} />
                  <h3 className="rp-panel-title" style={{ margin: 0 }}>{t('teacherReports.topLearners')}</h3>
                </div>
                <button type="button" className="rp-view-btn" onClick={() => navigate('/teacher/students')}>{t('teacherReports.viewRoster')} →</button>
              </div>
              {topList.length === 0 && !loading && (
                <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>{t('teacherReports.noHistory')}</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {topList.map((s, idx) => (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    className="rp-learner-row"
                    onClick={() => navigate(`/teacher/evaluate/${s.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/teacher/evaluate/${s.id}`)}
                    style={{ borderLeft: idx < 3 ? '3px solid #f59e0b' : '3px solid transparent', paddingLeft: idx < 3 ? '0.6rem' : '0.75rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="rp-learner-rank">{idx + 1}</span>
                      <div
                        className="rp-learner-avatar"
                        style={{
                          background: idx < 3 ? 'rgba(245,158,11,0.1)' : 'rgba(0,0,0,0.04)',
                          color: idx < 3 ? '#f59e0b' : '#64748b',
                        }}
                      >
                        {s.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="rp-learner-name">{s.name}</div>
                        <div className="rp-learner-sub">
                          {t('teacherReports.scoreLabel')} {s.from} &rarr; {s.to}
                          {s.sessions > 1 ? ` · ${s.sessions} ${t('teacherReports.gradedLabel')}` : ''}
                        </div>
                      </div>
                    </div>
                    <span className="rp-learner-delta">{s.delta > 0 ? `+${s.delta}` : s.to}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="rp-footer">
              <div className="rp-footer-item">
                <Users size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="rp-footer-lbl">{t('teacherReports.studentsLabel')}</span>
                <span className="rp-footer-val">{studentCount}</span>
              </div>
              <div className="rp-footer-item">
                <ClipboardCheck size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="rp-footer-lbl">{t('teacherReports.thisMonth')}</span>
                <span className="rp-footer-val">{monthEvals} {t('teacherReports.sessionsLabel')}</span>
              </div>
              <div className="rp-footer-item">
                <TrendingUp size={16} style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="rp-footer-lbl">{t('teacherReports.avgScore')}</span>
                <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.875rem' }}>
                  {typeof avgScoreDisplay === 'number' ? `${avgScoreDisplay}/100` : avgScoreDisplay}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Reports;