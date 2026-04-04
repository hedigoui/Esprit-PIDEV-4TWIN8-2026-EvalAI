import TeacherSidebar from '../../components/TeacherSidebar';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardCheck,
  Clock,
  TrendingUp,
  Calendar,
  Mic,
  ArrowUpRight,
  ListTodo,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, CartesianGrid } from 'recharts';
import styles from '../../styles/shared.module.css';
import teacherStyles from './Teacher.module.css';
import { oralPerformanceService } from '../services/oralPerformance.service';

const defaultLevelDistribution = [
  { name: 'Beginner', value: 0, color: '#ef4444' },
  { name: 'Intermediate', value: 0, color: '#f97316' },
  { name: 'Advanced', value: 0, color: '#22c55e' },
  { name: 'Proficient', value: 0, color: '#8b5cf6' },
];

function normalizeDisplayScore(raw) {
  if (raw == null || Number.isNaN(Number(raw))) return null;
  const n = Number(raw);
  if (n <= 10) return Math.round(n * 10);
  return Math.round(Math.min(100, n));
}

function buildLast7DaysSessions(performances) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
    buckets.push({ name: dayNames[d.getDay()], sessions: count });
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
        <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '700' }}>{payload[0].value} sessions</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [levelDistribution, setLevelDistribution] = useState(defaultLevelDistribution);
  const [performances, setPerformances] = useState([]);
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreTrend, setScoreTrend] = useState(null);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser?.id]);

  const loadDashboardData = async () => {
    try {
      const instructorId = currentUser?.id;
      if (!instructorId) {
        setLoading(false);
        return;
      }

      const [statsData, perfData, studentsResponse] = await Promise.all([
        oralPerformanceService.getStatistics(instructorId),
        oralPerformanceService.getInstructorPerformances(instructorId),
        fetch('http://localhost:3000/users/students').then((res) => (res.ok ? res.json() : { data: [] })),
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
        const name = student
          ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email
          : item.studentId;
        const sc = normalizeDisplayScore(item.totalScore);
        return {
          id: item._id,
          studentId: item.studentId,
          name: name || 'Student',
          level: item.overallProficiency || '—',
          lastSession: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—',
          status: item.status === 'graded' ? 'Evaluated' : 'Pending Review',
          score: sc != null ? sc : '—',
        };
      });
      setRecentSubmissions(mapped);

      const distribution = statsData?.proficiencyDistribution || {};
      const total = Object.values(distribution).reduce((sum, value) => sum + Number(value || 0), 0);
      const percentage = (value) => (total > 0 ? Math.round((Number(value || 0) / total) * 100) : 0);

      setLevelDistribution([
        { name: 'Beginner', value: percentage(distribution.beginner), color: '#ef4444' },
        { name: 'Intermediate', value: percentage(distribution.intermediate), color: '#f97316' },
        { name: 'Advanced', value: percentage(distribution.advanced), color: '#22c55e' },
        { name: 'Proficient', value: percentage(distribution.proficient), color: '#8b5cf6' },
      ]);

      const graded = [...list]
        .filter((p) => p.status === 'graded' && p.totalScore != null)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      if (graded.length >= 2) {
        const first = normalizeDisplayScore(graded[0].totalScore);
        const last = normalizeDisplayScore(graded[graded.length - 1].totalScore);
        if (first != null && last != null && first > 0) {
          setScoreTrend(Math.round(((last - first) / first) * 100));
        } else setScoreTrend(null);
      } else setScoreTrend(null);

      const queue = list
        .filter((p) => p.status === 'pending' || p.status === 'in_progress')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 4)
        .map((p) => {
          const student = studentsById[p.studentId];
          const name = student
            ? `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email
            : p.studentId;
          return {
            id: p._id,
            studentId: p.studentId,
            title: (p.title || 'Session').slice(0, 36),
            student: name || 'Student',
            when: p.createdAt ? new Date(p.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—',
          };
        });
      setPendingQueue(queue);
    } catch (error) {
      console.error('Failed to load teacher dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const weeklyData = useMemo(() => buildLast7DaysSessions(performances), [performances]);
  const monthSessions = useMemo(() => sessionsInCurrentMonth(performances), [performances]);
  const avgNorm = normalizeDisplayScore(stats?.averageScore) ?? stats?.averageScore;

  return (
    <div className={styles.layout}>
      <TeacherSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={teacherStyles.hero}>
            <div className={teacherStyles.heroText}>
              <span className={teacherStyles.heroKicker}>Instructor</span>
              <h1 className={teacherStyles.heroTitle}>Your teaching hub</h1>
              <p className={teacherStyles.heroSubtitle}>
                Track sessions, proficiency spread, and students who need feedback—everything in one place.
              </p>
            </div>
            <div className={teacherStyles.heroVisual} aria-hidden>
              <div className={teacherStyles.heroOrb} />
              <div className={teacherStyles.heroIconWrap}>
                <ClipboardCheck size={36} strokeWidth={1.75} />
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
                  Overview
                </span>
                <span
                  style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'inline-block',
                  }}
                />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Live data</span>
              </div>
            </div>
            <button type="button" className={teacherStyles.btnPrimary} onClick={() => navigate('/teacher/students')}>
              <Mic size={16} /> View students
            </button>
          </div>

          {loading && <p className={teacherStyles.loadingLine}>Loading dashboard…</p>}

          <div className={teacherStyles.bento4}>
            <div className={teacherStyles.statDark}>
              <div className={teacherStyles.statDarkAccent} />
              <Users size={20} style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
              <div className={teacherStyles.statValueLight}>{studentCount}</div>
              <div className={teacherStyles.statLabelLight}>Total students</div>
            </div>

            <div className={teacherStyles.statGlass}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div
                  className={teacherStyles.iconBox}
                  style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}
                >
                  <ClipboardCheck size={18} />
                </div>
                {stats?.pendingPerformances > 0 && (
                  <div
                    style={{
                      padding: '0.15rem 0.5rem',
                      background: 'rgba(249,115,22,0.08)',
                      borderRadius: '6px',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      color: '#f97316',
                    }}
                  >
                    Action
                  </div>
                )}
              </div>
              <div className={teacherStyles.statValue}>{stats?.pendingPerformances ?? 0}</div>
              <div className={teacherStyles.statLabel}>Pending reviews</div>
            </div>

            <div className={teacherStyles.statGlass}>
              <div
                className={teacherStyles.iconBox}
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', marginBottom: '0.75rem' }}
              >
                <Clock size={18} />
              </div>
              <div className={teacherStyles.statValue}>{monthSessions}</div>
              <div className={teacherStyles.statLabel}>Sessions this month</div>
            </div>

            <div className={teacherStyles.statGlass}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div
                  className={teacherStyles.iconBox}
                  style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
                >
                  <TrendingUp size={18} />
                </div>
                {scoreTrend != null && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.2rem',
                      fontSize: '0.68rem',
                      fontWeight: '700',
                      color: scoreTrend >= 0 ? '#22c55e' : '#ef4444',
                      background: scoreTrend >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                    }}
                  >
                    <ArrowUpRight size={12} /> {scoreTrend >= 0 ? '+' : ''}
                    {scoreTrend}%
                  </div>
                )}
              </div>
              <div className={teacherStyles.statValue}>{avgNorm != null ? `${avgNorm}` : '—'}</div>
              <div className={teacherStyles.statLabel}>Avg. score (graded)</div>
            </div>
          </div>

          <div className={teacherStyles.gridCharts}>
            <div className={teacherStyles.panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 className={teacherStyles.panelTitle}>Sessions (last 7 days)</h3>
                  <p className={teacherStyles.panelHint}>New performances per day</p>
                </div>
                <div
                  style={{
                    padding: '0.3rem 0.75rem',
                    background: 'rgba(0,0,0,0.03)',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    color: '#64748b',
                  }}
                >
                  Rolling week
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barCategoryGap="30%">
                  <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(227,24,55,0.04)', radius: 8 }} />
                  <defs>
                    <linearGradient id="barGradInstructor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E31837" />
                      <stop offset="100%" stopColor="#B71C1C" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="sessions" fill="url(#barGradInstructor)" radius={[10, 10, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className={teacherStyles.panel} style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 className={teacherStyles.panelTitle} style={{ marginBottom: '0.35rem' }}>
                Proficiency mix
              </h3>
              <p className={teacherStyles.panelHint} style={{ marginBottom: '0.75rem' }}>
                Among graded sessions
              </p>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={levelDistribution} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0}>
                      {levelDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                  {levelDistribution.map((item) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: item.color }} />
                      <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '500' }}>
                        {item.name} ({item.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={teacherStyles.gridBottom}>
            <div className={teacherStyles.panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className={teacherStyles.panelTitle} style={{ margin: 0 }}>
                  Recent activity
                </h3>
                <button type="button" className={teacherStyles.linkAccent} onClick={() => navigate('/teacher/students')}>
                  View all →
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentSubmissions.length === 0 && !loading && (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No sessions yet.</p>
                )}
                {recentSubmissions.map((student) => (
                  <div
                    key={student.id}
                    role="button"
                    tabIndex={0}
                    className={teacherStyles.rowMuted}
                    onClick={() => navigate(`/teacher/evaluate/${student.studentId}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/teacher/evaluate/${student.studentId}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #E31837, #B71C1C)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '700',
                          fontSize: '0.82rem',
                        }}
                      >
                        {String(student.name).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1a1a2e' }}>{student.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          {student.level} · {student.lastSession}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1a1a2e' }}>{student.score}</div>
                      </div>
                      <span
                        className={teacherStyles.badge}
                        style={{
                          background: student.status === 'Pending Review' ? 'rgba(249,115,22,0.08)' : 'rgba(34,197,94,0.08)',
                          color: student.status === 'Pending Review' ? '#f97316' : '#22c55e',
                        }}
                      >
                        {student.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={teacherStyles.panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className={teacherStyles.panelTitle} style={{ margin: 0 }}>
                  Needs grading
                </h3>
                <ListTodo size={16} style={{ color: '#94a3b8' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {pendingQueue.length === 0 && !loading && (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>Nothing waiting—nice work.</p>
                )}
                {pendingQueue.map((item) => (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    className={teacherStyles.rowMuted}
                    style={{ borderLeft: '3px solid #E31837', cursor: 'pointer' }}
                    onClick={() => navigate(`/teacher/evaluate/${item.studentId}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/teacher/evaluate/${item.studentId}`)}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1a1a2e' }}>{item.student}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '0.2rem' }}>{item.title}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#64748b' }}>
                      <Calendar size={14} />
                      {item.when}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
