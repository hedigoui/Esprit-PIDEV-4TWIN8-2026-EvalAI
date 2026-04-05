import AdminSidebar from '../../components/AdminSidebar';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Users, ClipboardCheck, Activity, ArrowUpRight, BarChart3, Shield } from 'lucide-react';
import styles from '../../styles/shared.module.css';

const platformData = [
  { month: 'Sep', evaluations: 280, activeUsers: 160 },
  { month: 'Oct', evaluations: 320, activeUsers: 190 },
  { month: 'Nov', evaluations: 350, activeUsers: 210 },
  { month: 'Dec', evaluations: 400, activeUsers: 250 },
  { month: 'Jan', evaluations: 430, activeUsers: 290 },
  { month: 'Feb', evaluations: 320, activeUsers: 310 },
];

const levelDistribution = [
  { name: 'A1', value: 5, color: '#ef4444' },
  { name: 'A2', value: 15, color: '#f97316' },
  { name: 'B1', value: 35, color: '#eab308' },
  { name: 'B2', value: 30, color: '#22c55e' },
  { name: 'C1', value: 12, color: '#3b82f6' },
  { name: 'C2', value: 3, color: '#8b5cf6' },
];

const teacherPerformance = [
  { name: 'Dr. Smith', evaluations: 85, avgScore: 78, students: 24, initials: 'DS', color: '#E31837' },
  { name: 'Prof. Johnson', evaluations: 72, avgScore: 81, students: 20, initials: 'PJ', color: '#3b82f6' },
  { name: 'Dr. Williams', evaluations: 65, avgScore: 75, students: 18, initials: 'DW', color: '#8b5cf6' },
  { name: 'Prof. Davis', evaluations: 58, avgScore: 79, students: 16, initials: 'PD', color: '#22c55e' },
  { name: 'Dr. Garcia', evaluations: 45, avgScore: 82, students: 14, initials: 'DG', color: '#f59e0b' },
];

const CustomTooltip = ({ active, payload, label }) => {
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
            {p.dataKey === 'evaluations' ? `${p.value} evaluations` : `${p.value} users`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#E31837', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>System Active</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
                Platform Reports
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>Complete platform analytics and performance data</p>
            </div>
            <button style={{
              padding: '0.6rem 1.2rem', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '12px', color: '#64748b', fontWeight: '600', fontSize: '0.82rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'inherit',
            }}>
              <Download size={16} /> Export Report
            </button>
          </div>

          {/* Stat Bento Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Total Evaluations - gradient accent */}
            <div style={{
              background: 'linear-gradient(135deg, #E31837, #B71C1C)', borderRadius: '20px',
              padding: '1.35rem', position: 'relative', overflow: 'hidden', color: '#fff',
            }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '55px', height: '55px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
                <ClipboardCheck size={16} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1' }}>2,100</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: '0.35rem' }}>Total Evaluations</div>
            </div>

            {/* Avg Score */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.35rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                  <TrendingUp size={16} />
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: '700', color: '#22c55e', background: 'rgba(34,197,94,0.08)', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>+2.3</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', marginTop: '0.6rem', letterSpacing: '-0.04em', lineHeight: '1' }}>78.5</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.35rem' }}>Platform Avg Score</div>
            </div>

            {/* Active Users */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.35rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(34,197,94,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                  <Users size={16} />
                </div>
                <span style={{ fontSize: '0.62rem', fontWeight: '700', color: '#22c55e', background: 'rgba(34,197,94,0.08)', padding: '0.15rem 0.45rem', borderRadius: '6px' }}>+5%</span>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', marginTop: '0.6rem', letterSpacing: '-0.04em', lineHeight: '1' }}>92%</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.35rem' }}>Active Users</div>
            </div>

            {/* Monthly Growth */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.35rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                  <Activity size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', marginTop: '0.6rem', letterSpacing: '-0.04em', lineHeight: '1' }}>+18%</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.35rem' }}>Monthly Growth</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Platform Activity - Area Chart */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>Platform Activity</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>Evaluations and active users over time</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '600', color: '#22c55e' }}>
                  <ArrowUpRight size={14} /> Trending up
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
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="evaluations" stroke="#E31837" fill="url(#evalGrad)" strokeWidth={2.5} dot={{ fill: '#fff', stroke: '#E31837', strokeWidth: 2, r: 3 }} />
                  <Area type="monotone" dataKey="activeUsers" stroke="#3b82f6" fill="url(#userGrad)" strokeWidth={2.5} dot={{ fill: '#fff', stroke: '#3b82f6', strokeWidth: 2, r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: '#94a3b8' }}>
                  <div style={{ width: '16px', height: '2px', background: '#E31837', borderRadius: '1px' }} /> Evaluations
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.68rem', color: '#94a3b8' }}>
                  <div style={{ width: '16px', height: '2px', background: '#3b82f6', borderRadius: '1px' }} /> Active Users
                </div>
              </div>
            </div>

            {/* Donut Chart - Level Distribution */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.3rem' }}>CEFR Distribution</h3>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Student level breakdown</p>
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

          {/* Instructor Performance */}
          <div style={{
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem', marginBottom: '1.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={16} style={{ color: '#8b5cf6' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>Instructor Performance</h3>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#E31837', cursor: 'pointer' }}>View all →</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {teacherPerformance.map((t, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 1rem', background: 'rgba(0,0,0,0.015)', borderRadius: '14px',
                  borderLeft: `3px solid ${t.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      background: `${t.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '0.72rem', color: t.color,
                    }}>{t.initials}</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a1a2e' }}>{t.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{t.students} students · {t.evaluations} evaluations</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {/* Progress bar */}
                    <div style={{ width: '120px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Avg Score</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#1a1a2e' }}>{t.avgScore}/100</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', background: 'rgba(0,0,0,0.04)' }}>
                        <div style={{
                          width: `${t.avgScore}%`, height: '100%', borderRadius: '3px',
                          background: `linear-gradient(90deg, ${t.color}, ${t.color}aa)`,
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Status Bar */}
          <div style={{
            background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)', borderRadius: '18px',
            padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>Platform Status</span>
              <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.78rem' }}>● Healthy</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>Total Users</span>
              <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>490</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClipboardCheck size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>This Month</span>
              <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>320 evaluations</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Reports;
