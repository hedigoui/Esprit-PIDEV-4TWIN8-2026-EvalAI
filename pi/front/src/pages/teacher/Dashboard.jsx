import TeacherSidebar from '../../components/TeacherSidebar';
import TopNavbar from '../../components/TopNavbar';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ClipboardCheck, Clock, TrendingUp, Calendar, Mic,
  ArrowUpRight, ListTodo,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell,
  Tooltip, CartesianGrid,
} from 'recharts';
import styles from '../../styles/shared.module.css';
import { oralPerformanceService } from '../services/oralPerformance.service';
import { useI18n } from '../../i18n/I18nProvider';

const dashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

  .dash-root * { font-family: 'Manrope', sans-serif; box-sizing: border-box; }

  .dash-root {
    display: flex;
    min-height: 100vh;
    background: var(--bg-main);
  }

  .dash-main {
    flex: 1;
    overflow-y: auto;
    min-width: 0;
  }

  .dash-content {
    max-width: 1280px;
    padding: 2rem 2.5rem;
    margin: 0 auto;
  }

  /* Hero */
  .hero-card {
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

  .hero-card::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(227,24,55,0.2) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-card::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: 40%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-kicker {
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

  .hero-title {
    font-size: 2rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.04em;
    margin: 0 0 0.5rem;
    line-height: 1.2;
  }

  .hero-subtitle {
    color: rgba(255,255,255,0.55);
    font-size: 0.9rem;
    line-height: 1.6;
    max-width: 380px;
    margin: 0;
  }

  .hero-orb {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: rgba(227,24,55,0.15);
    border: 1px solid rgba(227,24,55,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.7);
    flex-shrink: 0;
    position: relative;
  }

  .hero-orb::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1px solid rgba(227,24,55,0.1);
  }

  /* Controls row */
  .controls-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .section-tag {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tag-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: #E31837;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .live-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse-green 2s infinite;
  }

  @keyframes pulse-green {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.8); }
  }

  .live-label {
    font-size: 0.72rem;
    color: #94a3b8;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.25rem;
    background: linear-gradient(135deg, #E31837, #B71C1C);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    font-family: 'Manrope', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(227,24,55,0.25);
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(227,24,55,0.35);
  }

  /* Stats grid */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }

  .stat-card {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid var(--border-light);
    transition: all 0.2s;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  }

  .stat-card-dark {
    background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%);
    border-color: transparent;
  }

  .stat-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.03em;
    line-height: 1;
    margin-bottom: 0.35rem;
  }

  .stat-value-light { color: #fff; }

  .stat-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
  }

  .stat-label-light { color: rgba(255,255,255,0.45); }

  .stat-badge-green {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.65rem;
    font-weight: 700;
    color: #22c55e;
    background: rgba(34,197,94,0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 8px;
    float: right;
  }

  .stat-badge-orange {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    font-size: 0.65rem;
    font-weight: 700;
    color: #f97316;
    background: rgba(249,115,22,0.1);
    padding: 0.2rem 0.5rem;
    border-radius: 8px;
    float: right;
  }

  /* Charts grid */
  .charts-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } }

  .panel {
    background: var(--bg-card);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid var(--border-light);
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }

  .panel-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.25rem;
  }

  .panel-hint {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin: 0 0 1rem;
  }

  /* Bottom grid */
  .bottom-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 768px) { .bottom-grid { grid-template-columns: 1fr; } }

  /* Row items */
  .row-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s;
    gap: 0.5rem;
  }

  .row-item:hover {
    background: rgba(0,0,0,0.025);
  }

  .row-avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, #E31837, #B71C1C);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 800;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  .row-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .row-sub {
    font-size: 0.72rem;
    color: var(--text-muted);
    margin-top: 1px;
  }

  .badge-eval {
    padding: 0.25rem 0.65rem;
    border-radius: 20px;
    font-size: 0.68rem;
    font-weight: 700;
  }

  .badge-pending {
    background: rgba(249,115,22,0.1);
    color: #f97316;
  }

  .badge-done {
    background: rgba(34,197,94,0.1);
    color: #22c55e;
  }

  .queue-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0.75rem 0.75rem 1rem;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s;
    border-left: 3px solid #E31837;
    gap: 0.5rem;
  }

  .queue-item:hover { background: rgba(227,24,55,0.03); }

  .loading-line {
    color: #94a3b8;
    font-size: 0.875rem;
    padding: 1rem 0;
    text-align: center;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .view-all-btn {
    font-size: 0.8rem;
    font-weight: 600;
    color: #E31837;
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Manrope', sans-serif;
    padding: 0;
    text-decoration: none;
  }

  .view-all-btn:hover { text-decoration: underline; }
`;

const defaultLevelDistribution = (t) => [
  { name: t('proficiency.beginner'), value: 0, color: '#ef4444' },
  { name: t('proficiency.intermediate'), value: 0, color: '#f97316' },
  { name: t('proficiency.advanced'), value: 0, color: '#22c55e' },
  { name: t('proficiency.proficient'), value: 0, color: '#8b5cf6' },
];

function normalizeDisplayScore(raw) {
  if (raw == null || Number.isNaN(Number(raw))) return null;
  const n = Number(raw);
  if (n <= 10) return Math.round(n * 10);
  return Math.round(Math.min(100, n));
}

function buildLast7DaysSessions(performances, locale) {
  const buckets = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 86400000;
    const count = performances.filter((p) => {
      const t = new Date(p.createdAt).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    buckets.push({ name: d.toLocaleDateString(locale, { weekday: 'short' }), sessions: count });
  }
  return buckets;
}

function sessionsInCurrentMonth(performances) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  return performances.filter((p) => {
    const d = new Date(p.createdAt);
    return d.getFullYear() === y && d.getMonth() === m;
  }).length;
}

const CustomTooltip = ({ active, payload, label, t }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15,15,26,0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '0.6rem 0.85rem',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginBottom: '0.2rem' }}>{label}</p>
        <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '700' }}>{payload[0].value} {t('teacherDashboard.sessionsLabel')}</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const [stats, setStats] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [levelDistribution, setLevelDistribution] = useState(() => defaultLevelDistribution(t));
  const [performances, setPerformances] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreTrend, setScoreTrend] = useState(null);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  useEffect(() => { loadDashboardData(); }, [currentUser?.id, language]);

  const loadDashboardData = async () => {
    try {
      const instructorId = currentUser?.id;
      if (!instructorId) { setLoading(false); return; }

      const [statsData, perfData, studentsResponse] = await Promise.all([
        oralPerformanceService.getStatistics(instructorId),
        oralPerformanceService.getInstructorPerformances(instructorId),
        fetch(`${API_BASE_URL}/users/students`).then((res) => (res.ok ? res.json() : { data: [] })),
      ]);

      const list = perfData || [];
      setPerformances(list);
      setStats(statsData || null);
      setStudentCount((studentsResponse?.data || []).length);

      const sorted = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const recent = sorted.slice(0, 5);
      const studentsById = Object.fromEntries((studentsResponse?.data || []).map((s) => [s._id?.toString?.(), s]));

      const mapped = recent.map((item) => {
        const student = studentsById[item.studentId];
        const name = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email : item.studentId;
        const sc = normalizeDisplayScore(item.totalScore);
        return {
          id: item._id, studentId: item.studentId,
          name: name || t('teacherDashboard.studentFallback'),
          level: item.overallProficiency ? t(`proficiency.${item.overallProficiency}`) : '—',
          lastSession: item.createdAt ? new Date(item.createdAt).toLocaleDateString(locale) : '—',
          status: item.status === 'graded' ? 'evaluated' : 'pending',
          score: sc != null ? sc : '—',
        };
      });
      setRecentSubmissions(mapped);

      const distribution = statsData?.proficiencyDistribution || {};
      const total = Object.values(distribution).reduce((sum, value) => sum + Number(value || 0), 0);
      const percentage = (value) => (total > 0 ? Math.round((Number(value || 0) / total) * 100) : 0);

      setLevelDistribution([
        { name: t('proficiency.beginner'), value: percentage(distribution.beginner), color: '#ef4444' },
        { name: t('proficiency.intermediate'), value: percentage(distribution.intermediate), color: '#f97316' },
        { name: t('proficiency.advanced'), value: percentage(distribution.advanced), color: '#22c55e' },
        { name: t('proficiency.proficient'), value: percentage(distribution.proficient), color: '#8b5cf6' },
      ]);

      const graded = [...list].filter((p) => p.status === 'graded' && p.totalScore != null)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      if (graded.length >= 2) {
        const first = normalizeDisplayScore(graded[0].totalScore);
        const last = normalizeDisplayScore(graded[graded.length - 1].totalScore);
        if (first != null && last != null && first > 0) setScoreTrend(Math.round(((last - first) / first) * 100));
        else setScoreTrend(null);
      } else setScoreTrend(null);

      const queue = list.filter((p) => p.status === 'pending' || p.status === 'in_progress')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4)
        .map((p) => {
          const student = studentsById[p.studentId];
          const name = student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email : p.studentId;
          return {
            id: p._id, studentId: p.studentId,
            title: (p.title || t('teacherDashboard.sessionFallback')).slice(0, 36),
            student: name || t('teacherDashboard.studentFallback'),
            when: p.createdAt ? new Date(p.createdAt).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '—',
          };
        });
      setPendingQueue(queue);
    } catch (error) {
      console.error('Failed to load teacher dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const weeklyData = useMemo(() => buildLast7DaysSessions(performances, locale), [performances, locale]);
  const monthSessions = useMemo(() => sessionsInCurrentMonth(performances), [performances]);
  const avgNorm = normalizeDisplayScore(stats?.averageScore) ?? stats?.averageScore;

  return (
    <>
      <style>{dashStyles}</style>
      <div className="dash-root">
        <TeacherSidebar />
        <div className="dash-main">
          <TopNavbar />
          <div className="dash-content">

            {/* Hero */}
            <div className="hero-card">
              <div>
                <div className="hero-kicker">
                  <span>⚡</span> {t('teacherDashboard.heroKicker')}
                </div>
                <h1 className="hero-title">{t('teacherDashboard.heroTitle')}</h1>
                <p className="hero-subtitle">
                  {t('teacherDashboard.heroSubtitle')}
                </p>
              </div>
              <div className="hero-orb">
                <ClipboardCheck size={36} strokeWidth={1.5} />
              </div>
            </div>

            {/* Controls */}
            <div className="controls-row">
              <div className="section-tag">
                <span className="tag-label">{t('teacherDashboard.overviewTag')}</span>
                <div className="live-dot" />
                <span className="live-label">{t('teacherDashboard.liveData')}</span>
              </div>
              <button type="button" className="btn-primary" onClick={() => navigate('/teacher/students')}>
                <Mic size={15} /> {t('teacherDashboard.viewStudents')}
              </button>
            </div>

            {loading && <p className="loading-line">{t('teacherDashboard.loading')}</p>}

            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card stat-card-dark">
                <div className="stat-icon-wrap" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Users size={18} color="rgba(255,255,255,0.6)" />
                </div>
                <div className="stat-value stat-value-light">{studentCount}</div>
                <div className="stat-label stat-label-light">{t('teacherDashboard.totalStudents')}</div>
              </div>

              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div className="stat-icon-wrap" style={{ background: 'rgba(249,115,22,0.1)', margin: 0 }}>
                    <ClipboardCheck size={18} color="#f97316" />
                  </div>
                  {stats?.pendingPerformances > 0 && (
                    <span className="stat-badge-orange">{t('teacherDashboard.actionNeeded')}</span>
                  )}
                </div>
                <div className="stat-value">{stats?.pendingPerformances ?? 0}</div>
                <div className="stat-label">{t('teacherDashboard.pendingReviews')}</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.1)', marginBottom: '0.75rem' }}>
                  <Clock size={18} color="#3b82f6" />
                </div>
                <div className="stat-value">{monthSessions}</div>
                <div className="stat-label">{t('teacherDashboard.sessionsThisMonth')}</div>
              </div>

              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div className="stat-icon-wrap" style={{ background: 'rgba(34,197,94,0.1)', margin: 0 }}>
                    <TrendingUp size={18} color="#22c55e" />
                  </div>
                  {scoreTrend != null && (
                    <span className="stat-badge-green">
                      <ArrowUpRight size={11} /> {scoreTrend >= 0 ? '+' : ''}{scoreTrend}%
                    </span>
                  )}
                </div>
                <div className="stat-value">{avgNorm != null ? `${avgNorm}` : '—'}</div>
                <div className="stat-label">{t('teacherDashboard.avgScoreGraded')}</div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <h3 className="panel-title">{t('teacherDashboard.sessionsLast7Days')}</h3>
                  <span style={{ padding: '0.25rem 0.6rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '600', color: '#64748b', border: '1px solid rgba(0,0,0,0.06)' }}>{t('teacherDashboard.rollingWeek')}</span>
                </div>
                <p className="panel-hint">{t('teacherDashboard.newPerDay')}</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData} barCategoryGap="35%">
                    <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip t={t} />} cursor={{ fill: 'rgba(227,24,55,0.04)', radius: 8 }} />
                    <defs>
                      <linearGradient id="barGradInstructor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E31837" />
                        <stop offset="100%" stopColor="#B71C1C" />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="sessions" fill="url(#barGradInstructor)" radius={[8, 8, 3, 3]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="panel-title">{t('teacherDashboard.proficiencyMix')}</h3>
                <p className="panel-hint">{t('teacherDashboard.amongGraded')}</p>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={levelDistribution} cx="50%" cy="50%" innerRadius={44} outerRadius={64} dataKey="value" strokeWidth={0}>
                        {levelDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', justifyContent: 'center', marginTop: '0.75rem' }}>
                    {levelDistribution.map((item) => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div className="legend-dot" style={{ background: item.color }} />
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>
                          {item.name} ({item.value}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom grid */}
            <div className="bottom-grid">
              <div className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="panel-title" style={{ margin: 0 }}>{t('teacherDashboard.recentActivity')}</h3>
                  <button type="button" className="view-all-btn" onClick={() => navigate('/teacher/evaluations')}>
                    {t('teacherDashboard.viewAll')} →
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {recentSubmissions.length === 0 && !loading && (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>{t('teacherDashboard.noSessions')}</p>
                  )}
                  {recentSubmissions.map((student) => (
                    <div
                      key={student.id}
                      role="button"
                      tabIndex={0}
                      className="row-item"
                      onClick={() => navigate(`/teacher/evaluate/${student.studentId}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/teacher/evaluate/${student.studentId}`)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="row-avatar">{String(student.name).charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="row-name">{student.name}</div>
                          <div className="row-sub">{student.level} · {student.lastSession}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1a1a2e' }}>{student.score}</span>
                        <span className={`badge-eval ${student.status === 'pending' ? 'badge-pending' : 'badge-done'}`}>
                          {student.status === 'pending'
                            ? t('teacherDashboard.statusPending')
                            : t('teacherDashboard.statusEvaluated')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="panel-title" style={{ margin: 0 }}>{t('teacherDashboard.needsGrading')}</h3>
                  <ListTodo size={16} style={{ color: '#94a3b8' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {pendingQueue.length === 0 && !loading && (
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, textAlign: 'center', padding: '1rem' }}>
                      {t('teacherDashboard.nothingWaiting')}
                    </p>
                  )}
                  {pendingQueue.map((item) => (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="queue-item"
                      onClick={() => navigate(`/teacher/evaluate/${item.studentId}`)}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/teacher/evaluate/${item.studentId}`)}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div className="row-name">{item.student}</div>
                        <div className="row-sub" style={{ marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#64748b', flexShrink: 0 }}>
                        <Calendar size={13} />
                        {item.when}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;