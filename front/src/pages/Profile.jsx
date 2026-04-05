import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, Edit3, Camera, Save, X } from 'lucide-react';
import styles from '../styles/shared.module.css';
import StudentSidebar from '../components/StudentSidebar';
import TeacherSidebar from '../components/TeacherSidebar';
import AdminSidebar from '../components/AdminSidebar';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    avatar: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.id) {
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        avatar: userData.avatar || ''
      });
    } else {
      navigate('/');
    }
    setLoading(false);
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/users/profile/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Update localStorage with new user data
        const updatedUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setSuccess('Profile updated successfully!');
        setEditing(false);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to connect to server');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/users/profile/${user.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        // Update localStorage with new avatar
        const updatedUser = { ...user, avatar: data.avatar };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setFormData(prev => ({ ...prev, avatar: data.avatar }));
        setSuccess('Avatar updated successfully!');
      } else {
        setError(data.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError('Failed to upload avatar');
    }
  };

  // Get the appropriate sidebar based on user role
  const getSidebar = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'student':
        return <StudentSidebar />;
      case 'instructor':
        return <TeacherSidebar />;
      case 'admin':
        return <AdminSidebar />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        {getSidebar()}
        <div className={styles.mainContent}>
          <div className={styles.content}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', color: 'var(--text-secondary)' }}>
              Loading profile...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      {getSidebar()}
      <div className={styles.mainContent}>
        <div className={styles.content}>
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div>
              <h1 className={styles.pageTitle}>Profile Settings</h1>
              <p className={styles.pageSubtitle}>Manage your personal information and preferences</p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              style={{
                padding: '0.6rem 1.4rem',
                background: editing ? 'var(--bg-secondary)' : 'linear-gradient(135deg, #E31837, #B71C1C)',
                border: editing ? '1px solid var(--border-primary)' : 'none',
                borderRadius: '12px',
                color: editing ? 'var(--text-primary)' : '#fff',
                fontWeight: '600',
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.3s ease',
                boxShadow: editing ? 'none' : '0 4px 20px rgba(227,24,55,0.3)',
              }}
            >
              {editing ? <X size={16} /> : <Edit3 size={16} />}
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
            }}>
              {success}
            </div>
          )}

          {/* Profile Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
            {/* Avatar & User Info Card */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '24px',
              padding: '2rem',
              border: '1px solid var(--border-primary)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative gradient overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '120px',
                background: 'linear-gradient(135deg, #E31837, #B71C1C)',
                borderRadius: '24px 24px 0 0',
              }} />
              
              {/* Avatar Section */}
              <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
                  <img 
                    src={formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent((formData.firstName + ' ' + formData.lastName) || 'user')}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                    alt="Profile" 
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid var(--bg-secondary)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}
                  />
                  {editing && (
                    <label style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      background: 'linear-gradient(135deg, #E31837, #B71C1C)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: '3px solid var(--bg-secondary)',
                      boxShadow: '0 4px 12px rgba(227,24,55,0.4)',
                    }}>
                      <Camera size={18} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
                
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{ 
                    color: 'var(--text-primary)', 
                    fontSize: '1.4rem', 
                    fontWeight: '700',
                    marginBottom: '0.5rem',
                    letterSpacing: '-0.02em',
                  }}>
                    {formData.firstName} {formData.lastName}
                  </h3>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '0.95rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}>
                    <Mail size={14} />
                    {formData.email}
                  </p>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.5rem 1.2rem',
                    background: 'rgba(227, 24, 55, 0.1)',
                    color: '#E31837',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '1px solid rgba(227, 24, 55, 0.2)',
                  }}>
                    {user?.role || 'User'}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                padding: '1.5rem 0',
                borderTop: '1px solid var(--border-primary)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem' 
                  }}>
                    {new Date().getFullYear() - new Date(user?.createdAt || '2024-01-01').getFullYear()}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    fontWeight: '500' 
                  }}>
                    Years Active
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem' 
                  }}>
                    {formData.phone ? '✓' : '—'}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    fontWeight: '500' 
                  }}>
                    Phone Set
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '24px',
              padding: '2.5rem',
              border: '1px solid var(--border-primary)',
            }}>
              {/* Form Header */}
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{
                  color: 'var(--text-primary)',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  letterSpacing: '-0.02em',
                }}>
                  Personal Information
                </h2>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                }}>
                  {editing ? 'Edit your personal details below' : 'View and manage your profile information'}
                </p>
              </div>

              {/* Form Sections */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Basic Information Section */}
                <div>
                  <h3 style={{
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <div style={{
                      width: '4px',
                      height: '20px',
                      background: 'linear-gradient(135deg, #E31837, #B71C1C)',
                      borderRadius: '2px',
                    }} />
                    Basic Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    {/* First Name */}
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: 'var(--text-primary)', 
                        fontSize: '0.9rem', 
                        fontWeight: '500',
                        marginBottom: '0.5rem' 
                      }}>
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="Enter your first name"
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          background: editing ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
                          border: editing ? '2px solid #E31837' : '2px solid var(--border-primary)',
                          borderRadius: '12px',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease',
                          opacity: editing ? 1 : 0.7,
                          cursor: editing ? 'text' : 'not-allowed',
                          boxShadow: editing ? '0 0 0 3px rgba(227, 24, 55, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </div>

                    {/* Last Name */}
                    <div>
                      <label style={{ 
                        display: 'block', 
                        color: 'var(--text-primary)', 
                        fontSize: '0.9rem', 
                        fontWeight: '500',
                        marginBottom: '0.5rem' 
                      }}>
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="Enter your last name"
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          background: editing ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
                          border: editing ? '2px solid #E31837' : '2px solid var(--border-primary)',
                          borderRadius: '12px',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease',
                          opacity: editing ? 1 : 0.7,
                          cursor: editing ? 'text' : 'not-allowed',
                          boxShadow: editing ? '0 0 0 3px rgba(227, 24, 55, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div>
                  <h3 style={{
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <div style={{
                      width: '4px',
                      height: '20px',
                      background: 'linear-gradient(135deg, #E31837, #B71C1C)',
                      borderRadius: '2px',
                    }} />
                    Contact Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                    {/* Email */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-primary)', 
                        fontSize: '0.9rem', 
                        fontWeight: '500',
                        marginBottom: '0.5rem',
                      }}>
                        <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="Enter your email"
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          background: editing ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
                          border: editing ? '2px solid #E31837' : '2px solid var(--border-primary)',
                          borderRadius: '12px',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease',
                          opacity: editing ? 1 : 0.7,
                          cursor: editing ? 'text' : 'not-allowed',
                          boxShadow: editing ? '0 0 0 3px rgba(227, 24, 55, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </div>

                    {/* Phone */}
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-primary)', 
                        fontSize: '0.9rem', 
                        fontWeight: '500',
                        marginBottom: '0.5rem',
                      }}>
                        <Phone size={16} style={{ color: 'var(--text-secondary)' }} />
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!editing}
                        placeholder="Enter your phone number"
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem',
                          background: editing ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
                          border: editing ? '2px solid #E31837' : '2px solid var(--border-primary)',
                          borderRadius: '12px',
                          color: 'var(--text-primary)',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease',
                          opacity: editing ? 1 : 0.7,
                          cursor: editing ? 'text' : 'not-allowed',
                          boxShadow: editing ? '0 0 0 3px rgba(227, 24, 55, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div>
                  <h3 style={{
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}>
                    <div style={{
                      width: '4px',
                      height: '20px',
                      background: 'linear-gradient(135deg, #E31837, #B71C1C)',
                      borderRadius: '2px',
                    }} />
                    About Me
                  </h3>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!editing}
                    placeholder="Tell us about yourself, your interests, and what you're passionate about..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      background: editing ? 'var(--bg-tertiary)' : 'var(--bg-tertiary)',
                      border: editing ? '2px solid #E31837' : '2px solid var(--border-primary)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      transition: 'all 0.3s ease',
                      opacity: editing ? 1 : 0.7,
                      cursor: editing ? 'text' : 'not-allowed',
                          boxShadow: editing ? '0 0 0 3px rgba(227, 24, 55, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                      lineHeight: '1.5',
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {editing && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '1rem',
                  marginTop: '2.5rem',
                  paddingTop: '2rem',
                  borderTop: '1px solid var(--border-primary)',
                }}>
                  <button
                    onClick={() => setEditing(false)}
                    style={{
                      padding: '0.875rem 2rem',
                      background: 'var(--bg-tertiary)',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: '0.875rem 2rem',
                      background: saving ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, #E31837, #B71C1C)',
                      border: 'none',
                      borderRadius: '12px',
                      color: saving ? 'var(--text-secondary)' : '#fff',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: saving ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease',
                      boxShadow: saving ? 'none' : '0 4px 20px rgba(227,24,55,0.3)',
                    }}
                  >
                    {saving ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid var(--text-secondary)',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
