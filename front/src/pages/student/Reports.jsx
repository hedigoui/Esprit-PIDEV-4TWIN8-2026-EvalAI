import { useState, useEffect, useMemo, useRef } from 'react';
import StudentSidebar from '../../components/StudentSidebar';
import TopNavbar from '../../components/TopNavbar';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Download, TrendingUp, Award, Target, ArrowUpRight, FileText } from 'lucide-react';
import { oralPerformanceService } from '../services/oralPerformance.service';
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

  .rp-filters {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    padding: 0.8rem 1rem;
    border-radius: 14px;
    margin-bottom: 1.5rem;
  }

  .rp-filter-group { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
  .rp-filter-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
  }

  .rp-filter-input {
    border: 1px solid rgba(0,0,0,0.1);
    background: #fff;
    border-radius: 10px;
    padding: 0.4rem 0.6rem;
    font-size: 0.78rem;
    color: #1a1a2e;
  }

  .rp-compare {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 1024px) { .rp-compare { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 640px) { .rp-compare { grid-template-columns: 1fr; } }

  .rp-compare-card {
    border: 1px solid var(--border-light);
    border-radius: 16px;
    padding: 1rem 1.2rem;
    background: var(--bg-card);
    box-shadow: 0 8px 24px rgba(15,23,42,0.06);
  }

  .rp-compare-label { font-size: 0.8rem; font-weight: 700; color: #1a1a2e; margin-bottom: 0.7rem; }
  .rp-compare-row { display: flex; justify-content: space-between; font-size: 0.78rem; color: #64748b; }
  .rp-compare-row strong { color: #1a1a2e; font-size: 0.9rem; }
  .rp-compare-change { margin-top: 0.6rem; font-size: 0.75rem; font-weight: 700; color: #E31837; }

  .rp-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.6rem;
  }

  .rp-panel-actions { display: inline-flex; gap: 0.5rem; }

  .rp-chart-download {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid rgba(0,0,0,0.08);
    background: rgba(255,255,255,0.9);
    padding: 0.35rem 0.6rem;
    border-radius: 10px;
    font-size: 0.7rem;
    font-weight: 700;
    color: #1a1a2e;
    cursor: pointer;
  }

  .rp-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 1024px) { .rp-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { .rp-stats { grid-template-columns: 1fr; } }

  .rp-loading { color: #94a3b8; font-size: 0.875rem; padding: 1rem 0; text-align: center; }
`;

const PAGE_SIZE = 20;

function getStudentIdFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || '';
  } catch {
    return '';
  }
}

function profToShort(p) {
  if (!p) return '—';
  const map = {
    beginner: 'A1–A2',
    intermediate: 'B1',
    advanced: 'B2',
    proficient: 'C1+',
  };
  return map[String(p).toLowerCase()] || String(p);
}

function normalizeDisplayScore(raw) {
  if (raw == null || Number.isNaN(Number(raw))) return null;
  const n = Number(raw);
  if (n <= 10) return Math.round(n * 10);
  return Math.round(Math.min(100, n));
}

function formatDateInput(date) {
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function parseDateStart(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDateEnd(value) {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const computeDelta = (current, previous) => {
  if (current == null || previous == null) return { diff: null, pct: null };
  if (previous === 0) return { diff: current, pct: null };
  const diff = current - previous;
  const pct = Math.round((diff / Math.abs(previous)) * 100);
  return { diff, pct };
};

function scoreFromRow(row) {
  const o = row.evaluation?.overallScore;
  if (typeof o === 'number' && !Number.isNaN(o)) return normalizeDisplayScore(o);
  return normalizeDisplayScore(row.performance?.totalScore);
}

function safeFilenamePart(value) {
  const raw = String(value || '').toLowerCase();
  const cleaned = raw.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return cleaned || 'user';
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15,15,26,0.92)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
        padding: '0.6rem 0.85rem', boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginBottom: '0.2rem' }}>{label}</p>
        <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '700' }}>{payload[0].value}/100</p>
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const { t, language } = useI18n();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    return formatDateInput(start);
  });
  const [dateTo, setDateTo] = useState(() => formatDateInput(new Date()));
  const loadMoreRef = useRef(null);

  const currentUser = useMemo(() => {
    try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }, []);

  const studentId = useMemo(() => getStudentIdFromToken(), []);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const loadPage = async (pageToLoad, append) => {
      try {
        if (pageToLoad === 1) setLoading(true);
        else setLoadingMore(true);
        const list = await oralPerformanceService.getAllStudentEvaluationsPage(studentId, pageToLoad, PAGE_SIZE);
        if (cancelled) return;
        const data = Array.isArray(list) ? list : (Array.isArray(list?.data) ? list.data : []);
        const total = typeof list?.total === 'number' ? list.total : data.length;
        setRows((prev) => (append ? [...prev, ...data] : data));
        setHasMore(pageToLoad * PAGE_SIZE < total);
        setPage(pageToLoad);
      } catch (e) {
        console.error(e);
        if (!cancelled && pageToLoad === 1) {
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    void loadPage(1, false);
    return () => { cancelled = true; };
  }, [studentId]);

  useEffect(() => {
    if (!loadMoreRef.current || !studentId) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore) {
          setLoadingMore(true);
          void oralPerformanceService.getAllStudentEvaluationsPage(studentId, page + 1, PAGE_SIZE)
            .then((list) => {
              const data = Array.isArray(list) ? list : (Array.isArray(list?.data) ? list.data : []);
              const total = typeof list?.total === 'number' ? list.total : data.length;
              setRows((prev) => [...prev, ...data]);
              setHasMore((page + 1) * PAGE_SIZE < total);
              setPage((p) => p + 1);
            })
            .catch((e) => console.error(e))
            .finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, studentId]);

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

  const filteredRows = useMemo(() => {
    if (!rangeStart || !rangeEnd) return rows;
    return rows.filter((r) => {
      const d = r.performance?.createdAt ? new Date(r.performance.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [rangeEnd, rangeStart, rows]);

  const prevRows = useMemo(() => {
    if (!compareRange) return [];
    return rows.filter((r) => {
      const d = r.performance?.createdAt ? new Date(r.performance.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      return d >= compareRange.prevStart && d <= compareRange.prevEnd;
    });
  }, [compareRange, rows]);

  const historyData = useMemo(() => {
    const sorted = [...filteredRows]
      .filter((r) => scoreFromRow(r) != null)
      .sort((a, b) => new Date(a.performance.createdAt) - new Date(b.performance.createdAt))
      .slice(-12)
      .map((r) => ({
        date: r.performance?.createdAt
          ? new Date(r.performance.createdAt).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
          : '—',
        score: scoreFromRow(r),
      }));
    return sorted;
  }, [filteredRows, locale]);

  const radarData = useMemo(() => {
    const latest = [...filteredRows]
      .filter((r) => r.evaluation?.speechMetrics)
      .sort((a, b) => new Date(b.performance.createdAt) - new Date(a.performance.createdAt))[0];
    const sm = latest?.evaluation?.speechMetrics;
    const cs = latest?.evaluation?.contentScores;
    if (!sm) {
      return [
        { subject: t('skills.fluency'), A: 0 },
        { subject: t('skills.pronunciation'), A: 0 },
        { subject: t('skills.speakingPace'), A: 0 },
        { subject: t('skills.confidence'), A: 0 },
        { subject: t('skills.content'), A: 0 },
      ];
    }
    const pace = Math.min(100, (sm.speakingPace || 0) * 1.2);
    return [
      { subject: t('skills.fluency'), A: Math.round(sm.fluency ?? 0) },
      { subject: t('skills.pronunciation'), A: Math.round(sm.pronunciation ?? 0) },
      { subject: t('skills.speakingPace'), A: Math.round(pace) },
      { subject: t('skills.confidence'), A: Math.round(sm.confidence ?? 0) },
      { subject: t('skills.content'), A: Math.round(cs?.contentStructure ?? 0) },
    ];
  }, [filteredRows, t]);

  const latestScore = useMemo(() => {
    const vals = [...filteredRows]
      .map(scoreFromRow)
      .filter((v) => v != null)
      .sort((a, b) => b - a);
    const fromRows = vals[0] ?? null;
    if (fromRows != null) return fromRows;
    return null;
  }, [filteredRows]);

  const cefrLabel = useMemo(() => {
    const graded = [...filteredRows]
      .filter((r) => r.performance?.overallProficiency)
      .sort((a, b) => new Date(b.performance.createdAt) - new Date(a.performance.createdAt))[0];
    return profToShort(graded?.performance?.overallProficiency);
  }, [filteredRows]);

  const improvementPct = useMemo(() => {
    if (historyData.length < 2) return null;
    const a = historyData[0].score;
    const b = historyData[historyData.length - 1].score;
    if (!a) return null;
    return Math.round(((b - a) / a) * 100);
  }, [historyData]);

  const recentEvaluations = useMemo(() => {
    const colors = ['#E31837', '#3b82f6', '#8b5cf6', '#22c55e', '#f97316'];
    return [...filteredRows]
      .filter((r) => scoreFromRow(r) != null)
      .sort((a, b) => new Date(b.performance.createdAt) - new Date(a.performance.createdAt))
      .slice(0, 8)
      .map((r, i) => ({
        id: String(r.performance?.id ?? i),
        date: r.performance?.createdAt
          ? new Date(r.performance.createdAt).toLocaleDateString(locale)
          : '—',
        title: (r.performance?.title || t('teacherDashboard.sessionFallback')).slice(0, 40),
        score: scoreFromRow(r),
        level: profToShort(r.performance?.overallProficiency),
        color: colors[i % colors.length],
      }));
  }, [filteredRows, locale, t]);

  const currentStats = useMemo(() => {
    const scores = filteredRows.map(scoreFromRow).filter((s) => s != null);
    const avgScore = scores.length
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : null;
    let improvement = null;
    if (scores.length >= 2) {
      const sorted = [...filteredRows]
        .filter((r) => scoreFromRow(r) != null)
        .sort((a, b) => new Date(a.performance.createdAt) - new Date(b.performance.createdAt));
      const from = scoreFromRow(sorted[0]);
      const to = scoreFromRow(sorted[sorted.length - 1]);
      if (from != null && to != null && from !== 0) {
        improvement = Math.round(((to - from) / from) * 100);
      }
    }
    return { evaluations: filteredRows.length, avgScore, improvement };
  }, [filteredRows]);

  const previousStats = useMemo(() => {
    const scores = prevRows.map(scoreFromRow).filter((s) => s != null);
    const avgScore = scores.length
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : null;
    let improvement = null;
    if (scores.length >= 2) {
      const sorted = [...prevRows]
        .filter((r) => scoreFromRow(r) != null)
        .sort((a, b) => new Date(a.performance.createdAt) - new Date(b.performance.createdAt));
      const from = scoreFromRow(sorted[0]);
      const to = scoreFromRow(sorted[sorted.length - 1]);
      if (from != null && to != null && from !== 0) {
        improvement = Math.round(((to - from) / from) * 100);
      }
    }
    return { evaluations: prevRows.length, avgScore, improvement };
  }, [prevRows]);

  const yDomain = historyData.length
    ? [Math.max(0, Math.min(...historyData.map((h) => h.score)) - 10), 100]
    : [0, 100];

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const nameRaw = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.email || 'user';
      const namePart = safeFilenamePart(nameRaw);
      const datePart = new Date().toISOString().slice(0, 10);
      await exportReportToPdf({
        elementId: 'student-reports-export',
        filename: `student-reports-${namePart}-${datePart}.pdf`,
      });
    } catch (err) {
      console.error('Export failed:', err);
      alert(t('studentReports.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <style>{reportsPageStyles}</style>
      <div className="rp-root">
        <StudentSidebar />
        <div className="rp-main">
          <TopNavbar />
          <div className="rp-content" id="student-reports-export">
            <div className="rp-hero">
              <div>
                <div className="rp-hero-kicker">📊 {t('studentReports.heroKicker')}</div>
                <h1 className="rp-hero-title">{t('studentReports.heroTitle')}</h1>
                <p className="rp-hero-sub">{t('studentReports.heroSubtitle')}</p>
              </div>
              <div className="rp-hero-icon"><FileText size={36} strokeWidth={1.5} /></div>
            </div>

            <div className="rp-toolbar">
              <span className="rp-section-tag">{t('studentReports.sectionTag')}</span>
              <button type="button" className="rp-export-btn" onClick={handleExport} disabled={exporting}>
                <Download size={15} /> {exporting ? t('studentReports.exporting') : t('studentReports.exportPdf')}
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

            {loading && <p className="rp-loading">{t('studentReports.loadingReports')}</p>}

            <div className="rp-compare">
              <div className="rp-compare-card">
                <div className="rp-compare-label">{t('studentReports.recentSessions')}</div>
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
                <div className="rp-compare-label">{t('common.averageScore')}</div>
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
                <div className="rp-compare-label">{t('studentReports.sinceFirst')}</div>
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

            <div className="rp-stats">
            <div style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '20px',
              padding: '1.5rem', position: 'relative', overflow: 'hidden', color: '#fff', textAlign: 'center',
            }}>
              <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <Award size={20} style={{ opacity: 0.7, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: '1' }}>{latestScore ?? '—'}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '0.25rem', fontWeight: '500' }}>{t('studentReports.latestScore')}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #E31837, #B71C1C)', borderRadius: '20px',
              padding: '1.5rem', position: 'relative', overflow: 'hidden', color: '#fff', textAlign: 'center',
            }}>
              <div style={{ position: 'absolute', bottom: '-10px', left: '15px', width: '55px', height: '55px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <Target size={20} style={{ opacity: 0.7, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: '1' }}>{cefrLabel}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '0.25rem', fontWeight: '500' }}>{t('studentReports.cefrLatest')}</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem', textAlign: 'center',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#3b82f6', letterSpacing: '-0.04em', lineHeight: '1' }}>
                {improvementPct != null ? `${improvementPct >= 0 ? '+' : ''}${improvementPct}%` : '—'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: '500' }}>{t('studentReports.sinceFirst')}</div>
            </div>
            </div>

          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div
              id="student-report-skills-chart"
              style={{
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
              }}
            >
              <div className="rp-panel-header">
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.35rem' }}>{t('studentReports.skillsOverview')}</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{t('studentReports.latestAiSession')}</p>
                </div>
                <div className="rp-panel-actions">
                  <button
                    type="button"
                    className="rp-chart-download"
                    onClick={() => exportElementToPng({
                      elementId: 'student-report-skills-chart',
                      filename: 'student-skills-overview',
                    })}
                  >
                    <Download size={14} /> {t('common.downloadChart')}
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(0,0,0,0.06)" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Radar dataKey="A" stroke="#E31837" fill="#E31837" fillOpacity={0.15} strokeWidth={2}
                    dot={{ fill: '#E31837', stroke: '#fff', strokeWidth: 2, r: 4 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div
              id="student-report-score-chart"
              style={{
                background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
              }}
            >
              <div className="rp-panel-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>{t('studentReports.scoreHistory')}</h3>
                    {improvementPct != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '600', color: '#22c55e' }}>
                        <ArrowUpRight size={14} /> {improvementPct >= 0 ? '+' : ''}{improvementPct}%
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>{t('studentReports.sessionsOverTime')}</p>
                </div>
                <div className="rp-panel-actions">
                  <button
                    type="button"
                    className="rp-chart-download"
                    onClick={() => exportElementToPng({
                      elementId: 'student-report-score-chart',
                      filename: 'student-score-history',
                    })}
                  >
                    <Download size={14} /> {t('common.downloadChart')}
                  </button>
                </div>
              </div>
              {historyData.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '3rem 0', textAlign: 'center' }}>{t('studentReports.noScoresYet')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={historyData}>
                    <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="date" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} domain={yDomain} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="score" stroke="#E31837" strokeWidth={2.5}
                      dot={{ fill: '#fff', stroke: '#E31837', strokeWidth: 2, r: 4 }}
                      activeDot={{ fill: '#E31837', stroke: '#fff', strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: '#94a3b8' }}>
                  <div style={{ width: '16px', height: '2px', background: '#E31837', borderRadius: '1px' }} />
                  {t('studentReports.sessionScore')}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} style={{ color: '#E31837' }} />
              {t('studentReports.recentSessions')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentEvaluations.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{t('studentReports.noGradedSessions')}</p>
              ) : (
                recentEvaluations.map((ev) => (
                  <div
                    key={ev.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem', borderRadius: '12px',
                      background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: `${ev.color}22`, color: ev.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.65rem', fontWeight: '700',
                      }}>{ev.level.slice(0, 3)}</div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1a1a2e' }}>{ev.title}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{ev.date}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1a1a2e' }}>{ev.score}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{ev.level}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {hasMore && (
              <div ref={loadMoreRef} style={{ height: '1px' }} />
            )}
            {loadingMore && (
              <p className="rp-loading">{t('studentReports.loadingMore')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Reports;
