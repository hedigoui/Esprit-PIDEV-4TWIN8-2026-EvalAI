import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import TopNavbar from '../../components/TopNavbar';
import { Users, GraduationCap, User, Activity, TrendingUp, ArrowUpRight, Shield } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Tooltip, CartesianGrid } from 'recharts';
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
    max-width: 420px;
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

  .bottom-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 768px) { .bottom-grid { grid-template-columns: 1fr; } }
`;

const monthLabel = (d, locale) => d.toLocaleString(locale, { month: 'short' });

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
  const { t, language } = useI18n();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const [usersData, setUsersData] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setDataLoading(true);
        const [usersRes, perfRes] = await Promise.all([
          fetch('http://localhost:3000/users', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('http://localhost:3000/oral-performances', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const usersJson = usersRes.ok ? await usersRes.json() : [];
        const perfJson = perfRes.ok ? await perfRes.json() : { data: [] };

        if (cancelled) return;
        setUsersData(Array.isArray(usersJson) ? usersJson : []);
        setPerformances(Array.isArray(perfJson.data) ? perfJson.data : []);
      } catch {
        if (!cancelled) {
          setUsersData([]);
          setPerformances([]);
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const usersByRole = useMemo(() => {
    const counts = { students: 0, instructors: 0, admins: 0, active: 0 };
    usersData.forEach((u) => {
      if (u.isActive) counts.active += 1;
      if (u.role === 'student') counts.students += 1;
      else if (u.role === 'instructor') counts.instructors += 1;
      else if (u.role === 'admin') counts.admins += 1;
    });
    return counts;
  }, [usersData, locale]);

  const totalUsers = usersData.length;
  const activePct = totalUsers ? Math.round((usersByRole.active / totalUsers) * 100) : 0;

  const activityData = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, date: monthLabel(d, locale), users: 0 });
    }
    usersData.forEach((u) => {
      const d = u.createdAt ? new Date(u.createdAt) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.users += 1;
    });
    return buckets;
  }, [usersData]);

  const evaluationsData = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: monthLabel(d, locale), count: 0 });
    }
    performances.forEach((p) => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets.find((b) => b.key === key);
      if (bucket) bucket.count += 1;
    });
    return buckets;
  }, [performances, locale]);

  const userDistribution = useMemo(() => ([
    { name: t('adminDashboard.students'), value: usersByRole.students, color: '#E31837' },
    { name: t('adminDashboard.instructors'), value: usersByRole.instructors, color: '#22c55e' },
    { name: t('roles.admin'), value: usersByRole.admins, color: '#3b82f6' },
  ]), [t, usersByRole]);

  const recentActivity = useMemo(() => {
    const latestUsers = [...usersData]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 3)
      .map((u, i) => ({
        id: `u-${i}`,
        action: t('adminDashboard.recentNewUser'),
        user: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        time: u.createdAt ? new Date(u.createdAt).toLocaleString(locale) : '—',
        icon: '👤',
        accent: '#3b82f6',
      }));

    const latestPerf = [...performances]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 2)
      .map((p, i) => ({
        id: `p-${i}`,
        action: t('adminDashboard.recentEvaluation'),
        user: p.title || t('adminDashboard.recentOralPerformance'),
        time: p.createdAt ? new Date(p.createdAt).toLocaleString(locale) : '—',
        icon: '✅',
        accent: '#22c55e',
      }));

    return [...latestUsers, ...latestPerf].slice(0, 5);
  }, [usersData, performances, locale, t]);

  return (
    <>
      <style>{dashStyles}</style>
      <div className="dash-root">
        <AdminSidebar />
        <div className="dash-main">
          <TopNavbar />
          <div className="dash-content">

            <div className="hero-card">
              <div>
                <div className="hero-kicker">
                  <span>🛡️</span> {t('adminDashboard.heroKicker')}
                </div>
                <h1 className="hero-title">{t('adminDashboard.heroTitle')}</h1>
                <p className="hero-subtitle">{t('adminDashboard.heroSubtitle')}</p>
              </div>
              <div className="hero-orb">
                <Shield size={36} strokeWidth={1.5} />
              </div>
            </div>

            <div className="controls-row">
              <div className="section-tag">
                <span className="tag-label">{t('adminDashboard.overviewTag')}</span>
                <div className="live-dot" />
                <span className="live-label">{t('adminDashboard.liveData')}</span>
              </div>
              <button type="button" className="btn-primary" onClick={() => navigate('/admin/users')}>
                <Users size={15} /> {t('adminDashboard.manageUsers')}
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card stat-card-dark">
                <div className="stat-icon-wrap" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Users size={18} color="rgba(255,255,255,0.6)" />
                </div>
                <div className="stat-value stat-value-light">{dataLoading ? '—' : totalUsers}</div>
                <div className="stat-label stat-label-light">{t('adminDashboard.totalUsers')}</div>
              </div>

              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div className="stat-icon-wrap" style={{ background: 'rgba(34,197,94,0.1)', margin: 0 }}>
                    <GraduationCap size={18} color="#22c55e" />
                  </div>
                  <span className="stat-badge-green"><ArrowUpRight size={11} /> +24</span>
                </div>
                <div className="stat-value">{dataLoading ? '—' : usersByRole.students}</div>
                <div className="stat-label">{t('adminDashboard.students')}</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrap" style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <User size={18} color="#3b82f6" />
                </div>
                <div className="stat-value">{dataLoading ? '—' : usersByRole.instructors}</div>
                <div className="stat-label">{t('adminDashboard.instructors')}</div>
              </div>

              <div className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div className="stat-icon-wrap" style={{ background: 'rgba(249,115,22,0.1)', margin: 0 }}>
                    <Activity size={18} color="#f97316" />
                  </div>
                  {activePct > 0 && (
                    <span className="stat-badge-orange">{t('adminDashboard.activePct', { pct: activePct })}</span>
                  )}
                </div>
                <div className="stat-value">{dataLoading ? '—' : evaluationsData.reduce((sum, v) => sum + (v.count || 0), 0)}</div>
                <div className="stat-label">{t('adminDashboard.evaluations')}</div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <h3 className="panel-title">{t('adminDashboard.userGrowth')}</h3>
                  <span style={{ padding: '0.25rem 0.6rem', background: '#f8fafc', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '600', color: '#64748b', border: '1px solid rgba(0,0,0,0.06)' }}>{t('adminDashboard.last6Months')}</span>
                </div>
                <p className="panel-hint">{t('adminDashboard.newRegistrations')}</p>
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

              <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 className="panel-title">{t('adminDashboard.userDistribution')}</h3>
                <p className="panel-hint">{t('adminDashboard.byRole')}</p>
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

            <div className="bottom-grid">
              <div className="panel">
                <h3 className="panel-title">{t('adminDashboard.monthlyEvaluations')}</h3>
                <p className="panel-hint">{t('adminDashboard.platformVolume')}</p>
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

              <div className="panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 className="panel-title">{t('adminDashboard.recentActivity')}</h3>
                  <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#E31837' }}>{t('adminDashboard.viewAll')} →</span>
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

            <div className="panel" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #0f0f1a, #1a1a2e)', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Shield size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>{t('adminDashboard.platformStatus')}</span>
                  <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.78rem' }}>● {t('adminDashboard.healthy')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Users size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem' }}>{t('adminDashboard.totalUsersLabel')}</span>
                  <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.85rem' }}>{dataLoading ? '—' : totalUsers}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;