import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import { Search, Filter, Eye, ClipboardCheck, MessageCircle, Users, TrendingUp, Calendar, Phone } from 'lucide-react';
import styles from '../../styles/shared.module.css';
import { oralPerformanceService } from '../services/oralPerformance.service';
import teacherStyles from './Teacher.module.css';
import studentsStyles from './Students.module.css';

function normalizeDisplayScore(raw) {
  if (raw == null || Number.isNaN(Number(raw))) return null;
  const n = Number(raw);
  if (n <= 10) return Math.round(n * 10);
  return Math.round(Math.min(100, n));
}

function displayName(s) {
  const n = `${s.firstName || ''} ${s.lastName || ''}`.trim();
  return n || s.email || 'Student';
}

function profLabel(p) {
  if (!p) return '—';
  const m = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    proficient: 'Proficient',
  };
  return m[String(p).toLowerCase()] || String(p);
}

function getProficiencyColor(p) {
  const c = {
    beginner: '#ef4444',
    intermediate: '#f97316',
    advanced: '#22c55e',
    proficient: '#8b5cf6',
  };
  return c[String(p || '').toLowerCase()] || '#64748b';
}

function enrichStudents(students, performances) {
  const bySt = {};
  (performances || []).forEach((p) => {
    const sid = p.studentId;
    if (!bySt[sid]) bySt[sid] = { count: 0, scores: [], profs: [] };
    bySt[sid].count++;
    if (p.totalScore != null) bySt[sid].scores.push({ t: p.createdAt, score: p.totalScore });
    if (p.overallProficiency) bySt[sid].profs.push({ t: p.createdAt, p: p.overallProficiency });
  });

  return students.map((s) => {
    const id = s._id?.toString?.() || s._id;
    const ex = bySt[id] || { count: 0, scores: [], profs: [] };
    const scores = [...ex.scores].sort((a, b) => new Date(b.t) - new Date(a.t));
    const profs = [...ex.profs].sort((a, b) => new Date(b.t) - new Date(a.t));
    const lastScore = scores[0]?.score;
    const proficiency = profs[0]?.p || null;
    return {
      ...s,
      displayName: displayName(s),
      sessions: ex.count,
      lastScore: lastScore != null ? normalizeDisplayScore(lastScore) : null,
      proficiency,
    };
  });
}

