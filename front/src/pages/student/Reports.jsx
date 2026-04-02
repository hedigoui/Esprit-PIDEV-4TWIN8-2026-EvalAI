import StudentSidebar from '../../components/StudentSidebar';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Download, Calendar, TrendingUp, Award, Target, ArrowUpRight, FileText } from 'lucide-react';
import styles from '../../styles/shared.module.css';

const radarData = [
  { subject: 'Fluency', A: 85 },
  { subject: 'Pronunciation', A: 72 },
  { subject: 'Speaking Pace', A: 90 },
  { subject: 'Confidence', A: 80 },
  { subject: 'Content Structure', A: 78 },
];

const historyData = [
  { date: 'Jan 10', score: 69 },
  { date: 'Jan 17', score: 73 },
  { date: 'Jan 24', score: 76 },
  { date: 'Jan 31', score: 79 },
  { date: 'Feb 7', score: 83 },
];

const evaluations = [
  { id: 1, date: 'Feb 1, 2026', instructor: 'Hedi Goui', score: 86, level: 'B2', status: 'Completed', initials: 'HG', color: '#E31837' },
  { id: 2, date: 'Jan 28, 2026', instructor: 'Aziz Azizi', score: 79, level: 'B1+', status: 'Completed', initials: 'AA', color: '#3b82f6' },
  { id: 3, date: 'Jan 20, 2026', instructor: 'Ahmed Fatnassi', score: 74, level: 'B1', status: 'Completed', initials: 'AF', color: '#8b5cf6' },
];

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
  return (
    <div className={styles.layout}>
      <StudentSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#E31837', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reports</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
                My Performance Reports
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>View your evaluation history and progress</p>
            </div>
            <button style={{
              padding: '0.6rem 1.2rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '12px', color: '#64748b', fontWeight: '600', fontSize: '0.82rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit',
            }}>
              <Download size={16} /> Export Report
            </button>
          </div>

          {/* Summary Bento */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Latest Score */}
            <div style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)', borderRadius: '20px',
              padding: '1.5rem', position: 'relative', overflow: 'hidden', color: '#fff', textAlign: 'center',
            }}>
              <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <Award size={20} style={{ opacity: 0.7, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: '1' }}>86</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '0.25rem', fontWeight: '500' }}>Latest Score</div>
            </div>

            {/* Current Level */}
            <div style={{
              background: 'linear-gradient(135deg, #E31837, #B71C1C)', borderRadius: '20px',
              padding: '1.5rem', position: 'relative', overflow: 'hidden', color: '#fff', textAlign: 'center',
            }}>
              <div style={{ position: 'absolute', bottom: '-10px', left: '15px', width: '55px', height: '55px', borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
              <Target size={20} style={{ opacity: 0.7, marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '2.8rem', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: '1' }}>B2</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: '0.25rem', fontWeight: '500' }}>CEFR Level</div>
            </div>

            {/* Improvement */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem', textAlign: 'center',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div style={{ fontSize: '2.8rem', fontWeight: '900', color: '#3b82f6', letterSpacing: '-0.04em', lineHeight: '1' }}>+17%</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem', fontWeight: '500' }}>Since First Session</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Radar Chart */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.5rem' }}>Skills Overview</h3>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Your strengths and areas to improve</p>
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

            {/* Score History */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>Score History</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>Instructor evaluation scores</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '600', color: '#22c55e' }}>
                  <ArrowUpRight size={14} /> +20%
                </div>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={historyData}>
                  <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="date" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} domain={[60, 90]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#E31837" strokeWidth={2.5}
                    dot={{ fill: '#fff', stroke: '#E31837', strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: '#E31837', stroke: '#fff', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: '#94a3b8' }}>
                  <div style={{ width: '16px', height: '2px', background: '#E31837', borderRadius: '1px' }} />
                  Instructor Score
                </div>
              </div>
            </div>
          </div>

          {/* Recent instructor evaluations */}
          <div style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
          }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.75rem' }}>
              Recent evaluations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {evaluations.map((ev) => (
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
                      fontSize: '0.72rem', fontWeight: '700',
                    }}>{ev.initials}</div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1a1a2e' }}>{ev.instructor}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{ev.date}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#1a1a2e' }}>{ev.score}</div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{ev.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
