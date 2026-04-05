import TeacherSidebar from '../../components/TeacherSidebar';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Download, ClipboardCheck, TrendingUp, Award, BookOpen, ArrowUpRight, Users, Medal } from 'lucide-react';
import styles from '../../styles/shared.module.css';
import teacherStyles from './Teacher.module.css';
import { oralPerformanceService } from '../services/oralPerformance.service';

function normalizeDisplayScore(raw) {
  if (raw == null || Number.isNaN(Number(raw))) return null;
  const n = Number(raw);
  if (n <= 10) return Math.round(n * 10);
  return Math.round(Math.min(100, n));
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

function buildMonthlySeries(performances, monthsBack = 6) {
  const rows = [];
  const now = new Date();
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const label = d.toLocaleDateString(undefined, { month: 'short' });
    const inMonth = performances.filter((p) => {
      const t = new Date(p.createdAt);
      return t.getFullYear() === y && t.getMonth() === m;
    });
    const graded = inMonth.filter((p) => p.status === 'graded' && p.totalScore != null);
    const scores = graded.map((p) => normalizeDisplayScore(p.totalScore)).filter((s) => s != null);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    rows.push({
      month: label,
      evaluations: inMonth.length,
      avgScore: avgScore ?? 0,
    });
  }
  return rows;
}

