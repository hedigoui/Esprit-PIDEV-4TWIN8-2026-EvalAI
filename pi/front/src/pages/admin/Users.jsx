import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import TopNavbar from '../../components/TopNavbar';
import { API_BASE_URL } from '../../config/api';
import { Search, Plus, Trash2, Power, PowerOff, X, Users as UsersIcon, TrendingUp } from 'lucide-react';
import axios from 'axios';
import styles from '../../styles/shared.module.css';
import { useI18n } from '../../i18n/I18nProvider';

const API_URL = API_BASE_URL;
const PAGE_SIZE = 20;

const usersPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

  .au-root * { font-family: 'Manrope', sans-serif; box-sizing: border-box; }

  .au-root {
    display: flex;
    min-height: 100vh;
    background: var(--bg-main);
  }

  .au-main { flex: 1; min-width: 0; overflow-y: auto; }

  .au-content {
    max-width: 1280px;
    padding: 2rem 2.5rem;
    margin: 0 auto;
  }

  .au-hero {
    background: linear-gradient(135deg, #121826 0%, #1f2937 60%, var(--primary) 150%);
    border-radius: 24px;
    padding: 2.25rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2);
  }

  .au-hero::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 280px;
    height: 280px;
    background: radial-gradient(circle, rgba(227,24,55,0.22) 0%, transparent 70%);
    pointer-events: none;
  }

  .au-hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(227,24,55,0.95);
    background: rgba(227,24,55,0.14);
    padding: 0.3rem 0.75rem;
    border-radius: 20px;
    margin-bottom: 0.75rem;
    border: 1px solid rgba(227,24,55,0.25);
  }

  .au-hero-title {
    font-size: 2rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.04em;
    margin: 0 0 0.4rem;
  }

  .au-hero-sub {
    color: rgba(255,255,255,0.6);
    font-size: 0.9rem;
    line-height: 1.6;
    max-width: 420px;
    margin: 0;
  }

  .au-hero-icon {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: rgba(227,24,55,0.2);
    border: 1px solid rgba(227,24,55,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255,255,255,0.8);
    flex-shrink: 0;
  }

  .au-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
  }

  .au-section-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .au-section-sub {
    margin: 0.3rem 0 0;
    font-size: 0.82rem;
    color: var(--text-muted);
  }

  .au-stats-row {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .au-mini-stat {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: 14px;
    padding: 0.6rem 1rem;
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(10px);
  }

  .au-mini-icon {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    background: var(--primary-soft);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .au-mini-num {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .au-mini-label {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 600;
  }

  .au-primary-btn {
    padding: 0.65rem 1.25rem;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: #fff;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    box-shadow: 0 6px 18px var(--primary-glow);
  }

  .au-controls {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-light);
    padding: 1.1rem 1.4rem;
    margin-bottom: 1.5rem;
    box-shadow: var(--shadow-sm);
    backdrop-filter: blur(12px);
  }

  .au-controls-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .au-search {
    position: relative;
    flex: 1;
    min-width: 220px;
  }

  .au-search-icon {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
  }

  .au-search-input {
    width: 100%;
    padding: 0.7rem 0.75rem 0.7rem 2.5rem;
    border: 1.5px solid var(--border-light);
    border-radius: 12px;
    font-size: 0.875rem;
    font-family: 'Manrope', sans-serif;
    background: var(--bg-card-solid);
    color: var(--text-primary);
    transition: all 0.2s;
    outline: none;
  }

  .au-search-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px var(--primary-soft);
  }

  .au-table-card {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-light);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .au-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }

  .au-table th {
    text-align: left;
    padding: 1rem 1.25rem;
    color: var(--text-muted);
    font-weight: 700;
    background: rgba(0,0,0,0.02);
  }

  [data-theme='dark'] .au-table th {
    background: rgba(255,255,255,0.03);
  }

  .au-table td {
    padding: 1rem 1.25rem;
    border-top: 1px solid var(--border-light);
    color: var(--text-primary);
    vertical-align: middle;
  }

  .au-table tbody tr:hover {
    background: var(--primary-soft);
  }

  .au-user-cell { display: flex; align-items: center; gap: 0.75rem; }

  .au-user-name { font-weight: 600; color: var(--text-primary); }

  .au-muted { color: var(--text-secondary); }

  .au-actions { display: flex; gap: 0.5rem; }

  .au-action-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid var(--border-light);
    background: var(--bg-card-solid);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    transition: all 0.2s;
  }

  .au-action-btn:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: var(--primary-soft);
    transform: translateY(-1px);
  }

  .au-empty {
    text-align: center;
    padding: 3rem;
    color: var(--text-muted);
  }

  .au-alert {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
    color: #ef4444;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .au-alert-btn {
    padding: 0.5rem 1rem;
    background: #ef4444;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.8rem;
  }

  @media (max-width: 900px) {
    .au-content { padding: 1.5rem; }
    .au-hero { flex-direction: column; align-items: flex-start; gap: 1.25rem; }
    .au-hero-icon { align-self: flex-end; }
  }
