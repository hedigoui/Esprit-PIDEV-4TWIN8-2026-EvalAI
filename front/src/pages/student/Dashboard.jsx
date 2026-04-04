import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentSidebar from '../../components/StudentSidebar';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Award, Clock, Target, ChevronLeft, ChevronRight, Flame, Zap, ArrowUpRight, Star, Mic } from 'lucide-react';
import styles from '../../styles/shared.module.css';
import { oralPerformanceService } from '../services/oralPerformance.service';
import { holisticOralIndex } from '../../utils/cefrCalibration';

const images = [
  { src: '/images/s1.jpg', alt: 'Practice session' },
  { src: '/images/s2.jpg', alt: 'Oral assessment' },
  { src: '/images/eva.jpg', alt: 'EvalAI' },
];

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

/** Display score 0–100: backend may store 1–10 or 0–100 */
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
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginBottom: '0.35rem' }}>{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color, fontSize: '0.82rem', fontWeight: '700', margin: '0.1rem 0' }}>
            {p.name}: {p.value != null ? p.value : '—'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const defaultSkills = [
  { name: 'Fluency', score: 0, color: '#E31837' },
  { name: 'Pronunciation', score: 0, color: '#f97316' },
  { name: 'Speaking Pace', score: 0, color: '#22c55e' },
  { name: 'Confidence', score: 0, color: '#3b82f6' },
  { name: 'Content Structure', score: 0, color: '#8b5cf6' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [imgBroken, setImgBroken] = useState({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);

  const studentId = useMemo(() => getStudentIdFromToken(), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const progressData = useMemo(() => {
    const sorted = [...rows]
      .filter((r) => {
        const sc = scoreFromRow(r);
        const hol =
          r.evaluation?.contentScores && r.evaluation?.speechMetrics
            ? holisticOralIndex(r.evaluation.contentScores, r.evaluation.speechMetrics)
            : null;
        return sc != null || hol != null;
      })
      .sort((a, b) => new Date(a.performance.createdAt) - new Date(b.performance.createdAt))
      .slice(-12);
    return sorted.map((r, i) => {
      const hol =
        r.evaluation?.contentScores && r.evaluation?.speechMetrics
          ? holisticOralIndex(r.evaluation.contentScores, r.evaluation.speechMetrics)
          : null;
      return {
        name: r.performance?.createdAt
          ? new Date(r.performance.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          : `S${i + 1}`,
        score: scoreFromRow(r) ?? null,
        holistic: hol,
      };
    });
  }, [rows]);

  const skillRows = useMemo(() => {
    const latest = [...rows]
      .filter((r) => r.evaluation?.speechMetrics)
      .sort((a, b) => new Date(b.performance.createdAt) - new Date(a.performance.createdAt))[0];
    const sm = latest?.evaluation?.speechMetrics;
    if (!sm) return defaultSkills.map((d) => ({ ...d, score: 0 }));
    const pace = Math.min(100, (sm.speakingPace || 0) * 1.2);
    return [
      { name: 'Fluency', score: Math.round(sm.fluency ?? 0), color: '#E31837' },
      { name: 'Pronunciation', score: Math.round(sm.pronunciation ?? 0), color: '#f97316' },
      { name: 'Speaking Pace', score: Math.round(pace), color: '#22c55e' },
      { name: 'Confidence', score: Math.round(sm.confidence ?? 0), color: '#3b82f6' },
      {
        name: 'Content Structure',
        score: Math.round(latest.evaluation.contentScores?.contentStructure ?? 0),
        color: '#8b5cf6',
      },
    ];
  }, [rows]);

  const cefrLabel = useMemo(() => {
    const graded = [...rows]
      .filter((r) => r.performance?.status === 'graded' && r.performance?.overallProficiency)
      .sort((a, b) => new Date(b.performance.createdAt) - new Date(a.performance.createdAt))[0];
    return profToShort(graded?.performance?.overallProficiency);
  }, [rows]);

  const avgScore = stats?.averageScore != null
    ? normalizeDisplayScore(stats.averageScore)
    : null;
  const overallProgress = avgScore ?? (progressData.length
    ? (() => {
        const vals = progressData.flatMap((p) =>
          [p.score, p.holistic].filter((v) => v != null && !Number.isNaN(Number(v))),
        );
        if (!vals.length) return null;
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      })()
    : null);

  const sessionsCount = stats?.completedPerformances ?? rows.filter((r) => r.performance?.status === 'graded').length;

  const bestScore = useMemo(() => {
    const vals = rows.map(scoreFromRow).filter((v) => v != null);
    if (!vals.length) return null;
    return Math.max(...vals);
  }, [rows]);

  const growthLabel = useMemo(() => {
    if (progressData.length < 2) return null;
    const series = progressData.map((d) => d.holistic ?? d.score).filter((v) => v != null);
    if (series.length < 2) return null;
    const a = series[0];
    const b = series[series.length - 1];
    if (!a) return null;
    const pct = Math.round(((b - a) / a) * 100);
    return { pct, text: pct >= 0 ? `+${pct}%` : `${pct}%` };
  }, [progressData]);

  const recentEvaluations = useMemo(() => {
    return [...rows]
      .filter((r) => r.performance?.status === 'graded' || scoreFromRow(r) != null)
      .sort((a, b) => new Date(b.performance.createdAt) - new Date(a.performance.createdAt))
      .slice(0, 5)
      .map((r, i) => {
        const sc = scoreFromRow(r) ?? 0;
        const level = profToShort(r.performance?.overallProficiency);
        const colors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#E31837'];
        return {
          key: String(r.performance?.id ?? i),
          date: r.performance?.createdAt
            ? new Date(r.performance.createdAt).toLocaleDateString()
            : '—',
          title: r.performance?.title || 'Session',
          score: sc,
          level,
          levelColor: colors[i % colors.length],
        };
      });
  }, [rows]);

  const aiRecs = useMemo(() => {
    const latest = [...rows]
      .filter((r) => r.evaluation?.contentAnalysis)
      .sort((a, b) => new Date(b.performance.createdAt) - new Date(a.performance.createdAt))[0];
    const ca = latest?.evaluation?.contentAnalysis;
    if (!ca) {
      return [
        { icon: '🎉', title: 'Keep practicing', desc: 'Complete a session to see personalized AI tips.', bg: 'rgba(227,24,55,0.04)', accent: '#E31837' },
      ];
    }
    const out = [];
    if (ca.strengths?.length) {
      out.push({ icon: '💪', title: 'Strength', desc: ca.strengths[0], bg: 'rgba(34,197,94,0.06)', accent: '#22c55e' });
    }
    if (ca.improvements?.length) {
      out.push({ icon: '🎯', title: 'Focus next', desc: ca.improvements[0], bg: 'rgba(249,115,22,0.06)', accent: '#f97316' });
    }
    if (ca.summary) {
      out.push({ icon: '🎯', title: 'Summary', desc: ca.summary.slice(0, 160), bg: 'rgba(59,130,246,0.06)', accent: '#3b82f6' });
    }
    return out.length ? out : [{ icon: '🚀', title: 'Great job', desc: 'Review your detailed report for more.', bg: 'rgba(227,24,55,0.04)', accent: '#E31837' }];
  }, [rows]);

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  const chartDomain = [0, 100];

  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#E31837', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dashboard</span>
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Online</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>Here is how your oral skills are evolving</p>
          </div>

          <div style={{
            position: 'relative', width: '100%', height: '280px', borderRadius: '24px',
            overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
            background: 'linear-gradient(135deg, #1a1a2e, #0f0f1a)',
          }}>
            {images.map((image, index) => (
              <div key={index} style={{
                position: 'absolute', inset: 0,
                opacity: currentImage === index ? 1 : 0,
                transform: `scale(${currentImage === index ? 1 : 1.06})`,
                transition: 'opacity 0.8s ease, transform 1s ease',
              }}>
                {!imgBroken[index] ? (
                  <img
                    src={image.src}
                    alt={image.alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setImgBroken((prev) => ({ ...prev, [index]: true }))}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    background: 'linear-gradient(135deg, #E31837 0%, #7f1d1d 50%, #1a1a2e 100%)',
                  }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(15,15,26,0.7) 100%)' }} />
              </div>
            ))}
            <div style={{ position: 'absolute', bottom: '1.2rem', left: '1.5rem', right: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
              <div>
                <span style={{ display: 'inline-block', padding: '0.25rem 0.65rem', background: 'rgba(227,24,55,0.85)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', color: '#fff', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>EvalAI</span>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', fontWeight: '500' }}>Speak. Practice. Excel.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={prevImage} style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                  <ChevronLeft size={15} />
                </button>
                <button type="button" onClick={nextImage} style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: '1.2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.3rem', zIndex: 10 }}>
              {images.map((_, index) => (
                <button type="button" key={index} onClick={() => setCurrentImage(index)} style={{
                  width: currentImage === index ? '18px' : '6px', height: '6px', borderRadius: '3px',
                  background: currentImage === index ? '#fff' : 'rgba(255,255,255,0.35)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              ))}
            </div>
          </div>

          {loading && (
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>Loading your stats…</p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              background: 'linear-gradient(135deg, #E31837, #B71C1C)', borderRadius: '20px',
              padding: '1.25rem', position: 'relative', overflow: 'hidden', color: '#fff',
            }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', bottom: '-10px', right: '20px', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <Target size={20} style={{ opacity: 0.7, marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1' }}>{cefrLabel}</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: '0.2rem', fontWeight: '500' }}>CEFR (latest)</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                  <TrendingUp size={18} />
                </div>
                {growthLabel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem', fontWeight: '700', color: '#22c55e', background: 'rgba(34,197,94,0.08)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    <ArrowUpRight size={12} /> {growthLabel.text}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.04em', lineHeight: '1' }}>
                {overallProgress != null ? `${overallProgress}%` : '—'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: '500' }}>Overall (avg)</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.25rem',
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '0.75rem' }}>
                <Clock size={18} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.04em', lineHeight: '1' }}>{sessionsCount}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: '500' }}>Sessions completed</div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                  <Award size={18} />
                </div>
                <Star size={14} style={{ color: '#f97316' }} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.04em', lineHeight: '1' }}>{bestScore ?? '—'}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: '500' }}>Best score</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', letterSpacing: '-0.01em' }}>Progress over time</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                    Practice &amp; graded sessions — session score and holistic oral index (AI-aligned)
                  </p>
                </div>
                {growthLabel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '600', color: '#22c55e' }}>
                    <Flame size={14} /> {growthLabel.text}
                  </div>
                )}
              </div>
              {progressData.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '2rem 0', textAlign: 'center' }}>Complete a practice session to see your trend.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={progressData}>
                    <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} domain={chartDomain} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Line type="monotone" dataKey="score" name="Session score" stroke="#E31837" strokeWidth={2.5} connectNulls
                      dot={{ fill: '#fff', stroke: '#E31837', strokeWidth: 2, r: 3 }}
                      activeDot={{ fill: '#E31837', stroke: '#fff', strokeWidth: 2, r: 5 }}
                    />
                    <Line type="monotone" dataKey="holistic" name="Holistic index" stroke="#3b82f6" strokeWidth={2} connectNulls strokeDasharray="6 4"
                      dot={{ fill: '#fff', stroke: '#3b82f6', strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '1.2rem', letterSpacing: '-0.01em' }}>Skills breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {skillRows.map((skill) => (
                  <div key={skill.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#64748b' }}>{skill.name}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: skill.color }}>{skill.score}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(0,0,0,0.04)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, skill.score)}%`, background: `linear-gradient(90deg, ${skill.color}, ${skill.color}cc)`, borderRadius: '3px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>Recent evaluations</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {recentEvaluations.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.82rem' }}>No graded sessions yet.</p>
                ) : (
                  recentEvaluations.map((ev) => (
                    <div key={ev.key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.7rem 0.85rem', background: 'rgba(0,0,0,0.015)', borderRadius: '14px', cursor: 'pointer',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: `${ev.levelColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '800', fontSize: '0.65rem', color: ev.levelColor,
                        }}>{ev.level}</div>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1a1a2e' }}>{ev.title}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{ev.date}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '800', color: '#1a1a2e' }}>{ev.score}</span>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>/100</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Zap size={16} style={{ color: '#E31837' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>AI recommendations</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {aiRecs.map((rec, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '0.85rem', alignItems: 'flex-start',
                    padding: '0.85rem', background: rec.bg, borderRadius: '14px', borderLeft: `3px solid ${rec.accent}`,
                  }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{rec.icon}</span>
                    <div>
                      <h4 style={{ fontSize: '0.78rem', fontWeight: '700', color: rec.accent, marginBottom: '0.15rem' }}>{rec.title}</h4>
                      <p style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: '1.5' }}>{rec.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '1.5rem', background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)',
            borderRadius: '20px', padding: '1.25rem 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(227,24,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mic size={18} style={{ color: '#E31837' }} />
              </div>
              <div>
                <p style={{ color: '#fff', fontSize: '0.88rem', fontWeight: '600' }}>Ready to practice?</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Start a new recording session and get instant AI feedback</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate('/student/practice')} style={{
              padding: '0.6rem 1.4rem', background: 'linear-gradient(135deg, #E31837, #B71C1C)',
              border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', fontSize: '0.82rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
              boxShadow: '0 4px 20px rgba(227,24,55,0.3)', fontFamily: 'inherit',
            }}>
              Start Practice <ArrowUpRight size={15} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