function topImproving(performances, studentsById) {
  const byStudent = {};
  performances
    .filter((p) => p.status === 'graded' && p.totalScore != null)
    .forEach((p) => {
      const id = p.studentId;
      if (!byStudent[id]) byStudent[id] = [];
      const sc = normalizeDisplayScore(p.totalScore);
      if (sc == null) return;
      byStudent[id].push({ date: p.createdAt, score: sc });
    });

  const ranked = Object.entries(byStudent)
    .map(([id, arr]) => {
      arr.sort((a, b) => new Date(a.date) - new Date(b.date));
      const from = arr[0].score;
      const to = arr[arr.length - 1].score;
      const st = studentsById[id];
      const name = st ? `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.email : 'Student';
      return {
        id,
        name,
        from,
        to,
        delta: to - from,
        sessions: arr.length,
      };
    })
    .filter((x) => x.sessions >= 2 && x.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  if (ranked.length > 0) return ranked;

  return Object.entries(byStudent)
    .map(([id, arr]) => {
      arr.sort((a, b) => new Date(b.date) - new Date(a.date));
      const to = arr[0]?.score ?? 0;
      const st = studentsById[id];
      const name = st ? `${st.firstName || ''} ${st.lastName || ''}`.trim() || st.email : 'Student';
      return { id, name, from: to, to, delta: 0, sessions: arr.length };
    })
    .sort((a, b) => b.to - a.to)
    .slice(0, 5);
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'rgba(15,15,26,0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
          padding: '0.6rem 0.85rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
        }}
      >
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginBottom: '0.2rem' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#fff', fontSize: '0.82rem', fontWeight: '700' }}>
            {p.name === 'evaluations' ? `${p.value} sessions` : `Avg: ${p.value}/100`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topList, setTopList] = useState([]);
  const [avgDelta, setAvgDelta] = useState(null);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const instructorId = currentUser?.id;
        if (!instructorId) {
          setLoading(false);
          return;
        }
        const [statsData, perfData, studentsResponse] = await Promise.all([
          oralPerformanceService.getStatistics(instructorId),
          oralPerformanceService.getInstructorPerformances(instructorId),
          fetch('http://localhost:3000/users/students').then((r) => (r.ok ? r.json() : { data: [] })),
        ]);
        if (cancelled) return;
        const list = perfData || [];
        setPerformances(list);
        setStats(statsData || null);
        const students = studentsResponse?.data || [];
        setStudentCount(students.length);
        const studentsById = Object.fromEntries(students.map((s) => [s._id?.toString?.(), s]));

        setMonthlyData(buildMonthlySeries(list, 6));
        setTopList(topImproving(list, studentsById));

        const series = buildMonthlySeries(list, 6).filter((x) => x.avgScore > 0);
        if (series.length >= 2) {
          const a = series[0].avgScore;
          const b = series[series.length - 1].avgScore;
          setAvgDelta(a > 0 ? Math.round(((b - a) / a) * 100) : null);
        } else setAvgDelta(null);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const avgScoreDisplay = normalizeDisplayScore(stats?.averageScore) ?? stats?.averageScore ?? '—';
  const totalEvaluations = stats?.completedPerformances ?? performances.filter((p) => p.status === 'graded').length;
  const monthEvals = useMemo(() => {
    const now = new Date();
    return performances.filter((p) => {
      const t = new Date(p.createdAt);
      return t.getFullYear() === now.getFullYear() && t.getMonth() === now.getMonth();
    }).length;
  }, [performances]);

  const cefrApprox = useMemo(() => {
    const dist = stats?.proficiencyDistribution || {};
    const entries = Object.entries(dist).sort((a, b) => b[1] - a[1]);
    if (!entries.length || entries[0][1] === 0) return '—';
    return profToShort(entries[0][0]);
  }, [stats]);

  const improvementHeadline = useMemo(() => {
    const graded = performances.filter((p) => p.status === 'graded' && p.totalScore != null);
    if (graded.length < 2) return '—';
    const sorted = [...graded].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const from = normalizeDisplayScore(sorted[0].totalScore);
    const to = normalizeDisplayScore(sorted[sorted.length - 1].totalScore);
    if (from == null || to == null || from === 0) return '—';
    return `+${Math.round(((to - from) / from) * 100)}%`;
  }, [performances]);

  const lineDomain = useMemo(() => {
    const vals = monthlyData.map((m) => m.avgScore).filter((v) => v > 0);
    if (!vals.length) return [0, 100];
    const lo = Math.max(0, Math.min(...vals) - 10);
    const hi = Math.min(100, Math.max(...vals) + 5);
    return [lo, hi];
  }, [monthlyData]);

  return (
    <div className={styles.layout}>
      <TeacherSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={teacherStyles.hero}>
            <div className={teacherStyles.heroText}>
              <span className={teacherStyles.heroKicker}>Reports</span>
              <h1 className={teacherStyles.heroTitle}>Evaluation insights</h1>
              <p className={teacherStyles.heroSubtitle}>
                Monthly volume, score trends, and learners with the strongest progress—based on your live data.
              </p>
            </div>
            <div className={teacherStyles.heroVisual} aria-hidden>
              <div className={teacherStyles.heroOrb} />
              <div className={teacherStyles.heroIconWrap}>
                <TrendingUp size={34} strokeWidth={1.75} />
              </div>
            </div>
          </div>

          <div className={teacherStyles.headerRow}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    color: '#E31837',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Analytics
                </span>
              </div>
            </div>
            <button type="button" className={teacherStyles.btnGhost}>
              <Download size={16} /> Export
            </button>
          </div>

          {loading && <p className={teacherStyles.loadingLine}>Loading reports…</p>}

          <div className={teacherStyles.bento4}>
            <div className={teacherStyles.statDark}>
              <div className={teacherStyles.statDarkAccent} />
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.8rem',
                }}
              >
                <ClipboardCheck size={16} />
              </div>
              <div className={teacherStyles.statValueLight}>{totalEvaluations}</div>
              <div className={teacherStyles.statLabelLight}>Graded sessions</div>
            </div>

            <div className={teacherStyles.statGlass}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div
                  className={teacherStyles.iconBox}
                  style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}
                >
                  <TrendingUp size={16} />
                </div>
                {avgDelta != null && (
                  <span
                    style={{
                      fontSize: '0.62rem',
                      fontWeight: '700',
                      color: '#22c55e',
                      background: 'rgba(34,197,94,0.08)',
                      padding: '0.15rem 0.45rem',
                      borderRadius: '6px',
                    }}
                  >
                    {avgDelta >= 0 ? '+' : ''}
                    {avgDelta}%
                  </span>
                )}
              </div>
              <div className={teacherStyles.statValue} style={{ marginTop: '0.6rem' }}>
                {avgScoreDisplay}
              </div>
              <div className={teacherStyles.statLabel}>Average score</div>
            </div>

            <div className={teacherStyles.statGlass}>
              <div
                className={teacherStyles.iconBox}
                style={{ background: 'rgba(227,24,55,0.08)', color: '#E31837', marginBottom: '0.6rem' }}
              >
                <Award size={16} />
              </div>
              <div className={teacherStyles.statValue}>{cefrApprox}</div>
              <div className={teacherStyles.statLabel}>Typical band</div>
            </div>

            <div className={teacherStyles.statGlass}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div
                  className={teacherStyles.iconBox}
                  style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e' }}
                >
                  <BookOpen size={16} />
                </div>
              </div>
              <div className={teacherStyles.statValue} style={{ marginTop: '0.6rem' }}>
                {improvementHeadline}
              </div>
              <div className={teacherStyles.statLabel}>Overall progress (first → last)</div>
            </div>
          </div>

          <div className={teacherStyles.reportsGrid2}>
            <div className={teacherStyles.panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h3 className={teacherStyles.panelTitle}>Sessions per month</h3>
                  <p className={teacherStyles.panelHint}>All performances (last 6 months)</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} barSize={28}>
                  <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <defs>
                    <linearGradient id="barGradReports" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E31837" />
                      <stop offset="100%" stopColor="#E31837" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="evaluations" fill="url(#barGradReports)" radius={[6, 6, 0, 0]} name="evaluations" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={teacherStyles.panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h3 className={teacherStyles.panelTitle}>Average score trend</h3>
                  <p className={teacherStyles.panelHint}>Graded sessions only</p>
                </div>
                {avgDelta != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '600', color: '#22c55e' }}>
                    <ArrowUpRight size={14} /> {avgDelta >= 0 ? '+' : ''}
                    {avgDelta}%
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData}>
                  <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} domain={lineDomain} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    name="avgScore"
                    dot={{ fill: '#fff', stroke: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: '#3b82f6', stroke: '#fff', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={teacherStyles.panel} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Medal size={16} style={{ color: '#f59e0b' }} />
                <h3 className={teacherStyles.panelTitle} style={{ margin: 0 }}>
                  Top learners
                </h3>
              </div>
              <button type="button" className={teacherStyles.linkAccent} onClick={() => navigate('/teacher/students')}>
                View roster →
              </button>
            </div>
            {topList.length === 0 && !loading && (
              <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>Not enough graded history to rank improvement yet.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topList.map((s, idx) => (
                <div
                  key={s.id}
                  role="button"
                  tabIndex={0}
                  className={teacherStyles.rowMuted}
                  onClick={() => navigate(`/teacher/evaluate/${s.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/teacher/evaluate/${s.id}`)}
                  style={{
                    borderLeft: idx < 3 ? '3px solid #f59e0b' : '3px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span style={{ fontSize: '1rem', width: '28px', textAlign: 'center', fontWeight: 800, color: '#94a3b8' }}>
                      {idx + 1}
                    </span>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background:
                          idx < 3 ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05))' : 'rgba(0,0,0,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        color: idx < 3 ? '#f59e0b' : '#64748b',
                      }}
                    >
                      {s.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a1a2e' }}>{s.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Score {s.from} → {s.to}
                        {s.sessions > 1 ? ` · ${s.sessions} graded` : ''}
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#22c55e' }}>
                    {s.delta > 0 ? `+${s.delta}` : s.to}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={teacherStyles.footerBar}>
            <div className={teacherStyles.footerItem}>
              <Users size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span className={teacherStyles.footerLabel}>Students</span>
              <span className={teacherStyles.footerValue}>{studentCount}</span>
            </div>
            <div className={teacherStyles.footerItem}>
              <ClipboardCheck size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span className={teacherStyles.footerLabel}>This month</span>
              <span className={teacherStyles.footerValue}>{monthEvals} sessions</span>
            </div>
            <div className={teacherStyles.footerItem}>
              <TrendingUp size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span className={teacherStyles.footerLabel}>Avg score</span>
              <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.85rem' }}>
                {typeof avgScoreDisplay === 'number' ? `${avgScoreDisplay}/100` : avgScoreDisplay}
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