const Students = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [students, setStudents] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [currentUser?.id]);

  const loadStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStudents([]);
        setPerformances([]);
        setLoading(false);
        return;
      }

      const instructorId = currentUser?.id;
      const [perfData, response] = await Promise.all([
        instructorId ? oralPerformanceService.getInstructorPerformances(instructorId) : Promise.resolve([]),
        fetch('http://localhost:3000/users/students', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (response.ok) {
        const data = await response.json();
        const raw = data.data || [];
        setPerformances(Array.isArray(perfData) ? perfData : []);
        setStudents(enrichStudents(raw, perfData));
      } else {
        setStudents([]);
        setPerformances([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      student.displayName?.toLowerCase().includes(q) || student.email?.toLowerCase().includes(q);
    const matchesLevel = levelFilter === 'all' || student.proficiency === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const startConversation = (studentId) => {
    navigate(`/messages/${studentId}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      Active: '#10b981',
      Inactive: '#ef4444',
      Pending: '#f59e0b',
    };
    return colors[status] || '#6b7280';
  };

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.isActive !== false).length;
    const byProf = {
      beginner: students.filter((s) => s.proficiency === 'beginner').length,
      intermediate: students.filter((s) => s.proficiency === 'intermediate').length,
      advanced: students.filter((s) => s.proficiency === 'advanced').length,
      proficient: students.filter((s) => s.proficiency === 'proficient').length,
    };
    return { total, active, byProf };
  }, [students]);

  return (
    <div className={styles.layout}>
      <TeacherSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          <div className={teacherStyles.hero}>
            <div className={teacherStyles.heroText}>
              <span className={teacherStyles.heroKicker}>Roster</span>
              <h1 className={teacherStyles.heroTitle}>Your students</h1>
              <p className={teacherStyles.heroSubtitle}>
                Search the cohort, filter by proficiency from recent assessments, and jump into evaluation or messages.
              </p>
            </div>
            <div className={teacherStyles.heroVisual} aria-hidden>
              <div className={teacherStyles.heroOrb} />
              <div className={teacherStyles.heroIconWrap}>
                <Users size={34} strokeWidth={1.75} />
              </div>
            </div>
          </div>

          <div className={studentsStyles.pageHeader}>
            <div className={studentsStyles.headerContent}>
              <div className={studentsStyles.headerText}>
                <h1 className={studentsStyles.pageTitle}>
                  <Users size={28} className={studentsStyles.titleIcon} />
                  Directory
                </h1>
                <p className={studentsStyles.pageSubtitle}>Manage and monitor your students&apos; progress</p>
              </div>

              <div className={studentsStyles.statsCards}>
                <div className={studentsStyles.statCard}>
                  <div className={studentsStyles.statIcon}>
                    <Users size={20} />
                  </div>
                  <div className={studentsStyles.statInfo}>
                    <span className={studentsStyles.statNumber}>{stats.total}</span>
                    <span className={studentsStyles.statLabel}>Total</span>
                  </div>
                </div>
                <div className={studentsStyles.statCard}>
                  <div className={studentsStyles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <TrendingUp size={20} style={{ color: '#10b981' }} />
                  </div>
                  <div className={studentsStyles.statInfo}>
                    <span className={studentsStyles.statNumber}>{stats.active}</span>
                    <span className={studentsStyles.statLabel}>Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={studentsStyles.controlsSection}>
            <div className={studentsStyles.filtersRow}>
              <div className={studentsStyles.searchBox}>
                <Search size={18} className={studentsStyles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={studentsStyles.searchInput}
                />
              </div>

              <div className={studentsStyles.filterGroup}>
                <Filter size={18} className={studentsStyles.filterIcon} />
                <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className={studentsStyles.filterSelect}>
                  <option value="all">All levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="proficient">Proficient</option>
                </select>
              </div>

              <div className={studentsStyles.viewToggle}>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`${studentsStyles.viewButton} ${viewMode === 'grid' ? studentsStyles.activeView : ''}`}
                  title="Grid view"
                >
                  <div className={studentsStyles.gridIcon} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`${studentsStyles.viewButton} ${viewMode === 'list' ? studentsStyles.activeView : ''}`}
                  title="List view"
                >
                  <div className={studentsStyles.listIcon} />
                </button>
              </div>
            </div>

            <div className={studentsStyles.levelDistribution}>
              {Object.entries(stats.byProf).map(([level, count]) => (
                <div key={level} className={studentsStyles.levelStat}>
                  <div className={studentsStyles.levelDot} style={{ backgroundColor: getProficiencyColor(level) }} />
                  <span className={studentsStyles.levelName}>{profLabel(level)}</span>
                  <span className={studentsStyles.levelCount}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={studentsStyles.studentsContainer}>
            {loading ? (
              <div className={studentsStyles.loadingState}>
                <div className={studentsStyles.spinner} />
                <p>Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className={studentsStyles.emptyState}>
                <div className={studentsStyles.emptyIcon}>👥</div>
                <h3>No students found</h3>
                <p>
                  {searchTerm || levelFilter !== 'all'
                    ? 'No students match your current filters.'
                    : 'No students are enrolled yet.'}
                </p>
                <button 
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setLevelFilter('all');
                  }}
                  className={studentsStyles.clearFiltersBtn}
                >
                  Clear filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className={studentsStyles.studentsGrid}>
                {filteredStudents.map((student) => (
                  <div key={student.id || student._id} className={studentsStyles.studentCard}>
                    <div className={studentsStyles.cardHeader}>
                      <div className={studentsStyles.studentAvatar}>
                        {student.avatar ? (
                          <img src={student.avatar} alt="" className={studentsStyles.avatarImage} />
                        ) : (
                          <div className={studentsStyles.avatarPlaceholder}>{displayName(student).charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                      <div
                        className={studentsStyles.onlineStatus}
                        style={{ background: student.isActive === false ? '#94a3b8' : '#22c55e' }}
                        title={student.isActive === false ? 'Inactive' : 'Active'}
                      />
                    </div>

                    <div className={studentsStyles.cardBody}>
                      <div className={studentsStyles.studentInfo}>
                        <h3 className={studentsStyles.studentName}>{student.displayName}</h3>
                        <p className={studentsStyles.studentEmail}>{student.email}</p>

                        <div className={studentsStyles.studentMeta}>
                          <span
                            className={studentsStyles.levelBadge}
                            style={{ backgroundColor: getProficiencyColor(student.proficiency) }}
                          >
                            {profLabel(student.proficiency)}
                          </span>
                          <span
                            className={studentsStyles.statusBadge}
                            style={{ backgroundColor: getStatusColor(student.status || 'Active') }}
                          >
                            {student.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className={studentsStyles.studentDetails}>
                        <div className={studentsStyles.detailItem}>
                          <Phone size={14} />
                          <span>{student.phone || 'No phone'}</span>
                        </div>
                        <div className={studentsStyles.detailItem}>
                          <Calendar size={14} />
                          <span>Joined {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className={studentsStyles.cardFooter}>
                      <div className={studentsStyles.studentStats}>
                        <div className={studentsStyles.statItem}>
                          <span className={studentsStyles.statNumber}>{student.sessions || 0}</span>
                          <span className={studentsStyles.statLabel}>Sessions</span>
                        </div>
                        <div className={studentsStyles.statItem}>
                          <span className={studentsStyles.statNumber}>{student.lastScore != null ? `${student.lastScore}%` : '—'}</span>
                          <span className={studentsStyles.statLabel}>Last score</span>
                        </div>
                      </div>

                      <div className={studentsStyles.studentActions}>
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/evaluate/${student._id}`)}
                          className={studentsStyles.actionButton}
                          title="Open evaluation"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/evaluate/${student._id}`)}
                          className={studentsStyles.actionButton}
                          title="Evaluate"
                        >
                          <ClipboardCheck size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startConversation(student._id)}
                          className={`${studentsStyles.actionButton} ${studentsStyles.messageButton}`}
                          title="Send message"
                        >
                          <MessageCircle size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={studentsStyles.studentsList}>
                {filteredStudents.map((student) => (
                  <div key={student.id || student._id} className={studentsStyles.listItem}>
                    <div className={studentsStyles.listItemContent}>
                      <div className={studentsStyles.listItemAvatar}>
                        <img
                          src={
                            student.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.email || 'student')}&backgroundColor=b6e3f4,c0aede,d1d4f9`
                          }
                          alt=""
                        />
                      </div>

                      <div className={studentsStyles.listItemInfo}>
                        <div className={studentsStyles.listItemHeader}>
                          <h4>{student.displayName}</h4>
                          <div className={studentsStyles.listItemMeta}>
                            <span
                              className={studentsStyles.levelBadge}
                              style={{ backgroundColor: getProficiencyColor(student.proficiency) }}
                            >
                              {profLabel(student.proficiency)}
                            </span>
                            <span
                              className={studentsStyles.statusBadge}
                              style={{ backgroundColor: getStatusColor(student.status || 'Active') }}
                            >
                              {student.status || 'Active'}
                            </span>
                          </div>
                        </div>
                        <p>{student.email}</p>
                        <div className={studentsStyles.listItemDetails}>
                          <span>Sessions: {student.sessions || 0}</span>
                          <span>Score: {student.lastScore != null ? `${student.lastScore}%` : '—'}</span>
                          <span>Joined: {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                      </div>

                      <div className={studentsStyles.listItemActions}>
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/evaluate/${student._id}`)}
                          className={studentsStyles.actionButton}
                          title="Evaluate"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => startConversation(student._id)}
                          className={`${studentsStyles.actionButton} ${studentsStyles.messageButton}`}
                          title="Message"
                        >
                          <MessageCircle size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Students;
