import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../../components/AdminSidebar';
import { Search, Plus, Edit2, Trash2, Filter, Power, PowerOff, X, User, Mail, Lock } from 'lucide-react';
import axios from 'axios';
import styles from '../../styles/shared.module.css';
import studentsStyles from '../teacher/Students.module.css';

const API_URL = 'http://localhost:3000';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  
  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'student',
    password: '',
    isActive: true
  });
  const [addingUser, setAddingUser] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // FIXED: Changed from 'access_token' to 'token'
      
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('Raw users from backend:', response.data);

      // Transform the data to match your frontend format
      const formattedUsers = response.data.map(user => ({
        id: user._id || user.id,
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        avatar: user.avatar,
        role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        isActive: user.isActive,
        status: user.isActive ? 'Active' : 'Inactive',
        joined: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        }) : 'N/A'
      }));

      console.log('Formatted users:', formattedUsers);
      setUsers(formattedUsers);
      setError('');
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

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

    void fetchUsers();
  }, [navigate, fetchUsers]);

  // Delete user
  const handleDeleteUser = async (userId) => {
    console.log('Delete user with ID:', userId);
    
    if (!userId) {
      console.error('No user ID provided');
      alert('Cannot delete user: No ID provided');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
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
      
      alert('User deleted successfully');
      
    } catch (error) {
      console.error('Error deleting user:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        alert(`Failed to delete user: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (userId, currentStatus) => {
    console.log('Toggle status for user ID:', userId, 'Current status:', currentStatus);
    
    if (!userId) {
      console.error('No user ID provided');
      alert('Cannot update user: No ID provided');
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
                status: !currentStatus ? 'Active' : 'Inactive'
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
        alert(`Failed to update user status: ${error.response?.data?.message || error.message}`);
      }
      
      // Refresh the users list
      fetchUsers();
    } finally {
      setTogglingId(null);
    }
  };

  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role.toLowerCase() === roleFilter;
    return matchesSearch && matchesRole;
  });

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

    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.role) {
      setAddError('All fields are required');
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
        role: 'student',
        password: '',
        isActive: true
      });
      
      // Close modal and refresh list
      setShowAddModal(false);
      fetchUsers();
      
      alert(`User created successfully! Password: ${password}\n\nPlease share this password with the user.`);
      
    } catch (error) {
      console.error('Error adding user:', error);
      setAddError(error.response?.data?.message || error.message || 'Failed to create user');
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
      <div className={styles.layout}>
        <AdminSidebar />
        <div className={styles.mainContent}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <div className={styles.spinner} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <AdminSidebar />
      <div className={styles.mainContent}>
        <main className={styles.content}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>User Management</h1>
              <p className={styles.pageSubtitle}>Manage all platform users</p>
            </div>
            <button 
              className={styles.primaryButton}
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={18} />
              Add User
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              color: '#dc2626',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>{error}</span>
              <button 
                onClick={fetchUsers}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Filters */}
          <div className={studentsStyles.filters}>
            <div className={studentsStyles.searchBox}>
              <Search size={18} className={studentsStyles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={studentsStyles.searchInput}
              />
            </div>
            
            <div className={studentsStyles.filterGroup}>
              <Filter size={18} />
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className={studentsStyles.filterSelect}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="instructor">Instructors</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className={styles.card}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers
                    .filter(user => user.role !== 'Admin') // Hide admin users
                    .map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                            <span style={{ fontWeight: '500' }}>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ color: '#64748b' }}>{user.email}</td>
                        <td>
                          <span className={`${styles.badge} ${getRoleBadgeClass(user.role)}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${user.isActive ? styles.success : styles.warning}`}>
                            {user.status}
                          </span>
                        </td>
                        <td style={{ color: '#64748b' }}>{user.joined}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {/* Toggle Active/Inactive Button */}
                            <button 
                              className={studentsStyles.actionBtn}
                              title={user.isActive ? 'Deactivate User' : 'Activate User'}
                              onClick={() => handleToggleStatus(user.id, user.isActive)}
                              disabled={togglingId === user.id}
                              style={{
                                backgroundColor: user.isActive 
                                  ? 'rgba(34, 197, 94, 0.1)' 
                                  : 'rgba(249, 115, 22, 0.1)',
                                color: user.isActive ? '#22c55e' : '#f97316',
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


                            {/* Delete Button - Hidden for admin users */}
                            {user.role !== 'Admin' && (
                              <button 
                                className={studentsStyles.actionBtn} 
                                title="Delete User"
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
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Add New User</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setAddError('');
                  setNewUser({
                    firstName: '',
                    lastName: '',
                    email: '',
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
                <X size={20} color="#64748b" />
              </button>
            </div>

            {addError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
                color: '#dc2626',
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
                  color: '#374151'
                }}>
                  First Name *
                </label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Last Name *
                </label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Password (leave empty to auto-generate)
                </label>
                <input
                  type="text"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Auto-generate if empty"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setNewUser({ ...newUser, password: generatePassword() })}
                  style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Generate Password
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={newUser.isActive}
                    onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Account Active</span>
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
                      role: 'student',
                      password: '',
                      isActive: true
                    });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: addingUser ? '#9ca3af' : '#E31837',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: addingUser ? 'not-allowed' : 'pointer',
                    color: 'white'
                  }}
                >
                  {addingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;