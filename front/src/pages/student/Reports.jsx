import { useState, useEffect, useMemo } from 'react';
import StudentSidebar from '../../components/StudentSidebar';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Download, TrendingUp, Award, Target, ArrowUpRight, FileText } from 'lucide-react';
import styles from '../../styles/shared.module.css';
import { oralPerformanceService } from '../services/oralPerformance.service';

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

function scoreFromRow(row) {
  const o = row.evaluation?.overallScore;
  if (typeof o === 'number' && !Number.isNaN(o)) return normalizeDisplayScore(o);
  return normalizeDisplayScore(row.performance?.totalScore);
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);

  const studentId = useMemo(() => getStudentIdFromToken(), []);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [st, list] = await Promise.all([
          oralPerformanceService.getStatisticsForStudent(studentId),
          oralPerformanceService.getAllStudentEvaluations(studentId),
        ]);
        if (!cancelled) {
          setStats(st);
          setRows(Array.isArray(list) ? list : []);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setStats(null);
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  const historyData = useMemo(() => {
    const sorted = [...rows]
      .filter((r) => scoreFromRow(r) != null)
      .sort((a, b) => new Date(a.performance.createdAt) - new Date(b.performance.createdAt))
      .slice(-12)
      .map((r) => ({
        date: r.performance?.createdAt
          ? new Date(r.performance.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : '—',
        score: scoreFromRow(r),
      }));
    return sorted;
  }, [rows]);

  const radarData = useMemo(() => {
    const latest = [...rows]
      .filter((r) => r.evaluation?.speechMetrics)
      .sort((a, b) => new Date(b.performance.createdAt) - new Date(a.performance.createdAt))[0];
    const sm = latest?.evaluation?.speechMetrics;
    const cs = latest?.evaluation?.contentScores;
    if (!sm) {
      return [
        { subject: 'Fluency', A: 0 },
        { subject: 'Pronunciation', A: 0 },
        { subject: 'Speaking Pace', A: 0 },
        { subject: 'Confidence', A: 0 },
        { subject: 'Content', A: 0 },
      ];
    }
    const pace = Math.min(100, (sm.speakingPace || 0) * 1.2);
    return [
      { subject: 'Fluency', A: Math.round(sm.fluency ?? 0) },
      { subject: 'Pronunciation', A: Math.round(sm.pronunciation ?? 0) },
      { subject: 'Speaking Pace', A: Math.round(pace) },
      { subject: 'Confidence', A: Math.round(sm.confidence ?? 0) },
      { subject: 'Content', A: Math.round(cs?.contentStructure ?? 0) },
    ];
  }, [rows]);

  const latestScore = useMemo(() => {
    const vals = [...rows]
      .map(scoreFromRow)
      .filter((v) => v != null)
      .sort((a, b) => b - a);
    const fromRows = vals[0] ?? null;
    if (fromRows != null) return fromRows;
    if (stats?.averageScore != null && Number(stats.averageScore) > 0) {
      return normalizeDisplayScore(stats.averageScore);
    }
    return null;
  }, [rows, stats]);

  const cefrLabel = useMemo(() => {
    const graded = [...rows]
      .filter((r) => r.performance?.overallProficiency)
      .sort((a, b) => new Date(b.performance.createdAt) - new Date(a.performance.createdAt))[0];
    return profToShort(graded?.performance?.overallProficiency);
  }, [rows]);

  const improvementPct = useMemo(() => {
    if (historyData.length < 2) return null;
    const a = historyData[0].score;
    const b = historyData[historyData.length - 1].score;
    if (!a) return null;
    return Math.round(((b - a) / a) * 100);
  }, [historyData]);

  const recentEvaluations = useMemo(() => {
    const colors = ['#E31837', '#3b82f6', '#8b5cf6', '#22c55e', '#f97316'];
    return [...rows]
      .filter((r) => scoreFromRow(r) != null)
      .sort((a, b) => new Date(b.performance.createdAt) - new Date(a.performance.createdAt))
      .slice(0, 8)
      .map((r, i) => ({
        id: String(r.performance?.id ?? i),
        date: r.performance?.createdAt
          ? new Date(r.performance.createdAt).toLocaleDateString()
          : '—',
        title: (r.performance?.title || 'Session').slice(0, 40),
        score: scoreFromRow(r),
        level: profToShort(r.performance?.overallProficiency),
        color: colors[i % colors.length],
      }));
  }, [rows]);

  const yDomain = historyData.length
    ? [Math.max(0, Math.min(...historyData.map((h) => h.score)) - 10), 100]
    : [0, 100];

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#E31837', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reports</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
                My Performance Reports
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                View your evaluation history and progress
                {stats != null && (
                  <span style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.78rem' }}>
                    {stats.totalPerformances ?? 0} session{(stats.totalPerformances ?? 0) !== 1 ? 's' : ''} on record
                    {stats.completedPerformances != null ? ` · ${stats.completedPerformances} graded` : ''}
                  </span>
                )}
              </p>
            </div>
            <button type="button" style={{
              padding: '0.6rem 1.2rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '12px', color: '#64748b', fontWeight: '600', fontSize: '0.82rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit',
            }}>
              <Download size={16} /> Export Report
            </button>
          </div>

          {loading && (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Loading reports…</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '20px',
              padding: '1.5rem', position: 'relative', overflow: 'hidden', color: '#fff', textAlign: 'center',
            }}>
              <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <Award size={20} style={{ opacity: 0.7, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: '1' }}>{latestScore ?? '—'}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '0.25rem', fontWeight: '500' }}>Latest score</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #E31837, #B71C1C)', borderRadius: '20px',
              padding: '1.5rem', position: 'relative', overflow: 'hidden', color: '#fff', textAlign: 'center',
            }}>
              <div style={{ position: 'absolute', bottom: '-10px', left: '15px', width: '55px', height: '55px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <Target size={20} style={{ opacity: 0.7, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: '1' }}>{cefrLabel}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '0.25rem', fontWeight: '500' }}>CEFR (latest)</div>
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
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: '500' }}>Since first session</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.5rem' }}>Skills overview</h3>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Latest AI session (speech + content)</p>
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

            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>Score history</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>Sessions over time</p>
                </div>
                {improvementPct != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '600', color: '#22c55e' }}>
                    <ArrowUpRight size={14} /> {improvementPct >= 0 ? '+' : ''}{improvementPct}%
                  </div>
                )}
              </div>
              {historyData.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '3rem 0', textAlign: 'center' }}>No scores yet. Complete a practice session.</p>
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
                  Session score
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
              Recent sessions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentEvaluations.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No graded sessions yet.</p>
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