`;

const Users = () => {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(null);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const loadMoreRef = useRef(null);
  
  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    role: 'student',
    password: '',
    isActive: true
  });
  const [addingUser, setAddingUser] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchUsers = useCallback(async (pageToLoad = 1, append = false) => {
    try {
      if (pageToLoad === 1) setLoading(true);
      else setLoadingMore(true);
      const token = localStorage.getItem('token'); // FIXED: Changed from 'access_token' to 'token'
      
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get(`${API_URL}/users`, {
        params: { page: pageToLoad, limit: PAGE_SIZE },
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Raw users from backend:', response.data);

      // Transform the data to match your frontend format
      const rawUsers = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.data) ? response.data.data : []);

      const formattedUsers = rawUsers.map(user => ({
        id: user._id || user.id,
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isActive: user.isActive,
        status: user.isActive ? 'active' : 'inactive',
        joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString(locale, {
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }) : 'N/A'
      }));

      console.log('Formatted users:', formattedUsers);
      setUsers(prev => (append ? [...prev, ...formattedUsers] : formattedUsers));
      const total = typeof response.data?.total === 'number' ? response.data.total : formattedUsers.length;
      setTotalCount(total);
      setHasMore(pageToLoad * PAGE_SIZE < total);
      setPage(pageToLoad);
      setError('');
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(t('adminUsers.loadFailed'));
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [navigate, locale, t]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
          if (user.role === 'instructor') {
            navigate('/teacher/dashboard', { replace: true });
          } else if (user.role === 'student') {
            navigate('/student/dashboard', { replace: true });
          }
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/', { replace: true });
        return;
      }
    }

    void fetchUsers(1, false);
  }, [navigate, fetchUsers]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore) {
          void fetchUsers(page + 1, true);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchUsers, hasMore, loadingMore, page]);

  // Delete user
  const handleDeleteUser = async (userId) => {
    console.log('Delete user with ID:', userId);
    
    if (!userId) {
      console.error('No user ID provided');
      alert(t('adminUsers.deleteNoId'));
      return;
    }

    if (!window.confirm(t('adminUsers.deleteConfirm'))) {
      return;
    }

    try {
      const token = localStorage.getItem('token'); // FIXED: Changed from 'access_token' to 'token'
      
      console.log(`Sending DELETE request to: ${API_URL}/users/${userId}`);
      
      const response = await axios.delete(`${API_URL}/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Delete response:', response.data);
      
      // Remove the user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      alert(t('adminUsers.deleteSuccess'));
      
    } catch (error) {
      console.error('Error deleting user:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        alert(t('adminUsers.deleteFailed', { message: error.response?.data?.message || error.message }));
      }
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (userId, currentStatus) => {
    console.log('Toggle status for user ID:', userId, 'Current status:', currentStatus);
    
    if (!userId) {
      console.error('No user ID provided');
      alert(t('adminUsers.updateNoId'));
      return;
    }

    setTogglingId(userId);
    
    try {
      const token = localStorage.getItem('token'); // FIXED: Changed from 'access_token' to 'token'
      
      console.log(`Sending PATCH request to: ${API_URL}/users/${userId}`);
      console.log('Request body:', { isActive: !currentStatus });
      
      const response = await axios.patch(`${API_URL}/users/${userId}`, 
        { isActive: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Toggle response:', response.data);

      // Update the user in the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                isActive: !currentStatus,
                status: !currentStatus ? 'active' : 'inactive'
              } 
            : user
        )
      );
      
    } catch (error) {
      console.error('Error updating user status:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        alert(t('adminUsers.updateFailed', { message: error.response?.data?.message || error.message }));
      }
      
      // Refresh the users list
      fetchUsers();
    } finally {
      setTogglingId(null);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const sortedUsers = [...filteredUsers]
    .filter(user => user.role !== 'admin')
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
      if (sortKey === 'email') return a.email.localeCompare(b.email) * dir;
      if (sortKey === 'role') return a.role.localeCompare(b.role) * dir;
      if (sortKey === 'joined') {
        const aDate = new Date(a.joined || 0).getTime();
        const bDate = new Date(b.joined || 0).getTime();
        return (aDate - bDate) * dir;
      }
      return 0;
    });

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIcon = (key) => {
    if (sortKey !== key) return '↕';
    return sortDir === 'asc' ? '▲' : '▼';
  };

  const totalUsers = totalCount ?? users.length;
  const activeUsers = users.filter((user) => user.isActive).length;

  // Generate a temporary password (8 characters)
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Handle Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddError('');

    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.gender || !newUser.role) {
      setAddError(t('adminUsers.requiredFields'));
      return;
    }

    // Generate password if not provided
    const password = newUser.password || generatePassword();

    setAddingUser(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_URL}/users`, {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        gender: newUser.gender,
        role: newUser.role,
        password: password,
        isActive: newUser.isActive
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Add user response:', response.data);
      
      // Reset form
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        gender: '',
        role: 'student',
        password: '',
        isActive: true
      });
      
      // Close modal and refresh list
      setShowAddModal(false);
      fetchUsers();
      
      alert(t('adminUsers.userCreated', { password }));
      
    } catch (error) {
      console.error('Error adding user:', error);
      setAddError(error.response?.data?.message || error.message || t('adminUsers.createFailed'));
    } finally {
      setAddingUser(false);
    }
  };

  // Get badge class based on role
  const getRoleBadgeClass = (role) => {
    switch (role.toLowerCase()) {
      case 'admin': return styles.cyan;
      case 'instructor': return styles.green;
      default: return styles.purple;
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <style>{usersPageStyles}</style>
        <div className="au-root">
          <AdminSidebar />
          <div className="au-main">
            <TopNavbar />
            <div className="au-content">
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <div className={styles.spinner} />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{usersPageStyles}</style>
      <div className="au-root">
        <AdminSidebar />
        <div className="au-main">
          <TopNavbar />
          <div className="au-content">
            <div className="au-hero">
              <div>
                <div className="au-hero-kicker">{t('adminUsers.heroKicker')}</div>
                <h1 className="au-hero-title">{t('adminUsers.heroTitle')}</h1>
                <p className="au-hero-sub">
                  {t('adminUsers.heroSubtitle')}
                </p>
              </div>
              <div className="au-hero-icon">
                <UsersIcon size={36} strokeWidth={1.5} />
              </div>
            </div>

            <div className="au-header">
              <div>
                <h2 className="au-section-title">{t('adminUsers.sectionTitle')}</h2>
                <p className="au-section-sub">{t('adminUsers.sectionSub')}</p>
              </div>
              <div className="au-stats-row">
                <div className="au-mini-stat">
                  <div className="au-mini-icon"><UsersIcon size={16} color="var(--primary)" /></div>
                  <div>
                    <div className="au-mini-num">{totalUsers}</div>
                      <div className="au-mini-label">{t('adminUsers.totalLabel')}</div>
                  </div>
                </div>
                <div className="au-mini-stat">
                  <div className="au-mini-icon"><TrendingUp size={16} color="var(--green)" /></div>
                  <div>
                    <div className="au-mini-num">{activeUsers}</div>
                      <div className="au-mini-label">{t('adminUsers.activeLabel')}</div>
                  </div>
                </div>
              </div>
              <button
                className="au-primary-btn"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={18} />
                {t('adminUsers.addUser')}
              </button>
            </div>

            {error && (
              <div className="au-alert">
                <span>{error}</span>
                <button className="au-alert-btn" onClick={fetchUsers}>
                  {t('adminUsers.retry')}
                </button>
              </div>
            )}

            <div className="au-controls">
              <div className="au-controls-row">
                <div className="au-search">
                  <Search size={18} className="au-search-icon" />
                  <input
                    type="text"
                    placeholder={t('adminUsers.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="au-search-input"
                  />
                </div>
              </div>
            </div>

            <div className="au-table-card">
              <table className="au-table">
                <thead>
                  <tr>
                    <th>
                      <button
                        type="button"
                        onClick={() => toggleSort('name')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
                      >
                        {t('adminUsers.columnUser')} {sortIcon('name')}
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        onClick={() => toggleSort('email')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
                      >
                        {t('adminUsers.columnEmail')} {sortIcon('email')}
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        onClick={() => toggleSort('role')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
                      >
                        {t('adminUsers.columnRole')} {sortIcon('role')}
                      </button>
                    </th>
                    <th>{t('adminUsers.columnStatus')}</th>
                    <th>
                      <button
                        type="button"
                        onClick={() => toggleSort('joined')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
                      >
                        {t('adminUsers.columnJoined')} {sortIcon('joined')}
                      </button>
                    </th>
                    <th>{t('adminUsers.columnActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.length > 0 ? (
                    sortedUsers.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="au-user-cell">
                            <img
                              src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name || 'user')}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
                              alt={user.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                objectFit: 'cover',
                              }}
                            />
                            <span className="au-user-name">{user.name}</span>
                          </div>
                        </td>
                        <td className="au-muted">{user.email}</td>
                        <td>
                          <span className={`${styles.badge} ${getRoleBadgeClass(user.role)}`}>
                            {t(`roles.${user.role}`)}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${user.isActive ? styles.success : styles.warning}`}>
                            {t(`status.${user.status}`)}
                          </span>
                        </td>
                        <td className="au-muted">{user.joined}</td>
                        <td>
                          <div className="au-actions">
                            <button
                              className="au-action-btn"
                              title={user.isActive ? t('adminUsers.deactivateUser') : t('adminUsers.activateUser')}
                              onClick={() => handleToggleStatus(user.id, user.isActive)}
                              disabled={togglingId === user.id}
                              style={{
                                backgroundColor: user.isActive
                                  ? 'rgba(34, 197, 94, 0.1)'
                                  : 'rgba(249, 115, 22, 0.1)',
                                color: user.isActive ? 'var(--green)' : 'var(--orange)',
                                border: '1px solid',
                                borderColor: user.isActive
                                  ? 'rgba(34, 197, 94, 0.2)'
                                  : 'rgba(249, 115, 22, 0.2)',
                                opacity: togglingId === user.id ? 0.7 : 1,
                                cursor: togglingId === user.id ? 'wait' : 'pointer'
                              }}
                            >
                              {togglingId === user.id ? (
                                <span style={{
                                  display: 'inline-block',
                                  width: '16px',
                                  height: '16px',
                                  border: '2px solid currentColor',
                                  borderTopColor: 'transparent',
                                  borderRadius: '50%',
                                  animation: 'spin 0.8s linear infinite'
                                }} />
                              ) : user.isActive ? (
                                <PowerOff size={16} />
                              ) : (
                                <Power size={16} />
                              )}
                            </button>

                            {user.role !== 'Admin' && (
                              <button
                                className="au-action-btn"
                                title={t('adminUsers.deleteUser')}
                                onClick={() => handleDeleteUser(user.id)}
                                style={{ color: '#ef4444' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="au-empty">
                        {t('adminUsers.noUsers')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div ref={loadMoreRef} style={{ height: 1 }} />
            {loadingMore && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {t('adminUsers.loadingMore')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 15, 26, 0.6)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-card-solid)',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>{t('adminUsers.addModalTitle')}</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddError('');
                  setNewUser({
                    firstName: '',
                    lastName: '',
                    email: '',
                    gender: '',
                    role: 'student',
                    password: '',
                    isActive: true
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={20} color="var(--text-muted)" />
              </button>
            </div>

            {addError && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#ef4444',
                fontSize: '0.875rem'
              }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-secondary)'
                }}>
                  {t('adminUsers.firstName')} *
                </label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-card-solid)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-secondary)'
                }}>
                  {t('adminUsers.lastName')} *
                </label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-card-solid)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-secondary)'
                }}>
                  {t('adminUsers.email')} *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-card-solid)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-secondary)'
                }}>
                  {t('adminUsers.gender')} *
                </label>
                <select
                  value={newUser.gender}
                  onChange={(e) => setNewUser({ ...newUser, gender: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-card-solid)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="" disabled>{t('adminUsers.genderSelect')}</option>
                  <option value="female">{t('adminUsers.genderFemale')}</option>
                  <option value="male">{t('adminUsers.genderMale')}</option>
                  <option value="non-binary">{t('adminUsers.genderNonBinary')}</option>
                  <option value="prefer-not-to-say">{t('adminUsers.genderPreferNot')}</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-secondary)'
                }}>
                  {t('adminUsers.role')} *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-card-solid)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="student">{t('adminUsers.roleStudent')}</option>
                  <option value="instructor">{t('adminUsers.roleInstructor')}</option>
                  <option value="admin">{t('adminUsers.roleAdmin')}</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: 'var(--text-secondary)'
                }}>
                  {t('adminUsers.passwordLabel')}
                </label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder={t('adminUsers.passwordPlaceholder')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'var(--bg-card-solid)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setNewUser({ ...newUser, password: generatePassword() })}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {t('adminUsers.generatePassword')}
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}>
                  <input
                    type="checkbox"
                    checked={newUser.isActive}
                    onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>{t('adminUsers.accountActive')}</span>
                </label>
              </div>
              <div style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setAddError('');
                    setNewUser({
                      firstName: '',
                      lastName: '',
                      email: '',
                      gender: '',
                      role: 'student',
                      password: '',
                      isActive: true
                    });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {t('adminUsers.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: addingUser ? '#9ca3af' : 'var(--primary)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: addingUser ? 'not-allowed' : 'pointer',
                    color: 'white'
                  }}
                >
                  {addingUser ? t('adminUsers.creating') : t('adminUsers.createUser')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Users;