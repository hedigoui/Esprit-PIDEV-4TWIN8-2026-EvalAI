import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { Users, GraduationCap, User, Activity, TrendingUp, ArrowUpRight, Shield, Settings, Bell, LogOut } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Tooltip, CartesianGrid } from 'recharts';
import styles from '../../styles/shared.module.css';

const activityData = [
  { date: 'Jan', users: 120 },
  { date: 'Feb', users: 145 },
  { date: 'Mar', users: 162 },
  { date: 'Apr', users: 178 },
  { date: 'May', users: 195 },
  { date: 'Jun', users: 210 },
];

const userDistribution = [
  { name: 'Students', value: 450, color: '#E31837' },
  { name: 'Instructors', value: 35, color: '#22c55e' },
  { name: 'Admins', value: 5, color: '#3b82f6' },
];

const evaluationsData = [
  { month: 'Jan', count: 280 },
  { month: 'Feb', count: 320 },
  { month: 'Mar', count: 350 },
  { month: 'Apr', count: 310 },
  { month: 'May', count: 380 },
  { month: 'Jun', count: 420 },
];

const recentActivity = [
  { id: 1, action: 'New student registered', user: 'Sarah Miller', time: '2 min ago', icon: '👤', accent: '#3b82f6' },
  { id: 2, action: 'Evaluation completed', user: 'Dr. Smith → Hedi Goui', time: '15 min ago', icon: '✅', accent: '#22c55e' },
  { id: 3, action: 'New instructor added', user: 'Prof. Johnson', time: '1 hour ago', icon: '🧑‍🏫', accent: '#8b5cf6' },
  { id: 4, action: 'AI analysis completed', user: 'System', time: '2 hours ago', icon: '🤖', accent: '#f97316' },
  { id: 5, action: 'Password reset', user: 'Ahmed Hassan', time: '3 hours ago', icon: '🔒', accent: '#64748b' },
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
        <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: '700' }}>{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🚪 Logout button clicked');
    console.log('Before logout - Token:', localStorage.getItem('token'));
    console.log('Before logout - User:', localStorage.getItem('user'));
    
    try {
      // Clear all auth data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberMe');
      
      // Double check that items are removed
      const tokenAfter = localStorage.getItem('token');
      const userAfter = localStorage.getItem('user');
      
      console.log('After logout - Token:', tokenAfter);
      console.log('After logout - User:', userAfter);
      
      if (!tokenAfter && !userAfter) {
        console.log('✅ localStorage cleared successfully');
        // Redirect to login page
        navigate('/', { replace: true });
      } else {
        console.log('❌ localStorage not cleared properly, trying again...');
        // Try one more time
        localStorage.clear();
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Fallback: clear everything and navigate
      localStorage.clear();
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    console.log('Admin Dashboard - Token:', token);
    console.log('Admin Dashboard - User string:', userStr);
    
    if (!token) {
      console.log('No token found, redirecting to login');
      navigate('/', { replace: true });
      return;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('Admin Dashboard - Parsed user:', user);
        console.log('Admin Dashboard - User role:', user.role);
        
        if (user.role !== 'admin') {
          console.log('User is not admin, redirecting');
          if (user.role === 'instructor') {
            navigate('/teacher/dashboard', { replace: true });
          } else if (user.role === 'student') {
            navigate('/student/dashboard', { replace: true });
          } else {
            navigate('/unauthorized', { replace: true });
          }
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/', { replace: true });
      }
    } else {
      console.log('No user data found, redirecting to login');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          {/* Header with Logout Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#E31837', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Administration</span>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>System OK</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.03em', lineHeight: '1.2' }}>
                Admin Dashboard
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>Platform overview and management</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button style={{
                width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748b',
              }}><Bell size={18} /></button>
              <button style={{
                width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0,0,0,0.03)',
                border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748b',
              }}><Settings size={18} /></button>
              
              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#ef4444',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Bento Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Total Users - Hero Card */}
            <div style={{
              background: 'linear-gradient(135deg, #E31837, #B71C1C)', borderRadius: '20px',
              padding: '1.25rem', position: 'relative', overflow: 'hidden', color: '#fff',
            }}>
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'absolute', bottom: '-10px', right: '20px', width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
              <Users size={20} style={{ opacity: 0.7, marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '2.2rem', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1' }}>490</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: '0.2rem', fontWeight: '500' }}>Total Users</div>
            </div>

            {/* Students */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                  <GraduationCap size={18} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem', fontWeight: '700', color: '#22c55e', background: 'rgba(34,197,94,0.08)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                  <ArrowUpRight size={12} /> +24
                </div>
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.04em', lineHeight: '1' }}>450</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: '500' }}>Students</div>
            </div>

            {/* Instructors */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.25rem',
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', marginBottom: '0.75rem' }}>
                <User size={18} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.04em', lineHeight: '1' }}>35</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: '500' }}>Instructors</div>
            </div>

            {/* Evaluations */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                  <Activity size={18} />
                </div>
                <TrendingUp size={14} style={{ color: '#22c55e' }} />
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.04em', lineHeight: '1' }}>2.1K</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem', fontWeight: '500' }}>Evaluations</div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* User Growth Area Chart */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>User Growth</h3>
                  <p style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>New registrations over time</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: '600', color: '#22c55e' }}>
                  <ArrowUpRight size={14} /> +75% YoY
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="adminAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E31837" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#E31837" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="date" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="users" stroke="#E31837" fill="url(#adminAreaGrad)" strokeWidth={2.5}
                    dot={{ fill: '#fff', stroke: '#E31837', strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: '#E31837', stroke: '#fff', strokeWidth: 2, r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* User Distribution Donut */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
              display: 'flex', flexDirection: 'column',
            }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e', marginBottom: '0.5rem' }}>User Distribution</h3>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={userDistribution} cx="50%" cy="50%" innerRadius={42} outerRadius={62} dataKey="value" strokeWidth={0}>
                      {userDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%', marginTop: '0.5rem' }}>
                  {userDistribution.map((item) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: item.color }} />
                        <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: '500' }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#1a1a2e' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '1rem' }}>
            {/* Monthly Evaluations */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>Monthly Evaluations</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={evaluationsData} barCategoryGap="30%">
                  <CartesianGrid stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="month" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,197,94,0.04)', radius: 8 }} />
                  <defs>
                    <linearGradient id="adminBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#16a34a" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="count" fill="url(#adminBarGrad)" radius={[10, 10, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Activity */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.06)', borderRadius: '20px', padding: '1.5rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1a1a2e' }}>Recent Activity</h3>
                <span style={{ fontSize: '0.68rem', fontWeight: '600', color: '#E31837', cursor: 'pointer' }}>View all →</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {recentActivity.map((activity) => (
                  <div key={activity.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 0.85rem', background: 'rgba(0,0,0,0.015)', borderRadius: '14px',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: `${activity.accent}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1rem',
                    }}>{activity.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#1a1a2e' }}>{activity.action}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.user}</div>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: '500', flexShrink: 0 }}>{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Status Bar */}
          <div style={{
            marginTop: '1.5rem', background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)',
            borderRadius: '20px', padding: '1rem 1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {[
                { label: 'Server Status', value: 'Online', color: '#22c55e' },
                { label: 'Storage', value: '2.4 GB / 10 GB', color: '#3b82f6' },
                { label: 'Last Backup', value: 'Jan 28, 2026', color: '#f97316' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }} />
                  <div>
                    <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '600' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Shield size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)', fontWeight: '500' }}>System Secured</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;