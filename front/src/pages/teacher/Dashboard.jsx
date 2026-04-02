import TeacherSidebar from '../../components/TeacherSidebar';
import { Users, ClipboardCheck, Clock, TrendingUp, Calendar, Mic, ArrowUpRight, Search, MoreHorizontal, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, CartesianGrid } from 'recharts';
import styles from '../../styles/shared.module.css';

const weeklyData = [
  { name: 'Mon', sessions: 4 },
  { name: 'Tue', sessions: 6 },
  { name: 'Wed', sessions: 3 },
  { name: 'Thu', sessions: 8 },
  { name: 'Fri', sessions: 5 },
];

const levelDistribution = [
  { name: 'A1-A2', value: 15, color: '#ef4444' },
  { name: 'B1', value: 35, color: '#f97316' },
  { name: 'B2', value: 30, color: '#22c55e' },
  { name: 'C1-C2', value: 20, color: '#8b5cf6' },
];

const recentStudents = [
  { id: 1, name: 'Hedi Goui', level: 'B2', lastSession: 'Today', status: 'Pending Review', avatar: '/images/hedi.jpg', score: 85, trend: '+5' },
  { id: 2, name: 'Sarah Miller', level: 'B1', lastSession: 'Yesterday', status: 'Evaluated', avatar: null, score: 72, trend: '+3' },
  { id: 3, name: 'Ahmed Hassan', level: 'B2', lastSession: '2 days ago', status: 'Pending Review', avatar: null, score: 78, trend: '+8' },
  { id: 4, name: 'Emma Wilson', level: 'C1', lastSession: '3 days ago', status: 'Evaluated', avatar: null, score: 91, trend: '+2' },
];

const upcomingSessions = [
  { id: 1, student: 'Hedi Goui', time: '10:00 AM', type: 'Live Session', initials: 'HG', color: '#E31837' },
  { id: 2, student: 'Sarah Miller', time: '2:00 PM', type: 'Audio Review', initials: 'SM', color: '#3b82f6' },
  { id: 3, student: 'John Doe', time: '4:30 PM', type: 'Live Session', initials: 'JD', color: '#8b5cf6' },
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
        <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '700' }}>{payload[0].value} sessions</p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  return (
    <div className={styles.layout}>
      <TeacherSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#E31837', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Instructor</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Active</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
                Instructor Dashboard
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>Manage your students and evaluations</p>
            </div>
            <button style={{
              padding: '0.65rem 1.3rem', background: 'linear-gradient(135deg, #E31837, #B71C1C)',
              border: 'none', borderRadius: '14px', color: '#fff', fontWeight: '700', fontSize: '0.82rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
              boxShadow: '0 4px 20px rgba(227,24,55,0.25)', fontFamily: 'inherit',
            }}>
              <Mic size={16} /> Start Live Session
            </button>
          </div>

          {/* Bento Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Total Students - Accent */}
            <div style={{
              background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)', borderRadius: '20px',
              padding: '1.25rem', position: 'relative', overflow: 'hidden', color: '#fff',
            }}>
              <div style={{ position: 'absolute', top: '-15px', right: '-15px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(227,24,55,0.15)' }} />
              <Users size={20} style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1' }}>48</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.5, marginTop: '0.2rem', fontWeight: '500' }}>Total Students</div>
            </div>

            {/* Pending Reviews */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                  <ClipboardCheck size={18} />
                </div>
                <div style={{ padding: '0.15rem 0.5rem', background: 'rgba(249,115,22,0.08)', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '700', color: '#f97316' }}>Urgent</div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.04em', lineHeight: '1' }}>12</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: '500' }}>Pending Reviews</div>
            </div>

            {/* Sessions This Month */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.25rem',
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '0.75rem' }}>
                <Clock size={18} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.04em', lineHeight: '1' }}>156</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: '500' }}>Sessions This Month</div>
            </div>

            {/* Avg Improvement */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                  <TrendingUp size={18} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem', fontWeight: '700', color: '#22c55e', background: 'rgba(34,197,94,0.08)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                  <ArrowUpRight size={12} /> +5%
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.04em', lineHeight: '1' }}>87%</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: '500' }}>Avg. Improvement</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Weekly Sessions Bar Chart */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>Sessions This Week</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>Daily session count</p>
                </div>
                <div style={{ padding: '0.3rem 0.75rem', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '600', color: '#64748b' }}>
                  This Week
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} barCategoryGap="30%">
                  <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
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

            {/* Level Distribution Donut */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
              display: 'flex', flexDirection: 'column',
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.5rem' }}>Level Distribution</h3>
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
                      <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: '500' }}>{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '1rem' }}>
            {/* Recent Students */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>Recent Students</h3>
                <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#E31837', cursor: 'pointer' }}>View all →</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentStudents.map((student) => (
                  <div key={student.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.7rem 0.85rem', background: 'rgba(0,0,0,0.015)', borderRadius: '14px', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {student.avatar ? (
                        <img src={student.avatar} alt={student.name} style={{ width: '38px', height: '38px', borderRadius: '12px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '12px',
                          background: 'linear-gradient(135deg, #E31837, #B71C1C)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: '700', fontSize: '0.82rem',
                        }}>{student.name.charAt(0)}</div>
                      )}
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1a1a2e' }}>{student.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Level {student.level} · {student.lastSession}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1a1a2e' }}>{student.score}</div>
                        <div style={{ fontSize: '0.62rem', fontWeight: '600', color: '#22c55e' }}>{student.trend}</div>
                      </div>
                      <span style={{
                        padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.62rem', fontWeight: '600',
                        background: student.status === 'Pending Review' ? 'rgba(249,115,22,0.08)' : 'rgba(34,197,94,0.08)',
                        color: student.status === 'Pending Review' ? '#f97316' : '#22c55e',
                      }}>{student.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Schedule */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>Today's Schedule</h3>
                <Calendar size={16} style={{ color: '#94a3b8' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {upcomingSessions.map((session) => (
                  <div key={session.id} style={{
                    padding: '0.85rem', background: 'rgba(0,0,0,0.015)', borderRadius: '14px',
                    borderLeft: `3px solid ${session.color}`, cursor: 'pointer',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: `${session.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.6rem', fontWeight: '800', color: session.color,
                        }}>{session.initials}</div>
                        <span style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1a1a2e' }}>{session.student}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '2.15rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{session.type}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#22c55e' }}>{session.time}</span>
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
